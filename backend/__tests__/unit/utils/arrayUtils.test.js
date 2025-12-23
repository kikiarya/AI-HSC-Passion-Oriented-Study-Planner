import { describe, it, expect } from '@jest/globals';

describe('Array Utilities', () => {
  describe('Array Creation', () => {
    it('should create array from range', () => {
      const range = (start, end) => 
        Array.from({ length: end - start + 1 }, (_, i) => start + i);
      expect(range(1, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should create array of repeated values', () => {
      expect(Array(3).fill(0)).toEqual([0, 0, 0]);
    });

    it('should create array from string', () => {
      expect(Array.from('hello')).toEqual(['h', 'e', 'l', 'l', 'o']);
    });
  });

  describe('Array Search', () => {
    it('should find first matching element', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(arr.find(x => x > 3)).toBe(4);
    });

    it('should find index of element', () => {
      const arr = ['a', 'b', 'c'];
      expect(arr.indexOf('b')).toBe(1);
    });

    it('should check if array includes element', () => {
      const arr = [1, 2, 3];
      expect(arr.includes(2)).toBe(true);
      expect(arr.includes(5)).toBe(false);
    });

    it('should find all matching indices', () => {
      const arr = [1, 2, 1, 3, 1];
      const indices = arr.map((val, idx) => val === 1 ? idx : -1).filter(x => x !== -1);
      expect(indices).toEqual([0, 2, 4]);
    });
  });

  describe('Array Transformation', () => {
    it('should reverse array', () => {
      expect([1, 2, 3].reverse()).toEqual([3, 2, 1]);
    });

    it('should slice array', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(arr.slice(1, 3)).toEqual([2, 3]);
    });

    it('should concatenate arrays', () => {
      expect([1, 2].concat([3, 4])).toEqual([1, 2, 3, 4]);
    });

    it('should flatten nested array', () => {
      expect([1, [2, 3], [4, [5]]].flat()).toEqual([1, 2, 3, 4, [5]]);
      expect([1, [2, 3], [4, [5]]].flat(2)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should remove duplicates', () => {
      const arr = [1, 2, 2, 3, 3, 4];
      expect([...new Set(arr)]).toEqual([1, 2, 3, 4]);
    });
  });

  describe('Array Reduction', () => {
    it('should sum array', () => {
      const arr = [1, 2, 3, 4];
      expect(arr.reduce((sum, n) => sum + n, 0)).toBe(10);
    });

    it('should find max using reduce', () => {
      const arr = [3, 7, 2, 9, 1];
      expect(arr.reduce((max, n) => Math.max(max, n))).toBe(9);
    });

    it('should group by property', () => {
      const items = [
        { type: 'A', val: 1 },
        { type: 'B', val: 2 },
        { type: 'A', val: 3 }
      ];
      const grouped = items.reduce((acc, item) => {
        (acc[item.type] = acc[item.type] || []).push(item);
        return acc;
      }, {});
      expect(grouped.A).toHaveLength(2);
      expect(grouped.B).toHaveLength(1);
    });
  });

  describe('Array Sorting', () => {
    it('should sort numbers ascending', () => {
      expect([3, 1, 4, 1, 5].sort((a, b) => a - b)).toEqual([1, 1, 3, 4, 5]);
    });

    it('should sort numbers descending', () => {
      expect([3, 1, 4, 1, 5].sort((a, b) => b - a)).toEqual([5, 4, 3, 1, 1]);
    });

    it('should sort strings', () => {
      expect(['c', 'a', 'b'].sort()).toEqual(['a', 'b', 'c']);
    });

    it('should sort objects by property', () => {
      const arr = [{ age: 30 }, { age: 20 }, { age: 25 }];
      arr.sort((a, b) => a.age - b.age);
      expect(arr[0].age).toBe(20);
    });
  });
});

