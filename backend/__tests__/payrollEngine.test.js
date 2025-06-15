// backend/__tests__/payrollEngine.test.js

import { jest } from '@jest/globals';
import { calculateIGR } from '../services/payrollEngine.js'; // Keep calculateIGR as it's the exported name

// Mock the prisma client for this specific unit test file
const mockPrismaTx = {
  taxBracket: {
    findMany: jest.fn().mockResolvedValue([
      // Mock the Moroccan tax brackets so the test doesn't need a database
      { jurisdictionId: 'MA', year: 2024, incomeMin: 0, incomeMax: 30000, rate: 0.00, flatDeduction: 0 },
      { jurisdictionId: 'MA', year: 2024, incomeMin: 30001, incomeMax: 50000, rate: 0.10, flatDeduction: 3000 },
      { jurisdictionId: 'MA', year: 2024, incomeMin: 50001, incomeMax: 60000, rate: 0.20, flatDeduction: 8000 },
      { jurisdictionId: 'MA', year: 2024, incomeMin: 60001, incomeMax: 80000, rate: 0.30, flatDeduction: 14000 },
      { jurisdictionId: 'MA', year: 2024, incomeMin: 80001, incomeMax: 180000, rate: 0.34, flatDeduction: 17200 },
      { jurisdictionId: 'MA', year: 2024, incomeMin: 180001, incomeMax: null, rate: 0.38, flatDeduction: 24400 },
    ]),
  },
};

describe('Payroll Engine - Unit Tests', () => {
  describe('calculateIGR (Moroccan Income Tax 2024)', () => {

    // Helper to call the function with the mock prisma transaction client
    const calculateWithMock = (annualIncome) => {
      return calculateIGR(annualIncome, 'MA', 2024, mockPrismaTx);
    };

    it('should return 0 for income within the tax-exempt bracket', async () => {
      expect(await calculateWithMock(0)).toBe(0);
      expect(await calculateWithMock(30000)).toBe(0);
    });

    it('should correctly calculate tax for the 10% bracket', async () => {
      // Calculation: 50000 * 0.10 - 3000 = 2000
      expect(await calculateWithMock(50000)).toBeCloseTo(2000);
    });

    it('should correctly calculate tax for the 20% bracket', async () => {
      // Calculation: 60000 * 0.20 - 8000 = 4000
      expect(await calculateWithMock(60000)).toBeCloseTo(4000);
    });

    it('should correctly calculate tax for the 30% bracket', async () => {
      // Calculation: 80000 * 0.30 - 14000 = 10000
      expect(await calculateWithMock(80000)).toBeCloseTo(10000);
    });

    it('should correctly calculate tax for the 34% bracket', async () => {
      // Calculation: 180000 * 0.34 - 17200 = 44000
      expect(await calculateWithMock(180000)).toBeCloseTo(44000);
    });

    it('should correctly calculate tax for the highest (38%) bracket', async () => {
      // Calculation: 240000 * 0.38 - 24400 = 66800
      expect(await calculateWithMock(240000)).toBeCloseTo(66800);
    });

    it('should handle non-boundary income values correctly', async () => {
      // Calculation: 75000 * 0.30 - 14000 = 8500
      expect(await calculateWithMock(75000)).toBeCloseTo(8500);
    });

    it('should handle edge cases near bracket limits', async () => {
      // Calculation: 50001 * 0.20 - 8000 = 2000.2
      expect(await calculateWithMock(50001)).toBeCloseTo(2000.2, 2);
    });
  });
});