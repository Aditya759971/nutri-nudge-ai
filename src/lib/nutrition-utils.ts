export interface MacroTargets {
  protein: number;
  carbs: number;
  fats: number;
  proteinCalories: number;
  carbsCalories: number;
  fatsCalories: number;
}

export interface WeightEntry {
  date: string;
  weight: number;
  timestamp: number;
}

export function getBMIStatus(bmi: number): {
  status: string;
  color: string;
  description: string;
} {
  if (bmi < 18.5) {
    return {
      status: "Underweight",
      color: "text-blue-600",
      description: "Below healthy weight range"
    };
  } else if (bmi >= 18.5 && bmi < 25) {
    return {
      status: "Healthy Weight",
      color: "text-green-600",
      description: "Within healthy weight range"
    };
  } else if (bmi >= 25 && bmi < 30) {
    return {
      status: "Overweight",
      color: "text-yellow-600",
      description: "Above healthy weight range"
    };
  } else {
    return {
      status: "Obese",
      color: "text-red-600",
      description: "Significantly above healthy range"
    };
  }
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 * Men: BMR = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
 * Women: BMR = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
 */
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: string
): number {
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? baseBMR + 5 : baseBMR - 161;
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * Applies activity multiplier to BMR
 */
export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    'very-active': 1.725,
    'extra-active': 1.9,
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.5));
}

/**
 * Calculate target calories based on goal
 */
export function calculateTargetCalories(tdee: number, goal: string): number {
  switch (goal) {
    case 'weight-loss':
      return Math.round(tdee - 500); // 500 calorie deficit
    case 'muscle-gain':
      return Math.round(tdee + 300); // 300 calorie surplus
    case 'maintenance':
    default:
      return tdee;
  }
}

/**
 * Calculate macro targets based on weight and goal
 * Uses protein per kg body weight and percentage-based distribution
 */
export function calculateMacrosForGoal(
  targetCalories: number,
  weight: number,
  goal: string
): MacroTargets {
  // Protein: 1.6-2.2g per kg (we use 1.8 for weight loss/maintenance, 2.0 for gain)
  let proteinGramsPerKg = 1.8;
  let fatPercent = 0.25; // 25% of calories from fat

  if (goal === 'muscle-gain') {
    proteinGramsPerKg = 2.0;
    fatPercent = 0.25;
  } else if (goal === 'weight-loss') {
    proteinGramsPerKg = 2.0; // Higher protein for weight loss to preserve muscle
    fatPercent = 0.25;
  }

  // Calculate protein grams
  const protein = Math.round(weight * proteinGramsPerKg / 5) * 5; // Round to nearest 5g
  const proteinCalories = protein * 4;

  // Calculate fat grams
  const fatsCalories = targetCalories * fatPercent;
  const fats = Math.round(fatsCalories / 9 / 5) * 5; // Round to nearest 5g

  // Remaining calories go to carbs
  const carbsCalories = targetCalories - proteinCalories - (fats * 9);
  const carbs = Math.round(carbsCalories / 4 / 5) * 5; // Round to nearest 5g

  return {
    protein,
    carbs,
    fats,
    proteinCalories,
    carbsCalories,
    fatsCalories: fats * 9,
  };
}

export function calculateMacroTargets(
  dailyCalories: number,
  goal: string
): MacroTargets {
  let proteinPercent = 0.30;
  let carbsPercent = 0.40;
  let fatsPercent = 0.30;

  switch (goal) {
    case 'weight-loss':
      proteinPercent = 0.40;
      carbsPercent = 0.30;
      fatsPercent = 0.30;
      break;
    case 'muscle-gain':
      proteinPercent = 0.30;
      carbsPercent = 0.40;
      fatsPercent = 0.30;
      break;
    case 'maintenance':
    case 'diabetes':
    case 'pcos':
      proteinPercent = 0.30;
      carbsPercent = 0.40;
      fatsPercent = 0.30;
      break;
    case 'clean-eating':
      proteinPercent = 0.25;
      carbsPercent = 0.45;
      fatsPercent = 0.30;
      break;
  }

  const proteinCalories = dailyCalories * proteinPercent;
  const carbsCalories = dailyCalories * carbsPercent;
  const fatsCalories = dailyCalories * fatsPercent;

  return {
    protein: Math.round(proteinCalories / 4),
    carbs: Math.round(carbsCalories / 4),
    fats: Math.round(fatsCalories / 9),
    proteinCalories,
    carbsCalories,
    fatsCalories,
  };
}

export function getWeightHistory(): WeightEntry[] {
  const stored = localStorage.getItem('weightHistory');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveWeightHistory(history: WeightEntry[]): void {
  localStorage.setItem('weightHistory', JSON.stringify(history));
}

export function initializeWeightHistory(initialWeight: number): void {
  const existing = getWeightHistory();
  if (existing.length === 0) {
    const initialEntry: WeightEntry = {
      date: new Date().toISOString(),
      weight: initialWeight,
      timestamp: Date.now(),
    };
    saveWeightHistory([initialEntry]);
  }
}

export function addWeightEntry(weight: number): void {
  const history = getWeightHistory();
  const newEntry: WeightEntry = {
    date: new Date().toISOString(),
    weight,
    timestamp: Date.now(),
  };
  history.push(newEntry);
  saveWeightHistory(history);
}

export function getLatestWeight(): number | null {
  const history = getWeightHistory();
  if (history.length === 0) return null;
  return history[history.length - 1].weight;
}

export function getStartingWeight(): number | null {
  const history = getWeightHistory();
  if (history.length === 0) return null;
  return history[0].weight;
}
