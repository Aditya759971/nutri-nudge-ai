import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Download, RefreshCw, Home, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MealItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface DayPlan {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snacks: MealItem[];
}

const Results = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [selectedCuisine, setSelectedCuisine] = useState("indian");
  const [dailyCalories, setDailyCalories] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('userData');
    if (!stored) {
      navigate('/onboarding');
      return;
    }
    const data = JSON.parse(stored);
    setUserData(data);
    
    // Simple calorie calculation (this would be done by AI in real app)
    const bmr = data.gender === 'male' 
      ? 88.362 + (13.397 * parseFloat(data.weight)) + (4.799 * parseFloat(data.height)) - (5.677 * parseFloat(data.age))
      : 447.593 + (9.247 * parseFloat(data.weight)) + (3.098 * parseFloat(data.height)) - (4.330 * parseFloat(data.age));
    
    const activityMultiplier = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      'very-active': 1.725
    }[data.activityLevel] || 1.5;
    
    const tdee = bmr * activityMultiplier;
    const goalAdjustment = data.goal === 'weight-loss' ? -500 : data.goal === 'muscle-gain' ? 300 : 0;
    
    setDailyCalories(Math.round(tdee + goalAdjustment));
  }, [navigate]);

  // Sample meal plan (in real app, this would come from AI)
  const sampleMealPlan: DayPlan = {
    breakfast: [
      { name: "Oats with Almonds", portion: "1 bowl (50g)", calories: 280, protein: 8, carbs: 45, fats: 7 },
      { name: "Banana", portion: "1 medium", calories: 105, protein: 1, carbs: 27, fats: 0 },
    ],
    lunch: [
      { name: "Grilled Chicken Breast", portion: "150g", calories: 240, protein: 45, carbs: 0, fats: 5 },
      { name: "Brown Rice", portion: "1 cup", calories: 215, protein: 5, carbs: 45, fats: 2 },
      { name: "Mixed Vegetables", portion: "1 cup", calories: 80, protein: 3, carbs: 15, fats: 1 },
    ],
    dinner: [
      { name: "Grilled Fish", portion: "150g", calories: 200, protein: 40, carbs: 0, fats: 4 },
      { name: "Quinoa", portion: "1 cup", calories: 220, protein: 8, carbs: 39, fats: 4 },
      { name: "Salad", portion: "1 bowl", calories: 50, protein: 2, carbs: 10, fats: 1 },
    ],
    snacks: [
      { name: "Greek Yogurt", portion: "150g", calories: 130, protein: 17, carbs: 10, fats: 3 },
      { name: "Apple", portion: "1 medium", calories: 95, protein: 0, carbs: 25, fats: 0 },
    ],
  };

  const calculateTotalMacros = (meals: MealItem[]) => {
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fats: acc.fats + meal.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const allMeals = [...sampleMealPlan.breakfast, ...sampleMealPlan.lunch, ...sampleMealPlan.dinner, ...sampleMealPlan.snacks];
  const totalMacros = calculateTotalMacros(allMeals);

  const handleSwap = (mealName: string) => {
    toast({
      title: "Meal Swap",
      description: `Finding alternatives for ${mealName}...`,
    });
  };

  const handleDownload = () => {
    toast({
      title: "Downloading Plan",
      description: "Your meal plan PDF is being generated...",
    });
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen py-12 bg-gradient-subtle">
      <div className="container px-4 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Hi {userData.name}! 👋</h1>
              <p className="text-lg text-muted-foreground">
                Here's your personalized diet plan to help you reach your goal
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-soft border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Daily Calories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{dailyCalories}</div>
              <p className="text-xs text-muted-foreground">kcal/day</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Protein</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMacros.protein}g</div>
              <p className="text-xs text-muted-foreground">{Math.round((totalMacros.protein * 4 / totalMacros.calories) * 100)}% of total</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Carbs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMacros.carbs}g</div>
              <p className="text-xs text-muted-foreground">{Math.round((totalMacros.carbs * 4 / totalMacros.calories) * 100)}% of total</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMacros.fats}g</div>
              <p className="text-xs text-muted-foreground">{Math.round((totalMacros.fats * 9 / totalMacros.calories) * 100)}% of total</p>
            </CardContent>
          </Card>
        </div>

        {/* Meal Plan Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
            <SelectTrigger className="sm:w-64">
              <SelectValue placeholder="Select cuisine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="indian">Indian Cuisine</SelectItem>
              <SelectItem value="western">Western Cuisine</SelectItem>
              <SelectItem value="mediterranean">Mediterranean</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2 sm:ml-auto">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="default" onClick={() => navigate('/progress')}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Track Progress
            </Button>
          </div>
        </div>

        {/* Meal Plan */}
        <div className="space-y-6">
          {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((mealType) => (
            <Card key={mealType} className="shadow-soft border-border">
              <CardHeader>
                <CardTitle className="capitalize text-xl">{mealType}</CardTitle>
                <CardDescription>
                  Total: {calculateTotalMacros(sampleMealPlan[mealType]).calories} kcal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sampleMealPlan[mealType].map((meal, idx) => (
                    <div key={idx} className="flex items-start justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{meal.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{meal.portion}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {meal.calories} kcal
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            P: {meal.protein}g
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            C: {meal.carbs}g
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            F: {meal.fats}g
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSwap(meal.name)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tips */}
        <Card className="mt-8 shadow-soft border-primary/20 bg-gradient-to-br from-accent/30 to-accent/10">
          <CardHeader>
            <CardTitle>💡 Smart Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Stay hydrated with at least 2-3 liters of water daily</li>
              <li>• Add 1 tbsp flaxseed to your oats for better omega-3 intake</li>
              <li>• Consider meal prepping on Sundays to stay on track</li>
              <li>• Track your progress weekly and adjust portions as needed</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Results;
