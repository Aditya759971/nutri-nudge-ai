export interface AdherenceEntry {
  date: string;
  dayIndex: number;
  mealType: string;
  mealName: string;
  completed: boolean;
}

export function getAdherenceKey(date: string): string {
  return `nutri:adherence:${date}`;
}

export function getTodaysDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function saveAdherence(date: string, dayIndex: number, mealType: string, mealName: string, completed: boolean): void {
  const key = getAdherenceKey(date);
  const existing = localStorage.getItem(key);
  const adherenceData: AdherenceEntry[] = existing ? JSON.parse(existing) : [];
  
  // Remove existing entry for this meal if any
  const filtered = adherenceData.filter(
    entry => !(entry.dayIndex === dayIndex && entry.mealType === mealType)
  );
  
  // Add new entry
  filtered.push({
    date,
    dayIndex,
    mealType,
    mealName,
    completed
  });
  
  localStorage.setItem(key, JSON.stringify(filtered));
}

export function getAdherence(date: string): AdherenceEntry[] {
  const key = getAdherenceKey(date);
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

export function isMealCompleted(date: string, dayIndex: number, mealType: string): boolean {
  const adherence = getAdherence(date);
  const entry = adherence.find(
    a => a.dayIndex === dayIndex && a.mealType === mealType
  );
  return entry ? entry.completed : false;
}

export function calculateWeeklyAdherence(startDate: string, totalDays: number = 7): { completed: number; total: number; percentage: number } {
  let completed = 0;
  let total = 0;
  
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const adherence = getAdherence(dateStr);
    adherence.forEach(entry => {
      total++;
      if (entry.completed) completed++;
    });
  }
  
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
}
