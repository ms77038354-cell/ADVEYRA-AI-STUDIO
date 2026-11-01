# ADVEYRA AI STUDIO — Gemini Edition

A private, single-admin AI coding workspace. Gemini can create and edit text project files through explicit file tools. The application includes a file browser/editor, static HTML preview, diagnostics, GitHub push, ZIP export, and basic file/folder management.

## Requirements
- Node.js 20+
- A Google Gemini API key with access to the selected model

## Environment variables
Required:
- `ADMIN_USERNAME` — admin login name
- `ADMIN_PASSWORD_HASH` — bcrypt hash of the admin password (never store plaintext here)
- `SESSION_SECRET` — random secret, at least 32 characters
- `GEMINI_API_KEY` — Google AI Studio API key

Optional:
- `GEMINI_MODEL` — model ID supported by your API project (default: `gemini-3.1-flash-lite`)
- `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` — GitHub push integration; branch defaults to `main`

Do not commit `.env` or API keys. Add secrets in Render Environment settings.

## Run locally
```bash
npm install
npm start
```
Open `http://localhost:10000`.

## Render deployment
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Add the required environment variables above.
- Connect the GitHub repository and enable Auto-Deploy.
- Add `adveyra.online` as a Custom Domain in the Render service settings and follow Render's DNS instructions at your domain registrar. HTTPS is provisioned by Render after DNS verification.

## Included capabilities
- Admin login using bcrypt password hash and signed HTTP-only session cookie
- Gemini chat with function calling for listing, reading, and writing project files
- File browser/editor, create file/folder, rename and delete file
- Automatic pre-change file copies in `.adveyra-backups` (within the running instance)
- Static HTML preview in a sandboxed iframe
- Environment diagnostics (does not reveal secret values)
- GitHub commit push and ZIP export
- Health endpoint at `/api/health`

## Important limitations and production notes
- This is not yet a full Google AI Studio clone. It does **not** provide unrestricted shell/terminal execution, arbitrary dependency installation, a multi-language runtime sandbox, React/Node live preview, mobile app compilation, or one-click provisioning of arbitrary production servers. Do not expose unrestricted shell access on a public service without a hardened isolated container and strict resource/network controls.
- The Preview feature runs static HTML only. Backend applications need a separately provisioned runtime/deployment target.
- File backups and workspace files live on the service filesystem. Render's default filesystem may be ephemeral across restarts/redeploys. For durable projects, attach a persistent disk or move project storage to durable object/database storage before relying on it.
- Gemini free-tier quotas and model availability depend on Google's current account, region, and project limits. A quota error cannot be bypassed by code.
- GitHub push uploads workspace files as a commit. Configure a fine-grained token with minimum required repository Contents write permission.
- Before production use, rotate any credentials previously shared in chat and use a unique strong `SESSION_SECRET`.

## Basic verification
```bash
node --check server.js
node --check public/app.js
```
Use the in-app Diagnostics button after deployment. A green configuration check does not prove that an external Gemini or GitHub request succeeds; send a test prompt and perform a test push to verify those integrations.
