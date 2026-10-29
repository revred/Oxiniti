/*
 * site/js/model.js — Oxyniti yield and profit calculator: the physical and economic model.
 *
 * Purpose: for one pond in one Tamil Nadu district, turn climate normals, species parameters
 * and pond management into (a) a 12-month picture of water temperature, thermal suitability
 * and night-time dissolved-oxygen stress, (b) the extra saleable kilograms an OXY-Nano unit
 * can win, as a low-high band capped at the internal +18 % claims ceiling, and (c) the crop
 * and annual economics, the number of units the pond needs, and the payback.
 *
 * Implements plan/MODEL_SPEC.md sections 2 (pond temperature), 3 (thermal suitability),
 * 4.1-4.5 (oxygen saturation, biomass, night budget, stress index, nano-bubble mass balance),
 * 5 (uplift and the ceiling), 6 (economics) and 7 (sizing); result shape from
 * plan/EXECUTION_PLAN.md section 4.2. Every numeric coefficient is read from OXY_DATA
 * (site/data/coefficients.data.js = plan/coefficients.json) or from the species, climate,
 * product and economics data files. Nothing physical is hard-coded here.
 *
 * Pure: no DOM, no Date.now(), no randomness, no network. Same inputs give the same result.
 *
 * Stated approximations (all carried into result.assumptions or result.warnings):
 *   - MODEL_SPEC 2: pond water temperature is a linear function of the monthly mean air
 *     temperature, T_w = a + b * T_air, from a Bangladesh nursery-pond regression assumed
 *     transferable to Tamil Nadu. Monthly climate normals, not this year's weather.
 *   - MODEL_SPEC 3: growth in a month scales linearly with the thermal trapezoid; no ration,
 *     photoperiod or size-at-age effects. The species' published harvest size describes the
 *     reference crop (same species, its Tamil Nadu default stocking month, at the
 *     Tiruchirappalli station); other scenarios move proportionally with the size factor.
 *   - MODEL_SPEC 4.2: linear mortality and linear growth in mass through the crop, evaluated
 *     at the mid-point of each crop month. A von Bertalanffy curve is a v2 item.
 *   - MODEL_SPEC 4.3: a single well-mixed pond volume; no stratification, no water exchange,
 *     no algal crash. Diffusion from air is a fixed nightly allowance applied only while the
 *     pond is below saturation. Oxygen supply cannot lift dawn DO above saturation and dawn
 *     DO cannot fall below zero.
 *   - MODEL_SPEC 4.5: the nano-bubble generator's oxygen delivery is bounded by the published
 *     oxygen input rate, not by pump power; gas density, concentrator purity and the dissolved
 *     fraction are ASSUMED and listed in the Assumptions panel.
 *   - MODEL_SPEC 5: the uplift is a calibration to an internal conservative model, not a
 *     measurement on the farmer's pond. The reported extra-kilogram fraction is clamped at the
 *     +18 % claims ceiling, the clamp is flagged, and the clamped figure is what the economics
 *     use, so no money number can exceed the ceiling either.
 *   - MODEL_SPEC 7 (amendment A9): the oxygen input is a range on the product and the model
 *     uses its midpoint; unit price, concentrator power, concentrator price and maintenance
 *     come from the product data, so capex, annual maintenance and payback are computed by
 *     default. A9 figures are owner-stated or owner-authorised rough estimates: the price and
 *     maintenance lines are ASSUMED and are shown as such. `station_name` lets a city's climate
 *     drive the crop while the section 3 reference crop stays at the Tiruchirappalli station.
 *   - MODEL_SPEC 7 (amendment A4): automatic sizing is the unit count that maximises the
 *     high-case annual extra profit (n_best), found by a plain scan over 1..cap, because the
 *     uplift saturates at the ceiling while electricity grows linearly with the unit count.
 *     n_relief, the count that lifts the worst crop month to the growth threshold, is still
 *     reported alongside it and may be larger or smaller than n_best. The advanced overrides
 *     o2_input_lpm_override and power_kw_override replace the product-page oxygen delivery and
 *     shaft power when the OEM datasheet is to hand; the electricity fixed charge follows the
 *     overridden electrical input, since it is levied on connected load.
 *   - Months outside the crop window are drawn in the seasonal strip at the crop-mean biomass,
 *     so the strip shows the seasonal oxygen contrast at a constant stocking. They are excluded
 *     from every crop mean (MODEL_SPEC 4.4).
 *   - Degenerate envelopes: where a thermal ramp has zero width (a tolerable bound equal to the
 *     optimum bound) the ramp is treated as a step; where the growth and lethal DO thresholds
 *     are equal the stress index is a step at that threshold.
 *
 * Interface notes against EXECUTION_PLAN 4.2: doSaturation and thermalFactor take one extra
 * optional trailing argument, the OXY_DATA object (or its .coefficients), so the Node tests can
 * supply the data explicitly; in the browser they fall back to the global OXY_DATA. The
 * published three- and two-argument forms are unchanged.
 *
 * Unit conversions used as literals (definitions, not coefficients): 1 acre = 4046.86 m2
 * (MODEL_SPEC section 1), 1 m3 = 1000 L, 1 kg = 1e6 mg, 1 g = 1000 mg, kelvin = degC + 273.15,
 * per-cent = /100. The horsepower-to-kilowatt factor is read from the coefficients file.
 */

