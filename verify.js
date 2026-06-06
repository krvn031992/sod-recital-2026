/* =====================================================================
   STATE OF DANCE — TICKET CHECK-IN (verify.html)
   Scanned at the venue. Looks up an order by its ID and shows the
   buyer, seats, totals, and live payment status.
   ===================================================================== */
(function () {
  "use strict";
  var CFG = window.SOD_CONFIG || {};
  var card = document.querySelector("[data-card]");
  var peso = function (n) { return "₱" + Number(n || 0).toLocaleString("en-PH"); };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function qs(k) {
    return new URLSearchParams(location.search).get(k) || "";
  }

  var id = qs("id");
  if (!id) { msg("No ticket ID in this link."); return; }

  if (!CFG.apiUrl) {
    // Preview (backend not connected yet)
    render({
      orderId: id, status: "Pending", buyerName: "(preview)", studentName: "(preview)",
      studentBranch: "", tier: "VIP", seats: "G12, G13", qty: 2, addons: "1 × Shout-out",
      total: 4790, payMethod: "gcash", email: "", phone: ""
    }, true);
    return;
  }

  fetch(CFG.apiUrl + "?action=verify&id=" + encodeURIComponent(id))
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res && res.ok && res.order) render(res.order, false);
      else msg("Ticket not found. Please check the QR code.");
    })
    .catch(function () { msg("Could not reach the server. Check your connection."); });

  function msg(t) { card.innerHTML = '<p class="verify__msg">' + esc(t) + "</p>"; }

  function render(o, preview) {
    var st = String(o.status || "Pending");
    var cls = { Confirmed: "confirmed", Pending: "pending", Rejected: "rejected", Cancelled: "cancelled" }[st] || "unknown";
    var label = st === "Confirmed" ? "✓ CONFIRMED" : st === "Pending" ? "⏳ PENDING PAYMENT" : st.toUpperCase();
    function row(k, v, big) { return '<div class="verify__row"><span>' + esc(k) + '</span><b' + (big ? ' class="big"' : "") + ">" + esc(v) + "</b></div>"; }
    card.innerHTML =
      '<div class="verify__status vs--' + cls + '">' + esc(label) + "</div>" +
      '<div class="verify__body">' +
        '<h2 class="verify__name">' + esc(o.buyerName || "—") + "</h2>" +
        '<p class="verify__sub">Order ' + esc(o.orderId || id) + "</p>" +
        row("Student", (o.studentName || "—") + (o.studentBranch ? " · " + o.studentBranch : "")) +
        row("Ticket", (o.qty || "") + " × " + (o.tier || "")) +
        row("Seat(s)", o.seats || "—") +
        (o.addons ? row("Add-ons", o.addons) : "") +
        row("Payment", String(o.payMethod || "").toUpperCase()) +
        row("Total", peso(o.total), true) +
        (preview ? '<p class="verify__msg">Preview mode — connect the backend to see live data.</p>' : "") +
      "</div>";
  }
})();
