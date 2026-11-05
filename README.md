# HandesTECH

Purple bilingual engineering website with 112 course outlines across five disciplines and 16 learning paths. Open `VisualStudio/HandesTECH.sln` in Visual Studio and run the ASP.NET Core/.NET 10 application at http://localhost:5180.

- `/admin.html`: first-run local administrator setup, courses/subcourses, paths, private question bank, assessment availability and reports.
- `/assessment.html`: anonymous diagnostic, randomized questions, per-path results, focus areas and course recommendations.
- GitHub Pages remains a static preview. It cannot run the private backend; assessments show Coming soon there.

See [administration and deployment setup](docs/ADMIN-ASSESSMENT-SETUP.md). No administrator password, real question bank or answer keys are shipped in source. Email and verification codes are not required. Private local data lives in ignored `App_Data/`. The local draft bank has 240 questions requiring technical review before public enablement.

## Validate

```powershell
dotnet build
python scripts/test-academy.py
```

Tests use disposable private storage and confirm anonymous assessments never send email. Without the private bank they use synthetic test questions. Payments, course video delivery and enrolment are not implemented.

The public chatbot searches the course catalogue and links to services without a backend or paid AI key. It is a course guide, not a general AI assistant.
