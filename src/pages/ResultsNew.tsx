import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { Download, Home, TrendingUp, AlertCircle, Loader2, RefreshCw, ShoppingCart, Calendar, Repeat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacrosForGoal } from "@/lib/nutrition-utils";
import { generateMealPlanPDF } from "@/lib/pdf-generator";
import { generateMealPlan, swapMeal, parseDailyExclusions, type MealPlan, type Meal } from "@/lib/ai";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateGroceryList } from "@/lib/grocery-generator";
import { generateICSFile, downloadICSFile } from "@/lib/calendar-export";
import { getTodaysDate, saveAdherence, isMealCompleted } from "@/lib/adherence-tracker";
import { MealSwapModal } from "@/components/MealSwapModal";
import { GroceryListModal } from "@/components/GroceryListModal";
import { AIChatBox } from "@/components/AIChatBox";
import { ConstraintsBadge } from "@/components/ConstraintsBadge";

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
  const [dailyExclusions, setDailyExclusions] = useState<Record<string, string[]>>({});
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapAlternatives, setSwapAlternatives] = useState<Meal[]>([]);
  const [swapLoading, setSwapLoading] = useState(false);
  const [currentSwapMeal, setCurrentSwapMeal] = useState<{ dayIdx: number; mealIdx: number } | null>(null);
  const [groceryModalOpen, setGroceryModalOpen] = useState(false);
  const [todaysDate] = useState(getTodaysDate());

  useEffect(() => {
    loadUserDataAndGeneratePlan();
  }, []);

  const loadUserDataAndGeneratePlan = async () => {
    const stored = localStorage.getItem('userData');
    if (!stored) {
      navigate('/onboarding');
      return;
    }

    const data = JSON.parse(stored);
    setUserData(data);

    // Parse daily exclusions from routine
    const exclusions = parseDailyExclusions(data.routine || '');
    setDailyExclusions(exclusions);

    const currentWeight = parseFloat(localStorage.getItem('nutri:currentWeightKg') || data.weight);
    const bmr = calculateBMR(currentWeight, parseFloat(data.height), parseInt(data.age), data.gender);
    const tdee = calculateTDEE(bmr, data.activityLevel);
    const targetCals = calculateTargetCalories(tdee, data.goal);
    const macros = calculateMacrosForGoal(targetCals, currentWeight, data.goal);

    setDailyCalories(targetCals);
    setTargetMacros(macros);

    const cachedPlan = localStorage.getItem('nutri:mealPlan');
    const cacheTimestamp = localStorage.getItem('nutri:mealPlanTimestamp');
    const now = Date.now();

    if (cachedPlan && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 7 * 24 * 60 * 60 * 1000) {
      const parsed = JSON.parse(cachedPlan);
      setMealPlan(parsed.plan);
      setIsFallback(parsed.fallback || false);
      setIsLoading(false);
      return;
    }

    await generatePlan(data, targetCals, macros, currentWeight, exclusions);
  };

  const generatePlan = async (data: any, targetCals: number, macros: any, weight: number, exclusions: Record<string, string[]>) => {
    setIsLoading(true);
    setError(null);

    try {
      const previousPlans = localStorage.getItem('nutri:previousPlans');
      const previousMealNames = previousPlans ? JSON.parse(previousPlans).slice(0, 20) : [];

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
        macros: { protein_g: macros.protein, carbs_g: macros.carbs, fat_g: macros.fats },
        days: 7,
        dailyExclusions: exclusions,
        regenerationSeed: Date.now().toString(),
        previousMealNames,
        forceRegenerate: true,
      });

      setMealPlan(response.plan);
      setIsFallback(response.fallback);

      // Store meal names for diversity
      const allMealNames = response.plan.days.flatMap(d => d.meals.map(m => m.name));
      localStorage.setItem('nutri:previousPlans', JSON.stringify(allMealNames));
      localStorage.setItem('nutri:mealPlan', JSON.stringify(response));
      localStorage.setItem('nutri:mealPlanTimestamp', Date.now().toString());

      if (response.fallback) {
        toast({ title: "Using Fallback Plan", description: "AI service unavailable - showing a safe fallback plan" });
      }
    } catch (err) {
      console.error('Error generating plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate meal plan');
      toast({ title: "Error", description: "Failed to generate meal plan. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegeneratePlan = async () => {
    if (!userData || !targetMacros) return;
    localStorage.removeItem('nutri:mealPlan');
    localStorage.removeItem('nutri:mealPlanTimestamp');
    const currentWeight = parseFloat(localStorage.getItem('nutri:currentWeightKg') || userData.weight);
    await generatePlan(userData, dailyCalories, targetMacros, currentWeight, dailyExclusions);
  };

  const handleSwapMeal = async (dayIdx: number, mealIdx: number) => {
    if (!mealPlan) return;
    const meal = mealPlan.days[dayIdx].meals[mealIdx];
    setCurrentSwapMeal({ dayIdx, mealIdx });
    setSwapModalOpen(true);
    setSwapLoading(true);

    try {
      const alternatives = await swapMeal(meal, {
        dietType: userData.dietPreference || 'mixed',
        allergens: userData.allergies?.split(',').map((a: string) => a.trim()).filter(Boolean),
        medicalConditions: userData.medicalConditions?.split(',').map((c: string) => c.trim()).filter(Boolean),
      });
      setSwapAlternatives(alternatives);
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate alternatives", variant: "destructive" });
    } finally {
      setSwapLoading(false);
    }
  };

  const handleSelectSwap = (newMeal: Meal) => {
    if (!mealPlan || !currentSwapMeal) return;
    const updatedPlan = { ...mealPlan };
    updatedPlan.days[currentSwapMeal.dayIdx].meals[currentSwapMeal.mealIdx] = newMeal;
    setMealPlan(updatedPlan);
    localStorage.setItem('nutri:mealPlan', JSON.stringify({ plan: updatedPlan, fallback: isFallback }));
    toast({ title: "Meal Swapped!", description: "Your meal plan has been updated" });
  };

  const handleToggleAdherence = (dayIdx: number, mealType: string, mealName: string, completed: boolean) => {
    saveAdherence(todaysDate, dayIdx, mealType, mealName, completed);
    toast({ title: completed ? "Meal Completed!" : "Meal Unchecked", description: `${mealName} marked as ${completed ? 'completed' : 'incomplete'}` });
  };

  const handleExportCalendar = () => {
    if (!mealPlan || !userData) {
      toast({ 
        title: "Cannot Export", 
        description: "Meal plan not loaded yet",
        variant: "destructive" 
      });
      return;
    }
    
    try {
      const icsContent = generateICSFile(mealPlan, userData.name);
      downloadICSFile(icsContent, `NutriNudge_MealPlan_${userData.name}.ics`);
      toast({ 
        title: "Calendar Exported! 📅", 
        description: "Import the .ics file into your calendar app (Outlook, Google Calendar, Apple Calendar)",
        duration: 5000
      });
    } catch (error) {
      console.error('Calendar export error:', error);
      toast({ 
        title: "Export Failed", 
        description: "Could not generate calendar file. Please try again.",
        variant: "destructive" 
      });
    }
  };

  const handleDownload = () => {
    if (!userData || !mealPlan || !targetMacros) return;
    const dayPlan = mealPlan.days[selectedDay];
    const simplifiedPlan = {
      breakfast: dayPlan.meals.filter(m => m.type === 'breakfast').map(m => ({ name: m.name, portion: m.portions, calories: m.calories, protein: m.macros.protein_g, carbs: m.macros.carbs_g, fats: m.macros.fat_g })),
      lunch: dayPlan.meals.filter(m => m.type === 'lunch').map(m => ({ name: m.name, portion: m.portions, calories: m.calories, protein: m.macros.protein_g, carbs: m.macros.carbs_g, fats: m.macros.fat_g })),
      dinner: dayPlan.meals.filter(m => m.type === 'dinner').map(m => ({ name: m.name, portion: m.portions, calories: m.calories, protein: m.macros.protein_g, carbs: m.macros.carbs_g, fats: m.macros.fat_g })),
      snacks: dayPlan.meals.filter(m => m.type === 'snack' || m.type === 'snacks').map(m => ({ name: m.name, portion: m.portions, calories: m.calories, protein: m.macros.protein_g, carbs: m.macros.carbs_g, fats: m.macros.fat_g })),
    };
    generateMealPlanPDF({ name: userData.name, goal: userData.goal }, dailyCalories, targetMacros, simplifiedPlan);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 bg-gradient-subtle flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Generating Your Plan</CardTitle>
            <CardDescription>AI is creating a personalized meal plan...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !userData || !mealPlan || !targetMacros) {
    return (
      <div className="min-h-screen py-12 bg-gradient-subtle">
        <div className="container px-4 mx-auto max-w-4xl">
          <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error || 'Failed to load meal plan.'}</AlertDescription></Alert>
          <Button onClick={() => navigate('/onboarding')}>Return to Onboarding</Button>
        </div>
      </div>
    );
  }

  const currentDayPlan = mealPlan.days[selectedDay];
  const dayTotals = currentDayPlan.meals.reduce((acc, m) => ({ calories: acc.calories + m.calories, protein: acc.protein + m.macros.protein_g, carbs: acc.carbs + m.macros.carbs_g, fats: acc.fats + m.macros.fat_g }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  return (
    <div className="min-h-screen py-12 bg-gradient-subtle">
      <div className="container px-4 mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div><h1 className="text-4xl font-bold mb-2">Hi {userData.name}! 👋</h1><p className="text-lg text-muted-foreground">Your AI-generated personalized diet plan</p></div>
            <Button variant="outline" onClick={() => navigate('/')}><Home className="w-4 h-4 mr-2" />Home</Button>
          </div>
        </div>

        {isFallback && <Alert className="mb-6"><AlertCircle className="h-4 w-4" /><AlertDescription>Using fallback plan - AI service unavailable.</AlertDescription></Alert>}

        <ConstraintsBadge dietType={userData.dietPreference} allergens={userData.allergies?.split(',').map((a: string) => a.trim()).filter(Boolean)} medicalConditions={userData.medicalConditions} dailyExclusions={dailyExclusions} />

        <div className="grid md:grid-cols-4 gap-4 my-8">
          <Card className="shadow-soft"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Daily Calories</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{dailyCalories}</div><p className="text-xs text-muted-foreground">kcal/day</p></CardContent></Card>
          <Card className="shadow-soft"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Protein</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{targetMacros.protein}g</div><p className="text-xs text-muted-foreground">{Math.round((targetMacros.proteinCalories / dailyCalories) * 100)}%</p></CardContent></Card>
          <Card className="shadow-soft"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Carbs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{targetMacros.carbs}g</div><p className="text-xs text-muted-foreground">{Math.round((targetMacros.carbsCalories / dailyCalories) * 100)}%</p></CardContent></Card>
          <Card className="shadow-soft"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Fats</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{targetMacros.fats}g</div><p className="text-xs text-muted-foreground">{Math.round((targetMacros.fatsCalories / dailyCalories) * 100)}%</p></CardContent></Card>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {mealPlan.days.map((day, idx) => <Button key={idx} variant={selectedDay === idx ? "default" : "outline"} onClick={() => setSelectedDay(idx)} className="whitespace-nowrap">{day.day}</Button>)}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Button variant="outline" onClick={handleRegeneratePlan} disabled={isLoading}><RefreshCw className="w-4 h-4 mr-2" />Regenerate</Button>
          <Button variant="outline" onClick={() => setGroceryModalOpen(true)}><ShoppingCart className="w-4 h-4 mr-2" />Grocery List</Button>
          <Button variant="outline" onClick={handleExportCalendar}><Calendar className="w-4 h-4 mr-2" />Export Calendar</Button>
          <Button variant="outline" onClick={handleDownload}><Download className="w-4 h-4 mr-2" />Download PDF</Button>
          <Button variant="default" onClick={() => navigate('/progress')}><TrendingUp className="w-4 h-4 mr-2" />Track Progress</Button>
        </div>

        <Card className="mb-6 shadow-soft"><CardHeader><CardTitle>{currentDayPlan.day} Summary</CardTitle><CardDescription>Total: {dayTotals.calories} kcal | P: {dayTotals.protein}g | C: {dayTotals.carbs}g | F: {dayTotals.fats}g</CardDescription></CardHeader></Card>

        <div className="space-y-6">
          {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
            const meals = currentDayPlan.meals.filter(m => m.type === mealType || (mealType === 'snack' && m.type === 'snacks'));
            if (meals.length === 0) return null;
            return (
              <Card key={mealType} className="shadow-soft">
                <CardHeader><CardTitle className="capitalize text-xl">{mealType}</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {meals.map((meal, idx) => {
                      const mealIdx = currentDayPlan.meals.indexOf(meal);
                      const isCompleted = isMealCompleted(todaysDate, selectedDay, meal.type);
                      return (
                        <div key={idx} className="p-4 rounded-lg bg-accent/30 border border-border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-3 flex-1">
                              <Checkbox checked={isCompleted} onCheckedChange={(checked) => handleToggleAdherence(selectedDay, meal.type, meal.name, checked as boolean)} />
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1">{meal.name}</h4>
                                <p className="text-sm text-muted-foreground mb-1">{meal.portions}</p>
                                {meal.ingredients && <p className="text-xs text-muted-foreground">Ingredients: {meal.ingredients.join(', ')}</p>}
                              </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleSwapMeal(selectedDay, mealIdx)}><Repeat className="w-3 h-3 mr-1" />Swap</Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="secondary">{meal.calories} kcal</Badge>
                            <Badge variant="outline">P: {meal.macros.protein_g}g</Badge>
                            <Badge variant="outline">C: {meal.macros.carbs_g}g</Badge>
                            <Badge variant="outline">F: {meal.macros.fat_g}g</Badge>
                            {meal.tags?.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {mealPlan.summary.notes && (
          <Card className="mt-8 shadow-soft border-primary/20 bg-gradient-to-br from-accent/30 to-accent/10">
            <CardHeader><CardTitle>💡 Personalized Notes</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{mealPlan.summary.notes}</p></CardContent>
          </Card>
        )}

        <div className="mt-8">
          <AIChatBox userContext={{ goal: userData.goal, dietType: userData.dietPreference || 'mixed', targetCalories: dailyCalories }} />
        </div>

        <MealSwapModal open={swapModalOpen} onOpenChange={setSwapModalOpen} alternatives={swapAlternatives} isLoading={swapLoading} onSelect={handleSelectSwap} />
        <GroceryListModal open={groceryModalOpen} onOpenChange={setGroceryModalOpen} groceryList={mealPlan ? generateGroceryList(mealPlan) : { proteins: [], grains: [], vegetables: [], fruits: [], dairy: [], pantry: [], other: [] }} />
      </div>
    </div>
  );
};

export default ResultsNew;
