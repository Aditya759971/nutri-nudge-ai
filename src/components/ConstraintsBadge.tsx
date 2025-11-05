import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ConstraintsBadgeProps {
  dietType?: string;
  allergens?: string[];
  medicalConditions?: string;
  dailyExclusions?: Record<string, string[]>;
}

export function ConstraintsBadge({ dietType, allergens, medicalConditions, dailyExclusions }: ConstraintsBadgeProps) {
  const hasConstraints =
    (dietType && dietType !== 'mixed') ||
    (allergens && allergens.length > 0) ||
    medicalConditions ||
    (dailyExclusions && Object.keys(dailyExclusions).length > 0);

  if (!hasConstraints) return null;

  return (
    <Card className="shadow-soft border-primary/20 bg-gradient-to-br from-accent/30 to-accent/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">⚡ Active Constraints</CardTitle>
        <CardDescription>Your personalized dietary restrictions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {dietType && dietType !== 'mixed' && (
            <Badge variant="default" className="text-sm">
              🌱 {dietType}
            </Badge>
          )}
          
          {allergens && allergens.length > 0 && allergens.map(allergen => (
            <Badge key={allergen} variant="destructive" className="text-sm">
              ⚠️ No {allergen}
            </Badge>
          ))}
          
          {medicalConditions && (
            <Badge variant="secondary" className="text-sm">
              💊 {medicalConditions}
            </Badge>
          )}
          
          {dailyExclusions && Object.entries(dailyExclusions).map(([day, foods]) => (
            <Badge key={day} variant="outline" className="text-sm">
              🚫 No {foods.join(', ')} on {day}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
