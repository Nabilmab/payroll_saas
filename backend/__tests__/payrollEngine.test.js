// FIX: The path must go up one level and into the 'services' directory.
const { calculateIGR } = require('../services/payrollEngine');

describe('Payroll Engine - Unit Tests', () => {

  describe('calculateIGR (Moroccan Income Tax 2024)', () => {

    it('should return 0 for income within the tax-exempt bracket', () => {
      // Annual income of 30,000 MAD or less is exempt
      expect(calculateIGR(0)).toBe(0);
      expect(calculateIGR(30000)).toBe(0);
    });

    it('should correctly calculate tax for the 10% bracket', () => {
      // Income: 50,000 MAD annually
      // Tax: (50000 * 0.10) - 3000 = 2000
      expect(calculateIGR(50000)).toBe(2000);
    });

    it('should correctly calculate tax for the 20% bracket', () => {
      // Income: 60,000 MAD annually
      // Tax: (60000 * 0.20) - 8000 = 4000
      expect(calculateIGR(60000)).toBe(4000);
    });

    it('should correctly calculate tax for the 30% bracket', () => {
      // Income: 80,000 MAD annually
      // Tax: (80000 * 0.30) - 14000 = 10000
      expect(calculateIGR(80000)).toBe(10000);
    });

    it('should correctly calculate tax for the 34% bracket', () => {
      // Income: 180,000 MAD annually
      // Tax: (180000 * 0.34) - 17200 = 44000
      expect(calculateIGR(180000)).toBe(44000);
    });

    it('should correctly calculate tax for the highest (38%) bracket', () => {
      // Income: 240,000 MAD annually
      // Tax: (240000 * 0.38) - 24400 = 66800
      expect(calculateIGR(240000)).toBe(66800);
    });

    it('should handle non-boundary income values correctly', () => {
      // An income of 75,000 falls in the 30% bracket
      // Tax: (75000 * 0.30) - 14000 = 8500
      expect(calculateIGR(75000)).toBe(8500);
    });

  });
  
});