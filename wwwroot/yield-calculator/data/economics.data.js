window.OXY_DATA = window.OXY_DATA || {};
window.OXY_DATA.economics = {
 "tariff_presets": [
  {
   "id": "lt4_allied",
   "label": "LT IV - fish culture allied to agriculture (free supply)",
   "inr_per_kwh": 0,
   "fixed_inr_per_kw_per_month": 0,
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "economics_device_evidence.md 2.1: TNERC T.O. 6 of 2024 s3.2.14.1; applicability at licensee discretion (ASSUMED)"
  },
  {
   "id": "lt3a1_low",
   "label": "LT III-A(1) up to 500 units per two months",
   "inr_per_kwh": 4.8,
   "fixed_inr_per_kw_per_month": 75,
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "economics_device_evidence.md 2.1-2.2 (effective 2025-07-01)"
  },
  {
   "id": "lt3a1_high",
   "label": "LT III-A(1) above 500 units per two months (default)",
   "inr_per_kwh": 6.95,
   "fixed_inr_per_kw_per_month": 75,
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "economics_device_evidence.md 2.1-2.2; slab treatment UNTESTED"
  },
  {
   "id": "lt3b",
   "label": "LT III-B above 12 kW",
   "inr_per_kwh": 8.0,
   "fixed_inr_per_kw_per_month": 81,
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "economics_device_evidence.md 2.1"
  }
 ],
 "default_tariff_id": "lt3a1_high",
 "subsidy_options": [
  {
   "label": "None",
   "pct": 0,
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "-"
  },
  {
   "label": "PMMSY general 40 %",
   "pct": 40,
   "status": "UNTESTED",
   "date": "2026-09-21",
   "source": "economics_device_evidence.md 3.1: 40 % on freshwater aquaculture inputs; aerator admissibility NOT_FOUND"
  },
  {
   "label": "PMMSY SC/ST/women 60 %",
   "pct": 60,
   "status": "UNTESTED",
   "date": "2026-09-21",
   "source": "same"
  }
 ],
 "paddlewheel": {
  "sae_field_kg_o2_per_kwh": {
   "value": 1.0,
   "unit": "kg O2 per kWh under field conditions",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "economics_device_evidence.md 4.2: Boyd/Tucker field 1.5-2.5 lb O2/hp-h = 0.9-1.5 kg O2/kWh; Indian tank test 1.02 kg O2/kWh; 1.0 chosen"
  },
  "unit_price_inr_2hp": {
   "value": [
    35000,
    36500
   ],
   "unit": "INR per 2 HP unit",
   "status": "UNTESTED",
   "date": "2026-09-21",
   "source": "economics_device_evidence.md 4.1 (IndiaMART listings, read 2026-09-21)"
  }
 },
 "run_hours_published": {
  "value": [
   8,
   12
  ],
  "unit": "h/day",
  "status": "UNTESTED",
  "date": "2026-09-21",
  "source": "economics_device_evidence.md section 2.3: Behera 2016 (vannamei, W. Bengal) 8-12 h/day; Boyd 2020 shrimp 16 h/day; Sultana et al. 2017 tilapia 9 h/day; no Tamil Nadu-specific figure found"
 },
 "defaults": {
  "maintenance_pct_per_year": {
   "value": 3,
   "unit": "%",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "see products"
  },
  "concentrators_per_unit": {
   "value": 1,
   "unit": "count",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "one PSA concentrator per generator unit; a larger shared concentrator would lower capex per unit"
  }
 }
};
