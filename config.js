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
  apiUrl: "https://script.google.com/macros/s/AKfycbzJtl1ooMcyw6xfNK5hkG_iDtB-4IJ4FnGQRx5gt0x0OOPuEQsTxqXD4zGBNfRP_h8W-g/exec",

  /* ---- Event details (TODO: confirm) ---- */
  org: "State of Dance",
  eventName: "Fantasy — A Decade of Non-Stop Moving",
  eventDate: "June 28, 2026 · 7:00 PM",
  venue: "Aliw Theater",
  venueAddress: "CCP Complex, Pasay City",
  currency: "₱",                // Philippine Peso

  /* ---- Branches ---- */
  branches: ["BGC", "Manila", "Quezon City"],

  /* ---- Seat map ---- */
  seatMap: {
    image: "assets/seatmap.png",   // original Aliw Theater seating plan
    vipChooseSeats: true           // VIP buyers type their Row + Seat number
  },

  /* ---- Editable settings (Config tab overrides these) ---- */
  salesOpen: false,                  // open/close registration
  ticketLimitPerStudent: 5,          // max tickets per student
  totalCapacity: 1275,               // total seats in the theatre

  /* ---- Ticket tiers (Tiers tab overrides these) ----
     allocation values should add up to totalCapacity.                    */
  tiers: [
    {
      id: "vip",
      name: "VIP",
      price: 2595,
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

  /* ---- Optional add-on upsells ----
     Editable here. Set enabled:false to hide any of them.                 */
  addons: {
    shoutout: {
      enabled: true,
      label: "Dancer Shout-out",
      price: 200,
      note: "We'll display your cheer for the dancer during the show.",
      maxQty: 5
    },
    flowers: {
      enabled: false              // removed
    },
    shirt: {
      enabled: true,
      label: "Event T-Shirt",
      price: 750,
      note: "Official Fantasy 2026 souvenir shirt — see the size chart below.",
      image: "assets/shirt.png",
      sizeChart: "assets/shirt-sizes.png",
      sizes: ["Kids 12", "Kids 14", "Kids 16", "Kids 18", "S", "M", "L", "XL", "2XL"],
      maxQty: 10
    }
  },

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
