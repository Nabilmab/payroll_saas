// backend/__tests__/payrollEngine.test.js

import { calculateIGR } from '../services/payrollEngine.js';

describe('Payroll Engine - Unit Tests', () => {
  describe('calculateIGR (Moroccan Income Tax 2024)', () => {

    it('should return 0 for income within the tax-exempt bracket', () => {
      expect(calculateIGR(0)).toBe(0);
      expect(calculateIGR(30000)).toBe(0);
    });

    it('should correctly calculate tax for the 10% bracket', () => {
      expect(calculateIGR(50000)).toBeCloseTo(2000);
    });

    it('should correctly calculate tax for the 20% bracket', () => {
      expect(calculateIGR(60000)).toBeCloseTo(4000);
    });

    it('should correctly calculate tax for the 30% bracket', () => {
      expect(calculateIGR(80000)).toBeCloseTo(10000);
    });

    it('should correctly calculate tax for the 34% bracket', () => {
      expect(calculateIGR(180000)).toBeCloseTo(44000);
    });

    it('should correctly calculate tax for the highest (38%) bracket', () => {
      expect(calculateIGR(240000)).toBeCloseTo(66800);
    });

    it('should handle non-boundary income values correctly', () => {
      expect(calculateIGR(75000)).toBeCloseTo(8500);
    });

    it('should handle edge cases near bracket limits', () => {
      // ✅ FIX: Corrected the expected value from 3000.2 to 2000.2
      // Calculation: (50001 * 0.20) - 8000 = 2000.2
      expect(calculateIGR(50001)).toBeCloseTo(2000.2, 2);
    });
  });
});