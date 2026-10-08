# Overnight Implementation Plan — NutriVision Development

This implementation plan details the phases, files to create/modify, and verification criteria for completing the unattended autonomous development run.

---

## Phase 0: System Inspection & Plan Creation
- **Status**: Completed inspection.
- **Findings**:
  - `ai-service`: `/predict` returns fixed mock weights (`150g` and `120g`). Dockerfile and requirements lack PyTorch and timm.
  - `frontend-web`: `Dashboard.tsx` fetches today's metrics without date navigation or empty-day fallback.
  - `backend-api`: Missing `DELETE /api/meals/:mealId`, `GET /api/meals/history`, and `POST /api/meals/:mealId/items` endpoints and their validation schemas.
  - `frontend-web`: Missing `MealHistory.tsx` page and manual search fallback in `LogMeal.tsx`.
  - `docs`: Missing ADR-006 (MiDaS Depth Estimation), ADR-007 (Manual Food Logging Fallback), and updated contracts.

---

## Phase 1: MiDaS Depth / Volume Estimation in AI-Service
- **Goal**: Implement heuristic portion weight estimation based on MiDaS monocular depth maps while keeping classification mocked.
- **Tasks**:
  1. Add `torch` and `timm` to `ai-service/requirements.txt` and update `ai-service/Dockerfile`.
  2. Implement `ai-service/src/depth.py`:
     - Load `DPT_Hybrid` via `torch.hub.load("intel-isl/MiDaS", "DPT_Hybrid")` once as a singleton.
     - Decode image using PIL and execute normalized depth inference.
     - Sample the center 40% region as plate proxy.
     - Heuristic linear scaling: `weight_g = base_weight * (1.0 + 0.8 * (0.5 - median_depth))` with base weights (`rice=150`, `dal=120`, default=`100`) clamped to `[20, 800]`.
  3. Integrate `estimate_weights` in `ai-service/src/app.py` for `/predict` with try/except fallback.
  4. Update `/health` endpoint to return `{ "status": "ok", "midas_loaded": bool }`.
  5. Add ADR-006 to `docs/02_Architecture/02_01_ADRs.md`.
  6. Verify Docker build: `docker compose build ai-service`.
  7. Commit: `feat(ai-service): add MiDaS depth estimation for weight inference`.

---

## Phase 2: Historical Dashboard (Date Navigation)
- **Goal**: Allow users to browse nutrition and activity metrics across days.
- **Tasks**:
  1. In `frontend-web/src/pages/Dashboard.tsx`, add `currentDate` state formatted as `YYYY-MM-DD` via `toLocaleDateString('en-CA')`.
  2. Append `?date=${formattedDate}` to the dashboard query and include `currentDate` in `useEffect` dependencies.
  3. Add `ChevronLeft` and `ChevronRight` navigation buttons; disable next day button when viewing today.
  4. Add dynamic title ("Today's Overview", "Yesterday's Overview", or localized date).
  5. Fallback all numerical metrics to `0` when empty.
  6. Verify with `npm run build` in `frontend-web`.
  7. Commit: `feat(frontend): add date navigation to dashboard for historical view`.

---

## Phase 3: Missing Backend Routes and Controller Gaps
- **Goal**: Implement contract-aligned endpoints for profile, meal deletion, and meal history.
- **Tasks**:
  1. Verify and align `GET /api/profile` and `PUT /api/profile` response formats.
  2. Implement `DELETE /api/meals/:mealId`:
     - Verify meal ownership (`user_id`).
     - Delete `meal_items`, delete `meals`.
     - Recalculate/update `daily_logs` totals and remaining calories via raw SQL.
     - Return `204 No Content`.
  3. Implement `GET /api/meals/history`:
     - Pagination parameters (`page`, `limit`) and optional `date` filter.
     - Include mapped items (`food_name`, `quantity_grams`, `estimated_calories`).
  4. Implement `POST /api/meals/:mealId/items`:
     - Add manual item to an existing meal, recalculate meal and daily totals.
  5. Add Zod schemas to `backend-api/src/schemas/index.ts`.
  6. Register routes in `meal.routes.ts` and `server.ts`.
  7. Add integration tests in `backend-api/tests/integration/meals.test.ts`.
  8. Run `npm run test` in `backend-api` and verify all pass.
  9. Commit: `feat(backend): add meal history, meal delete, and contract-aligned profile endpoint`.

---

## Phase 4: Frontend Pages for New Backend Routes
- **Goal**: Provide user interfaces for meal history and manual meal logging.
- **Tasks**:
  1. Build `frontend-web/src/pages/MealHistory.tsx`:
     - Paginated list grouped by date.
     - Meal details card with delete action.
     - Load more pagination button.
     - Register in `App.tsx` and `Layout.tsx` navbar.
  2. Update `frontend-web/src/pages/LogMeal.tsx`:
     - Add "Search manually" toggle.
     - Input field querying `GET /api/foods/search?q=...`.
     - Inline form with prefilled quantity to add item.
  3. Verify frontend build with `npm run build`.
  4. Commit: `feat(frontend): add meal history page and manual food search in log meal`.

---

## Phase 5: Integration Test Coverage
- **Goal**: Ensure full test coverage across new backend endpoints.
- **Tasks**:
  1. Expand integration tests for `DELETE /api/meals/:mealId`, `GET /api/meals/history`, and `POST /api/meals/:mealId/items`.
  2. Verify all test suites pass via `npm run test`.
  3. Commit: `test(backend): add integration tests for meal history, delete, and item add`.

---

## Phase 6: ADR and Documentation Audit
- **Goal**: Maintain architectural and contract documentation integrity.
- **Tasks**:
  1. Document ADR-006 (MiDaS Depth-Based Weight Estimation) and ADR-007 (Manual Food Logging Fallback).
  2. Update `docs/04_Contracts/04_02_Backend_API_Contracts.md` with new routes.
  3. Commit: `docs: update ADRs and API contracts to reflect implemented features`.

---

## Phase 7: Final Build and Audit
- **Goal**: Clean production builds, zero type regressions, and code quality pass.
- **Tasks**:
  1. Run `npm run build` in `backend-api` and `frontend-web`.
  2. Run `npm run test` in `backend-api`.
  3. Run `docker compose build` across all services.
  4. Code clean-up: remove stray `console.log`, fix loose types, ensure env var URL consistency.
  5. Commit: `chore: final build, type cleanup, and audit pass`.

---

## Phase 8: Morning Report
- **Goal**: Produce complete, verified report in `docs/overnight-report.md`.
- **Tasks**:
  1. Generate `docs/overnight-report.md`.
  2. Commit: `docs: add overnight development report`.
