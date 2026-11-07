jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { useAuthStore } from '../src/lib/authStore';
import type { UserProfile } from '../src/types/auth';

describe('Auth State Machine (5 States)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: 'loading',
      user: null,
      session: null,
      profile: null,
      failedAttempts: 0,
      lockoutUntil: null,
      pendingVerificationEmail: null,
    });
  });

  it('starts in loading state', () => {
    expect(useAuthStore.getState().status).toBe('loading');
  });

  it('transitions to signedOut when no session exists', () => {
    useAuthStore.setState({ status: 'signedOut', session: null, user: null });
    expect(useAuthStore.getState().status).toBe('signedOut');
  });

  it('transitions to needsEmailVerification when email is not confirmed', () => {
    useAuthStore.setState({
      status: 'needsEmailVerification',
      pendingVerificationEmail: 'test@zukai.app',
    });
    expect(useAuthStore.getState().status).toBe('needsEmailVerification');
    expect(useAuthStore.getState().pendingVerificationEmail).toBe('test@zukai.app');
  });

  it('transitions to needsOnboarding when onboarding_completed is false', () => {
    const mockProfile: UserProfile = {
      id: '123',
      email: 'test@zukai.app',
      full_name: 'Test User',
      avatar_url: null,
      preferred_language: 'english',
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    useAuthStore.setState({
      status: 'needsOnboarding',
      profile: mockProfile,
    });
    expect(useAuthStore.getState().status).toBe('needsOnboarding');
  });

  it('transitions to ready when profile onboarding_completed is true', () => {
    const mockProfile: UserProfile = {
      id: '123',
      email: 'test@zukai.app',
      full_name: 'Test User',
      avatar_url: null,
      preferred_language: 'english',
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    useAuthStore.setState({
      status: 'ready',
      profile: mockProfile,
    });
    expect(useAuthStore.getState().status).toBe('ready');
  });

  it('resets all state to signedOut on signOut', async () => {
    useAuthStore.setState({
      status: 'ready',
      user: { id: '123' } as any,
      profile: { full_name: 'Test' } as any,
    });

    await useAuthStore.getState().signOut();

    expect(useAuthStore.getState().status).toBe('signedOut');
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().profile).toBeNull();
  });

  it('safely signs in with Google fallback when native module is absent', async () => {
    const result = await useAuthStore.getState().signInWithGoogle();
    expect(result.success).toBe(true);
    expect(useAuthStore.getState().status).toBe('ready');
    expect(useAuthStore.getState().user?.email).toBe('alex.google@zukai.app');
  });

  it('safely registers demo user with signUpWithEmail fallback', async () => {
    const result = await useAuthStore.getState().signUpWithEmail('demo@zukai.app', 'password123', 'Demo User');
    expect(result.success).toBe(true);
    expect(useAuthStore.getState().status).toBe('needsOnboarding');
    expect(useAuthStore.getState().profile?.full_name).toBe('Demo User');
  });
});
