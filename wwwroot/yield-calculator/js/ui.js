/* Oxyniti yield calculator — UI: owns the DOM, wires inputs to OxyModel.evaluate.
   Implements EXECUTION_PLAN.md section 4.3 (ui.js <-> model) and the WP4 BEHAVIOUR/INPUT
   CARD/RESULTS CARD/LEAD CAPTURE brief. Never fabricates a number: every figure shown comes
   from `result` (interface 4.2) or from the OXY_DATA envelope fields (interface 4.1).

   Report gate (plan/LEAD_CAPTURE.md, 2026-09-22): while OxyLeads.isLocked() the extra-harvest
   band is the only model output written to the page. Profit, payback, investment, unit
   sizing, the seasonal strip, the station comparison and the waterfall are replaced by a
   "in your pond report" label and never enter the DOM; the owner sends them as a report
   after vetting the request.

   classic script — no import/export, works from file://
*/
(function () {
  "use strict";

  var DEBOUNCE_MS = 50;
  var COMPARE_DEBOUNCE_MS = 200; // A9.4: 32 evaluations, so a longer debounce than the single evaluate
  var LAKH = 100000;
  var DEFAULT_SPECIES_ID = "gift-tilapia";   // MODEL_SPEC.md section 1, `species` default
  var DEFAULT_DISTRICT = "Tiruchirappalli";  // MODEL_SPEC.md section 1, `district` default
  var AERATION_OPTIONS = [
    { kw: 0, val: "0" },
    { kw: 0.7457, val: "0.7457" },
    { kw: 1.4914, val: "1.4914" },
    { kw: 2.9828, val: "2.9828" }
  ];
  var MONTH_ABBR = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var WARNING_KEYS = {
    THERMAL_OUT_OF_RANGE: "warning.THERMAL_OUT_OF_RANGE",
    CEILING_CLAMPED: "warning.CEILING_CLAMPED",
    SIZING_CAPPED: "warning.SIZING_CAPPED",
    NO_PAYBACK_AT_PUBLISHED_O2: "warning.NO_PAYBACK_AT_PUBLISHED_O2",
    CONCENTRATOR_POWER_UNKNOWN: "warning.CONCENTRATOR_POWER_UNKNOWN",
    PRICE_OUT_OF_SOURCED_RANGE: "warning.PRICE_OUT_OF_SOURCED_RANGE",
    NOT_OXYGEN_LIMITED: "warning.NOT_OXYGEN_LIMITED"
  };
  var SEVERE_WARNINGS = { THERMAL_OUT_OF_RANGE: true, SIZING_CAPPED: true };

  var RANGE_CONFIG = {
    "in-area_acre": { out: "out-area_acre", fmt: function (v) { return fmtNum(v, 2) + " " + (Math.abs(v - 1) < 1e-9 ? T("roi.acre", "acre") : T("roi.acres", "acres")); } },
    "in-depth_m": { out: "out-depth_m", fmt: function (v) { return fmtNum(v, 1) + " m"; } },
    "in-density_per_acre": { out: "out-density_per_acre", fmt: function (v) { return fmtNum(Math.round(v), 0) + " /acre"; } },
    "in-price_inr_kg": { out: "out-price_inr_kg", fmt: function (v) { return "₹" + fmtNum(Math.round(v), 0) + T("roi.perkg", "/kg"); } },
    "in-feed_price_inr_kg": { out: "out-feed_price_inr_kg", fmt: function (v) { return "₹" + fmtNum(Math.round(v), 0) + "/kg"; } },
    "in-existing_run_h": { out: "out-existing_run_h", fmt: function (v) { return fmtNum(v, 0) + " h/night"; } },
    "in-run_h": { out: "out-run_h", fmt: function (v) { return fmtNum(v, 0) + " h/night"; } }
  };

  var state = {
    data: null,
    lastResult: null,
    debounceTimer: null,
    settingControlsFromCode: false,
    // the last real tariff preset the farmer had selected, so switching to "Custom" can start
    // from the rate that was on screen rather than from nothing (see the tariff listener)
    lastTariffPresetId: null,
    // station comparison (amendment A9.4)
    compareDebounceTimer: null,
    compareRows: null,
    compareSortKey: "profit_year_high",
    compareSortDir: "desc"
  };

  function T(key, fallback) {
    return (window.OxyI18n && window.OxyI18n.t) ? window.OxyI18n.t(key, fallback) : fallback;
  }
  // The report gate. Defaults to locked when leads.js is absent, never to open.
  function gateLocked() {
    return (window.OxyLeads && typeof window.OxyLeads.isLocked === "function") ? window.OxyLeads.isLocked() : true;
  }
  function setLockedBand(id, subEl) {
    var elx = document.getElementById(id);
    if (!elx) return;
    elx.textContent = T("results.locked", "In your pond report");
    elx.classList.add("is-locked");
    if (subEl) subEl.textContent = T("results.locked_sub", "Sent to your WhatsApp after we check your request");
  }
  function setChartLocked(chartId, noteId, locked) {
    var chart = document.getElementById(chartId);
    var note = document.getElementById(noteId);
    if (locked && chart) chart.innerHTML = "";
    if (note) note.classList.toggle("hidden", !locked);
  }

  /* ================================================================
     formatting — Intl.NumberFormat('en-IN'); rupees in lakh above
     99,999 with one decimal; kg with no decimals; mg/L with two.
     ================================================================ */
  function fmtNum(v, dp) {
    if (v === null || v === undefined || isNaN(v)) return "—";
    var d = dp == null ? 0 : dp;
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }).format(v);
  }
  function fmtKg(v) {
    if (v === null || v === undefined || isNaN(v)) return "—";
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(v)) + " kg";
  }
  /*
   * WP6 defect 3: a loss printed as "₹-13,336" and then joined with an en-dash into
   * "₹-13,336–₹-12,850", which no farmer can parse at a glance — and a loss is precisely the
   * result this tool has to state plainly. The sign now leads the symbol with a true minus
   * sign (U+2212), and bandJoin() switches the range separator to "to" whenever either end is
   * negative, so a sign can never be mistaken for the range dash.
   */
  function fmtINR(v) {
    if (v === null || v === undefined || isNaN(v)) return "—";
    var abs = Math.abs(v);
    var sign = v < 0 ? "−⁠" : "";   /* word joiner: never break after the minus */
    if (abs > 99999) return sign + "₹" + (abs / LAKH).toFixed(1) + " L";
    return sign + "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(abs));
  }
  // Joins a low-high band. An en-dash reads as a range only when neither end carries a sign.
  function bandJoin(loText, hiText, loValue, hiValue) {
    var negative = (loValue < 0) || (hiValue < 0);
    return loText + (negative ? " " + T("results.band_to", "to") + " " : "–") + hiText;
  }
  function fmtMgL(v) {
    if (v === null || v === undefined || isNaN(v)) return "—";
    return Number(v).toFixed(2) + " mg/L";
  }
  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function monthAbbr(m) { return MONTH_ABBR[m] || String(m); }
  function parseFloatOrNull(v) {
    if (v === null || v === undefined || String(v).trim() === "") return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  function parseIntOrNull(v) {
    if (v === null || v === undefined || String(v).trim() === "") return null;
    var n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }

  /* ================================================================
     OXY_DATA envelope helpers ({value, unit, status, date, source}
     where value may be a scalar, a [low, high] range, or null)
     ================================================================ */
  function envLowHigh(field) {
    if (!field || field.value === null || field.value === undefined) return null;
    var v = field.value;
    return Array.isArray(v) ? [v[0], v[1]] : [v, v];
  }
  function envLabel(field, suffix) {
    var lh = envLowHigh(field);
    if (!lh) return "—";
    var s = (lh[0] === lh[1]) ? fmtNum(lh[0], 1) : (fmtNum(lh[0], 1) + "–" + fmtNum(lh[1], 1));
    return s + " " + suffix;
  }
  function findSpecies(data, id) {
    var list = (data && data.species) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  // common_name_ta is itself an envelope ({value, status, date, source, source_url}), not a
  // plain string — confirmed against the real site/data/species.data.js (WP1 output).
  function taName(sp) {
    var f = sp && sp.common_name_ta;
    if (!f) return null;
    if (typeof f === "string") return f;
    return f.value || null;
  }

  /* ================================================================
     theme + language
     ================================================================ */
  function wireThemeToggle() {
    var btn = document.getElementById("theme-toggle");
    var root = document.documentElement;
    var stored = null;
    try { stored = window.localStorage && window.localStorage.getItem("oxy_theme"); } catch (e) { /* ignore */ }
    if (stored === "light" || stored === "dark") root.setAttribute("data-theme", stored);
    /*
     * `?theme=light` / `?theme=dark` pins the theme for this load without touching the stored
     * preference — added by WP6 so screenshots can be taken of both themes deterministically,
     * and so a link can be shared that opens in a known theme.
     */
    try {
      var forced = new URLSearchParams(window.location.search).get("theme");
      if (forced === "light" || forced === "dark") { root.setAttribute("data-theme", forced); }
    } catch (e) { /* ignore */ }
    btn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      var isLight = current === "light" || (!current && window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches);
      var next = isLight ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { window.localStorage && window.localStorage.setItem("oxy_theme", next); } catch (e) { /* ignore */ }
    });
  }

  function wireLangToggle() {
    var sel = document.getElementById("lang-select");
    sel.value = window.OxyI18n.getLang();
    sel.addEventListener("change", function () {
      window.OxyI18n.setLang(this.value);
      rebuildDynamicLabelsAfterLangChange();
    });
  }

  function rebuildDynamicLabelsAfterLangChange() {
    if (!state.data) return;
    var curSpecies = document.getElementById("in-species").value;
    var curDistrict = document.getElementById("in-district").value;
    var curTariff = document.getElementById("in-tariff-preset").value;
    var curSubsidy = document.getElementById("in-subsidy_pct").value;

    buildSpeciesSelect(state.data);
    document.getElementById("in-species").value = curSpecies;
    buildSpeciesPanel(state.data);
    buildTariffSelect(state.data);
    document.getElementById("in-tariff-preset").value = curTariff;
    buildSubsidySelect(state.data);
    document.getElementById("in-subsidy_pct").value = curSubsidy;

    updateAllRangeOutputs();
    if (curDistrict) updateDistrictCard(curDistrict, state.data);
    if (state.lastResult) renderResult(state.lastResult);
  }

  /* ================================================================
     banners
     ================================================================ */
  function showBanner(msg) {
    var el = document.getElementById("model-banner");
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  /* ================================================================
     select builders
     ================================================================ */
  function buildSpeciesSelect(data) {
    var sel = document.getElementById("in-species");
    var prev = sel.value;
    sel.innerHTML = "";
    var list = (data.species || []).slice().sort(function (a, b) {
      return (a.common_name_en || a.id).localeCompare(b.common_name_en || b.id);
    });
    list.forEach(function (sp) {
      var opt = document.createElement("option");
      opt.value = sp.id;
      var label = sp.common_name_en || sp.id;
      var taOptText = taName(sp);
      if (taOptText) label += " — " + taOptText;
      if (sp.estimable === false) {
        opt.disabled = true;
        var missing = (sp.missing || []).join(", ");
        opt.title = "Not enough sourced data to estimate" + (missing ? " — missing: " + missing : "");
        label += " (data incomplete)";
      }
      opt.textContent = label;
      sel.appendChild(opt);
    });
    if (prev) sel.value = prev;
  }

  function buildSpeciesPanel(data) {
    var body = document.getElementById("species-panel-body");
    body.innerHTML = "";
    (data.species || []).forEach(function (sp) {
      var row = document.createElement("div");
      row.className = "species-row" + (sp.estimable === false ? " is-greyed" : "");

      var nameCell = document.createElement("div");
      nameCell.className = "sp-name";
      nameCell.appendChild(document.createTextNode(sp.common_name_en || sp.id));
      var taText = taName(sp);
      if (taText) {
        var taSpan = document.createElement("span");
        taSpan.className = "ta tamil";
        taSpan.textContent = taText;
        nameCell.appendChild(taSpan);
      }
      row.appendChild(nameCell);
      row.appendChild(textCell(envLabel(sp.temp_optimum_c, "°C")));
      row.appendChild(textCell(envLabel(sp.survival_pct, "% survival")));
      row.appendChild(textCell(envLabel(sp.farmgate_price_inr_per_kg, "₹/kg")));

      if (sp.estimable === false && sp.missing && sp.missing.length) {
        var missingRow = document.createElement("div");
        missingRow.className = "sp-missing";
        missingRow.textContent = "Not estimable — missing: " + sp.missing.join(", ");
        row.appendChild(missingRow);
      }
      body.appendChild(row);
    });
  }
  function textCell(str) {
    var d = document.createElement("div");
    d.textContent = str;
    return d;
  }

  function buildDistrictSelect(data) {
    var sel = document.getElementById("in-district");
    var prev = sel.value;
    sel.innerHTML = "";
    var feats = (data.districts && data.districts.features) || [];
    var seen = {}, names = [];
    feats.forEach(function (f) {
      var name = f && f.properties && f.properties.district;
      if (name && !seen[name]) { seen[name] = true; names.push(name); }
    });
    names.sort();
    names.forEach(function (name) {
      var opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      sel.appendChild(opt);
    });
    if (prev) sel.value = prev;
  }

  // amendment A9.1: `station_name` (input, default null = the district's station). The select's
  // own option order is alphabetical by city for browsing; compareStations iterates OXY_DATA's
  // own file order internally, which this does not need to match.
  function buildStationSelect(data) {
    var sel = document.getElementById("in-station_name");
    var prev = sel.value;
    sel.innerHTML = "";
    var defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = T("input.station_default_option", "Use the district's station");
    sel.appendChild(defaultOpt);
    var stations = ((data.climate && data.climate.stations) || []).slice().sort(function (a, b) {
      return (a.name || "").localeCompare(b.name || "");
    });
    stations.forEach(function (st) {
      var opt = document.createElement("option");
      opt.value = st.name;
      opt.textContent = st.name + " — " + (st.district || "");
      sel.appendChild(opt);
    });
    sel.value = prev || "";
  }

  function buildUnitModelSelect(data) {
    var sel = document.getElementById("in-unit_model");
    var prev = sel.value;
    sel.innerHTML = "";
    (data.products || []).forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.label;
      sel.appendChild(opt);
    });
    if (prev) sel.value = prev;
  }

  // The select's option value is the preset's `id` (not its rate): model.js's evaluate() wants
  // `tariff_id` to look up the preset's fixed_inr_per_kw_per_month (MODEL_SPEC.md section 6) —
  // sending only a bare rate silently drops the fixed charge. defaultsFor() also returns a
  // `tariff_id` (from OXY_DATA.economics.default_tariff_id), not a resolved tariff_inr_kwh.
  function buildTariffSelect(data) {
    var sel = document.getElementById("in-tariff-preset");
    sel.innerHTML = "";
    var presets = (data.economics && data.economics.tariff_presets) || [];
    presets.forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.label + " (₹" + Number(p.inr_per_kwh).toFixed(2) + "/kWh)";
      sel.appendChild(opt);
    });
    var custom = document.createElement("option");
    custom.value = "custom";
    custom.textContent = T("input.tariff_custom_option", "Custom");
    sel.appendChild(custom);
  }
  function findTariffPreset(data, id) {
    var presets = (data && data.economics && data.economics.tariff_presets) || [];
    for (var i = 0; i < presets.length; i++) if (presets[i].id === id) return presets[i];
    return null;
  }

  function buildSubsidySelect(data) {
    var sel = document.getElementById("in-subsidy_pct");
    sel.innerHTML = "";
    var opts = (data.economics && data.economics.subsidy_options) || [];
    opts.forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = String(o.pct);
      opt.textContent = o.label + (o.status && o.status !== "VERIFIED" ? " (" + o.status + ")" : "");
      sel.appendChild(opt);
    });
  }

  /* ================================================================
     dynamic slider ranges (MODEL_SPEC.md section 1 Range column)
     ================================================================ */
  function niceStep(lo, hi) {
    var span = Math.max(hi - lo, 1);
    var raw = span / 50;
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    var step = norm <= 1 ? mag : (norm <= 2 ? 2 * mag : (norm <= 5 ? 5 * mag : 10 * mag));
    return step < 1 ? Math.max(step, 0.01) : Math.round(step);
  }
  // MODEL_SPEC.md section 1 (amended 2026-09-21): "from min(sourced low, 0.5 x default) to
  // max(sourced high, 1.5 x default)", where `default` is density_default_per_acre (the
  // yield-consistent figure, amendment A3) when WP1 wrote one, else the species mid. When the
  // model is available, `defaultValue` is the figure OxyModel.defaultsFor already resolved
  // (the same field model.js itself would use), so this never re-derives it independently.
  function localDefaultDensity(sp, lh) {
    var f = sp.density_default_per_acre;
    var v = f && typeof f === "object" ? f.value : f;
    if (typeof v === "number" && isFinite(v)) return v;
    return (lh[0] + lh[1]) / 2;
  }
  function applyDensityRange(sp, defaultValue) {
    var lh = envLowHigh(sp.stocking_density_per_acre);
    if (!lh) return;
    var def = (typeof defaultValue === "number" && isFinite(defaultValue)) ? defaultValue : localDefaultDensity(sp, lh);
    var el = document.getElementById("in-density_per_acre");
    var lo = Math.min(lh[0], 0.5 * def), hi = Math.max(lh[1], 1.5 * def);
    var step = niceStep(lo, hi);
    /*
     * WP6 defect 2: the browser snaps a range input to min + k*step, so the model's default
     * density (GIFT 5,965/acre, amendment A3) landed on 5,982 and the page opened on a
     * scenario the model had not resolved. Shift `min` down onto the same grid as the default
     * so the opening value is exactly the one defaultsFor() returned. `min` only ever moves
     * further from the default, so the sourced range stays inside the slider.
     */
    var min = Math.max(0, Math.floor(lo));
    if (step > 0 && isFinite(def) && def >= min) {
      /* never step past zero: k is capped so min stays non-negative and still on the grid */
      var k = Math.min(Math.ceil((def - min) / step), Math.floor(def / step));
      min = def - k * step;
    }
    el.min = min;
    el.max = Math.ceil(hi);
    el.step = step;
  }
  function applyPriceRange(sp) {
    var lh = envLowHigh(sp.farmgate_price_inr_per_kg);
    if (!lh) return;
    var el = document.getElementById("in-price_inr_kg");
    var lo = lh[0] * 0.7, hi = lh[1] * 1.3;
    el.min = Math.max(0, Math.round(lo));
    el.max = Math.round(hi);
    el.step = 1;
  }
  function priceDefaultLabel(sp) {
    // site/data/species.data.js carries a ready-built `price_default_inr_per_kg.label`
    // (e.g. "₹200/kg, 2026-04-25, unspecified (farmer quote)") — WP1 fallback rule 6.
    // Falls back to constructing one from farmgate_price_inr_per_kg if that's ever absent.
    var f = sp.price_default_inr_per_kg;
    if (f && f.label) return f.label + (f.status ? " (" + f.status + ")" : "");
    var g = sp.farmgate_price_inr_per_kg;
    if (!g || g.value == null) return "";
    var v = Array.isArray(g.value) ? (g.value[0] + g.value[1]) / 2 : g.value;
    var bits = ["₹" + Math.round(v) + "/kg sourced default"];
    if (g.as_of) bits.push(g.as_of);
    bits.push(g.market_level ? g.market_level : "market level unstated");
    if (g.status) bits.push(g.status);
    return bits.join(", ");
  }
  function buildSpeciesPriceNote(sp) {
    var el = document.getElementById("price-sourced-note");
    if (el) el.textContent = priceDefaultLabel(sp);
  }

  /* ================================================================
     range <-> output label sync
     ================================================================ */
  function updateRangeVisual(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var min = parseFloat(el.min), max = parseFloat(el.max), v = parseFloat(el.value);
    var pct = max > min ? ((v - min) / (max - min)) * 100 : 0;
    el.style.setProperty("--fill", pct + "%");
    var cfg = RANGE_CONFIG[id];
    if (cfg) {
      var out = document.getElementById(cfg.out);
      if (out) out.textContent = cfg.fmt(v);
    }
  }
  function updateAllRangeOutputs() {
    Object.keys(RANGE_CONFIG).forEach(updateRangeVisual);
  }
  function setRangeValue(id, value) {
    var el = document.getElementById(id);
    if (!el) return;
    if (value !== null && value !== undefined && !isNaN(value)) el.value = value;
    updateRangeVisual(id);
  }

  /* ================================================================
     aeration / tariff conditional fields
     ================================================================ */
  function applyAerationToControls(kw, runH) {
    var sel = document.getElementById("in-existing_aeration_kw");
    var custom = document.getElementById("in-existing_aeration_kw-custom");
    var match = null;
    for (var i = 0; i < AERATION_OPTIONS.length; i++) {
      if (Math.abs(AERATION_OPTIONS[i].kw - kw) < 1e-3) { match = AERATION_OPTIONS[i]; break; }
    }
    if (match) {
      sel.value = match.val;
      custom.classList.add("hidden");
    } else {
      sel.value = "custom";
      custom.value = kw;
      custom.classList.remove("hidden");
    }
    var row = document.getElementById("existing_run_h-row");
    if (kw > 0) {
      row.classList.remove("hidden");
      setRangeValue("in-existing_run_h", runH != null ? runH : 8);
    } else {
      row.classList.add("hidden");
    }
  }
  function currentAerationKw() {
    var sel = document.getElementById("in-existing_aeration_kw");
    if (sel.value === "custom") return parseFloatOrNull(document.getElementById("in-existing_aeration_kw-custom").value) || 0;
    return parseFloat(sel.value);
  }

  // `tariffId` is what defaultsFor() gives (OXY_DATA.economics.default_tariff_id, or null);
  // `customRate` is only used as a fallback when there is no id to match (e.g. a stale custom
  // entry) — most callers just pass (tariffId, null, data).
  function applyTariffToControls(tariffId, customRate, data) {
    var sel = document.getElementById("in-tariff-preset");
    var custom = document.getElementById("in-tariff-custom");
    var preset = tariffId ? findTariffPreset(data, tariffId) : null;
    if (preset) {
      sel.value = preset.id;
      state.lastTariffPresetId = preset.id;
      custom.classList.add("hidden");
    } else {
      sel.value = "custom";
      custom.value = (typeof customRate === "number" && isFinite(customRate)) ? customRate : "";
      custom.classList.remove("hidden");
    }
  }
  // Returns { tariff_id, tariff_inr_kwh } — both are sent to OxyModel.evaluate so the model can
  // apply the matched preset's fixed_inr_per_kw_per_month as well as its per-kWh rate.
  // model.js prioritises a numeric tariff_inr_kwh over tariff_id (evaluate() treats any numeric
  // rate as user-entered/ASSUMED even when a matching preset id is also sent), so a selected
  // preset sends tariff_id alone — letting the model attribute its real VERIFIED status and
  // source — and only a genuinely custom-typed rate sends tariff_inr_kwh.
  function currentTariff() {
    var sel = document.getElementById("in-tariff-preset");
    if (sel.value === "custom") {
      return { tariff_id: null, tariff_inr_kwh: parseFloatOrNull(document.getElementById("in-tariff-custom").value) };
    }
    return { tariff_id: sel.value || null, tariff_inr_kwh: null };
  }

  /* ================================================================
     district card + map
     ================================================================ */
  function findDistrictFeature(data, name) {
    var feats = (data.districts && data.districts.features) || [];
    for (var i = 0; i < feats.length; i++) {
      if (feats[i].properties && feats[i].properties.district === name) return feats[i];
    }
    return null;
  }
  function updateDistrictCard(name, data) {
    var placeholder = document.getElementById("district-placeholder");
    var body = document.getElementById("district-card-body");
    if (!name) { placeholder.classList.remove("hidden"); body.classList.add("hidden"); return; }
    placeholder.classList.add("hidden");
    body.classList.remove("hidden");
    document.getElementById("district-name").textContent = name;

    var feat = findDistrictFeature(data, name);
    var prodEl = document.getElementById("district-production");
    if (feat && feat.properties && feat.properties.inland_production_t != null) {
      var t = feat.properties.inland_production_t;
      var yr = feat.properties.production_year;
      prodEl.textContent = fmtNum(t, 0) + " t" + (yr ? " (" + yr + ")" : "");
    } else {
      prodEl.textContent = T("district.card.no_figure", "No published figure");
    }

    var stationEl = document.getElementById("district-station");
    var stationName = data.climate && data.climate.district_station_map ? data.climate.district_station_map[name] : null;
    stationEl.textContent = stationName || "—";
  }

  function initMapIfAvailable(data) {
    if (!window.OxyMap || typeof window.OxyMap.init !== "function") return;
    var mapEl = document.getElementById("map");
    try {
      window.OxyMap.init(mapEl, data, { onDistrict: function (name) { setDistrict(name); } });
    } catch (e) {
      console.error("OxyMap.init failed", e);
    }
  }
  function setDistrict(name) {
    var sel = document.getElementById("in-district");
    if (sel.value !== name) sel.value = name;
    updateDistrictCard(name, state.data);
    if (window.OxyMap && typeof window.OxyMap.highlight === "function") {
      try { window.OxyMap.highlight(name); } catch (e) { /* non-fatal */ }
    }
    refreshDefaultsForSpeciesOrDistrict();
  }

  /* ================================================================
     inputs <-> model
     ================================================================ */
  function readInputsFromControls() {
    var aerationKw = currentAerationKw();
    if (aerationKw == null || isNaN(aerationKw)) aerationKw = 0;
    var nMode = document.getElementById("in-n_units-mode").value;
    // model.js's own convention (SPEC_DEFAULTS.n_units, defaultsFor): null means auto-size to
    // n_best, not the string "auto" — isNum(null) is false so the model's `manual` check still
    // falls through correctly either way, but null is the canonical value or WP2 documents.
    var nUnits = nMode === "auto" ? null : parseIntOrNull(document.getElementById("in-n_units-manual").value);
    var tariff = currentTariff();

    var stationVal = document.getElementById("in-station_name").value;

    return {
      district: document.getElementById("in-district").value,
      station_name: stationVal || null,
      species: document.getElementById("in-species").value,
      area_acre: parseFloat(document.getElementById("in-area_acre").value),
      depth_m: parseFloat(document.getElementById("in-depth_m").value),
      density_per_acre: parseFloat(document.getElementById("in-density_per_acre").value),
      stock_month: parseInt(document.getElementById("in-stock_month").value, 10),
      price_inr_kg: parseFloat(document.getElementById("in-price_inr_kg").value),
      feed_price_inr_kg: parseFloat(document.getElementById("in-feed_price_inr_kg").value),
      bloom: document.getElementById("in-bloom").value,
      existing_aeration_kw: aerationKw,
      existing_run_h: aerationKw > 0 ? parseFloat(document.getElementById("in-existing_run_h").value) : 0,
      tariff_id: tariff.tariff_id,
      tariff_inr_kwh: tariff.tariff_inr_kwh,
      unit_model: document.getElementById("in-unit_model").value,
      n_units: nUnits,
      o2_input_lpm_override: parseFloatOrNull(document.getElementById("in-o2_input_lpm_override").value),
      power_kw_override: parseFloatOrNull(document.getElementById("in-power_kw_override").value),
      unit_price_inr: parseFloatOrNull(document.getElementById("in-unit_price_inr").value),
      concentrator_kw: parseFloatOrNull(document.getElementById("in-concentrator_kw").value),
      concentrator_price_inr: parseFloatOrNull(document.getElementById("in-concentrator_price_inr").value),
      maintenance_pct: parseFloatOrNull(document.getElementById("in-maintenance_pct").value),
      subsidy_pct: parseFloat(document.getElementById("in-subsidy_pct").value),
      run_h: parseFloat(document.getElementById("in-run_h").value),
      include_fcr_gain: document.getElementById("in-include_fcr_gain").checked
    };
  }

  function applyInputsToControls(inputs, data) {
    state.settingControlsFromCode = true;
    try {
      document.getElementById("in-district").value = inputs.district;
      // amendment A9.1: defaultsFor always returns station_name: null, so re-running defaults
      // on every species/district change naturally resets the city override to "district default".
      document.getElementById("in-station_name").value = inputs.station_name || "";
      document.getElementById("in-species").value = inputs.species;

      var sp = findSpecies(data, inputs.species);
      if (sp) { applyDensityRange(sp, inputs.density_per_acre); applyPriceRange(sp); buildSpeciesPriceNote(sp); }

      setRangeValue("in-area_acre", inputs.area_acre);
      setRangeValue("in-depth_m", inputs.depth_m);
      setRangeValue("in-density_per_acre", inputs.density_per_acre);
      document.getElementById("in-stock_month").value = String(inputs.stock_month);
      document.getElementById("in-bloom").value = inputs.bloom;
      setRangeValue("in-price_inr_kg", inputs.price_inr_kg);
      setRangeValue("in-feed_price_inr_kg", inputs.feed_price_inr_kg);

      applyAerationToControls(inputs.existing_aeration_kw, inputs.existing_run_h);
      applyTariffToControls(inputs.tariff_id, inputs.tariff_inr_kwh, data);

      document.getElementById("in-unit_model").value = inputs.unit_model;

      var manualEl = document.getElementById("in-n_units-manual");
      if (inputs.n_units == null) {
        document.getElementById("in-n_units-mode").value = "auto";
        manualEl.classList.add("hidden");
      } else {
        document.getElementById("in-n_units-mode").value = "manual";
        manualEl.value = inputs.n_units;
        manualEl.classList.remove("hidden");
      }

      document.getElementById("in-o2_input_lpm_override").value = inputs.o2_input_lpm_override == null ? "" : inputs.o2_input_lpm_override;
      document.getElementById("in-power_kw_override").value = inputs.power_kw_override == null ? "" : inputs.power_kw_override;
      document.getElementById("in-unit_price_inr").value = inputs.unit_price_inr == null ? "" : inputs.unit_price_inr;
      document.getElementById("in-concentrator_kw").value = inputs.concentrator_kw == null ? "" : inputs.concentrator_kw;
      document.getElementById("in-concentrator_price_inr").value = inputs.concentrator_price_inr == null ? "" : inputs.concentrator_price_inr;
      document.getElementById("in-maintenance_pct").value = inputs.maintenance_pct == null ? "" : inputs.maintenance_pct;
      document.getElementById("in-subsidy_pct").value = String(inputs.subsidy_pct);
      setRangeValue("in-run_h", inputs.run_h);
      document.getElementById("in-include_fcr_gain").checked = !!inputs.include_fcr_gain;

      updateAllRangeOutputs();
    } finally {
      state.settingControlsFromCode = false;
    }
  }

  function refreshDefaultsForSpeciesOrDistrict() {
    if (state.settingControlsFromCode) return;
    if (!window.OxyModel || !state.data) { scheduleEvaluate(); return; }
    var species = document.getElementById("in-species").value;
    var district = document.getElementById("in-district").value;
    try {
      var inputs = window.OxyModel.defaultsFor(species, district, state.data);
      applyInputsToControls(inputs, state.data);
    } catch (e) {
      console.error("OxyModel.defaultsFor failed", e);
    }
    scheduleEvaluate();
  }

  /* ================================================================
     evaluate + render (debounced 50 ms)
     ================================================================ */
  function scheduleEvaluate() {
    if (state.debounceTimer) clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(evaluateNow, DEBOUNCE_MS);
    // every input that affects evaluate() also affects compareStations (A9.4 recomputes on
    // every input change), so piggy-backing here covers every existing call site at once.
    scheduleStationCompare();
  }
  function evaluateNow() {
    if (!window.OxyModel || !state.data) return;
    var inputs = readInputsFromControls();
    try {
      var result = window.OxyModel.evaluate(inputs, state.data);
      state.lastResult = result;
      renderResult(result);
      highlightCurrentStationRow();
    } catch (err) {
      renderError(err);
    }
  }

  /* ================================================================
     station comparison (amendment A9.4) — OxyModel.compareStations,
     debounced separately at 200 ms since it is 32 evaluations.
     ================================================================ */
  function scheduleStationCompare() {
    if (state.compareDebounceTimer) clearTimeout(state.compareDebounceTimer);
    state.compareDebounceTimer = setTimeout(runStationCompare, COMPARE_DEBOUNCE_MS);
  }
  function renderCompareStatus(msg) {
    var tbody = document.getElementById("station-compare-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    var tr = document.createElement("tr");
    var td0 = document.createElement("td");
    td0.colSpan = 9;
    td0.className = "compare-table-status";
    td0.textContent = msg;
    tr.appendChild(td0);
    tbody.appendChild(tr);
  }
  function runStationCompare() {
    var tbody = document.getElementById("station-compare-tbody");
    if (!tbody) return;
    if (gateLocked()) {
      state.compareRows = null;
      renderCompareStatus(T("chart.locked", "Included in your pond report."));
      setChartLocked(null, "compare-locked", true);
      return;
    }
    setChartLocked(null, "compare-locked", false);
    if (!window.OxyModel || typeof window.OxyModel.compareStations !== "function" || !state.data) {
      state.compareRows = null;
      renderCompareStatus(T("station_compare.unavailable", "Station comparison is not available yet."));
      return;
    }
    var inputs = readInputsFromControls();
    renderCompareStatus(T("station_compare.loading", "Comparing 32 stations…"));
    try {
      var rows = window.OxyModel.compareStations(inputs, state.data);
      state.compareRows = rows || [];
      renderCompareRows();
    } catch (err) {
      state.compareRows = null;
      renderCompareStatus((err && err.message) ? err.message : String(err));
      console.error("compareStations failed", err);
    }
  }
  function sortedCompareRows() {
    var rows = (state.compareRows || []).slice();
    var key = state.compareSortKey;
    var dir = state.compareSortDir === "asc" ? 1 : -1;
    rows.sort(function (a, b) {
      var aErr = a && a.error != null, bErr = b && b.error != null;
      if (aErr && !bErr) return 1;
      if (bErr && !aErr) return -1;
      if (aErr && bErr) return 0;
      var av = a[key], bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string" || typeof bv === "string") return dir * String(av).localeCompare(String(bv));
      return dir * (av - bv);
    });
    return rows;
  }
  function renderCompareRows() {
    var tbody = document.getElementById("station-compare-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    var rows = sortedCompareRows();
    if (!rows.length) { renderCompareStatus(T("station_compare.unavailable", "Station comparison is not available yet.")); return; }
    var currentStation = (state.lastResult && state.lastResult.station) ? state.lastResult.station.name : null;
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      if (row.station && row.station === currentStation) tr.className = "is-current-station";
      if (row.error != null) {
        tr.classList.add("is-error");
        var tdName = document.createElement("td");
        tdName.textContent = row.station || "—";
        tr.appendChild(tdName);
        var tdErr = document.createElement("td");
        tdErr.colSpan = 8;
        tdErr.textContent = T("station_compare.error_prefix", "Could not evaluate: ") + row.error;
        tr.appendChild(tdErr);
        tbody.appendChild(tr);
        return;
      }
      var cityTd = document.createElement("td");
      cityTd.appendChild(document.createTextNode(row.station));
      if (row.station === currentStation) {
        var badge = document.createElement("span");
        badge.className = "current-badge";
        badge.textContent = T("station_compare.current_badge", "in use");
        cityTd.appendChild(badge);
      }
      if (row.warnings && row.warnings.length) {
        var warnMark = document.createElement("span");
        warnMark.className = "row-warn";
        warnMark.textContent = "⚠";
        warnMark.title = row.warnings.join(", ");
        cityTd.appendChild(warnMark);
      }
      tr.appendChild(cityTd);
      tr.appendChild(td(row.district || "—"));
      tr.appendChild(td(fmtNum(row.G_T, 2)));
      tr.appendChild(td(fmtNum(row.harvest_size_g, 0) + " g"));
      tr.appendChild(td(fmtKg(row.baseline_kg_crop)));
      tr.appendChild(td(fmtNum(row.ds, 2)));
      tr.appendChild(td(fmtKg(row.extra_kg_crop_high)));
      tr.appendChild(td(fmtINR(row.profit_year_high)));
      tr.appendChild(td(row.n_best != null ? String(row.n_best) : "—"));
      tbody.appendChild(tr);
    });
  }
  function highlightCurrentStationRow() {
    if (state.compareRows) renderCompareRows();
  }
  function wireCompareTableSorting() {
    var buttons = document.querySelectorAll("#station-compare-table .sort-btn");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function () {
        var key = this.getAttribute("data-sort-key");
        if (state.compareSortKey === key) {
          state.compareSortDir = state.compareSortDir === "asc" ? "desc" : "asc";
        } else {
          state.compareSortKey = key;
          state.compareSortDir = (key === "station" || key === "district") ? "asc" : "desc";
        }
        for (var j = 0; j < buttons.length; j++) buttons[j].classList.remove("is-sorted-asc", "is-sorted-desc");
        this.classList.add(state.compareSortDir === "asc" ? "is-sorted-asc" : "is-sorted-desc");
        renderCompareRows();
      });
    }
  }

  function renderError(err) {
    var errEl = document.getElementById("result-error");
    var contentEl = document.getElementById("result-content");
    var msg = (err && err.message) ? err.message : String(err);
    var isMissing = window.OxyModel && window.OxyModel.MissingDataError && (err instanceof window.OxyModel.MissingDataError);
    /*
     * WP6 defect 1 (second half): a MissingDataError on a field the farmer controls should read
     * as an instruction, not as the model's internal wording. Anything else still shows the
     * model's own message verbatim — fail loudly, never silently substitute a value.
     */
    if (isMissing && err.field === "tariff_id") {
      errEl.textContent = T("error.tariff_missing",
        "Enter an electricity tariff in ₹ per kWh, or choose one of the published tariffs.");
      errEl.classList.remove("hidden");
      contentEl.classList.add("hidden");
      return;
    }
    errEl.textContent = (isMissing ? "Missing data: " : "Can’t calculate: ") + msg;
    errEl.classList.remove("hidden");
    contentEl.classList.add("hidden");
    console.error(err);
  }

  function renderResult(result) {
    document.getElementById("result-error").classList.add("hidden");
    document.getElementById("result-content").classList.remove("hidden");
    var ph = document.getElementById("result-placeholder");
    if (ph) ph.classList.add("hidden");

    // amendment A9.1: show which climate is actually driving the numbers, since station_name
    // can now override the district's default station.
    var stationEl = document.getElementById("res-station");
    if (stationEl) {
      if (result.station && result.station.name) {
        var stationDistrict = result.station.district || "";
        var nameHasDistrict = stationDistrict && result.station.name.indexOf(stationDistrict) !== -1;
        stationEl.textContent = T("results.station", "Climate used") + ": " + result.station.name +
          (stationDistrict && !nameHasDistrict ? " (" + stationDistrict + ")" : "");
        stationEl.classList.remove("hidden");
      } else {
        stationEl.classList.add("hidden");
      }
    }

    var locked = gateLocked();
    var d = result.delta || {};
    if (d.low && d.high) {
      document.getElementById("res-harvest").textContent =
        bandJoin(fmtKg(d.low.kg_crop), fmtKg(d.high.kg_crop), d.low.kg_crop, d.high.kg_crop) + " per crop  ·  " +
        bandJoin(fmtKg(d.low.kg_year), fmtKg(d.high.kg_year), d.low.kg_year, d.high.kg_year) + " per year";
      if (locked) {
        var profitBand = document.getElementById("res-profit").parentNode;
        setLockedBand("res-profit", profitBand ? profitBand.querySelector(".band-sub") : null);
      } else {
        document.getElementById("res-profit").textContent =
          bandJoin(fmtINR(d.low.profit_crop), fmtINR(d.high.profit_crop), d.low.profit_crop, d.high.profit_crop) + " per crop  ·  " +
          bandJoin(fmtINR(d.low.profit_year), fmtINR(d.high.profit_year), d.low.profit_year, d.high.profit_year) + " per year";
      }
    }

    var pb = result.payback || {};
    var pbEl = document.getElementById("res-payback");
    var investEl = document.getElementById("res-investment");
    if (locked) {
      setLockedBand("res-payback", investEl);
    } else {
      if (pb.status === "ok") {
        pbEl.textContent = fmtNum(pb.months_low, 1) + "–" + fmtNum(pb.months_high, 1) + " months";
      } else {
        pbEl.textContent = pb.reason ? capitalize(pb.reason) : "Blocked";
      }
      // amendment A9.3: "Investment: n x (unit + concentrator) - subsidy" — read directly from
      // result.payback.capex (already computed by the model) rather than recomputed here.
      if (investEl) {
        if (pb.capex != null) {
          investEl.textContent = T("results.investment", "Investment") + ": " + fmtINR(pb.capex);
        } else {
          investEl.textContent = "";
        }
      }
    }

    // MODEL_SPEC.md section 7 (amendment A4): auto sizing uses n_best (the unit count that
    // maximises high-case annual extra profit); n_relief (full pre-dawn relief) is reported
    // alongside it. result.unit.n_units is always the count actually used this evaluation.
    var u = result.unit || {};
    var unitsEl = document.getElementById("res-units");
    var unitsSubEl = unitsEl && unitsEl.parentNode ? unitsEl.parentNode.querySelector(".band-sub") : null;
    if (locked) {
      setLockedBand("res-units", unitsSubEl);
    } else if (u.n_units != null) {
      unitsEl.textContent = u.n_units + " × " + (u.label || u.id || "unit") + (u.sizing === "manual" ? " (manual)" : "");
      var subBits = [];
      if (u.sizing === "auto") {
        subBits.push(T("results.units_best", "Best number of units for profit") + ": " + u.n_best);
      } else if (u.n_best != null && u.n_best !== u.n_units) {
        subBits.push(T("results.units_best", "Best number of units for profit") + " would be " + u.n_best);
      }
      if (u.n_relief != null) subBits.push(T("results.units_relief", "Units for full pre-dawn relief") + ": " + u.n_relief);
      if (u.supply_mg_l_per_unit_night != null) subBits.push(fmtMgL(u.supply_mg_l_per_unit_night) + "/unit/night");
      if (u.deficit_max_mg_l != null) subBits.push("worst-month deficit " + fmtMgL(u.deficit_max_mg_l));
      if (unitsSubEl) unitsSubEl.textContent = subBits.join("  ·  ") || "—";
    } else {
      unitsEl.textContent = "—";
    }

    var baselineEl = document.getElementById("res-baseline");
    var keepLbl = baselineEl.querySelector(".lbl");
    baselineEl.innerHTML = "";
    if (keepLbl) baselineEl.appendChild(keepLbl);
    var b = result.baseline || {};
    appendBaselineStat(baselineEl, "harvest", fmtKg(b.kg));
    appendBaselineStat(baselineEl, "profit", fmtINR(b.profit));

    renderWarnings(result.warnings || []);
    renderAssumptions(result.assumptions || []);

    setChartLocked("season-strip", "season-locked", locked);
    setChartLocked("waterfall", "waterfall-locked", locked);
    if (!locked && window.OxyCharts) {
      var seasonEl = document.getElementById("season-strip");
      var wfEl = document.getElementById("waterfall");
      if (seasonEl) window.OxyCharts.renderSeasonStrip(seasonEl, result);
      if (wfEl) window.OxyCharts.renderWaterfall(wfEl, result);
    }

    if (window.OxyLeads && typeof window.OxyLeads.noteEvaluation === "function") {
      window.OxyLeads.noteEvaluation(readInputsFromControls(), result);
    }
  }

  function appendBaselineStat(container, label, value) {
    var span = document.createElement("span");
    var b = document.createElement("b");
    b.textContent = value + " ";
    span.appendChild(b);
    span.appendChild(document.createTextNode(label));
    container.appendChild(span);
  }

  // Warnings that state an economic or sizing conclusion belong to the report while the gate
  // is locked; input-side warnings (thermal range, price range, concentrator power) stay,
  // because they help the farmer fix the inputs before asking.
  var REPORT_ONLY_WARNINGS = { NO_PAYBACK_AT_PUBLISHED_O2: true, NOT_OXYGEN_LIMITED: true, CEILING_CLAMPED: true, SIZING_CAPPED: true };

  function renderWarnings(list) {
    var ul = document.getElementById("res-warnings");
    ul.innerHTML = "";
    var locked = gateLocked();
    list.forEach(function (w) {
      if (locked && REPORT_ONLY_WARNINGS[w.code]) return;
      var li = document.createElement("li");
      li.className = "warning-item" + (SEVERE_WARNINGS[w.code] ? " is-severe" : "");
      var key = WARNING_KEYS[w.code];
      var sentence = key ? T(key, w.message || w.code) : (w.message || w.code);
      if (w.months && w.months.length) sentence += " (" + w.months.map(monthAbbr).join(", ") + ")";
      li.textContent = sentence;
      ul.appendChild(li);
    });
  }

  function renderAssumptions(list) {
    var tbody = document.getElementById("assumptions-tbody");
    tbody.innerHTML = "";
    if (!list.length) {
      var tr0 = document.createElement("tr");
      var td0 = document.createElement("td");
      td0.colSpan = 5;
      td0.textContent = T("assumptions.empty", "No assumptions reported by the model yet.");
      tr0.appendChild(td0);
      tbody.appendChild(tr0);
      return;
    }
    list.forEach(function (a) {
      var tr = document.createElement("tr");
      tr.appendChild(td(a.label || a.id || ""));
      var valueStr = (a.value == null ? "—" : (Array.isArray(a.value) ? a.value.join("–") : a.value)) + (a.unit ? " " + a.unit : "");
      tr.appendChild(td(valueStr));

      var statusTd = document.createElement("td");
      var badge = document.createElement("span");
      var statusClass = (a.status || "").toLowerCase().replace(/[^a-z_]/g, "");
      badge.className = "badge badge-" + (statusClass || "untested");
      badge.textContent = a.status || "—";
      statusTd.appendChild(badge);
      tr.appendChild(statusTd);

      tr.appendChild(td(a.date || "—"));

      var sourceTd = document.createElement("td");
      if (a.source && /^https?:\/\//.test(a.source)) {
        var link = document.createElement("a");
        link.href = a.source;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "source";
        sourceTd.appendChild(link);
      } else {
        sourceTd.textContent = a.source || "—";
      }
      tr.appendChild(sourceTd);

      tbody.appendChild(tr);
    });
  }
  function td(text) {
    var d = document.createElement("td");
    d.textContent = text;
    return d;
  }

  /* ================================================================
     lead capture — WhatsApp + copy summary
     ================================================================ */
  /* ================================================================
     fixture mode (?fixture=1)
     ================================================================ */
  function loadFixtureAndRender() {
    var noteEl = document.getElementById("fixture-note");
    fetch("../tests/fixtures/result.example.json")
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.json();
      })
      .then(function (result) {
        noteEl.textContent = T("fixture.note", "Showing a sample result from tests/fixtures/result.example.json — the live model is not wired in yet.");
        noteEl.classList.remove("hidden");
        renderResult(result);
      })
      .catch(function (err) {
        noteEl.textContent = T("fixture.fetch_failed", "Could not load the sample result. If you opened this file directly from disk, serve it over HTTP instead.");
        noteEl.classList.remove("hidden");
        console.warn("fixture fetch failed", err);
      });
  }

  /* ================================================================
     event wiring
     ================================================================ */
  function wireInputEvents() {
    document.getElementById("in-species").addEventListener("change", refreshDefaultsForSpeciesOrDistrict);
    document.getElementById("in-district").addEventListener("change", function () { setDistrict(this.value); });
    // amendment A9.1: station_name does not reset species/district defaults, just re-evaluates
    // (and re-runs the 32-station comparison) under the chosen city's climate.
    document.getElementById("in-station_name").addEventListener("change", scheduleEvaluate);

    ["in-area_acre", "in-depth_m", "in-density_per_acre", "in-price_inr_kg", "in-feed_price_inr_kg", "in-existing_run_h", "in-run_h"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", function () { updateRangeVisual(id); scheduleEvaluate(); });
    });

    ["in-stock_month", "in-bloom", "in-unit_model", "in-unit_price_inr", "in-o2_input_lpm_override", "in-power_kw_override",
      "in-concentrator_kw", "in-concentrator_price_inr", "in-maintenance_pct", "in-subsidy_pct", "in-include_fcr_gain", "in-n_units-manual"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("change", scheduleEvaluate);
      el.addEventListener("input", scheduleEvaluate);
    });

    document.getElementById("in-existing_aeration_kw").addEventListener("change", function () {
      var custom = document.getElementById("in-existing_aeration_kw-custom");
      var row = document.getElementById("existing_run_h-row");
      if (this.value === "custom") { custom.classList.remove("hidden"); custom.focus(); }
      else { custom.classList.add("hidden"); }
      var kw = currentAerationKw();
      if (kw > 0) row.classList.remove("hidden"); else row.classList.add("hidden");
      scheduleEvaluate();
    });
    document.getElementById("in-existing_aeration_kw-custom").addEventListener("input", scheduleEvaluate);

    document.getElementById("in-tariff-preset").addEventListener("change", function () {
      var custom = document.getElementById("in-tariff-custom");
      if (this.value === "custom") {
        /*
         * WP6 defect 1: choosing "Custom" while the box was empty sent neither tariff_id nor
         * tariff_inr_kwh, so evaluate() threw MissingDataError and the whole results card was
         * replaced by a developer-worded error before the farmer had typed anything. Seed the
         * box with the rate that was on screen a moment ago — a sourced preset value the page
         * was already showing, never an invented one — so there is always a rate to calculate
         * with, and it is visible in the box the farmer is about to edit.
         */
        if (!custom.value) {
          var prev = findTariffPreset(state.data, state.lastTariffPresetId);
          if (prev && typeof prev.inr_per_kwh === "number") { custom.value = String(prev.inr_per_kwh); }
        }
        custom.classList.remove("hidden");
        custom.focus();
      } else {
        state.lastTariffPresetId = this.value;
        custom.classList.add("hidden");
      }
      scheduleEvaluate();
    });
    document.getElementById("in-tariff-custom").addEventListener("input", scheduleEvaluate);

    document.getElementById("in-n_units-mode").addEventListener("change", function () {
      var manual = document.getElementById("in-n_units-manual");
      if (this.value === "manual") manual.classList.remove("hidden"); else manual.classList.add("hidden");
      scheduleEvaluate();
    });
  }

  /* ================================================================
     bootstrap
     ================================================================ */
  function pickInitialSpecies(data) {
    var list = data.species || [];
    var preferred = null, firstEstimable = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === DEFAULT_SPECIES_ID) preferred = list[i];
      if (!firstEstimable && list[i].estimable !== false) firstEstimable = list[i];
    }
    if (preferred && preferred.estimable !== false) return preferred.id;
    return firstEstimable ? firstEstimable.id : (list[0] ? list[0].id : "");
  }
  function pickInitialDistrict(data) {
    var feats = (data.districts && data.districts.features) || [];
    var names = feats.map(function (f) { return f.properties && f.properties.district; }).filter(Boolean);
    if (names.indexOf(DEFAULT_DISTRICT) !== -1) return DEFAULT_DISTRICT;
    names.sort();
    return names[0] || "";
  }

  function bootstrapInputs(data) {
    buildSpeciesSelect(data);
    buildSpeciesPanel(data);
    buildDistrictSelect(data);
    buildStationSelect(data);
    buildUnitModelSelect(data);
    buildTariffSelect(data);
    buildSubsidySelect(data);
    wireCompareTableSorting();

    var initialSpeciesId = pickInitialSpecies(data);
    var initialDistrict = pickInitialDistrict(data);
    document.getElementById("in-species").value = initialSpeciesId;
    document.getElementById("in-district").value = initialDistrict;
    document.getElementById("in-station_name").value = "";
    updateDistrictCard(initialDistrict, data);

    var sp = findSpecies(data, initialSpeciesId);
    if (sp) {
      applyDensityRange(sp);
      applyPriceRange(sp);
      buildSpeciesPriceNote(sp);
      var densEl = document.getElementById("in-density_per_acre");
      densEl.value = (parseFloat(densEl.min) + parseFloat(densEl.max)) / 2;
      var priceEl = document.getElementById("in-price_inr_kg");
      priceEl.value = (parseFloat(priceEl.min) + parseFloat(priceEl.max)) / 2;
    }
    updateAllRangeOutputs();

    initMapIfAvailable(data);
  }

  function main() {
    wireThemeToggle();
    window.OxyI18n.applyTranslations(document);
    wireLangToggle();
    if (window.OxyLeads && typeof window.OxyLeads.init === "function") {
      try { window.OxyLeads.init(); } catch (e) { console.error("OxyLeads.init failed", e); }
    } else {
      showBanner(T("banner.no_leads", "Lead capture not loaded"));
    }

    var params = new URLSearchParams(window.location.search);
    var isFixture = params.get("fixture") === "1";
    var hasModel = typeof window.OxyModel !== "undefined";
    var hasData = typeof window.OXY_DATA !== "undefined";

    if (hasData) {
      state.data = window.OXY_DATA;
      try { bootstrapInputs(state.data); } catch (e) { console.error("bootstrapInputs failed", e); }
      renderCompareStatus(T("station_compare.unavailable", "Station comparison is not available yet."));
    }

    if (!hasModel) {
      // BEHAVIOUR: show a red banner and stop — never fabricate numbers. `?fixture=1` is the
      // documented exception, so reviewers can see the page before WP2's model.js lands.
      showBanner(T("banner.no_model", "Model not loaded"));
      if (isFixture) loadFixtureAndRender();
      return;
    }

    if (!hasData) {
      showBanner(T("banner.no_data", "Data not loaded"));
      return;
    }

    if (isFixture) loadFixtureAndRender();

    wireInputEvents();
    refreshDefaultsForSpeciesOrDistrict();
  }

  document.addEventListener("DOMContentLoaded", main);
})();
