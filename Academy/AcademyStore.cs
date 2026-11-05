using System.Text.Json;
using System.Text.RegularExpressions;

namespace HandesTECH;

// Single-process durable store. Deploy on one app instance with a persistent private volume.
public sealed class AcademyStore
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { WriteIndented = true };
    private readonly object gate = new();
    private readonly string file;
    private AcademyData data;
    public AcademyStore(IWebHostEnvironment env, IConfiguration config)
    {
        var dir = Path.GetFullPath(config["Academy:DataDirectory"] ?? Path.Combine(env.ContentRootPath, "App_Data"));
        var web = Path.GetFullPath(env.WebRootPath).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        if ((dir + Path.DirectorySeparatorChar).StartsWith(web, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Academy data must be outside wwwroot.");
        Directory.CreateDirectory(dir);
        file = Path.Combine(dir, "academy.json");
        data = File.Exists(file) ? JsonSerializer.Deserialize<AcademyData>(File.ReadAllText(file), Json)! : Import(env.WebRootPath);
        if (!File.Exists(file)) Persist(data);
    }
    private static T Clone<T>(T value) => JsonSerializer.Deserialize<T>(JsonSerializer.Serialize(value, Json), Json)!;
    public AcademyData Read() { lock (gate) return Clone(data); }
    public void Change(Action<AcademyData> change)
    {
        lock (gate) { var next = Clone(data); change(next); Persist(next); data = next; }
    }
    public void SaveCatalogue(AcademyData input)
    {
        Validate(input);
        Change(next =>
        {
            if (input.Revision != next.Revision) throw new AcademyException("The catalogue changed. Reload before saving.", 409);
            next.Disciplines = input.Disciplines; next.Paths = input.Paths; next.Courses = input.Courses;
            next.Questions = input.Questions; next.AssessmentModes = input.AssessmentModes;
            next.Revision++;
        });
    }
    private void Persist(AcademyData next)
    {
        var temp = file + ".tmp";
        File.WriteAllText(temp, JsonSerializer.Serialize(next, Json));
        File.Move(temp, file, true);
    }
    public static bool Ready(AcademyData d, string disciplineId) => d.Paths.Any(p => p.DisciplineId == disciplineId && p.Published)
        && d.Paths.Where(p => p.DisciplineId == disciplineId && p.Published).All(p =>
            new[] { "easy", "medium", "hard" }.All(t => d.Questions.Count(q => q.PathId == p.Id && q.Difficulty == t && q.Reviewed) >= 2));
    private static void Validate(AcademyData d)
    {
        if (d.Disciplines.Count > 30 || d.Paths.Count > 200 || d.Courses.Count > 2000 || d.Questions.Count > 10000)
            throw new AcademyException("Catalogue exceeds the supported size.");
        static void Require(bool condition, string message) { if (!condition) throw new AcademyException(message); }
        static bool Text(string? s, int max) => !string.IsNullOrWhiteSpace(s) && s.Length <= max;
        static bool Id(string? s) => s != null && Regex.IsMatch(s, "^[a-z0-9][a-z0-9-]{0,99}$");
        foreach (var ids in new[] { d.Disciplines.Select(x => x.Id), d.Paths.Select(x => x.Id), d.Courses.Select(x => x.Id), d.Questions.Select(x => x.Id) })
            Require(ids.All(Id) && ids.Distinct().Count() == ids.Count(), "Use unique lowercase IDs containing letters, numbers and hyphens.");
        foreach (var x in d.Disciplines) Require(Text(x.Name, 120) && Id(x.Image), "Invalid discipline.");
        foreach (var p in d.Paths) Require(d.Disciplines.Any(x => x.Id == p.DisciplineId) && Text(p.Name, 180), "A path needs a discipline and name.");
        foreach (var c in d.Courses)
        {
            Require(d.Paths.Any(p => p.Id == c.PathId && p.DisciplineId == c.DisciplineId), "A course must belong to a path in its discipline.");
            Require(Text(c.Title, 200) && Text(c.Scope, 2000) && new[] { "Beginner", "Intermediate", "Advanced", "Professional" }.Contains(c.Level), "Invalid course title, scope or level.");
            Require(c.Topics is { Length: > 0 and <= 60 } && c.Topics.All(t => Text(t, 500)) && c.Applications != null && c.Applications.All(a => Id(a.Id) && Text(a.Skill, 1000)), "Invalid topics or applications.");
            var seen = new HashSet<string> { c.Id }; var parent = c.ParentId;
            while (parent != null)
            {
                Require(seen.Add(parent), "Subcourses cannot form a cycle.");
                var found = d.Courses.Find(x => x.Id == parent && x.DisciplineId == c.DisciplineId && x.PathId == c.PathId);
                Require(found != null, "A subcourse parent must exist in the same path."); parent = found!.ParentId;
            }
        }
        Require(d.Courses.GroupBy(c => (c.DisciplineId, c.Title.ToLowerInvariant())).All(g => g.Count() == 1), "Course titles must be unique within a discipline.");
        foreach (var q in d.Questions)
            Require(d.Paths.Any(p => p.Id == q.PathId && p.DisciplineId == q.DisciplineId) && new[] { "easy", "medium", "hard" }.Contains(q.Difficulty)
                && Text(q.Prompt, 3000) && q.Options is { Length: >= 2 and <= 6 } && q.Options.All(o => Text(o, 1000))
                && q.Options.Distinct(StringComparer.OrdinalIgnoreCase).Count() == q.Options.Length && q.CorrectIndex >= 0 && q.CorrectIndex < q.Options.Length
                && Text(q.Explanation, 3000) && q.CourseIds != null && q.CourseIds.All(id => d.Courses.Any(c => c.Id == id && c.PathId == q.PathId)), "Invalid question, options, answer or course mapping.");
        Require(d.AssessmentModes.All(x => d.Disciplines.Any(y => y.Id == x.Key) && new[] { "hidden", "coming-soon", "enabled" }.Contains(x.Value)), "Invalid assessment mode.");
        foreach (var x in d.AssessmentModes.Where(x => x.Value == "enabled")) Require(Ready(d, x.Key), "Review at least two questions per difficulty for every published path before enabling its assessment.");
    }
    private static AcademyData Import(string web)
    {
        var source = JsonDocument.Parse(File.ReadAllText(Path.Combine(web, "assets", "course-data.json")));
        var data = new AcademyData();
        foreach (var d in source.RootElement.EnumerateArray())
        {
            var id = d.GetProperty("slug").GetString()!;
            data.Disciplines.Add(new(id, d.GetProperty("name").GetString()!, d.GetProperty("image").GetString()!));
            data.AssessmentModes[id] = "coming-soon";
            var initialPaths = id == "electrical"
                ? new[] { ("design-power", "Power design"), ("design-telecom", "Telecommunications design"), ("bim", "BIM & coordination"), ("ai", "AI in engineering") }
                : new[] { ("design", "Engineering design"), ("bim", "BIM & coordination"), ("ai", "AI in engineering") };
            foreach (var path in initialPaths)
                data.Paths.Add(new(id + "-" + path.Item1, id, path.Item2));
            var index = 0;
            var telecom = false;
            foreach (var c in d.GetProperty("courses").EnumerateArray())
            {
                var coursePath = c.GetProperty("path").GetString();
                if (id == "electrical" && coursePath == "design")
                {
                    if (c.GetProperty("title").GetString() == "Telecommunications design fundamentals") telecom = true;
                    coursePath = telecom ? "design-telecom" : "design-power";
                }
                data.Courses.Add(new(id + "-course-" + ++index, id, id + "-" + coursePath,
                    c.GetProperty("title").GetString()!, c.GetProperty("level").GetString()!, c.GetProperty("scope").GetString()!,
                    c.GetProperty("topics").Deserialize<string[]>()!, c.GetProperty("applications").Deserialize<ApplicationSkill[]>(Json)!));
            }
        }
        var seed = Path.Combine(Path.GetDirectoryName(web)!, "Academy", "seed-questions.json");
        if (File.Exists(seed)) data.Questions = JsonSerializer.Deserialize<List<Question>>(File.ReadAllText(seed), Json)!;
        return data;
    }
}
