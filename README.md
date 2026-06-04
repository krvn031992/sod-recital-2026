# Recital Ticketing Site

A premium, purple-and-gold ticket registration site for the recital.
Static front-end (hosted free on **GitHub Pages**) + a **Google Sheets**
backend (free) for tracking registrations and exporting payments.

## What it does
- VIP & General Admission tiers (prices, entry times, seat counts)
- Per-student ticket limit (default 4) — editable
- Manual payment via **GCash, BDO, BPI** with reference no. + **required proof-of-payment upload**
- Open / close registration switch
- **Auto-confirmation email** sent to each buyer on submit
- Every registration logged to a Google Sheet → one-click export
- **Password-protected admin dashboard** (`admin.html`) to review payments,
  open each proof of payment, mark Confirmed/Rejected, and see live
  revenue + seat totals
- All key settings editable in the Sheet, no code changes needed

---

## Setup

### Step 1 — Connect the Google Sheet (backend)
1. Create a new **Google Sheet**.
2. **Extensions → Apps Script**. Delete the sample code.
3. Paste in everything from `google-apps-script.gs`. **Save**.
   Then change `ADMIN_KEY = "CHANGE-THIS-PASSWORD"` near the top to your
   own secret password (this is your admin dashboard login).
4. Pick the `setup` function in the toolbar and click **Run** once
   (authorize when prompted). This builds 3 tabs: **Config**, **Tiers**,
   **Registrations**.
5. **Deploy → New deployment → Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   - Click **Deploy** and copy the **Web app URL**.
6. Open `config.js` and paste that URL into `apiUrl: ""`.

### Step 2 — Fill in your details
Edit `config.js` and replace any remaining `TODO`:
confirm the GCash/BDO/BPI account names, and your exact Facebook/Instagram URLs.

### Step 3 — Publish on GitHub Pages
1. Create a new repository on GitHub named **`sod-recital-2026`**.
2. Upload all files (`index.html`, `admin.html`, `styles.css`, `app.js`,
   `admin.js`, `config.js`, `logo.svg`).
3. Repo **Settings → Pages → Source: `main` branch / root → Save**.
4. Your site goes live at `https://krvn031992.github.io/sod-recital-2026/`.

---

## Running it day-to-day (no code needed)
Open your Google Sheet:
- **Config tab** — flip `salesOpen` to `TRUE` to open sales, change the
  ticket limit, total capacity, event name/date/venue.
- **Tiers tab** — edit prices, entry times, seat allocations, or add a new
  tier (just add a row with a unique `id`).
- **Registrations tab** — every order appears here. Set the **Status**
  column to `Confirmed`, `Pending`, `Rejected`, or `Cancelled`.
  Rejected/Cancelled rows free their seats back up automatically.

## Admin dashboard (check & track payments)
Go to `https://krvn031992.github.io/sod-recital-2026/admin.html` and log in
with your `ADMIN_KEY` password. From there you can:
- See live totals — orders, confirmed vs pending revenue, seats sold per tier
- Search/filter every registration
- Open each buyer's **proof of payment**
- Change a status to **Confirmed / Rejected / Cancelled** (writes back to the
  Sheet; Rejected/Cancelled free the seats again)
- **Export CSV** of all payments with one click

The admin page is not linked from the public site and is password-gated,
but treat the URL as semi-private and keep your `ADMIN_KEY` strong.

## Exporting payments
From the **admin dashboard**: click **Export CSV**.
Or from the Sheet: **File → Download → Microsoft Excel (.xlsx)** or **CSV**.

## Preview locally
With `apiUrl` left blank, the site runs in **preview mode** using the
defaults in `config.js` (submissions are logged to the browser console,
not saved). Fill in `apiUrl` to go live.
