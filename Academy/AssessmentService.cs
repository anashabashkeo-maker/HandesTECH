using System.Security.Cryptography;
using System.Text.Json;

namespace HandesTECH;

public sealed class AssessmentService(AcademyStore store, IConfiguration config,
    IWebHostEnvironment env, IHttpClientFactory clients)
{
    private readonly object gate = new();
    private readonly Dictionary<string, Visitor> visitors = [];
    private sealed class Visitor(string email)
    {
        public string Email { get; } = email;
        public string AttemptId { get; } = Guid.NewGuid().ToString("N");
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
    public bool Available(HttpContext ctx) => true;
    public static string Secret() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
    private void Prune()
    {
        foreach (var key in visitors.Where(x => x.Value.Expires < DateTimeOffset.UtcNow).Select(x => x.Key).ToArray()) visitors.Remove(key);
        if (visitors.Count > 5000) throw new AcademyException("Please try again later.", 429);
    }
    public async Task<string> CreateGuest(HttpContext ctx, string token)
    {
        if (token.Length > 2048) throw new AcademyException("Please complete the bot check again.");
        if (BotConfigured && !LocalTesting(ctx))
        {
            using var response = await clients.CreateClient("turnstile").PostAsync("https://challenges.cloudflare.com/turnstile/v0/siteverify",
                new FormUrlEncodedContent(new Dictionary<string, string> { ["secret"] = config["Turnstile:SecretKey"]!, ["response"] = token }));
            using var result = JsonDocument.Parse(await response.Content.ReadAsStringAsync()); var root = result.RootElement;
            if (!root.TryGetProperty("success", out var ok) || !ok.GetBoolean()
                || !root.TryGetProperty("hostname", out var host) || host.GetString() != config["Turnstile:Hostname"]
                || !root.TryGetProperty("action", out var action) || action.GetString() != "assessment")
                throw new AcademyException("Please complete the bot check again.");
        }
        lock (gate) { Prune(); var id = Secret(); visitors[id] = new(""); return id; }
    }
    private Visitor Get(string? id)
    {
        Prune();
        if (id == null || !visitors.TryGetValue(id, out var visitor)) throw new AcademyException("Begin an assessment to continue.", 401);
        return visitor;
    }
    public object Start(string? visitorId, string disciplineId, HttpContext ctx)
    {
        lock (gate)
        {
            var v = Get(visitorId); var d = store.Read();
            if (d.AssessmentModes.GetValueOrDefault(disciplineId) != "enabled" || !AcademyStore.Ready(d, disciplineId) || !Available(ctx))
                throw new AcademyException("This discipline's assessment is coming soon.", 409);
            if (v.ReportId != null) throw new AcademyException("This assessment has already been submitted. Begin a new attempt from the assessment page.", 409);
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
            return PublicExam(v);
        }
    }
    private static object PublicExam(Visitor v) => new { attemptId = v.AttemptId, disciplineId = v.Discipline, expiresAt = v.Expires, questions = v.Questions.Select(q => new { q.Id, q.Prompt, q.Options, q.PathId }) };
    public object Session(string? visitorId)
    {
        lock (gate)
        {
            var visitor = Get(visitorId);
            if (visitor.ReportId != null) return new { state = "completed", report = store.Read().Reports.Single(r => r.Id == visitor.ReportId) };
            if (visitor.Discipline == null) return new { state = "verified" };
            if (store.Read().AssessmentModes.GetValueOrDefault(visitor.Discipline) != "enabled") return new { state = "paused" };
            return new { state = "active", exam = PublicExam(visitor) };
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
            var d = v.Snapshot; var report = new AssessmentReport { DisciplineId = v.Discipline!, Delivery = "stored" };
            foreach (var group in v.Questions.GroupBy(q => q.PathId).OrderBy(g => d.Paths.FindIndex(p => p.Id == g.Key)))
            {
                var path = d.Paths.Single(p => p.Id == group.Key);
                bool Right(Question q) => answers.Single(a => a.QuestionId == q.Id).Option == q.CorrectIndex;
                int Percent(IEnumerable<Question> qs) => (int)Math.Round(100.0 * qs.Count(Right) / qs.Count());
                var score = Percent(group); var scores = new[] { "easy", "medium", "hard" }.ToDictionary(d => d, d => Percent(group.Where(q => q.Difficulty == d)));
                var level = scores["easy"] < 75 ? "Beginner" : scores["medium"] < 75 ? "Intermediate" : "Advanced";
                var weakIds = group.Where(q => !Right(q)).SelectMany(q => q.CourseIds).Distinct().ToHashSet();
                var candidates = current.Courses.Where(c => c.PathId == path.Id && c.Published && AncestorsPublished(c, current));
                var recommended = candidates.OrderByDescending(c => weakIds.Contains(c.Id)).ThenByDescending(c => c.Level == level).Take(3)
                    .Select(c => new CourseRecommendation(c.Id, c.Title, c.Level, $"course.html?discipline={Uri.EscapeDataString(c.DisciplineId)}&title={Uri.EscapeDataString(c.Title)}")).ToArray();
                var focus = scores.OrderBy(x => x.Value).ThenBy(x => Array.IndexOf(new[] { "easy", "medium", "hard" }, x.Key)).First().Key;
                var advice = score >= 85 ? "Strong performance in this short diagnostic. Explore advanced projects and validate your knowledge in practice."
                    : $"Start with {level.ToLowerInvariant()} material. Focus on {focus}-difficulty concepts, then practise before taking the assessment again.";
                var focusAreas = group.Where(q => !Right(q)).Select(q => q.Topic ?? (q.Prompt.Length > 150 ? q.Prompt[..147] + "\u2026" : q.Prompt)).Distinct().Take(4).ToArray();
                report.Paths.Add(new(path.Id, path.Name, score, group.Count(Right), group.Count(), scores, advice, recommended, level, focusAreas));
            }
            store.Change(state => state.Reports.Add(report)); v.ReportId = report.Id;
            return report;
        }
    }
    public static bool AncestorsPublished(Course c, AcademyData d)
    {
        var parent = c.ParentId; var seen = new HashSet<string> { c.Id };
        while (parent != null) { if (!seen.Add(parent)) return false; var p = d.Courses.Find(x => x.Id == parent); if (p == null || !p.Published) return false; parent = p.ParentId; }
        return true;
    }
}
