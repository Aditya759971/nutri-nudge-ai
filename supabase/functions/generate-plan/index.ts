// Deno edge function runtime
import { validateMeal, type ValidationConstraints } from '../_shared/validators.ts';
import { parseDailyExclusions, extractPreferences, parseRoutineWithAI } from '../_shared/exclusion-parser.ts';
import { DIET_TYPE_EXCLUSIONS } from '../_shared/constants.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserProfile {
  name: string;
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  activity_level: string;
  goal: string;
  diet_preference: string;
  allergies?: string[];
  conditions?: string[];
  medicalConditions?: string;
  routine?: string;
}

interface GeneratePlanRequest {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, targetCalories, macros, days = 7, dailyExclusions: providedExclusions, regenerationSeed, previousMealNames }: GeneratePlanRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Parse daily exclusions from routine if provided
    let dailyExclusions = providedExclusions || {};
    let preferences = { preferredFoods: [], mealFrequency: {} };
    
    if (user.routine) {
      console.log('Parsing routine:', user.routine);
      
      // Try rule-based parser first
      const ruleBasedExclusions = parseDailyExclusions(user.routine);
      const ruleBasedPreferences = extractPreferences(user.routine);
      
      // If routine is complex and rule-based found nothing, try AI
      if (user.routine.length > 50 && Object.keys(ruleBasedExclusions).length === 0) {
        console.log('Attempting AI-based routine parsing...');
        try {
          const aiParsed = await parseRoutineWithAI(user.routine, LOVABLE_API_KEY);
          dailyExclusions = { ...ruleBasedExclusions, ...aiParsed.exclusions };
          preferences = aiParsed.preferences;
        } catch (e) {
          console.log('AI routine parsing failed, using rule-based only:', e);
          dailyExclusions = ruleBasedExclusions;
          preferences = ruleBasedPreferences;
        }
      } else {
        dailyExclusions = ruleBasedExclusions;
        preferences = ruleBasedPreferences;
      }
      
      console.log('Parsed exclusions:', dailyExclusions);
      console.log('Parsed preferences:', preferences);
    }

    // Build allergy and condition strings
    const allergyList = user.allergies?.join(', ') || 'none';
    const conditionsList = user.conditions?.join(', ') || user.medicalConditions || 'none';

    // Build forbidden foods list based on diet type
    const forbiddenFoods = DIET_TYPE_EXCLUSIONS[user.diet_preference?.toLowerCase()] || [];
    const forbiddenFoodsText = forbiddenFoods.length > 0 
      ? `ABSOLUTELY FORBIDDEN: ${forbiddenFoods.join(', ')}. If ANY meal contains these, it WILL BE REJECTED.`
      : '';

    // Build daily exclusions text
    const dailyExclusionsText = Object.keys(dailyExclusions).length > 0
      ? `DAILY EXCLUSIONS (HARD RULES):\n${Object.entries(dailyExclusions).map(([day, items]) => 
          `  - ${day.toUpperCase()}: NO ${items.join(', ')}`
        ).join('\n')}`
      : '';

    // Build preferences text
    const preferencesText = preferences.preferredFoods.length > 0
      ? `PREFERRED FOODS: Include ${preferences.preferredFoods.join(', ')} frequently when possible.`
      : '';

    // Build diversity requirement
    const diversityText = previousMealNames && previousMealNames.length > 0
      ? `DIVERSITY REQUIREMENT: Avoid these recently used meals: ${previousMealNames.join(', ')}`
      : '';

    // Create enhanced system prompt
    const systemPrompt = `You are a clinical nutrition expert AI. Generate a ${days}-day personalized meal plan in STRICT JSON format.

USER PROFILE:
- Name: ${user.name}, Age: ${user.age}, Gender: ${user.gender}
- Goal: ${user.goal}
- Diet Preference: ${user.diet_preference}

NUTRITIONAL TARGETS:
- Calories: ${targetCalories} kcal/day (±50 kcal acceptable)
- Protein: ${macros.protein_g}g/day
- Carbs: ${macros.carbs_g}g/day
- Fat: ${macros.fat_g}g/day

HARD CONSTRAINTS (MUST BE FOLLOWED):
${user.diet_preference ? `
DIET TYPE: ${user.diet_preference}
${forbiddenFoodsText}
` : ''}

${allergyList !== 'none' ? `
ALLERGENS TO COMPLETELY AVOID: ${allergyList}
These must be ZERO in all meals. Check ingredients carefully.
` : ''}

${dailyExclusionsText}

${conditionsList !== 'none' ? `
MEDICAL CONDITIONS: ${conditionsList}
- If diabetes or PCOS: prioritize low-GI carbs, no added sugars
- If hypertension: low sodium only
` : ''}

${preferencesText}

${diversityText}

${regenerationSeed ? `Randomization seed: ${regenerationSeed}` : ''}

CRITICAL REQUIREMENTS:
1. Each meal MUST include an "ingredients" array with specific items (e.g., ["chicken breast", "brown rice", "broccoli"])
2. Validate all ingredients against forbidden foods and allergens
3. Ensure variety across days
4. Match cuisine preference (${user.diet_preference})
5. Round portions to practical serving sizes

OUTPUT ONLY valid JSON (no markdown, no extra text):
{
  "summary": {
    "target_calories": ${targetCalories},
    "macros": { "protein_g": ${macros.protein_g}, "carbs_g": ${macros.carbs_g}, "fat_g": ${macros.fat_g} },
    "notes": "Any special dietary notes here"
  },
  "days": [
    {
      "day": "Day 1",
      "meals": [
        {
          "type": "breakfast",
          "name": "Meal name",
          "ingredients": ["ingredient1", "ingredient2", "ingredient3"],
          "portions": "1 cup (240ml) or 100g",
          "calories": 400,
          "macros": { "protein_g": 30, "carbs_g": 45, "fat_g": 10 },
          "allergens": [],
          "tags": ["low_gi", "high_protein"]
        }
      ]
    }
  ]
}`;

    // Call Lovable AI
    console.log('Calling AI with enhanced prompt...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Generate a ${days}-day meal plan for ${user.name}, ${user.age}yo ${user.gender}.` 
          }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits depleted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from AI response
    let mealPlan;
    try {
      const jsonContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      mealPlan = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      
      return new Response(
        JSON.stringify({
          error: 'AI generated invalid format',
          fallback: true,
          plan: generateFallbackPlan(targetCalories, macros, user.diet_preference, user)
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate and filter meals
    console.log('Validating meal plan...');
    const constraints: ValidationConstraints = {
      dietType: user.diet_preference,
      allergens: user.allergies || [],
      medicalConditions: user.conditions || [],
      dailyExclusions
    };

    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let totalViolations = 0;
    let totalMeals = 0;

    mealPlan.days = mealPlan.days.map((day: any, dayIndex: number) => {
      const dayOfWeek = daysOfWeek[dayIndex % 7];
      
      const validMeals = day.meals.filter((meal: any) => {
        totalMeals++;
        const validation = validateMeal(meal, dayOfWeek, constraints);
        
        if (!validation.isValid) {
          console.log(`Meal "${meal.name}" on ${dayOfWeek} has violations:`, validation.violations);
          totalViolations++;
          return false;
        }
        return true;
      });

      return { ...day, meals: validMeals };
    });

    console.log(`Validation complete: ${totalViolations} violations out of ${totalMeals} meals`);

    // If too many violations (>30%), use fallback
    if (totalViolations > totalMeals * 0.3) {
      console.log('Too many violations, using fallback plan');
      return new Response(
        JSON.stringify({
          fallback: true,
          plan: generateFallbackPlan(targetCalories, macros, user.diet_preference, user)
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ plan: mealPlan, fallback: false }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-plan:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: true
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Enhanced fallback plan generator
function generateFallbackPlan(targetCalories: number, macros: any, cuisine: string, user: UserProfile) {
  const mealsPerDay = 4;
  const caloriesPerMeal = Math.round(targetCalories / mealsPerDay);
  const isVegan = user.diet_preference?.toLowerCase() === 'vegan';
  const isVegetarian = user.diet_preference?.toLowerCase() === 'vegetarian' || isVegan;
  
  return {
    summary: {
      target_calories: targetCalories,
      macros: macros,
      notes: "Fallback plan - respecting dietary preferences"
    },
    days: Array.from({ length: 7 }, (_, i) => ({
      day: `Day ${i + 1}`,
      meals: [
        {
          type: "breakfast",
          name: isVegan ? "Oats with almonds and berries" : "Oatmeal with nuts and fruit",
          ingredients: ["oats", "almonds", "berries", "plant milk"],
          portions: "1 bowl (50g oats)",
          calories: caloriesPerMeal,
          macros: {
            protein_g: Math.round(macros.protein_g / 4),
            carbs_g: Math.round(macros.carbs_g / 4),
            fat_g: Math.round(macros.fat_g / 4)
          },
          allergens: [],
          tags: ["safe"]
        },
        {
          type: "lunch",
          name: isVegan ? "Dal with brown rice and vegetables" : (isVegetarian ? "Paneer with rice and vegetables" : "Grilled chicken with rice"),
          ingredients: isVegan ? ["dal", "brown rice", "mixed vegetables"] : (isVegetarian ? ["paneer", "rice", "vegetables"] : ["chicken", "rice", "vegetables"]),
          portions: "1 plate",
          calories: caloriesPerMeal,
          macros: {
            protein_g: Math.round(macros.protein_g / 4),
            carbs_g: Math.round(macros.carbs_g / 4),
            fat_g: Math.round(macros.fat_g / 4)
          },
          allergens: [],
          tags: ["safe"]
        },
        {
          type: "snack",
          name: isVegan ? "Hummus with vegetables" : "Greek yogurt with fruits",
          ingredients: isVegan ? ["hummus", "carrots", "cucumber"] : ["yogurt", "fruits"],
          portions: "1 cup",
          calories: Math.round(caloriesPerMeal * 0.7),
          macros: {
            protein_g: Math.round(macros.protein_g / 6),
            carbs_g: Math.round(macros.carbs_g / 6),
            fat_g: Math.round(macros.fat_g / 6)
          },
          allergens: isVegan ? [] : ["dairy"],
          tags: ["safe"]
        },
        {
          type: "dinner",
          name: isVegan ? "Tofu stir-fry with quinoa" : (isVegetarian ? "Paneer tikka with vegetables" : "Grilled fish with quinoa"),
          ingredients: isVegan ? ["tofu", "quinoa", "mixed vegetables"] : (isVegetarian ? ["paneer", "vegetables", "quinoa"] : ["fish", "quinoa", "vegetables"]),
          portions: "1 plate",
          calories: caloriesPerMeal,
          macros: {
            protein_g: Math.round(macros.protein_g / 4),
            carbs_g: Math.round(macros.carbs_g / 4),
            fat_g: Math.round(macros.fat_g / 4)
          },
          allergens: [],
          tags: ["safe"]
        }
      ]
    }))
  };
}
