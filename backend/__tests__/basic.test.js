import { describe, it, expect } from '@jest/globals';

describe('Basic Tests', () => {
  describe('JavaScript Basics', () => {
    it('should pass basic assertion', () => {
      expect(1 + 1).toBe(2);
    });

    it('should handle arrays', () => {
      const arr = [1, 2, 3];
      expect(arr).toHaveLength(3);
      expect(arr).toContain(2);
    });

    it('should handle objects', () => {
      const obj = { name: 'test', value: 42 };
      expect(obj).toHaveProperty('name');
      expect(obj.value).toBe(42);
    });
  });

  describe('Async Operations', () => {
    it('should handle promises', async () => {
      const promise = Promise.resolve('success');
      await expect(promise).resolves.toBe('success');
    });

    it('should handle async functions', async () => {
      const asyncFn = async () => {
        return new Promise(resolve => setTimeout(() => resolve('done'), 10));
      };
      const result = await asyncFn();
      expect(result).toBe('done');
    });
  });
});

