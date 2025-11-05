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
