import { DIET_TYPE_EXCLUSIONS, ALLERGEN_KEYWORDS, MEDICAL_CONDITION_GUIDELINES } from './constants.ts';

export interface MealItem {
  name: string;
  ingredients?: string[];
  type: string;
  portions: string;
  calories: number;
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

export interface ValidationConstraints {
  dietType?: string;
  allergens?: string[];
  medicalConditions?: string[];
  dailyExclusions?: Record<string, string[]>;
}

export interface ValidationResult {
  isValid: boolean;
  violations: string[];
}

/**
 * Validates a meal against dietary type restrictions
 */
export function validateDietType(meal: MealItem, dietType: string): ValidationResult {
  const violations: string[] = [];
  const exclusions = DIET_TYPE_EXCLUSIONS[dietType.toLowerCase()] || [];
  
  const mealText = `${meal.name} ${meal.ingredients?.join(' ') || ''}`.toLowerCase();
  
  for (const excludedItem of exclusions) {
    if (mealText.includes(excludedItem.toLowerCase())) {
      violations.push(`${dietType} diet excludes ${excludedItem}, but found in "${meal.name}"`);
    }
  }
  
  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Validates a meal against allergen restrictions
 */
export function validateAllergens(meal: MealItem, allergens: string[]): ValidationResult {
  const violations: string[] = [];
  const mealText = `${meal.name} ${meal.ingredients?.join(' ') || ''}`.toLowerCase();
  
  for (const allergen of allergens) {
    const keywords = ALLERGEN_KEYWORDS[allergen.toLowerCase()] || [allergen.toLowerCase()];
    
    for (const keyword of keywords) {
      if (mealText.includes(keyword)) {
        violations.push(`Allergen "${allergen}" found in "${meal.name}"`);
        break;
      }
    }
  }
  
  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Validates a meal against daily exclusions (e.g., "no eggs on Tuesday")
 */
export function validateDailyExclusions(
  meal: MealItem,
  dayOfWeek: string,
  dailyExclusions: Record<string, string[]>
): ValidationResult {
  const violations: string[] = [];
  const excludedItems = dailyExclusions[dayOfWeek.toLowerCase()] || [];
  const mealText = `${meal.name} ${meal.ingredients?.join(' ') || ''}`.toLowerCase();
  
  for (const excludedItem of excludedItems) {
    if (mealText.includes(excludedItem.toLowerCase())) {
      violations.push(`"${excludedItem}" is excluded on ${dayOfWeek}, but found in "${meal.name}"`);
    }
  }
  
  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Validates a meal against medical condition guidelines
 */
export function validateMedicalConditions(meal: MealItem, conditions: string[]): ValidationResult {
  const violations: string[] = [];
  const mealText = `${meal.name} ${meal.ingredients?.join(' ') || ''}`.toLowerCase();
  
  for (const condition of conditions) {
    const guidelines = MEDICAL_CONDITION_GUIDELINES[condition.toLowerCase()];
    if (!guidelines) continue;
    
    for (const avoidFood of guidelines.avoidFoods) {
      if (mealText.includes(avoidFood.toLowerCase())) {
        violations.push(`${condition} requires avoiding ${avoidFood}, but found in "${meal.name}"`);
      }
    }
  }
  
  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Comprehensive meal validation
 */
export function validateMeal(
  meal: MealItem,
  dayOfWeek: string,
  constraints: ValidationConstraints
): ValidationResult {
  const allViolations: string[] = [];
  
  // Validate diet type
  if (constraints.dietType) {
    const dietResult = validateDietType(meal, constraints.dietType);
    allViolations.push(...dietResult.violations);
  }
  
  // Validate allergens
  if (constraints.allergens && constraints.allergens.length > 0) {
    const allergenResult = validateAllergens(meal, constraints.allergens);
    allViolations.push(...allergenResult.violations);
  }
  
  // Validate daily exclusions
  if (constraints.dailyExclusions) {
    const exclusionResult = validateDailyExclusions(meal, dayOfWeek, constraints.dailyExclusions);
    allViolations.push(...exclusionResult.violations);
  }
  
  // Validate medical conditions
  if (constraints.medicalConditions && constraints.medicalConditions.length > 0) {
    const medicalResult = validateMedicalConditions(meal, constraints.medicalConditions);
    allViolations.push(...medicalResult.violations);
  }
  
  return {
    isValid: allViolations.length === 0,
    violations: allViolations
  };
}