var OxyModel = (function () {
  "use strict";

  /* ---------------------------------------------------------------- constants (definitions) */

  var M2_PER_ACRE = 4046.86;      /* MODEL_SPEC section 1 */
  var L_PER_M3 = 1000;
  var MG_PER_KG = 1e6;
  var MG_PER_G = 1000;
  var KELVIN_OFFSET = 273.15;
  var REFERENCE_DISTRICT = "Tiruchirappalli";   /* MODEL_SPEC section 3 reference crop */

  /*
   * Input defaults that MODEL_SPEC section 1 states in prose and that no data file carries.
   * They are envelopes so that defaultsFor can hand them to the Assumptions panel with a
   * status and a source, exactly like a coefficient. Anything a data file does carry (run
   * hours, subsidy, tariff, prices, densities, stocking month) is read from the data instead.
   */
  var SPEC_DEFAULTS = {
    area_acre: { value: 1.0, unit: "acre", status: "ASSUMED", date: "2026-09-21",
      source: "plan/MODEL_SPEC.md section 1 (default pond water area)" },
    depth_m: { value: 1.5, unit: "m", status: "ASSUMED", date: "2026-09-21",
      source: "plan/MODEL_SPEC.md section 1: no Tamil Nadu typical pond depth was sourced" },
    existing_aeration_kw: { value: 0, unit: "kW", status: "ASSUMED", date: "2026-09-21",
      source: "plan/MODEL_SPEC.md section 1 (default: no existing aeration)" },
    run_h: { value: 8, unit: "h/night", status: "UNTESTED", date: "2026-09-21",
      source: "plan/MODEL_SPEC.md section 1: 8-12 h/day is the published range for pond aerators" },
    bloom: { value: "medium", unit: "-", status: "ASSUMED", date: "2026-09-21",
      source: "plan/MODEL_SPEC.md section 1 (pond colour default: medium bloom)" },
    include_fcr_gain: { value: false, unit: "-", status: "UNTESTED", date: "2026-09-21",
      source: "plan/MODEL_SPEC.md section 1: FCR improvement is an advanced toggle, default off" },
    unit_price_inr: { value: null, unit: "INR", status: "NOT_FOUND", date: "2026-09-21",
      source: "plan/MODEL_SPEC.md section 1: no price on the product data, so payback stays blocked until one is entered" },
    concentrator_kw: { value: null, unit: "kW", status: "NOT_FOUND", date: "2026-09-21",
      source: "plan/MODEL_SPEC.md section 1: the concentrator's power draw is not on the product data" },
    concentrator_price_inr: { value: null, unit: "INR", status: "NOT_FOUND", date: "2026-09-21",
      source: "plan/MODEL_SPEC.md section 1 (amendment A9): no concentrator price on the product data" },
    maintenance_pct: { value: 3, unit: "% of capex per year", status: "ASSUMED", date: "2026-09-21",
      source: "plan/MODEL_SPEC.md section 1 (amendment A9): 3 % of (unit + concentrator) price per year, owner-authorised rough estimate" },
    station_name: { value: null, unit: "-", status: "ASSUMED", date: "2026-09-21",
      source: "plan/MODEL_SPEC.md section 1 (amendment A9): null means the district's own climate station" },
    n_units: { value: null, unit: "count", status: "ASSUMED", date: "2026-09-21",
      source: "plan/MODEL_SPEC.md section 7: null means size automatically to the most profitable unit count" },
    o2_input_lpm_override: { value: null, unit: "L/min", status: "NOT_FOUND", date: "2026-09-21",
      source: "plan/MODEL_SPEC.md section 1 (amendment A4): null means use the product page's published oxygen input; the OEM datasheet figure goes here" },
    power_kw_override: { value: null, unit: "kW", status: "NOT_FOUND", date: "2026-09-21",
      source: "plan/MODEL_SPEC.md section 1 (amendment A4): null means use the shaft kW derived from the published HP" }
  };

  var WARNING_MESSAGES = {
    THERMAL_OUT_OF_RANGE: "One or more crop months fall outside the species' tolerable temperature range - oxygen will not fix this.",
    CEILING_CLAMPED: "The modelled uplift exceeded the internal claims ceiling and has been capped at it.",
    SIZING_CAPPED: "This pond is larger than the product line can relieve at the published oxygen input, so the unit count has been capped.",
    NO_PAYBACK_AT_PUBLISHED_O2: "At the published oxygen input of this product the extra fish do not cover the electricity for any number of units; enter the datasheet oxygen delivery under Advanced.",
    CONCENTRATOR_POWER_UNKNOWN: "The oxygen concentrator's power draw is not published, so it is excluded from the electricity cost - the running cost shown is a lower bound.",
    PRICE_OUT_OF_SOURCED_RANGE: "The farm-gate price entered lies outside the sourced range for this species.",
    NOT_OXYGEN_LIMITED: "This pond is barely oxygen-limited at these inputs, so a nano-bubble unit has little to relieve."
  };

  /* ------------------------------------------------------------------------ error and types */

  function MissingDataError(field, species, message) {
    var msg = message || ("missing load-bearing value: " + field);
    var err = Error.call(this, msg);
    this.name = "MissingDataError";
    this.message = msg;
    this.field = field;
    this.species = species === undefined ? null : species;
    if (Error.captureStackTrace) { Error.captureStackTrace(this, MissingDataError); }
    else if (err && err.stack) { this.stack = err.stack; }
  }
  MissingDataError.prototype = Object.create(Error.prototype);
  MissingDataError.prototype.constructor = MissingDataError;

  /* ------------------------------------------------------------------------ small utilities */

  function isNum(x) { return typeof x === "number" && isFinite(x); }

  function clamp(x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); }

  function isArray(x) { return Object.prototype.toString.call(x) === "[object Array]"; }

  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  function speciesId(species) {
    if (!species) { return null; }
    return species.id || species.common_name_en || null;
  }

  /* An envelope is { value, unit, status, date, source }. Plain values are accepted too. */
  function rawValue(env) {
    if (env === null || env === undefined) { return null; }
    if (typeof env === "number" || typeof env === "string" || typeof env === "boolean") { return env; }
    if (has(env, "value")) { return env.value; }
    return null;
  }

  /* Scalar reading rule (WP1 brief): midpoint of a range; a one-sided range uses its one end. */
  function scalarOf(env) {
    var v = rawValue(env);
    if (isNum(v)) { return v; }
    if (isArray(v)) {
      var lo = isNum(v[0]) ? v[0] : null;
      var hi = isNum(v[1]) ? v[1] : null;
      if (lo !== null && hi !== null) { return (lo + hi) / 2; }
      if (lo !== null) { return lo; }
      if (hi !== null) { return hi; }
    }
    return null;
  }

  /* Bounds reading rule: a range stays a range; a scalar becomes a zero-width range. */
  function rangeOf(env) {
    var v = rawValue(env);
    if (isNum(v)) { return [v, v]; }
    if (isArray(v)) { return [isNum(v[0]) ? v[0] : null, isNum(v[1]) ? v[1] : null]; }
    return [null, null];
  }

  function requireScalar(env, field, species, what) {
    var x = scalarOf(env);
    if (!isNum(x)) {
      throw new MissingDataError(field, species,
        "cannot estimate: " + (what || field) + " is not available" +
        (species ? " for " + species : "") + " (field " + field + ")");
    }
    return x;
  }

  function requireArray(env, n, field) {
    var v = rawValue(env);
    if (!isArray(v) || v.length !== n) {
      throw new MissingDataError(field, null, "coefficient " + field + " must be an array of " + n + " numbers");
    }
    for (var i = 0; i < n; i++) {
      if (!isNum(v[i])) {
        throw new MissingDataError(field, null, "coefficient " + field + "[" + i + "] is not a number");
      }
    }
    return v;
  }

  /* Accepts OXY_DATA, OXY_DATA.coefficients, or nothing (then the global OXY_DATA is used). */
  function coefficientsOf(source) {
    var s = source;
    if (!s && typeof globalThis !== "undefined" && globalThis.OXY_DATA) { s = globalThis.OXY_DATA; }
    if (s && s.coefficients) { return s.coefficients; }
    if (s && s.do_saturation && s.night_budget) { return s; }
    throw new MissingDataError("coefficients", null,
      "the coefficients data file is not loaded (expected OXY_DATA.coefficients)");
  }

  /* Collects, in first-use order and without duplicates, every sourced value the run touched. */
  function Assumptions() { this.list = []; this.index = {}; }

  Assumptions.prototype.note = function (id, label, env, usedValue, unitOverride) {
    if (has(this.index, id)) { return usedValue; }
    var e = (env && typeof env === "object") ? env : {};
    this.index[id] = true;
    this.list.push({
      id: id,
      label: label,
      value: usedValue === undefined ? rawValue(env) : usedValue,
      unit: unitOverride !== undefined ? unitOverride : (e.unit === undefined ? null : e.unit),
      status: e.status === undefined ? "ASSUMED" : e.status,
      date: e.date === undefined ? null : e.date,
      source: e.source === undefined ? null : e.source
    });
    return usedValue;
  };

  Assumptions.prototype.take = function (id, label, env, field, species, what) {
    var x = requireScalar(env, field, species, what);
    this.note(id, label, env, x);
    return x;
  };

  /* -------------------------------------------------------- MODEL_SPEC 4.1: oxygen solubility */

  /*
   * Benson & Krause (1984) Eq. 32 in the mg/L form, the Setschenow salinity term and the
   * USGS pressure factor, with barometric pressure from station elevation on the standard
   * atmosphere. Every coefficient comes from OXY_DATA.coefficients.do_saturation; the
   * standard-atmosphere constants are read out of the formula string the coefficients file
   * carries (g, molar mass of air, R, sea-level temperature, in that order), so that changing
   * the data file changes the model and a malformed entry fails loudly.
   */
  function barometricPressureAtm(elevation_m, coeff) {
    var formula = rawValue(coeff.do_saturation.pressure_from_elevation);
    if (typeof formula !== "string") {
      throw new MissingDataError("do_saturation.pressure_from_elevation", null,
        "the barometric-pressure formula is not available in the coefficients file");
    }
    var nums = formula.match(/[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/g) || [];
    if (nums.length !== 4) {
      throw new MissingDataError("do_saturation.pressure_from_elevation", null,
        "the barometric-pressure formula must carry exactly four constants (g, M, R, T0); found " + nums.length);
    }
    var g = parseFloat(nums[0]);
    var molar = parseFloat(nums[1]);
    var R = parseFloat(nums[2]);
    var T0 = parseFloat(nums[3]);
    return Math.exp(-g * molar * elevation_m / (R * T0));
  }

  function doSaturation(t_c, salinity_ppt, elevation_m, source) {
    if (!isNum(t_c)) { throw new MissingDataError("t_w_c", null, "water temperature is not available"); }
    if (!isNum(salinity_ppt)) { throw new MissingDataError("salinity_ppt", null, "salinity is not available"); }
    if (!isNum(elevation_m)) { throw new MissingDataError("elevation_m", null, "station elevation is not available"); }

    var coeff = coefficientsOf(source);
    var ds = coeff.do_saturation;
    var a = requireArray(ds.ln_cstar_coefficients, 5, "do_saturation.ln_cstar_coefficients");
    var b = requireArray(ds.salinity_term, 3, "do_saturation.salinity_term");
    var c = requireArray(ds.theta_coefficients, 3, "do_saturation.theta_coefficients");
    var d = requireArray(ds.vapour_pressure_coefficients, 3, "do_saturation.vapour_pressure_coefficients");

    var T = t_c + KELVIN_OFFSET;
    var lnC = a[0] + a[1] / T + a[2] / (T * T) + a[3] / (T * T * T) + a[4] / (T * T * T * T);
    lnC = lnC - salinity_ppt * (b[0] + b[1] / T + b[2] / (T * T));
    var cStar = Math.exp(lnC);

    var theta = c[0] + c[1] * t_c + c[2] * t_c * t_c;
    var u = Math.exp(d[0] + d[1] / T + d[2] / (T * T));
    var P = barometricPressureAtm(elevation_m, coeff);
    var Fp = ((P - u) * (1 - theta * P)) / ((1 - u) * (1 - theta));
    return cStar * Fp;
  }

  /* --------------------------------------------------- MODEL_SPEC 2: pond water temperature */

  function pondTemperature(t_air_c, coeff) {
    if (!isNum(t_air_c)) { throw new MissingDataError("t_air_c", null, "air temperature is not available"); }
    var c = coefficientsOf(coeff);
    var a = requireScalar(c.pond_temperature.a_intercept_c, "pond_temperature.a_intercept_c", null,
      "the pond-temperature intercept");
    var b = requireScalar(c.pond_temperature.b_slope, "pond_temperature.b_slope", null,
      "the pond-temperature slope");
    return a + b * t_air_c;
  }

  /* ---------------------------------------------- MODEL_SPEC 3: thermal suitability trapezoid */

  function thermalLimits(species, source) {
    var opt = rangeOf(species.temp_optimum_c);
    if (!isNum(opt[0]) || !isNum(opt[1])) {
      throw new MissingDataError("temp_optimum_c", speciesId(species),
        "cannot estimate: the optimum temperature range is not available for " + speciesId(species));
    }
    var tol = rangeOf(species.temp_tolerable_c);
    var lo = tol[0];
    var hi = tol[1];
    var margin = null;
    if (!isNum(lo) || !isNum(hi)) {
      margin = requireScalar(coefficientsOf(source).thermal.tolerable_fallback_margin_c,
        "thermal.tolerable_fallback_margin_c", null, "the tolerable-range fallback margin");
      if (!isNum(lo)) { lo = opt[0] - margin; }
      if (!isNum(hi)) { hi = opt[1] + margin; }
    }
    return { tt_lo: lo, to_lo: opt[0], to_hi: opt[1], tt_hi: hi, fallback_margin_c: margin };
  }

  function trapezoid(t_w_c, lim) {
    if (t_w_c < lim.tt_lo || t_w_c > lim.tt_hi) { return 0; }
    if (t_w_c >= lim.to_lo && t_w_c <= lim.to_hi) { return 1; }
    if (t_w_c < lim.to_lo) {
      var wLo = lim.to_lo - lim.tt_lo;
      if (wLo <= 0) { return 1; }                        /* zero-width ramp: treat as a step */
      return clamp((t_w_c - lim.tt_lo) / wLo, 0, 1);
    }
    var wHi = lim.tt_hi - lim.to_hi;
    if (wHi <= 0) { return 1; }                          /* zero-width ramp: treat as a step */
    return clamp((lim.tt_hi - t_w_c) / wHi, 0, 1);
  }

  function thermalFactor(t_w_c, species, source) {
    if (!isNum(t_w_c)) {
      throw new MissingDataError("t_w_c", speciesId(species), "water temperature is not available");
    }
    return trapezoid(t_w_c, thermalLimits(species, source));
  }

  /* ------------------------------------------------------------------------- data resolution */

  function findSpecies(data, id) {
    var list = data && data.species;
    if (!list || !list.length) {
      throw new MissingDataError("species", id, "the species data file is not loaded (expected OXY_DATA.species)");
    }
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { return list[i]; }
    }
    throw new MissingDataError("species", id, "no species with id '" + id + "' in the species data file");
  }

  function stationForDistrict(data, district) {
    var climate = data && data.climate;
    if (!climate || !climate.stations || !climate.stations.length) {
      throw new MissingDataError("climate", null, "the climate data file is not loaded (expected OXY_DATA.climate)");
    }
    var map = climate.district_station_map || {};
    var wanted = map[district];
    var i;
    if (wanted) {
      for (i = 0; i < climate.stations.length; i++) {
        if (climate.stations[i].name === wanted) { return climate.stations[i]; }
      }
      throw new MissingDataError("district_station_map", null,
        "district '" + district + "' maps to station '" + wanted + "', which is not in the station list");
    }
    for (i = 0; i < climate.stations.length; i++) {
      if (climate.stations[i].district === district || climate.stations[i].name === district) {
        return climate.stations[i];
      }
    }
    throw new MissingDataError("district_station_map", null,
      "district '" + district + "' is not mapped to a climate station");
  }

  /* MODEL_SPEC amendment A9.2: any of the published stations may drive the crop climate. */
  function stationByName(data, name) {
    var climate = data && data.climate;
    if (!climate || !climate.stations || !climate.stations.length) {
      throw new MissingDataError("climate", null, "the climate data file is not loaded (expected OXY_DATA.climate)");
    }
    for (var i = 0; i < climate.stations.length; i++) {
      if (climate.stations[i].name === name) { return climate.stations[i]; }
    }
    throw new MissingDataError("station_name", null,
      "no climate station named '" + name + "' in the climate data file");
  }

  function referenceStation(data) {
    var climate = data.climate;
    var map = climate.district_station_map || {};
    if (map[REFERENCE_DISTRICT]) { return stationForDistrict(data, REFERENCE_DISTRICT); }
    for (var i = 0; i < climate.stations.length; i++) {
      var s = climate.stations[i];
      if (s.district === REFERENCE_DISTRICT || String(s.name).indexOf(REFERENCE_DISTRICT) === 0) { return s; }
    }
    throw new MissingDataError("climate.stations", null,
      "the reference station for the size factor (" + REFERENCE_DISTRICT + ") is not in the climate data");
  }

  function findProduct(data, id) {
    var list = data && data.products;
    if (!list || !list.length) {
      throw new MissingDataError("products", null, "the products data file is not loaded (expected OXY_DATA.products)");
    }
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { return list[i]; }
    }
    throw new MissingDataError("products", null, "no product with id '" + id + "' in the products data file");
  }

  function smallestProduct(data) {
    var list = data && data.products;
    if (!list || !list.length) {
      throw new MissingDataError("products", null, "the products data file is not loaded (expected OXY_DATA.products)");
    }
    var best = list[0];
    var bestHp = scalarOf(list[0].power_hp);
    for (var i = 1; i < list.length; i++) {
      var hp = scalarOf(list[i].power_hp);
      if (isNum(hp) && (!isNum(bestHp) || hp < bestHp)) { best = list[i]; bestHp = hp; }
    }
    return best;
  }

  function tariffPreset(data, id) {
    var presets = (data.economics && data.economics.tariff_presets) || [];
    for (var i = 0; i < presets.length; i++) {
      if (presets[i].id === id) { return presets[i]; }
    }
    return null;
  }

  function isFreshwater(species) {
    var wt = rawValue(species.water_type);
    return String(wt === null ? "" : wt).toLowerCase().indexOf("fresh") === 0;
  }

  function monthTemperatures(station) {
    if (!station.months || station.months.length !== 12) {
      throw new MissingDataError("climate.stations[].months", null,
        "station '" + station.name + "' does not carry twelve monthly normals");
    }
    var out = [];
    for (var i = 0; i < 12; i++) {
      var mo = station.months[i];
      var tmax = scalarOf(mo.tmax_c);
      var tmin = scalarOf(mo.tmin_c);
      if (!isNum(tmax) || !isNum(tmin)) {
        throw new MissingDataError("tmax_c/tmin_c", null,
          "station '" + station.name + "' month " + (isNum(mo.m) ? mo.m : i + 1) + " has no mean temperature");
      }
      out.push({ m: isNum(mo.m) ? mo.m : i + 1, t_air_c: (tmax + tmin) / 2 });
    }
    return out;
  }

  function cropMonths(stockMonth, nMonths) {
    var out = [];
    for (var i = 0; i < nMonths; i++) { out.push(((stockMonth - 1 + i) % 12) + 1); }
    return out;
  }

  /* ------------------------------------------------------------ MODEL_SPEC 1: input defaults */

  function defaultsFor(species_id, district, data) {
    if (!data) { throw new MissingDataError("data", null, "defaultsFor needs the OXY_DATA object"); }
    var species = findSpecies(data, species_id);
    var econ = data.economics || {};
    var product = smallestProduct(data);

    coefficientsOf(data);   /* fail loudly here rather than inside evaluate */

    var runPublished = rangeOf(econ.run_hours_published);
    var runH = isNum(runPublished[0]) ? runPublished[0] : scalarOf(SPEC_DEFAULTS.run_h);

    var subsidy = (econ.subsidy_options && econ.subsidy_options.length)
      ? scalarOf(econ.subsidy_options[0].pct) : null;
    if (!isNum(subsidy)) { subsidy = 0; }

    var price = scalarOf(species.price_default_inr_per_kg);
    if (!isNum(price)) { price = scalarOf(species.farmgate_price_inr_per_kg); }

    /*
     * MODEL_SPEC amendment A3/A4: the yield-consistent density is the default when WP1 has
     * derived one; otherwise the midpoint of the sourced stocking-density range.
     */
    var density = scalarOf(species.density_default_per_acre);
    if (!isNum(density)) {
      density = requireScalar(species.stocking_density_per_acre, "stocking_density_per_acre",
        speciesId(species), "the stocking density");
    }

    return {
      district: district,
      species: species_id,
      area_acre: scalarOf(SPEC_DEFAULTS.area_acre),
      depth_m: scalarOf(SPEC_DEFAULTS.depth_m),
      density_per_acre: density,
      stock_month: requireScalar(species.stocking_month_tn_default, "stocking_month_tn_default",
        speciesId(species), "the default stocking month"),
      price_inr_kg: price,
      feed_price_inr_kg: scalarOf(species.feed_cost_inr_per_kg),
      bloom: rawValue(SPEC_DEFAULTS.bloom),
      existing_aeration_kw: scalarOf(SPEC_DEFAULTS.existing_aeration_kw),
      existing_run_h: runH,
      tariff_id: econ.default_tariff_id === undefined ? null : econ.default_tariff_id,
      station_name: rawValue(SPEC_DEFAULTS.station_name),
      unit_model: product.id,
      n_units: rawValue(SPEC_DEFAULTS.n_units),
      o2_input_lpm_override: rawValue(SPEC_DEFAULTS.o2_input_lpm_override),
      power_kw_override: rawValue(SPEC_DEFAULTS.power_kw_override),
      unit_price_inr: scalarOf(product.price_inr),
      concentrator_kw: scalarOf(product.concentrator_kw),
      concentrator_price_inr: scalarOf(product.concentrator_price_inr),
      maintenance_pct: maintenanceDefault(product, econ),
      subsidy_pct: subsidy,
      run_h: runH,
      include_fcr_gain: rawValue(SPEC_DEFAULTS.include_fcr_gain)
    };
  }

  /* Maintenance: the product's own figure, else the economics file's, else the spec default. */
  function maintenanceEnvelope(product, econ) {
    if (isNum(scalarOf(product.maintenance_pct_per_year))) { return product.maintenance_pct_per_year; }
    if (econ && isNum(scalarOf(econ.maintenance_pct_per_year))) { return econ.maintenance_pct_per_year; }
    return SPEC_DEFAULTS.maintenance_pct;
  }

  function maintenanceDefault(product, econ) {
    return scalarOf(maintenanceEnvelope(product, econ));
  }

  /* ------------------------------------------------------------------------------- evaluate */

  function evaluate(inputs, data) {
    if (!inputs) { throw new MissingDataError("inputs", null, "evaluate needs an inputs object"); }
    if (!data) { throw new MissingDataError("data", null, "evaluate needs the OXY_DATA object"); }

    var A = new Assumptions();
    var warnings = [];
    function warn(code, extra) {
      for (var w = 0; w < warnings.length; w++) { if (warnings[w].code === code) { return; } }
      var item = { code: code, message: WARNING_MESSAGES[code] };
      if (extra && extra.months) { item.months = extra.months; }
      warnings.push(item);
    }

    var coeff = coefficientsOf(data);
    var species = findSpecies(data, inputs.species);
    var sid = speciesId(species);

    /*
     * MODEL_SPEC 7 amendment A8: a species the data build marked `estimable: false` cannot
     * produce an estimate at all, and the field it is reported against is `missing[0]` — the
     * data file's own order — not whichever load-bearing field this implementation happens to
     * read first. Checked before anything else so the species, not the district, is blamed.
     */
    if (species.estimable === false) {
      var missingList = (species.missing && species.missing.length) ? species.missing : ["estimable"];
      throw new MissingDataError(missingList[0], sid,
        "no estimate is possible for " + sid + ": " + missingList.join(", ") +
        (missingList.length === 1 ? " is not available" : " are not available"));
    }

    /* MODEL_SPEC A9.2: an explicit station overrides the district's own; the reference crop
       of section 3 stays at the Tiruchirappalli station either way. */
    var stationChosen = (inputs.station_name === undefined || inputs.station_name === null ||
                         inputs.station_name === "") ? null : inputs.station_name;
    var station = stationChosen === null
      ? stationForDistrict(data, inputs.district)
      : stationByName(data, stationChosen);
    var econ = data.economics || {};
    var i;

    /* ---- inputs, with the fail-loud rule on every load-bearing one (MODEL_SPEC 0 rule 3) */

    var area_acre = requireScalar(inputs.area_acre, "area_acre", sid, "the pond water area");
    var depth_m = requireScalar(inputs.depth_m, "depth_m", sid, "the average water depth");
    var density = requireScalar(inputs.density_per_acre, "density_per_acre", sid, "the stocking density");
    var stock_month = Math.round(requireScalar(inputs.stock_month, "stock_month", sid, "the stocking month"));
    var price = requireScalar(inputs.price_inr_kg, "price_inr_kg", sid, "the farm-gate price");
    var feed_price = requireScalar(inputs.feed_price_inr_kg, "feed_price_inr_kg", sid, "the feed price");
    var bloom = (inputs.bloom === undefined || inputs.bloom === null)
      ? rawValue(SPEC_DEFAULTS.bloom) : inputs.bloom;
    var existing_kw = requireScalar(inputs.existing_aeration_kw, "existing_aeration_kw", sid,
      "the existing aeration power");
    var existing_run_h = existing_kw > 0
      ? requireScalar(inputs.existing_run_h, "existing_run_h", sid, "the existing aeration hours")
      : 0;
    var run_h = requireScalar(inputs.run_h, "run_h", sid, "the run hours");
    var subsidy_pct = requireScalar(inputs.subsidy_pct, "subsidy_pct", sid, "the subsidy percentage");
    var include_fcr_gain = inputs.include_fcr_gain === true;
    var unit_price = isNum(inputs.unit_price_inr) ? inputs.unit_price_inr : null;
    var concentrator_kw = isNum(inputs.concentrator_kw) ? inputs.concentrator_kw : null;
    var concentrator_price = isNum(inputs.concentrator_price_inr) ? inputs.concentrator_price_inr : null;
    var maintenance_pct = requireScalar(inputs.maintenance_pct, "maintenance_pct", sid,
      "the annual maintenance percentage");
    var o2_override = isNum(inputs.o2_input_lpm_override) ? inputs.o2_input_lpm_override : null;
    var power_override = isNum(inputs.power_kw_override) ? inputs.power_kw_override : null;

    var product = findProduct(data, inputs.unit_model);

    /*
     * Tariff: a preset supplies both the energy rate and the fixed charge. A custom rate is
     * taken as entered and carries the fixed charge of the preset named alongside it, or none
     * if no preset is named, because the fixed charge is a property of the published tariff
     * (MODEL_SPEC section 6).
     */
    var preset = inputs.tariff_id ? tariffPreset(data, inputs.tariff_id) : null;
    if (inputs.tariff_id && !preset) {
      throw new MissingDataError("tariff_id", null, "no tariff preset with id '" + inputs.tariff_id + "'");
    }
    var tariff, tariffEnv, fixed_per_kw_month;
    if (isNum(inputs.tariff_inr_kwh)) {
      tariff = inputs.tariff_inr_kwh;
      tariffEnv = { unit: "INR/kWh", status: "ASSUMED", date: null, source: "entered by the user" };
      fixed_per_kw_month = preset ? scalarOf(preset.fixed_inr_per_kw_per_month) : 0;
    } else {
      if (!preset) {
        throw new MissingDataError("tariff_id", null,
          "no electricity tariff was supplied (expected tariff_id or tariff_inr_kwh)");
      }
      tariff = requireScalar(preset.inr_per_kwh, "tariff_presets.inr_per_kwh", null, "the electricity tariff");
      tariffEnv = preset;
      fixed_per_kw_month = scalarOf(preset.fixed_inr_per_kw_per_month);
    }
    if (!isNum(fixed_per_kw_month)) { fixed_per_kw_month = 0; }
    A.note("economics.tariff", "Electricity tariff", tariffEnv, tariff, "INR/kWh");

    /* ---- species values (MODEL_SPEC 3, 4.2, 4.4, 6) */

    var S0 = A.take("species.survival_pct", "Baseline survival", species.survival_pct,
      "survival_pct", sid, "the survival rate") / 100;
    var w0 = A.take("species.seed_size_g", "Seed size", species.seed_size_g, "seed_size_g", sid, "the seed size");
    var w_h_pub = A.take("species.harvest_size_g", "Published harvest size", species.harvest_size_g,
      "harvest_size_g", sid, "the harvest size");
    var fcr0 = A.take("species.fcr", "Feed conversion ratio", species.fcr, "fcr", sid, "the feed conversion ratio");
    var seed_cost = A.take("species.seed_cost_inr_per_unit", "Seed cost", species.seed_cost_inr_per_unit,
      "seed_cost_inr_per_unit", sid, "the seed cost");
    var other_cost = A.take("species.other_cost_inr_per_acre_crop", "Other operating cost",
      species.other_cost_inr_per_acre_crop, "other_cost_inr_per_acre_crop", sid,
      "the other operating cost per acre per crop");
    var crops_per_year = A.take("species.crops_per_year_tn", "Crops per year", species.crops_per_year_tn,
      "crops_per_year_tn", sid, "the number of crops per year");
    var do_min = A.take("species.do_minimum_mg_l", "Growth DO threshold", species.do_minimum_mg_l,
      "do_minimum_mg_l", sid, "the minimum dissolved oxygen for growth");
    var do_lethal = A.take("species.do_lethal_mg_l", "Lethal DO", species.do_lethal_mg_l,
      "do_lethal_mg_l", sid, "the lethal dissolved-oxygen level");
    var T_months = Math.round(A.take("species.culture_period_months", "Culture period",
      species.culture_period_months, "culture_period_months", sid, "the culture period"));
    if (T_months < 1) { T_months = 1; }

    var salinity;
    if (isFreshwater(species)) {
      salinity = 0;
      A.note("species.salinity_ppt", "Pond salinity",
        { unit: "ppt", status: "VERIFIED", date: "2026-09-21",
          source: "MODEL_SPEC.md 4.1: freshwater species are evaluated at S = 0" }, 0);
    } else {
      salinity = A.take("species.salinity_ppt", "Pond salinity", species.salinity_ppt,
        "salinity_ppt", sid, "the pond salinity");
    }

    var lim = thermalLimits(species, data);
    A.note("species.temp_optimum_c", "Optimum temperature range", species.temp_optimum_c, [lim.to_lo, lim.to_hi]);
    A.note("species.temp_tolerable_c", "Tolerable temperature range",
      lim.fallback_margin_c === null
        ? species.temp_tolerable_c
        : { unit: "degC", status: "ASSUMED", date: "2026-09-21",
            source: "EXECUTION_PLAN.md WP1 fallback 1 via coefficients.thermal.tolerable_fallback_margin_c = " +
              lim.fallback_margin_c + " degC beyond the optimum bound" },
      [lim.tt_lo, lim.tt_hi]);

    var respGroupName = rawValue(species.respiration_group);
    var respGroup = coeff.respiration_groups && coeff.respiration_groups[respGroupName];
    if (!respGroup) {
      throw new MissingDataError("respiration_group", sid,
        "cannot estimate: no respiration group '" + respGroupName + "' in the coefficients file for " + sid);
    }
    var q_ref = A.take("resp." + respGroupName + ".q_ref", "Routine oxygen demand (" + respGroupName + ")",
      respGroup.q_ref_mg_o2_kg_h, "respiration_groups." + respGroupName + ".q_ref_mg_o2_kg_h", sid,
      "the routine oxygen demand");
    var q10_fish = A.take("resp." + respGroupName + ".q10", "Q10 (" + respGroupName + ")", respGroup.q10,
      "respiration_groups." + respGroupName + ".q10", sid, "the respiration Q10");
    var q_tref = A.take("resp." + respGroupName + ".t_ref", "Q10 reference temperature (" + respGroupName + ")",
      respGroup.t_ref_c, "respiration_groups." + respGroupName + ".t_ref_c", sid, "the Q10 reference temperature");
    var q_tcap = A.take("resp." + respGroupName + ".t_cap", "Respiration temperature cap (" + respGroupName + ")",
      respGroup.t_cap_c, "respiration_groups." + respGroupName + ".t_cap_c", sid,
      "the respiration temperature cap");

    /* ---- night-budget coefficients (MODEL_SPEC 4.3) */

    var nb = coeff.night_budget;
    var h_night = A.take("night.h_night", "Night length", nb.h_night, "night_budget.h_night", null,
      "the night length");
    var f_dusk = A.take("night.f_dusk", "Dusk saturation", nb.f_dusk, "night_budget.f_dusk", null,
      "the dusk saturation factor");
    var d_diff = A.take("night.d_diff", "Diffusion from air", nb.d_diff_mg_l_per_night,
      "night_budget.d_diff_mg_l_per_night", null, "the nightly diffusion allowance");
    var nb_tref = A.take("night.t_ref_c", "Plankton and sediment reference temperature", nb.t_ref_c,
      "night_budget.t_ref_c", null, "the plankton and sediment reference temperature");
    var q10_p = A.take("night.q10_plankton", "Plankton Q10", nb.q10_plankton, "night_budget.q10_plankton",
      null, "the plankton Q10");
    var q10_s = A.take("night.q10_sed", "Sediment Q10", nb.q10_sed, "night_budget.q10_sed", null,
      "the sediment Q10");
    var k_sed = A.take("night.k_sed", "Sediment oxygen demand", nb.k_sed_g_o2_m2_h,
      "night_budget.k_sed_g_o2_m2_h", null, "the sediment oxygen demand");

    var bloomTable = nb.r_plankton_ref_mg_l_h_at_25c;
    var bloomValues = rawValue(bloomTable);
    if (!bloomValues || !isNum(bloomValues[bloom])) {
      throw new MissingDataError("night_budget.r_plankton_ref_mg_l_h_at_25c", null,
        "no plankton respiration rate for bloom '" + bloom + "' in the coefficients file");
    }
    var k_p = bloomValues[bloom];
    A.note("night.k_plankton", "Plankton respiration (" + bloom + " bloom)", bloomTable, k_p, bloomTable.unit);

    var sae_pw = A.take("paddlewheel.sae", "Paddlewheel field oxygen transfer",
      coeff.paddlewheel.sae_field_kg_o2_per_kwh, "paddlewheel.sae_field_kg_o2_per_kwh", null,
      "the paddlewheel oxygen-transfer rate");

    /* ---- nano-bubble oxygen supply (MODEL_SPEC 4.5) */

    var os = coeff.oxygen_supply;
    var rho_o2 = A.take("oxy.rho_o2", "Oxygen gas density", os.rho_o2_g_per_l,
      "oxygen_supply.rho_o2_g_per_l", null, "the oxygen gas density");
    var purity = A.take("oxy.purity", "Concentrator purity", os.purity, "oxygen_supply.purity", null,
      "the concentrator purity");
    var eta_nb = A.take("oxy.eta", "Dissolved fraction", os.eta_dissolved, "oxygen_supply.eta_dissolved",
      null, "the dissolved fraction");
    var hp_to_kw = A.take("oxy.hp_to_kw", "Horsepower to kilowatt", os.hp_to_kw, "oxygen_supply.hp_to_kw",
      null, "the horsepower conversion");

    var productLabel = product.label || product.id;
    var o2_lpm = A.take("product.o2_input_lpm", "Oxygen input (" + productLabel + ")",
      product.o2_input_lpm, "o2_input_lpm", product.id, "the oxygen input rate of the selected unit");
    var power_kw_shaft = scalarOf(product.power_kw_shaft);
    if (!isNum(power_kw_shaft)) {
      var hp = requireScalar(product.power_hp, "power_hp", product.id, "the shaft power of the selected unit");
      power_kw_shaft = hp * hp_to_kw;
      A.note("product.power_kw_shaft", "Shaft power (" + productLabel + ")",
        { unit: "kW", status: "ASSUMED", date: "2026-09-21",
          source: "derived from power_hp x coefficients.oxygen_supply.hp_to_kw" }, power_kw_shaft);
    } else {
      A.note("product.power_kw_shaft", "Shaft power (" + productLabel + ")", product.power_kw_shaft,
        power_kw_shaft);
    }

    /* MODEL_SPEC 7 (amendment A4): the datasheet overrides replace the product-page figures. */
    var o2_input_lpm_used = o2_override === null ? o2_lpm : o2_override;
    var power_kw_used = power_override === null ? power_kw_shaft : power_override;
    if (o2_override !== null) {
      A.note("input.o2_input_lpm_override", "Oxygen delivery per unit (datasheet)",
        { unit: "L/min", status: "VERIFIED", date: null,
          source: "entered by the user from the OEM datasheet" }, o2_override);
    }
    if (power_override !== null) {
      A.note("input.power_kw_override", "Electrical input per unit (datasheet)",
        { unit: "kW", status: "VERIFIED", date: null,
          source: "entered by the user from the OEM datasheet" }, power_override);
    }

    /*
     * MODEL_SPEC A9.1: with the owner's figure on the product this fires only where a product
     * carries no concentrator power (or the user has cleared it), which is also exactly when
     * the concentrator is excluded from the electricity cost.
     */
    if (concentrator_kw === null && rawValue(product.concentrator_required) !== false) {
      warn("CONCENTRATOR_POWER_UNKNOWN");
    } else if (concentrator_kw !== null) {
      A.note("product.concentrator_kw", "Concentrator power (" + productLabel + ")",
        isNum(scalarOf(product.concentrator_kw)) && scalarOf(product.concentrator_kw) === concentrator_kw
          ? product.concentrator_kw
          : { unit: "kW", status: "VERIFIED", date: null, source: "entered by the user" },
        concentrator_kw);
    }

    var maintEnv = maintenanceEnvelope(product, econ);
    A.note("product.maintenance_pct", "Maintenance per year",
      scalarOf(maintEnv) === maintenance_pct
        ? maintEnv
        : { unit: "% of capex per year", status: "ASSUMED", date: null, source: "entered by the user" },
      maintenance_pct, "% of capex per year");

    if (concentrator_price !== null) {
      A.note("product.concentrator_price_inr", "Concentrator price (" + productLabel + ")",
        isNum(scalarOf(product.concentrator_price_inr)) &&
        scalarOf(product.concentrator_price_inr) === concentrator_price
          ? product.concentrator_price_inr
          : { unit: "INR", status: "ASSUMED", date: null, source: "entered by the user" },
        concentrator_price);
    }
    if (unit_price !== null) {
      A.note("product.price_inr", "Unit price (" + productLabel + ")",
        isNum(scalarOf(product.price_inr)) && scalarOf(product.price_inr) === unit_price
          ? product.price_inr
          : { unit: "INR", status: "VERIFIED", date: null, source: "entered by the user" },
        unit_price);
    }

    /* ---- geometry (MODEL_SPEC 4.3) */

    var area_m2 = area_acre * M2_PER_ACRE;
    var V_L = area_m2 * depth_m * L_PER_M3;
    var n = density * area_acre;
    var elevation_m = requireScalar(station.elevation_m, "elevation_m", null, "the station elevation");

    /* ---- MODEL_SPEC 3: thermal suitability of this crop and of the reference crop */

    var months = monthTemperatures(station);
    var t_w = [];
    var c_s = [];
    var g_t = [];
    for (i = 0; i < 12; i++) {
      t_w.push(pondTemperature(months[i].t_air_c, coeff));
      c_s.push(doSaturation(t_w[i], salinity, elevation_m, coeff));
      g_t.push(trapezoid(t_w[i], lim));
    }
    A.note("climate.station", "Climate station",
      { unit: "-", status: station.status || "VERIFIED", date: station.date || null,
        source: station.source || null }, station.name);
    A.note("pond_temperature.a_intercept_c", "Pond temperature intercept", coeff.pond_temperature.a_intercept_c);
    A.note("pond_temperature.b_slope", "Pond temperature slope", coeff.pond_temperature.b_slope);
    A.note("do_saturation.method", "Oxygen saturation method",
      { unit: "-", status: coeff.do_saturation.ln_cstar_coefficients.status,
        date: coeff.do_saturation.ln_cstar_coefficients.date,
        source: coeff.do_saturation.ln_cstar_coefficients.source }, coeff.do_saturation.method);

    var cropSeq = cropMonths(stock_month, T_months);
    var G_T = 0;
    for (i = 0; i < cropSeq.length; i++) { G_T += g_t[cropSeq[i] - 1]; }
    G_T = G_T / cropSeq.length;

    var refStation = referenceStation(data);
    var refMonth = Math.round(requireScalar(species.stocking_month_tn_default, "stocking_month_tn_default",
      sid, "the default stocking month (needed for the reference crop)"));
    var refSeq = cropMonths(refMonth, T_months);
    var refMonths = monthTemperatures(refStation);
    var G_T_ref = 0;
    for (i = 0; i < refSeq.length; i++) {
      G_T_ref += trapezoid(pondTemperature(refMonths[refSeq[i] - 1].t_air_c, coeff), lim);
    }
    G_T_ref = G_T_ref / refSeq.length;
    if (!(G_T_ref > 0)) {
      throw new MissingDataError("temp_optimum_c", sid,
        "cannot estimate: the reference crop for " + sid + " (stocked in month " + refMonth + " at " +
        refStation.name + ") has zero thermal suitability, so the published harvest size cannot be scaled");
    }

    var sfClamp = rangeOf(coeff.thermal.size_factor_clamp);
    if (!isNum(sfClamp[0]) || !isNum(sfClamp[1])) {
      throw new MissingDataError("thermal.size_factor_clamp", null, "the size-factor clamp is not available");
    }
    A.note("thermal.size_factor_clamp", "Size factor clamp", coeff.thermal.size_factor_clamp, sfClamp);
    var size_factor = clamp(G_T / G_T_ref, sfClamp[0], sfClamp[1]);
    var w_h0 = w_h_pub * size_factor;

    var coldMonths = [];
    for (i = 0; i < cropSeq.length; i++) {
      if (g_t[cropSeq[i] - 1] === 0 && coldMonths.indexOf(cropSeq[i]) < 0) { coldMonths.push(cropSeq[i]); }
    }
    if (coldMonths.length) { warn("THERMAL_OUT_OF_RANGE", { months: coldMonths }); }

    /* ---- MODEL_SPEC 4.2: biomass at the mid-point of each crop month */

    var biomassOfMonth = {};           /* month number -> kg (first occurrence within the crop) */
    var biomassSeq = [];
    for (i = 0; i < cropSeq.length; i++) {
      var tMid = i + 0.5;
      var surv = 1 - (1 - S0) * tMid / T_months;
      var wMid = w0 + (w_h0 - w0) * tMid / T_months;
      var B = n * surv * wMid / 1000;
      biomassSeq.push(B);
      if (!has(biomassOfMonth, cropSeq[i])) { biomassOfMonth[cropSeq[i]] = B; }
    }
    var meanBiomass = 0;
    for (i = 0; i < biomassSeq.length; i++) { meanBiomass += biomassSeq[i]; }
    meanBiomass = meanBiomass / biomassSeq.length;

    /* ---- MODEL_SPEC 4.5: oxygen one unit can add per night */

    var o2_g_per_unit_night = o2_input_lpm_used * 60 * run_h * rho_o2 * purity * eta_nb;
    var supply_mg_l_per_unit_night = o2_g_per_unit_night * MG_PER_G / V_L;

    /* ---- MODEL_SPEC 4.3 and 4.4: night budget, dawn DO and the stress index (baseline) */

    var supply_exist = existing_kw * sae_pw * existing_run_h * MG_PER_KG / V_L;

    function dawnBase(monthIndex) {
      var Tw = t_w[monthIndex];
      var Cs = c_s[monthIndex];
      var mnum = monthIndex + 1;
      var B = has(biomassOfMonth, mnum) ? biomassOfMonth[mnum] : meanBiomass;
      var q = q_ref * Math.pow(q10_fish, (Math.min(Tw, q_tcap) - q_tref) / 10);
      var r_fish = B * q / V_L;
      var r_plank = k_p * Math.pow(q10_p, (Tw - nb_tref) / 10);
      var r_sed = (k_sed / depth_m) * Math.pow(q10_s, (Tw - nb_tref) / 10);
      var dusk = f_dusk * Cs;
      var dawn = dusk - h_night * (r_fish + r_plank + r_sed) + supply_exist;
      if (dawn < Cs) { dawn += d_diff; }
      return { dawn: clamp(dawn, 0, Cs), biomass: B, c_s: Cs };
    }

    function stress(dawn) {
      var span = do_min - do_lethal;
      if (!(span > 0)) { return dawn < do_min ? 1 : 0; }   /* degenerate envelope: step */
      return clamp((do_min - dawn) / span, 0, 1);
    }

    var base = [];
    for (i = 0; i < 12; i++) { base.push(dawnBase(i)); }

    /* ---- crop-mean baseline stress; this does not depend on the unit count */

    var inCrop = {};
    for (i = 0; i < cropSeq.length; i++) { inCrop[cropSeq[i]] = true; }

    var s_base_of_month = [];
    for (i = 0; i < 12; i++) { s_base_of_month.push(stress(base[i].dawn)); }

    var sum_s_base = 0;
    for (i = 0; i < cropSeq.length; i++) { sum_s_base += s_base_of_month[cropSeq[i] - 1]; }
    var s_base_mean = sum_s_base / cropSeq.length;
    if (s_base_mean < 0.05) { warn("NOT_OXYGEN_LIMITED"); }

    /* ---- MODEL_SPEC 5: uplift, low and high case, with the ceiling clamp */

    var up = coeff.uplift;
    var g_max = A.take("uplift.growth_max", "Growth uplift at full relief", up.growth_max_fraction,
      "uplift.growth_max_fraction", null, "the growth uplift");
    var s_max = A.take("uplift.survival_points_max", "Survival uplift at full relief",
      up.survival_points_max, "uplift.survival_points_max", null, "the survival uplift");
    var fcr_max = A.take("uplift.fcr_gain_max", "FCR gain at full relief", up.fcr_gain_max_fraction,
      "uplift.fcr_gain_max_fraction", null, "the FCR gain");
    var ceiling = A.take("uplift.ceiling", "Claims ceiling", up.ceiling_extra_kg_fraction,
      "uplift.ceiling_extra_kg_fraction", null, "the claims ceiling");
    var low_factor = A.take("uplift.low_case_factor", "Low-case factor", up.low_case_factor,
      "uplift.low_case_factor", null, "the low-case factor");
    var surv_cap = A.take("uplift.survival_cap", "Survival cap", up.survival_cap, "uplift.survival_cap",
      null, "the survival cap");

    var kg0 = n * S0 * w_h0 / 1000;
    var gain0 = kg0 - n * S0 * w0 / 1000;

    /*
     * The low case multiplies each of the three uplift coefficients by low_case_factor
     * (MODEL_SPEC amendment A5), so the low-case FCR gain is 0.07 x 0.5 = 0.035.
     */
    function upliftCase(factor, ds) {
      var G = g_max * factor * ds;
      var dS = s_max * factor * ds;
      var S1 = Math.min(S0 + dS, surv_cap);
      var w_h1 = w_h0 * (1 + G);
      var fcr_factor = include_fcr_gain ? (1 - fcr_max * factor * ds) : 1;
      var kg_raw = n * S1 * w_h1 / 1000;
      var frac_raw = kg0 > 0 ? (kg_raw / kg0 - 1) : 0;
      var clamped = frac_raw > ceiling;
      var frac = clamped ? ceiling : frac_raw;
      return {
        G: G, dS: dS, fcr_factor: fcr_factor, extra_kg_fraction: frac, ceiling_clamped: clamped,
        S1: S1, w_h1_g: w_h1, kg: kg0 * (1 + frac)
      };
    }

    /* ---- MODEL_SPEC 6: economics */

    var days_per_month = A.take("economics.days_per_month", "Days per month",
      coeff.economics.days_per_month, "economics.days_per_month", null, "the days per month");
    var days = T_months * days_per_month;

    var seedCost = n * seed_cost;
    var otherCost = other_cost * area_acre;
    var revenue0 = kg0 * price;
    var feed0 = gain0 * fcr0 * feed_price;
    var elec0 = existing_kw * existing_run_h * days * tariff;
    var profit0 = revenue0 - feed0 - seedCost - otherCost - elec0;

    /* The fixed charge is levied on connected load, so it follows the overridden input. */
    var p_unit = power_kw_used + (concentrator_kw === null ? 0 : concentrator_kw);

    function economicsCase(c, elec1) {
      var gain1 = c.kg - n * c.S1 * w0 / 1000;
      var revenue1 = c.kg * price;
      var feed1 = gain1 * fcr0 * c.fcr_factor * feed_price;
      return {
        S1: c.S1, w_h1_g: c.w_h1_g, kg: c.kg, revenue: revenue1, feed: feed1,
        seed: seedCost, other: otherCost, elec: elec1,
        profit: revenue1 - feed1 - seedCost - otherCost - elec1
      };
    }

    /*
     * MODEL_SPEC A9.3: capex and annual maintenance are both charged on the unit price plus
     * the concentrator price. A null concentrator price is excluded from the basis and said
     * so in the Assumptions panel; a null unit price leaves the basis unknown, so maintenance
     * is reported as null rather than as a silent zero and the payback is blocked.
     */
    var capex_basis_per_unit = unit_price === null
      ? null
      : unit_price + (concentrator_price === null ? 0 : concentrator_price);

    function deltaCase(w, maintenance_year) {
      var profit_crop = w.profit - profit0;
      return {
        kg_crop: w.kg - kg0,
        kg_year: (w.kg - kg0) * crops_per_year,
        revenue_crop: w.revenue - revenue0,
        feed_crop: w.feed - feed0,
        elec_crop: w.elec - elec0,
        profit_crop: profit_crop,
        maintenance_year: maintenance_year,
        profit_year: profit_crop * crops_per_year - (maintenance_year === null ? 0 : maintenance_year)
      };
    }

    /* ---- the whole outcome as a function of the unit count (MODEL_SPEC 4.5, 5, 6) */

    function outcomeForUnits(nUnits) {
      var supply_oxy = nUnits * supply_mg_l_per_unit_night;
      var dawnOxy = [];
      var s_oxy = [];
      var k;
      for (k = 0; k < 12; k++) {
        var d = Math.min(base[k].dawn + supply_oxy, base[k].c_s);
        dawnOxy.push(d);
        s_oxy.push(stress(d));
      }
      var sum = 0;
      for (k = 0; k < cropSeq.length; k++) { sum += s_oxy[cropSeq[k] - 1]; }
      var ds = clamp(s_base_mean - sum / cropSeq.length, 0, 1);

      var caseLow = upliftCase(low_factor, ds);
      var caseHigh = upliftCase(1, ds);
      var elec1 = elec0 + nUnits * p_unit * run_h * days * tariff +
        nUnits * power_kw_used * fixed_per_kw_month * T_months;
      var withLow = economicsCase(caseLow, elec1);
      var withHigh = economicsCase(caseHigh, elec1);
      var maintenance_year = capex_basis_per_unit === null
        ? null : nUnits * capex_basis_per_unit * maintenance_pct / 100;
      return {
        n_units: nUnits, supply_oxy: supply_oxy, dawn_oxy: dawnOxy, s_oxy: s_oxy, ds: ds,
        maintenance_year: maintenance_year,
        caseLow: caseLow, caseHigh: caseHigh, withLow: withLow, withHigh: withHigh,
        deltaLow: deltaCase(withLow, maintenance_year),
        deltaHigh: deltaCase(withHigh, maintenance_year)
      };
    }

    /* ---- MODEL_SPEC 7: sizing by relief and by profit */

    var deficit_max = 0;
    for (i = 0; i < cropSeq.length; i++) {
      var deficit = do_min - base[cropSeq[i] - 1].dawn;
      if (deficit > deficit_max) { deficit_max = deficit; }
    }
    var n_cap = A.take("sizing.n_units_cap", "Maximum units", coeff.sizing.n_units_cap,
      "sizing.n_units_cap", null, "the unit-count cap");

    var n_relief_raw = o2_g_per_unit_night > 0
      ? Math.ceil(deficit_max * V_L / (o2_g_per_unit_night * MG_PER_G))
      : Infinity;
    if (!(n_relief_raw >= 1)) { n_relief_raw = 1; }
    var n_relief = Math.min(n_relief_raw, n_cap);
    if (n_relief_raw > n_cap) { warn("SIZING_CAPPED"); }

    /*
     * n_best: the unit count that maximises the high-case annual extra profit. The uplift
     * saturates at the ceiling while electricity grows linearly with the count, so a plain
     * ascending scan over 1..cap is enough; a strict comparison keeps the smaller n on a tie.
     */
    var n_best = 1;
    var best_profit_year = -Infinity;
    for (i = 1; i <= n_cap; i++) {
      var trial = outcomeForUnits(i).deltaHigh.profit_year;
      if (trial > best_profit_year) { best_profit_year = trial; n_best = i; }
    }
    if (!(best_profit_year > 0)) { warn("NO_PAYBACK_AT_PUBLISHED_O2"); }

    var manual = isNum(inputs.n_units) && inputs.n_units > 0;
    var n_units = manual ? Math.round(inputs.n_units) : n_best;

    var out = outcomeForUnits(n_units);
    var ds = out.ds;
    var caseLow = out.caseLow;
    var caseHigh = out.caseHigh;
    var withLow = out.withLow;
    var withHigh = out.withHigh;
    var deltaLow = out.deltaLow;
    var deltaHigh = out.deltaHigh;
    if (caseLow.ceiling_clamped || caseHigh.ceiling_clamped) { warn("CEILING_CLAMPED"); }

    /* ---- per-month rows */

    var monthRows = [];
    for (i = 0; i < 12; i++) {
      monthRows.push({
        m: i + 1,
        t_air_c: months[i].t_air_c,
        t_w_c: t_w[i],
        c_s_mg_l: c_s[i],
        g_t: g_t[i],
        in_crop: inCrop[i + 1] === true,
        biomass_kg: base[i].biomass,
        do_dawn_base: base[i].dawn,
        do_dawn_oxy: out.dawn_oxy[i],
        s_base: s_base_of_month[i],
        s_oxy: out.s_oxy[i]
      });
    }

    /* ---- payback (MODEL_SPEC 6) */

    var payback;
    if (unit_price === null) {
      payback = { status: "blocked", reason: "enter unit price", capex: null,
                  months_low: null, months_high: null };
    } else {
      var capex = n_units * capex_basis_per_unit * (1 - subsidy_pct / 100);
      if (!(deltaHigh.profit_year > 0)) {
        payback = { status: "blocked", reason: "No extra profit at these inputs", capex: capex,
                    months_low: null, months_high: null };
      } else {
        payback = {
          status: "ok",
          reason: null,
          capex: capex,
          months_low: deltaLow.profit_year > 0 ? capex / (deltaLow.profit_year / 12) : null,
          months_high: capex / (deltaHigh.profit_year / 12)
        };
      }
    }

    var subsidyEnv = null;
    var subsidyOptions = econ.subsidy_options || [];
    for (i = 0; i < subsidyOptions.length; i++) {
      if (scalarOf(subsidyOptions[i].pct) === subsidy_pct) { subsidyEnv = subsidyOptions[i]; break; }
    }
    A.note("subsidy", "Subsidy on the unit",
      subsidyEnv || { unit: "%", status: "ASSUMED", date: null, source: "entered by the user" },
      subsidy_pct, "%");

    /* ---- price sanity against the sourced range */

    var priceRange = rangeOf(species.farmgate_price_inr_per_kg);
    if (isNum(priceRange[0]) && isNum(priceRange[1]) && (price < priceRange[0] || price > priceRange[1])) {
      warn("PRICE_OUT_OF_SOURCED_RANGE");
    }
    A.note("species.farmgate_price_inr_per_kg", "Farm-gate price (sourced range)",
      species.farmgate_price_inr_per_kg, priceRange);

    /* ---- inputs_resolved (MODEL_SPEC section 1 ids) */

    function resolved(value, unit, status, source) {
      return { value: value, unit: unit, status: status, source: source };
    }
    function envStatus(env, fallback) {
      return (env && env.status) ? env.status : fallback;
    }
    function envSource(env) {
      return (env && env.source !== undefined) ? env.source : null;
    }
    /* The yield-consistent default (amendment A3) is the better provenance when WP1 wrote one. */
    var densityEnv = isNum(scalarOf(species.density_default_per_acre))
      ? species.density_default_per_acre : species.stocking_density_per_acre;

    var inputs_resolved = {
      district: resolved(inputs.district, "-", "VERIFIED", station.source || null),
      species: resolved(inputs.species, "-", "VERIFIED", "site/data/species.data.js"),
      area_acre: resolved(area_acre, "acre", "VERIFIED", "entered by the user"),
      depth_m: resolved(depth_m, "m", SPEC_DEFAULTS.depth_m.status, SPEC_DEFAULTS.depth_m.source),
      density_per_acre: resolved(density, "animals/acre",
        envStatus(densityEnv, "ASSUMED"), envSource(densityEnv)),
      stock_month: resolved(stock_month, "month",
        envStatus(species.stocking_month_tn_default, "ASSUMED"), envSource(species.stocking_month_tn_default)),
      price_inr_kg: resolved(price, "INR/kg",
        envStatus(species.farmgate_price_inr_per_kg, "ASSUMED"), envSource(species.farmgate_price_inr_per_kg)),
      feed_price_inr_kg: resolved(feed_price, "INR/kg",
        envStatus(species.feed_cost_inr_per_kg, "ASSUMED"), envSource(species.feed_cost_inr_per_kg)),
      bloom: resolved(bloom, "-", envStatus(bloomTable, "ASSUMED"), envSource(bloomTable)),
      existing_aeration_kw: resolved(existing_kw, "kW", "VERIFIED", "entered by the user"),
      existing_run_h: resolved(existing_run_h, "h/night", "VERIFIED", "entered by the user"),
      tariff_id: resolved(preset ? preset.id : null, "-", preset ? envStatus(preset, "VERIFIED") : "ASSUMED",
        preset ? envSource(preset) : "custom tariff entered by the user"),
      tariff_inr_kwh: resolved(tariff, "INR/kWh", envStatus(tariffEnv, "VERIFIED"), envSource(tariffEnv)),
      unit_model: resolved(product.id, "-", "VERIFIED", product.url || null),
      n_units: resolved(n_units, "count", manual ? "VERIFIED" : "ASSUMED",
        manual ? "entered by the user" : "MODEL_SPEC.md section 7 automatic sizing (n_best)"),
      o2_input_lpm_override: resolved(o2_override, "L/min",
        o2_override === null ? SPEC_DEFAULTS.o2_input_lpm_override.status : "VERIFIED",
        o2_override === null ? SPEC_DEFAULTS.o2_input_lpm_override.source
                             : "entered by the user from the OEM datasheet"),
      power_kw_override: resolved(power_override, "kW",
        power_override === null ? SPEC_DEFAULTS.power_kw_override.status : "VERIFIED",
        power_override === null ? SPEC_DEFAULTS.power_kw_override.source
                                : "entered by the user from the OEM datasheet"),
      unit_price_inr: resolved(unit_price, "INR",
        unit_price === null ? SPEC_DEFAULTS.unit_price_inr.status
                            : envStatus(product.price_inr, "ASSUMED"),
        unit_price === null ? SPEC_DEFAULTS.unit_price_inr.source : envSource(product.price_inr)),
      concentrator_kw: resolved(concentrator_kw, "kW",
        concentrator_kw === null ? SPEC_DEFAULTS.concentrator_kw.status
                                 : envStatus(product.concentrator_kw, "ASSUMED"),
        concentrator_kw === null ? SPEC_DEFAULTS.concentrator_kw.source
                                 : envSource(product.concentrator_kw)),
      concentrator_price_inr: resolved(concentrator_price, "INR",
        concentrator_price === null ? SPEC_DEFAULTS.concentrator_price_inr.status
                                    : envStatus(product.concentrator_price_inr, "ASSUMED"),
        concentrator_price === null ? SPEC_DEFAULTS.concentrator_price_inr.source
                                    : envSource(product.concentrator_price_inr)),
      maintenance_pct: resolved(maintenance_pct, "% of capex per year",
        envStatus(maintEnv, "ASSUMED"), envSource(maintEnv)),
      station_name: resolved(stationChosen, "-",
        stationChosen === null ? SPEC_DEFAULTS.station_name.status : "VERIFIED",
        stationChosen === null ? SPEC_DEFAULTS.station_name.source : station.source || null),
      subsidy_pct: resolved(subsidy_pct, "%", subsidyEnv ? envStatus(subsidyEnv, "UNTESTED") : "ASSUMED",
        subsidyEnv ? envSource(subsidyEnv) : "entered by the user"),
      run_h: resolved(run_h, "h/night", SPEC_DEFAULTS.run_h.status, SPEC_DEFAULTS.run_h.source),
      include_fcr_gain: resolved(include_fcr_gain, "-", SPEC_DEFAULTS.include_fcr_gain.status,
        SPEC_DEFAULTS.include_fcr_gain.source)
    };

    /* ---- result (EXECUTION_PLAN section 4.2) */

    return {
      inputs_resolved: inputs_resolved,
      station: { name: station.name, district: station.district, source: station.source || null },
      months: monthRows,
      crop: { months: cropSeq, size_factor: size_factor, G_T: G_T, G_T_ref: G_T_ref, ds: ds },
      uplift: {
        low: { G: caseLow.G, dS: caseLow.dS, fcr_factor: caseLow.fcr_factor,
               extra_kg_fraction: caseLow.extra_kg_fraction, ceiling_clamped: caseLow.ceiling_clamped },
        high: { G: caseHigh.G, dS: caseHigh.dS, fcr_factor: caseHigh.fcr_factor,
                extra_kg_fraction: caseHigh.extra_kg_fraction, ceiling_clamped: caseHigh.ceiling_clamped }
      },
      baseline: { n: n, S0: S0, w0_g: w0, w_h0_g: w_h0, kg: kg0, revenue: revenue0, feed: feed0,
                  seed: seedCost, other: otherCost, elec: elec0, profit: profit0 },
      with_oxy: { low: withLow, high: withHigh },
      delta: { low: deltaLow, high: deltaHigh },
      payback: payback,
      unit: {
        id: product.id,
        label: productLabel,
        power_kw_shaft: power_kw_shaft,
        power_kw_used: power_kw_used,
        o2_input_lpm: o2_lpm,
        o2_input_lpm_used: o2_input_lpm_used,
        price_inr: unit_price,
        concentrator_kw: concentrator_kw,
        concentrator_price_inr: concentrator_price,
        maintenance_pct: maintenance_pct,
        n_units: n_units,
        n_best: n_best,
        n_relief: n_relief,
        sizing: manual ? "manual" : "auto",
        o2_g_per_unit_night: o2_g_per_unit_night,
        supply_mg_l_per_unit_night: supply_mg_l_per_unit_night,
        deficit_max_mg_l: deficit_max,
        status: envStatus(product.o2_input_lpm, "ASSUMED")
      },
      warnings: warnings,
      assumptions: A.list
    };
  }

  /* ------------------------------------------------ MODEL_SPEC A9.4: city-by-city comparison */

  /*
   * Evaluates the same scenario at every published climate station, in the data file's order,
   * with automatic sizing. A station that cannot be evaluated yields { station, error }, where
   * error is the missing field's name so that the model and the Python oracle report the same
   * token. The reference crop of section 3 stays at Tiruchirappalli for every row, so the size
   * factor is comparable across cities.
   */
  function compareStations(inputs, data) {
    if (!inputs) { throw new MissingDataError("inputs", null, "compareStations needs an inputs object"); }
    if (!data) { throw new MissingDataError("data", null, "compareStations needs the OXY_DATA object"); }
    var climate = data.climate;
    if (!climate || !climate.stations || !climate.stations.length) {
      throw new MissingDataError("climate", null, "the climate data file is not loaded (expected OXY_DATA.climate)");
    }

    var rows = [];
    for (var i = 0; i < climate.stations.length; i++) {
      var station = climate.stations[i];
      var trial = {};
      for (var key in inputs) {
        if (has(inputs, key)) { trial[key] = inputs[key]; }
      }
      trial.station_name = station.name;
      trial.n_units = null;
      try {
        var r = evaluate(trial, data);
        var codes = [];
        for (var w = 0; w < r.warnings.length; w++) { codes.push(r.warnings[w].code); }
        rows.push({
          station: station.name,
          district: station.district === undefined ? null : station.district,
          elevation_m: scalarOf(station.elevation_m),
          G_T: r.crop.G_T,
          size_factor: r.crop.size_factor,
          harvest_size_g: r.baseline.w_h0_g,
          baseline_kg_crop: r.baseline.kg,
          ds: r.crop.ds,
          extra_kg_crop_high: r.delta.high.kg_crop,
          profit_year_high: r.delta.high.profit_year,
          n_best: r.unit.n_best,
          warnings: codes
        });
      } catch (err) {
        rows.push({
          station: station.name,
          error: (err && err.field) ? err.field : ((err && err.name) || "Error")
        });
      }
    }
    return rows;
  }

  return {
    doSaturation: doSaturation,
    pondTemperature: pondTemperature,
    thermalFactor: thermalFactor,
    evaluate: evaluate,
    compareStations: compareStations,
    defaultsFor: defaultsFor,
    MissingDataError: MissingDataError
  };
})();

if (typeof window !== "undefined") { window.OxyModel = OxyModel; }
if (typeof module !== "undefined") module.exports = OxyModel;
