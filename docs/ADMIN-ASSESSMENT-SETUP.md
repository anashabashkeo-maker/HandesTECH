# HandesTECH administration and assessments

The website now includes `/admin.html`, `/assessment.html`, and a course-guide chatbot. Run the ASP.NET Core project to use them. GitHub Pages and other static-only hosting cannot run the administration, assessment, verification, or chat APIs. Existing static previews retain their original read-only course outlines.

## What is included

- Course and learning-path administration, draft changes, publishing, nested subcourses, cascade deletion with confirmation, and stale-edit protection.
- Five existing disciplines, 16 initial paths and 112 imported course outlines. Administration becomes the live catalogue source; it does not rewrite the checked-in static preview JSON.
- 240 private draft multiple-choice questions in the local bank: 15 per path, five per difficulty. The real bank and its answer keys are excluded from public source and deployment; import your reviewed bank through the authenticated admin screen. Questions and explanations require subject-expert review before use. Expand and calibrate the bank for serious placement decisions, including more detailed telecommunications scenarios.
- Assessment states per discipline: Hidden, Coming soon, Enabled. An enabled assessment requires at least two reviewed questions at each difficulty in every published path. Email and bot configuration must also be ready for public access.
- Two randomly selected questions per difficulty per path: six per path, 24 for Electrical and 18 for each other discipline. Questions and options are shuffled; answer keys stay on the server. An attempt retains its catalogue/question snapshot. Pausing a discipline blocks new attempts and submissions.
- Email-code verification (10 minutes, five attempts), server-validated Cloudflare Turnstile, rate limits, authenticated admin cookies and CSRF protection.
- Separate path scores and easy/medium/hard breakdowns, course-outline recommendations and advice, printable result, durable email outbox addressed to the privately configured report recipient.
- A catalogue-based chatbot that helps with course discovery and assessment questions. No paid AI service or AI key is needed. It does not provide general engineering calculations or invent prices and dates. Conversation text is not stored or emailed by the application.

## 1. Start locally and set an admin password

Install the .NET 10 SDK. Open the existing solution in Visual Studio and build it, or run `dotnet build` in the project directory.

On this computer, open `http://localhost:5180/admin.html` and create your administrator password (at least 16 characters). Setup is available only in Development from loopback, before an administrator exists. The hash is saved in private `App_Data/settings.json`; there is no default password.

For a hosted Production instance, generate a password hash:

```powershell
dotnet run --no-launch-profile -- --hash-admin-password
```

Enter a unique password of at least 16 characters followed by Enter. This small command reads standard input; the typed password may be visible in the terminal. Use a private terminal session. Copy only the resulting hash into a server secret named `Admin__PasswordHash`. Never commit a password or hash to GitHub. No default administrator password is supplied.

For a local session, set these environment variables in PowerShell, using your generated hash:

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Admin__PasswordHash = '<generated hash>'
dotnet run --no-launch-profile --urls http://localhost:5180
```

Open `http://localhost:5180/admin.html` and sign in with your password. The admin page is absent from public navigation. Shift-click either brand logo, or press and hold it for 1.5 seconds, to open admin access. A normal click still goes home. This shortcut does not bypass administrator authentication. Open `http://localhost:5180/assessment.html` for the participant screen.

For Visual Studio F5, put the same values into your local debugging environment or your user-secrets configuration; do not commit secrets to `launchSettings.json`. Restart the application after changing server configuration.

## 2. Set up sending email

Choose an SMTP provider that supports authenticated TLS submission on port 587, such as your business mailbox provider or a transactional email service. The recipient can remain your existing Gmail address; the sender should be a verified address you control, such as `noreply@handestech.com`.

Configure these server secrets/settings:

| Name | Value |
| --- | --- |
| `Email__Host` | SMTP hostname from your provider |
| `Email__Port` | Usually `587`; this integration uses STARTTLS |
| `Email__Username` | SMTP username |
| `Email__Password` | SMTP password or provider app password |
| `Email__From` | Verified sender address |
| `Assessment__ReportRecipient` | Private destination for participant reports |

Add the provider’s domain verification, SPF and DKIM records to Cloudflare DNS and configure DMARC as directed by the provider. Cloudflare Email Routing alone does not provide the SMTP mailbox/submission configuration used here.

Verification emails go to the participant. Assessment reports go to the privately configured report recipient. They are first saved privately, then sent by the background outbox. Temporary failures retry up to five times, spaced by at least two minutes. Admin → Assessments & reports shows pending/sent/failed delivery and allows retry after failure. A process crash immediately after SMTP acceptance can cause a duplicate email on retry; reports include a stable reference ID.

The participant screen says a report is queued until SMTP accepts it. SMTP acceptance does not guarantee inbox delivery. Check the provider’s delivery logs and spam folder during launch testing.

## 3. Configure Cloudflare Turnstile

In Cloudflare, create a Turnstile widget for the exact production hostname. Configure:

| Name | Value |
| --- | --- |
| `Turnstile__SiteKey` | Public widget site key |
| `Turnstile__SecretKey` | Private verification secret |
| `Turnstile__Hostname` | Exact hostname used by participants, e.g. `handestech.com` |

