namespace HandesTECH;

public sealed class AcademyException(string message, int status = 400) : Exception(message) { public int Status { get; } = status; }
public sealed class AcademyData
{
    public int SchemaVersion { get; set; }
    public long Revision { get; set; }
    public List<Discipline> Disciplines { get; set; } = [];
    public List<LearningPath> Paths { get; set; } = [];
    public List<Course> Courses { get; set; } = [];
    public List<Question> Questions { get; set; } = [];
    public Dictionary<string, string> AssessmentModes { get; set; } = [];
    public List<AssessmentReport> Reports { get; set; } = [];
}
public sealed record Discipline(string Id, string Name, string Image);
public sealed record LearningPath(string Id, string DisciplineId, string Name, bool Published = true, string Kind = "design");
public sealed record Course(string Id, string DisciplineId, string PathId, string Title, string Level, string Scope,
    string[] Topics, ApplicationSkill[] Applications, string? ParentId = null, bool Published = true);
public sealed record ApplicationSkill(string Id, string Skill);
public sealed record Question(string Id, string DisciplineId, string PathId, string Difficulty, string Prompt,
    string[] Options, int CorrectIndex, string Explanation, string[] CourseIds, bool Reviewed = false, string? Topic = null);
public sealed record Answer(string QuestionId, int Option);
public sealed record PathResult(string PathId, string Name, int Score, int Correct, int Total,
    Dictionary<string, int> DifficultyScores, string Advice, CourseRecommendation[] Courses, string SuggestedLevel = "Beginner", string[]? FocusAreas = null);
public sealed record CourseRecommendation(string Id, string Title, string Level, string Url);
public sealed class AssessmentReport
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Email { get; set; } = "";
    public string DisciplineId { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public List<PathResult> Paths { get; set; } = [];
    public string Delivery { get; set; } = "pending";
    public int DeliveryAttempts { get; set; }
    public DateTimeOffset? LastDeliveryAttempt { get; set; }
}
