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
  org: "State of Dance",
  eventName: "Fantasy — A Decade of Non-Stop Moving",
  eventDate: "June 28, 2026 · 7:00 PM",
  venue: "Aliw Theater",
  venueAddress: "CCP Complex, Pasay City",
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
      allocation: 300                // 300 VIP seats only
    },
    {
      id: "genad",
      name: "General Admission",
      price: 1295,
      entry: "Doors open after VIP",
      note: "Open seating",
      allocation: 975                // 1275 total − 300 VIP
    }
  ],

  /* ---- Payment accounts (manual transfer) (TODO) ---- */
  payments: {
    gcash: { name: "Kervin Will E. Mendiola", number: "0906 099 4503" },
    bdo:   { bank: "BDO", name: "Kervin Will E. Mendiola", number: "0023 8027 6338" },
    bpi:   { bank: "BPI", name: "Kervin Will E. Mendiola", number: "3119 2606 84" }
  },

  /* ---- Contact (social media) ---- */
  socials: {
    facebook:  "https://www.facebook.com/stateofdancestudio",   // TODO: confirm exact page URL
    instagram: "https://www.instagram.com/stateofdancestudio"   // TODO: confirm exact handle
  }
};
