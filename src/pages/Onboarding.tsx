import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";

interface FormData {
  name: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  targetWeight: string;
  goal: string;
  activityLevel: string;
  dietaryPreference: string;
  allergies: string;
  routine: string;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    targetWeight: "",
    goal: "",
    activityLevel: "",
    dietaryPreference: "",
    allergies: "",
    routine: "",
  });

  const calculateBMI = () => {
    if (formData.height && formData.weight) {
      const heightM = parseFloat(formData.height) / 100;
      const weightKg = parseFloat(formData.weight);
      const bmi = (weightKg / (heightM * heightM)).toFixed(1);
      return bmi;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.age || !formData.height || !formData.weight || !formData.goal) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Store form data in localStorage (in real app, would send to backend)
    localStorage.setItem('userData', JSON.stringify(formData));
    
    toast({
      title: "Profile Created!",
      description: "Generating your personalized meal plan...",
    });
    
    navigate('/results');
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const bmi = calculateBMI();

  return (
    <div className="min-h-screen py-12 bg-gradient-subtle">
      <div className="container px-4 mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Tell Us About Yourself</h1>
          <p className="text-lg text-muted-foreground">
            Help us create the perfect meal plan tailored to your needs
          </p>
        </div>

        <Card className="shadow-soft border-border">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>All fields marked with * are required</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={formData.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(val) => handleChange('gender', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Physical Measurements */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm) *</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    value={formData.height}
                    onChange={(e) => handleChange('height', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={formData.weight}
                    onChange={(e) => handleChange('weight', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetWeight">Target Weight (kg)</Label>
                  <Input
                    id="targetWeight"
                    type="number"
                    placeholder="65"
                    value={formData.targetWeight}
                    onChange={(e) => handleChange('targetWeight', e.target.value)}
                  />
                </div>
              </div>

              {bmi && (
                <div className="p-4 rounded-lg bg-accent/50 border border-border">
                  <p className="text-sm font-medium">Current BMI: <span className="text-lg text-primary">{bmi}</span></p>
                </div>
              )}

              {/* Goals & Preferences */}
              <div className="space-y-2">
                <Label htmlFor="goal">Primary Goal *</Label>
                <Select value={formData.goal} onValueChange={(val) => handleChange('goal', val)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight-loss">Weight Loss</SelectItem>
                    <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="diabetes">Manage Diabetes</SelectItem>
                    <SelectItem value="pcos">Manage PCOS</SelectItem>
                    <SelectItem value="clean-eating">Clean Eating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityLevel">Activity Level</Label>
                <Select value={formData.activityLevel} onValueChange={(val) => handleChange('activityLevel', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (Little to no exercise)</SelectItem>
                    <SelectItem value="light">Lightly Active (Exercise 1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderately Active (Exercise 3-5 days/week)</SelectItem>
                    <SelectItem value="very-active">Very Active (Exercise 6-7 days/week)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dietaryPreference">Dietary Preference</Label>
                <Select value={formData.dietaryPreference} onValueChange={(val) => handleChange('dietaryPreference', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cuisine preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indian">Indian</SelectItem>
                    <SelectItem value="western">Western</SelectItem>
                    <SelectItem value="mediterranean">Mediterranean</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="mixed">Mixed / Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies or Restrictions (Optional)</Label>
                <Input
                  id="allergies"
                  placeholder="e.g., Nuts, Dairy, Gluten"
                  value={formData.allergies}
                  onChange={(e) => handleChange('allergies', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="routine">Daily Routine (Optional)</Label>
                <Textarea
                  id="routine"
                  placeholder="Tell us about your daily schedule, eating habits, or any other details..."
                  value={formData.routine}
                  onChange={(e) => handleChange('routine', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  className="flex-1 group"
                >
                  Generate My Plan
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
