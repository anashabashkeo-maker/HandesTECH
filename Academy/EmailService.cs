using System.Net;
using System.Net.Mail;
using System.Text;

namespace HandesTECH;

public sealed class EmailService(IConfiguration config, IWebHostEnvironment env)
{
    public string ReportRecipient => config["Assessment:ReportRecipient"] ?? "";
    public bool ReportConfigured => MailAddress.TryCreate(ReportRecipient, out var address) && address.Address == ReportRecipient && address.Host.Contains('.');
    private bool Pickup => env.IsDevelopment() && !string.IsNullOrWhiteSpace(config["Email:DevelopmentPickupDirectory"]);
    public bool Configured => Pickup || (!string.IsNullOrWhiteSpace(config["Email:Host"]) && !string.IsNullOrWhiteSpace(config["Email:From"]) && !string.IsNullOrWhiteSpace(config["Email:Username"]) && !string.IsNullOrWhiteSpace(config["Email:Password"]));
    public async Task Send(string to, string subject, string body)
    {
        if (!Configured) throw new AcademyException("Email delivery is not configured yet.", 503);
        using var message = new MailMessage(config["Email:From"] ?? "noreply@localhost.test", to, subject, body);
        message.BodyEncoding = Encoding.UTF8;
        using var smtp = new SmtpClient();
        if (Pickup)
        {
            var path = Path.GetFullPath(config["Email:DevelopmentPickupDirectory"]!);
            var web = Path.GetFullPath(env.WebRootPath).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
            if ((path + Path.DirectorySeparatorChar).StartsWith(web, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Mail pickup must be private.");
            Directory.CreateDirectory(path); smtp.DeliveryMethod = SmtpDeliveryMethod.SpecifiedPickupDirectory; smtp.PickupDirectoryLocation = path;
        }
        else
        {
            smtp.Host = config["Email:Host"]!; smtp.Port = config.GetValue("Email:Port", 587); smtp.EnableSsl = true;
            smtp.Credentials = new NetworkCredential(config["Email:Username"], config["Email:Password"]);
        }
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(25));
        await smtp.SendMailAsync(message, timeout.Token);
    }
    public Task SendReport(AssessmentReport r)
    {
        var b = new StringBuilder($"HandesTECH assessment {r.Id}\nParticipant: {r.Email}\nDiscipline: {r.DisciplineId}\nDate (UTC): {r.CreatedAt:u}\n\n");
        foreach (var p in r.Paths)
        {
            b.AppendLine($"{p.Name}: {p.Score}% ({p.Correct}/{p.Total})");
            b.AppendLine(string.Join(" | ", p.DifficultyScores.Select(x => $"{x.Key}: {x.Value}%")));
            b.AppendLine("Suggested starting point: " + p.SuggestedLevel);
            b.AppendLine(p.Advice);
            if (p.FocusAreas is { Length: > 0 }) b.AppendLine("Focus areas: " + string.Join("; ", p.FocusAreas));
            foreach (var c in p.Courses) b.AppendLine($"Recommended outline: {c.Title} ({c.Level})");
            b.AppendLine();
        }
        b.AppendLine("This short diagnostic guides learning; it is not a qualification or proof of professional competence.");
        if (!ReportConfigured) throw new AcademyException("Set up the private assessment report recipient first.", 503);
        return Send(ReportRecipient, "HandesTECH assessment — " + r.DisciplineId + " — " + r.Id, b.ToString());
    }
}
public sealed class ReportMailer(AcademyStore store, EmailService email, ILogger<ReportMailer> logger, IConfiguration config, IWebHostEnvironment env) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken token)
    {
        while (!token.IsCancellationRequested)
        {
            try
            {
                foreach (var report in store.Read().Reports.Where(r => r.Delivery == "pending" && r.DeliveryAttempts < 5
                    && (r.LastDeliveryAttempt == null || r.LastDeliveryAttempt < DateTimeOffset.UtcNow.AddMinutes(-2))))
                {
                    if (token.IsCancellationRequested || !email.Configured) break;
                    store.Change(d => { var r = d.Reports.Single(x => x.Id == report.Id); r.DeliveryAttempts++; r.LastDeliveryAttempt = DateTimeOffset.UtcNow; });
                    try
                    {
                        await email.SendReport(report);
                        store.Change(d => d.Reports.Single(x => x.Id == report.Id).Delivery = "sent");
                    }
                    catch (Exception ex)
                    {
                        if (env.IsDevelopment() && config.GetValue<bool>("Academy:LocalTesting")) logger.LogWarning("Local pickup diagnostic: {Stack}", ex.StackTrace);
                        logger.LogWarning("Assessment report delivery failed ({Type}); retry remains in private outbox.", ex.GetType().Name);
                        store.Change(d => { var r = d.Reports.Single(x => x.Id == report.Id); if (r.DeliveryAttempts >= 5) r.Delivery = "failed"; });
                    }
                }
            }
            catch (Exception ex)
            {
                if (env.IsDevelopment() && config.GetValue<bool>("Academy:LocalTesting")) logger.LogWarning("Local outbox diagnostic: {Stack}", ex.StackTrace);
                logger.LogError("Assessment outbox error ({Type}).", ex.GetType().Name);
            }
            await Task.Delay(TimeSpan.FromSeconds(15), token);
        }
    }
}
