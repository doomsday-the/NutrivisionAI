import argparse
import csv
import json
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
    parser.add_argument('--source-file', required=True)
    parser.add_argument('--db-url', required=True)
    parser.add_argument('--dry-run', type=str, default='false')
    args = parser.parse_args()

    dry_run = args.dry_run.lower() == 'true'

    conn = get_db_connection(args.db_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    # Make sure source is created
    if not dry_run:
        cursor.execute("""
            INSERT INTO public.food_sources (source_name, source_url)
            VALUES ('ICMR-NIN IFCT 2017', 'https://www.nin.res.in/ebooks/IFCT2017.pdf')
            ON CONFLICT (source_name) DO UPDATE SET source_url = EXCLUDED.source_url
            RETURNING source_id;
        """)
        source_id = cursor.fetchone()['source_id']
    else:
        source_id = 1  # mock for dry-run

    # Get nutrient ids
    cursor.execute("SELECT nutrient_id, name FROM public.nutrient_types;")
    nutrients = {row['name']: row['nutrient_id'] for row in cursor.fetchall()}

    summary = {
        "source": "ICMR-NIN IFCT 2017",
        "total_rows": 0,
        "imported": 0,
        "skipped_duplicates": 0,
        "skipped_errors": 0,
        "errors": []
    }

    with open(args.source_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            summary["total_rows"] += 1
            food_name = row.get('Food_Name', '')
            if not food_name:
                summary["skipped_errors"] += 1
                summary["errors"].append({"row_id": row.get('IFCT_Code', 'unknown'), "reason": "Missing food name"})
                continue

            # determine food type
            lower_name = food_name.lower()
            if 'raw' in lower_name or 'ingredient' in lower_name:
                food_type = 'raw'
            elif any(x in lower_name for x in ['cooked', 'boiled', 'fried', 'roasted', 'grilled', 'baked']):
                food_type = 'cooked'
            elif 'milk' in lower_name or 'juice' in lower_name or 'tea' in lower_name:
                food_type = 'beverage'
            else:
                food_type = 'cooked'  # default

            external_id = row.get('IFCT_Code', '')

            if not dry_run:
                try:
                    cursor.execute("SAVEPOINT ifct_row_sp;")
                    cursor.execute("""
                        INSERT INTO public.food_items (external_id, source_id, name, food_type, reference_unit, is_verified)
                        VALUES (%s, %s, %s, %s, '100g', true)
                        ON CONFLICT (source_id, external_id) DO UPDATE SET name = EXCLUDED.name
                        RETURNING food_id;
                    """, (external_id, source_id, food_name, food_type))

                    food_id = cursor.fetchone()['food_id']

                    # Insert nutrients
                    nutrient_map = {
                        'energy': row.get('Energy (kcal)', '0'),
                        'protein': row.get('Protein (g)', '0'),
                        'carbohydrate': row.get('Carbohydrate (g)', '0'),
                        'fat': row.get('Fat (g)', '0'),
                        'fiber': row.get('Dietary Fibre (g)', '0'),
                        'sodium': row.get('Sodium (mg)', '0'),
                    }

                    for nut_name, val_str in nutrient_map.items():
                        if nut_name in nutrients and val_str is not None:
                            try:
                                val = float(str(val_str).strip())
                                cursor.execute("""
                                    INSERT INTO public.food_nutrients (food_id, nutrient_id, value_per_100g)
                                    VALUES (%s, %s, %s)
                                    ON CONFLICT (food_id, nutrient_id) DO UPDATE SET value_per_100g = EXCLUDED.value_per_100g;
                                """, (food_id, nutrients[nut_name], val))
                            except (ValueError, TypeError):
                                pass

                    cursor.execute("RELEASE SAVEPOINT ifct_row_sp;")
                    summary["imported"] += 1
                except Exception as e:
                    cursor.execute("ROLLBACK TO SAVEPOINT ifct_row_sp;")
                    summary["skipped_errors"] += 1
                    summary["errors"].append({"row_id": external_id, "reason": str(e)})
            else:
                summary["imported"] += 1

    if not dry_run:
        conn.commit()
    conn.close()

    print(json.dumps(summary, indent=2))

if __name__ == '__main__':
    main()
