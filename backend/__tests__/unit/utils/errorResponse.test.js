import { describe, it, expect, jest } from '@jest/globals';
import { ErrorResponse } from '../../../utils/errorResponse.js';

describe('ErrorResponse Utility', () => {
  it('should create badRequest error (400)', () => {
    const error = ErrorResponse.badRequest('Invalid input');
    expect(error.message).toBe('Invalid input');
    expect(error.statusCode).toBe(400);
  });

  it('should create unauthorized error (401)', () => {
    const error = ErrorResponse.unauthorized('Not authorized');
    expect(error.message).toBe('Not authorized');
    expect(error.statusCode).toBe(401);
  });

  it('should create notFound error (404)', () => {
    const error = ErrorResponse.notFound('Resource not found');
    expect(error.message).toBe('Resource not found');
    expect(error.statusCode).toBe(404);
  });

  it('should send error response correctly', () => {
    const error = ErrorResponse.badRequest('Test error');
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    error.send(mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalled();
  });
});
