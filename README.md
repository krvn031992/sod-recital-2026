# Recital Ticketing Site

A premium, purple-and-gold ticket registration site for the recital.
Static front-end (hosted free on **GitHub Pages**) + a **Google Sheets**
backend (free) for tracking registrations and exporting payments.

## What it does
- VIP & General Admission tiers (prices, entry times, seat counts)
- Per-student ticket limit (default 4) — editable
- Manual payment via **GCash, BDO, BPI** with reference no. + receipt upload
- Open / close registration switch
- Every registration logged to a Google Sheet → one-click export
- All key settings editable in the Sheet, no code changes needed

---

## Setup

### Step 1 — Connect the Google Sheet (backend)
1. Create a new **Google Sheet**.
2. **Extensions → Apps Script**. Delete the sample code.
3. Paste in everything from `google-apps-script.gs`. **Save**.
4. Pick the `setup` function in the toolbar and click **Run** once
   (authorize when prompted). This builds 3 tabs: **Config**, **Tiers**,
   **Registrations**.
5. **Deploy → New deployment → Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   - Click **Deploy** and copy the **Web app URL**.
6. Open `config.js` and paste that URL into `apiUrl: ""`.

### Step 2 — Fill in your details
Edit `config.js` and replace every `TODO`:
event name/date/venue, GCash/BDO/BPI account names & numbers, contact email.

### Step 3 — Publish on GitHub Pages
1. Create a new repository on GitHub (e.g. `recital-tickets`).
2. Upload these files (`index.html`, `styles.css`, `app.js`, `config.js`).
3. Repo **Settings → Pages → Source: `main` branch / root → Save**.
4. Your site goes live at `https://<username>.github.io/recital-tickets/`.

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

## Exporting payments
In the Sheet: **File → Download → Microsoft Excel (.xlsx)** or **CSV**.
That's your full payment/registration export.

## Preview locally
With `apiUrl` left blank, the site runs in **preview mode** using the
defaults in `config.js` (submissions are logged to the browser console,
not saved). Fill in `apiUrl` to go live.
