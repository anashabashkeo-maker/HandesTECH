# HandesTECH

Purple bilingual engineering website with 112 course outlines across five disciplines and 16 learning paths. Open `VisualStudio/HandesTECH.sln` in Visual Studio and run the ASP.NET Core/.NET 10 application at http://localhost:5180.

- `/admin.html`: first-run local administrator setup, courses/subcourses, paths, private question bank, assessment availability and reports.
- `/assessment.html`: browser-only self-assessments, available on GitHub Pages across all five disciplines, with randomized questions, per-path results, focus areas and course recommendations.
- GitHub Pages supports course browsing, the chatbot and browser assessments. Private Admin still needs the ASP.NET Core host.

See [administration and deployment setup](docs/ADMIN-ASSESSMENT-SETUP.md). The public self-assessment bank intentionally includes its answers, as approved for browser-only learning guidance. No administrator password, reports or private settings are published. Email and verification codes are not required. Private local data lives in ignored `App_Data/`.

The public bank has 336 questions across 16 paths, including engineering diagrams, multi-select answers, matching pairs and ordered workflows. Each attempt selects two distinct concepts per difficulty per path and includes all four question formats. Multi-part questions score one point only when every part is correct. Results give one starting path (the lowest score) and one starting course. Results stay in the visitor's browser tab and are not sent to Admin. Progress/results can be restored in that tab for up to 24 hours, cleared with Start over/Try another assessment, or printed as PDF. Questions are preliminary learning diagnostics, not a calibrated professional exam.

## Validate

```powershell
node scripts/test-browser-assessments.cjs
dotnet build HandesTECH.csproj
python scripts/test-academy.py
```

Tests use disposable private storage and confirm anonymous assessments never send email. Without the private bank they use synthetic test questions. Payments, course video delivery and enrolment are not implemented.

The public chatbot searches the course catalogue and links to services without a backend or paid AI key. It is a course guide, not a general AI assistant.
