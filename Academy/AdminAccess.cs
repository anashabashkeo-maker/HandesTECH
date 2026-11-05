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
        && context.Connection.RemoteIpAddress is { } address && IPAddress.IsLoopback(address);
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
            createdHash = new PasswordHasher<string>().HashPassword("admin", password);
            settings["Admin"] = JsonSerializer.SerializeToElement(new { PasswordHash = createdHash });
            var temporary = file + ".tmp";
            File.WriteAllText(temporary, JsonSerializer.Serialize(settings, new JsonSerializerOptions { WriteIndented = true }));
            File.Move(temporary, file, true);
            if (config is IConfigurationRoot root) root.Reload();
        }
    }
}
