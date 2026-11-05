using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace HandesTECH;

public sealed class AssessmentService(AcademyStore store, EmailService email, IConfiguration config,
    IWebHostEnvironment env, IHttpClientFactory clients)
{
    private readonly object gate = new();
    private readonly Dictionary<string, Challenge> challenges = [];
    private readonly Dictionary<string, Visitor> visitors = [];
    private readonly Dictionary<string, DateTimeOffset> emailCooldowns = [];
    private sealed record Challenge(string Email, string Hash, DateTimeOffset Expires) { public int Tries { get; set; } }
    private sealed class Visitor(string email)
    {
        public string Email { get; } = email;
        public DateTimeOffset Expires { get; } = DateTimeOffset.UtcNow.AddHours(2);
        public string? Discipline { get; set; }
        public Question[] Questions { get; set; } = [];
        public AcademyData? Snapshot { get; set; }
        public string? ReportId { get; set; }
    }
    public bool LocalTesting(HttpContext ctx) => env.IsDevelopment() && config.GetValue<bool>("Academy:LocalTesting")
        && ctx.Connection.RemoteIpAddress != null && System.Net.IPAddress.IsLoopback(ctx.Connection.RemoteIpAddress);
    public bool BotConfigured => !string.IsNullOrWhiteSpace(config["Turnstile:SiteKey"]) && !string.IsNullOrWhiteSpace(config["Turnstile:SecretKey"])
        && !string.IsNullOrWhiteSpace(config["Turnstile:Hostname"]);
    public bool Available(HttpContext ctx) => email.Configured && (BotConfigured || LocalTesting(ctx));
    public static string Secret() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
    private static string Hash(string s) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(s)));
    private void Prune()
    {
        foreach (var key in challenges.Where(x => x.Value.Expires < DateTimeOffset.UtcNow).Select(x => x.Key).ToArray()) challenges.Remove(key);
        foreach (var key in visitors.Where(x => x.Value.Expires < DateTimeOffset.UtcNow).Select(x => x.Key).ToArray()) visitors.Remove(key);
        foreach (var key in emailCooldowns.Where(x => x.Value < DateTimeOffset.UtcNow).Select(x => x.Key).ToArray()) emailCooldowns.Remove(key);
        if (challenges.Count + visitors.Count > 5000) throw new AcademyException("Please try again later.", 429);
    }
    public async Task<string> RequestCode(string rawEmail, string token, HttpContext ctx)
    {
        if (!Available(ctx)) throw new AcademyException("Assessments are not available yet.", 503);
        if (rawEmail.Length > 254 || !MailAddress.TryCreate(rawEmail.Trim(), out var address) || address.Address != rawEmail.Trim()
            || !address.Host.Contains('.') || rawEmail.Any(char.IsWhiteSpace)) throw new AcademyException("Enter a valid email address.");
        if (!LocalTesting(ctx))
        {
            using var response = await clients.CreateClient().PostAsync("https://challenges.cloudflare.com/turnstile/v0/siteverify",
                new FormUrlEncodedContent(new Dictionary<string, string> { ["secret"] = config["Turnstile:SecretKey"]!, ["response"] = token }));
            using var result = JsonDocument.Parse(await response.Content.ReadAsStringAsync()); var root = result.RootElement;
            if (!root.TryGetProperty("success", out var ok) || !ok.GetBoolean()
                || !root.TryGetProperty("hostname", out var host) || host.GetString() != config["Turnstile:Hostname"]
                || !root.TryGetProperty("action", out var action) || action.GetString() != "assessment")
                throw new AcademyException("Please complete the bot check again.");
        }
        var normalized = address.Address.ToLowerInvariant(); var key = Hash(normalized);
        var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString(); var id = Secret();
        lock (gate)
        {
            Prune();
            if (emailCooldowns.ContainsKey(key)) throw new AcademyException("Wait one minute before requesting another code.", 429);
            emailCooldowns[key] = DateTimeOffset.UtcNow.AddMinutes(1);
            // A new request invalidates previous challenges for this mailbox.
            foreach (var old in challenges.Where(x => x.Value.Email == normalized).Select(x => x.Key).ToArray()) challenges.Remove(old);
            challenges[id] = new(normalized, Hash(id + code), DateTimeOffset.UtcNow.AddMinutes(10));
        }
        try { await email.Send(normalized, "Your HandesTECH verification code", $"Your verification code is {code}. It expires in 10 minutes.\nIf you did not request it, ignore this message."); }
        catch { lock (gate) { challenges.Remove(id); } throw new AcademyException("We couldn't send the code. Please try again later.", 503); }
        return id;
    }
    public string Verify(string challengeId, string code)
    {
        lock (gate)
        {
            Prune();
            if (!challenges.TryGetValue(challengeId, out var c)) throw new AcademyException("This code expired. Request a new code.");
            c.Tries++;
            var correct = CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(c.Hash), Encoding.ASCII.GetBytes(Hash(challengeId + code)));
            if (c.Tries >= 5 || correct) challenges.Remove(challengeId);
            if (!correct) throw new AcademyException(c.Tries >= 5 ? "Too many attempts. Request a new code." : "The code is incorrect.");
            var id = Secret(); visitors[id] = new(c.Email); return id;
        }
    }
    private Visitor Get(string? id)
    {
        Prune();
        if (id == null || !visitors.TryGetValue(id, out var visitor)) throw new AcademyException("Verify your email to continue.", 401);
        return visitor;
    }
    public object Start(string? visitorId, string disciplineId, HttpContext ctx)
    {
        lock (gate)
        {
            var v = Get(visitorId); var d = store.Read();
            if (d.AssessmentModes.GetValueOrDefault(disciplineId) != "enabled" || !AcademyStore.Ready(d, disciplineId) || !Available(ctx))
                throw new AcademyException("This discipline's assessment is coming soon.", 409);
            if (v.ReportId != null) throw new AcademyException("This assessment has already been submitted. Verify your email again for a new attempt.", 409);
            if (v.Discipline != null && v.Discipline != disciplineId) throw new AcademyException("Finish your current discipline assessment first.", 409);
            if (v.Discipline == null)
            {
                v.Discipline = disciplineId; v.Snapshot = d;
                // Equal blueprint for every path: two questions at each difficulty; no replacement.
                v.Questions = d.Paths.Where(p => p.DisciplineId == disciplineId && p.Published)
                    .SelectMany(p => new[] { "easy", "medium", "hard" }.SelectMany(t =>
                        d.Questions.Where(q => q.PathId == p.Id && q.Difficulty == t && q.Reviewed).OrderBy(_ => RandomNumberGenerator.GetInt32(int.MaxValue)).Take(2)))
                    .Select(ShuffleOptions).OrderBy(_ => RandomNumberGenerator.GetInt32(int.MaxValue)).ToArray();
            }
            return new { disciplineId, expiresAt = v.Expires, questions = v.Questions.Select(q => new { q.Id, q.Prompt, q.Options, q.PathId }) };
        }
    }
    private static Question ShuffleOptions(Question q)
    {
        var order = Enumerable.Range(0, q.Options.Length).OrderBy(_ => RandomNumberGenerator.GetInt32(int.MaxValue)).ToArray();
        return q with { Options = order.Select(i => q.Options[i]).ToArray(), CorrectIndex = Array.IndexOf(order, q.CorrectIndex) };
    }
    public AssessmentReport Submit(string? visitorId, Answer[] answers)
    {
        lock (gate)
        {
            var v = Get(visitorId);
            if (v.ReportId != null) return store.Read().Reports.Single(x => x.Id == v.ReportId);
            if (v.Snapshot == null || v.Questions.Length == 0) throw new AcademyException("Start an assessment first.");
            var current = store.Read();
            if (current.AssessmentModes.GetValueOrDefault(v.Discipline!) != "enabled") throw new AcademyException("This assessment has been paused by the administrator.", 409);
            if (answers.Length != v.Questions.Length || answers.Select(a => a.QuestionId).Distinct().Count() != answers.Length
                || answers.Any(a => !v.Questions.Any(q => q.Id == a.QuestionId && a.Option >= 0 && a.Option < q.Options.Length)))
                throw new AcademyException("Answer every question once before submitting.");
            var d = v.Snapshot; var report = new AssessmentReport { Email = v.Email, DisciplineId = v.Discipline! };
            foreach (var group in v.Questions.GroupBy(q => q.PathId))
            {
                var path = d.Paths.Single(p => p.Id == group.Key);
                bool Right(Question q) => answers.Single(a => a.QuestionId == q.Id).Option == q.CorrectIndex;
                int Percent(IEnumerable<Question> qs) => (int)Math.Round(100.0 * qs.Count(Right) / qs.Count());
                var score = Percent(group); var scores = group.GroupBy(q => q.Difficulty).ToDictionary(g => g.Key, g => Percent(g));
                var level = scores["easy"] < 75 ? "Beginner" : scores["medium"] < 75 ? "Intermediate" : "Advanced";
                var weakIds = group.Where(q => !Right(q)).SelectMany(q => q.CourseIds).Distinct().ToHashSet();
                var candidates = d.Courses.Where(c => c.PathId == path.Id && c.Published && AncestorsPublished(c, d));
                var recommended = candidates.OrderByDescending(c => weakIds.Contains(c.Id)).ThenByDescending(c => c.Level == level).Take(3)
                    .Select(c => new CourseRecommendation(c.Id, c.Title, c.Level, $"course.html?discipline={Uri.EscapeDataString(c.DisciplineId)}&title={Uri.EscapeDataString(c.Title)}")).ToArray();
                var focus = scores.OrderBy(x => x.Value).ThenBy(x => Array.IndexOf(new[] { "easy", "medium", "hard" }, x.Key)).First().Key;
                var advice = score >= 85 ? "Strong performance in this short diagnostic. Explore advanced projects and validate your knowledge in practice."
                    : $"Start with {level.ToLowerInvariant()} material. Focus on {focus}-difficulty concepts, then practise before taking the assessment again.";
                report.Paths.Add(new(path.Id, path.Name, score, group.Count(Right), group.Count(), scores, advice, recommended));
            }
            store.Change(state => state.Reports.Add(report)); v.ReportId = report.Id;
            return report;
        }
    }
    public static bool AncestorsPublished(Course c, AcademyData d)
    {
        var parent = c.ParentId;
        while (parent != null) { var p = d.Courses.Find(x => x.Id == parent); if (p == null || !p.Published) return false; parent = p.ParentId; }
        return true;
    }
}
