# HandesTECH administration and assessments

Open `VisualStudio/HandesTECH.sln` in Visual Studio and run the ASP.NET Core/.NET 10 project. Local website: http://localhost:5180.

## Admin access

Shift-click a brand logo or hold it for 1.5 seconds. Admin is hidden from the public navigation and protected by authentication. First-run local setup creates your own password (minimum 16 characters); no default password is supplied. Hosted Production requires `Admin__PasswordHash` in private server configuration. Private settings and data stay in ignored `App_Data`, outside `wwwroot`.

Manage courses, nested subcourses, learning paths, application knowledge, private questions and availability. Apply draft edits, then save to publish. Deleting a path also deletes its courses/questions from the draft; review the confirmation. Stale revisions and parent cycles are rejected. Unpublished parents hide descendants.

## Public browser assessments

All five disciplines are Available on GitHub Pages. The browser downloads `assets/assessment-bank.json` and uses `assets/assessment-browser.js` to draw and score questions. No backend, account, email, verification code or Turnstile is required for this mode. Answer keys are intentionally public, as authorized by the owner; this is an open learning self-assessment, not a secure or calibrated placement exam.

The public bank contains 336 questions across 16 paths. Each path has illustrated questions, select-all-that-apply questions, column matching and an ordered workflow, in addition to the original single-answer items. Each attempt selects five different concepts at each difficulty per path: 15 questions per path, 60 questions for Electrical and 45 for other disciplines. Questions, choices, matching columns and initial step order shuffle. Each question is one point: multi-select requires every correct option and no incorrect option, matching requires all pairs, and ordering requires the complete correct sequence. Results give one starting path from the lowest score and one course, followed by score breakdowns for all paths. The initial bank is in English; the interface supports Arabic/RTL.

Answers and results stay in the visitor's browser tab (`sessionStorage`) for up to 24 hours and can be restored after refresh. Closing the tab normally clears them, subject to browser session restoration. Start over/Try another assessment explicitly clears the saved attempt. No answers or results are submitted to HandesTECH, emailed or saved in Admin. Participants can print/save their result as PDF.

Edit the public bank and its `assessments` availability entries locally, validate, then deploy to update GitHub Pages. Local Admin edits and private question imports do not automatically update this public snapshot. The private Admin question editor and retained server grading API remain single-answer formats; mixed formats are implemented in the public browser engine. The retained server assessment API can still support hosted private grading/report storage later; its admin availability settings apply to that server API, not the public browser mode. Historic private reports remain untouched.

Never publish the private `App_Data` folder, administrator settings, report files or backup archives. Only the intentionally public self-assessment bank belongs in `wwwroot` and `docs`.

## Chatbot

The visible Chat with HandesTECH button works on GitHub Pages and the local server. It searches the public course catalogue in English/Arabic and links to course details, services and assessments. It uses no paid AI service. It cannot answer arbitrary engineering calculations, confirm course fees/dates, or access private admin data. Chat text remains in the page memory and is not submitted or stored on the server.

## Online hosting

GitHub Pages runs course browsing, the chatbot and public browser assessments. Private Admin saving and the retained private assessment API require an ASP.NET Core host. Use one application instance with HTTPS and a persistent private data directory (`Academy__DataDirectory`) outside `wwwroot`. A custom domain can wait. No mailbox is needed.

For production, set `ASPNETCORE_ENVIRONMENT=Production`, administrator password hash and private persistent storage. Configure trusted proxy/HTTPS settings. Back up `academy.json` and Data Protection keys, establish a retention/deletion policy for results, and protect private bank exports. Windows keys use DPAPI; protect Linux keys at rest as appropriate. In-memory attempts expire after two hours and reset if the app restarts. Use a transactional database/distributed sessions before scaling to multiple instances.

Azure Windows App Service F1 is an evaluation option, not a supported production plan. No cloud resources have been created. Publish with `dotnet publish HandesTECH.csproj -c Release -o .artifacts/publish`. Never deploy private data or backups as public assets. The dedicated public self-assessment bank is the intentional exception for answer keys; private admin banks are imported after authenticated setup.

## Validation

Run `node scripts/test-browser-assessments.cjs`, `dotnet build HandesTECH.csproj` and `python scripts/test-academy.py`. Integration tests create disposable data, use synthetic questions if the private bank is absent, and confirm that no email is sent. Review technical questions and perform a real hosted end-to-end test before launch.

The browser result includes a colourful score comparison and a personalised two-page PDF learning plan. Choose weekly study hours to adjust the suggested practice schedule. PDF generation and Arabic fonts are vendored; no third-party runtime service receives answers or results. The course guide remembers conversation context in page memory and can use the tab's assessment summary to explain the starting course. It remains a catalogue guide, not a general AI service.
