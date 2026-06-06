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
    renderBranches();
    renderAddons();
    renderPayDetails();
    wireForm();
  }

  function renderBranches() {
    var sel = $("[data-branch-select]");
    if (!sel) return;
    var list = (CFG.branches && CFG.branches.length) ? CFG.branches : ["Main Branch"];
    sel.innerHTML = '<option value="" disabled selected>Select branch</option>' +
      list.map(function (b) { return '<option value="' + esc(b) + '">' + esc(b) + "</option>"; }).join("");
  }

  function updateVipSeat() {
    var box = $("[data-vipseat]");
    if (!box) return;
    var isVip = $("[data-tier-select]").value === "vip" && CFG.seatMap && CFG.seatMap.vipChooseSeats;
    box.hidden = !isVip;
    var input = box.querySelector('[name="vipSeats"]');
    if (input) input.required = !!isVip;
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
    sel.addEventListener("change", function () { fillQty(); updateVipSeat(); updateOrder(); });
    updateVipSeat();
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
    var lines = [];
    var total = 0;

    if (t && qty > 0) {
      lines.push({ label: qty + " × " + t.name, amount: t.price * qty });
      total += t.price * qty;
    }
    computeAddons().items.forEach(function (it) {
      lines.push({ label: it.label, amount: it.amount });
      total += it.amount;
    });

    if (lines.length) {
      $("[data-order-lines]").innerHTML = lines.map(function (l) {
        return '<div class="order__row"><span>' + esc(l.label) + "</span><span>" + peso(l.amount) + "</span></div>";
      }).join("");
      $("[data-order-total]").textContent = peso(total);
      box.hidden = false;
    } else {
      box.hidden = true;
    }
  }

  /* ---------- Add-ons ---------- */
  function renderAddons() {
    var a = CFG.addons || {};
    var wrap = $("[data-addons]");
    if (!wrap) return;
    var anyOn = false;

    // Shout-out
    if (a.shoutout && a.shoutout.enabled) {
      anyOn = true;
      showAddon("shoutout", a.shoutout);
      setText('[data-addon-price="shoutout"]', "+" + peso(a.shoutout.price) + " each");
      fillSelect('[data-addon-qty="shoutout"]', range1(a.shoutout.maxQty || 5));
    }
    // Flowers
    if (a.flowers && a.flowers.enabled) {
      anyOn = true;
      showAddon("flowers", a.flowers);
      var opts = (a.flowers.options || []).map(function (o) {
        return { value: o.id, label: o.name + " — " + peso(o.price) };
      });
      fillSelect('[data-addon-options="flowers"]', opts);
      fillSelect('[data-addon-qty="flowers"]', range1(a.flowers.maxQty || 10));
      var gal = $('[data-addon-gallery="flowers"]');
      if (gal) {
        gal.innerHTML = (a.flowers.options || []).filter(function (o) { return o.image; })
          .map(function (o) {
            return '<figure class="thumb"><img src="' + esc(o.image) + '" alt="' + esc(o.name) +
              '" onerror="this.parentNode.style.display=&quot;none&quot;"/><figcaption>' +
              esc(o.name) + " · " + peso(o.price) + "</figcaption></figure>";
          }).join("");
      }
    }
    // Shirt
    if (a.shirt && a.shirt.enabled) {
      anyOn = true;
      showAddon("shirt", a.shirt);
      setText('[data-addon-price="shirt"]', "+" + peso(a.shirt.price) + " each");
      fillSelect('[data-addon-sizes="shirt"]', (a.shirt.sizes || []).map(function (s) { return { value: s, label: s }; }));
      fillSelect('[data-addon-qty="shirt"]', range1(a.shirt.maxQty || 10));
      var simg = $('[data-addon-image="shirt"]');
      if (simg && a.shirt.image) { simg.onerror = function () { simg.hidden = true; }; simg.src = a.shirt.image; simg.hidden = false; }
    }

    wrap.hidden = !anyOn;

    // Toggles + change listeners
    $$("[data-addon-toggle]").forEach(function (cb) {
      var id = cb.getAttribute("data-addon-toggle");
      cb.addEventListener("change", function () {
        var body = $('[data-addon-body="' + id + '"]');
        if (body) body.hidden = !cb.checked;
        updateOrder();
      });
    });
    $$('[data-addon-body] select, [data-addon-body] input').forEach(function (el) {
      el.addEventListener("change", updateOrder);
    });
  }

  function showAddon(id, cfg) {
    var card = $('[data-addon="' + id + '"]');
    if (card) card.hidden = false;
    setText('[data-addon-label="' + id + '"]', cfg.label);
    setText('[data-addon-note="' + id + '"]', cfg.note || "");
  }
  function setText(sel, txt) { var el = $(sel); if (el) el.textContent = txt; }
  function fillSelect(sel, items) {
    var el = $(sel); if (!el) return;
    el.innerHTML = items.map(function (it) {
      return '<option value="' + esc(it.value) + '">' + esc(it.label) + "</option>";
    }).join("");
  }
  function range1(n) {
    var out = []; for (var i = 1; i <= n; i++) out.push({ value: i, label: String(i) }); return out;
  }

  function computeAddons() {
    var a = CFG.addons || {};
    var form = $("#ticketForm");
    var items = [], total = 0;
    function on(id) { var cb = $('[data-addon-toggle="' + id + '"]'); return cb && cb.checked; }

    if (a.shoutout && a.shoutout.enabled && on("shoutout")) {
      var sq = Number(form.shoutoutQty.value || 1);
      var amt = a.shoutout.price * sq;
      var sDancer = form.shoutoutDancer.value.trim();
      var sMsg = form.shoutoutMessage.value.trim();
      items.push({
        type: "shoutout", label: sq + " × Shout-out", amount: amt,
        summary: sq + " × Shout-out" + (sDancer ? " for " + sDancer : "") + (sMsg ? ': "' + sMsg + '"' : ""),
        detail: { qty: sq, dancer: sDancer, message: sMsg }
      });
      total += amt;
    }
    if (a.flowers && a.flowers.enabled && on("flowers")) {
      var fopt = (a.flowers.options || []).filter(function (o) { return o.id === form.flowersOption.value; })[0];
      if (fopt) {
        var fq = Number(form.flowersQty.value || 1);
        var famt = fopt.price * fq;
        var fDancer = form.flowersDancer.value.trim();
        items.push({
          type: "flowers", label: fq + " × " + fopt.name, amount: famt,
          summary: fq + " × " + fopt.name + (fDancer ? " for " + fDancer : ""),
          detail: { option: fopt.name, qty: fq, dancer: fDancer }
        });
        total += famt;
      }
    }
    if (a.shirt && a.shirt.enabled && on("shirt")) {
      var shq = Number(form.shirtQty.value || 1);
      var shamt = a.shirt.price * shq;
      items.push({
        type: "shirt", label: shq + " × T-Shirt (" + form.shirtSize.value + ")", amount: shamt,
        summary: shq + " × T-Shirt (" + form.shirtSize.value + ")",
        detail: { size: form.shirtSize.value, qty: shq }
      });
      total += shamt;
    }
    return { items: items, total: total, text: items.map(function (i) { return i.summary || i.label; }).join("; ") };
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
    var addons = computeAddons();
    var ticketsSubtotal = t.price * qty;
    var base = {
      timestamp: new Date().toISOString(),
      studentName: form.studentName.value.trim(),
      studentClass: form.studentClass.value.trim(),
      studentBranch: form.studentBranch.value.trim(),
      buyerName: form.buyerName.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      tierId: t.id,
      tierName: t.name,
      seats: (t.id === "vip" && form.vipSeats) ? form.vipSeats.value.trim() : "",
      unitPrice: t.price,
      qty: qty,
      ticketsSubtotal: ticketsSubtotal,
      addons: addons.items,
      addonsText: addons.text,
      addonsTotal: addons.total,
      grandTotal: ticketsSubtotal + addons.total,
      payMethod: form.payMethod.value
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
