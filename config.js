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
  apiUrl: "https://script.google.com/macros/s/AKfycbzTXxQKntiR0KjusYF0sBoc1lfrc1rT36IXWsBrOP0MkSNca9CzsUIQEjrJqFZyFMNxxw/exec",

  /* ---- Event details (TODO: confirm) ---- */
  org: "State of Dance",
  eventName: "Fantasy — A Decade of Non-Stop Moving",
  eventDate: "June 28, 2026 · 7:00 PM",
  venue: "Aliw Theater",
  venueAddress: "CCP Complex, Pasay City",
  currency: "₱",                // Philippine Peso

  /* ---- Branches (TODO: replace with your real branch names) ---- */
  branches: ["Main Branch", "Branch 2", "Branch 3"],

  /* ---- Seat map ---- */
  seatMap: {
    image: "assets/seatmap.png",   // Aliw Theater overview (reference)
    vipChooseSeats: true,          // VIP buyers click their seats
    // VIP seating grid (rows x seatsPerRow should total your VIP capacity).
    // 15 rows x 20 = 300 VIP seats. Adjust to match the real Aliw VIP zone.
    vipLayout: {
      sectionLabel: "VIP · Orchestra",
      rows: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"],
      seatsPerRow: 20
    }
  },

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
      enabled: true,
      label: "Flowers for the Dancer",
      note: "Choose a flower design to be handed to your dancer on stage.",
      maxQty: 10,
      // TODO: edit these designs/prices, and add an image per design (assets/...)
      options: [
        { id: "rose",    name: "Single Rose",     price: 150, image: "" },
        { id: "bouquet", name: "Bouquet",         price: 350, image: "" },
        { id: "premium", name: "Premium Bouquet", price: 650, image: "" }
      ]
    },
    shirt: {
      enabled: true,
      label: "Event T-Shirt",
      price: 750,
      note: "Fantasy 2026 souvenir shirt.",
      image: "assets/shirt.png",                                  // drop your shirt photo here
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
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
