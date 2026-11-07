/**
 * ZUKAI AUTH ERROR MAPPER
 * Converts raw Supabase auth error codes and messages into user-friendly copy.
 * Ensures security by not leaking user existence details on sign-in.
 */

export interface FriendlyAuthError {
  title: string;
  message: string;
  code: string;
  isRateLimit?: boolean;
  needsVerification?: boolean;
}

export function mapAuthError(error: unknown): FriendlyAuthError {
  if (!error) {
    return {
      title: 'Success',
      message: '',
      code: 'NONE',
    };
  }

  const err = error as { message?: string; status?: number; code?: string; error_description?: string };
  const rawMsg = (err.message || err.error_description || '').toLowerCase();
  const rawCode = (err.code || '').toLowerCase();

  // 1. Email not confirmed
  if (
    rawMsg.includes('email not confirmed') ||
    rawMsg.includes('email_not_confirmed') ||
    rawCode === 'email_not_confirmed'
  ) {
    return {
      title: 'Email Not Verified',
      message: 'Please check your inbox and verify your email before signing in.',
      code: 'EMAIL_NOT_CONFIRMED',
      needsVerification: true,
    };
  }

  // 2. Invalid credentials (Sign In)
  if (
    rawMsg.includes('invalid login credentials') ||
    rawMsg.includes('invalid credentials') ||
    rawMsg.includes('invalid_grant') ||
    rawCode === 'invalid_credentials'
  ) {
    return {
      title: 'Sign In Failed',
      message: 'Incorrect email or password. Please verify your credentials and try again.',
      code: 'INVALID_CREDENTIALS',
    };
  }

  // 3. User already exists (Sign Up)
  if (
    rawMsg.includes('user already registered') ||
    rawMsg.includes('already registered') ||
    rawMsg.includes('user_already_exists')
  ) {
    return {
      title: 'Account Exists',
      message: 'An account with this email already exists. Please sign in instead.',
      code: 'USER_ALREADY_EXISTS',
    };
  }

  // 4. Rate limits / Throttling
  if (
    rawMsg.includes('rate limit') ||
    rawMsg.includes('too many requests') ||
    rawMsg.includes('over_email_send_rate_limit') ||
    err.status === 429
  ) {
    return {
      title: 'Too Many Attempts',
      message: 'You have made too many attempts in a short time. Please wait a few moments and try again.',
      code: 'RATE_LIMIT_EXCEEDED',
      isRateLimit: true,
    };
  }

  // 5. Password too weak
  if (
    rawMsg.includes('password should be at least') ||
    rawMsg.includes('weak password') ||
    rawMsg.includes('password is too weak')
  ) {
    return {
      title: 'Weak Password',
      message: 'Your password must be at least 8 characters long and include both letters and numbers.',
      code: 'WEAK_PASSWORD',
    };
  }

  // 6. Network / Offline
  if (
    rawMsg.includes('network request failed') ||
    rawMsg.includes('failed to fetch') ||
    rawMsg.includes('offline')
  ) {
    return {
      title: 'Network Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      code: 'NETWORK_ERROR',
    };
  }

  // 7. Expired or invalid token (Password reset / OTP)
  if (
    rawMsg.includes('token has expired') ||
    rawMsg.includes('invalid token') ||
    rawMsg.includes('otp expired')
  ) {
    return {
      title: 'Link Expired',
      message: 'This verification or reset link has expired. Please request a new one.',
      code: 'TOKEN_EXPIRED',
    };
  }

  // Fallback generic error
  return {
    title: 'Authentication Error',
    message: err.message || 'An unexpected error occurred. Please try again.',
    code: err.code || 'UNKNOWN_ERROR',
  };
}

