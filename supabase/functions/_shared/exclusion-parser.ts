/**
 * Parses daily exclusion text to extract structured exclusions
 * Example: "No eggs on Tuesday and Thursday" -> { tuesday: ['egg'], thursday: ['egg'] }
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
    /i\s+don't\s+want\s+(\w+)\s+on\s+([\w\s,and]+)/gi,
    /exclude\s+(\w+)\s+(?:from|on)\s+([\w\s,and]+)/gi,
    /i\s+can't\s+eat\s+(\w+)\s+on\s+([\w\s,and]+)/gi,
    /(\w+)\s+is\s+not\s+allowed\s+on\s+([\w\s,and]+)/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const food = match[1].trim();
      const daysText = match[2];
      
      // Extract days from the text
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

/**
 * Extracts positive food preferences from routine text
 * Example: "I want my diet to majorly consist of dal" -> { preferredFoods: ['dal'] }
 */
export function extractPreferences(routineText: string): {
  preferredFoods: string[];
  mealFrequency: Record<string, string>;
} {
  const preferences = { preferredFoods: [], mealFrequency: {} };
  if (!routineText) return preferences;
  
  const text = routineText.toLowerCase();
  
  const preferencePatterns = [
    /(?:want|prefer|like).*?(?:majorly|mostly|primarily).*?(?:consist of|include)\s+(\w+)/gi,
    /my\s+diet\s+should\s+(?:consist of|include)\s+(\w+)/gi,
    /include\s+more\s+(\w+)/gi,
    /i\s+(?:prefer|love|want)\s+(\w+)/gi,
    /more\s+(\w+)\s+(?:in my diet|please)/gi,
  ];
  
  for (const pattern of preferencePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const food = match[1].trim();
      if (!preferences.preferredFoods.includes(food)) {
        preferences.preferredFoods.push(food);
      }
    }
  }
  
  return preferences;
}

/**
 * Fallback AI parser for complex routine sentences
 */
export async function parseRoutineWithAI(routineText: string, apiKey: string): Promise<{
  exclusions: Record<string, string[]>;
  preferences: { preferredFoods: string[]; mealFrequency: Record<string, string> };
}> {
  const prompt = `Parse this dietary routine into structured JSON. Extract ONLY the exclusions and preferences mentioned.

User routine: "${routineText}"

Required output format (return ONLY valid JSON, no markdown):
{
  "exclusions": { "monday": ["egg"], "thursday": ["egg"] },
  "preferences": { "preferredFoods": ["dal", "rice"], "mealFrequency": {} }
}

Rules:
- Days should be lowercase (monday, tuesday, etc.)
- Foods should be singular and lowercase
- If no exclusions mentioned, return empty object for exclusions
- If no preferences mentioned, return empty array for preferredFoods`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`AI parsing failed: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('AI routine parsing error:', error);
    return { exclusions: {}, preferences: { preferredFoods: [], mealFrequency: {} } };
  }
}
