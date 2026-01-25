/**
 * Form validation utilities
 */
import { APP_CONFIG } from '../constants/config';

/**
 * Validate email format
 */
export function validateEmail(email: string): string | null {
  if (!email) {
    return 'Email is required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return null;
}

/**
 * Validate password
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }

  if (password.length < APP_CONFIG.minChars.password) {
    return `Password must be at least ${APP_CONFIG.minChars.password} characters`;
  }

  // Optional: Add complexity requirements
  // if (!/[A-Z]/.test(password)) {
  //   return 'Password must contain at least one uppercase letter';
  // }
  // if (!/[0-9]/.test(password)) {
  //   return 'Password must contain at least one number';
  // }

  return null;
}

/**
 * Validate password confirmation
 */
export function validatePasswordConfirm(
  password: string,
  confirmPassword: string
): string | null {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return null;
}

/**
 * Validate username
 */
export function validateUsername(username: string): string | null {
  if (!username) {
    return 'Username is required';
  }

  if (username.length < APP_CONFIG.minChars.username) {
    return `Username must be at least ${APP_CONFIG.minChars.username} characters`;
  }

  if (username.length > APP_CONFIG.maxChars.username) {
    return `Username must be less than ${APP_CONFIG.maxChars.username} characters`;
  }

  // Only allow alphanumeric and underscores
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }

  // Cannot start with a number
  if (/^[0-9]/.test(username)) {
    return 'Username cannot start with a number';
  }

  return null;
}

/**
 * Validate full name
 */
export function validateFullName(name: string): string | null {
  if (!name) {
    return 'Full name is required';
  }

  if (name.trim().length < 2) {
    return 'Full name must be at least 2 characters';
  }

  if (name.length > APP_CONFIG.maxChars.fullName) {
    return `Full name must be less than ${APP_CONFIG.maxChars.fullName} characters`;
  }

  return null;
}

/**
 * Validate bio
 */
export function validateBio(bio: string): string | null {
  if (bio && bio.length > APP_CONFIG.maxChars.bio) {
    return `Bio must be less than ${APP_CONFIG.maxChars.bio} characters`;
  }

  return null;
}

/**
 * Validate post content
 */
export function validatePostContent(content: string, hasImage: boolean): string | null {
  if (!content && !hasImage) {
    return 'Post must have either text or an image';
  }

  if (content && content.length > APP_CONFIG.maxChars.post) {
    return `Post must be less than ${APP_CONFIG.maxChars.post} characters`;
  }

  return null;
}

/**
 * Validate comment content
 */
export function validateComment(content: string): string | null {
  if (!content || !content.trim()) {
    return 'Comment cannot be empty';
  }

  if (content.length > APP_CONFIG.maxChars.comment) {
    return `Comment must be less than ${APP_CONFIG.maxChars.comment} characters`;
  }

  return null;
}

/**
 * Validate website URL
 */
export function validateWebsite(url: string): string | null {
  if (!url) return null; // Website is optional

  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return null;
  } catch {
    return 'Please enter a valid website URL';
  }
}

/**
 * Sanitize input (remove dangerous characters)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Form validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate signup form
 */
export function validateSignUpForm(data: {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;

  const confirmError = validatePasswordConfirm(data.password, data.confirmPassword);
  if (confirmError) errors.confirmPassword = confirmError;

  const nameError = validateFullName(data.fullName);
  if (nameError) errors.fullName = nameError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate email or username (login identifier)
 */
export function validateIdentifier(identifier: string): string | null {
  if (!identifier) {
    return 'Email or username is required';
  }

  if (identifier.trim().length < 3) {
    return 'Please enter a valid email or username';
  }

  return null;
}

/**
 * Validate login form
 */
export function validateLoginForm(data: {
  email: string;
  password: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Use identifier validation instead of email-only
  const identifierError = validateIdentifier(data.email);
  if (identifierError) errors.email = identifierError;

  if (!data.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
