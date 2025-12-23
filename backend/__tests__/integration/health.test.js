import { describe, it, expect } from '@jest/globals';

describe('Integration Tests - Basic Functionality', () => {
  describe('Module Loading', () => {
    it('should load ErrorResponse module', async () => {
      const { ErrorResponse } = await import('../../utils/errorResponse.js');
      expect(ErrorResponse).toBeDefined();
      expect(typeof ErrorResponse.badRequest).toBe('function');
    });

    it('should create error instances', async () => {
      const { ErrorResponse } = await import('../../utils/errorResponse.js');
      const error = ErrorResponse.notFound('Test not found');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Test not found');
    });
  });

  describe('Environment Configuration', () => {
    it('should have NODE_ENV set to test', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should have default Supabase configuration', () => {
      expect(process.env.SUPABASE_URL).toBeDefined();
      expect(process.env.SUPABASE_ANON_KEY).toBeDefined();
    });
  });
});

