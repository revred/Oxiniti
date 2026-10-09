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

    // Returns fn(latlng) that looks up the tapped spot's village via OSM Nominatim and
    // writes it into the form's Village / Town box. It never overwrites text the user
    // typed: only an empty box, or one this function filled last, is replaced.
    _placeFiller: function (elementId) {
        const mapEl = document.getElementById(elementId);
        const form = mapEl && mapEl.closest('form');
        const input = form && form.querySelector('[data-field="place"]');
        if (!input) return () => {};

        let lastFilled = null;
        let timer = null;
        let pending = null;

        return (latlng) => {
            clearTimeout(timer);
            // Debounce so repeated taps / drags make one lookup (Nominatim allows 1 req/s).
            timer = setTimeout(async () => {
                const current = input.value.trim();
                if (current && current !== lastFilled) return;

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
                    const label = this._placeLabel((await res.json()).address);
                    if (!label) return;

                    // Re-check: the user may have typed while the lookup was in flight.
                    const now = input.value.trim();
                    if (now && now !== lastFilled) return;

                    input.value = label;
                    lastFilled = label;
                    // Blazor's InputText binds on 'change'; the static island reads .value.
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                } catch (err) {
                    if (err.name !== 'AbortError') console.warn('[oxynitiMap] Place lookup failed:', err);
                }
            }, 600);
        };
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

    // Brand pin (navy teardrop, teal core) -- styled by .oxy-pin in app.css.
    _pinIcon: function () {
        return L.divIcon({
            className: 'oxy-pin',
            html: '<svg viewBox="0 0 32 42" width="32" height="42" aria-hidden="true">' +
                '<path d="M16 41s13-14.2 13-24.5C29 8.5 23.2 3 16 3S3 8.5 3 16.5C3 26.8 16 41 16 41z" fill="#1A2C54" stroke="#fff" stroke-width="2"/>' +
                '<circle cx="16" cy="16.5" r="5.5" fill="#27D0CA"/></svg>',
            iconSize: [32, 42],
            iconAnchor: [16, 41],
            popupAnchor: [0, -36],
        });
    },

    // Demo-log map (Pages/MyDemos.razor). points: [{ lat, lng, title, date, lines: [] }].
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

        const icon = this._pinIcon();
        entry.markers = (points || []).map(p => {
            const lines = (p.lines || []).filter(Boolean)
                .map(l => `<div class="oxy-popup-line">${escapeHtml(l)}</div>`).join('');
            return L.marker([p.lat, p.lng], { icon, title: p.title || '' })
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
