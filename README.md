# Mwenye-Nyumba 🏢
> **Property Management System for Family Rental Businesses**

Mwenye-Nyumba ("Landlord" in Swahili) is a modern property management web application tailored for managing residential and commercial properties, units, tenant leases, automated rent billing, M-Pesa payment tracking, and tenant maintenance requests.

---

## 🚀 Tech Stack

- **Backend:** Python 3.10+, FastAPI, PostgreSQL / SQLite (async with SQLAlchemy 2.0 & `asyncpg` / `aiosqlite`), Pydantic v2, Alembic for migrations, Passlib (bcrypt), PyJWT.
- **Frontend:** TypeScript, React 19, Vite, Tailwind CSS, Lucide Icons, Motion.
- **Security:** Strict server-side Role-Based Access Control (RBAC) separating **Admin** and **Tenant** portals, JWT Bearer access & refresh tokens, password hashing with bcrypt, sanitized responses (passwords never exposed).

---

## 📁 Project Structure

```text
├── app/
│   ├── core/
│   │   ├── config.py         # App settings & env loading
│   │   ├── database.py       # Async SQLAlchemy session engine
│   │   ├── security.py       # Bcrypt hashing & JWT token generators
│   │   └── dependencies.py   # Auth dependencies & RBAC permission guards
│   ├── models/
│   │   ├── base.py           # SQLAlchemy Base and timestamp mixin
│   │   ├── user.py           # User authentication & roles (Admin, Tenant)
│   │   ├── property.py       # Real estate property listings
│   │   ├── unit.py           # Individual rental units & occupancy status
│   │   ├── tenant.py         # Leases, contacts & tenant credentials
│   │   ├── payment.py        # Rent payments, M-Pesa/Bank references, status
│   │   └── maintenance.py    # Repair tickets & status workflows
│   ├── schemas/              # Pydantic v2 input/output validation models (auth, invite codes, ...)
│   ├── routers/              # API Endpoints (/auth, /properties, /units, /tenants, /payments, /maintenance)
│   └── main.py               # FastAPI application setup & CORS
├── alembic/                  # Database migration scripts
│   ├── versions/
│   │   └── 001_initial_schema.py
│   └── env.py
├── seed.py                   # Realistic demo dataset seeder
├── requirements.txt          # Python dependencies
├── src/                      # React TypeScript Frontend
│   ├── components/           # UI Components (Admin & Tenant views, Modals, Forms)
│   ├── types.ts              # TypeScript interfaces matching backend schemas
│   ├── lib/api.ts            # Real API client with token refresh
│   └── App.tsx               # Main application layout with role switching
└── README.md
```

---

## ⚙️ Backend Setup Instructions

### 1. Prerequisites
- Python 3.10+
- PostgreSQL (or use the built-in SQLite async mode for quick local development)
- Node.js 18+ and npm

### 2. Create and Activate Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` to configure your database connection string and secret key:
```env
# PostgreSQL Example:
DATABASE_URL="postgresql+asyncpg://postgres:yourpassword@localhost:5432/mwenyenyumba"

# Or SQLite Async Example (Zero-config local testing):
# DATABASE_URL="sqlite+aiosqlite:///./mwenyenyumba.db"

SECRET_KEY="your-super-secret-random-key-here"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS="http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000"
```

### 5. Run Database Migrations
If using PostgreSQL or managing revisions:
```bash
alembic upgrade head
```

### 6. Seed Demo Data (development only)
seed.py drops all tables and refuses to run when ENVIRONMENT=production.

Populate realistic properties (Kilimani Heights, Mombasa Road Court, Karen Green Villas), units, tenant accounts, payments (Paid, Pending, Overdue), and maintenance requests:
```bash
python seed.py
```

### 7. Start the FastAPI Backend Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger API documentation will be available at:
👉 `http://localhost:8000/api/v1/docs`

---

## 💻 Frontend Setup Instructions

### 1. Install Node Dependencies
```bash
npm install
```

### 2. Start the Frontend Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000` (or `http://localhost:5173`).

---

## 🔐 Demo Accounts (created by seed.py in development only)

