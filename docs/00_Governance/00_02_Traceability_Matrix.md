# 00_02 Traceability Matrix

Maps each Functional Requirement to its corresponding ADR, data model entity, API contract, and implementation module.

| FR | Requirement | ADR | Schema Entity | API Contract | Backend Module | AI Module |
|---|---|---|---|---|---|---|
| FR-001 | Google OAuth Login | ADR-003 | `public.users` | API-001 | `controllers/authController` | — |
| FR-002 | Meal Image Upload | ADR-005 | `public.meals` | API-002 | `controllers/mealController` | TC-001 |
| FR-003 | AI Food Detection | ADR-002, ADR-004, ADR-005 | `public.ai_match_log`, `public.food_items` | TC-001 | `services/aiService` | `src/app.py` |
| FR-004 | Nutritional Logging | ADR-001, ADR-002 | `public.meal_items`, `public.food_nutrients`, `public.daily_logs` | API-002 | `services/nutritionService` | — |
| FR-005 | WearOS Activity Sync | — | `public.daily_logs` | API-003 | `controllers/activityController` | — |

## Failure Coverage Traceability

| FR | Failure Scenarios |
|---|---|
| FR-001 | F-006 (Expired JWT), F-007 (Bad Google Token) |
| FR-002 | F-001 (AI Unavailable), F-002 (DB Failure), F-003 (Empty Detection), F-009 (Corrupt Image) |
| FR-003 | F-004 (Unmatched Label), F-010 (Inference Exception) |
| FR-004 | F-002 (DB Transaction Failure) |
| FR-005 | F-005 (Activity Sync Failure) |

## ETL Traceability

| Data Source | Staging Table | Target Tables | Spec |
|---|---|---|---|
| ICMR-NIN IFCT 2017 | `staging.icmr_food` | `food_items`, `food_nutrients` | 03_03_ETL_Specification.md |
| USDA FoodData Central | `staging.usda_food`, `staging.usda_nutrient` | `food_items`, `food_nutrients` | 03_03_ETL_Specification.md |
