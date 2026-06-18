/* =====================================================================
   SOD RECITAL — ADMIN DASHBOARD
   Reads/writes registrations via the Google Apps Script backend.
   Auth: an admin password (ADMIN_KEY in the Apps Script) is sent with
   each request. Stored in sessionStorage for the session only.
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.SOD_CONFIG || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var KEY_STORE = "sod_admin_key";
  var STATUSES = ["Pending", "Confirmed", "Rejected", "Cancelled"];
  var state = { rows: [], summary: null, key: sessionStorage.getItem(KEY_STORE) || "" };

  var peso = function (n) { return "₱" + Number(n || 0).toLocaleString("en-PH"); };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtDate(v) {
    var d = new Date(v);
    if (isNaN(d)) return esc(v);
    return d.toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  /* ---------- Demo data when no backend is connected (preview) ---------- */
  function demo() {
    var rows = [
      { orderId: "SOD-260601-AB12", timestamp: Date.now() - 86400000, studentName: "Maria Santos", studentClass: "Ballet Int.", studentBranch: "Main Branch", tier: "VIP", seats: "Orchestra Center A12–A13", qty: 2, unitPrice: 2595, ticketsSubtotal: 5190, addons: "1 × Shout-out", addonsTotal: 200, total: 5390, buyerName: "Ana Santos", email: "ana@email.com", phone: "0917 111 2222", payMethod: "gcash", receipt: "#", status: "Pending" },
      { orderId: "SOD-260601-CD34", timestamp: Date.now() - 43200000, studentName: "Liam Cruz", studentClass: "Hip-Hop", studentBranch: "Branch 2", tier: "General Admission", seats: "", qty: 4, unitPrice: 1295, ticketsSubtotal: 5180, addons: "1 × T-Shirt (M); 1 × Bouquet", addonsTotal: 800, total: 5980, buyerName: "Jose Cruz", email: "jose@email.com", phone: "0918 333 4444", payMethod: "bpi", receipt: "#", status: "Confirmed" }
    ];
    var sold = {}; rows.forEach(function (r) { if (r.status !== "Rejected" && r.status !== "Cancelled") sold[r.tier] = (sold[r.tier] || 0) + r.qty; });
    return { ok: true, rows: rows, summary: {
      totalOrders: rows.length, byStatus: { Pending: 1, Confirmed: 1, Rejected: 0, Cancelled: 0 },
      revenueConfirmed: 5980, revenuePending: 5390, soldByTier: sold,
      remaining: { vip: 298, genad: 971 }, capacity: 1275,
      tiers: (CFG.tiers || [])
    }};
  }

  /* ---------- Auth ---------- */
  function showDash(on) {
    $("[data-login]").hidden = on;
    $("[data-dash]").hidden = !on;
    $("[data-logout]").hidden = !on;
  }

  function load() {
    if (!CFG.apiUrl) {
      // Preview mode — show demo so you can see the layout.
      apply(demo(), true);
      return;
    }
    fetch(CFG.apiUrl + "?action=admin&key=" + encodeURIComponent(state.key))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || res.ok === false) {
          sessionStorage.removeItem(KEY_STORE);
          state.key = "";
          showDash(false);
          $("[data-login-msg]").className = "form__msg is-err";
          $("[data-login-msg]").textContent = (res && res.error) || "Login failed.";
          return;
        }
        apply(res, false);
      })
      .catch(function () {
        $("[data-login-msg]").className = "form__msg is-err";
        $("[data-login-msg]").textContent = "Could not reach the backend. Check the apiUrl in config.js.";
      });
  }

  function apply(res, isDemo) {
    state.rows = res.rows || [];
    state.summary = res.summary;
    showDash(true);
    if (isDemo) banner("Preview mode — showing sample data. Connect the backend (apiUrl) to see real payments.");
    renderCards();
    renderRows();
  }

  function banner(msg) {
    var c = $("[data-cards]");
    var b = document.createElement("div");
    b.className = "admin__notice";
    b.textContent = msg;
    c.parentNode.insertBefore(b, c);
  }

  /* ---------- Render summary cards ---------- */
  function renderCards() {
    var s = state.summary || {};
    var seats = "";
    (s.tiers || []).forEach(function (t) {
      var sold = (s.soldByTier && s.soldByTier[t.name]) || 0;
      seats += '<div class="seatline"><span>' + esc(t.name) + '</span><b>' + sold + " / " + (t.allocation || "?") + "</b></div>";
    });
    var cards = [
      card("Total Orders", s.totalOrders || 0, ""),
      card("Confirmed Revenue", peso(s.revenueConfirmed), "is-ok"),
      card("Pending Revenue", peso(s.revenuePending), "is-warn"),
      card("Pending / Confirmed", (s.byStatus ? s.byStatus.Pending : 0) + " / " + (s.byStatus ? s.byStatus.Confirmed : 0), "")
    ].join("");
    $("[data-cards]").innerHTML = cards +
      '<div class="card-stat card-stat--wide"><span class="card-stat__label">Seats Sold</span><div class="seats">' + seats + "</div></div>";
  }
  function card(label, value, cls) {
    return '<div class="card-stat ' + cls + '"><span class="card-stat__label">' + esc(label) +
      '</span><span class="card-stat__val">' + esc(value) + "</span></div>";
  }

  /* ---------- Render table rows ---------- */
  function renderRows() {
    var q = ($("[data-search]").value || "").toLowerCase();
    var f = $("[data-filter]").value;
    var tbody = $("[data-rows]");
    var list = state.rows.filter(function (o) {
      if (f && o.status !== f) return false;
      if (!q) return true;
      return [o.orderId, o.buyerName, o.studentName, o.email, o.reference]
        .join(" ").toLowerCase().indexOf(q) !== -1;
    });
    $("[data-empty]").hidden = list.length > 0;
    tbody.innerHTML = list.map(function (o) {
      return "<tr>" +
        td(o.orderId, "mono") +
        td(fmtDate(o.timestamp)) +
        td(o.studentName + (o.studentClass ? '<small> · ' + esc(o.studentClass) + "</small>" : ""), "", true) +
        td(o.studentBranch || "—") +
        td(o.buyerName) +
        td('<a href="mailto:' + esc(o.email) + '">' + esc(o.email) + "</a><br><small>" + esc(o.phone) + "</small>", "", true) +
        td(o.tier) +
        td(o.seats || "—") +
        td(o.qty) +
        td(o.addons ? esc(o.addons) + (o.addonsTotal ? '<br><small>' + peso(o.addonsTotal) + "</small>" : "") : "—", "", true) +
        td(peso(o.total)) +
        td(String(o.payMethod || "").toUpperCase()) +
        td(o.receipt ? '<a href="' + esc(o.receipt) + '" target="_blank" rel="noopener">View</a>' : "—", "", true) +
        "<td>" + statusSelect(o) + "</td>" +
        "</tr>";
    }).join("");

    Array.prototype.forEach.call(tbody.querySelectorAll("[data-status-sel]"), function (sel) {
      sel.addEventListener("change", function () { changeStatus(sel.getAttribute("data-id"), sel.value, sel); });
    });
  }
  function td(v, cls, raw) { return '<td' + (cls ? ' class="' + cls + '"' : "") + ">" + (raw ? v : esc(v)) + "</td>"; }
  function statusSelect(o) {
    var opts = STATUSES.map(function (s) {
      return '<option value="' + s + '"' + (s === o.status ? " selected" : "") + ">" + s + "</option>";
    }).join("");
    return '<select class="status status--' + esc((o.status || "Pending").toLowerCase()) +
      '" data-status-sel data-id="' + esc(o.orderId) + '">' + opts + "</select>";
  }

  /* ---------- Change status ---------- */
  function changeStatus(orderId, status, sel) {
    var row = state.rows.filter(function (r) { return r.orderId === orderId; })[0];
    var prev = row ? row.status : status;
    sel.disabled = true;
    var done = function (ok) {
      sel.disabled = false;
      if (ok) {
        if (row) row.status = status;
        sel.className = "status status--" + status.toLowerCase();
        renderCards();
      } else {
        sel.value = prev;
        alert("Could not update status. Please try again.");
      }
    };
    if (!CFG.apiUrl) { done(true); return; } // preview
    fetch(CFG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ type: "updateStatus", key: state.key, orderId: orderId, status: status })
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        done(res && res.ok);
        if (res && res.ok && status === "Confirmed") {
          if (res.emailSent) alert("✓ Confirmed — confirmation email sent to " + (row ? row.email : "the buyer") + ".");
          else alert("Status set to Confirmed, but the email did NOT send.\nReason: " + (res.emailError || "unknown") + "\n(Likely the deployment needs a New version.)");
        }
      })
      .catch(function () { done(false); });
  }

  /* ---------- Export CSV ---------- */
  function exportCsv() {
    var cols = ["orderId", "timestamp", "studentName", "studentClass", "studentBranch", "buyerName",
      "email", "phone", "tier", "seats", "qty", "unitPrice", "ticketsSubtotal", "addons",
      "addonsTotal", "total", "payMethod", "receipt", "status"];
    var head = ["Order ID", "Timestamp", "Student", "Class", "Branch", "Buyer", "Email", "Phone",
      "Tier", "Seat(s)", "Qty", "Unit Price", "Tickets Subtotal", "Add-ons", "Add-ons Total",
      "Grand Total", "Pay Method", "Receipt", "Status"];
    var esc2 = function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; };
    var lines = [head.map(esc2).join(",")];
    state.rows.forEach(function (o) { lines.push(cols.map(function (c) { return esc2(o[c]); }).join(",")); });
    var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "sod-payments-" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click(); URL.revokeObjectURL(url);
  }

  /* ---------- Wire up ---------- */
  $("[data-login-form]").addEventListener("submit", function (e) {
    e.preventDefault();
    state.key = this.key.value.trim();
    sessionStorage.setItem(KEY_STORE, state.key);
    $("[data-login-msg]").textContent = "";
    load();
  });
  $("[data-logout]").addEventListener("click", function () {
    sessionStorage.removeItem(KEY_STORE);
    state.key = "";
    location.reload();
  });
  $("[data-refresh]").addEventListener("click", load);
  $("[data-export]").addEventListener("click", exportCsv);
  $("[data-search]").addEventListener("input", renderRows);
  $("[data-filter]").addEventListener("change", renderRows);

  // Auto-login if a key is already stored, or show demo in preview.
  if (state.key || !CFG.apiUrl) load();
})();
