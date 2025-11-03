import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingDown, TrendingUp, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  getWeightHistory, 
  addWeightEntry, 
  getLatestWeight, 
  getStartingWeight 
} from "@/lib/nutrition-utils";

const Progress = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentWeight, setCurrentWeight] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [startingWeight, setStartingWeight] = useState<number | null>(null);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [targetWeight, setTargetWeight] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>("");

  useEffect(() => {
    // Load user data
    const userData = localStorage.getItem('userData');
    if (userData) {
      const data = JSON.parse(userData);
      setTargetWeight(parseFloat(data.targetWeight) || null);
    }

    // Load weight history and ALWAYS use persisted start weight
    const persistedStartWeight = localStorage.getItem('nutri:startWeightKg');
    const persistedCurrentWeight = localStorage.getItem('nutri:currentWeightKg');
    
    if (persistedStartWeight) {
      setStartingWeight(parseFloat(persistedStartWeight));
    }
    
    if (persistedCurrentWeight) {
      setLatestWeight(parseFloat(persistedCurrentWeight));
    }
    
    const history = getWeightHistory();
    if (history.length > 0) {
      setStartDate(new Date(history[0].date).toLocaleDateString());
      // Only use history weight if no persisted values exist
      if (!persistedStartWeight) {
        setStartingWeight(history[0].weight);
      }
      if (!persistedCurrentWeight) {
        setLatestWeight(history[history.length - 1].weight);
      }
    }
  }, []);

  const handleWeightUpdate = () => {
    if (!currentWeight) return;
    
    const weight = parseFloat(currentWeight);
    if (isNaN(weight) || weight <= 0) {
      toast({
        title: "Invalid Weight",
        description: "Please enter a valid weight value",
        variant: "destructive",
      });
      return;
    }
    
    // Add new weight entry to history
    addWeightEntry(weight);
    
    // Update persisted current weight
    localStorage.setItem('nutri:currentWeightKg', weight.toString());
    
    // Update displayed values
    setLatestWeight(weight);
    
    toast({
      title: "Weight Updated",
      description: "Your progress has been recorded successfully!",
    });
    
    setCurrentWeight("");
  };

  const handleRecalculatePlan = () => {
    if (!latestWeight) {
      toast({
        title: "No Weight Data",
        description: "Please log your current weight first",
        variant: "destructive",
      });
      return;
    }

    // Clear meal plan cache to force regeneration
    localStorage.removeItem('nutri:mealPlan');
    localStorage.removeItem('nutri:mealPlanTimestamp');
    
    toast({
      title: "Recalculating Plan",
      description: "Your meal plan is being updated based on your new weight...",
    });
    
    // Navigate to results which will detect the weight change and regenerate
    setTimeout(() => navigate('/results'), 1500);
  };

  const calculateProgress = () => {
    if (!startingWeight || !latestWeight) return 0;
    return startingWeight - latestWeight;
  };

  const calculateRemaining = () => {
    if (!latestWeight || !targetWeight) return 0;
    return latestWeight - targetWeight;
  };

  const handleFeedback = (type: string) => {
    setFeedback(type);
    toast({
      title: "Feedback Received",
      description: "We'll adjust your meal plan based on your feedback",
    });
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-subtle">
      <div className="container px-4 mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/results')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Meal Plan
        </Button>

        <h1 className="text-4xl font-bold mb-8">Track Your Progress</h1>

        {/* Weight Tracker */}
        <Card className="mb-6 shadow-soft border-border">
          <CardHeader>
            <CardTitle>Weight Progress</CardTitle>
            <CardDescription>Log your current weight to track changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="weight">Current Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="70"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                />
              </div>
              <Button onClick={handleWeightUpdate} variant="default">
                Update Weight
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="shadow-soft border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Starting Weight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {startingWeight ? `${startingWeight} kg` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">{startDate || 'Not set'}</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Current Weight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {latestWeight ? `${latestWeight} kg` : 'N/A'}
              </div>
              {calculateProgress() !== 0 && (
                <p className={`text-xs ${calculateProgress() > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateProgress() > 0 ? '-' : '+'}{Math.abs(calculateProgress()).toFixed(1)} kg progress
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Target Weight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {targetWeight ? `${targetWeight} kg` : 'N/A'}
              </div>
              {calculateRemaining() > 0 && (
                <p className="text-xs text-muted-foreground">
                  {calculateRemaining().toFixed(1)} kg to go
                </p>
              )}
              {calculateRemaining() < 0 && (
                <p className="text-xs text-green-600">
                  Target achieved! 🎉
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feedback */}
        <Card className="shadow-soft border-border">
          <CardHeader>
            <CardTitle>How Are You Feeling?</CardTitle>
            <CardDescription>Help us improve your meal plan with your feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-3">
              <Button
                variant={feedback === 'restrictive' ? 'default' : 'outline'}
                onClick={() => handleFeedback('restrictive')}
                className="h-auto py-4 flex-col"
              >
                <span className="text-2xl mb-2">😓</span>
                <span className="text-sm">Too Restrictive</span>
              </Button>
              
              <Button
                variant={feedback === 'energetic' ? 'default' : 'outline'}
                onClick={() => handleFeedback('energetic')}
                className="h-auto py-4 flex-col"
              >
                <span className="text-2xl mb-2">💪</span>
                <span className="text-sm">Feeling Great</span>
              </Button>
              
              <Button
                variant={feedback === 'repetitive' ? 'default' : 'outline'}
                onClick={() => handleFeedback('repetitive')}
                className="h-auto py-4 flex-col"
              >
                <span className="text-2xl mb-2">🔄</span>
                <span className="text-sm">Too Repetitive</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recalculate Button */}
        <div className="mt-8 text-center">
          <Button
            variant="hero"
            size="lg"
            onClick={handleRecalculatePlan}
          >
            Recalculate My Plan
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            This will regenerate your meal plan based on your current weight
          </p>
        </div>
      </div>
    </div>
  );
};

export default Progress;
