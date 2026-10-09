function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

window.oxynitiMap = {
    _maps: {},

    // Default view centered on Tamil Nadu / South India (Oxyniti's pilot territory).
    _defaultLat: 10.9,
    _defaultLng: 78.7,
    _defaultZoom: 7,

    _mapOptions: {},

    // tile.openstreetmap.org serves an "Access blocked" tile to requests with no Referer,
    // so send one explicitly. The OSM tile policy also requires the visible credit line.
    _addTiles: function (map) {
        map.attributionControl.setPrefix(false);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            referrerPolicy: 'strict-origin-when-cross-origin',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
        }).addTo(map);
    },

    initPicker: function (elementId, lat, lng) {
        this._destroy(elementId);

        const hasStart = lat !== null && lat !== undefined && lng !== null && lng !== undefined;
        const startLat = hasStart ? lat : this._defaultLat;
        const startLng = hasStart ? lng : this._defaultLng;

        const map = L.map(elementId, this._mapOptions).setView([startLat, startLng], hasStart ? 13 : this._defaultZoom);
        this._addTiles(map);

        let marker = hasStart ? L.marker([startLat, startLng], { draggable: true }).addTo(map) : null;

        const fillPlace = this._placeFiller(elementId);

        const placeMarker = (latlng) => {
            if (marker) {
                marker.setLatLng(latlng);
            } else {
                marker = L.marker(latlng, { draggable: true }).addTo(map);
                marker.on('dragend', () => fillPlace(marker.getLatLng()));
            }
            fillPlace(latlng);
        };

        if (marker) marker.on('dragend', () => fillPlace(marker.getLatLng()));
        map.on('click', (e) => placeMarker(e.latlng));

        this._maps[elementId] = { map, getMarker: () => marker, setMarker: placeMarker };
    },

    // Returns fn(latlng) that looks up the tapped spot via OSM Nominatim and fills
    // the form's place boxes: data-field="place" always, plus "district" and
    // "state" when the form has them (the staff demo log does; the home page's
    // free-demo form has only "place", so it gets "Village, Taluk" there).
    // It never overwrites text the user typed: only an empty box, or one this
    // function filled last, is replaced.
    _placeFiller: function (elementId) {
        const mapEl = document.getElementById(elementId);
        const form = mapEl && mapEl.closest('form');
        const box = (name) => form && form.querySelector(`[data-field="${name}"]`);
        const fields = [
            { input: box('place'), value: null, lastFilled: null },
            { input: box('district'), value: null, lastFilled: null },
            { input: box('state'), value: null, lastFilled: null },
        ];
        const [place, district, state] = fields;
        if (!place.input) return () => {};
        const splitPlace = !!district.input;

        const isOurs = (f) => {
            const current = f.input.value.trim();
            return !current || current === f.lastFilled;
        };

        let timer = null;
        let pending = null;

        return (latlng) => {
            clearTimeout(timer);
            // Debounce so repeated taps / drags make one lookup (Nominatim allows 1 req/s).
            timer = setTimeout(async () => {
                const present = fields.filter(f => f.input);
                if (!present.some(isOurs)) return;

                if (pending) pending.abort();
                pending = new AbortController();

                const lang = document.documentElement.lang || 'en';
                const url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&addressdetails=1' +
                    `&lat=${latlng.lat}&lon=${latlng.lng}&accept-language=${encodeURIComponent(lang)}`;

                try {
                    const res = await fetch(url, {
                        signal: pending.signal,
                        referrerPolicy: 'strict-origin-when-cross-origin'
                    });
                    if (!res.ok) return;
                    const address = (await res.json()).address;
                    place.value = splitPlace ? this._placePrimary(address) : this._placeLabel(address);
                    district.value = this._placeDistrict(address);
                    state.value = (address && address.state) || '';

                    // Re-check each box: the user may have typed while the lookup was in flight.
                    for (const f of present) {
                        if (!f.value || !isOurs(f)) continue;
                        f.input.value = f.value;
                        f.lastFilled = f.value;
                        // Blazor binds on 'input' or 'change'; the static island reads .value.
                        f.input.dispatchEvent(new Event('input', { bubbles: true }));
                        f.input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                } catch (err) {
                    if (err.name !== 'AbortError') console.warn('[oxynitiMap] Place lookup failed:', err);
                }
            }, 600);
        };
    },

    // The village / town itself (e.g. "Mettutteruvu").
    _placePrimary: function (address) {
        if (!address) return '';
        return address.village || address.hamlet || address.suburb || address.town || address.city || address.county || '';
    },

    // "Village, Taluk" (e.g. "Mettutteruvu, Lalgudi"), falling back to town/city and district.
    _placeLabel: function (address) {
        if (!address) return '';
        const primary = address.village || address.hamlet || address.town || address.city || address.county;
        if (!primary) return '';
        const secondary = address.county && address.county !== primary
            ? address.county
            : address.state_district;
        return secondary && secondary !== primary ? `${primary}, ${secondary}` : primary;
    },

    // Indian districts come back as state_district, sometimes as "X District".
    _placeDistrict: function (address) {
        if (!address) return '';
        return (address.state_district || '').replace(/\s+district$/i, '').trim();
    },

    getPickerLocation: function (elementId) {
        const entry = this._maps[elementId];
        const marker = entry && entry.getMarker ? entry.getMarker() : null;
        if (!marker) return null;
        const pos = marker.getLatLng();
        return [pos.lat, pos.lng];
    },

    // Moves (or drops) the picker's marker, e.g. after "Use my location".
    setPickerLocation: function (elementId, lat, lng) {
        const entry = this._maps[elementId];
        if (!entry || !entry.setMarker) return;
        entry.setMarker(L.latLng(lat, lng));
        entry.map.setView([lat, lng], 15);
    },

    // The device's GPS position as [lat, lng], or null if it is unavailable or refused.
    currentPosition: function () {
        return new Promise((resolve) => {
            if (!navigator.geolocation) { resolve(null); return; }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
        });
    },

    focusPoint: function (elementId, lat, lng) {
        const entry = this._maps[elementId];
        if (!entry) return;
        entry.map.setView([lat, lng], 12);
        const marker = (entry.markers || []).find(m => {
            const p = m.getLatLng();
            return Math.abs(p.lat - lat) < 1e-9 && Math.abs(p.lng - lng) < 1e-9;
        });
        if (marker) marker.openPopup();
        entry.map.getContainer().scrollIntoView({ behavior: 'smooth', block: 'center' });
    },

    // Brand pin: navy teardrop whose core is coloured by the demo's outcome
    // (same colours as the card badges and the legend in Pages/MyDemos.razor).
    _pinCores: {
        ordered: '#2ECC71',
        interested: '#4FC3F7',
        'follow-up': '#FFB020',
        'not-interested': '#B0BAC5',
    },

    _pinIcon: function (outcome) {
        const core = this._pinCores[outcome] || '#27D0CA';
        return L.divIcon({
            className: 'oxy-pin',
            html: '<svg viewBox="0 0 32 42" width="32" height="42" aria-hidden="true">' +
                '<path d="M16 41s13-14.2 13-24.5C29 8.5 23.2 3 16 3S3 8.5 3 16.5C3 26.8 16 41 16 41z" fill="#1A2C54" stroke="#fff" stroke-width="2"/>' +
                `<circle cx="16" cy="16.5" r="5.5" fill="${core}"/></svg>`,
            iconSize: [32, 42],
            iconAnchor: [16, 41],
            popupAnchor: [0, -36],
        });
    },

    // Demo-log map (Pages/MyDemos.razor). points: [{ lat, lng, title, date, outcome, lines: [] }].
    initDisplay: function (elementId, points) {
        this._destroy(elementId);

        const map = L.map(elementId, Object.assign({ scrollWheelZoom: false }, this._mapOptions));
        this._addTiles(map);
        const layer = L.layerGroup().addTo(map);
        this._maps[elementId] = { map, layer, markers: [] };
        this.setDisplayPoints(elementId, points);
    },

    // Replaces the pins (e.g. when the list is filtered) and refits the view.
    setDisplayPoints: function (elementId, points) {
        const entry = this._maps[elementId];
        if (!entry || !entry.layer) return;
        entry.layer.clearLayers();

        entry.markers = (points || []).map(p => {
            const lines = (p.lines || []).filter(Boolean)
                .map(l => `<div class="oxy-popup-line">${escapeHtml(l)}</div>`).join('');
            return L.marker([p.lat, p.lng], { icon: this._pinIcon(p.outcome), title: p.title || '' })
                .bindPopup(
                    `<div class="oxy-popup-date">${escapeHtml(p.date)}</div>` +
                    `<div class="oxy-popup-title">${escapeHtml(p.title)}</div>${lines}`,
                    { className: 'oxy-popup', closeButton: false })
                .addTo(entry.layer);
        });

        if (!entry.markers.length) {
            entry.map.setView([this._defaultLat, this._defaultLng], 6);
            return;
        }
        // Never closer than district level, so town names stay on screen.
        entry.map.fitBounds(L.featureGroup(entry.markers).getBounds().pad(0.3), { maxZoom: 9 });
    },

    _destroy: function (elementId) {
        const entry = this._maps[elementId];
        if (entry) {
            entry.map.remove();
            delete this._maps[elementId];
        }
    }
};
