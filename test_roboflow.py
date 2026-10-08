import base64
import requests

api_key = "R6ctDFt29vNejksIHIOC"
image_path = r"c:\Users\Arush Mehta\Documents\NutritionDB\images\Dosa-Recipe-Step-By-Step-Instructions-scaled.jpg"

with open(image_path, "rb") as image_file:
    encoded_string = base64.b64encode(image_file.read()).decode("ascii")

success = False
for endpoint in ["detect", "classify", "outline"]:
    if success: break
    for version in range(1, 6):
        url = f"https://{endpoint}.roboflow.com/indianfoodnet/{version}"
        params = {
            "api_key": api_key,
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        print(f"Trying {endpoint} version {version}...")
        try:
            response = requests.post(url, params=params, data=encoded_string, headers=headers)
            if response.status_code == 200:
                print(f"Success on {endpoint} version {version}!")
                print(response.json())
                success = True
                break
            elif response.status_code in [404, 400]:
                print(f"Failed on {endpoint} v{version}: {response.status_code} {response.text}")
            elif response.status_code == 403:
                print(f"API key invalid or insufficient permissions: {response.text}")
                success = True
                break
            else:
                print(f"Error {response.status_code} on {endpoint} v{version}: {response.text}")
        except Exception as e:
            print(f"Exception on {endpoint} v{version}: {e}")
