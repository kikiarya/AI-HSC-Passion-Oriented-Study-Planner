import { describe, it, expect } from '@jest/globals';

describe('String Utilities', () => {
  describe('Case Conversion', () => {
    it('should convert to uppercase', () => {
      expect('hello'.toUpperCase()).toBe('HELLO');
    });

    it('should convert to lowercase', () => {
      expect('WORLD'.toLowerCase()).toBe('world');
    });

    it('should capitalize first letter', () => {
      const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should convert to title case', () => {
      const toTitleCase = str => 
        str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('should convert camelCase to snake_case', () => {
      const toSnakeCase = str => 
        str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      expect(toSnakeCase('userName')).toBe('user_name');
    });
  });

  describe('String Validation', () => {
    it('should check if string is empty', () => {
      expect(''.length === 0).toBe(true);
      expect('hello'.length === 0).toBe(false);
    });

    it('should check if string contains substring', () => {
      expect('hello world'.includes('world')).toBe(true);
      expect('hello world'.includes('foo')).toBe(false);
    });

    it('should check if string starts with prefix', () => {
      expect('hello world'.startsWith('hello')).toBe(true);
      expect('hello world'.startsWith('world')).toBe(false);
    });

    it('should check if string ends with suffix', () => {
      expect('hello world'.endsWith('world')).toBe(true);
      expect('hello world'.endsWith('hello')).toBe(false);
    });

    it('should check string length', () => {
      expect('hello'.length).toBe(5);
      expect(''.length).toBe(0);
    });
  });

  describe('String Manipulation', () => {
    it('should trim whitespace', () => {
      expect('  hello  '.trim()).toBe('hello');
    });

    it('should replace substring', () => {
      expect('hello world'.replace('world', 'there')).toBe('hello there');
    });

    it('should replace all occurrences', () => {
      expect('hello hello'.replaceAll('hello', 'hi')).toBe('hi hi');
    });

    it('should split by delimiter', () => {
      expect('a,b,c'.split(',')).toEqual(['a', 'b', 'c']);
    });

    it('should join array to string', () => {
      expect(['a', 'b', 'c'].join('-')).toBe('a-b-c');
    });

    it('should repeat string', () => {
      expect('x'.repeat(3)).toBe('xxx');
    });

    it('should pad string', () => {
      expect('5'.padStart(3, '0')).toBe('005');
      expect('5'.padEnd(3, '0')).toBe('500');
    });
  });
});

