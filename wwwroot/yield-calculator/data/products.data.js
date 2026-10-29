window.OXY_DATA = window.OXY_DATA || {};
window.OXY_DATA.products = [
 {
  "id": "nbg-1.5hp",
  "label": "Nano Bubble Generator 1.5 HP",
  "url": "https://www.oxyniti.com/product/nano-bubble-generator-1.5-HP",
  "power_hp": 1.5,
  "power_kw_shaft": {
   "value": 1.1185,
   "unit": "kW",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "economics_device_evidence.md section 1.1: HP x 0.7457; electrical input will be higher by 1/motor-efficiency, which is not stated"
  },
  "o2_input_lpm": {
   "value": [
    1,
    2
   ],
   "unit": "L/min",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "owner statement 2026-09-21 ('1-2 lpm for 1.5 hp NBG'); product page says 'up to 2 LPM'",
   "note": "midpoint 1.5 L/min is used by the model"
  },
  "price_inr": {
   "value": 85000,
   "unit": "INR per generator unit, ex-works, GST inclusive",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "rough estimate authorised by the owner: CRI 1 HP stainless multistage pump lists at Rs 12,450 (IndiaMART, Surat, read 2026-09-21), a 1.5 HP MHC-class pump taken as about Rs 20,000; stainless venturi/nozzle, frame, hoses, control panel about Rs 25,000; assembled-product factor about 1.9x on components. Range Rs 60,000-1,10,000. Replace with the real list price."
  },
  "concentrator_required": true,
  "claims": [
   {
    "text": "2x Dissolved oxygen uplift",
    "url": "https://www.oxyniti.com/"
   },
   {
    "text": "+15% Higher survival rate",
    "url": "https://www.oxyniti.com/"
   },
   {
    "text": "-15% Feed conversion ratio",
    "url": "https://www.oxyniti.com/"
   },
   {
    "text": "+30% Stocking density potential",
    "url": "https://www.oxyniti.com/"
   },
   {
    "text": "Figures are typical ranges reported in published nano-bubble aquaculture studies and field trials; results vary with species, pond condition and management.",
    "url": "https://www.oxyniti.com/"
   }
  ],
  "site_published": {
   "o2_input_lpm": {
    "value": 2,
    "unit": "L/min",
    "status": "VERIFIED",
    "date": "2026-09-21",
    "source": "https://www.oxyniti.com/product/nano-bubble-generator-1.5-HP"
   },
   "price_inr": {
    "value": null,
    "unit": "INR",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "https://www.oxyniti.com/product/nano-bubble-generator-1.5-HP",
    "note": "site shows ₹4400 on both products, read as a placeholder"
   }
  },
  "concentrator_kw": {
   "value": 0.69,
   "unit": "kW",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "owner statement 2026-09-21: 230 V, 3 A; 230 x 3 = 690 VA; power factor taken as 1.0 (ASSUMED, conservative for running cost)"
  },
  "concentrator_price_inr": {
   "value": 45000,
   "unit": "INR per 5 L/min-class PSA concentrator",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "rough estimate: 5 L/min medical-grade PSA concentrators retail Rs 35,000-60,000 in India (oxygentimes.com price list, Sep 2026, read 2026-09-21); one concentrator per generator unit ASSUMED"
  },
  "maintenance_pct_per_year": {
   "value": 3,
   "unit": "% of (unit + concentrator) price per year",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "rough estimate: pump seals, filters and PSA sieve replacement; no OEM figure"
  }
 },
 {
  "id": "nbg-4hp",
  "label": "Nano Bubble Generator 4 HP",
  "url": "https://www.oxyniti.com/product/nano-bubble-generator-4-hp",
  "power_hp": 4,
  "power_kw_shaft": {
   "value": 2.9828,
   "unit": "kW",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "economics_device_evidence.md section 1.1: HP x 0.7457; electrical input will be higher by 1/motor-efficiency, which is not stated"
  },
  "o2_input_lpm": {
   "value": [
    3,
    6
   ],
   "unit": "L/min",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "product page says 'up to 6 LPM'; range scaled from the owner's 1-2 L/min for the 1.5 HP unit",
   "note": "midpoint 4.5 L/min is used by the model"
  },
  "price_inr": {
   "value": 160000,
   "unit": "INR per generator unit, ex-works, GST inclusive",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "rough estimate authorised by the owner: 4 HP CRI MHS-16 class pump about Rs 55,000; fittings, frame, panel about Rs 40,000; assembled-product factor about 1.7x. Range Rs 1,20,000-2,20,000. Replace with the real list price."
  },
  "concentrator_required": true,
  "claims": [
   {
    "text": "2x Dissolved oxygen uplift",
    "url": "https://www.oxyniti.com/"
   },
   {
    "text": "+15% Higher survival rate",
    "url": "https://www.oxyniti.com/"
   },
   {
    "text": "-15% Feed conversion ratio",
    "url": "https://www.oxyniti.com/"
   },
   {
    "text": "+30% Stocking density potential",
    "url": "https://www.oxyniti.com/"
   },
   {
    "text": "Figures are typical ranges reported in published nano-bubble aquaculture studies and field trials; results vary with species, pond condition and management.",
    "url": "https://www.oxyniti.com/"
   }
  ],
  "site_published": {
   "o2_input_lpm": {
    "value": 6,
    "unit": "L/min",
    "status": "VERIFIED",
    "date": "2026-09-21",
    "source": "https://www.oxyniti.com/product/nano-bubble-generator-4-hp"
   },
   "price_inr": {
    "value": null,
    "unit": "INR",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "https://www.oxyniti.com/product/nano-bubble-generator-4-hp",
    "note": "site shows ₹4400 on both products, read as a placeholder"
   }
  },
  "concentrator_kw": {
   "value": 1.0,
   "unit": "kW",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "10 L/min-class PSA concentrators draw roughly 0.6-1.0 kW; upper value taken, scaled from the owner's 0.69 kW for the smaller unit"
  },
  "concentrator_price_inr": {
   "value": 90000,
   "unit": "INR per 10 L/min-class PSA concentrator",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "10 L/min oxygen concentrators list at Rs 60,000-1,20,000 (oxygentimes.com, Sep 2026, read 2026-09-21); midpoint taken"
  },
  "maintenance_pct_per_year": {
   "value": 3,
   "unit": "% of (unit + concentrator) price per year",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "as for the 1.5 HP unit"
  }
 }
];
