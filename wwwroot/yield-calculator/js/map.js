// Oxyniti yield calculator: interactive Tamil Nadu choropleth + hotspot map (Leaflet 1.9.4).
// Implements EXECUTION_PLAN.md §4.3 (map.js interface) and §6 WP5 — OxyMap.init/highlight/destroy.
//
// Consumes window.OXY_DATA.districts (GeoJSON FeatureCollection, properties.district,
// properties.inland_production_t, properties.production_year, properties.production_source),
// window.OXY_DATA.hotspots (array, schema as research/hotspots.json: id, name, district, type,
// lat, lng, inland_production_t{value,year,source,status,unit,note}, marine_production_t{...},
// shrimp_farms_registered{...}, dominant_species[], why_hotspot, sources[], status, date) and
// window.OXY_DATA.climate.district_station_map ({ districtName: stationName }).
//
// Accessibility: Leaflet SVG/canvas polygons cannot take real keyboard focus in a way that is
// reliably announced by screen readers, so no tabindex/keyboard handling is added to the district
// polygons here. The district <select> that the page provides is the accessible path — it drives
// the map through OxyMap.highlight(name), and the map drives it back through the onDistrict(name)
// callback passed to OxyMap.init. The map itself is progressive enhancement.

(function (global) {
  'use strict';

  // ---- Constants -----------------------------------------------------------------------------

  var OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  var OSM_ATTRIBUTION =
    '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';
  // OpenStreetMap's tile usage policy requires an HTTP Referer; without one the server returns an
  // "Access blocked" image (HTTP 200, about 7 kB) instead of the real tile (about 30 kB) - verified
  // 2026-09-21. A page opened from file:// sends no Referer, so such pages use Esri's World Street
  // Map tiles, which serve without a Referer (CARTO's free basemap watermarks such requests).
  var FALLBACK_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
  var FALLBACK_ATTRIBUTION =
    'Tiles © <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a>' +
    ' &mdash; Esri, HERE, Garmin, © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, and the GIS user community';
  var BOUNDARY_ATTRIBUTION =
    ' &middot; Boundaries © <a href="https://www.geoboundaries.org" target="_blank" rel="noopener noreferrer">geoBoundaries</a> (ODbL)';
  // A land tile over Tamil Nadu used to probe whether OSM is serving real tiles to this page.
  var OSM_PROBE_TILE = 'https://tile.openstreetmap.org/7/91/60.png';
  var OSM_BLOCK_IMAGE_MAX_BYTES = 10000;

  // Tamil Nadu bounding box with a small margin, per WP5 brief (~7.8-13.8 N, 76.0-80.6 E).
  // Built lazily inside init() with L.latLngBounds so this file has no load-order dependency on L.
  var MAX_BOUNDS_LATLNGS = [[7.8, 76.0], [13.8, 80.6]];

  // Fallback background so polygons stay legible even if the OSM tile request fails (offline etc).
  var NO_TILE_BACKGROUND = '#dde8e6';

  // Theme custom properties (WP4 "Deep Lagoon" tokens) with the fallback hex values from the WP4
  // brief (EXECUTION_PLAN.md §6 WP4), used whenever document.documentElement does not define them.
  var THEME_FALLBACKS = {
    aqua: '#14d8c4',
    cyan: '#5ce1ff',
    mango: '#ffb03a',
    coral: '#ff6b4a',
    ink: '#041f26',
    text: '#dcf2ee'
  };

  // Choropleth ramp: pale aqua -> deep teal, 5 quantile classes. Hand-tuned rather than derived
  // algorithmically from a single --aqua value, because a monotonic 5-step sequential ramp needs
  // more control than one hue variable gives; the endpoints sit close to --cyan (pale end) and
  // --ink (deep end) in feel and read on both the dark theme and a light background.
  var CHORO_RAMP = ['#e6f7f3', '#aee3d6', '#64c8b8', '#2b9689', '#0d5a52'];
  var NULL_FILL = '#9aa3a1'; // grey, for districts with no published production figure

  var NUM_FMT = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

  // ---- Module state (supports destroy()/init() re-entry) -------------------------------------

  var state = {
    map: null,
    container: null,
    geoJsonLayer: null,
    hotspotGroup: null,
    districtLayers: {}, // districtName -> Leaflet layer
    highlightedName: null
  };

  var OxyMap = {};

  // ---- Small utilities -------------------------------------------------------------------------

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, function (ch) {
      switch (ch) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return ch;
      }
    });
  }

  function fmtNumber(v) {
    if (v === null || v === undefined || typeof v !== 'number' || isNaN(v)) return '—';
    return NUM_FMT.format(Math.round(v));
  }

  // Reads either a plain number (districts GeoJSON properties) or a research-style envelope
  // object { value, unit, status, ... } (hotspots.json shape), returning null for anything else.
  function getNumeric(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return isNaN(v) ? null : v;
    if (typeof v === 'object' && typeof v.value === 'number') return v.value;
    return null;
  }

  function readTheme() {
    var computed = (typeof getComputedStyle === 'function') ? getComputedStyle(document.documentElement) : null;
    var theme = {};
    Object.keys(THEME_FALLBACKS).forEach(function (key) {
      var raw = computed ? computed.getPropertyValue('--' + key) : '';
      raw = raw ? raw.trim() : '';
      theme[key] = raw || THEME_FALLBACKS[key];
    });
    return theme;
  }

  // Mechanical shortening of a source citation string for the legend line: takes the text before
  // the first comma (e.g. "DES Statistical Hand Book of Tamil Nadu 2021-22, Table 8.3 (...)" ->
  // "DES Statistical Hand Book of Tamil Nadu 2021-22"). Never invents text, only truncates.
  function shortSource(source) {
    var head = String(source).split(',')[0].trim();
    return head.length > 64 ? head.slice(0, 61) + '…' : head;
  }

  function summariseProduction(features) {
    var years = [];
    var sources = [];
    (features || []).forEach(function (f) {
      var p = (f && f.properties) || {};
      if (p.production_year && years.indexOf(p.production_year) === -1) years.push(p.production_year);
      if (p.production_source && sources.indexOf(p.production_source) === -1) sources.push(p.production_source);
    });
    years.sort();
    var yearLabel = years.length === 0 ? 'year not published'
      : years.length === 1 ? years[0]
      : years[0] + '–' + years[years.length - 1];
    var sourceLabel = sources.length === 0 ? 'no source recorded'
      : shortSource(sources[0]) + (sources.length > 1 ? ' (+' + (sources.length - 1) + ' more source' + (sources.length > 2 ? 's' : '') + ')' : '');
    return { yearLabel: yearLabel, sourceLabel: sourceLabel };
  }

  // ---- Quantile classification -----------------------------------------------------------------

  function computeQuantileBreaks(values) {
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    function quantile(p) {
      if (sorted.length === 0) return 0;
      var pos = (sorted.length - 1) * p;
      var base = Math.floor(pos);
      var rest = pos - base;
      var next = sorted[base + 1] !== undefined ? sorted[base + 1] : sorted[base];
      return sorted[base] + rest * (next - sorted[base]);
    }
    return {
      breaks: [quantile(0.2), quantile(0.4), quantile(0.6), quantile(0.8)],
      min: sorted.length ? sorted[0] : null,
      max: sorted.length ? sorted[sorted.length - 1] : null,
      count: sorted.length
    };
  }

  function classify(v, breaks) {
    for (var i = 0; i < breaks.length; i++) {
      if (v <= breaks[i]) return i;
    }
    return breaks.length;
  }

  function classLabels(q) {
    var edges = [q.min, q.breaks[0], q.breaks[1], q.breaks[2], q.breaks[3], q.max];
    var labels = [];
    for (var i = 0; i < 5; i++) {
      labels.push(fmtNumber(edges[i]) + '–' + fmtNumber(edges[i + 1]) + ' t');
    }
    return labels;
  }

  // ---- Hotspot marker styling -------------------------------------------------------------------

  function buildHotspotTypes(theme) {
    return {
      district_summary: { label: 'District summary', color: theme.cyan, radius: 4 },
      freshwater_cluster: { label: 'Freshwater cluster', color: theme.aqua, radius: 7 },
      brackish_cluster: { label: 'Brackish cluster', color: theme.mango, radius: 7 },
      seed_farm: { label: 'Seed farm / hatchery', color: theme.coral, radius: 6 },
      reservoir: { label: 'Reservoir', color: theme.ink, radius: 7 }
    };
  }

  function badgeClass(status) {
    var s = String(status || 'unknown').toLowerCase();
    if (s.indexOf('verif') !== -1) return 'oxy-badge-verified';
    if (s.indexOf('assum') !== -1) return 'oxy-badge-assumed';
    return 'oxy-badge-other';
  }

  function hotspotPopupHtml(h, hotspotTypes) {
    var typeInfo = hotspotTypes[h.type] || { label: h.type || 'Hotspot' };
    var species = Array.isArray(h.dominant_species) && h.dominant_species.length
      ? h.dominant_species.map(escapeHtml).join(', ')
      : '';
    var sourcesHtml = Array.isArray(h.sources)
      ? h.sources.map(function (s, i) {
          var str = String(s || '');
          if (/^https?:\/\//i.test(str)) {
            return '<a href="' + escapeHtml(str) + '" target="_blank" rel="noopener noreferrer">[' + (i + 1) + ']</a>';
          }
          return escapeHtml(str);
        }).join(' ')
      : '';

    var parts = [];
    parts.push('<div class="oxy-popup">');
    parts.push('<h4 class="oxy-popup-title">' + escapeHtml(h.name) + '</h4>');
    parts.push('<p class="oxy-popup-meta">' + escapeHtml(h.district) + ' &middot; ' + escapeHtml(typeInfo.label) + '</p>');
    if (h.why_hotspot) parts.push('<p>' + escapeHtml(h.why_hotspot) + '</p>');
    if (species) parts.push('<p><strong>Dominant species:</strong> ' + species + '</p>');
    parts.push('<p><span class="oxy-badge ' + badgeClass(h.status) + '">' + escapeHtml(h.status || 'UNKNOWN') + '</span></p>');
    if (sourcesHtml) parts.push('<p class="oxy-popup-sources">Sources: ' + sourcesHtml + '</p>');
    parts.push('</div>');
    return parts.join('');
  }

  // ---- District choropleth ----------------------------------------------------------------------

  function makeDistrictStyleFn(theme, q) {
    var borderColor = theme.text;
    return function districtStyle(feature) {
      var v = getNumeric(feature.properties && feature.properties.inland_production_t);
      if (v === null) {
        return {
          color: borderColor,
          weight: 1,
          opacity: 0.4,
          fillColor: NULL_FILL,
          fillOpacity: 0.25,
          dashArray: '4,3'
        };
      }
      var cls = classify(v, q.breaks);
      return {
        color: borderColor,
        weight: 1,
        opacity: 0.4,
        fillColor: CHORO_RAMP[cls],
        fillOpacity: 0.78
      };
    };
  }

  function makeHighlightStyle(theme) {
    return { color: theme.coral, weight: 3, opacity: 1, dashArray: null };
  }

  function districtTooltipHtml(name, feature, stationMap) {
    var v = getNumeric(feature.properties && feature.properties.inland_production_t);
    var year = feature.properties && feature.properties.production_year;
    var station = stationMap ? stationMap[name] : null;

    var prodLine = v === null
      ? 'no published district figure'
      : 'Inland production: ' + fmtNumber(v) + ' t' + (year ? ' (' + escapeHtml(year) + ')' : '');
    var stationLine = station
      ? 'Climate station: ' + escapeHtml(station)
      : 'Climate station: not mapped';

    return '<strong>' + escapeHtml(name) + '</strong><br>' + prodLine + '<br>' + stationLine;
  }

  // ---- Legend control ------------------------------------------------------------------------

  function buildLegend(q, hotspotTypes, prodSummary) {
    var Legend = L.Control.extend({
      options: { position: 'bottomleft' },
      onAdd: function () {
        var div = L.DomUtil.create('div', 'oxy-legend');
        L.DomEvent.disableClickPropagation(div);
        if (L.DomEvent.disableScrollPropagation) L.DomEvent.disableScrollPropagation(div);

        var html = '<div class="oxy-legend-title">Inland fish production</div>';
        if (q.count > 0) {
          var labels = classLabels(q);
          for (var i = 0; i < CHORO_RAMP.length; i++) {
            html += '<div class="oxy-legend-row"><span class="oxy-legend-swatch" style="background:' +
              CHORO_RAMP[i] + '"></span>' + escapeHtml(labels[i]) + '</div>';
          }
        } else {
          html += '<div class="oxy-legend-row">No published production figures</div>';
        }
        html += '<div class="oxy-legend-row"><span class="oxy-legend-swatch oxy-legend-swatch-null" style="background:' +
          NULL_FILL + '"></span>No published district figure</div>';

        /*
         * The hotspot key is wrapped so the narrow-screen rule below can drop it: at 360 px it
         * otherwise covers most of the map (reported by WP4). The markers stay on the map and
         * keep their popups, so nothing is lost but the colour key.
         */
        html += '<div class="oxy-legend-hotspots"><div class="oxy-legend-title oxy-legend-title-2">Hotspots</div>';
        Object.keys(hotspotTypes).forEach(function (key) {
          var t = hotspotTypes[key];
          html += '<div class="oxy-legend-row"><span class="oxy-legend-dot" style="background:' +
            t.color + '"></span>' + escapeHtml(t.label) + '</div>';
        });
        html += '</div><div class="oxy-legend-hotspots-narrow">Tap a marker for hotspot details.</div>';

        html += '<div class="oxy-legend-footnote">Inland production: ' +
          escapeHtml(prodSummary.yearLabel) + ', ' + escapeHtml(prodSummary.sourceLabel) + '</div>';

        div.innerHTML = html;
        return div;
      }
    });
    return new Legend();
  }

  // ---- Self-contained CSS (map.js does not depend on, and must not edit, css/styles.css) -------

  function injectStyles() {
    if (document.getElementById('oxy-map-inline-styles')) return;
    var style = document.createElement('style');
    style.id = 'oxy-map-inline-styles';
    style.textContent = [
      '.oxy-legend{background:rgba(255,255,255,.94);color:#132420;padding:8px 10px;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,.35);font:12px/1.4 Manrope,Arial,sans-serif;max-width:230px;}',
      '.oxy-legend-title{font-weight:700;margin-bottom:4px;}',
      '.oxy-legend-title-2{margin-top:8px;}',
      '.oxy-legend-row{display:flex;align-items:center;gap:6px;margin:2px 0;}',
      '.oxy-legend-swatch{width:14px;height:14px;display:inline-block;border:1px solid rgba(0,0,0,.35);flex:0 0 auto;}',
      '.oxy-legend-swatch-null{background-image:repeating-linear-gradient(45deg,rgba(0,0,0,.25) 0 2px,transparent 2px 4px);}',
      '.oxy-legend-dot{width:10px;height:10px;border-radius:50%;display:inline-block;border:1px solid rgba(0,0,0,.35);flex:0 0 auto;}',
      '.oxy-legend-footnote{margin-top:6px;font-size:11px;opacity:.8;}',
      '.oxy-legend-hotspots-narrow{display:none;}',
      /* Narrow screens: drop the hotspot colour key (WP6 fix — it covered most of a 360 px map)
         but keep the production classes and the source/year footnote, which are the provenance. */
      '@media (max-width:479px){' +
        '.oxy-legend{max-width:164px;font:11px/1.35 Manrope,Arial,sans-serif;padding:6px 8px;}' +
        '.oxy-legend-swatch{width:11px;height:11px;}' +
        '.oxy-legend-hotspots{display:none;}' +
        '.oxy-legend-hotspots-narrow{display:block;margin-top:6px;font-size:10.5px;opacity:.85;}' +
        '.oxy-legend-footnote{font-size:10px;}' +
      '}',
      '.oxy-popup{font:13px/1.4 Manrope,Arial,sans-serif;max-width:260px;}',
      '.oxy-popup-title{margin:0 0 2px;font:700 14px Sora,Arial,sans-serif;}',
      '.oxy-popup-meta{margin:0 0 6px;opacity:.75;font-size:12px;}',
      '.oxy-badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.02em;color:#fff;}',
      '.oxy-badge-verified{background:#16a34a;}',
      '.oxy-badge-assumed{background:#d97706;}',
      '.oxy-badge-other{background:#6b7280;}',
      '.oxy-popup-sources{margin-top:6px;font-size:11px;}',
      '.oxy-popup-sources a{color:#0a6f63;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ---- Highlight handling -----------------------------------------------------------------------

  function applyHighlight(name, highlightStyle) {
    if (!state.geoJsonLayer) return null;
    if (state.highlightedName && state.districtLayers[state.highlightedName]) {
      state.geoJsonLayer.resetStyle(state.districtLayers[state.highlightedName]);
    }
    var layer = state.districtLayers[name];
    if (!layer) {
      console.warn('[OxyMap] highlight: unknown district "' + name + '"');
      state.highlightedName = null;
      return null;
    }
    layer.setStyle(highlightStyle);
    if (typeof layer.bringToFront === 'function') layer.bringToFront();
    state.highlightedName = name;
    return layer;
  }

  // ---- Public API -----------------------------------------------------------------------------

  OxyMap.init = function (el, data, opts) {
    if (typeof L === 'undefined') {
      throw new Error('[OxyMap] Leaflet (L) is not loaded — include vendor/leaflet/leaflet.js before map.js.');
    }
    opts = opts || {};
    data = data || {};

    var container = typeof el === 'string' ? document.getElementById(el) : el;
    if (!container) throw new Error('[OxyMap] init: map element not found: ' + el);

    if (state.map) OxyMap.destroy();
    injectStyles();

    container.style.background = NO_TILE_BACKGROUND;

    var maxBounds = L.latLngBounds(MAX_BOUNDS_LATLNGS);
    var map = L.map(container, {
      maxBounds: maxBounds,
      maxBoundsViscosity: 0.6,
      zoomSnap: 0.25,   // lets fitBounds settle on a fractional zoom so Tamil Nadu fills the box
      minZoom: 6
    });
    // Leaflet 1.9 prefixes its credit with a Ukrainian-flag glyph; keep the credit, drop the flag.
    map.attributionControl.setPrefix(
      '<a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>');

    var baseLayer = null;
    function addBasemap(kind) {
      if (baseLayer) { map.removeLayer(baseLayer); }
      var isFallback = kind === 'fallback';
      baseLayer = L.tileLayer(isFallback ? FALLBACK_TILE_URL : OSM_TILE_URL, {
        attribution: (isFallback ? FALLBACK_ATTRIBUTION : OSM_ATTRIBUTION) + BOUNDARY_ATTRIBUTION,
        subdomains: 'abc',
        maxZoom: 18,
        referrerPolicy: 'strict-origin-when-cross-origin'
      }).addTo(map);
      container.setAttribute('data-basemap', isFallback ? 'esri' : 'osm');
    }
    // Pick the basemap: file:// pages cannot send a Referer, so go straight to the fallback;
    // otherwise probe one OSM tile and switch to the fallback if the block image comes back.
    if (global.location && global.location.protocol === 'file:') {
      addBasemap('fallback');
    } else {
      addBasemap('osm');
      if (typeof global.fetch === 'function') {
        global.fetch(OSM_PROBE_TILE, { referrerPolicy: 'strict-origin-when-cross-origin' })
          .then(function (r) { return r.ok ? r.blob() : null; })
          .then(function (b) { if (b && b.size < OSM_BLOCK_IMAGE_MAX_BYTES) { addBasemap('fallback'); } })
          .catch(function () { /* offline or blocked fetch: keep OSM; polygons draw regardless */ });
      }
    }

    var theme = readTheme();
    var hotspotTypes = buildHotspotTypes(theme);
    var highlightStyle = makeHighlightStyle(theme);

    var districtsFc = (data.districts && Array.isArray(data.districts.features))
      ? data.districts
      : { type: 'FeatureCollection', features: [] };

    var nonNullValues = [];
    districtsFc.features.forEach(function (f) {
      var v = getNumeric(f.properties && f.properties.inland_production_t);
      if (v !== null) nonNullValues.push(v);
    });
    var q = computeQuantileBreaks(nonNullValues);

    var stationMap = data.climate && data.climate.district_station_map ? data.climate.district_station_map : {};

    state.districtLayers = {};
    var districtStyleFn = makeDistrictStyleFn(theme, q);

    var geoJsonLayer = L.geoJSON(districtsFc, {
      style: districtStyleFn,
      onEachFeature: function (feature, layer) {
        var name = feature.properties && feature.properties.district;
        if (!name) return;
        state.districtLayers[name] = layer;

        layer.bindTooltip(districtTooltipHtml(name, feature, stationMap), { sticky: true, direction: 'top' });

        layer.on('click', function () {
          applyHighlight(name, highlightStyle);
          if (typeof opts.onDistrict === 'function') opts.onDistrict(name);
        });
        layer.on('mouseover', function () {
          if (name !== state.highlightedName) layer.setStyle({ weight: 2, opacity: 0.7 });
        });
        layer.on('mouseout', function () {
          if (name !== state.highlightedName) geoJsonLayer.resetStyle(layer);
        });
      }
    }).addTo(map);

    if (geoJsonLayer.getBounds().isValid()) {
      map.fitBounds(geoJsonLayer.getBounds(), { padding: [10, 10] });
    } else {
      console.warn('[OxyMap] init: no valid district geometry in data.districts; showing default TN extent.');
      map.fitBounds(maxBounds);
    }

    var hotspotGroup = L.layerGroup().addTo(map);
    var hotspots = Array.isArray(data.hotspots) ? data.hotspots : [];
    hotspots.forEach(function (h) {
      if (typeof h.lat !== 'number' || typeof h.lng !== 'number' || isNaN(h.lat) || isNaN(h.lng)) return;
      var t = hotspotTypes[h.type] || { label: h.type || 'Hotspot', color: theme.ink, radius: 6 };
      L.circleMarker([h.lat, h.lng], {
        radius: t.radius,
        color: theme.text,
        weight: 1.5,
        opacity: 0.9,
        fillColor: t.color,
        fillOpacity: 0.85
      })
        .bindPopup(hotspotPopupHtml(h, hotspotTypes))
        .addTo(hotspotGroup);
    });

    var prodSummary = summariseProduction(districtsFc.features);
    var legend = buildLegend(q, hotspotTypes, prodSummary);
    legend.addTo(map);

    state.map = map;
    state.container = container;
    state.geoJsonLayer = geoJsonLayer;
    state.hotspotGroup = hotspotGroup;
    state.highlightedName = null;
    state._highlightStyle = highlightStyle;

    return map;
  };

  OxyMap.highlight = function (name) {
    if (!state.map) {
      console.warn('[OxyMap] highlight: map not initialised.');
      return;
    }
    var layer = applyHighlight(name, state._highlightStyle);
    if (layer) {
      state.map.panTo(layer.getBounds().getCenter());
    }
  };

  OxyMap.destroy = function () {
    if (state.map) {
      state.map.remove();
    }
    if (state.container) {
      state.container.style.background = '';
    }
    state.map = null;
    state.container = null;
    state.geoJsonLayer = null;
    state.hotspotGroup = null;
    state.districtLayers = {};
    state.highlightedName = null;
    state._highlightStyle = null;
  };

  global.OxyMap = OxyMap;
})(typeof window !== 'undefined' ? window : this);
