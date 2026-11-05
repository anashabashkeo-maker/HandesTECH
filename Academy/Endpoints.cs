using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;

namespace HandesTECH;

public static class Endpoints
{
    public static void MapAcademy(this WebApplication app)
    {
        var api = app.MapGroup("/api").RequireRateLimiting("public");
        api.AddEndpointFilter(async (context, next) =>
        {
            if (context.HttpContext.Request.Method != "GET")
                await context.HttpContext.RequestServices.GetRequiredService<IAntiforgery>().ValidateRequestAsync(context.HttpContext);
            return await next(context);
        });
        api.MapGet("/admin/setup", (AdminAccess access, HttpContext ctx) => new { configured = access.Configured, canSetup = access.CanSetup(ctx) });
        api.MapPost("/admin/setup", (SetupRequest input, AdminAccess access, HttpContext ctx) =>
        {
            access.Setup(input.Password ?? "", ctx); return Results.Ok(new { configured = true });
        }).RequireRateLimiting("sensitive");
        api.MapGet("/csrf", (HttpContext ctx, IAntiforgery csrf) => new { token = csrf.GetAndStoreTokens(ctx).RequestToken });
        api.MapGet("/catalog", (AcademyStore store, AssessmentService service, IConfiguration config, HttpContext ctx) =>
        {
            var d = store.Read();
            return new { d.Disciplines, paths = d.Paths.Where(p => p.Published), courses = PublishedCourses(d),
                assessments = d.Disciplines.Select(x => new { disciplineId = x.Id,
                    mode = d.AssessmentModes.GetValueOrDefault(x.Id, "coming-soon") == "enabled" && (!AcademyStore.Ready(d, x.Id) || !service.Available(ctx))
                        ? "coming-soon" : d.AssessmentModes.GetValueOrDefault(x.Id, "coming-soon") }),
                turnstileSiteKey = service.BotConfigured ? config["Turnstile:SiteKey"] : null, localTesting = service.LocalTesting(ctx) };
        });
        // Existing course pages and search now read the live catalogue from the same source.
        app.MapGet("/assets/academy-config.json", (HttpContext ctx) => { ctx.Response.Headers.CacheControl = "no-store"; return new { enabled = true }; });
        app.MapGet("/assets/course-data.json", (AcademyStore store, HttpContext ctx) =>
        {
            ctx.Response.Headers.CacheControl = "no-store"; var d = store.Read();
            return d.Disciplines.Select(x => new { slug = x.Id, x.Name, x.Image, courses = PublishedCourses(d).Where(c => c.DisciplineId == x.Id)
                .Select(c => new { c.Id, c.Title, c.Level, c.Scope, c.Topics, path = d.Paths.Single(p => p.Id == c.PathId).Kind, c.PathId, c.Applications, c.ParentId }) });
        });
        api.MapPost("/assessment/guest", async (GuestRequest input, AssessmentService service, HttpContext ctx) =>
        {
            if (!input.Consent) throw new AcademyException("Agree to share your assessment result privately with HandesTECH before starting.");
            if (string.IsNullOrWhiteSpace(input.DisciplineId)) throw new AcademyException("Choose a discipline.");
            var existing = ctx.Request.Cookies["HandesTECH.Visitor"];
            if (existing != null)
            {
                try { return Results.Ok(service.Start(existing, input.DisciplineId, ctx)); }
                catch (AcademyException e) when (e.Status == 401) { }
            }
            var id = await service.CreateGuest(ctx, input.BotToken ?? "");
            var exam = service.Start(id, input.DisciplineId, ctx);
            ctx.Response.Cookies.Append("HandesTECH.Visitor", id, new CookieOptions { HttpOnly = true, Secure = !app.Environment.IsDevelopment(), SameSite = SameSiteMode.Strict, MaxAge = TimeSpan.FromHours(2), Path = "/api/assessment" });
            return Results.Ok(exam);
        }).RequireRateLimiting("sensitive");
        api.MapGet("/assessment/session", (AssessmentService service, HttpContext ctx) => service.Session(ctx.Request.Cookies["HandesTECH.Visitor"]));
        api.MapPost("/assessment/start", (StartRequest input, AssessmentService service, HttpContext ctx) =>
        {
            if (string.IsNullOrWhiteSpace(input.DisciplineId)) throw new AcademyException("Choose a discipline.");
            return service.Start(ctx.Request.Cookies["HandesTECH.Visitor"], input.DisciplineId, ctx);
        });
        api.MapPost("/assessment/submit", (SubmitRequest input, AssessmentService service, HttpContext ctx) =>
        {
            if (input.Answers == null) throw new AcademyException("Answer all questions.");
            return service.Submit(ctx.Request.Cookies["HandesTECH.Visitor"], input.Answers);
        });
        api.MapPost("/admin/login", async (LoginRequest input, AdminAccess access, HttpContext ctx) =>
        {
            var hash = access.PasswordHash;
            if (string.IsNullOrWhiteSpace(hash)) throw new AcademyException("Set up an administrator password on the server first.", 503);
            if (input.Password == null || input.Password.Length > 1024
                || new PasswordHasher<string>().VerifyHashedPassword("admin", hash, input.Password) == PasswordVerificationResult.Failed)
                throw new AcademyException("Incorrect administrator password.", 401);
            await ctx.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "admin"), new Claim(ClaimTypes.Role, "admin")], CookieAuthenticationDefaults.AuthenticationScheme)));
            return Results.Ok(new { signedIn = true });
        }).RequireRateLimiting("sensitive");
        var admin = api.MapGroup("/admin").RequireAuthorization();
        admin.MapPost("/logout", async (HttpContext ctx) => { await ctx.SignOutAsync(); return Results.Ok(); });
        admin.MapGet("/catalog", (AcademyStore store) => { var d = store.Read(); d.Reports = []; return d; });
        admin.MapPut("/catalog", (AcademyData input, AcademyStore store) =>
        {
            try { store.SaveCatalogue(input); }
            catch (NullReferenceException) { throw new AcademyException("Catalogue fields cannot be null."); }
            var d = store.Read(); d.Reports = []; return d;
        });
        admin.MapGet("/status", (AcademyStore store, AssessmentService service, HttpContext ctx) =>
        {
            var d = store.Read();
            return new { botConfigured = service.BotConfigured, localTesting = service.LocalTesting(ctx),
                readiness = d.Disciplines.Select(x => new { id = x.Id, ready = AcademyStore.Ready(d, x.Id) }),
                reports = d.Reports.OrderByDescending(x => x.CreatedAt).Take(100) };
        });
        admin.MapGet("/applications", (IWebHostEnvironment env) => Directory.EnumerateFiles(Path.Combine(env.WebRootPath, "assets"), "app-*.svg").Select(p => Path.GetFileNameWithoutExtension(p)[4..]).OrderBy(x => x));
        api.MapPost("/chat", (ChatRequest input, AcademyStore store) =>
        {
            if (string.IsNullOrWhiteSpace(input.Message) || input.Message.Length > 1000) throw new AcademyException("Ask a question of up to 1,000 characters.");
            var d = store.Read(); var message = input.Message.ToLowerInvariant();
            if (new[] { "exam", "assess", "test", "اختبار", "تقييم" }.Any(message.Contains))
                return Results.Ok(new { reply = "Choose a discipline on the assessment page. Available assessments do not require an email address. Results show a score and learning advice for every path. Results are saved privately in the administration panel. This is learning guidance, not a qualification.", links = new[] { new { title = "Explore assessments", url = "assessment.html" } } });
            var words = message.Split([' ', ',', '.', '?', '!'], StringSplitOptions.RemoveEmptyEntries).Where(w => w.Length > 2
                && !new[] { "the", "and", "for", "can", "you", "what", "how", "want", "learn", "course", "courses", "with", "need" }.Contains(w)).ToArray();
            var selected = PublishedCourses(d).Select(c => new { course = c, score = words.Count(w => (c.Title + " " + c.Scope + " " + d.Disciplines.Single(x => x.Id == c.DisciplineId).Name + " " + d.Paths.Single(p => p.Id == c.PathId).Name).Contains(w, StringComparison.OrdinalIgnoreCase)) })
                .Where(x => x.score > 0).OrderByDescending(x => x.score).Take(4).Select(x => x.course).ToArray();
            return Results.Ok(new { reply = selected.Length > 0 ? "These course outlines match your topic. Review their syllabus and prerequisites. Teaching dates, fees and enrolment availability must be confirmed with the team. You can also take an available discipline assessment for path-by-path guidance."
                : "I’m the HandesTECH course guide. Tell me your discipline or a skill such as Revit, electrical design, HVAC or BIM. Ask about assessments to find out how they work. For fees, dates or engineering design decisions, please contact the team.",
                links = selected.Select(c => new { title = c.Title, url = $"course.html?discipline={Uri.EscapeDataString(c.DisciplineId)}&title={Uri.EscapeDataString(c.Title)}" }) });
        });
    }
    private static IEnumerable<Course> PublishedCourses(AcademyData d) => d.Courses.Where(c => c.Published
        && d.Paths.Any(p => p.Id == c.PathId && p.Published) && AssessmentService.AncestorsPublished(c, d));
    private static string LegacyPath(string path, string discipline) => path.StartsWith(discipline + "-") ? path[(discipline.Length + 1)..] : path;
    public sealed record SetupRequest(string Password);
    public sealed record GuestRequest(string DisciplineId, string? BotToken = null, bool Consent = false);
    public sealed record StartRequest(string DisciplineId);
    public sealed record SubmitRequest(Answer[] Answers);
    public sealed record LoginRequest(string Password);
    public sealed record ChatRequest(string Message);
}
