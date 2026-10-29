/* Oxyniti yield calculator — lead-capture configuration (owner-editable, no secrets).

   The page is static (GitHub Pages), so a lead can leave the browser by two routes:

   1. `endpoint` — an HTTPS URL that accepts a JSON POST (Web3Forms, Formspree, a Cloudflare
      Worker, anything). Leave it "" and the page skips this route entirely and says so in the
      console. Set it once you have created the endpoint; nothing else needs to change.
        Web3Forms example (free, key arrives by e-mail after a one-line sign-up):
          endpoint:    "https://api.web3forms.com/submit",
          extraFields: { access_key: "<the key Web3Forms e-mailed you>" }
      The access key is public by design (it only lets someone send *you* a form).

   2. WhatsApp — always available. After the form the farmer taps a button that opens a
      pre-filled WhatsApp message to `whatsappNumber` carrying their details and a reference
      code. `tools/leads/vet_lead.py` decodes that code, vets the request, and
      `tools/leads/make_report.py` builds the report the owner then sends back.

   Status of this file: VERIFIED 2026-09-22 that both routes are wired; `endpoint` is empty
   until the owner creates one (EXECUTION_PLAN.md section 7, owner decision).

   classic script — assigns window.OXY_LEADS_CONFIG, works from file://
*/
window.OXY_LEADS_CONFIG = {
  // JSON POST target, or "" to use WhatsApp only.
  endpoint: "",
  // Extra top-level fields merged into every POST (e.g. a Web3Forms access_key).
  extraFields: {},
  // The number that receives WhatsApp requests. Published on oxyniti.com (VERIFIED 2026-09-21).
  whatsappNumber: "919659727477",
  // Working-day promise shown to the farmer. Owner-stated turnaround, not a system guarantee.
  turnaroundText: "within one working day",
  // Minimum time on the page before a request is accepted, in milliseconds. A human who has
  // read the page and typed four fields cannot be quicker than this; most bots are.
  minTimeOnPageMs: 4000,
  // How long a "request received" state persists in this browser before the form is offered
  // again, in days.
  receivedStateDays: 30,
  // Optional Cloudflare Turnstile site key. Empty disables the widget; the honeypot, timing
  // and arithmetic checks still run.
  turnstileSiteKey: ""
};
