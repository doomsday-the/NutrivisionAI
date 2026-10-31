# 00_03 University Assessment Compliance Map
**Course**: Database Systems (BCSE307L)  
**Faculty**: Dr. Deepika J  
**Total Marks**: 30 + 3 Bonus

This document maps every university assessment criterion to the specific NutriVision AI document, schema entity, or implementation module that satisfies it. This is the definitive compliance checklist — review before every milestone submission.

---

## Marks Breakdown & Compliance Status

### Section 1 — Problem Statement & Project Planning (2 marks)
| Criterion | Document | Status |
|---|---|---|
| Project title | `00_Governance/00_01_Project_Charter.md` | ✅ |
| Problem statement | `00_Governance/00_01_Project_Charter.md` | ✅ |
| Objectives | `00_Governance/00_01_Project_Charter.md` (Goals) | ✅ |
| Team responsibilities | `00_Governance/00_01_Project_Charter.md` (Arush Mehta: Full-Stack Architecture, 3NF Relational DB, Multimodal AI Vision, Android Companion, Cloud Deployments) | ✅ |
| Technology stack | `docs/project_structure.md` | ✅ |
| Deliverables | `00_Governance/00_01_Project_Charter.md` (Scope) | ✅ |
| Gantt chart | `docs/implementation_plan.md` | ✅ |

---

### Section 2 — Database Design (6 marks)
| Criterion | Document / Implementation | Status |
|---|---|---|
| ER Diagram | `03_Data/03_01_Canonical_Data_Model.md` (Full 16-entity Mermaid ER diagram with PK/FK relationships) | ✅ |
| Minimum 4 primary entities | Users, FoodItems, Meals, MealItems, DailyLogs (5+) | ✅ |
| Minimum 3 relationships | users→meals, meals→meal_items, food_items→food_nutrients (multiple) | ✅ |
| Relational schema | `03_Data/03_01_Canonical_Data_Model.md` | ✅ |
| Primary keys on all tables | All 16 tables have PK defined | ✅ |
| Foreign keys defined | All FKs documented in canonical model | ✅ |
| Constraints (NOT NULL, UNIQUE, CHECK, DEFAULT) | All documented in canonical model | ✅ |
| 3NF normalization | Normalized: nutrients separated from food_items, serving sizes separate table | ✅ |
| Indexes | GIN index on `search_vector`, unique indexes documented | ✅ |

---

### Section 3 — Database Implementation (8 marks)
| Criterion | Implementation Location | Status |
|---|---|---|
| Database creation (8–10 tables) | 16 tables in canonical model | ✅ |
| CRUD Operations | `backend-api/src/controllers/` (auth, meals, foods, activity, profile) | ✅ |
| Joins | Dashboard & meal queries join users→daily_logs→meals→meal_items→food_items | ✅ |
| Aggregate Queries | Calorie sum per day, macro sums, daily log recalculations | ✅ |
| Views | `vw_user_daily_summary`, `vw_food_full` in `backend-api/prisma/setup_views_triggers.sql` | ✅ |
| Transactions | `POST /api/meals/analyze` & `sp_log_meal` atomic transactions | ✅ |
| Stored Procedure | `public.sp_log_meal` in `backend-api/prisma/setup_stored_procedure.sql` | ✅ |
| Trigger | 3 triggers defined and executed (`trg_update_search_vector`, `trg_update_daily_log`, `trg_set_updated_at`) | ✅ |
| ORM integration | Prisma ORM with Express.js (schema.prisma) | ✅ |

---

### Section 4 — Application Development (4 marks)
| Criterion | Document / Implementation | Status |
|---|---|---|
| Framework-based application | React (frontend) + Express.js (backend) + FastAPI (AI) | ✅ |
| Dashboard | Live web dashboard with SVG calorie gauge, Recharts, and meal log list | ✅ |
| Search & filtering | Full-text food search via `GET /api/foods/search?q=...` with debouncing | ✅ |
| Form validation | Zod validation on API endpoints, client-side input validation | ✅ |
| Exception handling | Centralized Express error handlers, graceful AI fallbacks | ✅ |
| Responsive UI | Modern warm food-style design with Tailwind CSS and glassmorphism | ✅ |

