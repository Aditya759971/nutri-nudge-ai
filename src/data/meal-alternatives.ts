export interface MealItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export const mealAlternatives: Record<string, MealItem[]> = {
  breakfast: [
    { name: "Oats with Almonds", portion: "1 bowl (50g)", calories: 280, protein: 8, carbs: 45, fats: 7 },
    { name: "Scrambled Eggs with Toast", portion: "2 eggs + 2 slices", calories: 300, protein: 18, carbs: 30, fats: 12 },
    { name: "Greek Yogurt Parfait", portion: "200g yogurt + berries", calories: 250, protein: 20, carbs: 30, fats: 5 },
    { name: "Smoothie Bowl", portion: "1 bowl", calories: 320, protein: 12, carbs: 55, fats: 8 },
    { name: "Whole Wheat Pancakes", portion: "3 small pancakes", calories: 290, protein: 10, carbs: 48, fats: 6 },
    { name: "Poha with Peanuts", portion: "1 bowl", calories: 270, protein: 6, carbs: 42, fats: 8 },
    { name: "Upma", portion: "1 bowl", calories: 260, protein: 7, carbs: 40, fats: 7 },
    { name: "Avocado Toast", portion: "2 slices + half avocado", calories: 310, protein: 9, carbs: 35, fats: 16 },
  ],
  lunch: [
    { name: "Grilled Chicken Breast", portion: "150g", calories: 240, protein: 45, carbs: 0, fats: 5 },
    { name: "Paneer Tikka", portion: "150g", calories: 280, protein: 18, carbs: 10, fats: 18 },
    { name: "Dal Tadka", portion: "1 bowl", calories: 180, protein: 12, carbs: 25, fats: 4 },
    { name: "Grilled Fish", portion: "150g", calories: 200, protein: 40, carbs: 0, fats: 4 },
    { name: "Chickpea Curry", portion: "1 bowl", calories: 220, protein: 12, carbs: 30, fats: 6 },
    { name: "Tofu Stir-fry", portion: "150g", calories: 200, protein: 18, carbs: 8, fats: 11 },
  ],
  sides: [
    { name: "Brown Rice", portion: "1 cup", calories: 215, protein: 5, carbs: 45, fats: 2 },
    { name: "Quinoa", portion: "1 cup", calories: 220, protein: 8, carbs: 39, fats: 4 },
    { name: "Whole Wheat Roti", portion: "2 pieces", calories: 150, protein: 6, carbs: 30, fats: 2 },
    { name: "Mixed Vegetables", portion: "1 cup", calories: 80, protein: 3, carbs: 15, fats: 1 },
    { name: "Salad", portion: "1 bowl", calories: 50, protein: 2, carbs: 10, fats: 1 },
    { name: "Sweet Potato", portion: "1 medium", calories: 180, protein: 4, carbs: 41, fats: 0 },
  ],
  dinner: [
    { name: "Grilled Fish", portion: "150g", calories: 200, protein: 40, carbs: 0, fats: 4 },
    { name: "Chicken Soup", portion: "1 bowl", calories: 180, protein: 25, carbs: 12, fats: 4 },
    { name: "Baked Salmon", portion: "150g", calories: 280, protein: 38, carbs: 0, fats: 14 },
    { name: "Grilled Vegetables with Tofu", portion: "200g", calories: 200, protein: 15, carbs: 18, fats: 8 },
    { name: "Egg White Omelette", portion: "4 whites", calories: 140, protein: 28, carbs: 2, fats: 0 },
    { name: "Palak Paneer", portion: "1 bowl", calories: 240, protein: 14, carbs: 12, fats: 16 },
  ],
  snacks: [
    { name: "Greek Yogurt", portion: "150g", calories: 130, protein: 17, carbs: 10, fats: 3 },
    { name: "Apple", portion: "1 medium", calories: 95, protein: 0, carbs: 25, fats: 0 },
    { name: "Almonds", portion: "30g (23 nuts)", calories: 170, protein: 6, carbs: 6, fats: 15 },
    { name: "Protein Shake", portion: "1 scoop", calories: 120, protein: 24, carbs: 3, fats: 2 },
    { name: "Hummus with Carrots", portion: "50g + 100g carrots", calories: 150, protein: 5, carbs: 18, fats: 7 },
    { name: "Boiled Eggs", portion: "2 eggs", calories: 140, protein: 12, carbs: 1, fats: 10 },
    { name: "Roasted Chickpeas", portion: "50g", calories: 140, protein: 7, carbs: 20, fats: 3 },
    { name: "Banana with Peanut Butter", portion: "1 banana + 1 tbsp PB", calories: 200, protein: 5, carbs: 30, fats: 8 },
  ],
};

export function getAlternativeMeal(mealType: keyof typeof mealAlternatives): MealItem {
  const alternatives = mealAlternatives[mealType];
  const randomIndex = Math.floor(Math.random() * alternatives.length);
  return alternatives[randomIndex];
}
