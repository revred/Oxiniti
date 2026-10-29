window.OXY_DATA = window.OXY_DATA || {};
window.OXY_DATA.species = [
 {
  "id": "catla",
  "common_name_en": "Catla",
  "common_name_ta": {
   "value": "கட்லா மீன்",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "WIKI_TA",
   "source_url": "https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=ta&titles=Catla|Rohu|Mrigal%20carp|Common%20carp|Grass%20carp|Silver%20carp|Channa%20striata|Green%20chromide|Barramundi|Milkfish|Flathead%20grey%20mullet"
  },
  "scientific_name": "Catla catla (syn. Labeo catla / Gibelion catla)",
  "water_type": "freshwater",
  "salinity_ppt": {
   "value": 0,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "freshwater species (water_type: \"freshwater\")"
  },
  "temp_optimum_c": {
   "value": [
    25,
    32
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_CATLA",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/aquaculture/I1129m/file/en/en_catla.htm"
  },
  "temp_tolerable_c": {
   "value": [
    14,
    37
   ],
   "unit": "C",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "FAO_CATLA",
   "note": "FAO: does not thrive below ~14 C; upper limit not published.",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 1: high bound = temp_optimum_c.high + 5 = 37",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/aquaculture/I1129m/file/en/en_catla.htm"
  },
  "do_minimum_mg_l": {
   "value": 4.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "BOYD",
   "note": "Sourced range [3.0, 4.0] mg/L; high bound used as the growth threshold, low bound is a tolerance figure (MODEL_SPEC.md section 7 amendment A1). No carp-specific threshold found. Boyd (2010, channel catfish ponds): growth declined below ~50% saturation (~4 mg/L at 26 C); fish ate and grew better where daily minima stayed above 3-3.5 mg/L. Applied to Indian major carps by analogy.",
   "fallback_rule": "do_min_high_bound",
   "source_url": "https://www.globalseafood.org/advocate/dissolved-oxygen-concentrations-pond-aquaculture/"
  },
  "do_lethal_mg_l": {
   "value": 1.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.freshwater_fish.do_lethal_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 2: group default (do_lethal_mg_l NOT_FOUND)"
  },
  "stocking_density_per_acre": {
   "value": [
    1619,
    4047
   ],
   "unit": "fingerlings/acre",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_CATLA",
   "note": "FAO grow-out polyculture 4,000-10,000 fingerlings/ha (all carps combined). TN: TNAU/NABARD composite 5,000/ha (2,023/acre); TN Dept of Fisheries 2024-25 scale of finance assumes 10,000/ha (4,047/acre); Thanjavur survey 2010 mean 4,670 +/- 2,573/ha, floating-pellet farms 6,929/ha stocking 50-100 g seed; Thanjavur 1992-93 mean 4,172/ha.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/aquaculture/I1129m/file/en/en_catla.htm"
  },
  "density_default_per_acre": {
   "value": 1541.9,
   "unit": "fingerlings/acre",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from yield_kg_per_acre_per_crop, survival_pct and harvest_size_g (MODEL_SPEC.md section 7 amendment A3)",
   "fallback_rule": "yield_consistent_density",
   "note": "published per year, divided by crops-per-year midpoint 1.5; Sourced stocking_density_per_acre [1619, 4047] fingerlings/acre would imply 1,983 kg/acre/crop via survival_mid x harvest_mid, against a sourced yield of [1214, 2024] kg/acre/yr (whole polyculture); density_default_per_acre anchors to the sourced yield instead of compounding three independent range midpoints (MODEL_SPEC.md section 7 amendment A3)."
  },
  "seed_size_g": {
   "value": 5.0,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "fish fingerlings (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    6,
    12
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "6 months for stunted 50-100 g seed to >500 g (Thanjavur floating-pellet farms, FAO 2013); TNAU/NABARD composite culture 10-12 months; FAO 12-18 months to 1-1.5 kg. TN ponds are perennial July-March.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "harvest_size_g": {
   "value": [
    500,
    1250
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_COMP",
   "note": "TNAU composite: 750 g-1.25 kg at 1 year; FAO first-year gain 1-1.2 kg; Thanjavur pellet farms harvest >500 g (400-600 g) at ~6 months from stunted seed.",
   "source_url": "https://agritech.tnau.ac.in/farm_enterprises/Farm%20enterprises_composite%20fish%20culture.html"
  },
  "survival_pct": {
   "value": 80,
   "unit": "%",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_INT",
   "note": "NABARD 2015 model assumption for 200-250 g stunted fingerlings (6,250/ha). Farm-survey grow-out survival for TN NOT_FOUND. FAO gives nursery 30-50% and fingerling 60-70% only.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/4.Intensive_fish_culture_15.pdf"
  },
  "fcr": {
   "value": [
    1.11,
    1.96
   ],
   "unit": "kg feed/kg gain",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "Thanjavur 2010 survey: floating pellet 1.11:1, mash + sinking pellet 1.26:1, conventional rice-bran/oil-cake mash 1.96:1 (natural food included). Conventional mash elsewhere in India 3:1-4:1.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "farmgate_price_inr_per_kg": {
   "value": [
    200,
    250
   ],
   "unit": "INR/kg",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "DTNEXT_PRICE",
   "as_of": "2026-04-25",
   "market_level": "unspecified (farmer quote)",
   "note": "Nagapattinam aqua farmer, 25 Apr 2026: rohu/catla/mrigal normally Rs 200-250/kg, expected Rs 350-400/kg during the 2026 shortage; article does not state whether farm-gate or market. National wholesale (commoditymarketlive, Jun 2025): rohu monthly avg Rs 196.83, catla Rs 214.03/kg. Thanjavur 2010 farm price US$1.37-1.56/kg.",
   "source_url": "https://www.dtnext.in/news/chennai/pricey-freshwater-fish-fail-to-compensate-for-seafood-demand"
  },
  "price_default_inr_per_kg": {
   "value": 200,
   "unit": "INR/kg",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from farmgate_price_inr_per_kg (EXECUTION_PLAN WP1 fallback 6)",
   "label": "₹200/kg, 2026-04-25, unspecified (farmer quote)",
   "rule": "low end of sourced range (retail/wholesale/unstated market level)"
  },
  "seed_cost_inr_per_unit": {
   "value": 3.0,
   "unit": "INR/fingerling",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "SLBC",
   "as_of": "2024-25",
   "note": "Derived: TN scale of finance 2024-25 budgets seed Rs 30,000 for 10,000 fingerlings/ha = Rs 3.0 each. NABARD 2015: Rs 10-15 for 200-250 g stunted yearlings.",
   "source_url": "https://www.slbctn.com/uploads/SoF/Inland%20Fisheries%202024-25.pdf"
  },
  "feed_cost_inr_per_kg": {
   "value": [
    40,
    70
   ],
   "unit": "INR/kg (floating pellet)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "PERFECT",
   "as_of": "2025-10-09",
   "note": "Vendor blog (Oct 2025) 'floating feed Rs 40 to 70 per kg'; no institutional 2025-26 quote found. Thanjavur 2010: floating pellet US$0.44-0.50/kg, sinking US$0.33-0.39, farm mash US$0.27.",
   "source_url": "https://www.perfectaquafeeds.com/post/fish-feed-prices-in-india-2025-a-comprehensive-comparison-and-buying-guide"
  },
  "other_cost_inr_per_acre_crop": {
   "value": 25241.8,
   "unit": "INR/acre/crop",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/4.Intensive_fish_culture_15.pdf",
   "note": "NABARD/TNAU 2015 intensive carp (catla+rohu, 6-month, 2 crops/yr) model: opex 2,88,075 - feed 1,63,200 - seed 62,500 - electricity 0 = 62,375/ha/crop (lime/SSP/urea/poultry litter 9,375 + watch&ward 21,000 + harvesting 7,000 + misc 15,000 + drying 10,000). Same model used for rohu/mrigal/common-carp because their survival_pct already cites this model (NABARD_INT) and all four carps are stocked together in one polyculture pond."
  },
  "crops_per_year_tn": {
   "value": [
    1,
    2
   ],
   "unit": "crops/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "One crop conventionally; floating-pellet farmers stocking stunted seed 'can raise two crops per year' (harvests 'generally twice').",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "stocking_month_tn_default": {
   "value": 7,
   "unit": "month (1-12)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "parsed as the first month named in stocking_months_tn (\"july\")",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "respiration_group": "freshwater_fish",
  "estimable": true,
  "missing": [],
  "notes": "Surface zooplankton feeder. Thanjavur 1992-93 stocking share 29 per 100; Chinese carps least preferred in TN. Consumer-preferred size 1-2 kg (FAO).",
  "culture_system": "earthen pond, semi-intensive carp polyculture (Indian major carps +/- Chinese carps) with manuring and supplementary feed; TN farmers mostly stock the three IMC only",
  "temp_growth_stops_below_c": {
   "value": 14,
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_CATLA",
   "note": "Interpretation of FAO 'does not thrive at temperatures below 14 C'.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/aquaculture/I1129m/file/en/en_catla.htm"
  },
  "do_preferred_mg_l": {
   "value": 5.0,
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "IMCREV",
   "note": "'Dissolved oxygen ... should ideally be about 5 mg/L' (IMC review 2024). Kerala PoP 2021 hatchery/spawning: 5-6 ppm.",
   "source_url": "https://www.fisheriesjournal.com/archives/2024/vol12issue1/PartA/11-6-20-676.pdf"
  },
  "yield_kg_per_acre_per_crop": {
   "value": [
    1214,
    2024
   ],
   "unit": "kg/acre/yr (whole polyculture)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_CATLA",
   "note": "FAO polyculture 3-5 t/ha/yr; TNAU composite 3-5 t/ha/yr (7-10 t/ha/yr possible); Thanjavur 2010 survey 3,010 (conventional) to 4,596 (floating pellet) kg/ha/yr = 1,218-1,860 kg/acre/yr; NABARD intensive catla+rohu 5 t/ha/crop, 2 crops; Thanjavur 1992-93 mean only 888 kg/ha/crop (359 kg/acre). Species share depends on stocking ratio.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/aquaculture/I1129m/file/en/en_catla.htm"
  },
  "feed_share_of_variable_cost_pct": {
   "value": [
    50,
    75
   ],
   "unit": "% of variable cost",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "Thanjavur 2010 survey: feed = 75.0% of variable cost overall (US$2,864.6 of 3,819.1/ha/yr); floating pellet 63.1%, conventional 65.4%. TN scale of finance 2024-25: feed Rs 2.5 lakh of Rs 5.01 lakh working capital/ha = 49.9%. FAO: feed 'over 50 percent of total input cost'.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "stocking_months_tn": {
   "value": "July-August (stocking after pond preparation completed by July/August; ponds perennial July-March)",
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "Thanjavur district survey 2010. Carp seed availability is tied to monsoon breeding; TN off-season breeding makes fingerlings available by March-April (search-level claim, not read).",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "aeration_common": {
   "value": "no (unaerated semi-intensive ponds; pumping for water exchange budgeted, aerators not standard)",
   "unit": "yes/no",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "SLBC",
   "note": "No survey statement on aerator use in TN carp ponds was found; TN scale of finance includes an electricity line (Rs 30,000/ha) for pumping. IMC review notes paddlewheel aerators suit 1-1.5 m ponds when intensified.",
   "source_url": "https://www.slbctn.com/uploads/SoF/Inland%20Fisheries%202024-25.pdf"
  }
 },
 {
  "id": "rohu",
  "common_name_en": "Rohu",
  "common_name_ta": {
   "value": "ரோகு மீன்",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "WIKI_TA",
   "source_url": "https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=ta&titles=Catla|Rohu|Mrigal%20carp|Common%20carp|Grass%20carp|Silver%20carp|Channa%20striata|Green%20chromide|Barramundi|Milkfish|Flathead%20grey%20mullet"
  },
  "scientific_name": "Labeo rohita",
  "water_type": "freshwater",
  "salinity_ppt": {
   "value": 0,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "freshwater species (water_type: \"freshwater\")"
  },
  "temp_optimum_c": {
   "value": [
    22,
    31
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_ROHU",
   "note": "FAO gives 22-31 C as the optimal (spawning) range; a separate grow-out optimum is not published.",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-roho-labeo"
  },
  "temp_tolerable_c": {
   "value": [
    14,
    36
   ],
   "unit": "C",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "FAO_ROHU",
   "note": "FAO: 'does not thrive at temperatures below 14 C'; upper limit not published.",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 1: high bound = temp_optimum_c.high + 5 = 36",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-roho-labeo"
  },
  "do_minimum_mg_l": {
   "value": 4.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "BOYD",
   "note": "Sourced range [3.0, 4.0] mg/L; high bound used as the growth threshold, low bound is a tolerance figure (MODEL_SPEC.md section 7 amendment A1). No carp-specific threshold found. Boyd (2010, channel catfish ponds): growth declined below ~50% saturation (~4 mg/L at 26 C); fish ate and grew better where daily minima stayed above 3-3.5 mg/L. Applied to Indian major carps by analogy.",
   "fallback_rule": "do_min_high_bound",
   "source_url": "https://www.globalseafood.org/advocate/dissolved-oxygen-concentrations-pond-aquaculture/"
  },
  "do_lethal_mg_l": {
   "value": 1.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.freshwater_fish.do_lethal_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 2: group default (do_lethal_mg_l NOT_FOUND)"
  },
  "stocking_density_per_acre": {
   "value": [
    1619,
    4047
   ],
   "unit": "fingerlings/acre",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_CATLA",
   "note": "FAO grow-out polyculture 4,000-10,000 fingerlings/ha (all carps combined). TN: TNAU/NABARD composite 5,000/ha (2,023/acre); TN Dept of Fisheries 2024-25 scale of finance assumes 10,000/ha (4,047/acre); Thanjavur survey 2010 mean 4,670 +/- 2,573/ha, floating-pellet farms 6,929/ha stocking 50-100 g seed; Thanjavur 1992-93 mean 4,172/ha.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/aquaculture/I1129m/file/en/en_catla.htm"
  },
  "density_default_per_acre": {
   "value": 1349.2,
   "unit": "fingerlings/acre",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from yield_kg_per_acre_per_crop, survival_pct and harvest_size_g (MODEL_SPEC.md section 7 amendment A3)",
   "fallback_rule": "yield_consistent_density",
   "note": "published per year, divided by crops-per-year midpoint 1.5; Sourced stocking_density_per_acre [1619, 4047] fingerlings/acre would imply 2,266 kg/acre/crop via survival_mid x harvest_mid, against a sourced yield of [1214, 2024] kg/acre/yr (whole polyculture); density_default_per_acre anchors to the sourced yield instead of compounding three independent range midpoints (MODEL_SPEC.md section 7 amendment A3)."
  },
  "seed_size_g": {
   "value": 5.0,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "fish fingerlings (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    6,
    12
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "6 months for stunted 50-100 g seed to >500 g (Thanjavur floating-pellet farms, FAO 2013); TNAU/NABARD composite culture 10-12 months; FAO 12-18 months to 1-1.5 kg. TN ponds are perennial July-March.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "harvest_size_g": {
   "value": [
    500,
    1500
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_ROHU",
   "note": "FAO 700-800 g in one year, 1-1.5 kg in 12-18 months; Thanjavur pellet farms >500 g at ~6 months from 50-100 g stunted seed.",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-roho-labeo"
  },
  "survival_pct": {
   "value": 80,
   "unit": "%",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_INT",
   "note": "NABARD 2015 model assumption for 200-250 g stunted fingerlings (6,250/ha). Farm-survey grow-out survival for TN NOT_FOUND. FAO gives nursery 30-50% and fingerling 60-70% only.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/4.Intensive_fish_culture_15.pdf"
  },
  "fcr": {
   "value": [
    1.11,
    1.96
   ],
   "unit": "kg feed/kg gain",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "Thanjavur 2010 survey: floating pellet 1.11:1, mash + sinking pellet 1.26:1, conventional rice-bran/oil-cake mash 1.96:1 (natural food included). Conventional mash elsewhere in India 3:1-4:1.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "farmgate_price_inr_per_kg": {
   "value": [
    200,
    250
   ],
   "unit": "INR/kg",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "DTNEXT_PRICE",
   "as_of": "2026-04-25",
   "market_level": "unspecified (farmer quote)",
   "note": "Nagapattinam aqua farmer, 25 Apr 2026: rohu/catla/mrigal normally Rs 200-250/kg, expected Rs 350-400/kg during the 2026 shortage; article does not state whether farm-gate or market. National wholesale (commoditymarketlive, Jun 2025): rohu monthly avg Rs 196.83, catla Rs 214.03/kg. Thanjavur 2010 farm price US$1.37-1.56/kg.",
   "source_url": "https://www.dtnext.in/news/chennai/pricey-freshwater-fish-fail-to-compensate-for-seafood-demand"
  },
  "price_default_inr_per_kg": {
   "value": 200,
   "unit": "INR/kg",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from farmgate_price_inr_per_kg (EXECUTION_PLAN WP1 fallback 6)",
   "label": "₹200/kg, 2026-04-25, unspecified (farmer quote)",
   "rule": "low end of sourced range (retail/wholesale/unstated market level)"
  },
  "seed_cost_inr_per_unit": {
   "value": 3.0,
   "unit": "INR/fingerling",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "SLBC",
   "as_of": "2024-25",
   "note": "Derived: TN scale of finance 2024-25 budgets seed Rs 30,000 for 10,000 fingerlings/ha = Rs 3.0 each. NABARD 2015: Rs 10-15 for 200-250 g stunted yearlings.",
   "source_url": "https://www.slbctn.com/uploads/SoF/Inland%20Fisheries%202024-25.pdf"
  },
  "feed_cost_inr_per_kg": {
   "value": [
    40,
    70
   ],
   "unit": "INR/kg (floating pellet)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "PERFECT",
   "as_of": "2025-10-09",
   "note": "Vendor blog (Oct 2025) 'floating feed Rs 40 to 70 per kg'; no institutional 2025-26 quote found. Thanjavur 2010: floating pellet US$0.44-0.50/kg, sinking US$0.33-0.39, farm mash US$0.27.",
   "source_url": "https://www.perfectaquafeeds.com/post/fish-feed-prices-in-india-2025-a-comprehensive-comparison-and-buying-guide"
  },
  "other_cost_inr_per_acre_crop": {
   "value": 25241.8,
   "unit": "INR/acre/crop",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/4.Intensive_fish_culture_15.pdf",
   "note": "NABARD/TNAU 2015 intensive carp (catla+rohu, 6-month, 2 crops/yr) model: opex 2,88,075 - feed 1,63,200 - seed 62,500 - electricity 0 = 62,375/ha/crop (lime/SSP/urea/poultry litter 9,375 + watch&ward 21,000 + harvesting 7,000 + misc 15,000 + drying 10,000). Same model used for rohu/mrigal/common-carp because their survival_pct already cites this model (NABARD_INT) and all four carps are stocked together in one polyculture pond."
  },
  "crops_per_year_tn": {
   "value": [
    1,
    2
   ],
   "unit": "crops/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "One crop conventionally; floating-pellet farmers stocking stunted seed 'can raise two crops per year' (harvests 'generally twice').",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "stocking_month_tn_default": {
   "value": 7,
   "unit": "month (1-12)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "parsed as the first month named in stocking_months_tn (\"july\")",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "respiration_group": "freshwater_fish",
  "estimable": true,
  "missing": [],
  "notes": "Column omnivore; highest market demand; ~60% of stock in Thanjavur pellet-fed ponds (FAO 2013), 25 per 100 in 1992-93. Jayanti rohu (CIFA selected line) is promoted by TN Fisheries (see improved-strains row). FAO producer price <US$1/kg (2010).",
  "culture_system": "earthen pond, semi-intensive carp polyculture (Indian major carps +/- Chinese carps) with manuring and supplementary feed; TN farmers mostly stock the three IMC only",
  "temp_growth_stops_below_c": {
   "value": 14,
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_ROHU",
   "note": "Interpretation of FAO 'does not thrive below 14 C'.",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-roho-labeo"
  },
  "do_preferred_mg_l": {
   "value": 5.0,
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "IMCREV",
   "note": "'Dissolved oxygen ... should ideally be about 5 mg/L' (IMC review 2024). Kerala PoP 2021 hatchery/spawning: 5-6 ppm.",
   "source_url": "https://www.fisheriesjournal.com/archives/2024/vol12issue1/PartA/11-6-20-676.pdf"
  },
  "yield_kg_per_acre_per_crop": {
   "value": [
    1214,
    2024
   ],
   "unit": "kg/acre/yr (whole polyculture)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_ROHU",
   "note": "FAO: 1-2 t/ha/yr extensive, 3-5 t/ha/yr scientific polyculture, 6-8 t/ha two-species (Kolleru); TN survey 3,010-4,596 kg/ha/yr (1,218-1,860 kg/acre/yr).",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-roho-labeo"
  },
  "feed_share_of_variable_cost_pct": {
   "value": [
    50,
    75
   ],
   "unit": "% of variable cost",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "Thanjavur 2010 survey: feed = 75.0% of variable cost overall (US$2,864.6 of 3,819.1/ha/yr); floating pellet 63.1%, conventional 65.4%. TN scale of finance 2024-25: feed Rs 2.5 lakh of Rs 5.01 lakh working capital/ha = 49.9%. FAO: feed 'over 50 percent of total input cost'.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "stocking_months_tn": {
   "value": "July-August (stocking after pond preparation completed by July/August; ponds perennial July-March)",
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "Thanjavur district survey 2010. Carp seed availability is tied to monsoon breeding; TN off-season breeding makes fingerlings available by March-April (search-level claim, not read).",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "aeration_common": {
   "value": "no (unaerated semi-intensive ponds; pumping for water exchange budgeted, aerators not standard)",
   "unit": "yes/no",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "SLBC",
   "note": "No survey statement on aerator use in TN carp ponds was found; TN scale of finance includes an electricity line (Rs 30,000/ha) for pumping. IMC review notes paddlewheel aerators suit 1-1.5 m ponds when intensified.",
   "source_url": "https://www.slbctn.com/uploads/SoF/Inland%20Fisheries%202024-25.pdf"
  }
 },
 {
  "id": "mrigal",
  "common_name_en": "Mrigal",
  "common_name_ta": {
   "value": "மிர்கல் மீன்",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "WIKI_TA",
   "source_url": "https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=ta&titles=Catla|Rohu|Mrigal%20carp|Common%20carp|Grass%20carp|Silver%20carp|Channa%20striata|Green%20chromide|Barramundi|Milkfish|Flathead%20grey%20mullet"
  },
  "scientific_name": "Cirrhinus mrigala (Cirrhinus cirrhosus)",
  "water_type": "freshwater",
  "salinity_ppt": {
   "value": 0,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "freshwater species (water_type: \"freshwater\")"
  },
  "temp_optimum_c": {
   "value": [
    24,
    31
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_MRIGAL",
   "note": "FAO breeding range 24-31 C; grow-out optimum not published.",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-mrigal-carp"
  },
  "temp_tolerable_c": {
   "value": [
    14,
    36
   ],
   "unit": "C",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "FAO_MRIGAL",
   "note": "Minimum tolerance ~14 C; upper limit not published.",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 1: high bound = temp_optimum_c.high + 5 = 36",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-mrigal-carp"
  },
  "do_minimum_mg_l": {
   "value": 4.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "BOYD",
   "note": "Sourced range [3.0, 4.0] mg/L; high bound used as the growth threshold, low bound is a tolerance figure (MODEL_SPEC.md section 7 amendment A1). No carp-specific threshold found. Boyd (2010, channel catfish ponds): growth declined below ~50% saturation (~4 mg/L at 26 C); fish ate and grew better where daily minima stayed above 3-3.5 mg/L. Applied to Indian major carps by analogy.",
   "fallback_rule": "do_min_high_bound",
   "source_url": "https://www.globalseafood.org/advocate/dissolved-oxygen-concentrations-pond-aquaculture/"
  },
  "do_lethal_mg_l": {
   "value": 1.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.freshwater_fish.do_lethal_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 2: group default (do_lethal_mg_l NOT_FOUND)"
  },
  "stocking_density_per_acre": {
   "value": [
    1619,
    4047
   ],
   "unit": "fingerlings/acre",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_CATLA",
   "note": "FAO grow-out polyculture 4,000-10,000 fingerlings/ha (all carps combined). TN: TNAU/NABARD composite 5,000/ha (2,023/acre); TN Dept of Fisheries 2024-25 scale of finance assumes 10,000/ha (4,047/acre); Thanjavur survey 2010 mean 4,670 +/- 2,573/ha, floating-pellet farms 6,929/ha stocking 50-100 g seed; Thanjavur 1992-93 mean 4,172/ha.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/aquaculture/I1129m/file/en/en_catla.htm"
  },
  "density_default_per_acre": {
   "value": 2075.6,
   "unit": "fingerlings/acre",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from yield_kg_per_acre_per_crop, survival_pct and harvest_size_g (MODEL_SPEC.md section 7 amendment A3)",
   "fallback_rule": "yield_consistent_density",
   "note": "published per year, divided by crops-per-year midpoint 1.5; Sourced stocking_density_per_acre [1619, 4047] fingerlings/acre would imply 1,473 kg/acre/crop via survival_mid x harvest_mid, against a sourced yield of [1214, 2024] kg/acre/yr (whole polyculture); density_default_per_acre anchors to the sourced yield instead of compounding three independent range midpoints (MODEL_SPEC.md section 7 amendment A3)."
  },
  "seed_size_g": {
   "value": 5.0,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "fish fingerlings (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    6,
    12
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "6 months for stunted 50-100 g seed to >500 g (Thanjavur floating-pellet farms, FAO 2013); TNAU/NABARD composite culture 10-12 months; FAO 12-18 months to 1-1.5 kg. TN ponds are perennial July-March.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "harvest_size_g": {
   "value": [
    600,
    700
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_MRIGAL",
   "note": "First-year weight gain 600-700 g (FAO).",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-mrigal-carp"
  },
  "survival_pct": {
   "value": 80,
   "unit": "%",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_INT",
   "note": "NABARD 2015 model assumption for 200-250 g stunted fingerlings (6,250/ha). Farm-survey grow-out survival for TN NOT_FOUND. FAO gives nursery 30-50% and fingerling 60-70% only.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/4.Intensive_fish_culture_15.pdf"
  },
  "fcr": {
   "value": [
    1.11,
    1.96
   ],
   "unit": "kg feed/kg gain",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "Thanjavur 2010 survey: floating pellet 1.11:1, mash + sinking pellet 1.26:1, conventional rice-bran/oil-cake mash 1.96:1 (natural food included). Conventional mash elsewhere in India 3:1-4:1.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "farmgate_price_inr_per_kg": {
   "value": [
    200,
    250
   ],
   "unit": "INR/kg",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "DTNEXT_PRICE",
   "as_of": "2026-04-25",
   "market_level": "unspecified (farmer quote)",
   "note": "Quoted jointly with rohu and catla (Nagapattinam, Apr 2026: normal Rs 200-250, shortage Rs 350-400). FAO: mrigal sells 10-20% below rohu/catla.",
   "source_url": "https://www.dtnext.in/news/chennai/pricey-freshwater-fish-fail-to-compensate-for-seafood-demand"
  },
  "price_default_inr_per_kg": {
   "value": 200,
   "unit": "INR/kg",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from farmgate_price_inr_per_kg (EXECUTION_PLAN WP1 fallback 6)",
   "label": "₹200/kg, 2026-04-25, unspecified (farmer quote)",
   "rule": "low end of sourced range (retail/wholesale/unstated market level)"
  },
  "seed_cost_inr_per_unit": {
   "value": 3.0,
   "unit": "INR/fingerling",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "SLBC",
   "as_of": "2024-25",
   "note": "Derived: TN scale of finance 2024-25 budgets seed Rs 30,000 for 10,000 fingerlings/ha = Rs 3.0 each. NABARD 2015: Rs 10-15 for 200-250 g stunted yearlings.",
   "source_url": "https://www.slbctn.com/uploads/SoF/Inland%20Fisheries%202024-25.pdf"
  },
  "feed_cost_inr_per_kg": {
   "value": [
    40,
    70
   ],
   "unit": "INR/kg (floating pellet)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "PERFECT",
   "as_of": "2025-10-09",
   "note": "Vendor blog (Oct 2025) 'floating feed Rs 40 to 70 per kg'; no institutional 2025-26 quote found. Thanjavur 2010: floating pellet US$0.44-0.50/kg, sinking US$0.33-0.39, farm mash US$0.27.",
   "source_url": "https://www.perfectaquafeeds.com/post/fish-feed-prices-in-india-2025-a-comprehensive-comparison-and-buying-guide"
  },
  "other_cost_inr_per_acre_crop": {
   "value": 25241.8,
   "unit": "INR/acre/crop",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/4.Intensive_fish_culture_15.pdf",
   "note": "NABARD/TNAU 2015 intensive carp (catla+rohu, 6-month, 2 crops/yr) model: opex 2,88,075 - feed 1,63,200 - seed 62,500 - electricity 0 = 62,375/ha/crop (lime/SSP/urea/poultry litter 9,375 + watch&ward 21,000 + harvesting 7,000 + misc 15,000 + drying 10,000). Same model used for rohu/mrigal/common-carp because their survival_pct already cites this model (NABARD_INT) and all four carps are stocked together in one polyculture pond."
  },
  "crops_per_year_tn": {
   "value": [
    1,
    2
   ],
   "unit": "crops/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "One crop conventionally; floating-pellet farmers stocking stunted seed 'can raise two crops per year' (harvests 'generally twice').",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "stocking_month_tn_default": {
   "value": 7,
   "unit": "month (1-12)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "parsed as the first month named in stocking_months_tn (\"july\")",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "respiration_group": "freshwater_fish",
  "estimable": true,
  "missing": [],
  "notes": "Bottom detritivore; 20-25% of polyculture output (FAO); 21 per 100 stocked in Thanjavur 1992-93. Fetches 10-20% less than rohu/catla (FAO).",
  "culture_system": "earthen pond, semi-intensive carp polyculture (Indian major carps +/- Chinese carps) with manuring and supplementary feed; TN farmers mostly stock the three IMC only",
  "temp_growth_stops_below_c": {
   "value": 14,
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_MRIGAL",
   "note": "Interpretation of FAO minimum tolerance 14 C.",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-mrigal-carp"
  },
  "do_preferred_mg_l": {
   "value": 5.0,
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "IMCREV",
   "note": "'Dissolved oxygen ... should ideally be about 5 mg/L' (IMC review 2024). Kerala PoP 2021 hatchery/spawning: 5-6 ppm.",
   "source_url": "https://www.fisheriesjournal.com/archives/2024/vol12issue1/PartA/11-6-20-676.pdf"
  },
  "yield_kg_per_acre_per_crop": {
   "value": [
    1214,
    2024
   ],
   "unit": "kg/acre/yr (whole polyculture)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_CATLA",
   "note": "FAO polyculture 3-5 t/ha/yr; TNAU composite 3-5 t/ha/yr (7-10 t/ha/yr possible); Thanjavur 2010 survey 3,010 (conventional) to 4,596 (floating pellet) kg/ha/yr = 1,218-1,860 kg/acre/yr; NABARD intensive catla+rohu 5 t/ha/crop, 2 crops; Thanjavur 1992-93 mean only 888 kg/ha/crop (359 kg/acre). Species share depends on stocking ratio.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/aquaculture/I1129m/file/en/en_catla.htm"
  },
  "feed_share_of_variable_cost_pct": {
   "value": [
    50,
    75
   ],
   "unit": "% of variable cost",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "Thanjavur 2010 survey: feed = 75.0% of variable cost overall (US$2,864.6 of 3,819.1/ha/yr); floating pellet 63.1%, conventional 65.4%. TN scale of finance 2024-25: feed Rs 2.5 lakh of Rs 5.01 lakh working capital/ha = 49.9%. FAO: feed 'over 50 percent of total input cost'.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "stocking_months_tn": {
   "value": "July-August (stocking after pond preparation completed by July/August; ponds perennial July-March)",
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "Thanjavur district survey 2010. Carp seed availability is tied to monsoon breeding; TN off-season breeding makes fingerlings available by March-April (search-level claim, not read).",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "aeration_common": {
   "value": "no (unaerated semi-intensive ponds; pumping for water exchange budgeted, aerators not standard)",
   "unit": "yes/no",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "SLBC",
   "note": "No survey statement on aerator use in TN carp ponds was found; TN scale of finance includes an electricity line (Rs 30,000/ha) for pumping. IMC review notes paddlewheel aerators suit 1-1.5 m ponds when intensified.",
   "source_url": "https://www.slbctn.com/uploads/SoF/Inland%20Fisheries%202024-25.pdf"
  }
 },
 {
  "id": "common-carp",
  "common_name_en": "Common carp",
  "common_name_ta": {
   "value": "சாதாக்கெண்டை மீன்",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "WIKI_TA",
   "source_url": "https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=ta&titles=Catla|Rohu|Mrigal%20carp|Common%20carp|Grass%20carp|Silver%20carp|Channa%20striata|Green%20chromide|Barramundi|Milkfish|Flathead%20grey%20mullet"
  },
  "scientific_name": "Cyprinus carpio",
  "water_type": "freshwater",
  "salinity_ppt": {
   "value": 0,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "freshwater species (water_type: \"freshwater\")"
  },
  "temp_optimum_c": {
   "value": [
    23,
    30
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_CC",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-common-carp"
  },
  "temp_tolerable_c": {
   "value": [
    18,
    35
   ],
   "unit": "C",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from temp_optimum_c +/- 5 C (EXECUTION_PLAN WP1 fallback 1)",
   "fallback_rule": "temp_tolerable_c NOT_FOUND; both bounds = temp_optimum_c +/- 5 C"
  },
  "do_minimum_mg_l": {
   "value": 4.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "BOYD",
   "note": "Sourced range [3.0, 4.0] mg/L; high bound used as the growth threshold, low bound is a tolerance figure (MODEL_SPEC.md section 7 amendment A1). Warmwater-fish analogy (Boyd 2010); species-specific growth threshold not found.",
   "fallback_rule": "do_min_high_bound",
   "source_url": "https://www.globalseafood.org/advocate/dissolved-oxygen-concentrations-pond-aquaculture/"
  },
  "do_lethal_mg_l": {
   "value": [
    0.3,
    0.5
   ],
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_CC",
   "note": "FAO: 'can survive in 0.3-0.5 mg/litre' - survival floor, i.e. lethal only below this.",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-common-carp"
  },
  "stocking_density_per_acre": {
   "value": [
    1619,
    2428
   ],
   "unit": "fish/acre",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_CC",
   "note": "FAO 4,000-6,000/ha for two-summer-old production (up to 20,000/ha with pellets). In TN it is a minor component of the IMC polyculture (see catla row for total densities).",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-common-carp"
  },
  "density_default_per_acre": {
   "value": null,
   "unit": "fish/acre",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "species not estimable or yield_kg_per_acre_per_crop NOT_FOUND (MODEL_SPEC.md section 7 amendment A3 applies to estimable species only)"
  },
  "seed_size_g": {
   "value": 5.0,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "fish fingerlings (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    6,
    12
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "6 months for stunted 50-100 g seed to >500 g (Thanjavur floating-pellet farms, FAO 2013); TNAU/NABARD composite culture 10-12 months; FAO 12-18 months to 1-1.5 kg. TN ponds are perennial July-March.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "harvest_size_g": {
   "value": [
    600,
    1000
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_CC",
   "note": "'0.6 to 1.0 kg body weight' in a single season in sub-tropical/tropical conditions.",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-common-carp"
  },
  "survival_pct": {
   "value": 80,
   "unit": "%",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_INT",
   "note": "NABARD 2015 model assumption for 200-250 g stunted fingerlings (6,250/ha). Farm-survey grow-out survival for TN NOT_FOUND. FAO gives nursery 30-50% and fingerling 60-70% only.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/4.Intensive_fish_culture_15.pdf"
  },
  "fcr": {
   "value": null,
   "unit": "kg feed/kg gain",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "FAO sheet gives feeding rate (3-5% BW/day) but no FCR."
  },
  "farmgate_price_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "No Tamil Nadu or South India quote for common carp found; FAO global average producer price US$0.92/kg (2002)."
  },
  "price_default_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "label": "no sourced price for this species"
  },
  "seed_cost_inr_per_unit": {
   "value": 3.0,
   "unit": "INR/fingerling",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "SLBC",
   "as_of": "2024-25",
   "note": "Derived: TN scale of finance 2024-25 budgets seed Rs 30,000 for 10,000 fingerlings/ha = Rs 3.0 each. NABARD 2015: Rs 10-15 for 200-250 g stunted yearlings.",
   "source_url": "https://www.slbctn.com/uploads/SoF/Inland%20Fisheries%202024-25.pdf"
  },
  "feed_cost_inr_per_kg": {
   "value": [
    40,
    70
   ],
   "unit": "INR/kg (floating pellet)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "PERFECT",
   "as_of": "2025-10-09",
   "note": "Vendor blog (Oct 2025) 'floating feed Rs 40 to 70 per kg'; no institutional 2025-26 quote found. Thanjavur 2010: floating pellet US$0.44-0.50/kg, sinking US$0.33-0.39, farm mash US$0.27.",
   "source_url": "https://www.perfectaquafeeds.com/post/fish-feed-prices-in-india-2025-a-comprehensive-comparison-and-buying-guide"
  },
  "other_cost_inr_per_acre_crop": {
   "value": 25241.8,
   "unit": "INR/acre/crop",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/4.Intensive_fish_culture_15.pdf",
   "note": "NABARD/TNAU 2015 intensive carp (catla+rohu, 6-month, 2 crops/yr) model: opex 2,88,075 - feed 1,63,200 - seed 62,500 - electricity 0 = 62,375/ha/crop (lime/SSP/urea/poultry litter 9,375 + watch&ward 21,000 + harvesting 7,000 + misc 15,000 + drying 10,000). Same model used for rohu/mrigal/common-carp because their survival_pct already cites this model (NABARD_INT) and all four carps are stocked together in one polyculture pond."
  },
  "crops_per_year_tn": {
   "value": [
    1,
    2
   ],
   "unit": "crops/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "One crop conventionally; floating-pellet farmers stocking stunted seed 'can raise two crops per year' (harvests 'generally twice').",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "stocking_month_tn_default": {
   "value": 7,
   "unit": "month (1-12)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "parsed as the first month named in stocking_months_tn (\"july\")",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "respiration_group": "freshwater_fish",
  "estimable": false,
  "missing": [
   "fcr",
   "farmgate_price_inr_per_kg"
  ],
  "notes": "Bottom omnivore; 14 per 100 stocked in Thanjavur 1992-93; listed among species cultured in the Cauvery delta (DT Next 2025). TN-specific price NOT_FOUND.",
  "culture_system": "earthen pond, semi-intensive carp polyculture (Indian major carps +/- Chinese carps) with manuring and supplementary feed; TN farmers mostly stock the three IMC only",
  "temp_growth_stops_below_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "do_preferred_mg_l": {
   "value": 5.0,
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "IMCREV",
   "note": "'Dissolved oxygen ... should ideally be about 5 mg/L' (IMC review 2024). Kerala PoP 2021 hatchery/spawning: 5-6 ppm.",
   "source_url": "https://www.fisheriesjournal.com/archives/2024/vol12issue1/PartA/11-6-20-676.pdf"
  },
  "yield_kg_per_acre_per_crop": {
   "value": [
    1214,
    2024
   ],
   "unit": "kg/acre/yr (whole polyculture)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_CATLA",
   "note": "FAO polyculture 3-5 t/ha/yr; TNAU composite 3-5 t/ha/yr (7-10 t/ha/yr possible); Thanjavur 2010 survey 3,010 (conventional) to 4,596 (floating pellet) kg/ha/yr = 1,218-1,860 kg/acre/yr; NABARD intensive catla+rohu 5 t/ha/crop, 2 crops; Thanjavur 1992-93 mean only 888 kg/ha/crop (359 kg/acre). Species share depends on stocking ratio.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/aquaculture/I1129m/file/en/en_catla.htm"
  },
  "feed_share_of_variable_cost_pct": {
   "value": [
    50,
    75
   ],
   "unit": "% of variable cost",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "Thanjavur 2010 survey: feed = 75.0% of variable cost overall (US$2,864.6 of 3,819.1/ha/yr); floating pellet 63.1%, conventional 65.4%. TN scale of finance 2024-25: feed Rs 2.5 lakh of Rs 5.01 lakh working capital/ha = 49.9%. FAO: feed 'over 50 percent of total input cost'.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "stocking_months_tn": {
   "value": "July-August (stocking after pond preparation completed by July/August; ponds perennial July-March)",
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "Thanjavur district survey 2010. Carp seed availability is tied to monsoon breeding; TN off-season breeding makes fingerlings available by March-April (search-level claim, not read).",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "aeration_common": {
   "value": "no (unaerated semi-intensive ponds; pumping for water exchange budgeted, aerators not standard)",
   "unit": "yes/no",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "SLBC",
   "note": "No survey statement on aerator use in TN carp ponds was found; TN scale of finance includes an electricity line (Rs 30,000/ha) for pumping. IMC review notes paddlewheel aerators suit 1-1.5 m ponds when intensified.",
   "source_url": "https://www.slbctn.com/uploads/SoF/Inland%20Fisheries%202024-25.pdf"
  }
 },
 {
  "id": "grass-carp",
  "common_name_en": "Grass carp",
  "common_name_ta": {
   "value": "புல் கெண்டை மீன்",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "WIKI_TA",
   "source_url": "https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=ta&titles=Catla|Rohu|Mrigal%20carp|Common%20carp|Grass%20carp|Silver%20carp|Channa%20striata|Green%20chromide|Barramundi|Milkfish|Flathead%20grey%20mullet"
  },
  "scientific_name": "Ctenopharyngodon idella (C. idellus)",
  "water_type": "freshwater",
  "salinity_ppt": {
   "value": 0,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "freshwater species (water_type: \"freshwater\")"
  },
  "temp_optimum_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "temp_tolerable_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "do_minimum_mg_l": {
   "value": 4.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "BOYD",
   "note": "Sourced range [3.0, 4.0] mg/L; high bound used as the growth threshold, low bound is a tolerance figure (MODEL_SPEC.md section 7 amendment A1). Warmwater-fish analogy (Boyd 2010).",
   "fallback_rule": "do_min_high_bound",
   "source_url": "https://www.globalseafood.org/advocate/dissolved-oxygen-concentrations-pond-aquaculture/"
  },
  "do_lethal_mg_l": {
   "value": 1.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.freshwater_fish.do_lethal_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 2: group default (do_lethal_mg_l NOT_FOUND)"
  },
  "stocking_density_per_acre": {
   "value": [
    304,
    1214
   ],
   "unit": "fish/acre",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_GC",
   "note": "FAO grow-out polyculture 750-3,000/ha.",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-grass-carp"
  },
  "density_default_per_acre": {
   "value": null,
   "unit": "fish/acre",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "species not estimable or yield_kg_per_acre_per_crop NOT_FOUND (MODEL_SPEC.md section 7 amendment A3 applies to estimable species only)"
  },
  "seed_size_g": {
   "value": 5.0,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "fish fingerlings (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    6,
    12
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "6 months for stunted 50-100 g seed to >500 g (Thanjavur floating-pellet farms, FAO 2013); TNAU/NABARD composite culture 10-12 months; FAO 12-18 months to 1-1.5 kg. TN ponds are perennial July-March.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "harvest_size_g": {
   "value": [
    1000,
    1500
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_GC",
   "note": "Marketed at 1-1.5 kg from ponds (Vietnam); grow-out target >1.5 kg.",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-grass-carp"
  },
  "survival_pct": {
   "value": null,
   "unit": "%",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "FAO gives nursery (70-90%) and fingerling (>95%) survival only."
  },
  "fcr": {
   "value": [
    2.0,
    null
   ],
   "unit": "kg feed/kg gain",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_GC",
   "note": "'FCR is high (usually >2:1)' on formulated feed; grass-fed FCR far higher.",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-grass-carp"
  },
  "farmgate_price_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "No TN or South India quote found; FAO retail US$0.7-1.0/kg, production cost US$0.50/kg (2010)."
  },
  "price_default_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "label": "no sourced price for this species"
  },
  "seed_cost_inr_per_unit": {
   "value": 3.0,
   "unit": "INR/fingerling",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "SLBC",
   "as_of": "2024-25",
   "note": "Derived: TN scale of finance 2024-25 budgets seed Rs 30,000 for 10,000 fingerlings/ha = Rs 3.0 each. NABARD 2015: Rs 10-15 for 200-250 g stunted yearlings.",
   "source_url": "https://www.slbctn.com/uploads/SoF/Inland%20Fisheries%202024-25.pdf"
  },
  "feed_cost_inr_per_kg": {
   "value": [
    40,
    70
   ],
   "unit": "INR/kg (floating pellet)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "PERFECT",
   "as_of": "2025-10-09",
   "note": "Vendor blog (Oct 2025) 'floating feed Rs 40 to 70 per kg'; no institutional 2025-26 quote found. Thanjavur 2010: floating pellet US$0.44-0.50/kg, sinking US$0.33-0.39, farm mash US$0.27.",
   "source_url": "https://www.perfectaquafeeds.com/post/fish-feed-prices-in-india-2025-a-comprehensive-comparison-and-buying-guide"
  },
  "other_cost_inr_per_acre_crop": {
   "value": null,
   "unit": "INR/acre/crop",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "no NABARD/TNAU 2015 model project found for this species"
  },
  "crops_per_year_tn": {
   "value": [
    1,
    2
   ],
   "unit": "crops/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "One crop conventionally; floating-pellet farmers stocking stunted seed 'can raise two crops per year' (harvests 'generally twice').",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "stocking_month_tn_default": {
   "value": 7,
   "unit": "month (1-12)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "parsed as the first month named in stocking_months_tn (\"july\")",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "respiration_group": "freshwater_fish",
  "estimable": false,
  "missing": [
   "temp_optimum_c",
   "survival_pct",
   "farmgate_price_inr_per_kg"
  ],
  "notes": "Macrophyte feeder; 4 per 100 stocked in Thanjavur 1992-93; DT Next (Aug 2025) reports Chinese carp reaching 2 kg/yr in delta ponds. Temperature, DO and TN price not found.",
  "culture_system": "earthen pond, semi-intensive carp polyculture (Indian major carps +/- Chinese carps) with manuring and supplementary feed; TN farmers mostly stock the three IMC only",
  "temp_growth_stops_below_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "do_preferred_mg_l": {
   "value": 5.0,
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "IMCREV",
   "note": "'Dissolved oxygen ... should ideally be about 5 mg/L' (IMC review 2024). Kerala PoP 2021 hatchery/spawning: 5-6 ppm.",
   "source_url": "https://www.fisheriesjournal.com/archives/2024/vol12issue1/PartA/11-6-20-676.pdf"
  },
  "yield_kg_per_acre_per_crop": {
   "value": [
    405,
    1214
   ],
   "unit": "kg/acre/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_GC",
   "note": "Pond yield 1,000-3,000 kg/ha where grass carp is the main species.",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-grass-carp"
  },
  "feed_share_of_variable_cost_pct": {
   "value": [
    50,
    75
   ],
   "unit": "% of variable cost",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "Thanjavur 2010 survey: feed = 75.0% of variable cost overall (US$2,864.6 of 3,819.1/ha/yr); floating pellet 63.1%, conventional 65.4%. TN scale of finance 2024-25: feed Rs 2.5 lakh of Rs 5.01 lakh working capital/ha = 49.9%. FAO: feed 'over 50 percent of total input cost'.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "stocking_months_tn": {
   "value": "July-August (stocking after pond preparation completed by July/August; ponds perennial July-March)",
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "Thanjavur district survey 2010. Carp seed availability is tied to monsoon breeding; TN off-season breeding makes fingerlings available by March-April (search-level claim, not read).",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "aeration_common": {
   "value": "no (unaerated semi-intensive ponds; pumping for water exchange budgeted, aerators not standard)",
   "unit": "yes/no",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "SLBC",
   "note": "No survey statement on aerator use in TN carp ponds was found; TN scale of finance includes an electricity line (Rs 30,000/ha) for pumping. IMC review notes paddlewheel aerators suit 1-1.5 m ponds when intensified.",
   "source_url": "https://www.slbctn.com/uploads/SoF/Inland%20Fisheries%202024-25.pdf"
  }
 },
 {
  "id": "silver-carp",
  "common_name_en": "Silver carp",
  "common_name_ta": {
   "value": "வெள்ளிக்கெண்டை மீன்",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "WIKI_TA",
   "source_url": "https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=ta&titles=Catla|Rohu|Mrigal%20carp|Common%20carp|Grass%20carp|Silver%20carp|Channa%20striata|Green%20chromide|Barramundi|Milkfish|Flathead%20grey%20mullet"
  },
  "scientific_name": "Hypophthalmichthys molitrix",
  "water_type": "freshwater",
  "salinity_ppt": {
   "value": 0,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "freshwater species (water_type: \"freshwater\")"
  },
  "temp_optimum_c": {
   "value": [
    22,
    28
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_SC",
   "note": "FAO optimal 22-28 C (spawning/hatching context); embryonic abnormalities below 17 C or above 31 C.",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-silver-carp"
  },
  "temp_tolerable_c": {
   "value": [
    17,
    33
   ],
   "unit": "C",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from temp_optimum_c +/- 5 C (EXECUTION_PLAN WP1 fallback 1)",
   "fallback_rule": "temp_tolerable_c NOT_FOUND; both bounds = temp_optimum_c +/- 5 C"
  },
  "do_minimum_mg_l": {
   "value": 4.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "BOYD",
   "note": "Sourced range [3.0, 4.0] mg/L; high bound used as the growth threshold, low bound is a tolerance figure (MODEL_SPEC.md section 7 amendment A1). Warmwater-fish analogy (Boyd 2010).",
   "fallback_rule": "do_min_high_bound",
   "source_url": "https://www.globalseafood.org/advocate/dissolved-oxygen-concentrations-pond-aquaculture/"
  },
  "do_lethal_mg_l": {
   "value": 1.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.freshwater_fish.do_lethal_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 2: group default (do_lethal_mg_l NOT_FOUND)"
  },
  "stocking_density_per_acre": {
   "value": null,
   "unit": "fish/acre",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "FAO gives nursery/broodstock densities only; TN share of polyculture 7 per 100."
  },
  "density_default_per_acre": {
   "value": null,
   "unit": "fish/acre",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "species not estimable or yield_kg_per_acre_per_crop NOT_FOUND (MODEL_SPEC.md section 7 amendment A3 applies to estimable species only)"
  },
  "seed_size_g": {
   "value": 5.0,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "fish fingerlings (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    6,
    12
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "6 months for stunted 50-100 g seed to >500 g (Thanjavur floating-pellet farms, FAO 2013); TNAU/NABARD composite culture 10-12 months; FAO 12-18 months to 1-1.5 kg. TN ponds are perennial July-March.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "harvest_size_g": {
   "value": null,
   "unit": "g",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "survival_pct": {
   "value": null,
   "unit": "%",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "fcr": {
   "value": null,
   "unit": "kg feed/kg gain",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Filter feeder; no FCR published."
  },
  "farmgate_price_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "No TN quote found; TN farmers report it 'fetched a low price' (Thanjavur 1992-93). China farm price US$0.5/kg (2010)."
  },
  "price_default_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "label": "no sourced price for this species"
  },
  "seed_cost_inr_per_unit": {
   "value": 3.0,
   "unit": "INR/fingerling",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "SLBC",
   "as_of": "2024-25",
   "note": "Derived: TN scale of finance 2024-25 budgets seed Rs 30,000 for 10,000 fingerlings/ha = Rs 3.0 each. NABARD 2015: Rs 10-15 for 200-250 g stunted yearlings.",
   "source_url": "https://www.slbctn.com/uploads/SoF/Inland%20Fisheries%202024-25.pdf"
  },
  "feed_cost_inr_per_kg": {
   "value": [
    40,
    70
   ],
   "unit": "INR/kg (floating pellet)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "PERFECT",
   "as_of": "2025-10-09",
   "note": "Vendor blog (Oct 2025) 'floating feed Rs 40 to 70 per kg'; no institutional 2025-26 quote found. Thanjavur 2010: floating pellet US$0.44-0.50/kg, sinking US$0.33-0.39, farm mash US$0.27.",
   "source_url": "https://www.perfectaquafeeds.com/post/fish-feed-prices-in-india-2025-a-comprehensive-comparison-and-buying-guide"
  },
  "other_cost_inr_per_acre_crop": {
   "value": null,
   "unit": "INR/acre/crop",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "no NABARD/TNAU 2015 model project found for this species"
  },
  "crops_per_year_tn": {
   "value": [
    1,
    2
   ],
   "unit": "crops/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "One crop conventionally; floating-pellet farmers stocking stunted seed 'can raise two crops per year' (harvests 'generally twice').",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "stocking_month_tn_default": {
   "value": 7,
   "unit": "month (1-12)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "parsed as the first month named in stocking_months_tn (\"july\")",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "respiration_group": "freshwater_fish",
  "estimable": false,
  "missing": [
   "stocking_density_per_acre",
   "harvest_size_g",
   "survival_pct",
   "fcr",
   "farmgate_price_inr_per_kg"
  ],
  "notes": "Phytoplankton filter feeder. Least preferred in TN: only 7 per 100 stocked (vs 20-30% recommended) because of low consumer price and handling mortality (Thanjavur 1992-93; FAO 2013).",
  "culture_system": "earthen pond, semi-intensive carp polyculture (Indian major carps +/- Chinese carps) with manuring and supplementary feed; TN farmers mostly stock the three IMC only",
  "temp_growth_stops_below_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "do_preferred_mg_l": {
   "value": 5.0,
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "IMCREV",
   "note": "'Dissolved oxygen ... should ideally be about 5 mg/L' (IMC review 2024). Kerala PoP 2021 hatchery/spawning: 5-6 ppm.",
   "source_url": "https://www.fisheriesjournal.com/archives/2024/vol12issue1/PartA/11-6-20-676.pdf"
  },
  "yield_kg_per_acre_per_crop": {
   "value": null,
   "unit": "kg/acre/crop",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Not published separately; part of polyculture yield (see catla row)."
  },
  "feed_share_of_variable_cost_pct": {
   "value": [
    50,
    75
   ],
   "unit": "% of variable cost",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "Thanjavur 2010 survey: feed = 75.0% of variable cost overall (US$2,864.6 of 3,819.1/ha/yr); floating pellet 63.1%, conventional 65.4%. TN scale of finance 2024-25: feed Rs 2.5 lakh of Rs 5.01 lakh working capital/ha = 49.9%. FAO: feed 'over 50 percent of total input cost'.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "stocking_months_tn": {
   "value": "July-August (stocking after pond preparation completed by July/August; ponds perennial July-March)",
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TN",
   "note": "Thanjavur district survey 2010. Carp seed availability is tied to monsoon breeding; TN off-season breeding makes fingerlings available by March-April (search-level claim, not read).",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/T583/root/16.pdf"
  },
  "aeration_common": {
   "value": "no (unaerated semi-intensive ponds; pumping for water exchange budgeted, aerators not standard)",
   "unit": "yes/no",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "SLBC",
   "note": "No survey statement on aerator use in TN carp ponds was found; TN scale of finance includes an electricity line (Rs 30,000/ha) for pumping. IMC review notes paddlewheel aerators suit 1-1.5 m ponds when intensified.",
   "source_url": "https://www.slbctn.com/uploads/SoF/Inland%20Fisheries%202024-25.pdf"
  }
 },
 {
  "id": "gift-tilapia",
  "common_name_en": "GIFT tilapia (all-male Nile tilapia)",
  "common_name_ta": {
   "value": "திலாப்பியா / சிலேபி மீன்",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "TAWIKI_LIST",
   "note": "No Tamil Wikipedia langlink for Nile tilapia; name taken from the Tamil Wikipedia species list via summariser. Retail lists use 'Jalebi meen'.",
   "source_url": "https://ta.wikipedia.org/wiki/%E0%AE%AE%E0%AF%80%E0%AE%A9%E0%AF%8D_%E0%AE%B5%E0%AE%95%E0%AF%88%E0%AE%95%E0%AE%B3%E0%AF%8D_%E0%AE%AA%E0%AE%9F%E0%AF%8D%E0%AE%9F%E0%AE%BF%E0%AE%AF%E0%AE%B2%E0%AF%8D"
  },
  "scientific_name": "Oreochromis niloticus (GIFT strain)",
  "water_type": "freshwater",
  "salinity_ppt": {
   "value": 0,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "freshwater species (water_type: \"freshwater\")"
  },
  "temp_optimum_c": {
   "value": [
    24,
    30
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "KERALA",
   "note": "Kerala PoP 2021 grow-out table 24-30 C. Conflict: FAO 'preferred temperature ranges from 31 to 36 C'; juvenile trial best growth at 30 C of 26/28/30 (PMC 2024).",
   "source_url": "https://fisheries.kerala.gov.in/sites/default/files/2021-02/Aquaculture%20Practices_compressed.pdf"
  },
  "temp_tolerable_c": {
   "value": [
    11,
    42
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TIL",
   "note": "FAO: lower and upper lethal temperatures 11-12 C and 42 C; spawning begins at 24 C.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/aquaculture/I1129m/file/en/en_niletilapia.htm"
  },
  "do_minimum_mg_l": {
   "value": 3.0,
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TRANDUY",
   "note": "Sourced range [0.8, 3.0] mg/L; high bound used as the growth threshold, low bound is a tolerance figure (MODEL_SPEC.md section 7 amendment A1). Incipient DO below which feed intake and growth decline is reported at <0.8 to 3 mg/L; Tran-Duy 2008 measured lower intake at ~3.0 vs ~5.5 mg/L. Use 3 mg/L as the practical feeding threshold.",
   "fallback_rule": "do_min_high_bound",
   "source_url": "https://www.ecowin.org/pdf/documents/Tran-Duy%202008%20tilapia%20DO%20consumption.pdf"
  },
  "do_lethal_mg_l": {
   "value": 1.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.freshwater_fish.do_lethal_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 2: group default (do_lethal_mg_l NOT_FOUND)"
  },
  "stocking_density_per_acre": {
   "value": [
    12141,
    20235
   ],
   "unit": "fingerlings/acre",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_GIFT",
   "note": "NABARD 2015: 3-5 nos/m2 after one-month hapa nursery (economics use 25,000 seed/ha). FAO ponds: 1-3 fish/m2 (4,047-12,141/acre). Odisha farms: 6,000/acre (Fish Site 2022).",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/6.GIFT_Tilapia_culture_15.pdf"
  },
  "density_default_per_acre": {
   "value": 5965.0,
   "unit": "fingerlings/acre",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from yield_kg_per_acre_per_crop, survival_pct and harvest_size_g (MODEL_SPEC.md section 7 amendment A3)",
   "fallback_rule": "yield_consistent_density",
   "note": "Sourced stocking_density_per_acre [12141, 20235] fingerlings/acre would imply 8,786 kg/acre/crop via survival_mid x harvest_mid, against a sourced yield of [2428, 4047] kg/acre/crop; density_default_per_acre anchors to the sourced yield instead of compounding three independent range midpoints (MODEL_SPEC.md section 7 amendment A3)."
  },
  "seed_size_g": {
   "value": 5.0,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "fish fingerlings (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    5,
    8
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_GIFT",
   "note": "NABARD 5-6 months to 500 g; Kerala PoP 5-6 months; FAO 5-8 months; TN scale of finance assumes a 5-month cycle.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/6.GIFT_Tilapia_culture_15.pdf"
  },
  "harvest_size_g": {
   "value": [
    400,
    900
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_TIL",
   "note": "FAO 400-500 g; NABARD 500 g; MPEDA 600-900 g in 6 months; Odisha farms 700-800 g.",
   "source_url": "https://www.fao.org/fishery/docs/CDrom/aquaculture/I1129m/file/en/en_niletilapia.htm"
  },
  "survival_pct": {
   "value": [
    75,
    92
   ],
   "unit": "%",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_GIFT",
   "note": "NABARD model 75%; Odisha farms 90-92% (Fish Site 2022); Kerala PoP 90%.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/6.GIFT_Tilapia_culture_15.pdf"
  },
  "fcr": {
   "value": [
    1.17,
    1.5
   ],
   "unit": "kg feed/kg gain",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_GIFT",
   "note": "NABARD 'FCR 1.25 to 1.5'; Odisha farm 1.17.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/6.GIFT_Tilapia_culture_15.pdf"
  },
  "farmgate_price_inr_per_kg": {
   "value": [
    110,
    200
   ],
   "unit": "INR/kg",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "GOLDEN",
   "as_of": "2026-09-21",
   "market_level": "mixed (see note)",
   "note": "Low: Odisha farm-gate Rs 110/kg (Fish Site, Jun 2022; retail Rs 160-170). High: 'Tamil Nadu fish price today' tilapia Rs 200/kg (21 Sep 2026, market level not stated). National wholesale monthly avg Rs 158.5/kg (Jun 2025). NABARD 2015 model Rs 75/kg. No TN farm-gate quote found.",
   "source_url": "https://rates.goldenchennai.com/fish-price/tamil-nadu-fish-price-today/"
  },
  "price_default_inr_per_kg": {
   "value": 110,
   "unit": "INR/kg",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from farmgate_price_inr_per_kg (EXECUTION_PLAN WP1 fallback 6)",
   "label": "₹110/kg, 2026-09-21, mixed (see note)",
   "rule": "low end of sourced range (retail/wholesale/unstated market level)"
  },
  "seed_cost_inr_per_unit": {
   "value": [
    2.5,
    6.0
   ],
   "unit": "INR/fingerling",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "RGCA",
   "as_of": "2025-04-15",
   "note": "MPEDA-RGCA list Apr 2025: GIFT all-male 1.5-2.5 cm Rs 2.50; 2.0-3.0 cm Rs 4-6. TN scale of finance budgets Rs 2 lakh/ha for GIFT seed (density not stated). NABARD 2015: Rs 3.",
   "source_url": "https://rgca.co.in/assets/docs/sead_availability/2025/seed_availability_22_apr_2025.pdf"
  },
  "feed_cost_inr_per_kg": {
   "value": [
    40,
    70
   ],
   "unit": "INR/kg (floating pellet)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "PERFECT",
   "as_of": "2025-10-09",
   "note": "Vendor blog Oct 2025; NABARD 2015 used Rs 28/kg.",
   "source_url": "https://www.perfectaquafeeds.com/post/fish-feed-prices-in-india-2025-a-comprehensive-comparison-and-buying-guide"
  },
  "other_cost_inr_per_acre_crop": {
   "value": 24179.52,
   "unit": "INR/acre/crop",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/6.GIFT_Tilapia_culture_15.pdf",
   "note": "NABARD/TNAU 2015 GIFT tilapia model: opex 5,02,250 - feed 3,67,500 - seed 75,000 - electricity 0 = 59,750/ha/crop."
  },
  "crops_per_year_tn": {
   "value": [
    2,
    3
   ],
   "unit": "crops/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_GIFT",
   "note": "NABARD economics use 2 crops/yr; 'three crops are possible in perennial ponds'. TN scale of finance period 5 months.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/6.GIFT_Tilapia_culture_15.pdf"
  },
  "stocking_month_tn_default": {
   "value": 7,
   "unit": "month (1-12)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": null,
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 5: freshwater default (sourced carp pattern); stocking_months_tn NOT_FOUND"
  },
  "respiration_group": "freshwater_fish",
  "estimable": true,
  "missing": [],
  "notes": "TN Fisheries promotes GIFT (Policy Note 2020-21) and runs GIFT hatchery expansion (Manjalar). Tolerates 12-15 ppt salinity (NABARD). Live-fish sales fetch premiums.",
  "culture_system": "earthen pond monosex culture on floating pellets, semi-intensive to intensive; only all-male/hybrid tilapia permitted in India under the 2011 responsible-farming guidelines (licence via State Fisheries Dept)",
  "temp_growth_stops_below_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Secondary summaries cite no feeding/growth below ~15-16 C; not confirmed on a page read for this table."
  },
  "do_preferred_mg_l": {
   "value": [
    5.0,
    null
   ],
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "KERALA",
   "note": "Kerala PoP grow-out: DO >5 ppm.",
   "source_url": "https://fisheries.kerala.gov.in/sites/default/files/2021-02/Aquaculture%20Practices_compressed.pdf"
  },
  "yield_kg_per_acre_per_crop": {
   "value": [
    2428,
    4047
   ],
   "unit": "kg/acre/crop",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_GIFT",
   "note": "NABARD 8-10 t/ha per 6-month crop (economics 9,375 kg/ha); FAO 6-8 t/ha/crop, up to 10. Odisha farms ~2-3 t/acre/yr.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/6.GIFT_Tilapia_culture_15.pdf"
  },
  "feed_share_of_variable_cost_pct": {
   "value": [
    43,
    73
   ],
   "unit": "% of variable cost",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "SLBC",
   "note": "Derived: TN scale of finance 2024-25 GIFT per ha feed Rs 3,22,300 of Rs 7,43,300 = 43.4%; NABARD 2015 model Rs 3,67,500 of Rs 5,02,250 = 73.2%.",
   "source_url": "https://www.slbctn.com/uploads/SoF/Inland%20Fisheries%202024-25.pdf"
  },
  "stocking_months_tn": {
   "value": null,
   "unit": "months",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "No TN season found; hatchery seed (RGCA) available year-round; Krishnagiri farm-pond scheme stocks GIFT because ponds hold water only ~4 months."
  },
  "aeration_common": {
   "value": "yes in intensive ponds (>3/m2) - paddlewheel; not standard in extensive farm ponds",
   "unit": "yes/no",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "NABARD_GIFT",
   "note": "NABARD model lists a 5 HP pump but no aerator; MPEDA/vendors report paddlewheels on tilapia farms.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/6.GIFT_Tilapia_culture_15.pdf"
  }
 },
 {
  "id": "pangasius",
  "common_name_en": "Pangasius (striped catfish / sutchi)",
  "common_name_ta": {
   "value": "பங்காஸ்",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "TAWIKI_LIST",
   "note": "No Tamil Wikipedia langlink; name from Tamil Wikipedia species list via summariser.",
   "source_url": "https://ta.wikipedia.org/wiki/%E0%AE%AE%E0%AF%80%E0%AE%A9%E0%AF%8D_%E0%AE%B5%E0%AE%95%E0%AF%88%E0%AE%95%E0%AE%B3%E0%AF%8D_%E0%AE%AA%E0%AE%9F%E0%AF%8D%E0%AE%9F%E0%AE%BF%E0%AE%AF%E0%AE%B2%E0%AF%8D"
  },
  "scientific_name": "Pangasianodon hypophthalmus (Pangasius sutchi)",
  "water_type": "freshwater (tolerates <2 ppt; used in abandoned shrimp ponds)",
  "salinity_ppt": {
   "value": 0,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "freshwater species (water_type: \"freshwater (tolerates <2 ppt; used in abandoned shrimp ponds)\")"
  },
  "temp_optimum_c": {
   "value": [
    25,
    30
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_PANG",
   "note": "NABARD 2015 water-quality target 25-30 C. Conflict: FAO sheet gives 22-26 C (Mekong context).",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/3.Pangassius_culture_15.pdf"
  },
  "temp_tolerable_c": {
   "value": [
    20,
    35
   ],
   "unit": "C",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from temp_optimum_c +/- 5 C (EXECUTION_PLAN WP1 fallback 1)",
   "fallback_rule": "temp_tolerable_c NOT_FOUND; both bounds = temp_optimum_c +/- 5 C"
  },
  "do_minimum_mg_l": {
   "value": 2.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.air_breathing_fish.do_min_growth_mg_l",
   "fallback_rule": "air-breather: survival floor reclassified (EXECUTION_PLAN WP1 fallback 3)"
  },
  "do_lethal_mg_l": {
   "value": 0.1,
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_PANG",
   "fallback_rule": "air-breather: survival floor reclassified (EXECUTION_PLAN WP1 fallback 3)",
   "note": "moved from do_minimum_mg_l (Facultative air-breather: NABARD target DO 0.1 mg/l; FAO 'as low as 0.05 to 0.10 mg/litre'. Growth-suppression threshold not published.)",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/3.Pangassius_culture_15.pdf"
  },
  "stocking_density_per_acre": {
   "value": [
    4047,
    10117
   ],
   "unit": "fingerlings/acre",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_PANG",
   "note": "NABARD: 12,500/ha typical; monoculture <20,000/ha (15-20 g fingerlings); polyculture <10,000/ha. Andhra practice (WAS 2019): 8,750/ha at 0.76 m depth, 25,000/ha (max 45,000) at 1.5-2.7 m. FAO Vietnam 20-60/m2 is not comparable.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/3.Pangassius_culture_15.pdf"
  },
  "density_default_per_acre": {
   "value": 6964.7,
   "unit": "fingerlings/acre",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from yield_kg_per_acre_per_crop, survival_pct and harvest_size_g (MODEL_SPEC.md section 7 amendment A3)",
   "fallback_rule": "yield_consistent_density",
   "note": "Sourced stocking_density_per_acre [4047, 10117] fingerlings/acre would imply 7,613 kg/acre/crop via survival_mid x harvest_mid, against a sourced yield of [4856, 10118] kg/acre/crop; density_default_per_acre anchors to the sourced yield instead of compounding three independent range midpoints (MODEL_SPEC.md section 7 amendment A3)."
  },
  "seed_size_g": {
   "value": 5.0,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "fish fingerlings (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    8,
    12
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_PANG",
   "note": "NABARD 8-12 months to 1-1.5 kg; AP farms 150-350 days (WAS 2019); FAO 1-1.5 kg in 6 months or less.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/3.Pangassius_culture_15.pdf"
  },
  "harvest_size_g": {
   "value": [
    1000,
    1500
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_PANG",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/3.Pangassius_culture_15.pdf"
  },
  "survival_pct": {
   "value": [
    76,
    96
   ],
   "unit": "%",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "WAS_PANG",
   "note": "AP farms 76-96% (60-70% in prolonged culture); NABARD 80-90%.",
   "source_url": "https://www.was.org/Meeting/Program/PaperDetail/154045"
  },
  "fcr": {
   "value": [
    1.3,
    2.35
   ],
   "unit": "kg feed/kg gain",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "WAS_PANG",
   "note": "AP farms 1.3-1.46 on 28% protein pellets; NABARD 2.35 average on mash/pellets; FAO commercial pellets 1.7-1.9.",
   "source_url": "https://www.was.org/Meeting/Program/PaperDetail/154045"
  },
  "farmgate_price_inr_per_kg": {
   "value": [
    71.5,
    80
   ],
   "unit": "INR/kg",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "WAS_PANG",
   "as_of": "2018",
   "market_level": "farm-gate (Andhra Pradesh)",
   "note": "Andhra Pradesh farm-gate 2018: Rs 71.5-80/kg (2017: Rs 55.6-78). No 2025-26 farm-gate quote found for TN or AP; trade listings Rs 100-130/kg are wholesale/retail.",
   "source_url": "https://www.was.org/Meeting/Program/PaperDetail/154045"
  },
  "price_default_inr_per_kg": {
   "value": 75.75,
   "unit": "INR/kg",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from farmgate_price_inr_per_kg (EXECUTION_PLAN WP1 fallback 6)",
   "label": "₹75.75/kg, 2018, farm-gate (Andhra Pradesh)",
   "rule": "midpoint of sourced range (farm-gate market level)"
  },
  "seed_cost_inr_per_unit": {
   "value": [
    0.3,
    7.0
   ],
   "unit": "INR/fingerling",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "WAS_PANG",
   "as_of": "2018",
   "note": "Seasonal: Rs 5-7 (Jan-May), Rs 0.3-1 (Jun-Dec) in 2018; NABARD 2015 Rs 1; 2025 trade listings Rs 0.6-2.",
   "source_url": "https://www.was.org/Meeting/Program/PaperDetail/154045"
  },
  "feed_cost_inr_per_kg": {
   "value": [
    40,
    70
   ],
   "unit": "INR/kg (floating pellet)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "PERFECT",
   "as_of": "2025-10-09",
   "note": "Vendor blog Oct 2025 (Rs 36/kg pangasius pellet listings exist); NABARD 2015 mash Rs 14.6/kg.",
   "source_url": "https://www.perfectaquafeeds.com/post/fish-feed-prices-in-india-2025-a-comprehensive-comparison-and-buying-guide"
  },
  "other_cost_inr_per_acre_crop": {
   "value": 18615.19,
   "unit": "INR/acre/crop",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/3.Pangassius_culture_15.pdf",
   "note": "NABARD/TNAU 2015 pangasius model: opex 5,57,000 - feed 4,38,000 - seed 13,000 - electricity (pumping charges) 60,000 = 46,000/ha/crop."
  },
  "crops_per_year_tn": {
   "value": 1,
   "unit": "crops/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_PANG",
   "note": "Derived from 8-12 month grow-out.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/3.Pangassius_culture_15.pdf"
  },
  "stocking_month_tn_default": {
   "value": 7,
   "unit": "month (1-12)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": null,
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 5: freshwater default (sourced carp pattern); stocking_months_tn NOT_FOUND"
  },
  "respiration_group": "air_breathing_fish",
  "estimable": true,
  "missing": [],
  "notes": "Promoted by TN Fisheries as a fast-growing species (Policy Note 2020-21). AP farm-gate price is volatile and has discouraged farmers (Global Seafood Advocate 2017; WAS 2019).",
  "culture_system": "earthen pond monoculture (semi-intensive, high density) or polyculture with carps; pelleted floating feed; 1.5-2 m depth",
  "temp_growth_stops_below_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "do_preferred_mg_l": {
   "value": null,
   "unit": "mg/L",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "'Air breathing fish thus they don't need to have a much higher dissolved oxygen' (NABARD)."
  },
  "yield_kg_per_acre_per_crop": {
   "value": [
    4856,
    10118
   ],
   "unit": "kg/acre/crop",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_PANG",
   "note": "NABARD: monoculture 20-25 t/ha/crop, polyculture 12-14 t/ha; India typical 10-15 t/ha/yr (Global Seafood Advocate 2017).",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/3.Pangassius_culture_15.pdf"
  },
  "feed_share_of_variable_cost_pct": {
   "value": 78.6,
   "unit": "% of variable cost",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_PANG",
   "note": "Derived: feed Rs 4,38,000 of Rs 5,57,000 operational cost/ha/crop (NABARD 2015).",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/3.Pangassius_culture_15.pdf"
  },
  "stocking_months_tn": {
   "value": null,
   "unit": "months",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Seed is cheapest Jun-Dec in India (WAS 2019); no TN stocking season published."
  },
  "aeration_common": {
   "value": "optional - air-breather; aerators used in intensive monoculture",
   "unit": "yes/no",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "NABARD_PANG",
   "note": "NABARD text says no high DO needed; its farm photo shows a paddlewheel aerator.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/3.Pangassius_culture_15.pdf"
  }
 },
 {
  "id": "murrel",
  "common_name_en": "Striped murrel / viral meen",
  "common_name_ta": {
   "value": "விரால் மீன்",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "WIKI_TA",
   "note": "Tamil Wikipedia article title; alternative names முறால், நெடுமுரல்.",
   "source_url": "https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=ta&titles=Catla|Rohu|Mrigal%20carp|Common%20carp|Grass%20carp|Silver%20carp|Channa%20striata|Green%20chromide|Barramundi|Milkfish|Flathead%20grey%20mullet"
  },
  "scientific_name": "Channa striata",
  "water_type": "freshwater",
  "salinity_ppt": {
   "value": 0,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "freshwater species (water_type: \"freshwater\")"
  },
  "temp_optimum_c": {
   "value": [
    28,
    30
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_MURREL",
   "note": "TNAU pond culture at 29 +/- 1 C. Secondary summaries cite 28-35 C thriving range.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_freshwater_murrel.html"
  },
  "temp_tolerable_c": {
   "value": [
    15,
    35
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "KERALA",
   "note": "Kerala PoP 2021: tolerates annual temperature variation 15-35 C, salinity to 12 ppt, pH 4-9.",
   "source_url": "https://fisheries.kerala.gov.in/sites/default/files/2021-02/Aquaculture%20Practices_compressed.pdf"
  },
  "do_minimum_mg_l": {
   "value": 2.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.air_breathing_fish.do_min_growth_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 3: group default (do_minimum_mg_l NOT_FOUND)"
  },
  "do_lethal_mg_l": {
   "value": 0.5,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.air_breathing_fish.do_lethal_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 2: group default (do_lethal_mg_l NOT_FOUND)"
  },
  "stocking_density_per_acre": {
   "value": [
    4047,
    6070
   ],
   "unit": "fingerlings/acre",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NFDB_MURREL",
   "note": "NFDB 10,000/ha (5-8 cm); TNAU 12,000-15,000/ha (8-10 cm); Kerala PoP 1-2/m2. Nizamabad commercial case 3,500 in 1,115 m2 = 31,400/ha (12,700/acre).",
   "source_url": "https://static.vikaspedia.in/mediastorage/document/Murrel_Culture_in_Ponds.pdf"
  },
  "density_default_per_acre": {
   "value": 8934.1,
   "unit": "fingerlings/acre",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from yield_kg_per_acre_per_crop, survival_pct and harvest_size_g (MODEL_SPEC.md section 7 amendment A3)",
   "fallback_rule": "yield_consistent_density",
   "note": "Sourced stocking_density_per_acre [4047, 6070] fingerlings/acre would imply 3,130 kg/acre/crop via survival_mid x harvest_mid, against a sourced yield of [1983, 9073] kg/acre/crop; density_default_per_acre anchors to the sourced yield instead of compounding three independent range midpoints (MODEL_SPEC.md section 7 amendment A3)."
  },
  "seed_size_g": {
   "value": 5.0,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "fish fingerlings (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    8,
    10
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NFDB_MURREL",
   "source_url": "https://static.vikaspedia.in/mediastorage/document/Murrel_Culture_in_Ponds.pdf"
  },
  "harvest_size_g": {
   "value": [
    600,
    900
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NFDB_MURREL",
   "note": "NFDB 600-700 g; TNAU 800-900 g; Nizamabad 2,500 kg from ~3,000 fish (~830 g).",
   "source_url": "https://static.vikaspedia.in/mediastorage/document/Murrel_Culture_in_Ponds.pdf"
  },
  "survival_pct": {
   "value": [
    70,
    95
   ],
   "unit": "%",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NFDB_MURREL",
   "note": "NFDB model 70%; TNAU 90-95%; Nizamabad 85.7%.",
   "source_url": "https://static.vikaspedia.in/mediastorage/document/Murrel_Culture_in_Ponds.pdf"
  },
  "fcr": {
   "value": [
    1.28,
    1.5
   ],
   "unit": "kg feed/kg gain",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NFDB_MURREL",
   "note": "NFDB 1:1.5; Nizamabad 1.28-1.3.",
   "source_url": "https://static.vikaspedia.in/mediastorage/document/Murrel_Culture_in_Ponds.pdf"
  },
  "farmgate_price_inr_per_kg": {
   "value": 270,
   "unit": "INR/kg",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "IJISEM",
   "as_of": "2025",
   "market_level": "farm-gate (Telangana)",
   "note": "Farm-gate Rs 270/kg, Nizamabad (Telangana) 2025 case study. NFDB: open-market Rs 400-500/kg; national wholesale avg Rs 196.9/kg (Jun 2025); Madurai trade listing Rs 450/kg (ASSUMED). No TN farm-gate quote found.",
   "source_url": "https://ijisem.com/journal/index.php/ijisem/article/view/662"
  },
  "price_default_inr_per_kg": {
   "value": 270.0,
   "unit": "INR/kg",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from farmgate_price_inr_per_kg (EXECUTION_PLAN WP1 fallback 6)",
   "label": "₹270/kg, 2025, farm-gate (Telangana)",
   "rule": "midpoint of sourced range (farm-gate market level)"
  },
  "seed_cost_inr_per_unit": {
   "value": [
    7,
    8
   ],
   "unit": "INR/fingerling",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NFDB_MURREL",
   "note": "NFDB Rs 7/pc (5-8 cm weaned); trade listings Rs 5-8 (2025). TNAU page's Rs 1 is historic.",
   "source_url": "https://static.vikaspedia.in/mediastorage/document/Murrel_Culture_in_Ponds.pdf"
  },
  "feed_cost_inr_per_kg": {
   "value": [
    100,
    136
   ],
   "unit": "INR/kg (40% CP pellet)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NFDB_MURREL",
   "note": "NFDB Rs 100/kg; Nizamabad derived ~Rs 136/kg (79.65% of Rs 5,46,645 over 3,200 kg feed).",
   "source_url": "https://static.vikaspedia.in/mediastorage/document/Murrel_Culture_in_Ponds.pdf"
  },
  "other_cost_inr_per_acre_crop": {
   "value": 44514.59,
   "unit": "INR/acre/crop",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "https://static.vikaspedia.in/mediastorage/document/Murrel_Culture_in_Ponds.pdf",
   "note": "NFDB/ICAR-CIFA murrel model (5x0.2 ha = 1 ha, 8-10 months): recurring cost 9.50 lakh - feed 7.35 lakh - seed 0.70 lakh - electricity/fuel 0.35 lakh = 1.10 lakh/ha/crop."
  },
  "crops_per_year_tn": {
   "value": 1,
   "unit": "crops/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NFDB_MURREL",
   "note": "Derived from 8-10 month cycle.",
   "source_url": "https://static.vikaspedia.in/mediastorage/document/Murrel_Culture_in_Ponds.pdf"
  },
  "stocking_month_tn_default": {
   "value": 7,
   "unit": "month (1-12)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": null,
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 5: freshwater default (sourced carp pattern); stocking_months_tn NOT_FOUND"
  },
  "respiration_group": "air_breathing_fish",
  "estimable": true,
  "missing": [],
  "notes": "Cultured in the Cauvery delta districts (DT Next 2025). Feed-trained (weaned) fingerlings are essential; cannibalism if ungraded.",
  "culture_system": "earthen pond monoculture of weaned (pellet-trained) fingerlings on 40% CP floating feed; also concrete tanks/biofloc",
  "temp_growth_stops_below_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "do_preferred_mg_l": {
   "value": 6.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "IJISEM",
   "note": "Nizamabad commercial pond ran at 6 mg/L with weekly exchange; not a published optimum.",
   "source_url": "https://ijisem.com/journal/index.php/ijisem/article/view/662"
  },
  "yield_kg_per_acre_per_crop": {
   "value": [
    1983,
    9073
   ],
   "unit": "kg/acre/crop",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NFDB_MURREL",
   "note": "NFDB model 4.90 t/ha/crop (1,983 kg/acre); Nizamabad high-density pond 2,500 kg/0.1115 ha = 22.4 t/ha (9,073 kg/acre).",
   "source_url": "https://static.vikaspedia.in/mediastorage/document/Murrel_Culture_in_Ponds.pdf"
  },
  "feed_share_of_variable_cost_pct": {
   "value": [
    78,
    80
   ],
   "unit": "% of variable cost",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "IJISEM",
   "note": "Nizamabad 79.65% of operating cost; NFDB model ~78% (Rs 7.35 lakh feed of ~Rs 9.4 lakh).",
   "source_url": "https://ijisem.com/journal/index.php/ijisem/article/view/662"
  },
  "stocking_months_tn": {
   "value": null,
   "unit": "months",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Murrel breeds in the monsoon; weaned seed availability season for TN not published."
  },
  "aeration_common": {
   "value": "no - air-breather; water exchange used instead",
   "unit": "yes/no",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "IJISEM",
   "source_url": "https://ijisem.com/journal/index.php/ijisem/article/view/662"
  }
 },
 {
  "id": "scampi",
  "common_name_en": "Giant freshwater prawn / scampi",
  "common_name_ta": {
   "value": null,
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Tamil Wikipedia title is only a transliteration (மேக்ரோபிராக்கியம் ரோசென்பெர்கி); the Tamil species list gave a generic prawn word. Common TN name not sourced."
  },
  "scientific_name": "Macrobrachium rosenbergii",
  "water_type": "freshwater (<10 ppt)",
  "salinity_ppt": {
   "value": 0,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "freshwater species (water_type: \"freshwater (<10 ppt)\")"
  },
  "temp_optimum_c": {
   "value": [
    28,
    31
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_PRAWN",
   "note": "TNAU: optimum 28-31 C (25-31 C for year-round production); TN Parangipettai ponds 27-31 C.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_freshwaterprawn.html"
  },
  "temp_tolerable_c": {
   "value": [
    20,
    36
   ],
   "unit": "C",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "TNAU_PRAWN",
   "note": "TNAU: needs water >=20 C for at least 7 months; upper limit not published (disease risk at 33-34 C).",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 1: high bound = temp_optimum_c.high + 5 = 36",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_freshwaterprawn.html"
  },
  "do_minimum_mg_l": {
   "value": 3.0,
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_PRAWN",
   "note": "Lower bound of TNAU grow-out requirement 3-7 ppm.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_freshwaterprawn.html"
  },
  "do_lethal_mg_l": {
   "value": 1.5,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.shrimp.do_lethal_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 2: group default (do_lethal_mg_l NOT_FOUND)"
  },
  "stocking_density_per_acre": {
   "value": [
    1619,
    20235
   ],
   "unit": "PL or juveniles/acre",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_PRAWN",
   "note": "TNAU monoculture 4,000-50,000 PL/ha, recommended 4 juveniles/m2 (40,000/ha = 16,188/acre); FAO semi-intensive 4-20/m2; TN Parangipettai trial 33,000/ha; Assam 30,000/ha mono, 10,000/ha poly.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_freshwaterprawn.html"
  },
  "density_default_per_acre": {
   "value": null,
   "unit": "PL or juveniles/acre",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "species not estimable or yield_kg_per_acre_per_crop NOT_FOUND (MODEL_SPEC.md section 7 amendment A3 applies to estimable species only)"
  },
  "seed_size_g": {
   "value": 0.05,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "scampi post-larvae (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    6,
    8
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_PRAWN",
   "note": "Monoculture 6-8 months (polyculture 8-12); TN trial 193 days with partial harvests from month 3.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_freshwaterprawn.html"
  },
  "harvest_size_g": {
   "value": [
    50,
    200
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_PRAWN",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_freshwaterprawn.html"
  },
  "survival_pct": {
   "value": [
    50,
    70
   ],
   "unit": "%",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_PRAWN",
   "note": "Grow-out survival 50-70%; Assam farmer ~80%.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_freshwaterprawn.html"
  },
  "fcr": {
   "value": [
    2.0,
    3.0
   ],
   "unit": "kg feed/kg gain",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_GRP",
   "source_url": "https://thefishsite.com/articles/cultured-aquaculture-species-giant-river-prawn"
  },
  "farmgate_price_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "No TN/South India 2025-26 quote found. Assam farmer sold at Rs 1,200/kg (Fish Site, Sep 2024); TNAU page Rs 175/kg large, Rs 70/kg small (undated, ~2010)."
  },
  "price_default_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "label": "no sourced price for this species"
  },
  "seed_cost_inr_per_unit": {
   "value": [
    0.6,
    1.0
   ],
   "unit": "INR/PL",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "TNAU_PRAWN",
   "note": "TNAU Rs 600 per 1,000 PL (undated); 2025 trade listing Rs 1/PL-25.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_freshwaterprawn.html"
  },
  "feed_cost_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "No 2025-26 prawn-pellet price found; TNAU model implies Rs 20/kg (Rs 60,000 for 3 t, undated)."
  },
  "other_cost_inr_per_acre_crop": {
   "value": null,
   "unit": "INR/acre/crop",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "no NABARD/TNAU 2015 model project found for this species"
  },
  "crops_per_year_tn": {
   "value": 1,
   "unit": "crops/yr",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "TNAU_PRAWN",
   "note": "Derived from a 6-8 month cycle plus pond drying.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_freshwaterprawn.html"
  },
  "stocking_month_tn_default": {
   "value": 7,
   "unit": "month (1-12)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": null,
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 5: freshwater default (sourced carp pattern); stocking_months_tn NOT_FOUND"
  },
  "respiration_group": "shrimp",
  "estimable": false,
  "missing": [
   "farmgate_price_inr_per_kg",
   "feed_cost_inr_per_kg"
  ],
  "notes": "TN had only 192 ha under scampi (0.75 t/ha) in the mid-2000s (TNAU table); the species is a minor TN crop. CIFA-GI scampi strain grows ~30% larger (Assam trial).",
  "culture_system": "earthen pond monoculture (or polyculture with carps) of nursed juveniles, semi-intensive, partial harvesting",
  "temp_growth_stops_below_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "do_preferred_mg_l": {
   "value": [
    4.0,
    6.0
   ],
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNPRAWN",
   "note": "Tamil Nadu (Parangipettai) ponds 4.0-6.0 ppm; TNAU range 3-7 ppm.",
   "source_url": "https://scialert.net/fulltext/?doi=ijzr.2008.72.76"
  },
  "yield_kg_per_acre_per_crop": {
   "value": [
    227,
    607
   ],
   "unit": "kg/acre/crop",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_PRAWN",
   "note": "TNAU target 1,500 kg/ha (607 kg/acre); TN Parangipettai monoculture 561 kg/ha (227 kg/acre) in 193 days; India average productivity 1.05 t/ha (425 kg/acre); FAO semi-intensive 500-5,000 kg/ha/yr.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_freshwaterprawn.html"
  },
  "feed_share_of_variable_cost_pct": {
   "value": null,
   "unit": "% of variable cost",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "stocking_months_tn": {
   "value": null,
   "unit": "months",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "aeration_common": {
   "value": "no (semi-intensive ponds unaerated)",
   "unit": "yes/no",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "FAO_GRP",
   "source_url": "https://thefishsite.com/articles/cultured-aquaculture-species-giant-river-prawn"
  }
 },
 {
  "id": "pearl-spot",
  "common_name_en": "Pearl spot / karimeen",
  "common_name_ta": {
   "value": "முத்துப்புள்ளி மீன்",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "WIKI_TA",
   "note": "Tamil Wikipedia article title for Etroplus suratensis; Tamil species list gives கிளி மீன் (ASSUMED).",
   "source_url": "https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=ta&titles=Catla|Rohu|Mrigal%20carp|Common%20carp|Grass%20carp|Silver%20carp|Channa%20striata|Green%20chromide|Barramundi|Milkfish|Flathead%20grey%20mullet"
  },
  "scientific_name": "Etroplus suratensis",
  "water_type": "brackish (also freshwater); 15-30 ppt",
  "salinity_ppt": {
   "value": 20,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "low-to-mid of the salinity range quoted in water_type: \"brackish (also freshwater); 15-30 ppt\""
  },
  "temp_optimum_c": {
   "value": [
    24,
    32
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_PEARL",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_pearlspot.html"
  },
  "temp_tolerable_c": {
   "value": [
    19,
    37
   ],
   "unit": "C",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from temp_optimum_c +/- 5 C (EXECUTION_PLAN WP1 fallback 1)",
   "fallback_rule": "temp_tolerable_c NOT_FOUND; both bounds = temp_optimum_c +/- 5 C"
  },
  "do_minimum_mg_l": {
   "value": 3.5,
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_PEARL",
   "note": "TNAU: DO >3.5 ppm.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_pearlspot.html"
  },
  "do_lethal_mg_l": {
   "value": 1.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.brackish_fish.do_lethal_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 2: group default (do_lethal_mg_l NOT_FOUND)"
  },
  "stocking_density_per_acre": {
   "value": [
    8094,
    12141
   ],
   "unit": "fingerlings/acre",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_PEARL",
   "note": "TNAU monoculture 20,000-30,000/ha; Kerala PoP polyculture 15,000/ha pearl spot + 5,000/ha mullet.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_pearlspot.html"
  },
  "density_default_per_acre": {
   "value": null,
   "unit": "fingerlings/acre",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "species not estimable or yield_kg_per_acre_per_crop NOT_FOUND (MODEL_SPEC.md section 7 amendment A3 applies to estimable species only)"
  },
  "seed_size_g": {
   "value": 5.0,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "fish fingerlings (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    8,
    12
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_PEARL",
   "note": "8-10 months to marketable size; 9-12 months at high density.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_pearlspot.html"
  },
  "harvest_size_g": {
   "value": [
    120,
    150
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_PEARL",
   "note": "Kerala market grades: B >100 g, A >150 g, A+ >250 g.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_pearlspot.html"
  },
  "survival_pct": {
   "value": null,
   "unit": "%",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "fcr": {
   "value": null,
   "unit": "kg feed/kg gain",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "farmgate_price_inr_per_kg": {
   "value": [
    240,
    600
   ],
   "unit": "INR/kg",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "ONM_KARI",
   "as_of": "2025-12-30",
   "market_level": "retail (Kerala)",
   "note": "Fisher-society retail, Kumarakom (Kerala), 30 Dec 2025: A+ Rs 600, A Rs 500, B Rs 320, C Rs 240/kg. TNAU page 'up to Rs 150/kg' is historic; Chennai trade listing Rs 300/kg (ASSUMED). No TN farm-gate quote found.",
   "source_url": "https://www.onmanorama.com/news/kerala/2025/12/30/karimeen-prices-vembanad-lake.html"
  },
  "price_default_inr_per_kg": {
   "value": 240,
   "unit": "INR/kg",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from farmgate_price_inr_per_kg (EXECUTION_PLAN WP1 fallback 6)",
   "label": "₹240/kg, 2025-12-30, retail (Kerala)",
   "rule": "low end of sourced range (retail/wholesale/unstated market level)"
  },
  "seed_cost_inr_per_unit": {
   "value": [
    7,
    9
   ],
   "unit": "INR/fingerling",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "RGCA",
   "as_of": "2025-04-15",
   "note": "MPEDA-RGCA Etroplus seed 2.5-3.5 cm Rs 7-9 (Apr 2025).",
   "source_url": "https://rgca.co.in/assets/docs/sead_availability/2025/seed_availability_22_apr_2025.pdf"
  },
  "feed_cost_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "other_cost_inr_per_acre_crop": {
   "value": null,
   "unit": "INR/acre/crop",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "no NABARD/TNAU 2015 model project found for this species"
  },
  "crops_per_year_tn": {
   "value": 1,
   "unit": "crops/yr",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "TNAU_PEARL",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_pearlspot.html"
  },
  "stocking_month_tn_default": {
   "value": 7,
   "unit": "month (1-12)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": null,
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 5: no month named in any read source for this brackish species; defaulted to July"
  },
  "respiration_group": "brackish_fish",
  "estimable": false,
  "missing": [
   "survival_pct",
   "fcr",
   "feed_cost_inr_per_kg"
  ],
  "notes": "Feeding 3-5% biomass/day; breeds in ponds. Slow growth makes it a niche crop in TN.",
  "culture_system": "brackishwater pond monoculture or polyculture with grey mullet; slow-growing, high-value",
  "temp_growth_stops_below_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "do_preferred_mg_l": {
   "value": null,
   "unit": "mg/L",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "yield_kg_per_acre_per_crop": {
   "value": 405,
   "unit": "kg/acre/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_PEARL",
   "note": "Monoculture 1,000 kg/ha/yr.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_pearlspot.html"
  },
  "feed_share_of_variable_cost_pct": {
   "value": null,
   "unit": "% of variable cost",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "stocking_months_tn": {
   "value": null,
   "unit": "months",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "aeration_common": {
   "value": "no",
   "unit": "yes/no",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "TNAU_PEARL",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_pearlspot.html"
  }
 },
 {
  "id": "improved-strains",
  "common_name_en": "Improved strains promoted in TN: Jayanti rohu and Amur carp",
  "common_name_ta": {
   "value": null,
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "No Tamil name sourced; use rohu / சாதாக்கெண்டை names."
  },
  "scientific_name": "Labeo rohita (CIFA 'Jayanti' selected line); Cyprinus carpio haematopterus / C. rubrofuscus (Amur carp)",
  "water_type": "freshwater",
  "salinity_ppt": {
   "value": 0,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "freshwater species (water_type: \"freshwater\")"
  },
  "temp_optimum_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Use rohu / common carp rows."
  },
  "temp_tolerable_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "do_minimum_mg_l": {
   "value": 3.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.freshwater_fish.do_min_growth_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 3: group default (do_minimum_mg_l NOT_FOUND)"
  },
  "do_lethal_mg_l": {
   "value": 1.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.freshwater_fish.do_lethal_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 2: group default (do_lethal_mg_l NOT_FOUND)"
  },
  "stocking_density_per_acre": {
   "value": null,
   "unit": "fish/acre",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "density_default_per_acre": {
   "value": null,
   "unit": "fish/acre",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "species not estimable or yield_kg_per_acre_per_crop NOT_FOUND (MODEL_SPEC.md section 7 amendment A3 applies to estimable species only)"
  },
  "seed_size_g": {
   "value": 5.0,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "fish fingerlings (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": null,
   "unit": "months",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "harvest_size_g": {
   "value": null,
   "unit": "g",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "survival_pct": {
   "value": null,
   "unit": "%",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "fcr": {
   "value": null,
   "unit": "kg feed/kg gain",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "farmgate_price_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Sold as rohu / common carp."
  },
  "price_default_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "label": "no sourced price for this species"
  },
  "seed_cost_inr_per_unit": {
   "value": null,
   "unit": "INR/fingerling",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Only trade listings found (banglakrishi etc.); not used."
  },
  "feed_cost_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "other_cost_inr_per_acre_crop": {
   "value": null,
   "unit": "INR/acre/crop",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "no NABARD/TNAU 2015 model project found for this species"
  },
  "crops_per_year_tn": {
   "value": null,
   "unit": "crops/yr",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "stocking_month_tn_default": {
   "value": 7,
   "unit": "month (1-12)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": null,
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 5: freshwater default (sourced carp pattern); stocking_months_tn NOT_FOUND"
  },
  "respiration_group": "freshwater_fish",
  "estimable": false,
  "missing": [
   "temp_optimum_c",
   "stocking_density_per_acre",
   "culture_period_months",
   "harvest_size_g",
   "survival_pct",
   "fcr",
   "farmgate_price_inr_per_kg",
   "seed_cost_inr_per_unit",
   "feed_cost_inr_per_kg",
   "crops_per_year_tn"
  ],
  "notes": "VERIFIED 2026-09-21: TN Fisheries Policy Note 2020-21 (p.109) lists 'Promotion of culture technology for fast growing fishes viz., Amur Carp, Jayanthi Rohu, Genetically Improved Farmed Tilapia (GIFT) and Pangasius'. ASSUMED (search-level only): Jayanti rohu ~17% faster growth per generation (CIFA); Karnataka pond trial reached Amur 423 g and Jayanti rohu 256 g in a 5:5 mix. Treat as rohu/common carp with a growth premium until TN farm data are found.",
  "culture_system": "as for rohu and common carp; promoted for short-season farm ponds and multipurpose ponds",
  "temp_growth_stops_below_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "do_preferred_mg_l": {
   "value": null,
   "unit": "mg/L",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "yield_kg_per_acre_per_crop": {
   "value": null,
   "unit": "kg/acre/crop",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "feed_share_of_variable_cost_pct": {
   "value": null,
   "unit": "% of variable cost",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "stocking_months_tn": {
   "value": null,
   "unit": "months",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "aeration_common": {
   "value": null,
   "unit": "yes/no",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  }
 },
 {
  "id": "vannamei",
  "common_name_en": "Pacific white shrimp (vannamei)",
  "common_name_ta": {
   "value": "வெள்ளை இறால்",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "TAWIKI_LIST",
   "note": "No Tamil Wikipedia langlink; name from the Tamil species list via summariser. Trade usage 'வண்ணாமி இறால்' unsourced.",
   "source_url": "https://ta.wikipedia.org/wiki/%E0%AE%AE%E0%AF%80%E0%AE%A9%E0%AF%8D_%E0%AE%B5%E0%AE%95%E0%AF%88%E0%AE%95%E0%AE%B3%E0%AF%8D_%E0%AE%AA%E0%AE%9F%E0%AF%8D%E0%AE%9F%E0%AE%BF%E0%AE%AF%E0%AE%B2%E0%AF%8D"
  },
  "scientific_name": "Litopenaeus (Penaeus) vannamei",
  "water_type": "brackish (0.5-45 ppt; grows best 10-15 ppt)",
  "salinity_ppt": {
   "value": 15,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "low-to-mid of the salinity range quoted in water_type: \"brackish (0.5-45 ppt; grows best 10-15 ppt)\""
  },
  "temp_optimum_c": {
   "value": [
    28,
    32
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_SHRIMP",
   "note": "MPEDA ideal 28-32 C; NABARD 'optimal 30-34 C'; CAA optimal 28-33 C (pond) / 28-32 C; Kerala PoP 30-34 C.",
   "source_url": "https://mpeda.gov.in/farmers/?page_id=1693"
  },
  "temp_tolerable_c": {
   "value": [
    18,
    36
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "CAA",
   "note": "CAA table 'tolerable limit 18-36 C'; NABARD: 'very tolerant to low temperatures of up to 15 C'.",
   "source_url": "https://caa.gov.in/uploaded/doc/Guidelines-Englishnew.pdf"
  },
  "do_minimum_mg_l": {
   "value": 4.0,
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_VAN",
   "note": "'DO levels should be maintained above 4 ppm'. Boyd (2010) penaeid data: survival 42% and FCR 2.64 at 2.32 mg/L vs 61% and 1.96 at 3.89 mg/L.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/5.Culture_of_Vannamei_white_legged_shrimp_15.pdf"
  },
  "do_lethal_mg_l": {
   "value": 1.5,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.shrimp.do_lethal_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 2: group default (do_lethal_mg_l NOT_FOUND)"
  },
  "stocking_density_per_acre": {
   "value": [
    161878,
    242817
   ],
   "unit": "PL/acre",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_VAN",
   "note": "NABARD/CAA: 40-60 PL/m2 preferred, 'above 60 no./sq m is not permitted'; India 2025 practice 40-60 PL/m2 (AAP). FAO semi-intensive 10-30 PL/m2, extensive 4-10. MPEDA: aerators required above 30,000/ha.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/5.Culture_of_Vannamei_white_legged_shrimp_15.pdf"
  },
  "density_default_per_acre": {
   "value": 197071.9,
   "unit": "PL/acre",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from yield_kg_per_acre_per_crop, survival_pct and harvest_size_g (MODEL_SPEC.md section 7 amendment A3)",
   "fallback_rule": "yield_consistent_density",
   "note": "Sourced stocking_density_per_acre [161878, 242817] PL/acre would imply 3,870 kg/acre/crop via survival_mid x harvest_mid, against a sourced yield of [3238, 4300] kg/acre/crop; density_default_per_acre anchors to the sourced yield instead of compounding three independent range midpoints (MODEL_SPEC.md section 7 amendment A3)."
  },
  "seed_size_g": {
   "value": 0.01,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "shrimp post-larvae (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    3.3,
    4.0
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_VAN",
   "note": "20 g in 100-120 days at 60/m2; NABARD economics 4-month crop; FAO 4-5 months; TN fisheries dept page (not readable) cites 110-125 days.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/5.Culture_of_Vannamei_white_legged_shrimp_15.pdf"
  },
  "harvest_size_g": {
   "value": [
    20,
    25
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_VAN",
   "note": "NABARD 20-25 g average; TN farms harvest partial counts from 100/kg (10 g) down to 30/kg.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/5.Culture_of_Vannamei_white_legged_shrimp_15.pdf"
  },
  "survival_pct": {
   "value": 85,
   "unit": "%",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_VAN",
   "note": "NABARD model assumption; FAO super-intensive 55-91%.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/5.Culture_of_Vannamei_white_legged_shrimp_15.pdf"
  },
  "fcr": {
   "value": [
    1.1,
    1.4
   ],
   "unit": "kg feed/kg gain",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_VAN",
   "note": "NABARD 1.1-1.4 (model 1.40); FAO 1.2-1.8; TNAU 1.2.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/5.Culture_of_Vannamei_white_legged_shrimp_15.pdf"
  },
  "farmgate_price_inr_per_kg": {
   "value": [
    200,
    400
   ],
   "unit": "INR/kg",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "BENISON",
   "as_of": "2023-07-07 (TN); 2026-05-22 (AP)",
   "market_level": "farm-gate",
   "note": "Tamil Nadu farm-gate by count, 7 Jul 2023: 30-count Rs 400, 40 Rs 300, 60 Rs 240, 80 Rs 220, 100 Rs 200; break-even then Rs 330/290/250 for 40/60/100 count. Latest: Andhra Pradesh 100-count Rs 270 -> 235 -> 220/kg (22 May 2026, Undercurrent); size 30 US$4.71/kg (Oct 2025), size 60 US$3.87/kg (end-2025). No 2025-26 TN quote found.",
   "source_url": "https://benisonmedia.com/flat-vannamei-prices-leave-indian-farmers-eating-costs-in-painful-year/"
  },
  "price_default_inr_per_kg": {
   "value": 300.0,
   "unit": "INR/kg",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from farmgate_price_inr_per_kg (EXECUTION_PLAN WP1 fallback 6)",
   "label": "₹300/kg, 2023-07-07 (TN); 2026-05-22 (AP), farm-gate",
   "rule": "midpoint of sourced range (farm-gate market level)"
  },
  "seed_cost_inr_per_unit": {
   "value": [
    0.25,
    0.35
   ],
   "unit": "INR/PL",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "SP_SEARCH",
   "as_of": "2025-03",
   "note": "S&P Global (Mar 2025) via search summary: 'Rs 0.25-0.30 per seed, up to Rs 0.35 in January'; page returned 403. NABARD 2015 model Rs 0.75/PL; FAO US$0.4-3.0 per 1,000 PL.",
   "source_url": "https://spglobal.com/commodity-insights/en/news-research/latest-news/agriculture/030325-indian-shrimp-prices-fall-amid-talks-of-recovering-supply"
  },
  "feed_cost_inr_per_kg": {
   "value": [
    108,
    112
   ],
   "unit": "INR/kg",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "DC_FEED",
   "as_of": "2026-06-19",
   "note": "Andhra Pradesh, 19 Jun 2026: feed cut from Rs 112 to Rs 108/kg. Apr 2025 (BS, search only): 25 kg vannamei bag Rs 2,667-2,702 = Rs 107-108/kg. Jul 2023: ~Rs 90/kg (Benison).",
   "source_url": "https://www.deccanchronicle.com/southern-states/andhra-pradesh/aqua-feed-prices-cut-by-rs-4-per-kilo-after-cms-call-1964619"
  },
  "other_cost_inr_per_acre_crop": {
   "value": 69452.88,
   "unit": "INR/acre/crop",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/5.Culture_of_Vannamei_white_legged_shrimp_15.pdf",
   "note": "NABARD/TNAU 2015 L. vannamei model (4-month crop, 50 PL/m2): opex 15,04,125 - feed 8,92,500 - PL(seed) 3,75,000 - electricity/power charges 65,000 = 1,71,625/ha/crop."
  },
  "crops_per_year_tn": {
   "value": [
    2,
    3
   ],
   "unit": "crops/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_CROP",
   "note": "MPEDA: TN vannamei stocking and harvest Jan-Dec (year-round); NABARD 2 crops; AAP 2025: up to five crops in two years on 30-40% of farms.",
   "source_url": "https://mpeda.gov.in/?page_id=645"
  },
  "stocking_month_tn_default": {
   "value": 1,
   "unit": "month (1-12)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_CROP",
   "note": "parsed as the first month named in stocking_months_tn (\"january\")",
   "source_url": "https://mpeda.gov.in/?page_id=645"
  },
  "respiration_group": "shrimp",
  "estimable": true,
  "missing": [],
  "notes": "TN: 3,001 CAA-registered shrimp farms on 5,745 ha across 13 coastal districts (TN Fisheries page, search-level; site unreachable). Nagapattinam is the leading TN producer. NABARD 2015 cost of production Rs 150-160/kg at 8-10 t/ha; 2023 TN break-even Rs 250-330/kg. Wholesale/export prices differ from farm-gate.",
  "culture_system": "lined or earthen pond, semi-intensive to intensive with SPF PL, paddlewheel/long-arm aeration, zero/low water exchange; CAA-registered farms",
  "temp_growth_stops_below_c": {
   "value": 20,
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_VAN",
   "note": "'At 20 C growth virtually stops.'",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/5.Culture_of_Vannamei_white_legged_shrimp_15.pdf"
  },
  "do_preferred_mg_l": {
   "value": [
    4.5,
    7.0
   ],
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "CAA",
   "note": "CAA optimal 5-7 ppm (>50% air saturation); NABARD >4.5 ppm optimal; MPEDA 4-6 ppm.",
   "source_url": "https://caa.gov.in/uploaded/doc/Guidelines-Englishnew.pdf"
  },
  "yield_kg_per_acre_per_crop": {
   "value": [
    3238,
    4300
   ],
   "unit": "kg/acre/crop",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_VAN",
   "note": "NABARD 8-10 t/ha/crop at 50/m2 (model 10,625 kg/ha); FAO semi-intensive 0.5-2 t/ha/crop, intensive 7-20 t/ha/crop.",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/5.Culture_of_Vannamei_white_legged_shrimp_15.pdf"
  },
  "feed_share_of_variable_cost_pct": {
   "value": [
    59,
    70
   ],
   "unit": "% of variable cost",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "PLOS",
   "note": "Gujarat survey (PLOS 2021): ~70% of variable cost; NABARD model feed Rs 8.93 lakh of Rs 15.04 lakh = 59.3%. Trade sources cite 55-60% intensive, ~40% semi-intensive (ASSUMED).",
   "source_url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0250727"
  },
  "stocking_months_tn": {
   "value": "January-December (year-round); typical two crops Apr-Jun and Aug-Sep",
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_CROP",
   "note": "MPEDA cropping pattern (TN); crop timing from Benison 2023.",
   "source_url": "https://mpeda.gov.in/?page_id=645"
  },
  "aeration_common": {
   "value": "yes - paddlewheel / long-arm aerators, 1 HP per 300 kg (NABARD) to 1 HP per 400 kg biomass (MPEDA); 4 x 2 HP per ha in NABARD model",
   "unit": "yes/no",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "NABARD_VAN",
   "source_url": "https://agritech.tnau.ac.in/banking/nabard_pdf/Fisheries/5.Culture_of_Vannamei_white_legged_shrimp_15.pdf"
  }
 },
 {
  "id": "black-tiger",
  "common_name_en": "Black tiger shrimp",
  "common_name_ta": {
   "value": "கருவண்டன் இறால்",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "TAWIKI_LIST",
   "note": "Tamil Wikipedia article title is only a transliteration (பின்னேயஸ் மோனோடான்); 'கருவண்டன்' from the Tamil species list via summariser.",
   "source_url": "https://ta.wikipedia.org/wiki/%E0%AE%AE%E0%AF%80%E0%AE%A9%E0%AF%8D_%E0%AE%B5%E0%AE%95%E0%AF%88%E0%AE%95%E0%AE%B3%E0%AF%8D_%E0%AE%AA%E0%AE%9F%E0%AF%8D%E0%AE%9F%E0%AE%BF%E0%AE%AF%E0%AE%B2%E0%AF%8D"
  },
  "scientific_name": "Penaeus monodon",
  "water_type": "brackish (optimal 15-30 ppt; tolerates 0.2-70 ppt)",
  "salinity_ppt": {
   "value": 20,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "low-to-mid of the salinity range quoted in water_type: \"brackish (optimal 15-30 ppt; tolerates 0.2-70 ppt)\""
  },
  "temp_optimum_c": {
   "value": [
    28,
    32
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_SHRIMP",
   "note": "MPEDA ideal 28-32 C (shared LV/BT page); CAA optimal 28-33 C.",
   "source_url": "https://mpeda.gov.in/farmers/?page_id=1693"
  },
  "temp_tolerable_c": {
   "value": [
    12,
    37.5
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_SHRIMP",
   "note": "'Mortalities occur at temperatures below 12 C only'; 'can tolerate temperatures up to at least 37.5 C'. CAA tolerable 18-36 C.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_shrimps_area.html"
  },
  "do_minimum_mg_l": {
   "value": 4.0,
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_SHRIMP",
   "note": "Lower bound of MPEDA ideal 4-6 ppm; CAA hatchery/pond standards 'above 3' / 'above 4'.",
   "source_url": "https://mpeda.gov.in/farmers/?page_id=1693"
  },
  "do_lethal_mg_l": {
   "value": 1.5,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.shrimp.do_lethal_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 2: group default (do_lethal_mg_l NOT_FOUND)"
  },
  "stocking_density_per_acre": {
   "value": [
    28329,
    80939
   ],
   "unit": "PL/acre",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "AAP2025",
   "note": "India 2025: 7-10 PL/m2 rising to 20 PL/m2; FAO semi-intensive 5-20 PL/m2, extensive <2; Gujarat survey 1.2-1.4/m2; CAA: keep below 15 PL/m2 for pond-bottom management.",
   "source_url": "https://aquaasiapac.com/2026/04/09/asian-shrimp-in-2025-steady-supply-and-price-volatility/"
  },
  "density_default_per_acre": {
   "value": null,
   "unit": "PL/acre",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "species not estimable or yield_kg_per_acre_per_crop NOT_FOUND (MODEL_SPEC.md section 7 amendment A3 applies to estimable species only)"
  },
  "seed_size_g": {
   "value": 0.01,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "shrimp post-larvae (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    3.5,
    5.3
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_CROP",
   "note": "TN crops Mar/Apr-Jun/Jul and Jul/Aug-Oct/Nov (MPEDA); FAO 4-5 months; Gujarat 146-158 days.",
   "source_url": "https://mpeda.gov.in/?page_id=645"
  },
  "harvest_size_g": {
   "value": [
    30,
    35
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_MON",
   "note": "FAO semi-intensive/intensive 30-35 g; Indian revival farms target 45-50 g (16-20 count) - search-level.",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-giant-tiger-prawn"
  },
  "survival_pct": {
   "value": null,
   "unit": "%",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Grow-out survival not published in sources read (FAO gives hatchery survival only)."
  },
  "fcr": {
   "value": [
    1.2,
    2.0
   ],
   "unit": "kg feed/kg gain",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_MON",
   "note": "FAO intensive 1.2-2.0; TNAU 1.8.",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-giant-tiger-prawn"
  },
  "farmgate_price_inr_per_kg": {
   "value": [
    460,
    485
   ],
   "unit": "INR/kg (converted)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "AAP2025",
   "as_of": "2025-10",
   "market_level": "farm-gate (Andhra Pradesh)",
   "note": "Published: size 30/kg black tiger US$5.50/kg farm-gate, Andhra Pradesh, Oct 2025 (VERIFIED). INR range is my conversion at Rs 84-88/US$. TNAU page: 'over Rs 450 per kg' at peak (undated).",
   "source_url": "https://aquaasiapac.com/2026/04/09/asian-shrimp-in-2025-steady-supply-and-price-volatility/"
  },
  "price_default_inr_per_kg": {
   "value": 472.5,
   "unit": "INR/kg",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from farmgate_price_inr_per_kg (EXECUTION_PLAN WP1 fallback 6)",
   "label": "₹472.5/kg, 2025-10, farm-gate (Andhra Pradesh)",
   "rule": "midpoint of sourced range (farm-gate market level)"
  },
  "seed_cost_inr_per_unit": {
   "value": [
    0.5,
    0.6
   ],
   "unit": "INR/PL",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "RGCA",
   "as_of": "2025-04-15",
   "note": "MPEDA-RGCA P. monodon PL13-PL20 Rs 0.50-0.60 (Apr 2025).",
   "source_url": "https://rgca.co.in/assets/docs/sead_availability/2025/seed_availability_22_apr_2025.pdf"
  },
  "feed_cost_inr_per_kg": {
   "value": [
    108,
    120
   ],
   "unit": "INR/kg",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "BS_FEED",
   "as_of": "2025-04",
   "note": "Tiger feed 25 kg bag Rs 2,947-2,995 (Apr 2025, search summary only) = Rs 118-120/kg; general aqua feed Rs 108-112/kg (Deccan Chronicle Jun 2026, VERIFIED).",
   "source_url": "https://www.business-standard.com/industry/news/tariff-impact-shrimp-feed-prices-drop-by-4-kg-to-reimburse-farmers-125041300459_1.html"
  },
  "other_cost_inr_per_acre_crop": {
   "value": null,
   "unit": "INR/acre/crop",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "no NABARD/TNAU 2015 model project found for this species"
  },
  "crops_per_year_tn": {
   "value": 2,
   "unit": "crops/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_CROP",
   "note": "Two seasonal crops in TN; Gujarat farms 1.",
   "source_url": "https://mpeda.gov.in/?page_id=645"
  },
  "stocking_month_tn_default": {
   "value": 3,
   "unit": "month (1-12)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_CROP",
   "note": "parsed as the first month named in stocking_months_tn (\"march\")",
   "source_url": "https://mpeda.gov.in/?page_id=645"
  },
  "respiration_group": "shrimp",
  "estimable": false,
  "missing": [
   "survival_pct"
  ],
  "notes": "Indian production rose to 69,072 t in 2025-26 (MPEDA, search-level). CAA guidelines permit only traditional/improved-traditional/scientific extensive systems in coastal areas.",
  "culture_system": "earthen pond, traditional / improved-traditional / scientific extensive to semi-intensive (CAA permits only these); SPF PL now available (RGCA)",
  "temp_growth_stops_below_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "do_preferred_mg_l": {
   "value": [
    5.0,
    7.0
   ],
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "CAA",
   "note": "CAA optimal 5-7 ppm (>50% saturation); MPEDA 4-6 ppm.",
   "source_url": "https://caa.gov.in/uploaded/doc/Guidelines-Englishnew.pdf"
  },
  "yield_kg_per_acre_per_crop": {
   "value": [
    202,
    1619
   ],
   "unit": "kg/acre/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_MON",
   "note": "FAO semi-intensive 500-4,000 kg/ha/yr; extensive 50-500; intensive 4,000-15,000.",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-giant-tiger-prawn"
  },
  "feed_share_of_variable_cost_pct": {
   "value": 80,
   "unit": "% of variable cost",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "PLOS",
   "note": "Gujarat survey: ~80% of variable cost.",
   "source_url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0250727"
  },
  "stocking_months_tn": {
   "value": "March-April (1st crop) and July-August (2nd crop)",
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_CROP",
   "source_url": "https://mpeda.gov.in/?page_id=645"
  },
  "aeration_common": {
   "value": "yes where stocking exceeds 30,000/ha (3 PL/m2) - paddlewheel; unaerated in traditional systems",
   "unit": "yes/no",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_SHRIMP",
   "source_url": "https://mpeda.gov.in/farmers/?page_id=1693"
  }
 },
 {
  "id": "seabass",
  "common_name_en": "Asian seabass / koduva",
  "common_name_ta": {
   "value": "கொடுவா மீன்",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "WIKI_TA",
   "note": "Tamil Wikipedia article title.",
   "source_url": "https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=ta&titles=Catla|Rohu|Mrigal%20carp|Common%20carp|Grass%20carp|Silver%20carp|Channa%20striata|Green%20chromide|Barramundi|Milkfish|Flathead%20grey%20mullet"
  },
  "scientific_name": "Lates calcarifer",
  "water_type": "brackish (also freshwater); 10-30 ppt grow-out",
  "salinity_ppt": {
   "value": 20,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "low-to-mid of the salinity range quoted in water_type: \"brackish (also freshwater); 10-30 ppt grow-out\""
  },
  "temp_optimum_c": {
   "value": [
    26,
    32
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "IJPAB",
   "note": "Grow-out optimum 26-32 C (nursery 25-32).",
   "source_url": "https://www.ijpab.com/form/2023%20Volume%2011,%20issue%203/IJPAB-2023-11-3-17-35.pdf"
  },
  "temp_tolerable_c": {
   "value": [
    21,
    37
   ],
   "unit": "C",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from temp_optimum_c +/- 5 C (EXECUTION_PLAN WP1 fallback 1)",
   "fallback_rule": "temp_tolerable_c NOT_FOUND; both bounds = temp_optimum_c +/- 5 C"
  },
  "do_minimum_mg_l": {
   "value": 4.0,
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "IJPAB",
   "note": "Lower bound of optimum 4-8 ppm.",
   "source_url": "https://www.ijpab.com/form/2023%20Volume%2011,%20issue%203/IJPAB-2023-11-3-17-35.pdf"
  },
  "do_lethal_mg_l": {
   "value": 1.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.brackish_fish.do_lethal_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 2: group default (do_lethal_mg_l NOT_FOUND)"
  },
  "stocking_density_per_acre": {
   "value": [
    1214,
    4047
   ],
   "unit": "fingerlings/acre",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_SEABASS",
   "note": "TNAU 3,000-5,000/ha (5-10 g seed); review monoculture 5,000-10,000/ha (5-10 cm seed); RGCA Karaikal 8,500/ha; FAO 0.25-2 fish/m2.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_seabass.html"
  },
  "density_default_per_acre": {
   "value": null,
   "unit": "fingerlings/acre",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "species not estimable or yield_kg_per_acre_per_crop NOT_FOUND (MODEL_SPEC.md section 7 amendment A3 applies to estimable species only)"
  },
  "seed_size_g": {
   "value": 5.0,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "fish fingerlings (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    7,
    12
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_SEABASS",
   "note": "TNAU 7-8 months; review 8-12 months to 800-1,200 g; Karaikal 11 months; cage farms 6 months to 0.9-1.25 kg (ICSF).",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_seabass.html"
  },
  "harvest_size_g": {
   "value": [
    800,
    1200
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "IJPAB",
   "note": "400-600 g at 4-6 months; 800-1,200 g at 8-12 months; Karaikal ~1 kg.",
   "source_url": "https://www.ijpab.com/form/2023%20Volume%2011,%20issue%203/IJPAB-2023-11-3-17-35.pdf"
  },
  "survival_pct": {
   "value": 84.89,
   "unit": "%",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "https://eprints.cmfri.org.in/19157/1/Impact%20of%20Technologies%20and%20Policies%20on%20Marine%20and%20Inland%20Fish%20Culture%20Systems%20in%20India_2025_Shinoj%20Parappurathu.pdf",
   "note": "Tamil Nadu cage culture, ICAR-CIBA/CMFRI survey Apr 2022-Mar 2023 (economics_device_evidence.md section 5.6); species file had NOT_FOUND."
  },
  "fcr": {
   "value": [
    1.6,
    1.8
   ],
   "unit": "kg feed/kg gain",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_BAR",
   "note": "Commercial pellet FCR 1.6-1.8 (experimental 1.0-1.2); trash fish 4-8.",
   "source_url": "https://thefishsite.com/articles/cultured-aquaculture-species-barramundi"
  },
  "farmgate_price_inr_per_kg": {
   "value": [
    350,
    440
   ],
   "unit": "INR/kg",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "ICSF_KARAIKAL",
   "as_of": "c. 2021 (page undated)",
   "market_level": "farm-gate (TN)",
   "note": "Karaikal: 'farm rate up to Rs 440 per kg', retail Rs 650+ (ICSF repost, undated - c. 2021); Vennangapattu cage farm market price Rs 350-400/kg, rearing cost Rs 190/kg (ICSF, undated). Karaikal production cost Rs 250 per 1-kg fish.",
   "source_url": "https://icsf.net/newss/it-is-profitable-to-culture-asian-seabass-fish-in-tamil-nadu/"
  },
  "price_default_inr_per_kg": {
   "value": 395.0,
   "unit": "INR/kg",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from farmgate_price_inr_per_kg (EXECUTION_PLAN WP1 fallback 6)",
   "label": "₹395/kg, c. 2021 (page undated), farm-gate (TN)",
   "rule": "midpoint of sourced range (farm-gate market level)"
  },
  "seed_cost_inr_per_unit": {
   "value": [
    14,
    48
   ],
   "unit": "INR/fingerling",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "RGCA",
   "as_of": "2025-04-15",
   "note": "MPEDA-RGCA Apr 2025: seabass 3.6-10.5 cm Rs 14-35; 4-5.5 cm Rs 26-30; 5-6 cm Rs 28-30; 8-10 cm Rs 38-48.",
   "source_url": "https://rgca.co.in/assets/docs/sead_availability/2025/seed_availability_22_apr_2025.pdf"
  },
  "feed_cost_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Imported/CIBA pellets used; no price found."
  },
  "other_cost_inr_per_acre_crop": {
   "value": null,
   "unit": "INR/acre/crop",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "no NABARD/TNAU 2015 model project found for this species"
  },
  "crops_per_year_tn": {
   "value": 1,
   "unit": "crops/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_SEABASS",
   "note": "Derived from 7-12 month grow-out; cage farms take two harvests a year.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_seabass.html"
  },
  "stocking_month_tn_default": {
   "value": 9,
   "unit": "month (1-12)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "IJPAB",
   "note": "parsed as the first month named in stocking_months_tn (\"september\")",
   "source_url": "https://www.ijpab.com/form/2023%20Volume%2011,%20issue%203/IJPAB-2023-11-3-17-35.pdf"
  },
  "respiration_group": "brackish_fish",
  "estimable": false,
  "missing": [
   "feed_cost_inr_per_kg"
  ],
  "notes": "Cannibalism requires size grading; hatchery at RGCA Thoduvai (Mayiladuthurai district) and CIBA. Trash-fish feeding is common in TN and worsens FCR.",
  "culture_system": "earthen pond monoculture of graded hatchery fingerlings on pellets (or trash fish), semi-intensive; also cages",
  "temp_growth_stops_below_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "do_preferred_mg_l": {
   "value": [
    4.0,
    8.0
   ],
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "IJPAB",
   "source_url": "https://www.ijpab.com/form/2023%20Volume%2011,%20issue%203/IJPAB-2023-11-3-17-35.pdf"
  },
  "yield_kg_per_acre_per_crop": {
   "value": [
    809,
    2024
   ],
   "unit": "kg/acre/crop",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_SEABASS",
   "note": "TNAU 2-3 t/ha in 7-8 months; review 3-5 t/ha in 8-12 months; RGCA Karaikal expected 15 t from two 1-ha ponds (7.5 t/ha = 3,035 kg/acre).",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_seabass.html"
  },
  "feed_share_of_variable_cost_pct": {
   "value": null,
   "unit": "% of variable cost",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "stocking_months_tn": {
   "value": "September-November (wild seed season in TN); hatchery seed (RGCA Thoduvai) year-round",
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "IJPAB",
   "note": "Review citing Arasu et al. 2008 for TN wild seed; RGCA availability list for hatchery seed.",
   "source_url": "https://www.ijpab.com/form/2023%20Volume%2011,%20issue%203/IJPAB-2023-11-3-17-35.pdf"
  },
  "aeration_common": {
   "value": "yes in intensive monoculture ponds (site must have power for aerators)",
   "unit": "yes/no",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "IJPAB",
   "source_url": "https://www.ijpab.com/form/2023%20Volume%2011,%20issue%203/IJPAB-2023-11-3-17-35.pdf"
  }
 },
 {
  "id": "milkfish",
  "common_name_en": "Milkfish",
  "common_name_ta": {
   "value": "பாலமீன்",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "WIKI_TA",
   "note": "Tamil Wikipedia article title; CIBA uses 'Paal Kendai' / 'Paal Meen' (search-level).",
   "source_url": "https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=ta&titles=Catla|Rohu|Mrigal%20carp|Common%20carp|Grass%20carp|Silver%20carp|Channa%20striata|Green%20chromide|Barramundi|Milkfish|Flathead%20grey%20mullet"
  },
  "scientific_name": "Chanos chanos",
  "water_type": "brackish (0-145 ppt tolerance)",
  "salinity_ppt": {
   "value": 20,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "low-to-mid of the salinity range quoted in water_type: \"brackish (0-145 ppt tolerance)\""
  },
  "temp_optimum_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "FAO/Bagarinao: 23 C decreases growth, temperatures up to 33 C increase it; no optimum range stated."
  },
  "temp_tolerable_c": {
   "value": [
    15,
    40
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "KERALA",
   "note": "Kerala PoP 2021; lethal limits for juveniles 8.5 C and 42.7 C (FAO, Garcia 1986).",
   "source_url": "https://fisheries.kerala.gov.in/sites/default/files/2021-02/Aquaculture%20Practices_compressed.pdf"
  },
  "do_minimum_mg_l": {
   "value": 1.4,
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_MILKBIO",
   "note": "'Symptoms of asphyxiation are discernible at 1.4 ppm oxygen among 200 to 300 g fish' (Gerochi et al. 1978). Secondary summaries put the growth optimum at >=3 mg/L (ASSUMED).",
   "source_url": "https://www.fao.org/4/ac282e/ac282e04.htm"
  },
  "do_lethal_mg_l": {
   "value": [
    0.1,
    0.4
   ],
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_MILKBIO",
   "note": "50% mortality at 0.1-0.4 ppm at 31-34 C.",
   "source_url": "https://www.fao.org/4/ac282e/ac282e04.htm"
  },
  "stocking_density_per_acre": {
   "value": [
    809,
    4047
   ],
   "unit": "fingerlings/acre",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_MILK",
   "note": "TNAU production ponds 2,000-10,000/ha of 7-15 cm fingerlings.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_milkfish.html"
  },
  "density_default_per_acre": {
   "value": null,
   "unit": "fingerlings/acre",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "species not estimable or yield_kg_per_acre_per_crop NOT_FOUND (MODEL_SPEC.md section 7 amendment A3 applies to estimable species only)"
  },
  "seed_size_g": {
   "value": 5.0,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "fish fingerlings (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    6,
    8
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "CIBA_FIN",
   "note": "CIBA MSMH grow-out 6-8 months; CIBA 2015: 500 g in 6 months.",
   "source_url": "https://ciba.res.in/?page_id=1365"
  },
  "harvest_size_g": {
   "value": [
    300,
    800
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_MILK",
   "note": "TNAU 300-800 g; FAO 250-500 g.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_milkfish.html"
  },
  "survival_pct": {
   "value": [
    80,
    95
   ],
   "unit": "%",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_MILK",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_milkfish.html"
  },
  "fcr": {
   "value": null,
   "unit": "kg feed/kg gain",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "farmgate_price_inr_per_kg": {
   "value": [
    120,
    150
   ],
   "unit": "INR/kg",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "ICAR_MILK",
   "as_of": "2015-07-10",
   "market_level": "local market",
   "note": "ICAR-CIBA, 10 Jul 2015: local market Rs 120-150/kg, production cost Rs 50-60/kg. No 2025-26 TN quote found.",
   "source_url": "https://icar.org.in/node/8021"
  },
  "price_default_inr_per_kg": {
   "value": 120,
   "unit": "INR/kg",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from farmgate_price_inr_per_kg (EXECUTION_PLAN WP1 fallback 6)",
   "label": "₹120/kg, 2015-07-10, local market",
   "rule": "low end of sourced range (retail/wholesale/unstated market level)"
  },
  "seed_cost_inr_per_unit": {
   "value": null,
   "unit": "INR/fry",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Only trade listings (Rs 1-6/piece) found; wild fry collection is the norm."
  },
  "feed_cost_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "other_cost_inr_per_acre_crop": {
   "value": null,
   "unit": "INR/acre/crop",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "no NABARD/TNAU 2015 model project found for this species"
  },
  "crops_per_year_tn": {
   "value": 1,
   "unit": "crops/yr",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "CIBA_FIN",
   "note": "MSMH is continuous with partial harvests.",
   "source_url": "https://ciba.res.in/?page_id=1365"
  },
  "stocking_month_tn_default": {
   "value": 3,
   "unit": "month (1-12)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_MILK",
   "note": "parsed as the first month named in stocking_months_tn (\"march\")",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_milkfish.html"
  },
  "respiration_group": "brackish_fish",
  "estimable": false,
  "missing": [
   "temp_optimum_c",
   "fcr",
   "seed_cost_inr_per_unit",
   "feed_cost_inr_per_kg"
  ],
  "notes": "CIBA achieved captive breeding in 2015 (Muttukadu). Herbivore/detritivore - low feed cost; often polycultured with mullet, pearl spot and tiger shrimp.",
  "culture_system": "brackishwater earthen pond, extensive to semi-intensive on natural food (lab-lab) plus supplementary feed; CIBA multiple-stocking-multiple-harvest model",
  "temp_growth_stops_below_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Growth and feeding reduced at 23 C (FAO)."
  },
  "do_preferred_mg_l": {
   "value": null,
   "unit": "mg/L",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "yield_kg_per_acre_per_crop": {
   "value": [
    202,
    1416
   ],
   "unit": "kg/acre/crop",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_MILK",
   "note": "TNAU traditional earthen ponds 500-1,000 kg/ha; CIBA MSMH model 3.5 t/ha (1,416 kg/acre); FAO 800-2,000 kg/ha.",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_milkfish.html"
  },
  "feed_share_of_variable_cost_pct": {
   "value": null,
   "unit": "% of variable cost",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "stocking_months_tn": {
   "value": "March-June (natural fry season; TNAU)",
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "TNAU_MILK",
   "note": "Pulicat larval ingress Feb/Mar-Oct with peaks in April and Aug/Sep (search-level).",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_milkfish.html"
  },
  "aeration_common": {
   "value": "no",
   "unit": "yes/no",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "TNAU_MILK",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_milkfish.html"
  }
 },
 {
  "id": "grey-mullet",
  "common_name_en": "Grey mullet / madavai",
  "common_name_ta": {
   "value": "சாம்பல் நிற மடவை",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "WIKI_TA",
   "note": "Tamil Wikipedia article title; common usage மடவை.",
   "source_url": "https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=ta&titles=Catla|Rohu|Mrigal%20carp|Common%20carp|Grass%20carp|Silver%20carp|Channa%20striata|Green%20chromide|Barramundi|Milkfish|Flathead%20grey%20mullet"
  },
  "scientific_name": "Mugil cephalus",
  "water_type": "brackish (euryhaline)",
  "salinity_ppt": {
   "value": 20,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "low-to-mid of the salinity range quoted in water_type: \"brackish (euryhaline)\""
  },
  "temp_optimum_c": {
   "value": [
    26,
    30
   ],
   "unit": "C",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "KERALA",
   "note": "Kerala PoP grow-out 26-30 C. Conflict: FAO sheet 'nursery and grow-out optimum 20-26 C' (Egypt/temperate context).",
   "source_url": "https://fisheries.kerala.gov.in/sites/default/files/2021-02/Aquaculture%20Practices_compressed.pdf"
  },
  "temp_tolerable_c": {
   "value": [
    21,
    35
   ],
   "unit": "C",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from temp_optimum_c +/- 5 C (EXECUTION_PLAN WP1 fallback 1)",
   "fallback_rule": "temp_tolerable_c NOT_FOUND; both bounds = temp_optimum_c +/- 5 C"
  },
  "do_minimum_mg_l": {
   "value": 4.0,
   "unit": "mg/L",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "KERALA",
   "note": "Kerala PoP grow-out DO >4 ppm.",
   "source_url": "https://fisheries.kerala.gov.in/sites/default/files/2021-02/Aquaculture%20Practices_compressed.pdf"
  },
  "do_lethal_mg_l": {
   "value": 1.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.brackish_fish.do_lethal_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 2: group default (do_lethal_mg_l NOT_FOUND)"
  },
  "stocking_density_per_acre": {
   "value": [
    2499,
    4047
   ],
   "unit": "fingerlings/acre",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_MULLET",
   "note": "CIBA monoculture 10,000/ha of >50 g fingerlings (Kerala PoP also 10,000/ha); FAO monoculture 6,175-7,410/ha; polyculture 8,000-15,000/ha with 15,000-30,000 tiger shrimp.",
   "source_url": "http://www.ciba.res.in/wp-content/uploads/2022/06/MNL-JUNE-2022-FOR-WEB-1-1.pdf"
  },
  "density_default_per_acre": {
   "value": null,
   "unit": "fingerlings/acre",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "species not estimable or yield_kg_per_acre_per_crop NOT_FOUND (MODEL_SPEC.md section 7 amendment A3 applies to estimable species only)"
  },
  "seed_size_g": {
   "value": 5.0,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "fish fingerlings (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    6,
    10
   ],
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_MULLET",
   "note": "8-month culture to 500-800 g; 2-3 t/ha systems in 6-10 months.",
   "source_url": "http://www.ciba.res.in/wp-content/uploads/2022/06/MNL-JUNE-2022-FOR-WEB-1-1.pdf"
  },
  "harvest_size_g": {
   "value": [
    500,
    800
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_MULLET",
   "note": "FAO 750-1,000 g in one 7-8 month season.",
   "source_url": "http://www.ciba.res.in/wp-content/uploads/2022/06/MNL-JUNE-2022-FOR-WEB-1-1.pdf"
  },
  "survival_pct": {
   "value": null,
   "unit": "%",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "fcr": {
   "value": null,
   "unit": "kg feed/kg gain",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "farmgate_price_inr_per_kg": {
   "value": [
    300,
    500
   ],
   "unit": "INR/kg",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_MULLET",
   "as_of": "2022-06",
   "market_level": "farmer sales (partial harvest)",
   "note": "'Farmers adopting partial harvesting ... sell their produce at Rs 300-500/kg' (CIBA, June 2022).",
   "source_url": "http://www.ciba.res.in/wp-content/uploads/2022/06/MNL-JUNE-2022-FOR-WEB-1-1.pdf"
  },
  "price_default_inr_per_kg": {
   "value": 400.0,
   "unit": "INR/kg",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from farmgate_price_inr_per_kg (EXECUTION_PLAN WP1 fallback 6)",
   "label": "₹400/kg, 2022-06, farmer sales (partial harvest)",
   "rule": "midpoint of sourced range (farm-gate market level)"
  },
  "seed_cost_inr_per_unit": {
   "value": [
    6,
    10
   ],
   "unit": "INR/fingerling",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_MULLET",
   "as_of": "2022-06",
   "note": "Wild seed Rs 6-10/unit, available Nov-Feb on the east coast.",
   "source_url": "http://www.ciba.res.in/wp-content/uploads/2022/06/MNL-JUNE-2022-FOR-WEB-1-1.pdf"
  },
  "feed_cost_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "other_cost_inr_per_acre_crop": {
   "value": null,
   "unit": "INR/acre/crop",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "no NABARD/TNAU 2015 model project found for this species"
  },
  "crops_per_year_tn": {
   "value": 1,
   "unit": "crops/yr",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "MPEDA_MULLET",
   "source_url": "http://www.ciba.res.in/wp-content/uploads/2022/06/MNL-JUNE-2022-FOR-WEB-1-1.pdf"
  },
  "stocking_month_tn_default": {
   "value": 11,
   "unit": "month (1-12)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_MULLET",
   "note": "parsed as the first month named in stocking_months_tn (\"november\")",
   "source_url": "http://www.ciba.res.in/wp-content/uploads/2022/06/MNL-JUNE-2022-FOR-WEB-1-1.pdf"
  },
  "respiration_group": "brackish_fish",
  "estimable": false,
  "missing": [
   "survival_pct",
   "fcr",
   "feed_cost_inr_per_kg"
  ],
  "notes": "Hatchery seed only recently achieved at CIBA Muttukadu; farmers depend on wild seed. TN (Madras) contributed 37% of Indian mullet production in the 1960s.",
  "culture_system": "brackishwater pond monoculture of nursed >50 g fingerlings, or polyculture with milkfish, pearl spot and tiger shrimp; supplementary feed 2-5% BW",
  "temp_growth_stops_below_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "FAO: highest disease mortality below 24 C."
  },
  "do_preferred_mg_l": {
   "value": null,
   "unit": "mg/L",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "yield_kg_per_acre_per_crop": {
   "value": [
    1214,
    2024
   ],
   "unit": "kg/acre/crop",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_MULLET",
   "note": "3-5 t/ha at 10,000/ha in 8 months; 2-3 t/ha in 6-10 months with farm-made feed; polyculture trial 3.5 t/ha total.",
   "source_url": "http://www.ciba.res.in/wp-content/uploads/2022/06/MNL-JUNE-2022-FOR-WEB-1-1.pdf"
  },
  "feed_share_of_variable_cost_pct": {
   "value": null,
   "unit": "% of variable cost",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "stocking_months_tn": {
   "value": "November-February (wild seed season, east coast)",
   "unit": "months",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "MPEDA_MULLET",
   "source_url": "http://www.ciba.res.in/wp-content/uploads/2022/06/MNL-JUNE-2022-FOR-WEB-1-1.pdf"
  },
  "aeration_common": {
   "value": "no",
   "unit": "yes/no",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "MPEDA_MULLET",
   "source_url": "http://www.ciba.res.in/wp-content/uploads/2022/06/MNL-JUNE-2022-FOR-WEB-1-1.pdf"
  }
 },
 {
  "id": "mud-crab",
  "common_name_en": "Mud crab (fattening)",
  "common_name_ta": {
   "value": "கழி நண்டு",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "TAWIKI_LIST",
   "note": "No Tamil Wikipedia langlink for Scylla serrata; name from Tamil species list via summariser.",
   "source_url": "https://ta.wikipedia.org/wiki/%E0%AE%AE%E0%AF%80%E0%AE%A9%E0%AF%8D_%E0%AE%B5%E0%AE%95%E0%AF%88%E0%AE%95%E0%AE%B3%E0%AF%8D_%E0%AE%AA%E0%AE%9F%E0%AF%8D%E0%AE%9F%E0%AE%BF%E0%AE%AF%E0%AE%B2%E0%AF%8D"
  },
  "scientific_name": "Scylla serrata (also S. tranquebarica / S. oceanica in TN catches)",
  "water_type": "brackish (15-25 ppt optimal)",
  "salinity_ppt": {
   "value": 20,
   "unit": "ppt",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from this species' own water_type text (EXECUTION_PLAN WP1 brief)",
   "note": "low-to-mid of the salinity range quoted in water_type: \"brackish (15-25 ppt optimal)\""
  },
  "temp_optimum_c": {
   "value": [
    26,
    30
   ],
   "unit": "C",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "AFS528",
   "note": "From a search summary of an Asian Fisheries Society pond-culture paper (not read): salinity 15-25 ppt, 26-30 C, pH 7.8-8.5. Hatchery larval rearing 28-31 C (Marichamy 2001) and 28-30 C (Kerala PoP) are VERIFIED.",
   "source_url": "https://www.asianfisheriessociety.org/publication/downloadfile.php?id=528&file=Y0dSbUx6QTFORGc1TURjd01ERXpOVFU0T0RFeU16QXVjR1Jt"
  },
  "temp_tolerable_c": {
   "value": [
    21,
    35
   ],
   "unit": "C",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from temp_optimum_c +/- 5 C (EXECUTION_PLAN WP1 fallback 1)",
   "fallback_rule": "temp_tolerable_c NOT_FOUND; both bounds = temp_optimum_c +/- 5 C"
  },
  "do_minimum_mg_l": {
   "value": 3.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.crab.do_min_growth_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 3: group default (do_minimum_mg_l NOT_FOUND)"
  },
  "do_lethal_mg_l": {
   "value": 1.0,
   "unit": "mg/L",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "coefficients.json species_group_defaults.crab.do_lethal_mg_l",
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 2: group default (do_lethal_mg_l NOT_FOUND)"
  },
  "stocking_density_per_acre": {
   "value": [
    4047,
    8094
   ],
   "unit": "crabs/acre (fattening)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "SCYLLA_IN",
   "note": "Fattening 1-2 crabs/m2 (Marichamy 2001); FAO fattening up to 1/m2 communal. Grow-out 5,000-8,000/ha (2,023-3,238/acre); FAO polyculture 500-800/ha.",
   "source_url": "https://www.asianfisheriessociety.org/publication/downloadfile.php?id=534&file=Y0dSbUx6QXpNelk0TmpBd01ERXpOVFU0T0RJeE5ETXVjR1Jt"
  },
  "density_default_per_acre": {
   "value": null,
   "unit": "crabs/acre (fattening)",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "species not estimable or yield_kg_per_acre_per_crop NOT_FOUND (MODEL_SPEC.md section 7 amendment A3 applies to estimable species only)"
  },
  "seed_size_g": {
   "value": 100.0,
   "unit": "g",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "EXECUTION_PLAN.md WP1 fallback 8",
   "note": "mud crab fattening stock (WP1 fallback 8)"
  },
  "culture_period_months": {
   "value": [
    0.5,
    1.0
   ],
   "unit": "months (fattening)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "SCYLLA_IN",
   "note": "Fattening 15-30 days (Marichamy 2001; FAO), 3-4 weeks (TNAU), 20-40 days (Kerala farmers 2026). Grow-out 4-5 months (Marichamy); CIBA 2 g to >500 g in 165 days (search-level).",
   "source_url": "https://www.asianfisheriessociety.org/publication/downloadfile.php?id=534&file=Y0dSbUx6QXpNelk0TmpBd01ERXpOVFU0T0RJeE5ETXVjR1Jt"
  },
  "harvest_size_g": {
   "value": [
    300,
    700
   ],
   "unit": "g",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "ONM_CRAB",
   "note": "Marketable 300-700 g; ideal fattening stock 500 g+ (Kerala, Jul 2026); TNAU stocks ~550 g water crabs. Grow-out: 644 g males in 142 days (Marichamy).",
   "source_url": "https://www.onmanorama.com/news/kerala/2026/07/27/crab-farming-profitability1.html"
  },
  "survival_pct": {
   "value": 50,
   "unit": "%",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "SCYLLA_IN",
   "note": "Grow-out at 5,000/ha: survival 50%; fattening survival not published.",
   "source_url": "https://www.asianfisheriessociety.org/publication/downloadfile.php?id=534&file=Y0dSbUx6QXpNelk0TmpBd01ERXpOVFU0T0RJeE5ETXVjR1Jt"
  },
  "fcr": {
   "value": null,
   "unit": "kg feed/kg gain",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Fed trash fish/clam at 5-10% biomass/day."
  },
  "farmgate_price_inr_per_kg": {
   "value": [
    1000,
    2300
   ],
   "unit": "INR/kg",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "ONM_CRAB",
   "as_of": "2026-07-27",
   "market_level": "farmer sale price (Kerala)",
   "note": "Kerala farmers (Jul 2026): water crabs bought at Rs 300-600/kg, sold after hardening at Rs 1,000-2,300/kg (market level not stated). National wholesale green mud crab avg Rs 485/kg, high Rs 650 (May 2025). No TN quote found.",
   "source_url": "https://www.onmanorama.com/news/kerala/2026/07/27/crab-farming-profitability1.html"
  },
  "price_default_inr_per_kg": {
   "value": 1650.0,
   "unit": "INR/kg",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "derived from farmgate_price_inr_per_kg (EXECUTION_PLAN WP1 fallback 6)",
   "label": "₹1650/kg, 2026-07-27, farmer sale price (Kerala)",
   "rule": "midpoint of sourced range (farm-gate market level)"
  },
  "seed_cost_inr_per_unit": {
   "value": [
    20,
    32
   ],
   "unit": "INR/crablet",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "RGCA",
   "as_of": "2025-04-15",
   "note": "MPEDA-RGCA crablets 1.6-4.0 cm Rs 20-32; megalopa Rs 12 (Apr 2025). Fattening stock = water crabs at Rs 300-600/kg.",
   "source_url": "https://rgca.co.in/assets/docs/sead_availability/2025/seed_availability_22_apr_2025.pdf"
  },
  "feed_cost_inr_per_kg": {
   "value": null,
   "unit": "INR/kg",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Trash fish / clam meat; no price found."
  },
  "other_cost_inr_per_acre_crop": {
   "value": null,
   "unit": "INR/acre/crop",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "no NABARD/TNAU 2015 model project found for this species"
  },
  "crops_per_year_tn": {
   "value": 2,
   "unit": "crops/yr (grow-out); fattening 8-12 cycles/yr",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "FAO_CRAB",
   "note": "FAO: two grow-out crops annually; fattening cycles derived from 20-40 day turns (ASSUMED).",
   "source_url": "https://thefishsite.com/articles/cultured-aquatic-species-indopacific-swamp-crab"
  },
  "stocking_month_tn_default": {
   "value": 7,
   "unit": "month (1-12)",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": null,
   "fallback_rule": "EXECUTION_PLAN WP1 fallback 5: no month named in any read source for this brackish species; defaulted to July"
  },
  "respiration_group": "crab",
  "estimable": false,
  "missing": [
   "fcr",
   "feed_cost_inr_per_kg"
  ],
  "notes": "TNAU annual net profit examples: Rs 24,000 per 100 m2 pen, Rs 22,000 per 100 m2 pond. RGCA Thoduvai runs the mud crab hatchery. Tuticorin/Pattukottai are TN trade hubs.",
  "culture_system": "fattening of moulted 'water crabs' for 15-40 days in small brackishwater ponds, pens or cages; grow-out of crablets 4-6 months",
  "temp_growth_stops_below_c": {
   "value": null,
   "unit": "C",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "do_preferred_mg_l": {
   "value": null,
   "unit": "mg/L",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "yield_kg_per_acre_per_crop": {
   "value": [
    486,
    567
   ],
   "unit": "kg/acre/crop (grow-out)",
   "status": "VERIFIED",
   "date": "2026-09-21",
   "source": "SCYLLA_IN",
   "note": "Grow-out net production 1,200-1,400 kg/ha in 4-5 months (Marichamy 2001); polyculture up to 2,440 kg/ha. Fattening throughput not published.",
   "source_url": "https://www.asianfisheriessociety.org/publication/downloadfile.php?id=534&file=Y0dSbUx6QXpNelk0TmpBd01ERXpOVFU0T0RJeE5ETXVjR1Jt"
  },
  "feed_share_of_variable_cost_pct": {
   "value": null,
   "unit": "% of variable cost",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null
  },
  "stocking_months_tn": {
   "value": null,
   "unit": "months",
   "status": "NOT_FOUND",
   "date": "2026-09-21",
   "source": null,
   "note": "Fattening is run year-round on wild water crabs (ASSUMED)."
  },
  "aeration_common": {
   "value": "no",
   "unit": "yes/no",
   "status": "ASSUMED",
   "date": "2026-09-21",
   "source": "TNAU_CRAB",
   "source_url": "https://agritech.tnau.ac.in/fishery/fish_cul_brackish_mudcrab.html"
  }
 }
];
