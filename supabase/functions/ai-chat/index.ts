import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userContext?: {
    goal: string;
    dietType: string;
    targetCalories: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], userContext }: ChatRequest = await req.json();

    console.log('AI Chat request:', message);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = buildChatSystemPrompt(userContext);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Failed to get AI response');
    }

    const aiResponse = await response.json();
    const reply = aiResponse.choices[0].message.content;

    return Response.json(
      { reply },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in ai-chat:', error);
    return Response.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

function buildChatSystemPrompt(userContext?: any): string {
  let contextInfo = '';
  if (userContext) {
    contextInfo = `\nUSER CONTEXT:
- Goal: ${userContext.goal}
- Diet Type: ${userContext.dietType}
- Target Calories: ${userContext.targetCalories} kcal/day`;
  }

  return `You are a nutrition and diet planning assistant. Help users with questions about:
- Meal planning and recipes
- Nutritional information
- Dietary adjustments
- Health and wellness tips
- Food substitutions
${contextInfo}

Provide clear, concise, and evidence-based answers. If the user asks for a meal plan, provide specific examples with approximate nutritional values.`;
}
