/* Oxyniti yield calculator — inline SVG charts, no library.
   Implements EXECUTION_PLAN.md section 4.3 (window.OxyCharts.renderSeasonStrip/renderWaterfall)
   and the WP4 brief's chart spec. Reads only `result` (MODEL_SPEC.md section 4, interface 4.2) —
   nothing here invents a number that is not already in `result`.

   classic script — assigns window.OxyCharts, no import/export, works from file://
*/
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var MONTH_ABBR = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function T(key, fallback) {
    return (window.OxyI18n && window.OxyI18n.t) ? window.OxyI18n.t(key, fallback) : fallback;
  }

  function svgEl(name, attrs) {
    var e = document.createElementNS(SVG_NS, name);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
      }
    }
    return e;
  }
  function svgText(x, y, str, attrs) {
    var t = svgEl("text", attrs);
    t.setAttribute("x", x);
    t.setAttribute("y", y);
    t.textContent = str;
    return t;
  }
  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }
  function emptyState(hostEl, msg) {
    clearNode(hostEl);
    var d = document.createElement("div");
    d.className = "chart-empty";
    d.textContent = msg;
    hostEl.appendChild(d);
  }
  function legendItem(colour, label) {
    var span = document.createElement("span");
    var i = document.createElement("i");
    i.style.background = colour;
    span.appendChild(i);
    span.appendChild(document.createTextNode(label));
    return span;
  }
  function fmtInr(v) {
    if (v === null || v === undefined || isNaN(v)) return "—";
    var abs = Math.abs(v);
    if (abs > 99999) return "₹" + (v / 100000).toFixed(1) + " L";
    return "₹" + Math.round(v).toLocaleString("en-IN");
  }
  function fmtC(v) {
    if (v === null || v === undefined || isNaN(v)) return "—";
    return Number(v).toFixed(0) + "°";
  }
  // Looks up a [low, high] numeric range from result.assumptions by id (model.js's
  // Assumptions.note() shape: {id, label, value, unit, status, date, source} — MODEL_SPEC.md
  // section 3 writes the species' real optimum band there as "species.temp_optimum_c").
  // Returns null if not present or not a well-formed two-number range — callers must fall
  // back to something derived from `result` itself rather than inventing a boundary.
  function findAssumptionRange(result, id) {
    var list = result && result.assumptions;
    if (!list || !list.length) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        var v = list[i].value;
        if (Array.isArray(v) && v.length === 2 && typeof v[0] === "number" && typeof v[1] === "number") return [v[0], v[1]];
        return null;
      }
    }
    return null;
  }
  // Same idea, for a single number (used to read species.crops_per_year_tn so the waterfall can
  // convert result.delta.*.maintenance_year, amendment A9.3, into a per-crop figure without
  // inventing a crops-per-year value of its own).
  function findAssumptionScalar(result, id) {
    var list = result && result.assumptions;
    if (!list || !list.length) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        var v = list[i].value;
        return (typeof v === "number" && isFinite(v)) ? v : null;
      }
    }
    return null;
  }

  /* ================================================================
     renderSeasonStrip(el, result)
     Three rows over 12 months: a water temperature line with the species'
     optimum band shaded behind it; thermal suitability traffic-light
     cells; paired oxygen-stress bars with the crop window outlined.
     ================================================================ */
  function renderSeasonStrip(hostEl, result) {
    clearNode(hostEl);
    if (!result || !result.months || !result.months.length) {
      emptyState(hostEl, "No monthly data to chart.");
      return;
    }
    var byM = {};
    result.months.forEach(function (row) { byM[row.m] = row; });

    var W = 780, marginL = 46, marginR = 14, top = 24;
    var colW = (W - marginL - marginR) / 12;
    var row1H = 108, row2H = 24, row3H = 104, rowGap = 30, bottomAxisH = 20;

    var y1top = top, y1bot = y1top + row1H;
    var y2top = y1bot + rowGap, y2bot = y2top + row2H;
    var y3top = y2bot + rowGap + 6, y3bot = y3top + row3H;
    var totalH = y3bot + bottomAxisH + 8;

    var svg = svgEl("svg", {
      viewBox: "0 0 " + W + " " + totalH,
      role: "img",
      "aria-label": "Twelve month seasonal strip for this pond: water temperature in degrees Celsius, " +
        "thermal suitability for the chosen species, and the oxygen stress index before and after OXY-Nano, one column per month."
    });

    function xLeft(m) { return marginL + (m - 1) * colW; }
    function xMid(m) { return xLeft(m) + colW / 2; }

    /* ---- row 1: temperature ---- */
    // The species' real optimum band comes from result.assumptions (id "species.temp_optimum_c",
    // written by model.js as [To_lo, To_hi] — see MODEL_SPEC.md section 3). That is the sourced
    // figure; renderSeasonStrip(el, result) has no other way to see it (no OXY_DATA access), so
    // when it is missing or malformed this falls back to shading the months the model itself
    // scored at full suitability (months[].g_t === 1) rather than inventing a boundary.
    var optimumBand = findAssumptionRange(result, "species.temp_optimum_c");

    var temps = result.months.map(function (r) { return r.t_w_c; }).filter(function (v) { return v != null && !isNaN(v); });
    var bandForScale = optimumBand || [];
    var allForScale = temps.concat(bandForScale);
    var tMin = allForScale.length ? Math.floor(Math.min.apply(null, allForScale) - 1) : 20;
    var tMax = allForScale.length ? Math.ceil(Math.max.apply(null, allForScale) + 1) : 35;
    if (tMin === tMax) { tMin -= 2; tMax += 2; }
    function yTemp(t) { return y1bot - ((t - tMin) / (tMax - tMin)) * row1H; }

    svg.appendChild(svgText(marginL, y1top - 10, T("season.row_temp", "Pond water temperature (°C)"),
      { fill: "var(--fg-dim)", "font-size": "11", "font-weight": "700" }));

    if (optimumBand) {
      var bandYTop = yTemp(optimumBand[1]), bandYBot = yTemp(optimumBand[0]);
      svg.appendChild(svgEl("rect", { x: marginL, y: bandYTop, width: W - marginL - marginR, height: Math.max(bandYBot - bandYTop, 1), fill: "var(--aqua)", opacity: "0.14" }));
    } else {
      for (var m = 1; m <= 12; m++) {
        var row = byM[m];
        if (row && row.g_t === 1) {
          svg.appendChild(svgEl("rect", { x: xLeft(m), y: y1top, width: colW, height: row1H, fill: "var(--aqua)", opacity: "0.14" }));
        }
      }
    }
    [tMin, Math.round((tMin + tMax) / 2), tMax].forEach(function (tv) {
      var yy = yTemp(tv);
      svg.appendChild(svgEl("line", { x1: marginL, x2: W - marginR, y1: yy, y2: yy, stroke: "var(--border)", "stroke-width": "1" }));
      svg.appendChild(svgText(marginL - 6, yy + 3, fmtC(tv), { "text-anchor": "end", fill: "var(--fg-dim)", "font-size": "10" }));
    });
    var pts = [];
    for (m = 1; m <= 12; m++) {
      var r = byM[m];
      if (!r || r.t_w_c == null) continue;
      pts.push(xMid(m).toFixed(1) + "," + yTemp(r.t_w_c).toFixed(1));
    }
    if (pts.length > 1) {
      svg.appendChild(svgEl("polyline", { points: pts.join(" "), fill: "none", stroke: "var(--coral)", "stroke-width": "2.5", "stroke-linecap": "round", "stroke-linejoin": "round" }));
    }
    for (m = 1; m <= 12; m++) {
      var rc = byM[m];
      if (!rc || rc.t_w_c == null) continue;
      svg.appendChild(svgEl("circle", { cx: xMid(m), cy: yTemp(rc.t_w_c), r: "3", fill: "var(--coral)" }));
      svg.appendChild(svgEl("title", {})).textContent = MONTH_ABBR[m] + ": " + fmtC(rc.t_w_c) + "C water";
    }

    /* ---- row 2: thermal suitability cells ---- */
    svg.appendChild(svgText(marginL, y2top - 8, T("season.row_thermal", "Thermal suitability for this species"),
      { fill: "var(--fg-dim)", "font-size": "11", "font-weight": "700" }));
    for (m = 1; m <= 12; m++) {
      var g = byM[m] ? byM[m].g_t : null;
      var colour = "var(--grey)", op = "0.25";
      if (g !== null && g !== undefined) {
        op = "0.9";
        if (g >= 0.99) colour = "var(--ok)";
        else if (g > 0) colour = "var(--warn)";
        else colour = "var(--bad)";
      }
      var cell = svgEl("rect", { x: xLeft(m) + 2, y: y2top, width: colW - 4, height: row2H, rx: 4, fill: colour, opacity: op });
      svg.appendChild(cell);
    }

    /* ---- row 3: paired stress bars ---- */
    svg.appendChild(svgText(marginL, y3top - 8, T("season.row_stress", "Oxygen stress index, before vs after (0 = none, 1 = lethal)"),
      { fill: "var(--fg-dim)", "font-size": "11", "font-weight": "700" }));
    [0, 0.5, 1].forEach(function (v) {
      var yy = y3bot - v * row3H;
      svg.appendChild(svgEl("line", { x1: marginL, x2: W - marginR, y1: yy, y2: yy, stroke: "var(--border)", "stroke-width": "1" }));
      svg.appendChild(svgText(marginL - 6, yy + 3, v.toFixed(1), { "text-anchor": "end", fill: "var(--fg-dim)", "font-size": "10" }));
    });
    var groupW = colW * 0.6, barW = groupW / 2 - 2;
    for (m = 1; m <= 12; m++) {
      var rm = byM[m];
      var gx = xLeft(m) + (colW - groupW) / 2;
      var sb = rm && rm.s_base != null ? rm.s_base : 0;
      var so = rm && rm.s_oxy != null ? rm.s_oxy : 0;
      var hb = sb * row3H, ho = so * row3H;
      svg.appendChild(svgEl("rect", { x: gx, y: y3bot - hb, width: barW, height: Math.max(hb, 0), fill: "var(--coral)", opacity: "0.85" }));
      svg.appendChild(svgEl("rect", { x: gx + barW + 2, y: y3bot - ho, width: barW, height: Math.max(ho, 0), fill: "var(--aqua)", opacity: "0.95" }));
      if (rm && rm.in_crop) {
        svg.appendChild(svgEl("rect", { x: xLeft(m) + 1, y: y3top, width: colW - 2, height: row3H, fill: "none", stroke: "var(--mango)", "stroke-width": "1.5", "stroke-dasharray": "3,2" }));
      }
    }

    /* ---- shared bottom month axis ---- */
    for (m = 1; m <= 12; m++) {
      svg.appendChild(svgText(xMid(m), y3bot + bottomAxisH - 2, MONTH_ABBR[m],
        { "text-anchor": "middle", fill: "var(--fg-dim)", "font-size": "10.5" }));
    }

    var wrap = document.createElement("div");
    wrap.className = "chart-svg-wrap";
    wrap.appendChild(svg);
    hostEl.appendChild(wrap);

    var legend = document.createElement("div");
    legend.className = "chart-legend";
    legend.appendChild(legendItem("var(--aqua)", T("season.legend_optimum", "Species' optimum temperature zone")));
    legend.appendChild(legendItem("var(--mango)", T("season.legend_crop", "Crop window")));
    legend.appendChild(legendItem("var(--coral)", T("season.legend_base", "Before (s_base)")));
    legend.appendChild(legendItem("var(--aqua)", T("season.legend_oxy", "After (s_oxy)")));
    legend.appendChild(legendItem("var(--ok)", T("season.legend_green", "Suitable")));
    legend.appendChild(legendItem("var(--warn)", T("season.legend_amber", "Marginal")));
    legend.appendChild(legendItem("var(--bad)", T("season.legend_red", "Outside tolerable range")));
    hostEl.appendChild(legend);
  }

  /* ================================================================
     renderWaterfall(el, result)
     Baseline profit -> +extra revenue -> -extra feed -> -extra
     electricity -> with OXY-Nano, low case and high case side by side.
     Every value is read from result.baseline / result.delta — nothing
     is invented; the running totals are summed from those four fields.
     ================================================================ */
  function renderWaterfall(hostEl, result) {
    clearNode(hostEl);
    if (!result || !result.baseline || !result.delta) {
      emptyState(hostEl, "No profit breakdown to chart.");
      return;
    }

    // amendment A9.3: a fourth deduction, maintenance per crop = maintenance_year / crops_per_year.
    // crops_per_year_tn is read from the assumptions the model already reported (never invented);
    // if it is not there, the step is left out rather than guessed.
    var cropsPerYear = findAssumptionScalar(result, "species.crops_per_year_tn");
    function steps(caseKey) {
      var base = result.baseline.profit || 0;
      var d = result.delta[caseKey] || {};
      var rev = d.revenue_crop || 0, feed = d.feed_crop || 0, elecD = d.elec_crop || 0;
      var s1 = base, s2 = base + rev, s3 = base + rev - feed, s4 = base + rev - feed - elecD;
      var out = [
        { label: T("waterfall.baseline", "Baseline"), short: "Baseline", from: 0, to: s1, kind: "total" },
        { label: T("waterfall.revenue", "+ Extra revenue"), short: "+Revenue", from: s1, to: s2, kind: "up" },
        { label: T("waterfall.feed", "− Extra feed"), short: "−Feed", from: s2, to: s3, kind: "down" },
        { label: T("waterfall.elec", "− Extra electricity"), short: "−Elec.", from: s3, to: s4, kind: "down" }
      ];
      var sFinal = s4;
      if (cropsPerYear && d.maintenance_year != null) {
        var maint = d.maintenance_year / cropsPerYear;
        var s5 = s4 - maint;
        out.push({ label: T("waterfall.maintenance", "− Maintenance"), short: "−Maint.", from: s4, to: s5, kind: "down" });
        sFinal = s5;
      }
      out.push({ label: T("waterfall.final", "With OXY-Nano"), short: "With OXY-Nano", from: 0, to: sFinal, kind: "total" });
      return out;
    }
    var low = steps("low"), high = steps("high");
    var allVals = low.concat(high).reduce(function (acc, s) { return acc.concat([s.from, s.to]); }, []);
    var vMax = Math.max.apply(null, allVals.concat([0]));
    var vMin = Math.min.apply(null, allVals.concat([0]));
    if (vMax === vMin) vMax = vMin + 1;

    var W = 780, marginL = 62, marginR = 14;
    var top = 30, bottomAxisH = 34;
    var plotH = 220;
    var groupGap = 40;
    var groupW = (W - marginL - marginR - groupGap) / 2;
    var barGap = 10;
    var barCount = Math.max(low.length, high.length); // 5 without maintenance, 6 with it
    var barW = (groupW - barGap * (barCount - 1)) / barCount;
    var totalH = top + plotH + bottomAxisH;

    var svg = svgEl("svg", {
      viewBox: "0 0 " + W + " " + totalH,
      role: "img",
      "aria-label": "Profit waterfall per crop, low case and high case: baseline profit, plus extra revenue, minus extra feed, minus extra electricity, minus maintenance where available, ending at profit with OXY-Nano."
    });

    function yFor(v) { return top + plotH - ((v - vMin) / (vMax - vMin)) * plotH; }
    var y0 = yFor(0);
    svg.appendChild(svgEl("line", { x1: marginL, x2: W - marginR, y1: y0, y2: y0, stroke: "var(--border)", "stroke-width": "1" }));
    [vMin, (vMin + vMax) / 2, vMax].forEach(function (v) {
      var yy = yFor(v);
      svg.appendChild(svgEl("line", { x1: marginL, x2: W - marginR, y1: yy, y2: yy, stroke: "var(--border)", "stroke-width": "0.6", "stroke-dasharray": "2,3" }));
      svg.appendChild(svgText(marginL - 8, yy + 3, fmtInr(v), { "text-anchor": "end", fill: "var(--fg-dim)", "font-size": "10" }));
    });
    svg.appendChild(svgText(marginL, 16, T("waterfall.axis", "₹ per crop"), { fill: "var(--fg-dim)", "font-size": "11", "font-weight": "700" }));

    function drawGroup(groupSteps, gx0, caseLabel) {
      svg.appendChild(svgText(gx0 + groupW / 2, top - 10, caseLabel, { "text-anchor": "middle", fill: "var(--fg-strong)", "font-size": "12", "font-weight": "700" }));
      groupSteps.forEach(function (s, i) {
        var bx = gx0 + i * (barW + barGap);
        var yTop = yFor(Math.max(s.from, s.to));
        var yBot = yFor(Math.min(s.from, s.to));
        var h = Math.max(yBot - yTop, 1);
        var colour = s.kind === "total" ? "var(--cyan)" : (s.kind === "up" ? "var(--ok)" : "var(--coral)");
        svg.appendChild(svgEl("rect", { x: bx, y: yTop, width: barW, height: h, fill: colour, opacity: "0.9", rx: 3 }));
        // connector to next bar
        if (i < groupSteps.length - 1) {
          var yConn = yFor(s.to);
          svg.appendChild(svgEl("line", { x1: bx + barW, x2: bx + barW + barGap, y1: yConn, y2: yConn, stroke: "var(--border)", "stroke-width": "1", "stroke-dasharray": "2,2" }));
        }
        svg.appendChild(svgText(bx + barW / 2, top + plotH + 14, s.short, { "text-anchor": "middle", fill: "var(--fg-dim)", "font-size": "9.5" }));
        var valY = s.kind === "total" ? yTop - 6 : (s.to >= s.from ? yTop - 6 : yBot + 12);
        var displayVal = s.kind === "total" ? s.to : Math.abs(s.to - s.from);
        svg.appendChild(svgText(bx + barW / 2, valY, fmtInr(displayVal), { "text-anchor": "middle", fill: "var(--fg-dim)", "font-size": "9" }));
      });
    }
    drawGroup(low, marginL, T("waterfall.low_case", "Low case"));
    drawGroup(high, marginL + groupW + groupGap, T("waterfall.high_case", "High case"));

    var wrap = document.createElement("div");
    wrap.className = "chart-svg-wrap";
    wrap.appendChild(svg);
    hostEl.appendChild(wrap);

    var legend = document.createElement("div");
    legend.className = "chart-legend";
    legend.appendChild(legendItem("var(--cyan)", "Baseline / total"));
    legend.appendChild(legendItem("var(--ok)", "Adds to profit"));
    legend.appendChild(legendItem("var(--coral)", "Subtracts from profit"));
    hostEl.appendChild(legend);
  }

  window.OxyCharts = {
    renderSeasonStrip: renderSeasonStrip,
    renderWaterfall: renderWaterfall
  };
})();
