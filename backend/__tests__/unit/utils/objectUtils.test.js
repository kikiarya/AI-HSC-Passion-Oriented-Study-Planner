import { describe, it, expect } from '@jest/globals';

describe('Object Utilities', () => {
  describe('Object Creation', () => {
    it('should create empty object', () => {
      const obj = {};
      expect(Object.keys(obj)).toHaveLength(0);
    });

    it('should create object with properties', () => {
      const obj = { name: 'Test', age: 25 };
      expect(obj.name).toBe('Test');
      expect(obj.age).toBe(25);
    });

    it('should use Object.create', () => {
      const obj = Object.create(null);
      expect(Object.getPrototypeOf(obj)).toBeNull();
    });

    it('should use object literal shorthand', () => {
      const name = 'Test';
      const age = 25;
      const obj = { name, age };
      expect(obj).toEqual({ name: 'Test', age: 25 });
    });
  });

  describe('Object Properties', () => {
    it('should check property exists', () => {
      const obj = { name: 'Test' };
      expect('name' in obj).toBe(true);
      expect('age' in obj).toBe(false);
    });

    it('should check own property', () => {
      const obj = { name: 'Test' };
      expect(obj.hasOwnProperty('name')).toBe(true);
    });

    it('should get property names', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(Object.keys(obj)).toEqual(['a', 'b', 'c']);
    });

    it('should get property values', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(Object.values(obj)).toEqual([1, 2, 3]);
    });

    it('should get entries', () => {
      const obj = { a: 1, b: 2 };
      expect(Object.entries(obj)).toEqual([['a', 1], ['b', 2]]);
    });
  });

  describe('Object Manipulation', () => {
    it('should assign properties', () => {
      const target = { a: 1 };
      const source = { b: 2 };
      Object.assign(target, source);
      expect(target).toEqual({ a: 1, b: 2 });
    });

    it('should merge objects with spread', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const merged = { ...obj1, ...obj2 };
      expect(merged).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should delete property', () => {
      const obj = { a: 1, b: 2 };
      delete obj.b;
      expect(obj).toEqual({ a: 1 });
    });

    it('should freeze object', () => {
      const obj = Object.freeze({ a: 1 });
      expect(Object.isFrozen(obj)).toBe(true);
    });
  });

  describe('Object Comparison', () => {
    it('should compare object references', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1 };
      expect(obj1 === obj2).toBe(false);
      expect(obj1 === obj1).toBe(true);
    });

    it('should deep equal objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };
      expect(obj1).toEqual(obj2);
    });

    it('should check if object is empty', () => {
      const isEmpty = obj => Object.keys(obj).length === 0;
      expect(isEmpty({})).toBe(true);
      expect(isEmpty({ a: 1 })).toBe(false);
    });
  });

  describe('Nested Objects', () => {
    it('should access nested properties', () => {
      const obj = { user: { name: 'Test', age: 25 } };
      expect(obj.user.name).toBe('Test');
    });

    it('should use optional chaining', () => {
      const obj = { user: { name: 'Test' } };
      expect(obj.user?.name).toBe('Test');
      expect(obj.user?.age).toBeUndefined();
    });

    it('should clone shallow object', () => {
      const obj = { a: 1, b: 2 };
      const clone = { ...obj };
      expect(clone).toEqual(obj);
      expect(clone).not.toBe(obj);
    });
  });
});

