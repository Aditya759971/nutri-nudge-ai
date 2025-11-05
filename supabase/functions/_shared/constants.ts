// Dietary restriction constants for validation

export const DIET_TYPE_EXCLUSIONS: Record<string, string[]> = {
  vegan: [
    'chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'prawn',
    'egg', 'eggs', 'dairy', 'milk', 'cheese', 'paneer', 'yogurt', 'curd', 'butter',
    'ghee', 'honey', 'meat', 'mutton'
  ],
  vegetarian: [
    'chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'prawn',
    'meat', 'mutton', 'seafood'
  ],
  pescatarian: [
    'chicken', 'beef', 'pork', 'lamb', 'meat', 'mutton'
  ],
  'non-vegetarian': [],
  mixed: [],
  indian: [],
  western: [],
  mediterranean: [],
  keto: []
};

export const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  egg: ['egg', 'eggs', 'omelette', 'scrambled'],
  peanut: ['peanut', 'peanuts', 'peanut butter'],
  'tree nuts': ['almond', 'cashew', 'walnut', 'pistachio', 'hazelnut'],
  dairy: ['milk', 'cheese', 'paneer', 'yogurt', 'curd', 'butter', 'cream', 'ghee'],
  gluten: ['wheat', 'bread', 'roti', 'chapati', 'pasta', 'noodles', 'barley'],
  soy: ['soy', 'tofu', 'tempeh', 'edamame'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'oyster'],
  fish: ['fish', 'salmon', 'tuna', 'mackerel']
};

export const MEDICAL_CONDITION_GUIDELINES: Record<string, {
  maxCarbs?: number;
  maxSodium?: number;
  avoidFoods: string[];
  preferFoods: string[];
  notes: string;
}> = {
  diabetes: {
    maxCarbs: 150,
    avoidFoods: ['sugar', 'candy', 'soda', 'white bread', 'white rice', 'pastries', 'sweetened'],
    preferFoods: ['low-gi', 'whole grain', 'fiber', 'lean protein'],
    notes: 'Focus on low-glycemic index foods and distribute carbs evenly across meals'
  },
  hypertension: {
    maxSodium: 1500,
    avoidFoods: ['salt', 'salty', 'pickles', 'processed meat', 'canned'],
    preferFoods: ['low-sodium', 'fresh vegetables', 'fruits', 'whole grains'],
    notes: 'Limit sodium intake and focus on potassium-rich foods'
  },
  pcos: {
    maxCarbs: 130,
    avoidFoods: ['sugar', 'refined carbs', 'processed foods'],
    preferFoods: ['low-gi', 'anti-inflammatory', 'omega-3', 'fiber'],
    notes: 'Focus on low-GI foods and anti-inflammatory diet'
  },
  'lactose intolerance': {
    avoidFoods: ['milk', 'cheese', 'yogurt', 'cream', 'dairy'],
    preferFoods: ['lactose-free', 'almond milk', 'coconut milk'],
    notes: 'Exclude all dairy products or use lactose-free alternatives'
  },
  'thyroid': {
    avoidFoods: ['soy', 'cruciferous raw'],
    preferFoods: ['iodine-rich', 'selenium-rich', 'zinc-rich'],
    notes: 'Include iodine and selenium-rich foods, cook cruciferous vegetables'
  }
};

export const LOW_GI_FOODS = [
  'oats', 'quinoa', 'brown rice', 'sweet potato', 'lentils', 'chickpeas',
  'beans', 'apples', 'berries', 'whole grain'
];

export const HIGH_GI_AVOID = [
  'white bread', 'white rice', 'potato', 'cornflakes', 'instant oats',
  'candy', 'soda', 'pastries'
];
