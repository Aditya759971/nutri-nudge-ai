// Deno edge function runtime

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
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, targetCalories, macros, days = 7 }: GeneratePlanRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build allergy string
    const allergyList = user.allergies?.join(', ') || 'none';
    const conditionsList = user.conditions?.join(', ') || user.medicalConditions || 'none';

    // Create detailed system prompt
    const systemPrompt = `You are a clinical nutrition expert AI. Generate a ${days}-day personalized meal plan in STRICT JSON format.

CONSTRAINTS:
- Target: ${targetCalories} kcal/day
- Protein: ${macros.protein_g}g/day
- Carbs: ${macros.carbs_g}g/day
- Fat: ${macros.fat_g}g/day
- Goal: ${user.goal}
- Diet preference: ${user.diet_preference}
- Allergies: ${allergyList}
- Medical conditions: ${conditionsList}

RULES:
1. If diabetes or PCOS: prioritize low-GI carbs, distribute carbs evenly, avoid added sugars
2. Exclude ALL allergens completely
3. Match cuisine preference (${user.diet_preference})
4. Each meal MUST include: name, portions (with units), calories, and macros (protein_g, carbs_g, fat_g)
5. Daily totals should be within ±50 kcal of target
6. Round portions to practical serving sizes

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
        temperature: 0.7,
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

    // Parse JSON from AI response (handle markdown code blocks)
    let mealPlan;
    try {
      // Remove markdown code blocks if present
      const jsonContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      mealPlan = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      
      // Return fallback plan
      return new Response(
        JSON.stringify({
          error: 'AI generated invalid format',
          fallback: true,
          plan: generateFallbackPlan(targetCalories, macros, user.diet_preference)
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

// Simple fallback plan generator
function generateFallbackPlan(targetCalories: number, macros: any, cuisine: string) {
  const mealsPerDay = 4;
  const caloriesPerMeal = Math.round(targetCalories / mealsPerDay);
  
  return {
    summary: {
      target_calories: targetCalories,
      macros: macros,
      notes: "Fallback plan - AI service unavailable"
    },
    days: Array.from({ length: 7 }, (_, i) => ({
      day: `Day ${i + 1}`,
      meals: [
        {
          type: "breakfast",
          name: cuisine === "Indian" ? "Oats with nuts and fruit" : "Oatmeal with berries",
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
          name: cuisine === "Indian" ? "Dal with brown rice and vegetables" : "Grilled chicken with rice",
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
          name: "Greek yogurt with fruits",
          portions: "1 cup",
          calories: Math.round(caloriesPerMeal * 0.7),
          macros: {
            protein_g: Math.round(macros.protein_g / 6),
            carbs_g: Math.round(macros.carbs_g / 6),
            fat_g: Math.round(macros.fat_g / 6)
          },
          allergens: ["dairy"],
          tags: ["safe"]
        },
        {
          type: "dinner",
          name: cuisine === "Indian" ? "Grilled fish with quinoa" : "Salmon with vegetables",
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
