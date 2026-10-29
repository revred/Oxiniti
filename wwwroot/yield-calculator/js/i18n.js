/* Oxyniti yield calculator — i18n strings and language switching.
   Implements EXECUTION_PLAN.md section 4.3 (window.OxyI18n.t/setLang) and the WP4 brief's
   Tamil rule: only roi.*, res.*, o.sp*, o.size*, f.species are shipped in `ta` (copied verbatim
   from website/wwwroot/i18n/ta.json); every other string is English-only.

   classic script — assigns window.OxyI18n, no import/export, works from file://
*/
(function () {
  "use strict";

  var STORAGE_KEY = "oxy_lang";

  // English is the complete vocabulary used by index.html / ui.js / charts.js.
  var en = {
    "brand.tag": "Yield & profit calculator",
    "nav.theme": "Toggle theme",
    "nav.lang.en": "English",
    "nav.lang.ta": "தமிழ் (partial)",

    "banner.no_model": "Model not loaded — the calculator cannot run.",
    "banner.no_data": "Data not loaded — the calculator cannot run.",
    "fixture.note": "Showing a sample result from tests/fixtures/result.example.json — the live model is not wired in yet.",
    "fixture.fetch_failed": "Could not load the sample result (tests/fixtures/result.example.json). If you opened this file directly from disk, serve it over HTTP instead — the fixture cannot be fetched under file://.",

    "map.kicker": "Tamil Nadu aquaculture",
    "map.h2": "Click a district to set your pond's location.",
    "map.district_select_label": "Or choose a district",
    "district.card.title": "District",
    "district.card.production": "Inland production",
    "district.card.station": "Climate station",
    "district.card.placeholder": "Click the map or choose a district to see its production statistics and climate station.",
    "district.card.no_figure": "No published figure",

    "input.district": "District",
    "input.species_panel_toggle": "All species and their sourced data",
    "input.depth_m": "Average water depth",
    "input.depth_hint": "Default is an assumed typical depth, not a sourced Tamil Nadu figure — adjust to match your pond.",
    "input.density_per_acre": "Stocking density",
    "input.station_name": "City (climate station)",
    "input.station_default_option": "Use the district's station",
    "input.station_hint": "Optional — pick a city to see this species' numbers under that city's climate instead of the district default. The reference crop used for the size comparison stays anchored to Tiruchirappalli either way.",
    "input.stock_month": "Stocking month",
    "input.bloom": "Pond colour (plankton bloom)",
    "input.bloom_hint": "Secchi-disc hint: the less clearly you can see a white disc lowered into the water, the denser the bloom — dense blooms draw down more oxygen overnight.",
    "input.feed_price_inr_kg": "Pellet feed price",
    "input.existing_aeration_kw": "Existing aeration",
    "input.existing_run_h": "Existing aeration hours",
    "input.tariff_inr_kwh": "Electricity tariff",
    "input.tariff_custom": "Custom tariff (₹/kWh)",
    "input.unit_model": "Nano-bubble generator",
    "input.n_units_mode": "Number of units",
    "input.n_units_manual": "Units (manual)",
    "input.unit_price_inr": "Unit price",
    "input.unit_price_hint": "Prefilled with a rough estimate (ASSUMED) — replace it with a real quote when you have one.",
    "input.o2_input_lpm_override": "Oxygen delivery per unit (datasheet)",
    "input.power_kw_override": "Electrical input per unit (datasheet)",
    "input.override_hint": "Enter the OEM datasheet figure if you have it — leave blank to use the published product value.",
    "input.concentrator_kw": "Oxygen concentrator power",
    "input.concentrator_hint": "Prefilled from the product page. Clearing it excludes the concentrator from the electricity cost with a warning.",
    "input.concentrator_price_inr": "Oxygen concentrator price",
    "input.concentrator_price_hint": "Prefilled with a rough estimate (ASSUMED) — replace it with a real quote when you have one.",
    "input.maintenance_pct": "Maintenance per year",
    "input.maintenance_hint": "Per cent of capex, ASSUMED. Applied every year against the extra profit.",
    "input.subsidy_pct": "Subsidy on unit",
    "input.run_h": "Run hours",
    "input.include_fcr_gain": "Apply FCR improvement (advanced, unverified)",
    "input.include_fcr_gain_hint": "−7% feed conversion at full relief — a single-pond trial (Mauladani et al. 2020), status UNTESTED. Off by default.",
    "input.advanced": "Advanced",
    "input.aeration_none": "None",
    "input.aeration_1x1": "1 × 1 HP paddlewheel",
    "input.aeration_2x1": "2 × 1 HP paddlewheel",
    "input.aeration_2x2": "2 × 2 HP paddlewheel",
    "input.aeration_custom": "Custom (kW)",
    "input.tariff_custom_option": "Custom",
    "input.n_units_auto": "Auto (sized to your pond)",
    "input.n_units_manual_option": "Manual",

    "month.1": "January", "month.2": "February", "month.3": "March", "month.4": "April",
    "month.5": "May", "month.6": "June", "month.7": "July", "month.8": "August",
    "month.9": "September", "month.10": "October", "month.11": "November", "month.12": "December",

    "results.h3": "Your estimate",
    "results.harv_sub": "per crop / per year, low–high",
    "results.profit": "Estimated extra profit",
    "results.profit_sub": "per crop / per year, low–high",
    "results.payback": "Payback on the unit",
    "results.payback_blocked": "Payback blocked",
    "results.investment": "Investment",
    "results.station": "Climate used",
    "results.units": "Units needed",
    "results.units_sub": "to relieve the worst crop month",
    "results.units_best": "Best number of units for profit",
    "results.units_relief": "Units for full pre-dawn relief",
    "results.baseline": "Baseline, for context",
    "results.baseline_kg": "harvest",
    "results.baseline_profit": "profit",
    "results.warnings_h": "Warnings",
    "results.cta_report": "Get my pond report",
    "results.gate_note": "Extra profit, payback, unit sizing, the month-by-month oxygen budget and the charts go into a written report for your pond. We check every request by hand before sending it.",
    "results.locked": "In your pond report",
    "results.locked_sub": "Sent to your WhatsApp after we check your request",
    "results.copy_done": "Copied to clipboard.",
    "results.copy_failed": "Couldn't copy automatically — select and copy the text manually.",
    "chart.locked": "Included in your pond report.",
    "banner.no_leads": "Lead capture not loaded — the report request form cannot run.",

    "lead.h3": "Get your pond report",
    "lead.sub": "Tell us where to send it. Every request is checked by a person before the report goes out, so please give the details a field representative could call you on.",
    "lead.name": "Name",
    "lead.phone": "WhatsApp number",
    "lead.phone_hint": "10-digit Indian mobile number. The report is sent to this number.",
    "lead.village": "Village / town",
    "lead.district": "District",
    "lead.district_hint": "From the map above; change it there.",
    "lead.role": "You are",
    "lead.role.choose": "Choose",
    "lead.role.owner": "Farm owner",
    "lead.role.manager": "Farm manager",
    "lead.role.planning": "Planning a new pond",
    "lead.role.consultant": "Consultant / trader",
    "lead.role.supplier": "Equipment supplier",
    "lead.role.other": "Other",
    "lead.ponds": "Number of ponds",
    "lead.ponds.choose": "Choose",
    "lead.area_total": "Total water area (acres, optional)",
    "lead.best_time": "Best time to call (optional)",
    "lead.email": "E-mail (optional)",
    "lead.challenge": "Quick check: what is",
    "lead.honeypot_label": "Website",
    "lead.consent": "Oxyniti may contact me on WhatsApp or phone about this estimate and a free DO-meter demo.",
    "lead.privacy": "Your details are used only to prepare and send your report and to arrange the demo. They are not sold or shared.",
    "lead.submit": "Request my report",
    "lead.sending": "Sending…",
    "lead.cancel": "Not now",
    "lead.err.name": "Please enter your name (at least two letters).",
    "lead.err.phone": "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.",
    "lead.err.village": "Please enter your village or town.",
    "lead.err.role": "Please tell us your role.",
    "lead.err.ponds": "Please tell us how many ponds you have.",
    "lead.err.area_total": "Total water area must be between 0.1 and 5000 acres.",
    "lead.err.email": "That e-mail address does not look right.",
    "lead.err.consent": "Please tick the box so we are allowed to contact you.",
    "lead.err.challenge": "The quick check answer is not right.",
    "lead.err.timing": "That was quick. Please take a moment to check your details and try again.",
    "lead.received_h": "Request received",
    "lead.received_ref": "Reference",
    "lead.received_sent": "We have your request. We check every request by hand and send the report to your WhatsApp",
    "lead.received_whatsapp": "One more step: tap the WhatsApp button so the request reaches us from your number. We check every request by hand and send the report back",
    "lead.cta_whatsapp": "Send request on WhatsApp",
    "lead.cta_copy": "Copy request",
    "lead.cta_received": "Request received — view details",
    "lead.request_again": "Submit a different request",
    "lead.wa_title": "Oxyniti pond report request",
    "lead.wa_total": "total",
    "lead.wa_pond": "Pond",
    "lead.wa_ref": "Ref",
    "lead.wa_stocked": "stocked",
    "results.ceiling_note": "Capped at the internal model's +18 % saleable kg (+12 % growth, +5 points survival), applied in proportion to how oxygen-limited the pond is in each crop month. Not a guarantee. We verify on your pond with a DO meter during the free demo.",
    "results.placeholder": "Set your pond's inputs on the left to see an estimate.",

    "season.h3": "Seasonal strip",
    "season.sub": "Water temperature, thermal suitability and oxygen stress before/after, month by month.",
    "season.row_temp": "Pond water temperature (°C)",
    "season.row_thermal": "Thermal suitability for this species",
    "season.row_stress": "Oxygen stress index, before (base) vs after (with OXY-Nano)",
    "season.legend_optimum": "Species' optimum temperature zone",
    "season.legend_crop": "Crop window",
    "season.legend_base": "Before (s_base)",
    "season.legend_oxy": "After (s_oxy)",
    "season.legend_green": "Suitable",
    "season.legend_amber": "Marginal",
    "season.legend_red": "Outside tolerable range",

    "waterfall.h3": "Profit waterfall",
    "waterfall.sub": "How the extra profit is built, per crop — low case and high case side by side.",
    "waterfall.baseline": "Baseline profit",
    "waterfall.revenue": "+ Extra revenue",
    "waterfall.feed": "− Extra feed",
    "waterfall.elec": "− Extra electricity",
    "waterfall.maintenance": "− Maintenance",
    "waterfall.final": "With OXY-Nano",
    "waterfall.low_case": "Low case",
    "waterfall.high_case": "High case",
    "waterfall.axis": "₹ per crop",

    "station_compare.h3": "Where does this species grow best?",
    "station_compare.note": "This comparison keeps every other input fixed and varies only the city's climate.",
    "station_compare.col_city": "City",
    "station_compare.col_district": "District",
    "station_compare.col_gt": "Growth-days factor",
    "station_compare.col_harvest_size": "Harvest size",
    "station_compare.col_baseline": "Baseline harvest",
    "station_compare.col_ds": "Oxygen relief",
    "station_compare.col_extra_harvest": "Extra harvest (high)",
    "station_compare.col_extra_profit": "Extra profit (high)",
    "station_compare.col_units": "Units",
    "station_compare.current_badge": "in use",
    "station_compare.loading": "Comparing 32 stations…",
    "station_compare.unavailable": "Station comparison is not available yet.",
    "station_compare.error_prefix": "Could not evaluate: ",

    "assumptions.h3": "Assumptions",
    "assumptions.sub": "Every parameter behind this estimate — value, unit, status, date and source.",
    "assumptions.col_label": "Parameter",
    "assumptions.col_value": "Value",
    "assumptions.col_status": "Status",
    "assumptions.col_date": "Date",
    "assumptions.col_source": "Source",
    "assumptions.empty": "No assumptions reported by the model yet.",

    "method.h3": "How this is calculated",
    "method.sub": "In words — see plan/MODEL_SPEC.md for the equations.",
    "method.step1.h": "1. Pond water temperature",
    "method.step1.p": "Each district is matched to the nearest climate station. Monthly mean air temperature is converted to pond water temperature with a simple regression, since shallow tropical ponds track air temperature closely.",
    "method.step2.h": "2. Thermal suitability",
    "method.step2.p": "Each species has a tolerable range and a narrower optimum range. A month scores 1 when the water is within the optimum band, sliding down to 0 at the tolerable edges and beyond. The crop's average score, relative to the same species stocked at its default month in Tiruchirappalli, scales the harvest size up or down.",
    "method.step3.h": "3. Night-time oxygen budget",
    "method.step3.p": "For each crop month, the pond's dissolved oxygen at dusk is reduced overnight by fish respiration, plankton respiration and sediment demand, offset by any existing aeration and a small diffusion term. The result is the dawn dissolved oxygen the fish actually experience.",
    "method.step4.h": "4. Oxygen stress and relief",
    "method.step4.p": "A stress index compares dawn oxygen to the species' growth threshold and lethal limit. The OXY-Nano unit adds oxygen by mass balance from its published litres-per-minute rating, and the resulting relief — averaged over the crop — drives the uplift.",
    "method.step5.h": "5. Uplift, capped",
    "method.step5.p": "Relief is converted to extra growth and extra survival, calibrated so a fully oxygen-limited pond reaches the internal model's ceiling of +18 % extra saleable kilograms — never more. A partially-limited pond gets proportionally less.",
    "method.step6.h": "6. Economics and payback",
    "method.step6.p": "Extra harvest at your farm-gate price, less the extra feed and electricity it costs to produce, gives the extra profit per crop and per year. Payback divides the unit's capital cost (less any subsidy) by the extra annual profit; it stays blocked until you enter a real unit price.",
    "method.step7.h": "7. Sizing the units",
    "method.step7.p": "The number of units needed is set by the worst crop month's oxygen deficit, so the unit count reflects your pond's night-time chemistry rather than a flat per-acre rule.",

    "limitations.h3": "Known limitations",
    "limitations.l1": "Monthly climate normals are used, not this year's actual weather.",
    "limitations.l2": "Growth and mortality are modelled as linear through the crop; there is no disease, water-exchange or algal-crash model.",
    "limitations.l3": "The uplift is calibrated to an internal conservative model, not measured on your pond.",
    "limitations.l4": "Prices are the sourced range on the sourcing date; your own price overrides them.",

    "footer.sources_h": "Data sources and licences",
    "footer.made": "Built for Tamil Nadu fish and shrimp farmers.",
    "footer.disclaimer": "Estimates only. We verify your pond's real numbers with a free DO-meter demo before you pay anything.",

    "warning.THERMAL_OUT_OF_RANGE": "One or more months this crop fall outside this species' tolerable temperature range — oxygen will not fix this.",
    "warning.CEILING_CLAMPED": "The high-case uplift has been capped at the internal model's +18 % ceiling.",
    "warning.SIZING_CAPPED": "This pond is larger than this product line can relieve at its published oxygen input — the unit count has been capped at 20.",
    "warning.CONCENTRATOR_POWER_UNKNOWN": "The oxygen concentrator's power draw isn't published, so it has been left out of the electricity cost.",
    "warning.PRICE_OUT_OF_SOURCED_RANGE": "The farm-gate price entered is outside the sourced range for this species.",
    "warning.NOT_OXYGEN_LIMITED": "This pond is not oxygen-limited under the current inputs — a unit would add little benefit here.",
    "warning.NO_PAYBACK_AT_PUBLISHED_O2": "At the published oxygen input of this product the extra fish do not cover the electricity for any number of units. Enter the datasheet oxygen delivery under Advanced.",

    "error.tariff_missing": "Enter an electricity tariff in ₹ per kWh, or choose one of the published tariffs.",
    "results.band_to": "to",
    "results.sensitivity": "Sensitivity check 2026-09-21 (final model): the oxygen delivery per unit and the stocking density move this estimate more than any other input. At the owner-stated 1–2 L/min no number of units pays back at any tariff; at 20 L/min per unit on an intensively stocked pond (20,235/acre) one unit pays back in about 25 months, or 10 months with a 60 % PMMSY subsidy.",

    // reused verbatim from website/wwwroot/i18n/ta.json (English source text, for parity with `ta`)
    "roi.kicker": "Your profit",
    "roi.h2": "Slide to see what more oxygen is worth.",
    "roi.h3": "Your pond",
    "roi.sub": "Move the sliders — estimates update instantly.",
    "roi.size": "Pond size",
    "roi.price": "Farm-gate price",
    "roi.harv": "Estimated extra harvest",
    "roi.rev": "Estimated extra revenue",
    "roi.acre": "acre",
    "roi.acres": "acres",
    "roi.kgyr": "kg / year",
    "roi.perkg": "/kg",
    "res.kicker": "What it means for your harvest",
    "res.h2": "Oxygen is the cheapest growth promoter ever made.",
    "res.fine": "*Figures are typical ranges reported in published nano-bubble aquaculture studies and field trials; results vary with species, pond condition and management. We prove it on your pond with a free DO-meter demo before you pay anything.",
    "f.species": "What do you farm?",
    "o.size1": "Under ½ acre",
    "o.size2": "½ – 1 acre",
    "o.size3": "1 – 3 acres",
    "o.size4": "3+ acres / multiple ponds",
    "o.sp1": "Tilapia / GIFT",
    "o.sp2": "Murrel (Viral meen)",
    "o.sp3": "Pangasius",
    "o.sp4": "Freshwater prawn",
    "o.sp5": "Carp polyculture",
    "o.sp6": "Biofloc / RAS",
    "o.sp7": "Other"
  };

  // Tamil — ONLY the roi.*, res.*, o.sp*, o.size*, f.species keys that already exist on the
  // live site (website/wwwroot/i18n/ta.json), copied verbatim. Nothing here is machine-translated;
  // every other key falls back to English. `roi.note` (the old 20–30% claim) is deliberately not
  // wired to any element in this tool since DEVIATIONS.md supersedes that figure — showing its
  // Tamil translation next to the new +18% ceiling text would contradict the English copy.
  var ta = {
    "roi.acre": "ஏக்கர்",
    "roi.acres": "ஏக்கர்",
    "roi.h2": "அதிக ஆக்ஸிஜனின் மதிப்பைப் பார்க்க ஸ்லைடு செய்யுங்கள்.",
    "roi.h3": "உங்கள் குளம்",
    "roi.harv": "மதிப்பிடப்பட்ட கூடுதல் அறுவடை",
    "roi.kgyr": "கிலோ / ஆண்டு",
    "roi.kicker": "உங்கள் லாபம்",
    "roi.perkg": "/கிலோ",
    "roi.price": "விவசாய விற்பனை விலை",
    "roi.rev": "மதிப்பிடப்பட்ட கூடுதல் வருமானம்",
    "roi.size": "குள அளவு",
    "roi.sub": "ஸ்லைடர்களை நகர்த்துங்கள் — மதிப்பீடுகள் உடனே மாறும்.",
    "res.fine": "*இவை வெளியிடப்பட்ட நானோ-குமிழி ஆய்வுகள் மற்றும் கள சோதனைகளில் பதிவான வழக்கமான வரம்புகள்; இனம், குள நிலை, மேலாண்மைக்கு ஏற்ப மாறும். பணம் செலுத்தும் முன், உங்கள் குளத்தில் இலவச DO-மீட்டர் டெமோவில் நிரூபிக்கிறோம்.",
    "res.h2": "ஆக்ஸிஜன்தான் உலகின் மலிவான வளர்ச்சி ஊக்கி.",
    "res.kicker": "உங்கள் அறுவடைக்கு இதன் பொருள்",
    "o.size1": "½ ஏக்கருக்கும் குறைவு",
    "o.size2": "½ – 1 ஏக்கர்",
    "o.size3": "1 – 3 ஏக்கர்",
    "o.size4": "3+ ஏக்கர் / பல குளங்கள்",
    "o.sp1": "திலாப்பியா / GIFT",
    "o.sp2": "விரால் மீன்",
    "o.sp3": "பங்காசியஸ்",
    "o.sp4": "நன்னீர் இறால்",
    "o.sp5": "கெண்டை கலப்பு பயிர்",
    "o.sp6": "பயோஃப்ளாக் / RAS",
    "o.sp7": "மற்றவை",
    "f.species": "எதை வளர்க்கிறீர்கள்?"
  };

  var strings = { en: en, ta: ta };
  var current = "en";

  function detectInitial() {
    try {
      var stored = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "ta") return stored;
    } catch (e) { /* localStorage unavailable — fall through */ }
    return "en";
  }

  function t(key, fallback) {
    var table = strings[current] || strings.en;
    var v = table[key];
    if (v === undefined || v === null) v = strings.en[key];
    if (v === undefined || v === null) v = (fallback !== undefined ? fallback : key);
    return v;
  }

  function applyTranslations(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var key = el.getAttribute("data-i18n");
      el.textContent = t(key, el.textContent);
    }
    var phNodes = scope.querySelectorAll("[data-i18n-ph]");
    for (var j = 0; j < phNodes.length; j++) {
      var pel = phNodes[j];
      pel.setAttribute("placeholder", t(pel.getAttribute("data-i18n-ph"), pel.getAttribute("placeholder") || ""));
    }
    var titleNodes = scope.querySelectorAll("[data-i18n-title]");
    for (var k = 0; k < titleNodes.length; k++) {
      var tel = titleNodes[k];
      tel.setAttribute("title", t(tel.getAttribute("data-i18n-title"), tel.getAttribute("title") || ""));
    }
    if (document.documentElement) {
      document.documentElement.setAttribute("lang", current === "ta" ? "ta" : "en");
    }
  }

  function setLang(code) {
    current = (code === "ta") ? "ta" : "en";
    try { window.localStorage && window.localStorage.setItem(STORAGE_KEY, current); } catch (e) { /* ignore */ }
    applyTranslations(document);
    try {
      document.dispatchEvent(new CustomEvent("oxy:langchange", { detail: { lang: current } }));
    } catch (e) { /* older browsers without CustomEvent constructor support — ignore */ }
  }

  function getLang() { return current; }

  current = detectInitial();

  window.OxyI18n = {
    t: t,
    setLang: setLang,
    getLang: getLang,
    applyTranslations: applyTranslations
  };
})();
