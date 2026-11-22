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
   uvicorn main:app --reload --port 8000
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
   npm run dev
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
