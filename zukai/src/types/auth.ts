/**
 * ZUKAI AUTH TYPES
 */

import type { User, Session } from '@supabase/supabase-js';

export type AuthStatus =
  | 'loading'
  | 'signedOut'
  | 'needsEmailVerification'
  | 'needsOnboarding'
  | 'ready';

export type PreferredLanguage = 'english' | 'hinglish';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  preferred_language: PreferredLanguage;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isOnline: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
  pendingVerificationEmail: string | null;

  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateLanguage: (lang: PreferredLanguage) => Promise<boolean>;
  completeOnboarding: () => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

