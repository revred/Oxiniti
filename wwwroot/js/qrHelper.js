window.oxynitiQr = {
    // Renders a QR code for `text` into the element with id `elementId`.
    // Requires qrcode-generator (window.qrcode) to already be loaded — see qrLoader.js.
    render: function (elementId, text) {
        var el = document.getElementById(elementId);
        if (!el) return;

        var qr = qrcode(0, 'M'); // 0 = auto type-number detection
        qr.addData(text);
        qr.make();

        el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });

        // Blazor's CSS isolation only tags elements it renders itself, so a
        // scoped ".wa-group-qr-code svg" rule wouldn't reach this JS-injected
        // <svg> — size it directly instead.
        var svg = el.querySelector('svg');
        if (svg) {
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.display = 'block';
        }
    }
};
