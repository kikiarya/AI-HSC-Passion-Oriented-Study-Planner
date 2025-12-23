import { describe, it, expect } from 'vitest';

describe('Frontend Validation Utilities', () => {
  describe('Form Validation', () => {
    it('should validate email format', () => {
      const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
    });

    it('should validate required field', () => {
      const isRequired = (value) => 
        value !== undefined && value !== null && value !== '';
      
      expect(isRequired('text')).toBe(true);
      expect(isRequired('')).toBe(false);
      expect(isRequired(null)).toBe(false);
    });

    it('should validate min length', () => {
      const hasMinLength = (str, min) => str && str.length >= min;
      
      expect(hasMinLength('hello', 3)).toBe(true);
      expect(hasMinLength('hi', 3)).toBe(false);
    });

    it('should validate max length', () => {
      const hasMaxLength = (str, max) => str && str.length <= max;
      
      expect(hasMaxLength('hello', 10)).toBe(true);
      expect(hasMaxLength('very long string', 5)).toBe(false);
    });
  });

  describe('Number Validation', () => {
    it('should validate positive number', () => {
      const isPositive = (num) => num > 0;
      
      expect(isPositive(5)).toBe(true);
      expect(isPositive(-5)).toBe(false);
      expect(isPositive(0)).toBe(false);
    });

    it('should validate range', () => {
      const inRange = (num, min, max) => num >= min && num <= max;
      
      expect(inRange(50, 0, 100)).toBe(true);
      expect(inRange(150, 0, 100)).toBe(false);
    });

    it('should validate integer', () => {
      const isInteger = (num) => Number.isInteger(num);
      
      expect(isInteger(42)).toBe(true);
      expect(isInteger(3.14)).toBe(false);
    });
  });

  describe('Data Type Validation', () => {
    it('should check if array', () => {
      expect(Array.isArray([1, 2, 3])).toBe(true);
      expect(Array.isArray('string')).toBe(false);
    });

    it('should check if object', () => {
      const isObject = (val) => 
        val !== null && typeof val === 'object' && !Array.isArray(val);
      
      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject([1, 2])).toBe(false);
      expect(isObject(null)).toBe(false);
    });

    it('should check if string', () => {
      expect(typeof 'hello').toBe('string');
      expect(typeof 123).toBe('number');
    });
  });
});

