# HandesTECH administration and assessments

Open `VisualStudio/HandesTECH.sln` in Visual Studio and run the ASP.NET Core/.NET 10 project. Local website: http://localhost:5180.

## Admin access

Shift-click a brand logo or hold it for 1.5 seconds. Admin is hidden from the public navigation and protected by authentication. First-run local setup creates your own password (minimum 16 characters); no default password is supplied. Hosted Production requires `Admin__PasswordHash` in private server configuration. Private settings and data stay in ignored `App_Data`, outside `wwwroot`.

Manage courses, nested subcourses, learning paths, application knowledge, private questions and availability. Apply draft edits, then save to publish. Deleting a path also deletes its courses/questions from the draft; review the confirmation. Stale revisions and parent cycles are rejected. Unpublished parents hide descendants.

## Assessments without email

No participant email address, account, verification code, sending mailbox or SMTP configuration is required. Participants consent to private result storage, take randomized multiple-choice questions, then see scores by path and difficulty, focus topics, course recommendations and advice. Reports are stored privately in Admin and are not emailed. Existing historic reports are preserved. The old email endpoints and retry action are no longer exposed, and the email worker is not registered.

Choose Hidden, Coming soon or Enabled per discipline. Every published path needs at least two reviewed questions at each difficulty before enabling. The local bank contains 240 draft questions (15 per path) requiring subject-expert review. The real bank/answer keys are excluded from public source and deployment. Authenticated admin supports private JSON import/export. Imports must be reviewed before activation.

Each attempt selects two questions per difficulty per path: six per path, 24 for Electrical and 18 for other disciplines. Questions/options shuffle, answer keys remain private, and attempt snapshots prevent mid-exam edits changing scoring. Answers can be restored in the same browser tab. Results are learning guidance, not professional certification. The initial question bank is in English; the participant UI supports Arabic/RTL.

Rate limiting and CSRF protection are active. Turnstile is optional; if configured, the start endpoint validates its token, exact hostname and assessment action. Configure `Turnstile__SiteKey`, `Turnstile__SecretKey`, `Turnstile__Hostname` only if you want it. Local test bypass applies only to Development loopback requests.

## Chatbot

The visible Chat with HandesTECH button works on GitHub Pages and the local server. It searches the public course catalogue in English/Arabic and links to course details, services and assessments. It uses no paid AI service. It cannot answer arbitrary engineering calculations, confirm course fees/dates, or access private admin data. Chat text remains in the page memory and is not submitted or stored on the server.

## Online hosting

GitHub Pages is a static preview: chatbot and course browsing work there; admin saving and assessments require an ASP.NET Core host. Use one application instance with HTTPS and a persistent private data directory (`Academy__DataDirectory`) outside `wwwroot`. A custom domain can wait. No mailbox is needed.

For production, set `ASPNETCORE_ENVIRONMENT=Production`, administrator password hash and private persistent storage. Configure trusted proxy/HTTPS settings. Back up `academy.json` and Data Protection keys, establish a retention/deletion policy for results, and protect private bank exports. Windows keys use DPAPI; protect Linux keys at rest as appropriate. In-memory attempts expire after two hours and reset if the app restarts. Use a transactional database/distributed sessions before scaling to multiple instances.

Azure Windows App Service F1 is an evaluation option, not a supported production plan. No cloud resources have been created. Publish with `dotnet publish HandesTECH.csproj -c Release -o .artifacts/publish`. Never deploy private data, backups or answer banks as public assets; import the private bank after authenticated setup.

## Validation

Run `dotnet build HandesTECH.csproj` and `python scripts/test-academy.py`. Integration tests create disposable data, use synthetic questions if the private bank is absent, and confirm that no email is sent. Review technical questions and perform a real hosted end-to-end test before launch.
