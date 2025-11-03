import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Download, Home, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacrosForGoal } from "@/lib/nutrition-utils";
import { generateMealPlanPDF } from "@/lib/pdf-generator";
import { generateMealPlan, type MealPlan, type Meal } from "@/lib/ai";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ResultsNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [targetMacros, setTargetMacros] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    loadUserDataAndGeneratePlan();
  }, [navigate]);

  const loadUserDataAndGeneratePlan = async () => {
    const stored = localStorage.getItem('userData');
    if (!stored) {
      navigate('/onboarding');
      return;
    }

    const data = JSON.parse(stored);
    setUserData(data);

    // Use current weight if available, otherwise use starting weight
    const currentWeight = parseFloat(localStorage.getItem('nutri:currentWeightKg') || data.weight);

    // Calculate using Mifflin-St Jeor
    const bmr = calculateBMR(
      currentWeight,
      parseFloat(data.height),
      parseInt(data.age),
      data.gender
    );
    const tdee = calculateTDEE(bmr, data.activityLevel);
    const targetCals = calculateTargetCalories(tdee, data.goal);
    const macros = calculateMacrosForGoal(targetCals, currentWeight, data.goal);

    setDailyCalories(targetCals);
    setTargetMacros(macros);

    // Check if we have a cached plan
    const cachedPlan = localStorage.getItem('nutri:mealPlan');
    const cacheTimestamp = localStorage.getItem('nutri:mealPlanTimestamp');
    const now = Date.now();

    if (cachedPlan && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 24 * 60 * 60 * 1000) {
      // Use cached plan if less than 24 hours old
      const parsed = JSON.parse(cachedPlan);
      setMealPlan(parsed.plan);
      setIsFallback(parsed.fallback || false);
      setIsLoading(false);
      return;
    }

    // Generate new plan
    await generatePlan(data, targetCals, macros, currentWeight);
  };

  const generatePlan = async (data: any, targetCals: number, macros: any, weight: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await generateMealPlan({
        user: {
          name: data.name,
          age: parseInt(data.age),
          gender: data.gender,
          height: parseFloat(data.height),
          weight: weight,
          activityLevel: data.activityLevel,
          goal: data.goal,
          dietPreference: data.dietPreference || 'Mixed',
          allergies: data.allergies,
          medicalConditions: data.medicalConditions,
        },
        targetCalories: targetCals,
        macros: {
          protein_g: macros.protein,
          carbs_g: macros.carbs,
          fat_g: macros.fats,
        },
        days: 7,
      });

      setMealPlan(response.plan);
      setIsFallback(response.fallback);

      // Cache the plan
      localStorage.setItem('nutri:mealPlan', JSON.stringify(response));
      localStorage.setItem('nutri:mealPlanTimestamp', Date.now().toString());

      if (response.fallback) {
        toast({
          title: "Using Fallback Plan",
          description: "AI service unavailable - showing a safe fallback plan",
          variant: "default",
        });
      }
    } catch (err) {
      console.error('Error generating plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate meal plan');
      toast({
        title: "Error",
        description: "Failed to generate meal plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegeneratePlan = async () => {
    if (!userData || !targetMacros) return;

    // Clear cache
    localStorage.removeItem('nutri:mealPlan');
    localStorage.removeItem('nutri:mealPlanTimestamp');

    const currentWeight = parseFloat(localStorage.getItem('nutri:currentWeightKg') || userData.weight);
    await generatePlan(userData, dailyCalories, targetMacros, currentWeight);
  };

  const handleDownload = () => {
    if (!userData || !mealPlan || !targetMacros) return;

    toast({
      title: "Generating PDF",
      description: "Your meal plan is being downloaded...",
    });

    // Convert meal plan format for PDF
    const dayPlan = mealPlan.days[selectedDay];
    const simplifiedPlan = {
      breakfast: dayPlan.meals.filter(m => m.type === 'breakfast').map(convertMeal),
      lunch: dayPlan.meals.filter(m => m.type === 'lunch').map(convertMeal),
      dinner: dayPlan.meals.filter(m => m.type === 'dinner').map(convertMeal),
      snacks: dayPlan.meals.filter(m => m.type === 'snack' || m.type === 'snacks').map(convertMeal),
    };

    generateMealPlanPDF(
      { name: userData.name, goal: userData.goal },
      dailyCalories,
      targetMacros,
      simplifiedPlan
    );
  };

  const convertMeal = (meal: Meal) => ({
    name: meal.name,
    portion: meal.portions,
    calories: meal.calories,
    protein: meal.macros.protein_g,
    carbs: meal.macros.carbs_g,
    fats: meal.macros.fat_g,
  });

  const calculateDayTotals = (meals: Meal[]) => {
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.macros.protein_g,
        carbs: acc.carbs + meal.macros.carbs_g,
        fats: acc.fats + meal.macros.fat_g,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 bg-gradient-subtle flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Your Plan
            </CardTitle>
            <CardDescription>
              AI is creating a personalized meal plan based on your profile...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !userData || !mealPlan || !targetMacros) {
    return (
      <div className="min-h-screen py-12 bg-gradient-subtle">
        <div className="container px-4 mx-auto max-w-4xl">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Failed to load meal plan. Please try again.'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/onboarding')}>Return to Onboarding</Button>
        </div>
      </div>
    );
  }

  const currentDayPlan = mealPlan.days[selectedDay];
  const dayTotals = calculateDayTotals(currentDayPlan.meals);

  return (
    <div className="min-h-screen py-12 bg-gradient-subtle">
      <div className="container px-4 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Hi {userData.name}! 👋</h1>
              <p className="text-lg text-muted-foreground">
                Here's your AI-generated personalized diet plan
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>

        {/* Fallback Warning */}
        {isFallback && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Using fallback plan - AI service unavailable. This is a safe general plan.
            </AlertDescription>
          </Alert>
        )}

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
              <CardTitle className="text-sm font-medium text-muted-foreground">Protein Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{targetMacros.protein}g</div>
              <p className="text-xs text-muted-foreground">{Math.round((targetMacros.proteinCalories / dailyCalories) * 100)}% of total</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Carbs Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{targetMacros.carbs}g</div>
              <p className="text-xs text-muted-foreground">{Math.round((targetMacros.carbsCalories / dailyCalories) * 100)}% of total</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fats Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{targetMacros.fats}g</div>
              <p className="text-xs text-muted-foreground">{Math.round((targetMacros.fatsCalories / dailyCalories) * 100)}% of total</p>
            </CardContent>
          </Card>
        </div>

        {/* Day Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {mealPlan.days.map((day, idx) => (
            <Button
              key={idx}
              variant={selectedDay === idx ? "default" : "outline"}
              onClick={() => setSelectedDay(idx)}
              className="whitespace-nowrap"
            >
              {day.day}
            </Button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button variant="outline" onClick={handleRegeneratePlan} disabled={isLoading}>
            <Loader2 className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate Plan
          </Button>
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

        {/* Meal Plan for Selected Day */}
        <Card className="mb-6 shadow-soft border-border">
          <CardHeader>
            <CardTitle>{currentDayPlan.day} Summary</CardTitle>
            <CardDescription>
              Total: {dayTotals.calories} kcal | Protein: {dayTotals.protein}g | Carbs: {dayTotals.carbs}g | Fats: {dayTotals.fats}g
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Meals */}
        <div className="space-y-6">
          {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
            const meals = currentDayPlan.meals.filter(m => 
              m.type === mealType || (mealType === 'snack' && m.type === 'snacks')
            );
            
            if (meals.length === 0) return null;

            return (
              <Card key={mealType} className="shadow-soft border-border">
                <CardHeader>
                  <CardTitle className="capitalize text-xl">{mealType}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {meals.map((meal, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-accent/30">
                        <h4 className="font-semibold mb-1">{meal.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{meal.portions}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {meal.calories} kcal
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            P: {meal.macros.protein_g}g
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            C: {meal.macros.carbs_g}g
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            F: {meal.macros.fat_g}g
                          </Badge>
                          {meal.tags && meal.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tips */}
        {mealPlan.summary.notes && (
          <Card className="mt-8 shadow-soft border-primary/20 bg-gradient-to-br from-accent/30 to-accent/10">
            <CardHeader>
              <CardTitle>💡 Personalized Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{mealPlan.summary.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResultsNew;
