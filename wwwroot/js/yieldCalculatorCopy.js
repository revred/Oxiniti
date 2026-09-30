// oxyniti.com wording for the yield calculator (/yield-calculator).
//
// The calculator's own strings (wwwroot/yield-calculator/js/i18n.js, synced
// unchanged from the calculator repo) were written for its developers: file
// names, status codes, model terms. yieldCalculator.js lays these over them,
// so visitors read plain language while the calculator code stays untouched.
// A key listed here wins in every language; everything else falls through to
// the calculator's own English/Tamil strings.
export const COPY = {
    // Map card and location inputs
    "district.card.station": "Nearest weather station",
    "results.station": "Weather data from",
    "district.card.placeholder": "Click the map or choose a district to see its fish production and nearest weather station.",
    "input.station_name": "Weather from a nearby city",
    "input.station_default_option": "Use the district's own weather",
    "input.station_hint": "Optional — see how the same pond would do in another city's weather.",
    "input.species_panel_toggle": "About each species",
    "input.depth_hint": "A typical depth — adjust to match your pond.",

    // Unit and cost inputs
    "input.unit_price_hint": "A rough estimate — replace it with your quote.",
    "input.concentrator_price_hint": "A rough estimate — replace it with your quote.",
    "input.o2_input_lpm_override": "Oxygen delivery per unit",
    "input.power_kw_override": "Power use per unit",
    "input.override_hint": "Leave blank to use the figures on our product page.",
    "input.maintenance_hint": "Yearly upkeep, as a % of the unit price.",
    "input.include_fcr_gain": "Include better feed conversion",
    "input.include_fcr_gain_hint": "Based on one pond trial: about 7% less feed per kilo of fish. Off by default.",

    // Hidden on this page (site-theme.css); blanked so the text is not even in
    // the HTML: the model's working note, and a pointer to its spec file.
    "results.sensitivity": "",
    "method.sub": "",

    // Results card
    "results.ceiling_note": "At most +18% more saleable fish, for a pond short of oxygen in every month of the crop — less when it is short only some of the time. Not a guarantee: we measure your pond with a DO meter during the free demo.",

    // How this is calculated
    "method.step1.p": "Each district uses its nearest weather station. Shallow tropical ponds follow the air temperature closely, so the monthly air temperature gives the pond's water temperature.",
    "method.step2.h": "2. The right temperature for your fish",
    "method.step2.p": "Every species grows best in a certain temperature range. Months inside that range count fully and months outside it count less, which sets the expected harvest size.",
    "method.step3.h": "3. Oxygen through the night",
    "method.step3.p": "Overnight, fish, plankton and the pond bottom use up oxygen while your existing aeration puts some back. We work out how much is left at dawn, when it is lowest.",
    "method.step4.h": "4. What OXY-Nano adds",
    "method.step4.p": "We compare that dawn oxygen with the level your species needs to grow and survive, then add the oxygen an OXY-Nano unit delivers each month.",
    "method.step5.h": "5. The gain, capped at +18%",
    "method.step5.p": "The extra oxygen becomes extra growth and better survival. A pond short of oxygen in every month gains at most +18% more saleable fish, never more; a pond short only some of the time gains proportionally less.",

    // Known limitations
    "limitations.l1": "It uses average monthly weather, not this year's actual weather.",
    "limitations.l2": "Disease, water exchange and sudden algae crashes are not included.",
    "limitations.l3": "The gain is a careful estimate, not a measurement of your pond.",
    "limitations.l4": "Prices are typical market ranges — enter your own price for a closer estimate.",

    // Warnings
    "warning.CEILING_CLAMPED": "The best-case gain is capped at +18%.",
    "warning.PRICE_OUT_OF_SOURCED_RANGE": "The price you entered is outside the usual market range for this species.",
    "warning.NO_PAYBACK_AT_PUBLISHED_O2": "At the product's listed oxygen output, the extra fish do not cover the electricity cost. Enter your unit's oxygen delivery under Advanced.",

    // Load failures (only seen if the calculator cannot start)
    "banner.no_model": "The calculator could not load. Please refresh the page.",
    "banner.no_data": "The calculator could not load. Please refresh the page.",
    "banner.no_leads": "The report request form could not load. Please refresh the page, or message us on WhatsApp.",
};

// Some developer text is not a string key at all: ui.js hard-codes it, or it
// comes from the calculator's data files -- the data-quality labels its
// authors attached to values ("(ASSUMED from IMD coordinates ...)",
// "PMMSY general 40 % (UNTESTED)", "location ASSUMED from the OSM pond ...")
// and raw field names ("missing: fcr, farmgate_price_inr_per_kg").
// yieldCalculator.js runs every text node and tooltip in the calculator,
// map popups included, through this as the calculator draws them.
const STATUS = "(?:ASSUMED|UNTESTED|VERIFIED|NOT_FOUND)";
const TIDY = [
    [/Not estimable — missing: .*/, "Not enough data yet for an estimate."],
    [/^Not enough sourced data to estimate.*/, "Not enough data yet for an estimate."],
    [/ \(data incomplete\)/g, " (not available yet)"],
    // "(... ASSUMED ...)" as a whole parenthetical
    [new RegExp(`\\s*\\([^()]*\\b${STATUS}\\b[^()]*\\)`, "g"), ""],
    // "; location ASSUMED from the OSM pond of that name" as a trailing clause
    [new RegExp(`[;,]\\s*(?:location\\s+)?${STATUS}\\b[^.;]*`, "g"), ""],
];

export function tidyText(text) {
    let out = text;
    for (const [pattern, replacement] of TIDY) out = out.replace(pattern, replacement);
    return out;
}
