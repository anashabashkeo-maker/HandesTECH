# HandesTECH

Purple bilingual engineering website with 112 course outlines across five disciplines and 16 learning paths. Open `VisualStudio/HandesTECH.sln` in Visual Studio and run the ASP.NET Core/.NET 10 application at http://localhost:5180.

- `/admin.html`: first-run local administrator setup, courses/subcourses, paths, private question bank, assessment availability and reports.
- `/assessment.html`: browser-only self-assessments, available on GitHub Pages across all five disciplines, with randomized questions, per-path results, focus areas and course recommendations.
- GitHub Pages supports course browsing, the chatbot and browser assessments. Private Admin still needs the ASP.NET Core host.

See [administration and deployment setup](docs/ADMIN-ASSESSMENT-SETUP.md). The public self-assessment bank intentionally includes its answers, as approved for browser-only learning guidance. No administrator password, reports or private settings are published. Email and verification codes are not required. Private local data lives in ignored `App_Data/`.

The public bank has 336 questions across 16 paths, including engineering diagrams, multi-select answers, matching pairs and ordered workflows. Each attempt selects five distinct concepts per difficulty per path (15 questions/path; 45 for three-path disciplines and 60 for Electrical) and includes all four question formats. Multi-part questions score one point only when every part is correct. Results give one starting path (the lowest score) and one starting course. Results stay in the visitor's browser tab and are not sent to Admin. Progress/results can be restored in that tab for up to 24 hours, cleared with Start over/Try another assessment, or printed. A two-page personalised PDF learning plan includes the starting course, application knowledge, score chart and four practice stages. Weekly study hours are adjustable; estimates are suggestions, not course duration. PDF generation runs locally using vendored jsPDF and OFL-licensed Amiri fonts for Arabic. Questions are preliminary learning diagnostics, not a calibrated professional exam.

## Validate

```powershell
node scripts/test-browser-assessments.cjs
node scripts/test-learning-guide.cjs
node scripts/test-ai-client.cjs
python scripts/test-ai-guide.py
dotnet build HandesTECH.csproj
python scripts/test-academy.py
```

Tests use disposable private storage and confirm anonymous assessments never send email. Without the private bank they use synthetic test questions. Payments, course video delivery and enrolment are not implemented.

The default public chatbot keeps discipline, path, level and application context for follow-up questions and explains the current assessment recommendation using catalogue rules. An optional OpenAI connection now runs through ASP.NET with server-side keys, bounded history, validated course links, persistent daily request caps and explicit catalogue fallback. Visitors choose whether to share their assessment recommendation with AI. AI is disabled until a key and hosted API are configured; see [AI setup](docs/AI-CHATBOT-SETUP.md). API integration tests use a local stub and incur no provider charges.

The active chatbot is browser-only: bilingual system/application matching, common spelling corrections, experience and path follow-ups, course outcomes, actual next-course sequences, assessment advice, and service routing. It does not load the optional AI client or contact a model provider. The earlier AI prototype remains inactive.
