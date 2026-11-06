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
dotnet build HandesTECH.csproj
python scripts/test-academy.py
```

Tests use disposable private storage and confirm anonymous assessments never send email. Without the private bank they use synthetic test questions. Payments, course video delivery and enrolment are not implemented.

The public chatbot keeps discipline, path, level and application context for follow-up questions, gives one focused course with application skills, and can explain the current assessment recommendation. Its conversation stays in page memory; only the existing browser assessment summary is shared between pages in session storage. It links to services without a backend or paid AI key. It is a course guide, not a general AI assistant.
