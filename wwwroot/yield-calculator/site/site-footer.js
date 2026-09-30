// Draws the footer's WhatsApp-community QR code with the same loader the Razor
// footer uses (Pages/Components/WhatsAppGroupQr.razor): nothing is fetched until
// the footer scrolls near the viewport. The link matches SiteContact.WhatsAppGroupLink.
import { ensureLoaded, whenVisible } from "/js/qrLoader.js";

const QR_ID = "oxy-footer-qr";
const GROUP_LINK = "https://chat.whatsapp.com/IlHfPXCNWk3LQa1LYPqceu?s=sw&p=i&mlu=4";

whenVisible(QR_ID)
    .then(ensureLoaded)
    .then(() => window.oxynitiQr.render(QR_ID, GROUP_LINK))
    .catch((err) => console.error("[yield-calculator] WhatsApp QR code failed:", err));
