import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
  goal: string;
  dietPreference: string;
  allergies?: string;
  medicalConditions?: string;
}

export interface MealPlanRequest {
  user: UserProfile;
  targetCalories: number;
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  days?: number;
}

export interface Meal {
  type: string;
  name: string;
  portions: string;
  calories: number;
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  allergens?: string[];
  tags?: string[];
}

export interface DayPlan {
  day: string;
  meals: Meal[];
}

export interface MealPlan {
  summary: {
    target_calories: number;
    macros: {
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    };
    notes?: string;
  };
  days: DayPlan[];
}

export interface GeneratePlanResponse {
  plan: MealPlan;
  fallback: boolean;
  error?: string;
}

/**
 * Generate a personalized meal plan using AI
 */
export async function generateMealPlan(
  request: MealPlanRequest
): Promise<GeneratePlanResponse> {
  const { data, error } = await supabase.functions.invoke('generate-plan', {
    body: {
      user: {
        name: request.user.name,
        age: request.user.age,
        gender: request.user.gender,
        height_cm: request.user.height,
        weight_kg: request.user.weight,
        activity_level: request.user.activityLevel,
        goal: request.user.goal,
        diet_preference: request.user.dietPreference,
        allergies: request.user.allergies?.split(',').map(a => a.trim()).filter(Boolean),
        medicalConditions: request.user.medicalConditions,
      },
      targetCalories: request.targetCalories,
      macros: request.macros,
      days: request.days || 7,
    },
  });

  if (error) {
    console.error('Error generating meal plan:', error);
    throw new Error(`Failed to generate meal plan: ${error.message}`);
  }

  return data as GeneratePlanResponse;
}
