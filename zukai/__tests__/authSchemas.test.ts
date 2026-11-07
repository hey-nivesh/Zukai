import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  calculatePasswordStrength,
} from '../src/lib/validations/authSchemas';

describe('Auth Validation Schemas', () => {
  describe('signInSchema', () => {
    it('validates correct email and password', () => {
      const result = signInSchema.safeParse({
        email: 'learner@zukai.app',
        password: 'Password123!',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = signInSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid email');
      }
    });

    it('rejects empty password', () => {
      const result = signInSchema.safeParse({
        email: 'learner@zukai.app',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('signUpSchema', () => {
    it('accepts valid registration input', () => {
      const result = signUpSchema.safeParse({
        name: 'Rahul Sharma',
        email: 'rahul@zukai.app',
        password: 'SecurePassword123',
        acceptTerms: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects short password (< 8 chars)', () => {
      const result = signUpSchema.safeParse({
        name: 'Rahul Sharma',
        email: 'rahul@zukai.app',
        password: 'Pass1',
        acceptTerms: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without numbers', () => {
      const result = signUpSchema.safeParse({
        name: 'Rahul Sharma',
        email: 'rahul@zukai.app',
        password: 'PasswordOnly',
        acceptTerms: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects unchecked terms', () => {
      const result = signUpSchema.safeParse({
        name: 'Rahul Sharma',
        email: 'rahul@zukai.app',
        password: 'SecurePassword123',
        acceptTerms: false,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('accepts matching passwords', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-matching passwords', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'NewPassword123',
        confirmPassword: 'DifferentPassword123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('match');
      }
    });
  });

  describe('calculatePasswordStrength', () => {
    it('rates empty or short as weak', () => {
      expect(calculatePasswordStrength('').label).toBe('Weak');
      expect(calculatePasswordStrength('abc').label).toBe('Weak');
    });

    it('rates 8+ alphanumeric as good/strong', () => {
      const strength = calculatePasswordStrength('Password123!@#');
      expect(strength.score).toBeGreaterThanOrEqual(3);
    });
  });
});

