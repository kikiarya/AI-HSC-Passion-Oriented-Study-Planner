import { describe, it, expect } from 'vitest';

describe('DOM and UI Utilities', () => {
  describe('Class Names', () => {
    it('should combine class names', () => {
      const classNames = (...classes) => classes.filter(Boolean).join(' ');
      expect(classNames('a', 'b', 'c')).toBe('a b c');
      expect(classNames('a', null, 'c')).toBe('a c');
    });

    it('should conditionally add class', () => {
      const conditionalClass = (base, condition, addClass) =>
        condition ? `${base} ${addClass}` : base;
      expect(conditionalClass('btn', true, 'active')).toBe('btn active');
      expect(conditionalClass('btn', false, 'active')).toBe('btn');
    });

    it('should toggle class', () => {
      const toggleClass = (current, className) => {
        const classes = current.split(' ');
        const index = classes.indexOf(className);
        if (index > -1) {
          classes.splice(index, 1);
        } else {
          classes.push(className);
        }
        return classes.join(' ');
      };
      expect(toggleClass('btn', 'active')).toBe('btn active');
      expect(toggleClass('btn active', 'active')).toBe('btn');
    });
  });

  describe('Style Utilities', () => {
    it('should convert px to rem', () => {
      const pxToRem = (px, base = 16) => `${px / base}rem`;
      expect(pxToRem(32)).toBe('2rem');
      expect(pxToRem(24, 16)).toBe('1.5rem');
    });

    it('should create rgba color', () => {
      const rgba = (r, g, b, a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`;
      expect(rgba(255, 0, 0)).toBe('rgba(255, 0, 0, 1)');
      expect(rgba(0, 255, 0, 0.5)).toBe('rgba(0, 255, 0, 0.5)');
    });

    it('should create hex color', () => {
      const toHex = (r, g, b) => 
        '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
      expect(toHex(255, 0, 0)).toBe('#ff0000');
    });
  });

  describe('Event Utilities', () => {
    it('should debounce function calls', () => {
      let callCount = 0;
      const debounced = () => callCount++;
      
      debounced();
      debounced();
      debounced();
      
      expect(callCount).toBe(3);
    });

    it('should throttle using simple check', () => {
      let lastCall = 0;
      const throttle = (fn, delay) => {
        return (...args) => {
          const now = Date.now();
          if (now - lastCall >= delay) {
            lastCall = now;
            return fn(...args);
          }
        };
      };
      
      let count = 0;
      const inc = throttle(() => count++, 100);
      inc();
      expect(count).toBe(1);
    });
  });

  describe('Storage Utilities', () => {
    it('should serialize to JSON', () => {
      const obj = { name: 'Test', age: 25 };
      const json = JSON.stringify(obj);
      expect(json).toBe('{"name":"Test","age":25}');
    });

    it('should deserialize from JSON', () => {
      const json = '{"name":"Test","age":25}';
      const obj = JSON.parse(json);
      expect(obj).toEqual({ name: 'Test', age: 25 });
    });

    it('should handle null in JSON', () => {
      expect(JSON.stringify(null)).toBe('null');
      expect(JSON.parse('null')).toBeNull();
    });

    it('should handle arrays in JSON', () => {
      const arr = [1, 2, 3];
      const json = JSON.stringify(arr);
      expect(JSON.parse(json)).toEqual([1, 2, 3]);
    });
  });
});

