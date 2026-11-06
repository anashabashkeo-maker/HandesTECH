using HandesTECH;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.DataProtection;

if (args.Contains("--hash-admin-password"))
{
    var password = Console.ReadLine() ?? "";
    if (password.Length < 16) throw new ArgumentException("Use at least 16 characters.");
    Console.WriteLine(new PasswordHasher<string>().HashPassword("admin", password));
    return;
}
var builder = WebApplication.CreateBuilder(args);
var privateDirectory = Path.GetFullPath(builder.Configuration["Academy:DataDirectory"] ?? Path.Combine(builder.Environment.ContentRootPath, "App_Data"));
var webDirectory = Path.GetFullPath(builder.Environment.WebRootPath ?? Path.Combine(builder.Environment.ContentRootPath, "wwwroot")).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
if ((privateDirectory + Path.DirectorySeparatorChar).StartsWith(webDirectory, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Private data must be outside wwwroot.");
builder.Configuration.AddJsonFile(Path.Combine(privateDirectory, "settings.json"), optional: true, reloadOnChange: true).AddEnvironmentVariables();
builder.Services.AddSingleton<AdminAccess>();
var protection = builder.Services.AddDataProtection().SetApplicationName("HandesTECH").PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(privateDirectory, "keys")));
if (OperatingSystem.IsWindows()) protection.ProtectKeysWithDpapi();
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 2_000_000);
builder.Services.AddSingleton<AcademyStore>();
builder.Services.AddSingleton<AssessmentService>();
builder.Services.AddSingleton<AiCourseGuide>();
builder.Services.AddHttpClient("course-ai", client => client.Timeout = TimeSpan.FromSeconds(30));
var aiOrigins = builder.Configuration.GetSection("ChatAI:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy("course-ai", policy => policy.WithOrigins(aiOrigins).WithMethods("GET", "POST").WithHeaders("Content-Type")));
builder.Services.AddHttpClient("turnstile", client => client.Timeout = TimeSpan.FromSeconds(15));
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(o =>
{
    o.Cookie.Name = "HandesTECH.Admin";
    o.Cookie.HttpOnly = true;
    o.Cookie.SameSite = SameSiteMode.Strict;
    o.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
    o.ExpireTimeSpan = TimeSpan.FromHours(2);
    o.SlidingExpiration = false;
    o.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = 401; return Task.CompletedTask; };
    o.Events.OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = 403; return Task.CompletedTask; };
});
builder.Services.AddAuthorization();
builder.Services.AddAntiforgery(o => o.HeaderName = "X-CSRF-TOKEN");
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = 429;
    o.AddPolicy("course-ai", ctx => RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = Math.Clamp(builder.Configuration.GetValue("ChatAI:RequestsPerMinute", 6), 1, 30), Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
    o.AddPolicy("public", ctx => RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = Math.Max(1, builder.Configuration.GetValue("Academy:PublicRequestLimit", 30)), Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
    o.AddPolicy("sensitive", ctx => RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = Math.Max(1, builder.Configuration.GetValue("Academy:SensitiveRequestLimit", 6)), Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});
var app = builder.Build();
if (!app.Environment.IsDevelopment()) { app.UseHsts(); app.UseHttpsRedirection(); }
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    if (ctx.Request.Path.StartsWithSegments("/api")) ctx.Response.Headers.CacheControl = "no-store";
    if (ctx.Request.Path.StartsWithSegments("/api/guide"))
    {
        var limit = ctx.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpMaxRequestBodySizeFeature>();
        if (limit is { IsReadOnly: false }) limit.MaxRequestBodySize = 32768;
        if (ctx.Request.ContentLength > 32768) { ctx.Response.StatusCode = 413; return; }
    }
    try { await next(); }
    catch (AcademyException e) { ctx.Response.StatusCode = e.Status; await ctx.Response.WriteAsJsonAsync(new { error = e.Message }); }
    catch (AntiforgeryValidationException) { ctx.Response.StatusCode = 400; await ctx.Response.WriteAsJsonAsync(new { error = "Refresh this page and try again." }); }
});
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapAcademy();
app.MapGet("/assets/chat-config.json", (AiCourseGuide guide, HttpContext ctx) =>
{
    ctx.Response.Headers.CacheControl = "no-store";
    return new { enabled = guide.Enabled, endpoint = "/api/guide/chat", provider = "OpenAI" };
});
var ai = app.MapGroup("/api/guide").RequireCors("course-ai").RequireRateLimiting("course-ai");
ai.MapGet("/status", (AiCourseGuide guide) => new { enabled = guide.Enabled, provider = "OpenAI" });
ai.MapPost("/chat", async (GuideQuestion input, AiCourseGuide guide, HttpContext ctx) =>
{
    var origin = ctx.Request.Headers.Origin.ToString();
    var sameOrigin = $"{ctx.Request.Scheme}://{ctx.Request.Host}";
    if (origin != sameOrigin && !aiOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase)
        && !(app.Environment.IsDevelopment() && origin.Length == 0 && ctx.Connection.RemoteIpAddress is { } ip && System.Net.IPAddress.IsLoopback(ip)))
        throw new AcademyException("This website is not allowed to use AI guidance.", 403);
    return Results.Ok(await guide.Reply(input, ctx.RequestAborted));
});
app.UseDefaultFiles();
app.UseStaticFiles();
app.Run();
