import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-nutrition.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-accent/30 to-background">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <div className="container relative z-10 px-4 py-20 mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-accent/50 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Nutrition</span>
          </div>
          
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
            AI-Powered Diets,
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Made Just for You
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto mb-8 text-lg md:text-xl text-muted-foreground">
            Personalized meal plans that evolve with your lifestyle, health goals, and taste.
            From weight loss to muscle gain, we've got you covered.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="hero"
              size="lg"
              onClick={() => navigate('/onboarding')}
              className="group"
            >
              Start My Plan
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-subtle">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to transform your nutrition journey
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 text-center shadow-soft hover:shadow-glow transition-all duration-300 hover:-translate-y-2 border-border">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Enter Your Details</h3>
              <p className="text-muted-foreground">
                Share your age, weight, health goals, dietary preferences, and lifestyle habits
              </p>
            </Card>
            
            <Card className="p-8 text-center shadow-soft hover:shadow-glow transition-all duration-300 hover:-translate-y-2 border-border">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-secondary/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Get AI Recommendations</h3>
              <p className="text-muted-foreground">
                Our AI creates a personalized meal plan with exact portions and nutrition breakdown
              </p>
            </Card>
            
            <Card className="p-8 text-center shadow-soft hover:shadow-glow transition-all duration-300 hover:-translate-y-2 border-border">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Track & Evolve</h3>
              <p className="text-muted-foreground">
                Monitor progress, swap meals, and let the AI refine your plan as you grow
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why NutriNudge?</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { title: "Personalized Plans", desc: "Tailored to your body, goals, and preferences" },
              { title: "Multiple Cuisines", desc: "Indian, Western, Mediterranean & more" },
              { title: "Smart Swaps", desc: "Replace meals while maintaining nutrition balance" },
              { title: "Progress Tracking", desc: "Monitor your journey and adjust on the go" },
              { title: "Budget Friendly", desc: "Get affordable meal options within your budget" },
              { title: "Health Conditions", desc: "Special plans for diabetes, PCOS, and more" },
            ].map((feature, idx) => (
              <Card key={idx} className="p-6 border-border hover:border-primary/50 transition-all duration-300">
                <h3 className="font-semibold mb-2 text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Diet?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands who've already started their journey to better health
          </p>
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate('/onboarding')}
            className="group"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-background">
        <div className="container px-4 mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2025 NutriNudge. Your personalized nutrition companion.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
