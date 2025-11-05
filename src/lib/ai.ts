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
  dailyExclusions?: Record<string, string[]>;
  regenerationSeed?: string;
  previousMealNames?: string[];
  forceRegenerate?: boolean;
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
  ingredients?: string[];
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
      dailyExclusions: request.dailyExclusions,
      regenerationSeed: request.regenerationSeed,
      previousMealNames: request.previousMealNames,
      forceRegenerate: request.forceRegenerate,
    },
  });

  if (error) {
    console.error('Error generating meal plan:', error);
    throw new Error(`Failed to generate meal plan: ${error.message}`);
  }

  return data as GeneratePlanResponse;
}

/**
 * Swap a meal with alternatives
 */
export async function swapMeal(
  currentMeal: Meal,
  constraints: {
    dietType: string;
    allergens?: string[];
    medicalConditions?: string[];
  }
): Promise<Meal[]> {
  const { data, error } = await supabase.functions.invoke('swap-meal', {
    body: {
      currentMeal,
      constraints,
    },
  });

  if (error) {
    console.error('Error swapping meal:', error);
    throw new Error(`Failed to swap meal: ${error.message}`);
  }

  return data.alternatives as Meal[];
}

/**
 * Chat with AI for custom diet questions
 */
export async function askAI(
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  userContext?: {
    goal: string;
    dietType: string;
    targetCalories: number;
  }
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: {
      message,
      conversationHistory,
      userContext,
    },
  });

  if (error) {
    console.error('Error in AI chat:', error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }

  return data.reply as string;
}

/**
 * Parse daily exclusions from routine text
 */
export function parseDailyExclusions(routineText: string): Record<string, string[]> {
  if (!routineText) return {};
  
  const exclusions: Record<string, string[]> = {};
  const text = routineText.toLowerCase();
  
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const patterns = [
    /no\s+(\w+)\s+on\s+([\w\s,and]+)/gi,
    /avoid\s+(\w+)\s+on\s+([\w\s,and]+)/gi,
    /don't\s+eat\s+(\w+)\s+on\s+([\w\s,and]+)/gi,
    /skip\s+(\w+)\s+on\s+([\w\s,and]+)/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const food = match[1].trim();
      const daysText = match[2];
      
      const foundDays = daysOfWeek.filter(day => daysText.includes(day));
      
      for (const day of foundDays) {
        if (!exclusions[day]) {
          exclusions[day] = [];
        }
        if (!exclusions[day].includes(food)) {
          exclusions[day].push(food);
        }
      }
    }
  }
  
  return exclusions;
}
