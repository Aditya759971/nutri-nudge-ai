import { type MealPlan, type Meal } from './ai';

export interface GroceryItem {
  name: string;
  category: string;
  quantity: string;
}

export interface GroceryList {
  proteins: GroceryItem[];
  grains: GroceryItem[];
  vegetables: GroceryItem[];
  fruits: GroceryItem[];
  dairy: GroceryItem[];
  pantry: GroceryItem[];
  other: GroceryItem[];
}

const CATEGORY_KEYWORDS = {
  proteins: ['chicken', 'beef', 'fish', 'salmon', 'tuna', 'eggs', 'tofu', 'tempeh', 'lentils', 'chickpeas', 'beans', 'paneer'],
  grains: ['rice', 'quinoa', 'oats', 'bread', 'pasta', 'roti', 'chapati', 'noodles', 'wheat', 'barley'],
  vegetables: ['broccoli', 'spinach', 'carrot', 'tomato', 'onion', 'pepper', 'cucumber', 'lettuce', 'cabbage', 'cauliflower'],
  fruits: ['apple', 'banana', 'orange', 'berries', 'mango', 'grapes', 'watermelon', 'papaya'],
  dairy: ['milk', 'yogurt', 'cheese', 'butter', 'cream', 'curd'],
  pantry: ['oil', 'salt', 'pepper', 'spices', 'sugar', 'flour', 'sauce', 'honey']
};

export function generateGroceryList(mealPlan: MealPlan): GroceryList {
  const groceryList: GroceryList = {
    proteins: [],
    grains: [],
    vegetables: [],
    fruits: [],
    dairy: [],
    pantry: [],
    other: []
  };

  const ingredientMap = new Map<string, { category: string; count: number }>();

  // Extract all ingredients from all days
  mealPlan.days.forEach(day => {
    day.meals.forEach(meal => {
      if (meal.ingredients) {
        meal.ingredients.forEach(ingredient => {
          const normalizedIngredient = ingredient.toLowerCase().trim();
          const category = categorizeIngredient(normalizedIngredient);
          
          if (ingredientMap.has(normalizedIngredient)) {
            const existing = ingredientMap.get(normalizedIngredient)!;
            existing.count += 1;
          } else {
            ingredientMap.set(normalizedIngredient, { category, count: 1 });
          }
        });
      }
    });
  });

  // Convert map to categorized lists
  ingredientMap.forEach((value, key) => {
    const item: GroceryItem = {
      name: capitalizeFirstLetter(key),
      category: value.category,
      quantity: value.count > 1 ? `${value.count} servings` : '1 serving'
    };

    const categoryList = groceryList[value.category as keyof GroceryList] as GroceryItem[];
    categoryList.push(item);
  });

  // Sort each category
  Object.keys(groceryList).forEach(category => {
    const list = groceryList[category as keyof GroceryList] as GroceryItem[];
    list.sort((a, b) => a.name.localeCompare(b.name));
  });

  return groceryList;
}

function categorizeIngredient(ingredient: string): string {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => ingredient.includes(keyword))) {
      return category;
    }
  }
  return 'other';
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatGroceryListAsText(groceryList: GroceryList): string {
  let text = '🛒 NUTRINUDGE GROCERY LIST\n\n';

  const categories = [
    { key: 'proteins', label: '🍗 Proteins' },
    { key: 'grains', label: '🌾 Grains' },
    { key: 'vegetables', label: '🥗 Vegetables' },
    { key: 'fruits', label: '🍎 Fruits' },
    { key: 'dairy', label: '🥛 Dairy' },
    { key: 'pantry', label: '🧂 Pantry' },
    { key: 'other', label: '📦 Other' }
  ];

  categories.forEach(({ key, label }) => {
    const items = groceryList[key as keyof GroceryList] as GroceryItem[];
    if (items.length > 0) {
      text += `${label}\n`;
      items.forEach(item => {
        text += `  • ${item.name} (${item.quantity})\n`;
      });
      text += '\n';
    }
  });

  return text;
}