---

### Section 5 — Authentication, Authorization & Security (5 marks)
| Criterion | Document / Implementation | Status |
|---|---|---|
| Authentication (OAuth/JWT) | Google OAuth + JWT (API-001) + Dev login bypass for offline testing | ✅ |
| RBAC with single Users table | `role` column in `users` (`'admin'`, `'user'`) | ✅ |
| Minimum 2 roles | `admin` and `user` roles enforced in schema and auth | ✅ |
| Password hashing (BCrypt/Argon2) | BCrypt hash generated on user creation, stored in `password_hash` column | ✅ |
| SQL injection prevention | Parameterized queries via Prisma ORM and sanitized stored procedure calls | ✅ |
| Secrets management | `.env.example`, `.env` ignored in Git, internal inter-service auth token | ✅ |

> **Note on RBAC**: The `Users` table has a `role` column (`CHECK IN ('admin', 'user')`). The `admin` role can access protected admin features. All other routes are accessible to both roles.

> **Note on Password Hashing**: Handled via BCrypt hashing on user creation to satisfy university criteria while preserving seamless Google OAuth / Dev login.

---

### Section 6 — Professional Development Practices (5 marks)
| Criterion | Document / Implementation | Status |
|---|---|---|
| GitHub repository | GitHub repository (`doomsday-the/NutrivisionAI`) | ✅ |
| Minimum 10 meaningful commits | Continuous structured commit history with semantic commit messages | ✅ |
| Minimum 2 branches (main + dev) | Active `main` and `dev` branches synchronized | ✅ |
| Pull Requests (Recommended) | Feature merges documented and tracked | ✅ |
| README.md with description, install, stack, execution | `README.md` with stack, setup, seed, and run instructions | ✅ |
| `.gitignore` covering secrets | Rigorous `.gitignore` covering node_modules, .env, datasets, weights | ✅ |
| Docker & Docker Compose | Multi-container `docker-compose.yml` (`nutrivision-db`, `nutrivision-backend`, `nutrivision-ai`) | ✅ |
| Cloud deployment (Live URL) | Production: Web (https://nutrivision-ai-mu.vercel.app), Backend API (https://nutrivision-backend-i9x2.onrender.com), Companion APK (GitHub Releases) | ✅ |
| Database Backup & Recovery | Documented `pg_dump`/`pg_restore` procedure in `05_02_Backup_Recovery.md` | ✅ |

---

## Bonus Marks (+3 available)
| Feature | Bonus | Status |
|---|---|---|
| CI/CD Pipeline (GitHub Actions) | +1 | ✅ Automated backend testing (`ci.yml`) + Native Android APK release build (`build-apk.yml`) |
| Live Web Platform & Direct APK Release | +1 | ✅ Live production deployments on Vercel & Render with SSL + 1-Tap Companion APK |
| Additional best practice (Audit Logging) | +1 | ✅ `ai_match_log` table tracks all model inferences & user corrections |

---

## Assessment Action Items Status
| Item | Component | Current State |
|---|---|---|
| Relational DB & 3NF Schema | PostgreSQL | ✅ 16 normalized tables seeded |
| Stored Procedures & Triggers | Database Layer | ✅ `sp_log_meal` + 3 triggers active |
| SQL Views | Database Layer | ✅ `vw_user_daily_summary`, `vw_food_full` active |
| Multi-Model AI CV & Coach | AI Engine + Microservice | ✅ Google Gemini Multimodal Vision Cascade + Roboflow IndianFoodNet + MiDaS depth + NutriCoach |
| Full-Stack Web Application | Frontend + Backend | ✅ Vite React app + Express API operational |

