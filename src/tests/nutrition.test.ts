import { describe, it, expect } from 'vitest';
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacrosForGoal,
} from '../lib/nutrition-utils';

describe('Nutrition Calculations', () => {
  describe('calculateBMR', () => {
    it('should calculate BMR for male using Mifflin-St Jeor', () => {
      // Male: 70kg, 175cm, 30yo
      // BMR = 10 * 70 + 6.25 * 175 - 5 * 30 + 5
      // BMR = 700 + 1093.75 - 150 + 5 = 1648.75
      const bmr = calculateBMR(70, 175, 30, 'male');
      expect(bmr).toBeCloseTo(1648.75, 0);
    });

    it('should calculate BMR for female using Mifflin-St Jeor', () => {
      // Female: 60kg, 165cm, 25yo
      // BMR = 10 * 60 + 6.25 * 165 - 5 * 25 - 161
      // BMR = 600 + 1031.25 - 125 - 161 = 1345.25
      const bmr = calculateBMR(60, 165, 25, 'female');
      expect(bmr).toBeCloseTo(1345.25, 0);
    });
  });

  describe('calculateTDEE', () => {
    it('should apply sedentary multiplier correctly', () => {
      const bmr = 1500;
      const tdee = calculateTDEE(bmr, 'sedentary');
      expect(tdee).toBe(1800); // 1500 * 1.2 = 1800
    });

    it('should apply moderate activity multiplier correctly', () => {
      const bmr = 1500;
      const tdee = calculateTDEE(bmr, 'moderate');
      expect(tdee).toBe(2325); // 1500 * 1.55 = 2325
    });

    it('should apply very active multiplier correctly', () => {
      const bmr = 1500;
      const tdee = calculateTDEE(bmr, 'very-active');
      expect(tdee).toBe(2588); // 1500 * 1.725 = 2587.5, rounded to 2588
    });
  });

  describe('calculateTargetCalories', () => {
    it('should subtract 500 for weight loss', () => {
      const tdee = 2000;
      const target = calculateTargetCalories(tdee, 'weight-loss');
      expect(target).toBe(1500);
    });

    it('should add 300 for muscle gain', () => {
      const tdee = 2000;
      const target = calculateTargetCalories(tdee, 'muscle-gain');
      expect(target).toBe(2300);
    });

    it('should maintain TDEE for maintenance', () => {
      const tdee = 2000;
      const target = calculateTargetCalories(tdee, 'maintenance');
      expect(target).toBe(2000);
    });
  });

  describe('calculateMacrosForGoal', () => {
    it('should calculate macros for weight loss correctly', () => {
      // 1800 kcal, 75kg body weight, weight loss goal
      // Protein: 75 * 2.0 = 150g (rounded to nearest 5 = 150g) = 600 kcal
      // Fat: 1800 * 0.25 = 450 kcal = 50g (rounded to nearest 5 = 50g)
      // Carbs: (1800 - 600 - 450) / 4 = 187.5g (rounded to nearest 5 = 190g)
      const macros = calculateMacrosForGoal(1800, 75, 'weight-loss');
      
      expect(macros.protein).toBeGreaterThanOrEqual(145);
      expect(macros.protein).toBeLessThanOrEqual(155);
      expect(macros.fats).toBeGreaterThanOrEqual(45);
      expect(macros.fats).toBeLessThanOrEqual(55);
      expect(macros.carbs).toBeGreaterThanOrEqual(180);
      expect(macros.carbs).toBeLessThanOrEqual(200);
      
      // Total calories should be close to target
      const totalCals = macros.protein * 4 + macros.carbs * 4 + macros.fats * 9;
      expect(totalCals).toBeGreaterThanOrEqual(1750);
      expect(totalCals).toBeLessThanOrEqual(1850);
    });

    it('should calculate macros for muscle gain correctly', () => {
      const macros = calculateMacrosForGoal(2500, 80, 'muscle-gain');
      
      // Protein should be ~2.0g/kg = 160g
      expect(macros.protein).toBeGreaterThanOrEqual(155);
      expect(macros.protein).toBeLessThanOrEqual(165);
      
      // Fat should be ~25% of calories = 625 kcal = ~70g
      expect(macros.fats).toBeGreaterThanOrEqual(65);
      expect(macros.fats).toBeLessThanOrEqual(75);
      
      // Verify total is close to target
      const totalCals = macros.protein * 4 + macros.carbs * 4 + macros.fats * 9;
      expect(totalCals).toBeGreaterThanOrEqual(2450);
      expect(totalCals).toBeLessThanOrEqual(2550);
    });

    it('should round macros to nearest 5g', () => {
      const macros = calculateMacrosForGoal(2000, 70, 'maintenance');
      
      // All macros should be divisible by 5
      expect(macros.protein % 5).toBe(0);
      expect(macros.carbs % 5).toBe(0);
      expect(macros.fats % 5).toBe(0);
    });
  });
});
