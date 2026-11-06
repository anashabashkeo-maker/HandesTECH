# HandesTECH AI chatbot setup

The AI connection uses the OpenAI Responses API through the existing ASP.NET Core application. It is disabled until an administrator supplies a key. GitHub Pages continues to run the catalogue guide until a hosted API is configured. This is preparation, not an activated AI subscription.

## Local Visual Studio setup

1. Create an OpenAI API project/key and configure its billing and spending controls. API usage can incur charges; this setup does not purchase credits or enable billing.
2. Run `./scripts/configure-ai.ps1` in PowerShell. It asks for the key with hidden input and saves configuration to .NET user secrets outside the repository. Do not put a key in website JavaScript, `wwwroot`, `docs`, chat messages or GitHub.
3. Restart `VisualStudio/HandesTECH.sln` in Development. The chat panel shows **AI-powered · OpenAI** when the server reports it is configured. Otherwise it remains **Catalogue guide**.

The default model is `gpt-5-mini`; it is configurable with `ChatAI:Model`. The setup script accepts `-Model`. Minimal reasoning is requested for the default model. Test actual responses with your account before enabling public access; account/model access and credits are not verified by the configuration status endpoint.

User secrets are local development configuration, not an encrypted production secret vault. The setup script passes the key through standard input, not command arguments/history, and never prints it.

## Connect GitHub Pages

Host the ASP.NET application on an HTTPS-capable .NET 10 host. Configure these server secrets/environment variables:

```text
ChatAI__Enabled=true
ChatAI__ApiKey=<server-only OpenAI key>
ChatAI__Model=gpt-5-mini
ChatAI__AllowedOrigins__0=https://anashabashkeo-maker.github.io
ChatAI__DailyRequestLimit=50
ChatAI__RequestsPerMinute=6
```

In `wwwroot/assets/chat-config.json` and its `docs` mirror, set only public routing information:

```json
{"enabled":true,"endpoint":"https://YOUR-ASP-NET-HOST/api/guide/chat","provider":"OpenAI"}
```

Replace the host with a real deployment, then publish. The endpoint is not the website's localhost address. The frontend checks `/api/guide/status` before using it; it never sends a provider key. Configure the hosting platform's trusted HTTPS/proxy settings according to that provider, rather than trusting arbitrary forwarded headers. Do not expose a development server to the internet.

## Conversation and results

The server supplies published courses, application skills and services from the live catalogue. The AI returns a structured reply with at most one course ID. The server and browser validate recommended courses; links are generated from an allowlist. Fees, dates, enrolment and contact channels are not invented. No administrator actions or external tools are granted to the model.

The panel discloses that messages are sent to OpenAI. Assessment recommendations are excluded unless the visitor selects **Include my assessment recommendation with AI messages**. Only discipline, recommended course and score are shared; exam answers, email and Admin reports are not sent. Conversation history stays in page memory, with at most eight messages replayed. Reset clears it. `store:false` disables Responses application storage; it does not promise zero provider retention. See the official [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).

The default safeguards allow six requests/minute per source IP, two concurrent provider calls, 1,000 characters/question and 1,200 output tokens. A private persistent `App_Data/ai-usage.json` reserves at most 50 calls per UTC day, including failed calls. This is a single-instance request cap, not a currency budget. Preserve private storage across restarts and configure provider spending controls; use a shared budget/rate-limit store before running multiple instances. Reverse-proxy IP configuration affects per-IP limiting.

On timeout, a limit, refusal or provider failure, the panel explicitly switches that response to catalogue guidance. No AI claim is shown when the connection is disabled. To disable immediately, set `ChatAI__Enabled=false` and restart the server; also set the public config's `enabled` to false.

## Verification

```text
dotnet build HandesTECH.csproj
node scripts/test-ai-client.cjs
python scripts/test-ai-guide.py
```

The integration test uses a loopback stub and dummy key. It makes no OpenAI requests and incurs no API charges. `ChatAI:DevelopmentEndpoint` is honoured only in Development for an HTTP loopback address; Production always uses the fixed official OpenAI endpoint. Official API references: [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Responses migration and storage](https://developers.openai.com/api/docs/guides/migrate-to-responses).