| Role | Email | Password | Assigned Unit / Description |
| :--- | :--- | :--- | :--- |
| **Landlord / Admin** | `admin@mwenyenyumba.com` | `admin123` | Full access across all properties, units, leases, financials |
| **Tenant** | `tenant.john@mwenyenyumba.com` | `tenant123` | Kilimani Heights — Apt 101 |
| **Tenant** | `tenant.mary@mwenyenyumba.com` | `tenant123` | Kilimani Heights — Apt 102 (Overdue rent demo) |
| **Tenant** | `tenant.david@mwenyenyumba.com` | `tenant123` | Mombasa Road Court — Unit B1 |
| **Tenant** | `tenant.grace@mwenyenyumba.com` | `tenant123` | Karen Green Villas — Villa #1 |

---

## 🛡️ Role-Based Access Control Rules
- **Admin**: Full CRUD permissions on properties, units, tenants, invoices, and maintenance tickets.
- **Tenant**: Access restricted to own lease, unit information, own payment history, and own maintenance requests.
- **Security Guarantee**: Attempting to access another tenant's unit, payment, or maintenance ticket by guessing an ID returns a strict `403 Forbidden` response (preventing ID enumeration and data leakage).


---

## 🚢 Production Deployment

### Required environment variables
| Variable | Notes |
| :--- | :--- |
| `ENVIRONMENT` | Set to `production`. Enables startup checks and disables `/docs`. |
| `SECRET_KEY` | At least 32 random characters. The app refuses to start with the dev default. |
| `DATABASE_URL` | PostgreSQL. `postgres://` and `postgresql://` URLs from Neon or Supabase are converted to asyncpg automatically, and `sslmode=require` becomes `ssl=require`. |
| `CORS_ORIGINS` | Comma separated exact frontend origins, for example `https://app.example.com`. No wildcard. |
| `TIMEZONE` | Used to decide when rent becomes overdue. Defaults to `Africa/Dar_es_Salaam`. |

### First deploy
```bash
alembic upgrade head
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' python create_admin.py
```
Do not run `seed.py` in production. Tables are created only by Alembic migrations in production. In development the API creates missing tables on startup.

If your database already has tables that were created by an older version of this project (no `alembic_version` table), run `alembic stamp 001_initial_schema` once before `alembic upgrade head`, otherwise Alembic tries to create tables that already exist.

### Tenant onboarding
The admin creates an invite code for a vacant unit with `POST /api/v1/invite-codes`. The tenant registers at `POST /api/v1/auth/register` with that code. Codes are single use and expire after `INVITE_CODE_EXPIRE_DAYS`. Public registration can only ever create tenants.

### Built-in protections
- Pending rent turns overdue automatically after its due date. The check runs at startup and every `OVERDUE_CHECK_HOURS` (default 6).
- 5 wrong passwords for one account, or 30 from one address, blocks logins for 15 minutes. Invite-code guessing is limited to 10 tries per hour per address. These limits are kept in memory, so run one API process or add limits at your proxy as well.
- Money is stored as exact `NUMERIC(12,2)` values.

### Health checks
`GET /health` for liveness and `GET /health/ready` for readiness (checks the database).

### Tests
```bash
pip install -r requirements-dev.txt
pytest
```


---

## 🖥️ Frontend

The frontend talks to the real API. Landlords see Overview, Properties, Tenants, Rent and Repairs. Tenants see My home, Rent and Repairs. Tenants join with an invite code at `#/register?code=XXXXXXXX`.

```bash
npm install
npm run dev
```
The dev server runs on port 3000 and proxies `/api` to `http://localhost:8000`.

| Variable | Notes |
| :--- | :--- |
| `VITE_API_URL` | API base. Leave as `/api/v1` when a reverse proxy serves frontend and API on one domain, otherwise use the full URL such as `https://api.example.com/api/v1`. The API's `CORS_ORIGINS` must then include the frontend origin. |
| `VITE_CURRENCY` | Label shown before amounts. Defaults to `TSh`. |

Build with `npm run build` and serve the `dist` folder from any static host. Routing uses the URL hash, so no server rewrite rules are needed.
