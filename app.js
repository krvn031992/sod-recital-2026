/* =====================================================================
   SOD RECITAL — FRONT-END LOGIC
   Loads config (remote Sheet overrides local defaults), renders tiers,
   enforces the per-student ticket limit, computes totals, shows payment
   details, and submits registrations to the Google Apps Script endpoint.
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.SOD_CONFIG || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var peso = function (n) {
    return (CFG.currency || "₱") + Number(n || 0).toLocaleString("en-PH");
  };

  /* ---------- 1. Load config (remote overrides local) ---------- */
  function init() {
    if (CFG.apiUrl) {
      fetch(CFG.apiUrl + "?action=config", { method: "GET" })
        .then(function (r) { return r.json(); })
        .then(function (remote) {
          if (remote && remote.ok !== false) CFG = mergeConfig(CFG, remote);
        })
        .catch(function () { /* fall back to local defaults */ })
        .finally(render);
    } else {
      render();
    }
  }

  function mergeConfig(base, remote) {
    var out = Object.assign({}, base);
    ["salesOpen", "ticketLimitPerStudent", "totalCapacity", "eventName",
     "eventDate", "venue", "org"].forEach(function (k) {
      if (remote[k] !== undefined && remote[k] !== "") out[k] = remote[k];
    });
    if (Array.isArray(remote.tiers) && remote.tiers.length) out.tiers = remote.tiers;
    if (remote.payments) out.payments = Object.assign({}, base.payments, remote.payments);
    if (remote.remaining) out.remaining = remote.remaining; // { tierId: count }
    return out;
  }

  /* ---------- 2. Render everything ---------- */
  function render() {
    bindText();
    renderStatus();
    renderTiers();
    renderTierSelect();
    renderPayDetails();
    wireForm();
  }

  function bindText() {
    $$("[data-bind]").forEach(function (el) {
      var key = el.getAttribute("data-bind");
      if (CFG[key]) el.textContent = CFG[key];
    });
    document.title = (CFG.eventName || "Recital") + " — Tickets";
    var s = CFG.socials || {};
    var fb = $("[data-fb]"), ig = $("[data-ig]");
    if (fb) { if (s.facebook) fb.href = s.facebook; else fb.hidden = true; }
    if (ig) { if (s.instagram) ig.href = s.instagram; else ig.hidden = true; }
  }

  function renderStatus() {
    var box = $("[data-status]");
    if (!box) return;
    box.hidden = false;
    if (CFG.salesOpen) {
      box.className = "hero__status is-open";
      box.textContent = "Registration is OPEN — reserve your seats below.";
    } else {
      box.className = "hero__status is-closed";
      box.textContent = "Registration opens soon. Check back shortly.";
    }
  }

  function renderTiers() {
    var box = $("[data-tiers]");
    if (!box) return;
    var featured = (CFG.tiers || []).reduce(function (a, t) {
      return t.price > (a ? a.price : -1) ? t : a;
    }, null);
    box.innerHTML = (CFG.tiers || []).map(function (t) {
      var rem = CFG.remaining && CFG.remaining[t.id];
      var seats = (rem !== undefined)
        ? "<b>" + rem + "</b> of " + (t.allocation || "?") + " seats left"
        : (t.allocation ? "<b>" + t.allocation + "</b> seats" : "");
      return '' +
        '<article class="tier' + (featured && featured.id === t.id ? ' tier--featured' : '') + '">' +
          (featured && featured.id === t.id ? '<span class="tier__badge">Premium</span>' : '') +
          '<h3 class="tier__name">' + esc(t.name) + '</h3>' +
          '<div class="tier__price">' + peso(t.price) + ' <small>/ ticket</small></div>' +
          (t.entry ? '<span class="tier__entry">' + esc(t.entry) + '</span>' : '') +
          '<p class="tier__note">' + esc(t.note || '') + '</p>' +
          (seats ? '<div class="tier__seats">' + seats + '</div>' : '') +
        '</article>';
    }).join("");
  }

  function renderTierSelect() {
    var sel = $("[data-tier-select]");
    if (!sel) return;
    sel.innerHTML = '<option value="" disabled selected>Select a ticket type</option>' +
      (CFG.tiers || []).map(function (t) {
        return '<option value="' + t.id + '">' + esc(t.name) + ' — ' + peso(t.price) + '</option>';
      }).join("");
    fillQty();
    sel.addEventListener("change", function () { fillQty(); updateOrder(); });
  }

  function fillQty() {
    var qty = $("[data-qty-select]");
    var limit = Number(CFG.ticketLimitPerStudent || 4);
    var opts = '<option value="" disabled selected>Qty</option>';
    for (var i = 1; i <= limit; i++) opts += '<option value="' + i + '">' + i + '</option>';
    qty.innerHTML = opts;
    qty.addEventListener("change", updateOrder);
    var hint = $("[data-limit-hint]");
    if (hint) hint.textContent = "Maximum " + limit + " tickets per student.";
  }

  function tierById(id) {
    return (CFG.tiers || []).filter(function (t) { return t.id === id; })[0];
  }

  function updateOrder() {
    var t = tierById($("[data-tier-select]").value);
    var qty = Number($("[data-qty-select]").value || 0);
    var box = $("[data-order]");
    if (t && qty > 0) {
      $("[data-order-label]").textContent = qty + " × " + t.name;
      $("[data-order-total]").textContent = peso(t.price * qty);
      box.hidden = false;
    } else {
      box.hidden = true;
    }
  }

  /* ---------- 3. Payment details ---------- */
  function renderPayDetails() {
    var sel = $("[data-pay-select]");
    var box = $("[data-pay-details]");
    if (!sel || !box) return;
    function paint() {
      var p = CFG.payments || {};
      var html = "";
      if (sel.value === "gcash" && p.gcash) {
        html =
          row("GCash Name", p.gcash.name) +
          row("GCash Number", p.gcash.number);
      } else if (p[sel.value]) {
        var b = p[sel.value];
        html =
          row("Bank", b.bank) +
          row("Account Name", b.name) +
          row("Account Number", b.number);
      }
      box.innerHTML = html +
        '<p class="pay__hint">Send the exact total, then enter your reference number below.</p>';
    }
    sel.addEventListener("change", paint);
    paint();
  }
  function row(k, v) {
    return '<div class="pd__row"><span>' + esc(k) + '</span><b>' + esc(v || "—") + '</b></div>';
  }

  /* ---------- 4. Submit ---------- */
  function wireForm() {
    var form = $("#ticketForm");
    if (!form) return;
    var msg = $("[data-form-msg]");
    var btn = $("[data-submit]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      msg.className = "form__msg";
      msg.textContent = "";

      if (!CFG.salesOpen) {
        return fail("Registration is currently closed.");
      }
      if (!form.checkValidity()) {
        return fail("Please complete all required fields.");
      }
      var t = tierById(form.tier.value);
      var qty = Number(form.qty.value);
      if (!t || !qty) return fail("Please choose a ticket type and quantity.");

      btn.disabled = true;
      btn.textContent = "Submitting…";

      buildPayload(form, t, qty).then(function (payload) {
        if (!CFG.apiUrl) {
          // Preview mode — no backend wired yet.
          console.log("[SOD] Registration payload (preview only):", payload);
          succeed("PREVIEW-" + Date.now());
          return;
        }
        return fetch(CFG.apiUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight
          body: JSON.stringify(payload)
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res && res.ok) succeed(res.orderId || "—");
            else fail((res && res.error) || "Something went wrong. Please try again.");
          });
      }).catch(function () {
        fail("Network error. Please check your connection and try again.");
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = "Submit Registration";
      });
    });

    function fail(m) { msg.className = "form__msg is-err"; msg.textContent = m; btn.disabled = false; btn.textContent = "Submit Registration"; }
    function succeed(orderId) {
      msg.className = "form__msg is-ok";
      msg.textContent = "Registration received!";
      $("[data-order-id]").textContent = orderId;
      $("[data-modal]").hidden = false;
      form.reset();
      updateOrder();
    }
  }

  function buildPayload(form, t, qty) {
    var base = {
      timestamp: new Date().toISOString(),
      studentName: form.studentName.value.trim(),
      studentClass: form.studentClass.value.trim(),
      buyerName: form.buyerName.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      tierId: t.id,
      tierName: t.name,
      unitPrice: t.price,
      qty: qty,
      total: t.price * qty,
      payMethod: form.payMethod.value,
      reference: form.reference.value.trim()
    };
    var file = form.receipt.files[0];
    if (!file) return Promise.resolve(base);
    return readFileBase64(file).then(function (data) {
      base.receiptName = file.name;
      base.receiptType = file.type;
      base.receiptData = data; // base64 (no prefix)
      return base;
    });
  }

  function readFileBase64(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result).split(",")[1] || ""); };
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- modal close ---------- */
  document.addEventListener("click", function (e) {
    if (e.target.matches("[data-modal-close]")) $("[data-modal]").hidden = true;
  });

  init();
})();
