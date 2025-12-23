import { describe, it, expect } from '@jest/globals';

describe('Date Utilities', () => {
  describe('Date Creation', () => {
    it('should create date from timestamp', () => {
      const date = new Date(2025, 10, 1); // Month is 0-indexed
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(10);
    });

    it('should create date from ISO string', () => {
      const date = new Date('2025-11-01T00:00:00Z');
      expect(date.toISOString()).toContain('2025-11-01');
    });

    it('should get current date', () => {
      const now = new Date();
      expect(now).toBeInstanceOf(Date);
    });
  });

  describe('Date Comparison', () => {
    it('should compare two dates', () => {
      const date1 = new Date('2025-01-01');
      const date2 = new Date('2025-12-31');
      expect(date2 > date1).toBe(true);
    });

    it('should check if dates are equal', () => {
      const date1 = new Date('2025-11-01');
      const date2 = new Date('2025-11-01');
      expect(date1.getTime()).toBe(date2.getTime());
    });

    it('should calculate days difference', () => {
      const date1 = new Date('2025-11-01');
      const date2 = new Date('2025-11-10');
      const diffDays = Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(9);
    });
  });

  describe('Date Formatting', () => {
    it('should format to locale string', () => {
      const date = new Date('2025-11-01');
      const formatted = date.toLocaleDateString();
      expect(formatted).toContain('2025');
    });

    it('should extract year', () => {
      const date = new Date('2025-11-01');
      expect(date.getFullYear()).toBe(2025);
    });

    it('should extract month', () => {
      const date = new Date('2025-11-01');
      expect(date.getMonth()).toBe(10); // November (0-indexed)
    });

    it('should extract day', () => {
      const date = new Date('2025-11-01');
      expect(date.getDate()).toBe(1);
    });

    it('should get day of week', () => {
      const date = new Date('2025-11-01');
      const day = date.getDay();
      expect(day).toBeGreaterThanOrEqual(0);
      expect(day).toBeLessThanOrEqual(6);
    });
  });

  describe('Date Manipulation', () => {
    it('should add days to date', () => {
      const date = new Date('2025-11-01');
      date.setDate(date.getDate() + 5);
      expect(date.getDate()).toBe(6);
    });

    it('should add months to date', () => {
      const date = new Date('2025-11-01');
      date.setMonth(date.getMonth() + 1);
      expect(date.getMonth()).toBe(11); // December
    });

    it('should set specific date', () => {
      const date = new Date();
      date.setFullYear(2025, 0, 15); // Jan 15, 2025
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(15);
    });
  });
});

