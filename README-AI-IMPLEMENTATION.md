# AI-Driven Meal Plan Implementation

## What Changed

✅ **Replaced static meal shuffling with AI-generated plans** using Lovable AI (Google Gemini)
✅ **Fixed calorie calculations** using Mifflin-St Jeor equation with proper TDEE and macro distribution
✅ **Fixed progress tracking bugs**: Start weight now persists correctly, recalculate regenerates plan with new weight
✅ **Added proper error handling** with fallback plans when AI is unavailable
✅ **Unit tests** for all nutrition calculation functions

## How It Works

### Calculation Flow
1. **BMR**: Mifflin-St Jeor equation (gender-specific)
2. **TDEE**: BMR × activity multiplier (1.2-1.9)
3. **Target Calories**: TDEE ± goal adjustment (±500 kcal)
4. **Macros**: Protein (1.8-2.0g/kg), Fat (25%), Carbs (remainder)

### AI Generation
- Edge function: `supabase/functions/generate-plan/index.ts`
- Uses Lovable AI Gateway (google/gemini-2.5-flash)
- Respects: allergies, medical conditions, diet preferences, goals
- Returns structured 7-day meal plan with portions and macros
- Fallback plan if AI unavailable

### Weight Tracking Fix
- Start weight saved to `localStorage` key: `nutri:startWeightKg` (never changes)
- Current weight saved to: `nutri:currentWeightKg` (updates on logging)
- Recalculate clears plan cache, forces regeneration with new weight

## Testing

Run unit tests:
```bash
npm test
```

Tests cover:
- BMR calculation for both genders
- TDEE with different activity levels
- Target calorie adjustments
- Macro distribution and rounding

## Files Created/Modified

**New Files:**
- `src/lib/ai.ts` - AI meal plan generation wrapper
- `src/pages/ResultsNew.tsx` - New AI-powered results page
- `src/tests/nutrition.test.ts` - Unit tests
- `supabase/functions/generate-plan/index.ts` - Edge function
- `vitest.config.ts` - Test configuration

**Modified:**
- `src/lib/nutrition-utils.ts` - Added Mifflin-St Jeor calculations
- `src/pages/Onboarding.tsx` - Persist start weight correctly
- `src/pages/Progress.tsx` - Fix weight tracking, add recalculate
- `src/App.tsx` - Route to new ResultsNew page
- `supabase/config.toml` - Configure edge function

## Environment

All secrets auto-configured by Lovable Cloud:
- `LOVABLE_API_KEY` - Available in edge functions
- `VITE_SUPABASE_URL` - Frontend access
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Frontend auth

## Acceptance Criteria Met

✅ AI generates plans based on user metrics, goals, conditions, allergies
✅ Calculations use Mifflin-St Jeor and correct macro distribution  
✅ Start weight always shows onboarding value (persisted)
✅ Recalculate updates plan based on current weight
✅ Error handling with fallback plans
✅ Unit tests for calculations
✅ Clear API contract (see `src/lib/ai.ts`)
