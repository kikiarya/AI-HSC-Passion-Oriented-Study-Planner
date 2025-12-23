import { describe, it, expect } from '@jest/globals';

describe('Validators', () => {
  describe('Email Validation', () => {
    it('should validate correct email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.com',
        'user+tag@example.co.uk'
      ];
      
      validEmails.forEach(email => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(true);
      });
    });

    it('should reject invalid email format', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@domain'
      ];
      
      invalidEmails.forEach(email => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Password Validation', () => {
    it('should validate strong password', () => {
      const strongPasswords = [
        'Password123!',
        'MyP@ssw0rd',
        'Str0ng!Pass'
      ];
      
      strongPasswords.forEach(password => {
        const hasLength = password.length >= 8;
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        expect(hasLength && hasLetter && hasNumber).toBe(true);
      });
    });

    it('should reject weak password', () => {
      const weakPasswords = [
        'short',
        '12345678',
        'onlyletters'
      ];
      
      weakPasswords.forEach(password => {
        const hasLength = password.length >= 8;
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const isStrong = hasLength && hasLetter && hasNumber;
        expect(isStrong).toBe(false);
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields', () => {
      const data = { name: 'Test', email: 'test@example.com' };
      const requiredFields = ['name', 'email'];
      
      const hasAll = requiredFields.every(field => 
        data[field] !== undefined && data[field] !== null && data[field] !== ''
      );
      
      expect(hasAll).toBe(true);
    });

    it('should detect missing required fields', () => {
      const data = { name: 'Test' };
      const requiredFields = ['name', 'email'];
      
      const hasAll = requiredFields.every(field => 
        data[field] !== undefined && data[field] !== null && data[field] !== ''
      );
      
      expect(hasAll).toBe(false);
    });
  });
});

