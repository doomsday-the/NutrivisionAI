# 01_01 Functional Requirements

## FR-001: User Authentication
- **Description**: Users must authenticate using their Google accounts.
- **Actors**: User
- **Inputs**: Google OAuth Token
- **Outputs**: Application JWT, User Profile Data
- **Behavior**: System validates the Google token, creates or fetches the user in the `Users` table, and returns a session JWT.
- **Constraints**: Strictly Google OAuth. No email/password registration.

## FR-002: Meal Image Upload
- **Description**: Users can upload a picture of their meal for analysis.
- **Actors**: User
- **Inputs**: Image file (JPEG/PNG)
- **Outputs**: Nutritional breakdown (Calories, Macros)
- **Behavior**: Image is sent via Node.js API to the Python AI service.

## FR-003: AI Food Detection (Mock & Future)
- **Description**: The AI engine processes the meal image and identifies food items.
- **Actors**: Python AI Service
- **Inputs**: Image file
- **Outputs**: JSON array of detected foods and confidence scores.
- **Behavior**: Initially returns a hardcoded mock JSON mapping to valid IFCT/USDA `food_id`s. Eventually, runs inference via YOLO/MobileNet.
- **Constraints**: Must run within free-tier hardware limitations (CPU inference).

## FR-004: Nutritional Logging
- **Description**: Detected meals are stored in the user's daily log.
- **Actors**: Node.js API
- **Inputs**: Detected `food_id`s, quantities
- **Outputs**: Saved `Meals` and `MealItems` records.
- **Behavior**: System calculates total calories/macros based on the dual-source DB (handling raw vs cooked states) and updates the user's daily summary.

## FR-005: WearOS Activity Sync
- **Description**: The smartwatch app pushes user activity data to the backend.
- **Actors**: WearOS App
- **Inputs**: Steps, Active Calories Burned
- **Outputs**: Updated Daily Goals
- **Behavior**: Bi-directional sync. Steps are pushed to the database, offsetting the consumed calories and updating the "Remaining Calories" metric on both the watch and web dashboard.
