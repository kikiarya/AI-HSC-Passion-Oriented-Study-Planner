import { describe, it, expect } from '@jest/globals';

describe('Calculations and Business Logic', () => {
  describe('Grade Calculations', () => {
    it('should calculate percentage', () => {
      const calculatePercentage = (score, total) => 
        Math.round((score / total) * 100);
      
      expect(calculatePercentage(80, 100)).toBe(80);
      expect(calculatePercentage(45, 50)).toBe(90);
    });

    it('should calculate weighted average', () => {
      const grades = [
        { score: 90, weight: 30 },
        { score: 80, weight: 40 },
        { score: 85, weight: 30 }
      ];
      
      // 计算: (90*30 + 80*40 + 85*30) / (30+40+30) = 8450 / 100 = 84.5 ≈ 85
      const totalWeighted = grades.reduce((sum, g) => sum + (g.score * g.weight), 0);
      const totalWeight = grades.reduce((sum, g) => sum + g.weight, 0);
      const average = Math.round(totalWeighted / totalWeight);
      
      expect(average).toBe(85);
    });

    it('should assign letter grade', () => {
      const getLetterGrade = (percentage) => {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
      };
      
      expect(getLetterGrade(95)).toBe('A');
      expect(getLetterGrade(85)).toBe('B');
      expect(getLetterGrade(75)).toBe('C');
      expect(getLetterGrade(65)).toBe('D');
      expect(getLetterGrade(55)).toBe('F');
    });

    it('should calculate GPA', () => {
      const calculateGPA = (grades) => {
        const gradePoints = {
          'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
        };
        const total = grades.reduce((sum, g) => sum + gradePoints[g], 0);
        return (total / grades.length).toFixed(2);
      };
      
      expect(calculateGPA(['A', 'B', 'A'])).toBe('3.67');
      expect(calculateGPA(['B', 'B', 'B'])).toBe('3.00');
    });
  });

  describe('Statistical Calculations', () => {
    it('should calculate average', () => {
      const numbers = [10, 20, 30, 40, 50];
      const avg = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
      expect(avg).toBe(30);
    });

    it('should find minimum', () => {
      const numbers = [5, 2, 8, 1, 9];
      const min = Math.min(...numbers);
      expect(min).toBe(1);
    });

    it('should find maximum', () => {
      const numbers = [5, 2, 8, 1, 9];
      const max = Math.max(...numbers);
      expect(max).toBe(9);
    });

    it('should calculate median', () => {
      const findMedian = (arr) => {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];
      };
      
      expect(findMedian([1, 3, 5])).toBe(3);
      expect(findMedian([1, 2, 3, 4])).toBe(2.5);
    });
  });

  describe('Data Formatting', () => {
    it('should format currency', () => {
      const formatCurrency = (amount) => `$${amount.toFixed(2)}`;
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(99.5)).toBe('$99.50');
    });

    it('should format percentage', () => {
      const formatPercentage = (value) => `${value}%`;
      expect(formatPercentage(75)).toBe('75%');
      expect(formatPercentage(100)).toBe('100%');
    });

    it('should capitalize string', () => {
      const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
    });
  });
});

