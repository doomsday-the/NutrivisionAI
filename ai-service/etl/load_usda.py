import argparse
import csv
import json
import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from urllib.parse import urlparse

def get_db_connection(db_url):
    result = urlparse(db_url)
    username = result.username
    password = result.password
    database = result.path[1:]
    hostname = result.hostname
    port = result.port
    return psycopg2.connect(
        database=database,
        user=username,
        password=password,
        host=hostname,
        port=port
    )

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-dir', required=True)
    parser.add_argument('--db-url', required=True)
    parser.add_argument('--dry-run', type=str, default='false')
    args = parser.parse_args()

    dry_run = args.dry_run.lower() == 'true'

    conn = get_db_connection(args.db_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    # 1. Register USDA FoodData Central in food_sources
    if not dry_run:
        cursor.execute("""
            INSERT INTO public.food_sources (source_name, source_url)
            VALUES ('USDA FoodData Central', 'https://fdc.nal.usda.gov/')
            ON CONFLICT (source_name) DO UPDATE SET source_url = EXCLUDED.source_url
            RETURNING source_id;
        """)
        source_id = cursor.fetchone()['source_id']
    else:
        source_id = 2

    # 2. Map internal nutrient_types
    cursor.execute("SELECT nutrient_id, name FROM public.nutrient_types;")
    internal_nutrients = {row['name']: row['nutrient_id'] for row in cursor.fetchall()}

    # Standard USDA nutrient ID to internal name mapping
    static_usda_map = {
        '1008': 'energy',
        '1003': 'protein',
        '1004': 'fat',
        '1005': 'carbohydrate',
        '1079': 'fiber',
        '1093': 'sodium',
        '2000': 'sugars',
    }

    usda_to_internal_map = {}
    for usda_id, nut_name in static_usda_map.items():
        if nut_name in internal_nutrients:
            usda_to_internal_map[usda_id] = internal_nutrients[nut_name]

    # Optionally augment with nutrient.csv if present
    nutrient_csv_path = os.path.join(args.source_dir, 'nutrient.csv')
    if os.path.exists(nutrient_csv_path):
        with open(nutrient_csv_path, 'r', encoding='utf-8') as f:
            for row in csv.DictReader(f):
                usda_id = row.get('id')
                usda_name = row.get('name', '')
                target = None
                if usda_name == 'Energy': target = 'energy'
                elif usda_name == 'Protein': target = 'protein'
                elif usda_name == 'Carbohydrate, by difference': target = 'carbohydrate'
                elif usda_name == 'Total lipid (fat)': target = 'fat'
                elif usda_name == 'Fiber, total dietary': target = 'fiber'
                elif usda_name == 'Sugars, total including NLEA': target = 'sugars'
                elif usda_name == 'Sodium, Na': target = 'sodium'

                if target and target in internal_nutrients and usda_id:
                    usda_to_internal_map[str(usda_id)] = internal_nutrients[target]

    summary = {
        "source": "USDA FoodData Central",
        "total_rows": 0,
        "imported": 0,
        "skipped_duplicates": 0,
        "skipped_errors": 0,
        "errors": []
    }

    # 3. Read food_nutrient.csv and index by fdc_id
    food_nutrients_data = {}
    food_nutrient_csv_path = os.path.join(args.source_dir, 'food_nutrient.csv')
    if os.path.exists(food_nutrient_csv_path):
        with open(food_nutrient_csv_path, 'r', encoding='utf-8') as f:
            for row in csv.DictReader(f):
                fdc_id = str(row.get('fdc_id', '')).strip()
                usda_nut_id = str(row.get('nutrient_id', '')).strip()
                amount_str = row.get('amount')
                if not fdc_id or not usda_nut_id or amount_str is None:
                    continue

                if usda_nut_id in usda_to_internal_map:
                    try:
                        amount = float(amount_str)
                        if fdc_id not in food_nutrients_data:
                            food_nutrients_data[fdc_id] = {}
                        food_nutrients_data[fdc_id][usda_to_internal_map[usda_nut_id]] = amount
                    except (ValueError, TypeError):
                        pass

    # 4. Read food.csv and upsert into food_items + food_nutrients
    food_csv_path = os.path.join(args.source_dir, 'food.csv')
    if not os.path.exists(food_csv_path):
        raise FileNotFoundError(f"Missing {food_csv_path}")

    with open(food_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            summary["total_rows"] += 1
            fdc_id = str(row.get('fdc_id', '')).strip()
            food_name = row.get('description', '') or row.get('name', '')
            if not fdc_id or not food_name:
                summary["skipped_errors"] += 1
                summary["errors"].append({"row_id": fdc_id or 'unknown', "reason": "Missing fdc_id or description"})
                continue

            # Determine food_type
            lower_name = food_name.lower()
            if 'raw' in lower_name or 'ingredient' in lower_name:
                food_type = 'raw'
            elif any(x in lower_name for x in ['cooked', 'boiled', 'fried', 'roasted', 'grilled', 'baked']):
                food_type = 'cooked'
            elif 'milk' in lower_name or 'juice' in lower_name or 'tea' in lower_name or 'beverage' in lower_name:
                food_type = 'beverage'
            else:
                food_type = 'packaged'

            if not dry_run:
                try:
                    cursor.execute("SAVEPOINT usda_row_sp;")
                    cursor.execute("""
                        INSERT INTO public.food_items (external_id, source_id, name, food_type, reference_unit, is_verified)
                        VALUES (%s, %s, %s, %s, '100g', true)
                        ON CONFLICT (source_id, external_id) DO UPDATE SET name = EXCLUDED.name
                        RETURNING food_id;
                    """, (fdc_id, source_id, food_name, food_type))

                    food_id = cursor.fetchone()['food_id']

                    # Insert nutrients
                    if fdc_id in food_nutrients_data:
                        for nut_id, val in food_nutrients_data[fdc_id].items():
                            cursor.execute("""
                                INSERT INTO public.food_nutrients (food_id, nutrient_id, value_per_100g)
                                VALUES (%s, %s, %s)
                                ON CONFLICT (food_id, nutrient_id) DO UPDATE SET value_per_100g = EXCLUDED.value_per_100g;
                            """, (food_id, nut_id, val))

                    cursor.execute("RELEASE SAVEPOINT usda_row_sp;")
                    summary["imported"] += 1
                except Exception as e:
                    cursor.execute("ROLLBACK TO SAVEPOINT usda_row_sp;")
                    summary["skipped_errors"] += 1
                    summary["errors"].append({"row_id": fdc_id, "reason": str(e)})
            else:
                summary["imported"] += 1

    if not dry_run:
        conn.commit()
    conn.close()

    print(json.dumps(summary, indent=2))

if __name__ == '__main__':
    main()
