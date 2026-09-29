**Cloud-hosted demo build** (using Next.js on Vercel, Node/FastAPI on Render, free Supabase PostGIS, and Cloudflare R2 / Supabase Storage) with a **Simulated IITB SSO / Domain-Gated Auth** pipeline.

---

### Team Roles & Cloud Ownership

* **Developer 1 (Dev 1) — Backend, Auth & DB Lead**
* **Core Stack:** Express/FastAPI, Supabase (PostgreSQL + PostGIS), Render.
* **Focus:** Database schemas, simulated IITB SSO / Google `@iitb.ac.in` auth, booking state machine, OTP validation.


* **Developer 2 (Dev 2) — Frontend & Mobile PWA Lead**
* **Core Stack:** Next.js (PWA), Tailwind CSS, Vercel.
* **Focus:** Mobile UI/UX, browser camera capture, handoff modals, state integration on phone viewports.


* **Developer 3 (Dev 3) — Cloud Infrastructure, Storage & Integration**
* **Core Stack:** Cloudflare R2 / Supabase Storage, PostGIS spatial search, Vercel/Render deployment pipelines.
* **Focus:** Geo-proximity APIs, photo storage ledger, end-to-end cloud pipeline, live demo prep.



---

## 4+ Week Workload Breakdown

### Week 1: Cloud Foundation, Database & Simulated Auth Setup

**Goal:** Provision free cloud services, deploy initial backend and frontend to public HTTPS URLs, and establish student authentication.

| Member                      | Primary Responsibilities                                                                                                                                                                                      | Deliverables                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Dev 1** *(Backend)*       | Create Supabase project; enable PostGIS extension; write migration scripts (`users`, `cycles`, `bookings`, `condition_ledger`); build **Simulated IITB SSO** auth endpoints (`/auth/login-mock`, `/auth/me`). | Working database schema on Supabase; deployed backend on Render returning valid JWTs for `@iitb.ac.in` test accounts. |
| **Dev 2** *(Frontend)*      | Initialize Next.js PWA template; configure Tailwind CSS; deploy to Vercel; build responsive mobile layout, login page (IITB SSO styling), and navigation bar.                                                 | Live Vercel web URL (`pedalpeer-demo.vercel.app`) with responsive UI viewable on mobile phone browsers.               |
| **Dev 3** *(Cloud/Storage)* | Set up Cloudflare R2 bucket or Supabase Storage for cycle images; configure CORS headers for cross-origin uploads; build basic cycle management APIs (`POST /cycles`, `GET /cycles`).                         | Working cloud storage bucket; functional cycle creation endpoints connected to Supabase DB.                           |

---

### Week 2: Core Rental Engine & Photo Ledger

**Goal:** Implement booking state transitions, OTP handoffs, and camera image storage on the cloud backend.

| Member                      | Primary Responsibilities                                                                                                                                                           | Deliverables                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Dev 1** *(Backend)*       | Build rental state machine (`REQUESTED` $\rightarrow$ `ACTIVE` $\rightarrow$ `COMPLETED`); build 4-digit OTP generation (`start_otp`, `end_otp`) and handoff validation endpoints. | Complete transaction workflow APIs (`/bookings/request`, `/bookings/start`, `/bookings/complete`) deployed on Render. |
| **Dev 2** *(Frontend)*      | Build "List Your Cycle" form; build Borrower OTP screen; build Owner OTP input modal for key handoff.                                                                              | Functional listing forms and interactive handoff screens connected to live backend APIs.                              |
| **Dev 3** *(Cloud/Storage)* | Build backend photo ledger upload route; integrate direct-to-cloud photo upload pipeline; implement photo metadata linkage to `condition_ledger` table.                            | Multi-photo upload API pipeline saving pre/post-rental condition photos to Cloudflare R2/Supabase Storage.            |

---

### Week 3: Mobile Camera Integration, Spatial Search & End-to-End Wiring

**Goal:** Enable native phone camera capture, hostel proximity search, and connect all frontend screens to live cloud APIs.

| Member | Primary Responsibilities | Deliverables |
| --- | --- | --- |
| **Dev 1** *(Backend)* | Write PostGIS spatial queries; implement hostel dropdown filtering and radius search endpoint (`GET /cycles/search?hostel=H12&radius=500`). | Proximity and hostel-filtered cycle search API running on Supabase + Render. |
| **Dev 2** *(Frontend)* | Implement native browser camera access (`` or HTML5 Canvas) for capturing bike condition photos on mobile phones; build photo preview page. | Working mobile phone camera workflow uploading photos directly from mobile browsers during key handoff. |
| **Dev 3** *(Cloud/Storage)* | Connect frontend search, booking request, and ledger screens to Dev 1 & Dev 3 backend endpoints; handle JWT session persistence in local storage/cookies. | Complete user workflow operating end-to-end between two mobile phones on public cloud URLs. |

---

### Week 4: Polishing, Edge Cases & Live Presentation Demo Prep

**Goal:** Handle error states, optimize for two-phone live demonstration, and conduct practice demo runs.

| Member | Primary Responsibilities | Deliverables |
| --- | --- | --- |
| **Dev 1** *(Backend)* | Add cancellation routes, automatic booking timeouts (expire unfulfilled requests after 30 mins), and dispute flagging APIs. | Robust backend API with error-handling edge cases in place. |
| **Dev 2** *(Frontend)* | Add active booking status banner, dispute reporting UI, offline-ready toast alerts, and final mobile UI polishing. | Polished mobile PWA optimized for seamless touch interactions during the live demo. |
| **Dev 3** *(Cloud/Storage)* | Pre-populate database with realistic test data (5–10 sample cycles across Hostel 12, Hostel 18, Tansa); manage multi-device testing; lead dry-run demos. | Verified live demo environment ready for presentation day with two smartphones. |

---
### Post Week 4
Debugging and presentation work