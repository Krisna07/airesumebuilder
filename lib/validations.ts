/**
 * Validation functions for authentication system
 * Includes email and password validation per security requirements
 */

// Email regex pattern: local-part@domain.tld
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password requirements
const MIN_PASSWORD_LENGTH = 8;
const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const DIGIT_REGEX = /\d/;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/;

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    return false;
  }

  return EMAIL_REGEX.test(trimmedEmail);
}

/**
 * Gets validation error message for email
 * @param email - Email address to validate
 * @returns Error message string or undefined if valid
 */
export function getEmailError(email: string): string | undefined {
  if (!email || typeof email !== 'string') {
    return 'Email is required';
  }

  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    return 'Email is required';
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return 'Invalid email format';
  }

  return undefined;
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns true if password meets all requirements
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }

  // Check minimum length
  if (password.length < MIN_PASSWORD_LENGTH) {
    return false;
  }

  // Check uppercase
  if (!UPPERCASE_REGEX.test(password)) {
    return false;
  }

  // Check lowercase
  if (!LOWERCASE_REGEX.test(password)) {
    return false;
  }

  // Check digit
  if (!DIGIT_REGEX.test(password)) {
    return false;
  }

  // Check special character
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return false;
  }

  return true;
}

/**
 * Gets validation error message for password
 * @param password - Password to validate
 * @returns Error message string or undefined if valid
 */
export function getPasswordError(password: string): string | undefined {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }

  // Check minimum length
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  // Check uppercase
  if (!UPPERCASE_REGEX.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  // Check lowercase
  if (!LOWERCASE_REGEX.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  // Check digit
  if (!DIGIT_REGEX.test(password)) {
    return 'Password must contain at least one digit';
  }

  // Check special character
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return 'Password must contain at least one special character';
  }

  return undefined;
}

/**
 * Validates email format (returns detailed result)
 * @param email - Email address to validate
 * @returns Object with isValid boolean and errors array
 */
export function validateEmail(email: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates password strength (returns detailed result)
 * @param password - Password to validate
 * @returns Object with isValid boolean and errors array
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  // Check minimum length
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  // Check uppercase
  if (!UPPERCASE_REGEX.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check lowercase
  if (!LOWERCASE_REGEX.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check digit
  if (!DIGIT_REGEX.test(password)) {
    errors.push('Password must contain at least one digit');
  }

  // Check special character
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Combined validation for user registration
 * @param email - Email address to validate
 * @param password - Password to validate
 * @returns Object with isValid boolean and errors object
 */
export function validateCredentials(
  email: string,
  password: string
): {
  isValid: boolean;
  errors: {
    email?: string[];
    password?: string[];
  };
} {
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);

  const errors: {
    email?: string[];
    password?: string[];
  } = {};

  if (emailValidation.errors.length > 0) {
    errors.email = emailValidation.errors;
  }

  if (passwordValidation.errors.length > 0) {
    errors.password = passwordValidation.errors;
  }

  return {
    isValid: emailValidation.isValid && passwordValidation.isValid,
    errors,
  };
}