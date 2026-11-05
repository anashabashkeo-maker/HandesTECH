using System.Net;
using System.Net.Mail;
using System.Text;

namespace HandesTECH;

public sealed class EmailService(IConfiguration config, IWebHostEnvironment env)
{
    public const string Owner = "anas.habash98@gmail.com";
    private bool Pickup => env.IsDevelopment() && !string.IsNullOrWhiteSpace(config["Email:DevelopmentPickupDirectory"]);
    public bool Configured => Pickup || (!string.IsNullOrWhiteSpace(config["Email:Host"]) && !string.IsNullOrWhiteSpace(config["Email:From"]));
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
        await smtp.SendMailAsync(message);
    }
    public Task SendReport(AssessmentReport r)
    {
        var b = new StringBuilder($"HandesTECH assessment {r.Id}\nParticipant: {r.Email}\nDiscipline: {r.DisciplineId}\nDate (UTC): {r.CreatedAt:u}\n\n");
        foreach (var p in r.Paths)
        {
            b.AppendLine($"{p.Name}: {p.Score}% ({p.Correct}/{p.Total})");
            b.AppendLine(string.Join(" | ", p.DifficultyScores.Select(x => $"{x.Key}: {x.Value}%")));
            b.AppendLine(p.Advice);
            foreach (var c in p.Courses) b.AppendLine($"Recommended outline: {c.Title} ({c.Level})");
            b.AppendLine();
        }
        b.AppendLine("This short diagnostic guides learning; it is not a qualification or proof of professional competence.");
        return Send(Owner, "HandesTECH assessment — " + r.DisciplineId + " — " + r.Id, b.ToString());
    }
}
public sealed class ReportMailer(AcademyStore store, EmailService email, ILogger<ReportMailer> logger) : BackgroundService
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
                        logger.LogWarning("Assessment report delivery failed ({Type}); retry remains in private outbox.", ex.GetType().Name);
                        store.Change(d => { var r = d.Reports.Single(x => x.Id == report.Id); if (r.DeliveryAttempts >= 5) r.Delivery = "failed"; });
                    }
                }
            }
            catch (Exception ex) { logger.LogError("Assessment outbox error ({Type}).", ex.GetType().Name); }
            await Task.Delay(TimeSpan.FromSeconds(15), token);
        }
    }
}
