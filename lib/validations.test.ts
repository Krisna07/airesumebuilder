/**
 * Unit tests for validation functions
 */

import { isValidEmail, isValidPassword, getEmailError, getPasswordError } from './validations';

describe('Email Validation', () => {
  describe('isValidEmail', () => {
    // Valid email patterns
    it('should return true for valid simple email', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('should return true for email with dots in local part', () => {
      expect(isValidEmail('john.doe@company.org')).toBe(true);
    });

    it('should return true for email with plus sign in local part', () => {
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should return true for email with hyphen in local part', () => {
      expect(isValidEmail('user-name@example.com')).toBe(true);
    });

    it('should return true for email with underscore in local part', () => {
      expect(isValidEmail('user_name@example.com')).toBe(true);
    });

    it('should return true for email with subdomain', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true);
    });

    it('should return true for email with multiple dots in domain', () => {
      expect(isValidEmail('user@mail.co.uk')).toBe(true);
    });

    it('should return true for email with long TLD', () => {
      expect(isValidEmail('user@example.commercial')).toBe(true);
    });

    // Invalid email patterns
    it('should return false for invalid format without @', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
    });

    it('should return false for email missing local part', () => {
      expect(isValidEmail('@missing-local.com')).toBe(false);
    });

    it('should return false for email missing domain', () => {
      expect(isValidEmail('user@')).toBe(false);
    });

    it('should return false for email with missing TLD', () => {
      expect(isValidEmail('user@.com')).toBe(false);
    });

    it('should return false for email with single character TLD', () => {
      expect(isValidEmail('user@example.c')).toBe(false);
    });

    it('should return false for email with space in local part', () => {
      expect(isValidEmail('user name@example.com')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should return false for null input', () => {
      expect(isValidEmail(null as any)).toBe(false);
    });

    it('should return false for undefined input', () => {
      expect(isValidEmail(undefined as any)).toBe(false);
    });

    it('should return false for email starting with @', () => {
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should return false for email with double @', () => {
      expect(isValidEmail('user@@example.com')).toBe(false);
    });
  });

  describe('getEmailError', () => {
    it('should return undefined for valid email', () => {
      expect(getEmailError('user@example.com')).toBeUndefined();
    });

    it('should return error message for empty email', () => {
      expect(getEmailError('')).toBe('Email is required');
    });

    it('should return error message for whitespace-only email', () => {
      expect(getEmailError('   ')).toBe('Email is required');
    });

    it('should return error message for invalid format', () => {
      expect(getEmailError('not-an-email')).toBe('Invalid email format');
    });

    it('should return error message for missing @', () => {
      expect(getEmailError('userexample.com')).toBe('Invalid email format');
    });
  });
});

describe('Password Validation', () => {
  describe('isValidPassword', () => {
    // Valid passwords
    it('should return true for valid password with all requirements', () => {
      expect(isValidPassword('Pass@word1')).toBe(true);
    });

    it('should return true for password with special characters', () => {
      expect(isValidPassword('MyP@ssw0rd!')).toBe(true);
    });

    // Invalid passwords
    it('should return false for password less than 8 characters', () => {
      expect(isValidPassword('Pass@1')).toBe(false);
    });

    it('should return false for password missing uppercase', () => {
      expect(isValidPassword('pass@word1')).toBe(false);
    });

    it('should return false for password missing lowercase', () => {
      expect(isValidPassword('PASS@WORD1')).toBe(false);
    });

    it('should return false for password missing digit', () => {
      expect(isValidPassword('Password@')).toBe(false);
    });

    it('should return false for password missing special character', () => {
      expect(isValidPassword('Password1')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidPassword('')).toBe(false);
    });

    it('should return false for null input', () => {
      expect(isValidPassword(null as any)).toBe(false);
    });
  });

  describe('getPasswordError', () => {
    it('should return undefined for valid password', () => {
      expect(getPasswordError('Pass@word1')).toBeUndefined();
    });

    it('should return error for empty password', () => {
      expect(getPasswordError('')).toBe('Password is required');
    });

    it('should return error for short password', () => {
      expect(getPasswordError('Pass@1')).toBe('Password must be at least 8 characters');
    });

    it('should return first error for missing uppercase', () => {
      expect(getPasswordError('pass@word1')).toBe('Password must contain at least one uppercase letter');
    });
  });
});