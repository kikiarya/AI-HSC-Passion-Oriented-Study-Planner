import { describe, it, expect } from 'vitest';

describe('UI Utilities', () => {
  describe('Loading States', () => {
    it('should determine loading state', () => {
      const isLoading = (status) => status === 'loading';
      expect(isLoading('loading')).toBe(true);
      expect(isLoading('success')).toBe(false);
    });

    it('should check if idle', () => {
      const isIdle = (status) => status === 'idle';
      expect(isIdle('idle')).toBe(true);
      expect(isIdle('loading')).toBe(false);
    });

    it('should check if success', () => {
      const isSuccess = (status) => status === 'success';
      expect(isSuccess('success')).toBe(true);
      expect(isSuccess('error')).toBe(false);
    });

    it('should check if error', () => {
      const isError = (status) => status === 'error';
      expect(isError('error')).toBe(true);
      expect(isError('success')).toBe(false);
    });
  });

  describe('Theme Utilities', () => {
    it('should get theme color', () => {
      const getColor = (theme, type) => {
        const colors = {
          light: { primary: '#fff', secondary: '#eee' },
          dark: { primary: '#000', secondary: '#111' }
        };
        return colors[theme]?.[type];
      };
      expect(getColor('light', 'primary')).toBe('#fff');
      expect(getColor('dark', 'primary')).toBe('#000');
    });

    it('should toggle theme', () => {
      const toggleTheme = (current) => current === 'light' ? 'dark' : 'light';
      expect(toggleTheme('light')).toBe('dark');
      expect(toggleTheme('dark')).toBe('light');
    });
  });

  describe('Animation Utilities', () => {
    it('should calculate easing', () => {
      const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      expect(easeInOut(0)).toBe(0);
      expect(easeInOut(1)).toBe(1);
    });

    it('should interpolate values', () => {
      const lerp = (start, end, t) => start + (end - start) * t;
      expect(lerp(0, 100, 0.5)).toBe(50);
      expect(lerp(0, 100, 0)).toBe(0);
      expect(lerp(0, 100, 1)).toBe(100);
    });
  });

  describe('Responsive Utilities', () => {
    it('should check breakpoint', () => {
      const isSmallScreen = (width) => width < 768;
      expect(isSmallScreen(600)).toBe(true);
      expect(isSmallScreen(1024)).toBe(false);
    });

    it('should get grid columns', () => {
      const getColumns = (screenWidth) => {
        if (screenWidth < 768) return 1;
        if (screenWidth < 1024) return 2;
        return 3;
      };
      expect(getColumns(600)).toBe(1);
      expect(getColumns(800)).toBe(2);
      expect(getColumns(1200)).toBe(3);
    });
  });

  describe('Error Display', () => {
    it('should format error message', () => {
      const formatError = (error) => 
        error instanceof Error ? error.message : String(error);
      expect(formatError(new Error('Test'))).toBe('Test');
      expect(formatError('String error')).toBe('String error');
    });

    it('should check if error exists', () => {
      const hasError = (error) => error !== null && error !== undefined;
      expect(hasError(new Error())).toBe(true);
      expect(hasError(null)).toBe(false);
    });
  });
});

