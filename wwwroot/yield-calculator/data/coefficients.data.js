window.OXY_DATA = window.OXY_DATA || {};
window.OXY_DATA.coefficients = {
 "_meta": {
  "title": "Model coefficients for the Oxyniti yield calculator (MODEL_SPEC.md)",
  "written": "2026-09-21",
  "by": "Fable 5.1 planning pass",
  "rule": "Every value carries status, date and source. ASSUMED values are modelling choices made in MODEL_SPEC.md and must be shown in the UI Assumptions panel. WP1 copies this file verbatim into site/data/coefficients.data.js.",
  "status_values": [
   "VERIFIED",
   "ASSUMED",
   "UNTESTED",
   "NOT_FOUND"
  ]
 },
 "do_saturation": {
  "method": "Benson & Krause 1984 Eq. 32 (mg/L constant), Setschenow salinity term, USGS pressure factor",
  "ln_cstar_coefficients": {
   "value": [
    -139.34411,
    157570.1,
    -66423080,
    12438000000,
    -862194900000
   ],
   "unit": "ln(mg/L) with T in kelvin: ln C* = a0 + a1/T + a2/T^2 + a3/T^3 + a4/T^4",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "research/do_physics.md (a); Benson & Krause 1984, Limnol. Oceanogr. 29(3):620-632, doi:10.4319/lo.1984.29.3.0620"
  },
  "salinity_term": {
   "value": [
    0.017674,
    -10.754,
    2140.7
   ],
   "unit": "ln C*(S) = ln C*(0) - S * (b0 + b1/T + b2/T^2), S in ppt, T in kelvin",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "research/do_physics.md (a)"
  },
  "theta_coefficients": {
   "value": [
    0.000975,
    -1.426e-05,
    6.436e-08
   ],
   "unit": "theta = c0 + c1*t + c2*t^2, t in degC",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "research/do_physics.md (a)"
  },
  "vapour_pressure_coefficients": {
   "value": [
    11.8571,
    -3840.7,
    -216961
   ],
   "unit": "u = exp(d0 + d1/T + d2/T^2) atm, T in kelvin",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "research/do_physics.md (a)"
  },
  "pressure_factor": {
   "value": "Fp = ((P - u) * (1 - theta*P)) / ((1 - u) * (1 - theta)); DO_sat = C*(t,S) * Fp",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "research/do_physics.md (a); verified against Benson & Krause 1984 Table 9 to 0.0001"
  },
  "pressure_from_elevation": {
   "value": "P_atm = exp(-9.80665 * 0.0289644 * z_m / (8.31447 * 288.15))",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "research/do_physics.md (a): standard atmosphere as in LakeMetabolizer; adequate for TN lowlands, matters only for the Nilgiris and Kodaikanal"
  },
  "verification_table_mg_l_1atm": {
   "value": {
    "20": {
     "0": 9.092,
     "15": 8.322,
     "25": 7.846
    },
    "25": {
     "0": 8.263,
     "15": 7.588,
     "25": 7.168
    },
    "28": {
     "0": 7.828,
     "15": 7.201,
     "25": 6.811
    },
    "30": {
     "0": 7.559,
     "15": 6.961,
     "25": 6.589
    },
    "32": {
     "0": 7.305,
     "15": 6.734,
     "25": 6.379
    },
    "35": {
     "0": 6.949,
     "15": 6.416,
     "25": 6.084
    }
   },
   "unit": "mg/L at [degC][ppt], P = 1 atm, rounded to 3 dp; JS must match to 0.0005",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "research/do_physics.md verification table (do_verify.py); Boyd 2001 gives 8.24 at 25 degC"
  }
 },
 "pond_temperature": {
  "a_intercept_c": {
   "value": 2.32,
   "unit": "degC",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "research/tn_climate_seasons.md (d): Bangladesh nursery-pond regression water = 0.922*air + 2.32, r = 0.976 (VERIFIED regression, ASSUMED transferable to TN); PLOS One 2025 says daily mean water is no more than 1 degC above air"
  },
  "b_slope": {
   "value": 0.922,
   "unit": "degC per degC",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "same regression"
  },
  "note": "At T_air = 30 degC the regression gives T_w = 30.0; at 33 degC, 32.7; at 25 degC, 25.4 - within Boyd's 'tracks air within about 1 degC'. TN pond series 26.5-32 degC (tn_climate_seasons.md (e)) are consistent."
 },
 "night_budget": {
  "h_night": {
   "value": 11.5,
   "unit": "h",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "Tamil Nadu dusk (~18:30) to dawn (~06:00); do_physics.md worked example uses 11 h"
  },
  "f_dusk": {
   "value": 1.2,
   "unit": "fraction of saturation at dusk",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "research/do_physics.md (d): Boyd worked example, dusk at 120 % saturation in a green pond"
  },
  "d_diff_mg_l_per_night": {
   "value": 0.5,
   "unit": "mg/L per night, applied only while DO < saturation",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "research/do_physics.md (d): diffusion from air 'seldom exceeds 1 mg/L during a single night' (Boyd); half taken"
  },
  "r_plankton_ref_mg_l_h_at_25c": {
   "value": {
    "light": 0.15,
    "medium": 0.3,
    "dense": 0.45
   },
   "unit": "mg/L/h at 25 degC, by bloom density input",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "research/do_physics.md (d): k_p 0.1-0.5 mg/L/h at 25 degC from Secchi depth / chlorophyll (Boyd); plankton is 75-80 % of night loss (Romaire, Boyd & Collis 1978)"
  },
  "q10_plankton": {
   "value": 2.0,
   "unit": "-",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "generic biological Q10; do_physics.md (d)"
  },
  "k_sed_g_o2_m2_h": {
   "value": 0.15,
   "unit": "g O2/m^2/h; R_sed = k_sed / depth_m",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "research/do_physics.md (d): k_s 0.02-0.4 g O2/m^2/h (Boyd's <1 to 10 mg/L/day band)"
  },
  "q10_sed": {
   "value": 2.0,
   "unit": "-",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "generic biological Q10"
  },
  "t_ref_c": {
   "value": 25,
   "unit": "degC",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "reference temperature for the plankton and sediment terms"
  }
 },
 "respiration_groups": {
  "_form": "R_fish [mg/L/h] = B_kg * q(T_w) / V_L; q(T_w) = q_ref * Q10^((min(T_w, t_cap_c) - t_ref_c)/10), q in mg O2/kg/h",
  "freshwater_fish": {
   "q_ref_mg_o2_kg_h": {
    "value": 300,
    "unit": "mg O2/kg/h at 30 degC, routine fed rate",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "research/do_physics.md (b): tilapia SMR 170-200 mg O2/kg/h at 30-32 degC (Leonard & Skov 2022, interpolated); routine fed rates 1.5-3x SMR (ASSUMED); rohu fry 126-146 mg/kg/h at 30-32 degC (Brahmane 2014)"
   },
   "q10": {
    "value": 1.9,
    "unit": "-",
    "status": "VERIFIED",
    "date": "2026-09-21",
    "source": "tilapia 1.79 (Leonard & Skov 2022), rohu 1.91-2.05 (Brahmane et al. 2014); 1.9 chosen inside the measured band"
   },
   "t_ref_c": {
    "value": 30,
    "unit": "degC",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "do_physics.md (b) model form"
   },
   "t_cap_c": {
    "value": 32,
    "unit": "degC",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "do_physics.md (b): cap the temperature term at the species' upper optimum (tilapia 32 degC)"
   }
  },
  "air_breathing_fish": {
   "q_ref_mg_o2_kg_h": {
    "value": 200,
    "unit": "mg O2/kg/h at 30 degC taken from the water",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "pangasius and murrel take part of their oxygen from air; water-column demand set at two thirds of the freshwater-fish value; no measured TN figure (NOT_FOUND)"
   },
   "q10": {
    "value": 2.0,
    "unit": "-",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "generic; no measured value found"
   },
   "t_ref_c": {
    "value": 30,
    "unit": "degC",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "as above"
   },
   "t_cap_c": {
    "value": 32,
    "unit": "degC",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "as above"
   }
  },
  "shrimp": {
   "q_ref_mg_o2_kg_h": {
    "value": 450,
    "unit": "mg O2/kg/h at 30 degC",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "research/do_physics.md (b): L. vannamei juveniles specific consumption rises 20 -> 30 degC (Bett & Vinatea 2009, coefficients not in abstract); 0.3-0.6 mg O2/g/h typical of juvenile penaeids (ASSUMED)"
   },
   "q10": {
    "value": 2.0,
    "unit": "-",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "do_physics.md (b) verdict: use Q10 = 2 up to 30 degC and hold flat above; no verified vannamei Q10"
   },
   "t_ref_c": {
    "value": 30,
    "unit": "degC",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "as above"
   },
   "t_cap_c": {
    "value": 30,
    "unit": "degC",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "Kir et al. 2023: standard metabolism falls with temperature within 25-30 degC; held flat above 30"
   }
  },
  "brackish_fish": {
   "q_ref_mg_o2_kg_h": {
    "value": 300,
    "unit": "mg O2/kg/h at 30 degC",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "freshwater-fish value reused; no seabass/milkfish/mullet measurement found (NOT_FOUND)"
   },
   "q10": {
    "value": 1.9,
    "unit": "-",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "freshwater-fish value reused"
   },
   "t_ref_c": {
    "value": 30,
    "unit": "degC",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "as above"
   },
   "t_cap_c": {
    "value": 32,
    "unit": "degC",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "as above"
   }
  },
  "crab": {
   "q_ref_mg_o2_kg_h": {
    "value": 150,
    "unit": "mg O2/kg/h at 30 degC",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "mud crab metabolic rate is lower than fish and partly aerial; no measurement found (NOT_FOUND)"
   },
   "q10": {
    "value": 2.0,
    "unit": "-",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "generic"
   },
   "t_ref_c": {
    "value": 30,
    "unit": "degC",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "as above"
   },
   "t_cap_c": {
    "value": 32,
    "unit": "degC",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "as above"
   }
  }
 },
 "species_group_defaults": {
  "_rule": "Used only where the species file is null after WP1 fallback rules; every applied value is labelled ASSUMED with the rule name.",
  "freshwater_fish": {
   "do_min_growth_mg_l": {
    "value": 3.0,
    "unit": "mg/L",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "research/do_physics.md (c): feed intake plateau at 3.0 mg/L for tilapia <100 g, catfish, carp proxy"
   },
   "do_lethal_mg_l": {
    "value": 1.0,
    "unit": "mg/L",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "do_physics.md (c): f = 0 below 1.0 with mortality risk; common carp verified 0.3-0.5 (species file)"
   }
  },
  "air_breathing_fish": {
   "do_min_growth_mg_l": {
    "value": 2.0,
    "unit": "mg/L",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "air-breathers feed at lower DO; growth response to DO weakly evidenced (NOT_FOUND); set below the fish plateau"
   },
   "do_lethal_mg_l": {
    "value": 0.5,
    "unit": "mg/L",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "pangasius survives 0.1 mg/L (species file, FAO); 0.5 taken as the practical floor for growth accounting"
   }
  },
  "shrimp": {
   "do_min_growth_mg_l": {
    "value": 4.0,
    "unit": "mg/L",
    "status": "VERIFIED",
    "date": "2026-09-21",
    "source": "species file: CAA/MPEDA standard 4.0 mg/L for vannamei and monodon"
   },
   "do_lethal_mg_l": {
    "value": 1.5,
    "unit": "mg/L",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "Boyd & Hanson 2010: survival 42 % at minimum DO 2.3 mg/L; floor placed at 1.5"
   }
  },
  "brackish_fish": {
   "do_min_growth_mg_l": {
    "value": 4.0,
    "unit": "mg/L",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "seabass and mullet 4.0 mg/L in the species file; reused for milkfish and pearl spot where null"
   },
   "do_lethal_mg_l": {
    "value": 1.0,
    "unit": "mg/L",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "milkfish verified 0.1-0.4 (species file); 1.0 taken as a conservative floor"
   }
  },
  "crab": {
   "do_min_growth_mg_l": {
    "value": 3.0,
    "unit": "mg/L",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "no measurement found (NOT_FOUND)"
   },
   "do_lethal_mg_l": {
    "value": 1.0,
    "unit": "mg/L",
    "status": "ASSUMED",
    "date": "2026-09-21",
    "source": "no measurement found (NOT_FOUND)"
   }
  }
 },
 "uplift": {
  "growth_max_fraction": {
   "value": 0.12,
   "unit": "fraction of harvest size at full relief",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "MODEL_SPEC.md 5: internal +18 % ceiling decomposed as +12 % growth and +5 points survival at 85 % baseline survival"
  },
  "survival_points_max": {
   "value": 0.05,
   "unit": "absolute survival fraction at full relief",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "as above"
  },
  "fcr_gain_max_fraction": {
   "value": 0.07,
   "unit": "fraction reduction of FCR at full relief (advanced toggle, default off)",
   "status": "UNTESTED",
   "date": "2026-09-21",
   "source": "Mauladani et al. 2020: FCR 1.4 -> 1.3 (n = 1 pond per arm); economics_device_evidence.md 7.1"
  },
  "ceiling_extra_kg_fraction": {
   "value": 0.18,
   "unit": "fraction",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "NBG/.claude/SALES_OVERRIDE.md claims ceiling; docs/make_charts.py"
  },
  "low_case_factor": {
   "value": 0.5,
   "unit": "multiplier on the three coefficients for the low case",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "MODEL_SPEC.md 5"
  },
  "survival_cap": {
   "value": 0.98,
   "unit": "fraction",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "MODEL_SPEC.md 5"
  }
 },
 "oxygen_supply": {
  "rho_o2_g_per_l": {
   "value": 1.31,
   "unit": "g/L, oxygen gas at 25 degC and 1 atm",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "ideal gas: 32 g/mol / 24.47 L/mol; ASSUMED to be the concentrator's rating condition"
  },
  "purity": {
   "value": 0.9,
   "unit": "fraction O2 in the concentrator output",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "typical PSA concentrator 90-93 %; OEM figure NOT_FOUND"
  },
  "eta_dissolved": {
   "value": 0.85,
   "unit": "fraction of injected oxygen that dissolves and stays",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "nano-bubbles (<200 nm) do not rise and burst; OEM transfer efficiency NOT_FOUND (economics_device_evidence.md 1)"
  },
  "hp_to_kw": {
   "value": 0.7457,
   "unit": "kW per HP",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "definition"
  },
  "worked_check": {
   "value": "1.5 HP, 2 L/min, 8 h -> 2*60*8*1.31*0.90*0.85 = 961 g O2/night; 1 acre x 1.5 m = 6.070e6 L -> 0.158 mg/L per unit per night",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "MODEL_SPEC.md 4.5"
  }
 },
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
 "sizing": {
  "n_units_cap": {
   "value": 20,
   "unit": "units",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "MODEL_SPEC.md 7"
  }
 },
 "thermal": {
  "tolerable_fallback_margin_c": {
   "value": 5,
   "unit": "degC beyond the optimum bound when the tolerable bound is null",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 1"
  },
  "size_factor_clamp": {
   "value": [
    0.5,
    1.1
   ],
   "unit": "-",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "MODEL_SPEC.md 3"
  }
 },
 "seed_size_g": {
  "fish_fingerling": {
   "value": 5,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8; typical 3-8 g fingerlings"
  },
  "shrimp_pl": {
   "value": 0.01,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "PL10-PL15 post-larvae"
  },
  "scampi_pl": {
   "value": 0.05,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "post-larvae"
  },
  "crab_fattening_stock": {
   "value": 100,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "water crabs stocked for fattening"
  }
 },
 "economics": {
  "days_per_month": {
   "value": 30.4,
   "unit": "days",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "365/12"
  },
  "lakh": {
   "value": 100000,
   "unit": "INR",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "definition"
  },
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
  ]
 }
};
