import { describe, it, expect } from '@jest/globals';

describe('Math Utilities', () => {
  describe('Basic Math', () => {
    it('should add numbers', () => {
      expect(2 + 3).toBe(5);
    });

    it('should subtract numbers', () => {
      expect(10 - 4).toBe(6);
    });

    it('should multiply numbers', () => {
      expect(6 * 7).toBe(42);
    });

    it('should divide numbers', () => {
      expect(20 / 4).toBe(5);
    });

    it('should calculate modulo', () => {
      expect(17 % 5).toBe(2);
    });

    it('should handle exponentiation', () => {
      expect(2 ** 3).toBe(8);
    });
  });

  describe('Rounding', () => {
    it('should round to nearest integer', () => {
      expect(Math.round(3.4)).toBe(3);
      expect(Math.round(3.6)).toBe(4);
    });

    it('should round up', () => {
      expect(Math.ceil(3.1)).toBe(4);
    });

    it('should round down', () => {
      expect(Math.floor(3.9)).toBe(3);
    });

    it('should truncate decimal', () => {
      expect(Math.trunc(3.9)).toBe(3);
      expect(Math.trunc(-3.9)).toBe(-3);
    });

    it('should round to decimal places', () => {
      const roundTo = (num, decimals) => 
        Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
      expect(roundTo(3.14159, 2)).toBe(3.14);
    });
  });

  describe('Comparison', () => {
    it('should find minimum', () => {
      expect(Math.min(5, 2, 8, 1)).toBe(1);
    });

    it('should find maximum', () => {
      expect(Math.max(5, 2, 8, 1)).toBe(8);
    });

    it('should clamp value', () => {
      const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('Random Numbers', () => {
    it('should generate random number in range', () => {
      const randomInRange = (min, max) => 
        Math.floor(Math.random() * (max - min + 1)) + min;
      const num = randomInRange(1, 10);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(10);
    });

    it('should generate random float', () => {
      const num = Math.random();
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThan(1);
    });
  });

  describe('Special Values', () => {
    it('should handle absolute value', () => {
      expect(Math.abs(-5)).toBe(5);
      expect(Math.abs(5)).toBe(5);
    });

    it('should calculate square root', () => {
      expect(Math.sqrt(16)).toBe(4);
      expect(Math.sqrt(25)).toBe(5);
    });

    it('should calculate power', () => {
      expect(Math.pow(2, 3)).toBe(8);
      expect(Math.pow(10, 2)).toBe(100);
    });

    it('should handle infinity', () => {
      expect(1 / 0).toBe(Infinity);
      expect(-1 / 0).toBe(-Infinity);
    });

    it('should detect NaN', () => {
      expect(Number.isNaN(NaN)).toBe(true);
      expect(Number.isNaN(5)).toBe(false);
    });
  });
});

