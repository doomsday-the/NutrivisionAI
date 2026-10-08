interface ProfileMeasurements {
  age: number;
  heightCm: number;
  weightKg: number;
}

const activityMultipliers: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const stepRecommendations: Record<string, number> = {
  sedentary: 7000,
  light: 8000,
  moderate: 9000,
  active: 10000,
  very_active: 10000,
};

export const calculateMifflinStJeorBmr = ({ age, heightCm, weightKg }: ProfileMeasurements): number => (
  (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5
);

export const calculateRecommendedCalorieTarget = (
  profile: ProfileMeasurements & { activityLevel: string | null; goal: string | null },
): number | null => {
  if (!profile.activityLevel || !profile.goal || !activityMultipliers[profile.activityLevel]) return null;

  const tdee = calculateMifflinStJeorBmr(profile) * activityMultipliers[profile.activityLevel];
  if (profile.goal === 'lose') return tdee - 300;
  if (profile.goal === 'gain') return tdee + 300;
  if (profile.goal === 'maintain') return tdee;
  return null;
};

export const calculateRecommendedSteps = (age: number | null, activityLevel: string | null): number | null => {
  if (age === null || !activityLevel || !stepRecommendations[activityLevel]) return null;

  const ageAdjustment = age >= 60 ? 1000 : 0;
  return Math.max(6000, stepRecommendations[activityLevel] - ageAdjustment);
};

export const estimateSleepCalories = (profile: ProfileMeasurements, sleepHours: number): number => (
  Math.round((calculateMifflinStJeorBmr(profile) / 24) * sleepHours * 0.9 * 100) / 100
);
