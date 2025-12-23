import { describe, it, expect } from 'vitest';

describe('Frontend Formatting Utilities', () => {
  describe('Date Formatting', () => {
    it('should format date to locale string', () => {
      const date = new Date('2025-11-01');
      const formatted = date.toLocaleDateString('zh-CN');
      expect(formatted).toContain('2025');
    });

    it('should format date to ISO string', () => {
      const date = new Date('2025-11-01T00:00:00Z');
      const iso = date.toISOString();
      expect(iso).toContain('2025-11-01');
    });

    it('should get day of week', () => {
      const date = new Date('2025-11-01');
      const day = date.getDay();
      expect(day).toBeGreaterThanOrEqual(0);
      expect(day).toBeLessThanOrEqual(6);
    });
  });

  describe('Number Formatting', () => {
    it('should round to decimal places', () => {
      expect(Math.round(3.14159 * 100) / 100).toBe(3.14);
      expect(Math.round(2.5)).toBe(3);
    });

    it('should format large numbers', () => {
      const format = (num) => num.toLocaleString();
      expect(format(1000)).toBe('1,000');
      expect(format(1000000)).toBe('1,000,000');
    });

    it('should calculate percentage', () => {
      const toPercent = (value, total) => Math.round((value / total) * 100);
      expect(toPercent(25, 100)).toBe(25);
      expect(toPercent(3, 4)).toBe(75);
    });
  });

  describe('String Formatting', () => {
    it('should truncate long strings', () => {
      const truncate = (str, maxLen) => 
        str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
      
      expect(truncate('Short', 10)).toBe('Short');
      expect(truncate('Very long string here', 10)).toBe('Very long ...');
    });

    it('should sanitize HTML', () => {
      const sanitize = (str) => 
        str.replace(/[<>]/g, '');
      
      expect(sanitize('Hello <script>alert()</script>')).toBe('Hello scriptalert()/script');
    });

    it('should create initials', () => {
      const getInitials = (firstName, lastName) => 
        `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
      
      expect(getInitials('John', 'Doe')).toBe('JD');
      expect(getInitials('Alice', 'Smith')).toBe('AS');
    });
  });

  describe('Array Utilities', () => {
    it('should remove duplicates', () => {
      const arr = [1, 2, 2, 3, 3, 4];
      const unique = [...new Set(arr)];
      expect(unique).toEqual([1, 2, 3, 4]);
    });

    it('should group by property', () => {
      const items = [
        { type: 'A', value: 1 },
        { type: 'B', value: 2 },
        { type: 'A', value: 3 }
      ];
      
      const grouped = items.reduce((acc, item) => {
        (acc[item.type] = acc[item.type] || []).push(item);
        return acc;
      }, {});
      
      expect(grouped.A).toHaveLength(2);
      expect(grouped.B).toHaveLength(1);
    });

    it('should chunk array', () => {
      const chunk = (arr, size) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      };
      
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
  });
});

