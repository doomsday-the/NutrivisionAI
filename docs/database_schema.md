# ⚠️ DEPRECATED — Do Not Use for Implementation

This file has been superseded by **[03_01_Canonical_Data_Model.md](./03_Data/03_01_Canonical_Data_Model.md)**.

It is retained only for historical reference. All Builders must use the canonical model. Key differences:
- This file incorrectly includes `password_hash` on `Users` (contradicts ADR-003: Google OAuth only).
- This file uses a flat `FOODS` table. The canonical model uses the normalized `food_items` + `food_nutrients` structure.
- This file does not include staging tables, `ai_match_log`, `food_sources`, or `food_categories`.

---


## Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o| PROFILES : "has"
    USERS ||--o{ MEALS : "logs"
    USERS ||--o{ DAILY_LOGS : "tracks"
    USERS ||--o{ RECOMMENDATIONS : "receives"
    
    MEALS ||--o{ MEAL_ITEMS : "contains"
    FOODS ||--o{ MEAL_ITEMS : "included in"
    
    USERS {
        uuid id PK
        string email UK
        string password_hash
        string role "Admin/User"
        datetime created_at
    }
    
    PROFILES {
        uuid id PK
        uuid user_id FK
        int age
        float height_cm
        float weight_kg
        string activity_level
    }
    
    FOODS {
        uuid id PK
        string name
        float calories_per_100g
        float protein_g
        float carbs_g
        float fat_g
    }
    
    MEALS {
        uuid id PK
        uuid user_id FK
        string image_url
        string meal_type "Breakfast/Lunch/Dinner/Snack"
        float total_calories
        datetime logged_at
    }
    
    MEAL_ITEMS {
        uuid id PK
        uuid meal_id FK
        uuid food_id FK
        float quantity_grams
        float estimated_calories
    }
    
    DAILY_LOGS {
        uuid id PK
        uuid user_id FK
        date log_date
        float total_calories
        float total_protein
        float target_calories
    }
    
    RECOMMENDATIONS {
        uuid id PK
        uuid user_id FK
        string ai_message
        datetime created_at
    }
    
    AUDIT_LOGS {
        uuid id PK
        string table_name
        string action
        datetime timestamp
    }
```

## Compliance Checklist (Based on PDF)
- [x] **Relational DB**: PostgreSQL.
- [x] **Primary Entities**: Users, Meals, Foods, Logs (4+ entities).
- [x] **Relationships**: 1:1, 1:N, M:N resolved via `MealItems` (3+ relationships).
- [x] **8 Tables Minimum**: Users, Profiles, Foods, Meals, MealItems, DailyLogs, Recommendations, AuditLogs.
- [x] **Single User Table**: `Users` uses `role` column (no separate Admin/Student tables).
- [x] **Normalization**: 3NF applied. M:N relationship between Meals and Foods is broken down by the `MealItems` junction table.
- [x] **Advanced Features Planned**: `AuditLogs` will be populated using an SQL **Trigger**, fulfilling the trigger requirement.
