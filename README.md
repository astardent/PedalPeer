# Project-PedalPeer

PedalPeer is a peer-to-peer campus bicycle-sharing platform for IIT Bombay. Students list their cycles, other students book them by the hour, and a two-step OTP handover records exactly when each ride starts and ends.

## Contributors:

* Ayan Barman ([astardent](https://github.com/astardent))
* Tejas Itankar ([tejasitankar1103](https://github.com/tejasitankar1103))
* Vamsi Devarapalli ([VforVamsi-13](https://github.com/VforVamsi-13/))

---

## Features

- **Accounts**: sign up with an `@iitb.ac.in` email only. Passwords are bcrypt-hashed and logins use JWT tokens (valid 24 hours).
- **Cycles**: owners list cycles with a price per hour and hostel, mark them available or unavailable, and delete them.
- **Bookings**: renters request a time slot. The server rejects slots that overlap an accepted or active booking, and duplicate requests.
- **OTP handover**:
  1. The owner accepts and gets a start OTP, which they give to the renter at pickup.
  2. The renter enters it to start the ride and gets an end OTP.
  3. At return, the owner enters the end OTP to complete the ride.

  OTPs are stored only as SHA-256 hashes.
- **Fare**: each booking keeps a copy of the hostel and hourly price at the time of booking. On completion the server calculates `total_fare = actual ride hours × price per hour`.
- **Contact details**: once a booking is accepted, the owner and the renter can see each other's email on the dashboard and on the booking pages. Emails are hidden while a request is pending or after it is cancelled.
- **Condition photos (optional)**: the renter can add pre-ride photos while the ride is active. The owner can add post-ride photos within 30 minutes of the ride ending.
- **Ratings (optional)**: after a ride, the renter rates the cycle and the owner rates the renter, 1 to 5 stars. Renters see cycle ratings and reviews when booking. Owners see a renter's rating before accepting.
- **Analysis**: `/analysis` shows the top 10 for six measures, each with a matplotlib chart: most expensive cycles, most rented cycles, highest rated cycles, highest rated renters, costliest fares, and owner acceptance rate. It is not linked from the app; open the URL directly.

---

## Code Organization

The project has three parts: a **Next.js frontend** (`web/`), a **FastAPI backend** (`api/`) and **PostgreSQL schema files** (`db/`). The browser only talks to the backend over JSON; only the backend reads and writes the database and the photo folder.

```
Browser (Next.js pages)  ──►  web/lib/api.ts  ──HTTP + JWT──►  FastAPI (api/main.py)  ──SQL──►  PostgreSQL
                                                                      │
                                                                      └──►  api/uploads/  (photo files)
```

```
PedalPeer/
├── api/                     FastAPI backend
│   ├── main.py              all REST endpoints and booking rules
│   ├── auth.py              password hashing, JWT tokens, current-user check
│   ├── otp.py               OTP generation, hashing and verification
│   ├── database.py          PostgreSQL connection pool
│   ├── analysis.py          /analysis queries and matplotlib charts
│   ├── requirements.txt     Python dependencies
│   └── uploads/             saved condition photos (created at runtime, not in git)
├── db/migrations/           SQL schema, applied in number order
├── web/                     Next.js frontend
│   ├── app/                 one folder per page (App Router)
│   ├── components/          small shared UI pieces
│   └── lib/                 API client and login state
├── meeting-minutes/         team meeting notes
└── README.md
```

### Backend: `api/`

| File | Role |
|---|---|
| `main.py` | The FastAPI app. Sets up CORS, mounts `/uploads` for photos, and defines the Pydantic request models (`UserSignup`, `NewCycle`, `NewBooking`, `OTPSubmit`, `NewReview`). Contains every endpoint: signup/login, cycles, bookings and their status changes (accept, start, complete, cancel), photos and reviews. Enforces the business rules: `@iitb.ac.in` emails, no booking your own cycle, overlap and duplicate checks, who may act at each booking status, the 30-minute post-ride photo window, fare calculation, and when emails are shared. |
| `auth.py` | Security helpers. `hash_password` / `verify_password` use bcrypt; `make_token` creates a 24-hour HS256 JWT; `current_user` is a FastAPI dependency that reads the `Authorization: Bearer` header and rejects missing or expired tokens. |
| `otp.py` | `new_code` makes a 6-digit code with `secrets`; `hash_code` stores it as SHA-256 of booking id, code and `OTP_PEPPER`; `verify_code` compares with `compare_digest`. Only hashes are stored in the database. |
| `database.py` | Loads `DATABASE_URL` from `.env` and creates one shared `psycopg` connection pool. Rows come back as dictionaries. |
| `analysis.py` | A FastAPI router mounted by `main.py`. Holds six SQL queries (each `LIMIT 10`) and `bar_chart()`, which draws a horizontal bar chart with matplotlib and returns it as a base64 PNG. Serves `GET /analysis`. |
| `requirements.txt` | Pinned Python packages: FastAPI, uvicorn, psycopg, bcrypt, PyJWT, python-multipart, matplotlib and their dependencies. |
| `.env` | Local settings (not in git): `DATABASE_URL`, `CORS_ORIGIN`, `JWT_SECRET`, `OTP_PEPPER`. |
| `package.json`, `package-lock.json` | Left over from an early Node/Express plan. Not used by the FastAPI backend. |

Main endpoints in `main.py`:

| Area | Endpoints |
|---|---|
| Health | `GET /health`, `GET /test-db` |
| Users | `POST /signup`, `POST /login`, `GET /me` |
| Cycles | `GET /cycles`, `GET /cycles/mine`, `GET /cycles/{id}`, `GET /cycles/{id}/reviews`, `POST /cycles`, `PATCH /cycles/{id}/toggle`, `DELETE /cycles/{id}` |
| Bookings | `POST /bookings`, `GET /bookings/mine`, `GET /bookings/incoming`, `GET /bookings/active-on-my-cycles`, `GET /bookings/history-on-my-cycles`, `GET /bookings/{id}` |
| Handover | `POST /bookings/{id}/accept`, `/start-otp`, `/start`, `/end-otp`, `/complete`, `/cancel` |
| Photos | `POST /bookings/{id}/photos/{pre\|post}`, `GET /bookings/{id}/photos` |
| Reviews | `POST /bookings/{id}/review` |
| Analysis | `GET /analysis` (in `analysis.py`) |

### Database: `db/migrations/`

Run in number order. Each later file changes the schema with `ALTER TABLE`; earlier files are not edited.

| File | Role |
|---|---|
| `001_init.sql` | `users` table: username, email (both unique), bcrypt password hash. |
| `002_cycles.sql` | `cycles` table: owner, title, description, price per hour, hostel, lat/lng, availability. |
| `003_bookings.sql` | `booking_status` enum and `bookings` table: cycle, renter, booked times, status, hashed start/end OTPs, actual start/end times. |
| `004_condition_ledger.sql` | `condition_ledger` table: pre-ride and post-ride photo records for a booking. |
| `005_reviews.sql` | `reviews` table: 1–5 stars and a comment; one review per side (`cycle` or `renter`) per booking. |
| `006_booking_fare.sql` | Adds `hostel`, `price_per_hour` and `total_fare` to `bookings`, and fills them for existing rows. |

### Frontend: `web/`

**Shared code**

| File | Role |
|---|---|
| `lib/api.ts` | The only place that calls the backend. `req()` sends JSON with the saved JWT; `upload()` sends photos as form data; `errorMessage()` turns API errors into readable text. Exposes `api.cycles.*`, `api.bookings.*`, `api.analysis()` and the auth calls. |
| `lib/auth.tsx` | React context for login state. Keeps the JWT in `localStorage`, loads the current user from `/me` on start, and provides `login()` and `logout()` to every page through `useAuth()`. |
| `components/Rating.tsx` | Shows "★ 4.3 (12)" or "No ratings yet". |
| `components/Contact.tsx` | Shows the other person's email as a mail link, only when the API returns one. |
| `components/Footer.tsx` | A simple footer component. Not currently used by any page. |
| `app/layout.tsx` | Root layout: font, global CSS, and the `AuthProvider` wrapped around every page. |
| `app/globals.css` | Tailwind import and base styles (light theme, readable input colors). |

**Pages** (each folder under `app/` is a URL)

| File | URL | Role |
|---|---|---|
| `app/page.tsx` | `/` | Landing page with Log in and Sign up buttons. |
| `app/signup/page.tsx` | `/signup` | Sign-up form; only `@iitb.ac.in` emails. |
| `app/login/page.tsx` | `/login` | Login form; saves the token and opens the dashboard. |
| `app/dashboard/page.tsx` | `/dashboard` | Home after login: incoming requests, active and completed rides on your cycles, your rentals, fares, contact emails, and available cycles sortable by price or rating. |
| `app/cycles/page.tsx` | `/cycles` | Browse available cycles, filter by hostel, see ratings. |
| `app/cycles/[id]/page.tsx` | `/cycles/{id}` | One cycle: details, rating, past reviews and the booking form. |
| `app/cycles/new/page.tsx` | `/cycles/new` | Form to list a new cycle. |
| `app/my-cycles/page.tsx` | `/my-cycles` | Owner's cycles: mark available or unavailable, delete. |
| `app/bookings/[id]/page.tsx` | `/bookings/{id}` | Renter's booking page: enter the start OTP, show the end OTP, see the owner's contact and the final fare. |
| `app/bookings/[id]/accept/page.tsx` | `/bookings/{id}/accept` | Owner reviews a request (with the renter's rating), accepts or declines, and sees the start OTP. |
| `app/bookings/[id]/complete/page.tsx` | `/bookings/{id}/complete` | Owner enters the end OTP and sees the calculated fare. |
| `app/bookings/[id]/photos/page.tsx` | `/bookings/{id}/photos` | Upload and view condition photos; picks pre or post from your role and the booking status. |
| `app/bookings/[id]/review/page.tsx` | `/bookings/{id}/review` | Rate the cycle (renter) or the renter (owner) after the ride. |
| `app/analysis/page.tsx` | `/analysis` | Charts and tables from `GET /analysis`. Not linked from the app. |
| `app/cycles/[id]/loading.tsx`, `app/bookings/[id]/loading.tsx` | — | Loading screens. Next.js 16 needs these around pages that read the URL id. |

**Configuration**

| File | Role |
|---|---|
| `next.config.ts` | Next.js settings: cache components, Tailwind via Turbopack, allowed dev origins for testing on phones. |
| `package.json`, `package-lock.json` | Frontend dependencies and scripts (`npm run dev`, `npm run build`). |
| `tsconfig.json` | TypeScript settings, including the `@/` import alias. |
| `eslint.config.mjs` | Lint rules. |
| `AGENTS.md` | Generated by `next dev`; notes for AI coding tools about this Next.js version. |
| `.env.local` | Optional `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`). Not in git. |

### Other

| Path | Role |
|---|---|
| `meeting-minutes/meeting00-kickoff.md` | Kickoff meeting: goals, roles and weekly plan. |
| `.gitignore` | Keeps `.env`, `.venv`, `node_modules`, `api/uploads` and build output out of git. |

---

## Prerequisites

Make sure you have the following installed on your machine:
- **Python 3.10+**
- **Node.js 18+** & `npm`
- **PostgreSQL** running locally or in the cloud (e.g. Neon, Supabase)

---

## Setup & Running the Application

### 1. Database Setup
1. Create a PostgreSQL database (e.g., `pedalpeer`).
2. Run the SQL schema files located in `db/migrations/`, in order:
   ```bash
   psql -d <your_database_name> -f db/migrations/001_init.sql
   psql -d <your_database_name> -f db/migrations/002_cycles.sql
   psql -d <your_database_name> -f db/migrations/003_bookings.sql
   psql -d <your_database_name> -f db/migrations/004_condition_ledger.sql
   psql -d <your_database_name> -f db/migrations/005_reviews.sql
   psql -d <your_database_name> -f db/migrations/006_booking_fare.sql
   ```
   If your database already exists, run only the migrations you haven't applied yet. Schema changes go in a new numbered file; existing migration files are not edited.

| Table | Purpose |
|---|---|
| `users` | Accounts (username, email, bcrypt password hash) |
| `cycles` | Listed cycles (owner, title, price per hour, hostel, availability) |
| `bookings` | Rentals: booked and actual times, status, hashed OTPs, copied hostel and price, total fare |
| `condition_ledger` | Pre-ride and post-ride photo records |
| `reviews` | Star ratings: renters rate cycles, owners rate renters |

---

### 2. Backend (FastAPI) Setup

1. Open a terminal in the project root:
   ```bash
   cd api
   ```
2. Create and activate a Python virtual environment (if not already done):
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv ..\.venv
     ..\.venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv ../.venv
     source ../.venv/bin/activate
     ```
3. Install required Python packages (includes `matplotlib` for the analysis charts):
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in `api/.env`:
   ```env
   DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<your_database_name>
   CORS_ORIGIN=http://localhost:3000
   JWT_SECRET=<your_random_secret>
   OTP_PEPPER=<another_random_secret>
   ```
   `JWT_SECRET` signs login tokens and `OTP_PEPPER` is mixed into OTP hashes. Generate a random value for each with:
   ```bash
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```
5. Start the backend API server:
   ```bash
   uvicorn main:app --reload --port 8000 --host 0.0.0.0
   ```
   > The API will be available at: **http://localhost:8000**
   > Interactive API docs (Swagger): **http://localhost:8000/docs**

Uploaded photos are saved in `api/uploads/` and served at `http://localhost:8000/uploads/<file>`.

---

### 3. Frontend (Next.js) Setup

1. Open a separate terminal and navigate to the `web` folder:
   ```bash
   cd web
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm next dev --hotname 0.0.0.0
   ```
   > The web app will be available at: **http://localhost:3000**

---

## Pages

| URL | Who | What it does |
|---|---|---|
| `/signup`, `/login` | Everyone | Create an account (`@iitb.ac.in` only) and log in |
| `/dashboard` | Everyone | Incoming requests, active and completed rides on your cycles, your rentals, available cycles (sortable by price or rating) |
| `/cycles`, `/cycles/[id]` | Renter | Browse by hostel, see ratings and reviews, request a booking |
| `/cycles/new`, `/my-cycles` | Owner | List a cycle, mark it available or unavailable, delete it |
| `/bookings/[id]/accept` | Owner | Accept or decline a request, show the start OTP |
| `/bookings/[id]` | Renter | Enter the start OTP, show the end OTP, see the fare |
| `/bookings/[id]/complete` | Owner | Enter the end OTP, see the fare |
| `/bookings/[id]/photos` | Both | Add and view condition photos |
| `/bookings/[id]/review` | Both | Rate the other side after the ride |
| `/analysis` | Anyone with the URL | Top 10 charts and tables |

---

## Testing the App
Follow these steps to perform an end-to-end check of the system.

### 1. Verify API & Database Health
- Open [http://localhost:8000/health](http://localhost:8000/health) &rarr; Expected: `{"ok":true}`
- Open [http://localhost:8000/test-db](http://localhost:8000/test-db) &rarr; Expected: `{"status": "connected", ...}`

### 2. Sign Up and Log In
1. Open [http://localhost:3000/signup](http://localhost:3000/signup) and create an account with an `@iitb.ac.in` email. Other domains are rejected.
2. Log in at [http://localhost:3000/login](http://localhost:3000/login). You will be taken to `/dashboard`.

### 3. Run a Full Rental
Use two accounts (for example a normal and a private browser window), one as owner and one as renter.
1. **Owner**: list a cycle from `/cycles/new`.
2. **Renter**: open the cycle from `/cycles` and request a time slot.
3. **Owner**: on the dashboard, open the request and click **Accept**. Note the start OTP. Both sides can now see each other's email.
4. **Renter**: open the booking from **My Rentals**, enter the start OTP, and note the end OTP. Optionally add pre-ride photos.
5. **Owner**: click **Complete** on the active ride and enter the end OTP. The total fare is shown.
6. **Both**: optionally add post-ride photos (owner, within 30 minutes) and rate each other.
7. Open [http://localhost:3000/analysis](http://localhost:3000/analysis) to see the ride reflected in the charts.
