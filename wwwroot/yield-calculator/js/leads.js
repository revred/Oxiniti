/* Oxyniti yield calculator — lead capture and the report gate.

   What this file owns (plan/LEAD_CAPTURE.md):
     - the gate: profit, payback, unit sizing and the three charts are never written to the
       page. The farmer sees the extra-harvest band live (the attractor) and asks for the
       rest as a report, which the owner sends after vetting.
     - the request form: contact details plus the pond facts the calculator already holds.
     - bot signals: honeypot, time on page, interaction count, arithmetic check, optional
       Turnstile. They are recorded and sent, and only the certain ones block.
     - two delivery routes: JSON POST to OXY_LEADS_CONFIG.endpoint when set, and a WhatsApp
       deep link carrying a reference code that tools/leads/vet_lead.py decodes.

   The pure helpers (normalisePhone, validate, encodeRef, decodeRef, buildPayload,
   buildWhatsAppText) have no DOM dependency and are exercised by tests/leads.test.mjs.
   REF_FIELDS is the shared wire format with tools/leads/vet_lead.py — change both or neither.

   classic script — assigns window.OxyLeads; module.exports for Node tests; works from file://
*/
(function () {
  "use strict";

  var REF_VERSION = 1;
  var REF_PREFIX = "OXY1.";

  // Wire order of the reference code. Position matters; nulls are kept so decoding is stable.
  var REF_FIELDS = [
    "v", "lead_id", "ts",
    "name", "phone", "village", "role", "ponds", "area_total_acre", "email", "best_time",
    "district", "station_name", "species", "area_acre", "depth_m", "density_per_acre", "stock_month",
    "price_inr_kg", "feed_price_inr_kg", "bloom", "existing_aeration_kw", "existing_run_h",
    "tariff_id", "tariff_inr_kwh", "unit_model", "n_units", "o2_input_lpm_override",
    "power_kw_override", "unit_price_inr", "concentrator_kw", "concentrator_price_inr",
    "maintenance_pct", "subsidy_pct", "run_h", "include_fcr_gain",
    "lang", "t_ms", "interactions", "tz_min", "ref_host"
  ];
  var CONTACT_FIELDS = ["name", "phone", "village", "role", "ponds", "area_total_acre", "email", "best_time"];
  var INPUT_FIELDS = [
    "district", "station_name", "species", "area_acre", "depth_m", "density_per_acre", "stock_month",
    "price_inr_kg", "feed_price_inr_kg", "bloom", "existing_aeration_kw", "existing_run_h",
    "tariff_id", "tariff_inr_kwh", "unit_model", "n_units", "o2_input_lpm_override",
    "power_kw_override", "unit_price_inr", "concentrator_kw", "concentrator_price_inr",
    "maintenance_pct", "subsidy_pct", "run_h", "include_fcr_gain"
  ];
  var SIGNAL_FIELDS = ["lang", "t_ms", "interactions", "tz_min", "ref_host"];

  var ROLES = ["owner", "manager", "planning", "consultant", "supplier", "other"];
  var PONDS = ["1", "2-5", "6-20", "20+"];

  var STORAGE_KEY = "oxy_lead_request";
  var OWNER_KEY = "oxy_owner";

  /* ================================================================
     pure helpers
     ================================================================ */

  // Indian mobile numbers: 10 digits, first digit 6-9, optionally prefixed +91 / 91 / 0.
  function normalisePhone(raw) {
    if (raw == null) return { ok: false, reason: "empty" };
    var digits = String(raw).replace(/[^\d]/g, "");
    if (!digits) return { ok: false, reason: "empty" };
    if (digits.length === 12 && digits.slice(0, 2) === "91") digits = digits.slice(2);
    else if (digits.length === 11 && digits.charAt(0) === "0") digits = digits.slice(1);
    if (digits.length !== 10) return { ok: false, reason: "length" };
    if (!/^[6-9]/.test(digits)) return { ok: false, reason: "prefix" };
    if (/^(\d)\1{9}$/.test(digits)) return { ok: false, reason: "repeated" };
    if (digits === "1234567890" || digits === "9876543210" || digits === "6789012345") return { ok: false, reason: "sequence" };
    return { ok: true, national: digits, e164: "+91" + digits };
  }

  function hasLetter(s) {
    try { return /\p{L}/u.test(s); } catch (e) { return /[A-Za-z஀-௿]/.test(s); }
  }

  // fields: the form values. signals: { t_ms, honeypot, challenge_ok }. cfg: OXY_LEADS_CONFIG.
  // Returns { ok, errors: { field: errorKey }, honeypot: bool }.
  function validate(fields, signals, cfg) {
    var errors = {};
    var f = fields || {};
    var s = signals || {};
    var minMs = (cfg && typeof cfg.minTimeOnPageMs === "number") ? cfg.minTimeOnPageMs : 4000;

    var name = String(f.name || "").trim();
    if (name.length < 2 || name.length > 80 || !hasLetter(name)) errors.name = "lead.err.name";

    var phone = normalisePhone(f.phone);
    if (!phone.ok) errors.phone = "lead.err.phone";

    var village = String(f.village || "").trim();
    if (village.length < 2 || village.length > 80) errors.village = "lead.err.village";

    if (ROLES.indexOf(f.role) === -1) errors.role = "lead.err.role";
    if (PONDS.indexOf(f.ponds) === -1) errors.ponds = "lead.err.ponds";

    if (f.area_total_acre != null && f.area_total_acre !== "") {
      var a = Number(f.area_total_acre);
      if (!(a >= 0.1 && a <= 5000)) errors.area_total_acre = "lead.err.area_total";
    }
    if (f.email) {
      var em = String(f.email).trim();
      if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) errors.email = "lead.err.email";
    }
    if (!f.consent) errors.consent = "lead.err.consent";
    if (!s.challenge_ok) errors.challenge = "lead.err.challenge";
    if (typeof s.t_ms === "number" && s.t_ms < minMs) errors.timing = "lead.err.timing";

    var honeypot = !!(s.honeypot && String(s.honeypot).trim());
    return { ok: Object.keys(errors).length === 0, errors: errors, honeypot: honeypot };
  }

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  // "OXY-20260922-K7Q4M" — date for the owner's eye, five random base-32 characters after it.
  function makeLeadId(now, randomBytes) {
    var d = now || new Date();
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var bytes = randomBytes;
    if (!bytes) {
      bytes = new Array(5);
      var cryptoObj = (typeof crypto !== "undefined" && crypto.getRandomValues) ? crypto : null;
      if (cryptoObj) { var u = new Uint8Array(5); cryptoObj.getRandomValues(u); bytes = Array.prototype.slice.call(u); }
      else { for (var i = 0; i < 5; i++) bytes[i] = Math.floor(Math.random() * 256); }
    }
    var suffix = "";
    for (var j = 0; j < 5; j++) suffix += alphabet.charAt(bytes[j] % 32);
    return "OXY-" + d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) + "-" + suffix;
  }

  function utf8ToBase64Url(str) {
    var bytes;
    if (typeof TextEncoder !== "undefined") bytes = new TextEncoder().encode(str);
    else bytes = Buffer.from(str, "utf8");
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    var b64 = (typeof btoa === "function") ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function base64UrlToUtf8(b64url) {
    var b64 = String(b64url).replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    var bin = (typeof atob === "function") ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (typeof TextDecoder !== "undefined") return new TextDecoder("utf-8").decode(bytes);
    return Buffer.from(bytes).toString("utf8");
  }

  // payload -> "OXY1.<base64url of the REF_FIELDS array>". Only inputs, contact and the
  // vetting signals travel; no model output does, so the code shows the farmer nothing the
  // page did not.
  function encodeRef(payload) {
    var flat = flatten(payload);
    var arr = REF_FIELDS.map(function (k) {
      if (k === "v") return REF_VERSION;
      var v = flat[k];
      return (v === undefined) ? null : v;
    });
    return REF_PREFIX + utf8ToBase64Url(JSON.stringify(arr));
  }

  function decodeRef(code) {
    var s = String(code || "").trim();
    if (s.indexOf(REF_PREFIX) !== 0) throw new Error("not a reference code");
    var arr = JSON.parse(base64UrlToUtf8(s.slice(REF_PREFIX.length)));
    if (!Array.isArray(arr) || arr.length !== REF_FIELDS.length) throw new Error("reference code has " + (arr && arr.length) + " fields, expected " + REF_FIELDS.length);
    if (arr[0] !== REF_VERSION) throw new Error("reference code version " + arr[0] + " is not " + REF_VERSION);
    var flat = {};
    REF_FIELDS.forEach(function (k, i) { flat[k] = arr[i]; });
    return unflatten(flat);
  }

  function flatten(payload) {
    var out = { v: REF_VERSION, lead_id: payload.lead_id, ts: payload.ts };
    CONTACT_FIELDS.forEach(function (k) { out[k] = payload.contact ? payload.contact[k] : null; });
    INPUT_FIELDS.forEach(function (k) { out[k] = payload.inputs ? payload.inputs[k] : null; });
    SIGNAL_FIELDS.forEach(function (k) { out[k] = payload.signals ? payload.signals[k] : null; });
    return out;
  }

  function unflatten(flat) {
    var p = { v: flat.v, lead_id: flat.lead_id, ts: flat.ts, contact: {}, inputs: {}, signals: {} };
    CONTACT_FIELDS.forEach(function (k) { p.contact[k] = flat[k]; });
    INPUT_FIELDS.forEach(function (k) { p.inputs[k] = flat[k]; });
    SIGNAL_FIELDS.forEach(function (k) { p.signals[k] = flat[k]; });
    return p;
  }

  function num(v, dp) {
    if (v == null || isNaN(v)) return null;
    var f = Math.pow(10, dp == null ? 3 : dp);
    return Math.round(Number(v) * f) / f;
  }

  // The full lead record. `result` is the model output for the same inputs; only its
  // headline goes into the POST body (never into the reference code).
  function buildPayload(args) {
    var contact = args.contact || {};
    var phone = normalisePhone(contact.phone);
    var inputs = {};
    INPUT_FIELDS.forEach(function (k) {
      var v = (args.inputs || {})[k];
      inputs[k] = (v === undefined) ? null : v;
    });
    var payload = {
      v: REF_VERSION,
      lead_id: args.lead_id,
      ts: args.ts,
      contact: {
        name: String(contact.name || "").trim(),
        phone: phone.ok ? phone.e164 : String(contact.phone || ""),
        village: String(contact.village || "").trim(),
        role: contact.role || null,
        ponds: contact.ponds || null,
        area_total_acre: (contact.area_total_acre === "" || contact.area_total_acre == null) ? null : Number(contact.area_total_acre),
        email: contact.email ? String(contact.email).trim() : null,
        best_time: contact.best_time ? String(contact.best_time).trim() : null
      },
      inputs: inputs,
      signals: {
        lang: args.signals ? args.signals.lang : null,
        t_ms: args.signals ? args.signals.t_ms : null,
        interactions: args.signals ? args.signals.interactions : null,
        tz_min: args.signals ? args.signals.tz_min : null,
        ref_host: args.signals ? args.signals.ref_host : null,
        ua: args.signals ? args.signals.ua : null,
        viewport: args.signals ? args.signals.viewport : null,
        pointer: args.signals ? args.signals.pointer : null,
        turnstile_token: args.signals ? args.signals.turnstile_token : null
      },
      page: args.page || null,
      headline: null
    };
    var r = args.result;
    if (r && r.delta && r.delta.low && r.delta.high) {
      payload.headline = {
        extra_kg_crop: [num(r.delta.low.kg_crop, 1), num(r.delta.high.kg_crop, 1)],
        extra_kg_year: [num(r.delta.low.kg_year, 1), num(r.delta.high.kg_year, 1)],
        extra_profit_year_inr: [num(r.delta.low.profit_year, 0), num(r.delta.high.profit_year, 0)],
        payback_status: r.payback ? r.payback.status : null,
        payback_months: (r.payback && r.payback.status === "ok") ? [num(r.payback.months_low, 1), num(r.payback.months_high, 1)] : null,
        payback_reason: r.payback ? (r.payback.reason || null) : null,
        capex_inr: r.payback ? num(r.payback.capex, 0) : null,
        n_units: r.unit ? r.unit.n_units : null,
        n_best: r.unit ? r.unit.n_best : null,
        warnings: (r.warnings || []).map(function (w) { return w.code; })
      };
    }
    return payload;
  }

  // Plain-text message the farmer sends. Human-readable lines first, then the code.
  function buildWhatsAppText(payload, ref, labels) {
    var L = labels || {};
    var c = payload.contact || {};
    var i = payload.inputs || {};
    var lines = [
      (L.title || "Oxyniti pond report request") + " " + payload.lead_id,
      (L.name || "Name") + ": " + c.name,
      (L.village || "Village") + ": " + c.village + ", " + i.district,
      (L.role || "Role") + ": " + (c.role || "-") + "  ·  " + (L.ponds || "Ponds") + ": " + (c.ponds || "-") +
        (c.area_total_acre != null ? "  ·  " + c.area_total_acre + " acre " + (L.total || "total") : ""),
      (L.pond || "Pond") + ": " + (L.speciesLabel || i.species) + ", " + i.area_acre + " acre, " + i.depth_m + " m, " +
        i.density_per_acre + "/acre, " + (L.monthLabel || ("month " + i.stock_month)) + ", " + i.bloom + " bloom",
      (L.ref || "Ref") + ": " + ref
    ];
    return lines.join("\n");
  }

  /* ================================================================
     DOM wiring
     ================================================================ */
  var dom = {
    cfg: null,
    loadedAt: (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now(),
    interactions: 0,
    challenge: { a: 0, b: 0 },
    lastInputs: null,
    lastResult: null,
    submitted: null
  };

  function T(key, fallback) {
    return (typeof window !== "undefined" && window.OxyI18n && window.OxyI18n.t) ? window.OxyI18n.t(key, fallback) : fallback;
  }
  function el(id) { return document.getElementById(id); }
  function elapsedMs() {
    var now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    return Math.round(now - dom.loadedAt);
  }

  function isOwnerPreview() {
    try { return window.localStorage && window.localStorage.getItem(OWNER_KEY) === "1"; } catch (e) { return false; }
  }
  // The gate. True unless the owner has flagged this browser for preview (tools/leads/README.md).
  function isLocked() { return !isOwnerPreview(); }

  function readReceivedState(cfg) {
    try {
      var raw = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      var days = (cfg && cfg.receivedStateDays) || 30;
      if (!obj.ts || (Date.now() - Date.parse(obj.ts)) > days * 86400000) return null;
      return obj;
    } catch (e) { return null; }
  }
  function writeReceivedState(obj) {
    try { window.localStorage && window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch (e) { /* ignore */ }
  }
  function clearReceivedState() {
    try { window.localStorage && window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  function noteInteraction() { dom.interactions += 1; }

  function wireInteractionCounter() {
    var form = el("calc-form");
    if (form) {
      form.addEventListener("input", noteInteraction, true);
      form.addEventListener("change", noteInteraction, true);
    }
    var map = el("map");
    if (map) map.addEventListener("pointerdown", noteInteraction, true);
  }

  function newChallenge() {
    dom.challenge.a = 2 + Math.floor(Math.random() * 8);
    dom.challenge.b = 1 + Math.floor(Math.random() * 8);
    var q = el("lead-challenge-q");
    if (q) q.textContent = T("lead.challenge", "Quick check: what is") + " " + dom.challenge.a + " + " + dom.challenge.b + "?";
    var ans = el("lead-challenge");
    if (ans) ans.value = "";
  }

  function speciesLabel(speciesId) {
    var data = window.OXY_DATA;
    var list = (data && data.species) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === speciesId) return list[i].common_name_en || speciesId;
    return speciesId;
  }
  var MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function currentSignals() {
    var refHost = "";
    try { refHost = document.referrer ? new URL(document.referrer).host.slice(0, 60) : ""; } catch (e) { refHost = ""; }
    var pointer = "unknown";
    try {
      if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) pointer = "coarse";
      else if (window.matchMedia && window.matchMedia("(pointer: fine)").matches) pointer = "fine";
    } catch (e) { /* ignore */ }
    return {
      lang: (window.OxyI18n && window.OxyI18n.getLang) ? window.OxyI18n.getLang() : (navigator.language || null),
      t_ms: elapsedMs(),
      interactions: dom.interactions,
      tz_min: new Date().getTimezoneOffset(),
      ref_host: refHost || null,
      ua: (navigator.userAgent || "").slice(0, 200),
      viewport: window.innerWidth + "x" + window.innerHeight,
      pointer: pointer,
      turnstile_token: readTurnstileToken()
    };
  }

  function readTurnstileToken() {
    var inp = document.querySelector('input[name="cf-turnstile-response"]');
    return inp && inp.value ? inp.value : null;
  }

  function readForm() {
    return {
      name: el("lead-name").value,
      phone: el("lead-phone").value,
      village: el("lead-village").value,
      role: el("lead-role").value,
      ponds: el("lead-ponds").value,
      area_total_acre: el("lead-area-total").value,
      email: el("lead-email").value,
      best_time: el("lead-best-time").value,
      consent: el("lead-consent").checked
    };
  }

  function showErrors(errors) {
    var keys = ["name", "phone", "village", "role", "ponds", "area_total_acre", "email", "consent", "challenge"];
    keys.forEach(function (k) {
      var idMap = { area_total_acre: "lead-area-total" };
      var id = idMap[k] || ("lead-" + k);
      var field = el(id);
      var wrap = field ? field.closest(".field, .field-check") : null;
      if (wrap) wrap.classList.toggle("has-error", !!errors[k]);
    });
    var box = el("lead-form-error");
    var first = Object.keys(errors)[0];
    if (first) {
      box.textContent = T(errors[first], "Please check the highlighted field.");
      box.classList.remove("hidden");
    } else {
      box.classList.add("hidden");
    }
  }

  function openDialog() {
    var dlg = el("lead-dialog");
    if (!dlg) return;
    el("lead-district").value = dom.lastInputs ? dom.lastInputs.district : "";
    newChallenge();
    showErrors({});
    if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); }
    else dlg.setAttribute("open", "");
    var nameEl = el("lead-name");
    if (nameEl) setTimeout(function () { nameEl.focus(); }, 30);
  }
  function closeDialog() {
    var dlg = el("lead-dialog");
    if (!dlg) return;
    if (typeof dlg.close === "function" && dlg.open) dlg.close();
    else dlg.removeAttribute("open");
  }

  function setSubmitting(on) {
    var btn = el("lead-submit");
    if (btn) { btn.disabled = on; btn.textContent = on ? T("lead.sending", "Sending…") : T("lead.submit", "Request my report"); }
  }

  function postToEndpoint(cfg, payload, ref, text) {
    if (!cfg.endpoint) return Promise.resolve({ sent: false, reason: "no-endpoint" });
    var c = payload.contact;
    var body = Object.assign({}, cfg.extraFields || {}, {
      subject: "Oxyniti report request " + payload.lead_id + " — " + c.name + ", " + payload.inputs.district,
      from_name: c.name,
      lead_id: payload.lead_id,
      ts: payload.ts,
      name: c.name,
      phone: c.phone,
      village: c.village,
      district: payload.inputs.district,
      role: c.role,
      ponds: c.ponds,
      area_total_acre: c.area_total_acre,
      email: c.email,
      best_time: c.best_time,
      species: payload.inputs.species,
      summary: text,
      ref: ref,
      inputs_json: JSON.stringify(payload.inputs),
      headline_json: JSON.stringify(payload.headline),
      signals_json: JSON.stringify(payload.signals),
      page: payload.page
    });
    return fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body)
    }).then(function (resp) {
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      return { sent: true };
    }).catch(function (err) {
      console.error("Lead POST failed — falling back to WhatsApp", err);
      return { sent: false, reason: String(err && err.message || err) };
    });
  }

  function renderReceived(cfg, rec) {
    var box = el("lead-received");
    var form = el("lead-form");
    if (!box) return;
    if (form) form.classList.add("hidden");
    box.classList.remove("hidden");
    el("lead-received-ref").textContent = rec.lead_id;
    var p = el("lead-received-p");
    p.textContent = (rec.endpoint_sent
      ? T("lead.received_sent", "We have your request. We check every request by hand and send the report to your WhatsApp")
      : T("lead.received_whatsapp", "One more step: tap the WhatsApp button so the request reaches us from your number. We check every request by hand and send the report back"))
      + " " + (cfg.turnaroundText || "") + ".";
    var wa = el("lead-cta-whatsapp");
    wa.href = "https://wa.me/" + cfg.whatsappNumber + "?text=" + encodeURIComponent(rec.text);
    wa.classList.toggle("btn-warm", !rec.endpoint_sent);
    wa.classList.toggle("btn-ghost", !!rec.endpoint_sent);
    var copyBtn = el("lead-cta-copy");
    copyBtn.onclick = function () { copyText(rec.text, el("lead-copy-status")); };
  }

  function copyText(text, statusEl) {
    function ok() { statusEl.textContent = T("results.copy_done", "Copied to clipboard."); }
    function fail() { statusEl.textContent = T("results.copy_failed", "Couldn't copy automatically — select and copy the text manually."); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fail);
    else fail();
  }

  function onSubmit(evt) {
    evt.preventDefault();
    var cfg = dom.cfg;
    var fields = readForm();
    var answer = parseInt(el("lead-challenge").value, 10);
    var signals = {
      t_ms: elapsedMs(),
      honeypot: el("lead-website").value,
      challenge_ok: answer === dom.challenge.a + dom.challenge.b
    };
    if (cfg.turnstileSiteKey && !readTurnstileToken()) signals.challenge_ok = false;
    var v = validate(fields, signals, cfg);
    if (!v.ok) { showErrors(v.errors); return; }
    showErrors({});

    var leadId = makeLeadId(new Date());
    var ts = new Date().toISOString();
    var payload = buildPayload({
      lead_id: leadId, ts: ts, contact: fields, inputs: dom.lastInputs || {}, result: dom.lastResult,
      signals: currentSignals(), page: window.location.origin + window.location.pathname
    });

    if (v.honeypot) {
      // A filled honeypot is a bot with near certainty. Show the received state so it moves
      // on, and give it nothing that reaches us.
      console.warn("Lead form: honeypot filled; request discarded", leadId);
      renderReceived(cfg, { lead_id: leadId, text: "", endpoint_sent: true });
      return;
    }

    var ref = encodeRef(payload);
    var text = buildWhatsAppText(payload, ref, {
      title: T("lead.wa_title", "Oxyniti pond report request"),
      name: T("lead.name", "Name"), village: T("lead.village", "Village / town"), role: T("lead.role", "Role"),
      ponds: T("lead.ponds", "Ponds"), total: T("lead.wa_total", "total"), pond: T("lead.wa_pond", "Pond"),
      ref: T("lead.wa_ref", "Ref"),
      speciesLabel: speciesLabel(payload.inputs.species),
      monthLabel: T("lead.wa_stocked", "stocked") + " " + (MONTHS[payload.inputs.stock_month] || payload.inputs.stock_month)
    });

    setSubmitting(true);
    postToEndpoint(cfg, payload, ref, text).then(function (r) {
      setSubmitting(false);
      var rec = { lead_id: leadId, ts: ts, name: payload.contact.name, text: text, endpoint_sent: !!r.sent };
      dom.submitted = rec;
      writeReceivedState(rec);
      renderReceived(cfg, rec);
      updateResultsCta();
    });
  }

  // The results-card button: "Get my pond report" before a request, "Request received" after.
  function updateResultsCta() {
    var btn = el("cta-report");
    if (!btn) return;
    if (dom.submitted) {
      btn.textContent = T("lead.cta_received", "Request received — view details") + " (" + dom.submitted.lead_id + ")";
    } else {
      btn.textContent = T("results.cta_report", "Get my pond report");
    }
  }

  function wireDialog() {
    var cfg = dom.cfg;
    var form = el("lead-form");
    if (!form) return;
    form.addEventListener("submit", onSubmit);
    el("cta-report").addEventListener("click", function () {
      openDialog();
      if (dom.submitted) renderReceived(cfg, dom.submitted);
    });
    el("lead-cancel").addEventListener("click", closeDialog);
    el("lead-close").addEventListener("click", closeDialog);
    el("lead-request-again").addEventListener("click", function () {
      clearReceivedState();
      dom.submitted = null;
      el("lead-received").classList.add("hidden");
      el("lead-form").classList.remove("hidden");
      newChallenge();
      updateResultsCta();
    });
    var dlg = el("lead-dialog");
    dlg.addEventListener("click", function (e) { if (e.target === dlg) closeDialog(); });

    var turnstileHost = el("lead-turnstile");
    if (cfg.turnstileSiteKey && turnstileHost) {
      turnstileHost.setAttribute("data-sitekey", cfg.turnstileSiteKey);
      var s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true; s.defer = true;
      document.head.appendChild(s);
    } else if (turnstileHost) {
      turnstileHost.classList.add("hidden");
    }

    var rec = readReceivedState(cfg);
    if (rec) { dom.submitted = rec; }
    updateResultsCta();
  }

  // ui.js calls this after every evaluation with the inputs and the result it rendered.
  function noteEvaluation(inputs, result) {
    dom.lastInputs = inputs;
    dom.lastResult = result;
  }

  function init() {
    dom.cfg = (typeof window !== "undefined" && window.OXY_LEADS_CONFIG) || {};
    if (!dom.cfg.whatsappNumber) {
      console.error("OXY_LEADS_CONFIG.whatsappNumber is missing — the WhatsApp route cannot work.");
    }
    if (!dom.cfg.endpoint) {
      console.info("Lead capture: no endpoint configured (site/js/leads.config.js); requests travel by WhatsApp only.");
    }
    wireInteractionCounter();
    wireDialog();
    if (isOwnerPreview()) console.info("Lead capture: owner preview — gate is open in this browser.");
  }

  var OxyLeads = {
    REF_FIELDS: REF_FIELDS,
    ROLES: ROLES,
    PONDS: PONDS,
    normalisePhone: normalisePhone,
    validate: validate,
    makeLeadId: makeLeadId,
    encodeRef: encodeRef,
    decodeRef: decodeRef,
    buildPayload: buildPayload,
    buildWhatsAppText: buildWhatsAppText,
    isLocked: isLocked,
    noteEvaluation: noteEvaluation,
    init: init
  };

  if (typeof window !== "undefined") { window.OxyLeads = OxyLeads; }
  if (typeof module !== "undefined") module.exports = OxyLeads;
})();
