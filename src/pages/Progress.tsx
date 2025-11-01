import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingDown, TrendingUp, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Progress = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentWeight, setCurrentWeight] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleWeightUpdate = () => {
    if (!currentWeight) return;
    
    toast({
      title: "Weight Updated",
      description: "Your progress has been recorded successfully!",
    });
    
    setCurrentWeight("");
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
              <div className="text-2xl font-bold">70 kg</div>
              <p className="text-xs text-muted-foreground">Jan 1, 2025</p>
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
              <div className="text-2xl font-bold">68 kg</div>
              <p className="text-xs text-green-600">-2 kg progress</p>
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
              <div className="text-2xl font-bold">65 kg</div>
              <p className="text-xs text-muted-foreground">3 kg to go</p>
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
            onClick={() => {
              toast({
                title: "Recalculating Plan",
                description: "Your meal plan is being updated based on your progress...",
              });
              setTimeout(() => navigate('/results'), 1500);
            }}
          >
            Recalculate My Plan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Progress;
