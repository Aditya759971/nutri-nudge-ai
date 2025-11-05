import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { type Meal } from '@/lib/ai';

interface MealSwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alternatives: Meal[];
  isLoading: boolean;
  onSelect: (meal: Meal) => void;
}

export function MealSwapModal({ open, onOpenChange, alternatives, isLoading, onSelect }: MealSwapModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Swap Meal</DialogTitle>
          <DialogDescription>
            Choose an alternative meal with similar nutritional value
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3">Finding alternatives...</span>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {alternatives.map((meal, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-border hover:border-primary transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">{meal.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{meal.portions}</p>
                    {meal.ingredients && (
                      <p className="text-xs text-muted-foreground">
                        Ingredients: {meal.ingredients.join(', ')}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      onSelect(meal);
                      onOpenChange(false);
                    }}
                  >
                    Select
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary">{meal.calories} kcal</Badge>
                  <Badge variant="outline">P: {meal.macros.protein_g}g</Badge>
                  <Badge variant="outline">C: {meal.macros.carbs_g}g</Badge>
                  <Badge variant="outline">F: {meal.macros.fat_g}g</Badge>
                  {meal.tags?.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
