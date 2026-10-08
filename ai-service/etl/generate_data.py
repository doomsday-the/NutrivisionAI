import csv
import random
import os

def generate_ifct():
    base_foods = [
        ("Rice", "Cereals", 130, 2.7, 0.3, 28.0, 0.4, 1),
        ("Roti", "Cereals", 297, 9.0, 3.5, 58.0, 4.0, 150),
        ("Dal", "Pulses", 116, 9.0, 0.4, 20.0, 8.0, 200),
        ("Paneer", "Dairy", 265, 18.0, 20.0, 1.2, 0.0, 18),
        ("Chicken", "Meat", 239, 27.0, 14.0, 0.0, 0.0, 82),
        ("Egg", "Egg", 155, 13.0, 11.0, 1.1, 0.0, 124),
        ("Dosa", "Cereals", 168, 3.9, 3.7, 29.0, 0.9, 94),
        ("Idli", "Cereals", 58, 1.6, 0.4, 12.0, 1.5, 35),
        ("Biryani", "Mixed", 293, 13.0, 9.0, 39.0, 1.5, 400),
        ("Curd", "Dairy", 98, 11.0, 4.3, 3.4, 0.0, 36),
        ("Fish", "Meat", 200, 20.0, 10.0, 0.0, 0.0, 70),
        ("Mutton", "Meat", 295, 25.0, 21.0, 0.0, 0.0, 80),
        ("Potato", "Vegetables", 86, 1.6, 0.1, 20.0, 1.8, 5),
        ("Tomato", "Vegetables", 18, 0.9, 0.2, 3.9, 1.2, 5),
        ("Onion", "Vegetables", 40, 1.1, 0.1, 9.0, 1.7, 4),
        ("Spinach", "Vegetables", 23, 2.9, 0.4, 3.6, 2.2, 79),
        ("Carrot", "Vegetables", 41, 0.9, 0.2, 9.6, 2.8, 69),
        ("Apple", "Fruits", 52, 0.3, 0.2, 14.0, 2.4, 1),
        ("Banana", "Fruits", 89, 1.1, 0.3, 23.0, 2.6, 1),
        ("Orange", "Fruits", 47, 0.9, 0.1, 12.0, 2.4, 0),
    ]

    variants = [
        "Boiled", "Fried", "Roasted", "Grilled", "Baked", "Curry", "Spicy", "Sweet", "Raw", "Steamed",
        "Mashed", "Tikka", "Masala", "Kebab", "Soup", "Salad", "Pickled", "Smoked", "Dry", "Gravy",
        "Special", "Homestyle", "Restaurant Style", "Premium", "Organic", "Farm Fresh"
    ]

    out_file = 'data/ifct2017.csv'
    headers = ['IFCT_Code','Food_Name','Food_Group','Energy (kcal)','Protein (g)','Fat (g)','Carbohydrate (g)','Dietary Fibre (g)','Sodium (mg)']
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    with open(out_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        
        count = 1
        for base in base_foods:
            name, grp, e, p, ft, c, fb, s = base
            writer.writerow([f'IFCT-{count:04d}', name, grp, e, p, ft, c, fb, s])
            count += 1
            
            for v in variants:
                em = random.uniform(0.8, 1.5)
                writer.writerow([
                    f'IFCT-{count:04d}', 
                    f'{name} ({v})', 
                    grp, 
                    round(e * em), 
                    round(p * em, 1), 
                    round(ft * em, 1), 
                    round(c * em, 1), 
                    round(fb * em, 1), 
                    round(s * em, 1)
                ])
                count += 1

def generate_usda():
    base_foods = [
        ("Pizza", 1, 266, 11.4, 9.8, 33.3, 2.3, 598),
        ("Burger", 1, 295, 14.0, 14.0, 24.0, 1.0, 400),
        ("Pasta", 1, 131, 5.0, 1.1, 25.0, 1.2, 6),
        ("Oats", 1, 68, 2.4, 1.4, 12.0, 1.7, 49),
        ("Bread", 1, 265, 9.0, 3.2, 49.0, 2.7, 491),
        ("Almonds", 1, 579, 21.1, 49.9, 21.6, 12.5, 1),
        ("Yogurt", 1, 61, 3.5, 3.3, 4.7, 0.0, 46),
        ("Cheese", 1, 402, 25.0, 33.0, 1.3, 0.0, 621),
        ("Bacon", 1, 541, 37.0, 42.0, 1.4, 0.0, 1717),
        ("Sausage", 1, 301, 12.0, 27.0, 1.5, 0.0, 848),
        ("Ice Cream", 1, 207, 3.5, 11.0, 24.0, 0.7, 80),
        ("Chocolate", 1, 546, 4.9, 31.0, 61.0, 7.0, 24),
        ("Peanut Butter", 1, 588, 25.0, 50.0, 20.0, 6.0, 17),
        ("Walnuts", 1, 654, 15.2, 65.2, 13.7, 6.7, 2),
        ("Milk", 1, 42, 3.4, 1.0, 5.0, 0.0, 44),
        ("Tofu", 1, 76, 8.0, 4.8, 1.9, 0.3, 7),
        ("Soy Milk", 1, 33, 2.9, 1.5, 1.8, 0.2, 47),
        ("Pork", 1, 242, 27.0, 14.0, 0.0, 0.0, 62),
        ("Beef", 1, 250, 26.0, 15.0, 0.0, 0.0, 72),
        ("Turkey", 1, 189, 29.0, 7.0, 0.0, 0.0, 68),
    ]

    variants = [
        "Light", "Extra", "Classic", "Spicy", "Mild", "Low Fat", "Full Fat", "Sugar Free",
        "Gluten Free", "Vegan", "Original", "Premium", "Value", "Gourmet", "Artisan",
        "Homestyle", "Smoked", "Roasted", "Fried", "Baked", "Grilled", "Crispy", "Tender",
        "Juicy", "Fresh", "Frozen"
    ]

    nutrients = {
        '1008': 2, # energy idx 2
        '1003': 3, # protein idx 3
        '1004': 4, # fat idx 4
        '1005': 5, # carb idx 5
        '1079': 6, # fiber idx 6
        '1093': 7, # sodium idx 7
    }

    food_out = 'usda_csv/food.csv'
    nut_out = 'usda_csv/food_nutrient.csv'
    os.makedirs(os.path.dirname(food_out), exist_ok=True)

    with open(food_out, 'w', newline='', encoding='utf-8') as ff, open(nut_out, 'w', newline='', encoding='utf-8') as nf:
        fw = csv.writer(ff)
        fw.writerow(['fdc_id','data_type','description','food_category_id','publication_date'])
        
        nw = csv.writer(nf)
        nw.writerow(['fdc_id','nutrient_id','amount'])

        count = 10001
        for base in base_foods:
            name = base[0]
            cat = base[1]
            fw.writerow([count, 'branded', name, cat, '2024-04-18'])
            for nut_id, idx in nutrients.items():
                nw.writerow([count, nut_id, base[idx]])
            count += 1
            
            for v in variants:
                em = random.uniform(0.8, 1.5)
                fw.writerow([count, 'branded', f'{name} ({v})', cat, '2024-04-18'])
                for nut_id, idx in nutrients.items():
                    nw.writerow([count, nut_id, round(base[idx] * em, 1)])
                count += 1

if __name__ == '__main__':
    generate_ifct()
    generate_usda()
    print("Generated 500+ mock records for IFCT and USDA.")
