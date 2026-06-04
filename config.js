/* =====================================================================
   SOD RECITAL — SITE CONFIG
   ---------------------------------------------------------------------
   These are FALLBACK defaults. Once you connect the Google Sheet,
   the values inside the sheet's "Config" and "Tiers" tabs take over,
   so you can change prices / limits / open-close WITHOUT editing code.

   Fill in the TODO items below, then this file is mostly set-and-forget.
   ===================================================================== */
window.SOD_CONFIG = {
  /* ---- Google Sheets backend ----
     Paste your deployed Apps Script Web App URL here (see README, Step 2).
     Leave "" to preview the site locally with the defaults below.        */
  apiUrl: "",

  /* ---- Event details (TODO: confirm) ---- */
  org: "School of Dance",            // TODO: your studio / school name
  eventName: "Annual Recital 2026",  // TODO: recital title
  eventDate: "TBA",                  // TODO: e.g. "August 30, 2026"
  venue: "The New Theatre",          // TODO: venue name
  venueAddress: "",                  // TODO: address (optional)
  currency: "₱",                // Philippine Peso

  /* ---- Editable settings (Config tab overrides these) ---- */
  salesOpen: false,                  // open/close registration
  ticketLimitPerStudent: 4,          // max tickets per student
  totalCapacity: 1275,               // total seats in the theatre

  /* ---- Ticket tiers (Tiers tab overrides these) ----
     allocation values should add up to totalCapacity.                    */
  tiers: [
    {
      id: "vip",
      name: "VIP",
      price: 2295,
      entry: "Early entry 5:00 PM",
      note: "Reserved seating · priority entry",
      allocation: 300                // TODO: how many VIP seats?
    },
    {
      id: "genad",
      name: "General Admission",
      price: 1295,
      entry: "Doors open after VIP",
      note: "Open seating",
      allocation: 975                // TODO: balances to total capacity
    }
  ],

  /* ---- Payment accounts (manual transfer) (TODO) ---- */
  payments: {
    gcash: { name: "TODO: GCash account name", number: "TODO: 0917 000 0000" },
    bdo:   { bank: "BDO", name: "TODO: account name", number: "TODO: BDO account no." },
    bpi:   { bank: "BPI", name: "TODO: account name", number: "TODO: BPI account no." }
  },

  /* ---- Contact ---- */
  contactEmail: "TODO: you@email.com",
  contactPhone: ""
};
