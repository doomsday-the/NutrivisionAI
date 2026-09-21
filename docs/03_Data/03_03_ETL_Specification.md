# 03_03 ETL Pipeline Specification

**Purpose**: Defines how raw data from ICMR-NIN IFCT 2017 and USDA FoodData Central is extracted, transformed, and loaded into the `public` schema tables.

**Implementer**: Python scripts in `ai-service/etl/`. These scripts run as one-time offline jobs, not as part of the live API.

---

## Source Formats

### ICMR-NIN IFCT 2017 (Primary)
- **Official reference**: [https://www.nin.res.in/ebooks/IFCT2017.pdf](https://www.nin.res.in/ebooks/IFCT2017.pdf)
- **Coverage**: 528 Indian foods, ~160 nutrient constituents.
- **Practical format**: The PDF does not provide a structured CSV directly. The ETL approach is:
  1. Use the community-derived CSV extract of IFCT 2017 as the source file (`ifct2017.csv`).
  2. Alternatively, manually curate a CSV for the priority food list (see below) if no clean extract is available.
- **Priority foods for MVP** (minimum viable seed set — must all be present before first demo):
  - Rice (raw), Rice (cooked/boiled), Roti (wheat), Dal (cooked), Paneer, Chicken (grilled), Egg (boiled), Dosa, Idli, Biryani (chicken), Curd, Ghee, Milk (cow's), Rajma (cooked), Chana (cooked)

### USDA FoodData Central (Secondary)
- **Source**: Download `FoodData_Central_csv_YYYY-MM-DD.zip` from [https://fdc.nal.usda.gov/download-datasets.html](https://fdc.nal.usda.gov/download-datasets.html)
- **Files used**: `food.csv`, `food_nutrient.csv`, `nutrient.csv`
- **Priority foods for MVP** (minimum viable seed set):
  - Pizza (cheese), Burger (beef), Pasta (cooked), Oats (cooked), Bread (white), Apple, Banana, Chicken breast (grilled), Almonds, Yogurt (plain)

---

## Nutrient Mapping

The following IFCT/USDA nutrient names must be mapped to NutriVision's `nutrient_types` table. Rows in this table are seeded **before** ETL runs.

| `nutrient_id` | NutriVision Name | IFCT Column Name | USDA Nutrient Name |
|---|---|---|---|
| 1 | Energy | `Energy (kcal)` | `Energy` (unit: kcal) |
| 2 | Protein | `Protein (g)` | `Protein` |
| 3 | Total Carbohydrate | `Carbohydrate (g)` | `Carbohydrate, by difference` |
| 4 | Total Fat | `Fat (g)` | `Total lipid (fat)` |
| 5 | Dietary Fiber | `Dietary Fibre (g)` | `Fiber, total dietary` |
| 6 | Total Sugars | `Total Sugars (g)` | `Sugars, total including NLEA` |
| 7 | Sodium | `Sodium (mg)` | `Sodium, Na` |

Any nutrient in the source not in this table is ignored during MVP ETL.

---

## Food State Encoding

The `food_type` column in `food_items` must be set according to these rules:

| Condition | `food_type` value |
|---|---|
| Name contains "raw" or is an uncooked ingredient | `raw` |
| Name contains "cooked", "boiled", "fried", "roasted", "grilled", "baked" | `cooked` |
| Name is a packaged/branded product | `packaged` |
| Name is a liquid (milk, juice, tea) | `beverage` |
| Default if none of the above match | `cooked` (safer default for IFCT data) |

**De-duplication rule**: If both IFCT and USDA contain an entry for the same food in the same state (e.g., both have "Chicken, cooked"), the **IFCT record takes precedence** (lower `source_id` wins). The USDA record is skipped. Log the skip at DEBUG level.

---

## ETL Script Contract

Each ETL script must accept the following CLI arguments and produce the following output:

```bash
python etl/load_ifct.py --source-file ifct2017.csv --db-url $DATABASE_URL --dry-run false
python etl/load_usda.py --source-dir ./usda_csv/ --db-url $DATABASE_URL --dry-run false
```

On completion, each script must print a JSON summary to stdout:
```json
{
  "source": "ICMR-NIN IFCT 2017",
  "total_rows": 528,
  "imported": 510,
  "skipped_duplicates": 8,
  "skipped_errors": 10,
  "errors": [
    { "row_id": "IFCT-042", "reason": "Missing energy value" }
  ]
}
```

`--dry-run true` must execute all parsing and validation but write nothing to the database.
