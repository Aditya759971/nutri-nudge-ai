import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SwapMealRequest {
  currentMeal: {
    name: string;
    calories: number;
    macros: {
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    };
    type: string;
  };
  constraints: {
    dietType: string;
    allergens?: string[];
    medicalConditions?: string[];
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentMeal, constraints }: SwapMealRequest = await req.json();

    console.log('Swapping meal:', currentMeal.name);
    console.log('Constraints:', constraints);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = buildSwapPrompt(currentMeal, constraints);

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
            content: `Generate 3 alternative ${currentMeal.type} meals to replace "${currentMeal.name}". Return ONLY valid JSON array with 3 meal objects.`
          }
        ],
        temperature: 0.9,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Failed to generate meal alternatives');
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices[0].message.content;

    // Clean up markdown
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    const alternatives = JSON.parse(content);

    return Response.json(
      { alternatives },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in swap-meal:', error);
    return Response.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

function buildSwapPrompt(currentMeal: any, constraints: any): string {
  const allergyList = constraints.allergens && constraints.allergens.length > 0 ? constraints.allergens.join(', ') : 'None';
  
  let dietInstructions = '';
  if (constraints.dietType?.toLowerCase() === 'vegan') {
    dietInstructions = 'CRITICAL: VEGAN only - NO animal products (meat, fish, eggs, dairy)';
  } else if (constraints.dietType?.toLowerCase() === 'vegetarian') {
    dietInstructions = 'CRITICAL: VEGETARIAN only - NO meat or fish';
  }

  return `Generate 3 alternative ${currentMeal.type} meals with similar nutritional content.

CURRENT MEAL TO REPLACE:
- Name: ${currentMeal.name}
- Calories: ${currentMeal.calories} (target: ±50 kcal)
- Protein: ${currentMeal.macros.protein_g}g (target: ±5g)
- Carbs: ${currentMeal.macros.carbs_g}g (target: ±10g)
- Fats: ${currentMeal.macros.fat_g}g (target: ±5g)

CONSTRAINTS:
${dietInstructions}
- Allergies: ${allergyList}
- Each alternative must be DIFFERENT from the original
- Must be suitable for ${currentMeal.type}

Return ONLY valid JSON array (no markdown):
[
  {
    "name": "Meal name",
    "ingredients": ["ingredient1", "ingredient2"],
    "portions": "portion description",
    "calories": number,
    "macros": { "protein_g": number, "carbs_g": number, "fat_g": number },
    "tags": ["tag1"]
  }
]`;
}
