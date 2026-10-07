import argparse
import csv
import json
import sys
import os
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

    # Map USDA nutrient IDs to internal nutrient_types
    cursor.execute("SELECT nutrient_id, name FROM public.nutrient_types;")
    internal_nutrients = {row['name']: row['nutrient_id'] for row in cursor.fetchall()}
    
    # Read USDA nutrient.csv
    usda_to_internal_map = {}
    with open(os.path.join(args.source_dir, 'nutrient.csv'), 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            usda_name = row['name']
            usda_id = row['id']
            # mapping based on docs
            target = None
            if usda_name == 'Energy': target = 'energy'
            elif usda_name == 'Protein': target = 'protein'
            elif usda_name == 'Carbohydrate, by difference': target = 'carbohydrate'
            elif usda_name == 'Total lipid (fat)': target = 'fat'
            elif usda_name == 'Fiber, total dietary': target = 'fiber'
            elif usda_name == 'Sugars, total including NLEA': target = 'sugars'
            elif usda_name == 'Sodium, Na': target = 'sodium'
            
            if target and target in internal_nutrients:
                usda_to_internal_map[usda_id] = internal_nutrients[target]
                
    summary = {
        "source": "USDA FoodData Central",
        "total_rows": 0,
        "imported": 0,
        "skipped_duplicates": 0,
        "skipped_errors": 0,
        "errors": []
    }
    
    # Read food.csv
    foods = {}
    with open(os.path.join(args.source_dir, 'food.csv'), 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            summary["total_rows"] += 1
            foods[row['fdc_id']] = row['description']

    # We need to process food_nutrient.csv and group by fdc_id
    food_nutrients_data = {}
    with open(os.path.join(args.source_dir, 'food_nutrient.csv'), 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            fdc_id = row['fdc_id']
            usda_nut_id = row['nutrient_id']
            amount = row['amount']
            if usda_nut_id in usda_to_internal_map:
                if fdc_id not in food_nutrients_data:
                    food_nutrients_data[fdc_id] = {}
                food_nutrients_data[fdc_id][usda_to_internal_map[usda_nut_id]] = float(amount)
                
    for fdc_id, food_name in foods.items():
        if not dry_run:
            try:
                # determine food type
                lower_name = food_name.lower()
                if 'raw' in lower_name or 'ingredient' in lower_name:
                    food_type = 'raw'
                elif any(x in lower_name for x in ['cooked', 'boiled', 'fried', 'roasted', 'grilled', 'baked']):
                    food_type = 'cooked'
                elif 'milk' in lower_name or 'juice' in lower_name or 'tea' in lower_name:
                    food_type = 'beverage'
                else:
                    food_type = 'packaged' # default for USDA MVP
                
                cursor.execute("""
                    INSERT INTO public.food_items (external_id, source_id, name, food_type, reference_unit, is_verified)
                    VALUES (%s, %s, %s, %s, '100g', true)
                    ON CONFLICT DO NOTHING
                    RETURNING food_id;
                """, (fdc_id, source_id, food_name, food_type))
                
                res = cursor.fetchone()
                if res is None:
                    # check if we skipped duplicate
                    cursor.execute("SELECT food_id, source_id FROM public.food_items WHERE name = %s;", (food_name,))
                    existing = cursor.fetchone()
                    if existing and existing['source_id'] < source_id: # IFCT takes precedence
                        summary["skipped_duplicates"] += 1
                        continue

                cursor.execute("SELECT food_id FROM public.food_items WHERE external_id = %s AND source_id = %s;", (fdc_id, source_id))
                res = cursor.fetchone()
                if res:
                    food_id = res['food_id']
                    if fdc_id in food_nutrients_data:
                        for nut_id, val in food_nutrients_data[fdc_id].items():
                            cursor.execute("""
                                INSERT INTO public.food_nutrients (food_id, nutrient_id, value_per_100g)
                                VALUES (%s, %s, %s)
                                ON CONFLICT (food_id, nutrient_id) DO UPDATE SET value_per_100g = EXCLUDED.value_per_100g;
                            """, (food_id, nut_id, val))
                summary["imported"] += 1
            except Exception as e:
                conn.rollback()
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
