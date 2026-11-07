/**
 * ZUKAI AUTH PROVIDER & ROUTE GUARD
 * Enforces strict role-based navigation and handles deep link callbacks.
 */

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '../lib/authStore';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { AuthState } from '../types/auth';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const auth = useAuthStore();
  const hasHandledInitialUrl = useRef(false);

  // 1. Initialize session on startup
  useEffect(() => {
    auth.initialize();

    // Monitor network connectivity
    const unsubscribeNet = NetInfo.addEventListener((state) => {
      const isOnline = !!state.isConnected && !!state.isInternetReachable;
      useAuthStore.setState({ isOnline });
    });

    return () => {
      unsubscribeNet();
    };
  }, []);

  // 2. Deep link handler (email verification & reset password)
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      logger.log('[AuthProvider] Received deep link:', url);

      if (!url) return;

      if (url.includes('auth/reset-password')) {
        router.replace('/(auth)/reset-password');
        return;
      }

      if (url.includes('auth/callback') || url.includes('#access_token') || url.includes('code=')) {
        // Exchange token with Supabase
        try {
          const parsed = Linking.parse(url);
          const code = parsed.queryParams?.code;
          if (typeof code === 'string') {
            await supabase.auth.exchangeCodeForSession(code);
            await auth.initialize();
          }
        } catch (err) {
          logger.warn('[AuthProvider] Failed to exchange auth code:', err);
        }
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);

    if (!hasHandledInitialUrl.current) {
      hasHandledInitialUrl.current = true;
      Linking.getInitialURL().then((url) => {
        if (url) handleDeepLink({ url });
      });
    }

    return () => {
      sub.remove();
    };
  }, []);

  // 3. Navigation Guard
  useEffect(() => {
    if (auth.status === 'loading') {
      return; // Wait for session resolution
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    logger.log(`[RouteGuard] Status: ${auth.status}, Segments: [${segments.join(', ')}]`);

    // Case A: Signed Out
    if (auth.status === 'signedOut') {
      // If user is inside tabs or protected routes, force to sign-in
      if (inTabsGroup || segments[0] === 'player' || segments[0] === 'document') {
        router.replace('/(auth)/sign-in');
      }
      return;
    }

    // Case B: Needs Email Verification
    if (auth.status === 'needsEmailVerification') {
      const currentSub = (segments as string[])[1];
      if (currentSub !== 'verify-email') {
        router.replace('/(auth)/verify-email' as any);
      }
      return;
    }

    // Case C: Needs Onboarding (e.g. Language choice)
    if (auth.status === 'needsOnboarding') {
      const currentSub = (segments as string[])[1];
      if (currentSub !== 'language') {
        router.replace('/(onboarding)/language' as any);
      }
      return;
    }

    // Case D: Ready & authenticated
    if (auth.status === 'ready') {
      // If user is stuck in auth or onboarding, transition to Home
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)/home');
      }
    }
  }, [auth.status, segments]);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    return useAuthStore();
  }
  return context;
}