The server validates success, hostname and the `assessment` action through Cloudflare Siteverify. Choose one canonical hostname for the assessment page and redirect other hostnames to it. Bot protection reduces abuse; it is not an absolute guarantee that every visitor is human.

Reference: [Cloudflare server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## 4. Review and publish

1. Sign in at `/admin.html`.
2. **Courses & subcourses:** choose a discipline and item, edit it, select **Apply to draft**, then **Save changes**. Use Parent course to create a subcourse. Parents must be in the same path. Unpublished parents hide their descendants.
3. **Learning paths:** add, rename, publish/unpublish, or delete paths. Deleting a path removes its courses and questions from the draft; inspect the confirmation before saving.
4. **Question bank:** review accuracy, difficulty, distractors, explanation and related course mappings. Mark reviewed questions individually, apply them to the draft and save. Starter questions are preliminary and do not establish validated placement thresholds.
5. **Assessments & reports:** check coverage, email and bot configuration. Choose Enabled for a discipline and save. Hidden removes its public assessment card; Coming soon displays a disabled card.
6. Take a real test using a mailbox you control. Confirm code delivery, bot validation, results and receipt at your Gmail address before announcing availability.

Editing paths or questions returns the affected discipline to Coming soon so you can review coverage before enabling again. A short diagnostic has limited precision: each initial difficulty score uses only two items. Recommendations prioritize courses related to missed questions, then the suggested level. They guide course exploration, not formal professional certification or automatic enrolment.

## 5. Deploy and keep data

Use hosting that runs **ASP.NET Core/.NET 10**, with HTTPS and a persistent private data volume. Registering a domain in Cloudflare does not itself provide this application hosting.

- Set `ASPNETCORE_ENVIRONMENT=Production`.
- Set `Academy__DataDirectory` to a persistent private folder **outside `wwwroot`**. The default is the project’s `App_Data` directory. Give only the app and server administrators access.
- Run **one application instance**. The JSON store is designed for one process. Use a transactional database and a distributed verification/rate-limiting store before scaling to multiple replicas.
- Back up `academy.json` and the private `keys` subdirectory. Windows keys use DPAPI. On Linux, protect the volume and configure an appropriate certificate/key-management service if encryption at rest for Data Protection keys is required.
- Verification challenges and active attempts are in memory and expire after two hours at the latest. App restarts require participants to verify again. Completed reports and the delivery outbox persist.
- Stored reports include the participant email and learning results. Establish a retention period and a deletion process before public launch; the initial admin UI does not automate retention or deletion. The participant consent text directs deletion requests to HandesTECH. Configure a working company contact channel before public launch.
- Keep private settings out of source control, logs and static hosting folders. `App_Data/` is ignored by Git. Do not publish build logs or test mail pickup files.
- Apply the hosting provider’s trusted reverse-proxy/HTTPS configuration. The rate limiter uses the socket IP rather than trusting arbitrary forwarded headers. Behind a proxy, configure trusted forwarded headers to avoid grouping all participants under the proxy’s IP.

## Testing without sending email

The integration test creates a disposable store, reviews only its test copy of the questions, and uses a private `.eml` pickup directory. No real email is sent.

```powershell
dotnet build
python scripts/test-academy.py
```

For manual localhost testing only, use `Academy__LocalTesting=true` and `Email__DevelopmentPickupDirectory=<private absolute path>`, with the environment set to Development. This mode bypasses Turnstile only for loopback requests and writes mail to disk. It is ignored in Production. Do not enable local testing on a shared development server.

After testing, set up real SMTP and Turnstile and perform a real end-to-end launch test. The seeded question bank is imported only when a private catalogue is first created; subsequent startup does not overwrite your edits. Changes made by the admin are stored in `academy.json`, not regenerated by the static course-data script.

## No accounts yet: suggested evaluation setup

Keep GitHub Pages as the public preview while configuring an ASP.NET Core host. Azure App Service Windows F1 can be used for a free evaluation (60 CPU minutes/day, 1 GB storage). Microsoft does not support Free/Shared plans for production workloads. A custom domain is optional for evaluation. No cloud accounts or resources have been created by this project.

Publish with `dotnet publish -c Release -o .artifacts/publish`, then deploy that output to a single Windows App Service configured for .NET 10. Set the private data directory to a persistent folder outside the deployed web root. Set the administrator hash, report recipient, SMTP and Turnstile settings above through the host's private configuration. Do not upload `App_Data`, backups or real question banks as public assets. Import the bank after authenticated sign-in. Configure the host's trusted proxy and HTTPS handling before launch.

For sending email, use a verified SMTP sender. An existing Gmail mailbox can use an app password if its account supports app passwords and two-step verification; a custom domain is not required for that test. Do not use the normal Gmail password. Owner account setup and secret entry must be completed by the owner. Validate actual delivery before enabling the assessment.

References: [Azure Windows pricing](https://azure.microsoft.com/en-us/pricing/details/app-service/windows/), [ASP.NET Core App Service quickstart](https://learn.microsoft.com/en-us/azure/app-service/quickstart-dotnetcore), [Google app passwords](https://support.google.com/mail/answer/185833).

The server stores private reports until removed administratively. Establish retention/deletion procedures before launch. This single-process file store is suitable for a small initial deployment; use a transactional database and distributed sessions/rate limits before scaling out.
