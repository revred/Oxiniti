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

    _addTiles: function (map) {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
    },

    initPicker: function (elementId, lat, lng) {
        this._destroy(elementId);

        const hasStart = lat !== null && lat !== undefined && lng !== null && lng !== undefined;
        const startLat = hasStart ? lat : this._defaultLat;
        const startLng = hasStart ? lng : this._defaultLng;

        const map = L.map(elementId).setView([startLat, startLng], hasStart ? 13 : this._defaultZoom);
        this._addTiles(map);

        let marker = hasStart ? L.marker([startLat, startLng], { draggable: true }).addTo(map) : null;

        const placeMarker = (latlng) => {
            if (marker) {
                marker.setLatLng(latlng);
            } else {
                marker = L.marker(latlng, { draggable: true }).addTo(map);
            }
        };

        map.on('click', (e) => placeMarker(e.latlng));

        this._maps[elementId] = { map, getMarker: () => marker };
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

        const map = L.map(elementId);
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
