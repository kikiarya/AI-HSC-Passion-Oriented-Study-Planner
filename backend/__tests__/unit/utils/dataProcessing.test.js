import { describe, it, expect } from '@jest/globals';

describe('Data Processing', () => {
  describe('Array Operations', () => {
    it('should filter array by condition', () => {
      const numbers = [1, 2, 3, 4, 5];
      const even = numbers.filter(n => n % 2 === 0);
      expect(even).toEqual([2, 4]);
    });

    it('should map array to new values', () => {
      const numbers = [1, 2, 3];
      const doubled = numbers.map(n => n * 2);
      expect(doubled).toEqual([2, 4, 6]);
    });

    it('should reduce array to single value', () => {
      const numbers = [1, 2, 3, 4];
      const sum = numbers.reduce((acc, n) => acc + n, 0);
      expect(sum).toBe(10);
    });

    it('should find element in array', () => {
      const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      const found = users.find(u => u.id === 2);
      expect(found.name).toBe('Bob');
    });

    it('should sort array', () => {
      const numbers = [3, 1, 4, 1, 5];
      const sorted = [...numbers].sort((a, b) => a - b);
      expect(sorted).toEqual([1, 1, 3, 4, 5]);
    });
  });

  describe('String Operations', () => {
    it('should trim whitespace', () => {
      const str = '  hello  ';
      expect(str.trim()).toBe('hello');
    });

    it('should convert to lowercase', () => {
      const str = 'HELLO';
      expect(str.toLowerCase()).toBe('hello');
    });

    it('should split string', () => {
      const str = 'one,two,three';
      expect(str.split(',')).toEqual(['one', 'two', 'three']);
    });

    it('should check string includes', () => {
      const str = 'hello world';
      expect(str.includes('world')).toBe(true);
      expect(str.includes('foo')).toBe(false);
    });
  });

  describe('Object Operations', () => {
    it('should merge objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const merged = { ...obj1, ...obj2 };
      expect(merged).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should extract object keys', () => {
      const obj = { name: 'Test', age: 25 };
      const keys = Object.keys(obj);
      expect(keys).toEqual(['name', 'age']);
    });

    it('should extract object values', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const values = Object.values(obj);
      expect(values).toEqual([1, 2, 3]);
    });

    it('should check object has property', () => {
      const obj = { name: 'Test' };
      expect(obj.hasOwnProperty('name')).toBe(true);
      expect(obj.hasOwnProperty('age')).toBe(false);
    });
  });

  describe('Date Operations', () => {
    it('should create date from string', () => {
      const date = new Date('2025-01-01');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0); // January
    });

    it('should format date', () => {
      const date = new Date('2025-11-01');
      const formatted = date.toISOString().split('T')[0];
      expect(formatted).toBe('2025-11-01');
    });

    it('should compare dates', () => {
      const date1 = new Date('2025-01-01');
      const date2 = new Date('2025-12-31');
      expect(date2 > date1).toBe(true);
    });
  });
});

