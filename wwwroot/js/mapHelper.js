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

        this._maps[elementId] = { map, getMarker: () => marker };
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

    initDisplay: function (elementId, points) {
        this._destroy(elementId);

        const map = L.map(elementId, this._mapOptions);
        this._addTiles(map);

        if (!points || !points.length) {
            map.setView([this._defaultLat, this._defaultLng], this._defaultZoom);
            this._maps[elementId] = { map };
            return;
        }

        const markers = points.map(p => {
            const marker = L.marker([p.lat, p.lng]).addTo(map);
            marker.bindPopup(
                `<b>${escapeHtml(p.name)}</b><br/>${escapeHtml(p.place)}<br/>${escapeHtml(p.phone)}<br/>` +
                `<span style="color:#666">${escapeHtml(p.species)} &middot; ${escapeHtml(p.size)}</span>`
            );
            return marker;
        });

        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.2));
        if (points.length === 1) map.setZoom(13);

        this._maps[elementId] = { map };
    },

    _destroy: function (elementId) {
        const entry = this._maps[elementId];
        if (entry) {
            entry.map.remove();
            delete this._maps[elementId];
        }
    }
};
