import { describe, it, expect } from 'vitest';

describe('React Utilities', () => {
  describe('State Management', () => {
    it('should merge state objects', () => {
      const prevState = { count: 0, name: 'Test' };
      const newState = { count: 1 };
      const merged = { ...prevState, ...newState };
      expect(merged).toEqual({ count: 1, name: 'Test' });
    });

    it('should toggle boolean state', () => {
      const toggle = (current) => !current;
      expect(toggle(true)).toBe(false);
      expect(toggle(false)).toBe(true);
    });

    it('should increment counter', () => {
      const increment = (count) => count + 1;
      expect(increment(0)).toBe(1);
      expect(increment(5)).toBe(6);
    });

    it('should update array item', () => {
      const updateItem = (arr, index, newVal) =>
        arr.map((item, i) => i === index ? newVal : item);
      expect(updateItem([1, 2, 3], 1, 99)).toEqual([1, 99, 3]);
    });
  });

  describe('Props Validation', () => {
    it('should validate required props', () => {
      const validateProps = (props, required) =>
        required.every(key => props[key] !== undefined);
      
      const props = { name: 'Test', age: 25 };
      expect(validateProps(props, ['name', 'age'])).toBe(true);
      expect(validateProps(props, ['name', 'email'])).toBe(false);
    });

    it('should provide default props', () => {
      const withDefaults = (props, defaults) => ({ ...defaults, ...props });
      const props = { name: 'Test' };
      const defaults = { name: 'Default', age: 0 };
      expect(withDefaults(props, defaults)).toEqual({ name: 'Test', age: 0 });
    });
  });

  describe('Component Helpers', () => {
    it('should generate unique ID', () => {
      const generateId = () => `id-${Date.now()}-${Math.random()}`;
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should create key from index', () => {
      const createKey = (prefix, index) => `${prefix}-${index}`;
      expect(createKey('item', 0)).toBe('item-0');
      expect(createKey('row', 5)).toBe('row-5');
    });

    it('should filter undefined values', () => {
      const arr = [1, undefined, 2, null, 3];
      const filtered = arr.filter(x => x !== undefined && x !== null);
      expect(filtered).toEqual([1, 2, 3]);
    });
  });

  describe('Event Handlers', () => {
    it('should prevent default', () => {
      const handleClick = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        return 'clicked';
      };
      expect(handleClick({})).toBe('clicked');
    });

    it('should stop propagation', () => {
      const handleEvent = (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        return 'handled';
      };
      expect(handleEvent({})).toBe('handled');
    });

    it('should extract form values', () => {
      const getFormData = (formState) => {
        return Object.keys(formState).reduce((acc, key) => {
          acc[key] = formState[key];
          return acc;
        }, {});
      };
      const form = { name: 'Test', email: 'test@example.com' };
      expect(getFormData(form)).toEqual(form);
    });
  });

  describe('Conditional Rendering', () => {
    it('should render conditionally', () => {
      const renderIf = (condition, value) => condition ? value : null;
      expect(renderIf(true, 'Show')).toBe('Show');
      expect(renderIf(false, 'Show')).toBeNull();
    });

    it('should render with fallback', () => {
      const renderOrFallback = (value, fallback) => value || fallback;
      expect(renderOrFallback('Content', 'Fallback')).toBe('Content');
      expect(renderOrFallback(null, 'Fallback')).toBe('Fallback');
    });

    it('should render list items', () => {
      const items = ['a', 'b', 'c'];
      const rendered = items.map((item, i) => ({ id: i, value: item }));
      expect(rendered).toHaveLength(3);
      expect(rendered[0]).toEqual({ id: 0, value: 'a' });
    });
  });
});

