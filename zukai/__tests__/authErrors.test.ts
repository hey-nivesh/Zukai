import { mapAuthError } from '../src/lib/authErrors';

describe('mapAuthError', () => {
  it('returns success for null/undefined error', () => {
    const res = mapAuthError(null);
    expect(res.code).toBe('NONE');
    expect(res.message).toBe('');
  });

  it('maps invalid credentials properly without leaking account existence', () => {
    const res = mapAuthError({ message: 'Invalid login credentials' });
    expect(res.code).toBe('INVALID_CREDENTIALS');
    expect(res.title).toBe('Sign In Failed');
    expect(res.message).toContain('Incorrect email or password');
  });

  it('detects unconfirmed email and sets needsVerification', () => {
    const res = mapAuthError({ message: 'Email not confirmed' });
    expect(res.code).toBe('EMAIL_NOT_CONFIRMED');
    expect(res.needsVerification).toBe(true);
    expect(res.message).toContain('check your inbox');
  });

  it('maps rate limit errors with isRateLimit flag', () => {
    const res = mapAuthError({ message: 'over_email_send_rate_limit', status: 429 });
    expect(res.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(res.isRateLimit).toBe(true);
    expect(res.title).toBe('Too Many Attempts');
  });

  it('maps user already registered on sign up', () => {
    const res = mapAuthError({ message: 'User already registered' });
    expect(res.code).toBe('USER_ALREADY_EXISTS');
    expect(res.title).toBe('Account Exists');
    expect(res.message).toContain('already exists');
  });

  it('maps network failures', () => {
    const res = mapAuthError({ message: 'Network request failed' });
    expect(res.code).toBe('NETWORK_ERROR');
    expect(res.title).toBe('Network Error');
  });

  it('falls back to generic error safely', () => {
    const res = mapAuthError({ message: 'Some unknown internal failure', code: '500' });
    expect(res.title).toBe('Authentication Error');
    expect(res.message).toBe('Some unknown internal failure');
  });
});

