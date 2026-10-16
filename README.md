# Project-PedalPeer

PedalPeer is a peer-to-peer campus bicycle-sharing platform.

## Contributors:

* Ayan Barman ([astardent](https://github.com/astardent))
* Tejas Itankar ([tejasitankar1103](https://github.com/tejasitankar1103))
* Vamsi Devarapalli ([VforVamsi-13](https://github.com/VforVamsi-13/))

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
2. Run the SQL schema files located in `db/migrations/`:
   ```bash
   # Run against your PostgreSQL instance:
   psql -d <your_database_name> -f db/migrations/001_init.sql
   psql -d <your_database_name> -f db/migrations/002_cycles.sql
   ```

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
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   Ensure `api/.env` exists and contains your database connection string:
   ```env
   DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<your_database_name>
   CORS_ORIGIN=http://localhost:3000
   ```
5. Start the backend API server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   > The API will be available at: **http://localhost:8000**  
   > Interactive API docs (Swagger): **http://localhost:8000/docs**

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
