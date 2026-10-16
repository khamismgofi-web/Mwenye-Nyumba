# Mwenye Nyumba

Property management for landlords who still use a notebook. Landlords keep their properties, units (with real photos), tenants, rent, repairs, plans, budgets and expenses in one place. Tenants report problems in the app and the landlord is told by SMS and email with the heading **Message from tenant**.

## How accounts are separated

- A **landlord account** is a household. It owns its properties, and everything under them (units, tenants, rent, repairs, invite codes, notebook entries) belongs to that household only. One landlord can never read or change another landlord's data. This is enforced on every endpoint and covered by tests.
- A **tenant account** belongs to exactly one unit in exactly one household. It is created from a one-time invite code that a landlord makes for that unit. A tenant sees only their own unit, rent and repairs.
- Nobody can make themselves a landlord. Landlord sign-up needs a secret code (`LANDLORD_SIGNUP_CODE`) that you give only to people you trust. If the variable is empty, landlord sign-up is switched off completely.
- There are no built-in or demo accounts.

## Launch checklist

1. **Database.** Create a PostgreSQL database (Neon). If it already holds test data or an old `admin@mwenyenyumba.com` account, empty it with `python wipe_data.py` or create a fresh database. Never keep the old demo accounts, their passwords were public.
2. **Photo storage.** Create a bucket with any S3 compatible service (Cloudflare R2, Backblaze B2, Supabase Storage, AWS S3) and an access key. Keep the bucket private. Photos are stored only there, the database keeps just a file name.
3. **Email alerts.** Get SMTP details from any provider (Brevo, Resend, Gmail app password).
4. **SMS alerts (optional).** Create an Africa's Talking account and API key. SMS needs the landlord's phone number with country code.
5. **Deploy the API** from the `Dockerfile` (Render, Railway, Fly). Set the variables below. The container runs database migrations on every start.
6. **Create the first landlord.** Either open `/#/landlord` and sign up with your `LANDLORD_SIGNUP_CODE`, or run `python create_admin.py` on the server. When all your landlords have accounts, remove `LANDLORD_SIGNUP_CODE` to close sign-up.
7. **Deploy the frontend.** Run `VITE_API_URL=https://your-api/api/v1 npm run build` and upload the `dist` folder to Netlify, Vercel or Cloudflare Pages. Add the frontend address to `CORS_ORIGINS` on the API.
8. **Check it.** Sign up, add a property and a unit, take a photo, invite yourself as a tenant with a second email, report a repair, and confirm the SMS and email arrive.

## Environment variables (API)

| Variable | Required | Notes |
| :--- | :--- | :--- |
| `ENVIRONMENT` | yes | `production`. The API refuses to start with unsafe settings. |
| `DATABASE_URL` | yes | PostgreSQL URL. Neon and Supabase URLs work as given. |
| `SECRET_KEY` | yes | 32+ random characters: `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `CORS_ORIGINS` | yes | Exact frontend addresses, comma separated. |
| `PUBLIC_APP_URL` | yes | Frontend address, used for links in emails. |
| `LANDLORD_SIGNUP_CODE` | for sign-up | 12+ characters. Leave empty to close landlord sign-up. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | for email | `SMTP_STARTTLS=true` by default. |
| `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID` | for SMS | Sender ID is optional. |
| `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT_URL`, `S3_REGION` | for photos | R2 endpoint looks like `https://<account>.r2.cloudflarestorage.com` with region `auto`. |
| `TIMEZONE` | no | Default `Africa/Dar_es_Salaam`. Decides when rent becomes overdue. |

Anything left unset is switched off safely: no email means no email alerts, no storage means photo upload says it is not set up. Tenant reports always appear on the landlord's Repairs page.

## Frontend variables

`VITE_API_URL` is the API address ending in `/api/v1` (leave `/api/v1` if one domain serves both). `VITE_CURRENCY` is the label before amounts (default `TSh`).

## Tools for the person running the service

- `python create_admin.py` creates a landlord account.
- `python reset_password.py someone@example.com` sets a new password for any account.
- `python wipe_data.py` deletes every row after you type the database host. It does not touch photos in the bucket.

## Local development

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload
npm install && npm run dev
pytest
```
The API creates tables itself when not in production. Create your landlord with `python create_admin.py` or set `LANDLORD_SIGNUP_CODE` and use `/#/landlord`. If a database was made by an older version of this project, run `alembic stamp 001_initial_schema` once before `alembic upgrade head`.

## Known limits

- No self-service "forgot password". Landlords reset tenant passwords on the Tenants page, and the service runner uses `reset_password.py` for landlords.
- Emails are not verified at sign-up.
- Login and sign-up attempt limits are kept in memory, so run a single API process or add limits at your proxy as well.
- SMS delivery uses Africa's Talking and was tested against a stand-in server, not the live service. Test with your own number before relying on it.
- Photo links expire after one hour. A page left open for hours shows broken pictures until it is refreshed.
