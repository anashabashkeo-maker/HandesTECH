using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;

namespace HandesTECH;

public sealed class AdminAccess(IConfiguration config, IWebHostEnvironment env)
{
    private readonly object gate = new();
    private string? createdHash;
    public string? PasswordHash => config["Admin:PasswordHash"] ?? createdHash;
    public bool Configured => !string.IsNullOrWhiteSpace(PasswordHash);
    public bool CanSetup(HttpContext context) => !Configured && env.IsDevelopment()
        && context.Connection.RemoteIpAddress is { } address && IPAddress.IsLoopback(address)
        && (context.Request.Host.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
            || IPAddress.TryParse(context.Request.Host.Host.Trim('[', ']'), out var host) && IPAddress.IsLoopback(host));
    public void Setup(string password, HttpContext context)
    {
        lock (gate)
        {
            if (!CanSetup(context)) throw new AcademyException("Administrator setup is available only on this computer before the first account is created.", 403);
            if (password.Length < 16 || password.Length > 256) throw new AcademyException("Choose a password between 16 and 256 characters.");
            var directory = Path.GetFullPath(config["Academy:DataDirectory"] ?? Path.Combine(env.ContentRootPath, "App_Data"));
            Directory.CreateDirectory(directory);
            var file = Path.Combine(directory, "settings.json");
            var settings = File.Exists(file) ? JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(File.ReadAllText(file))! : [];
            var passwordHash = new PasswordHasher<string>().HashPassword("admin", password);
            settings["Admin"] = JsonSerializer.SerializeToElement(new { PasswordHash = passwordHash });
            var temporary = file + ".tmp";
            File.WriteAllText(temporary, JsonSerializer.Serialize(settings, new JsonSerializerOptions { WriteIndented = true }));
            File.Move(temporary, file, true);
            createdHash = passwordHash;
            if (config is IConfigurationRoot root) root.Reload();
        }
    }
}
