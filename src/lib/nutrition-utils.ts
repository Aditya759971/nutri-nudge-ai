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
    protein: Math.round(proteinCalories / 4), // 4 calories per gram
    carbs: Math.round(carbsCalories / 4), // 4 calories per gram
    fats: Math.round(fatsCalories / 9), // 9 calories per gram
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
