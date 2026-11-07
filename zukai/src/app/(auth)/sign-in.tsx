/**
 * ZUKAI — Sign In Screen
 * Enterprise-grade 3D Glassmorphic Auth Experience with Generous Spacing & High-Contrast Cyber Aesthetics.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { MeshBackground } from '../../components/MeshBackground';
import { GlassCard } from '../../components/GlassCard';
import { Text } from '../../components/Text';
import { ShinyButton } from '../../components/ShinyButton';
import { BrandLogo } from '../../components/BrandLogo';
import { useAuth } from '../../components/AuthProvider';
import { signInSchema, type SignInFormData } from '../../lib/validations/authSchemas';

const C = {
  brandHero: '#92F702',
  brandGlow: 'rgba(146, 247, 2, 0.40)',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8CED9',
  textTertiary: '#718E9E',
  textMuted: '#4D6877',
  fieldBg: 'rgba(255, 255, 255, 0.04)',
  fieldBgFocused: 'rgba(146, 247, 2, 0.04)',
  borderDefault: 'rgba(255, 255, 255, 0.12)',
  borderFocused: '#92F702',
  error: '#FF3D71',
  errorBg: 'rgba(255, 61, 113, 0.12)',
};

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const auth = useAuth();

  const [showPass, setShowPass] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Focus states for 3D neon border highlight
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: SignInFormData) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await auth.signInWithEmail(data.email, data.password);
    setIsSubmitting(false);

    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError(result.error || 'Sign in failed');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigation is handled automatically by AuthProvider guards
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setIsGoogleLoading(true);

    const result = await auth.signInWithGoogle();
    setIsGoogleLoading(false);

    if (!result.success) {
      if (result.error !== 'Sign in was cancelled.') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFormError(result.error || 'Google sign in failed');
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const isLockedOut = auth.lockoutUntil && Date.now() < auth.lockoutUntil;

  return (
    <View style={s.root}>
      <MeshBackground variant="onboarding" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            s.content,
            { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Brand Section */}
          <View style={s.brandHeader}>
            <BrandLogo size={68} layout="column" />
            <Text variant="subhead" rawColor={C.textSecondary} style={s.tagline}>
              Audio learning, supercharged.
            </Text>
          </View>

          {/* 3D Frosted Glass Card */}
          <GlassCard style={s.card} padding={28} borderRadius={28}>
            <View style={s.cardHeader}>
              <Text variant="title2" rawColor={C.textPrimary} style={s.cardTitle}>
                Welcome Back
              </Text>
              <Text variant="subhead" rawColor={C.textSecondary} style={s.cardSub}>
                Sign in to continue your journey
              </Text>
            </View>

            {/* Error Banner */}
            {formError && (
              <View style={s.errorBanner}>
                <AlertCircle size={18} color={C.error} strokeWidth={2.2} />
                <Text variant="footnote" rawColor={C.error} style={{ flex: 1, fontWeight: '500' }}>
                  {formError}
                </Text>
              </View>
            )}

            {/* Throttling Lockout Message */}
            {isLockedOut && (
              <View style={[s.errorBanner, { borderColor: '#FFD600', backgroundColor: 'rgba(255,214,0,0.12)' }]}>
                <AlertCircle size={18} color="#FFD600" strokeWidth={2.2} />
                <Text variant="footnote" rawColor="#FFD600" style={{ flex: 1, fontWeight: '500' }}>
                  Too many attempts. Please wait before trying again.
                </Text>
              </View>
            )}

            {/* Form Fields Container with Generous Breathing Space */}
            <View style={s.formFields}>
              {/* Email Field */}
              <View style={s.fieldBlock}>
                <Text variant="caption" rawColor={C.textSecondary} style={s.fieldLabel}>
                  EMAIL ADDRESS
                </Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View
                      style={[
                        s.inputContainer,
                        emailFocused && s.inputContainerFocused,
                        errors.email && s.inputContainerError,
                      ]}
                    >
                      <Mail
                        size={20}
                        color={errors.email ? C.error : emailFocused ? C.brandHero : C.textTertiary}
                        strokeWidth={2}
                      />
                      <TextInput
                        placeholder="you@example.com"
                        placeholderTextColor={C.textMuted}
                        style={s.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        autoComplete="email"
                        value={value}
                        onChangeText={onChange}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => {
                          setEmailFocused(false);
                          onBlur();
                        }}
                      />
                    </View>
                  )}
                />
                {errors.email && (
                  <Text variant="footnote" rawColor={C.error} style={s.inlineError}>
                    {errors.email.message}
                  </Text>
                )}
              </View>

              {/* Password Field */}
              <View style={s.fieldBlock}>
                <Text variant="caption" rawColor={C.textSecondary} style={s.fieldLabel}>
                  PASSWORD
                </Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View
                      style={[
                        s.inputContainer,
                        passFocused && s.inputContainerFocused,
                        errors.password && s.inputContainerError,
                      ]}
                    >
                      <Lock
                        size={20}
                        color={errors.password ? C.error : passFocused ? C.brandHero : C.textTertiary}
                        strokeWidth={2}
                      />
                      <TextInput
                        placeholder="Enter your password"
                        placeholderTextColor={C.textMuted}
                        style={s.input}
                        secureTextEntry={!showPass}
                        textContentType="password"
                        autoComplete="password"
                        value={value}
                        onChangeText={onChange}
                        onFocus={() => setPassFocused(true)}
                        onBlur={() => {
                          setPassFocused(false);
                          onBlur();
                        }}
                      />
                      <Pressable onPress={() => setShowPass((p) => !p)} hitSlop={12} style={s.eyeBtn}>
                        {showPass ? (
                          <EyeOff size={20} color={C.textSecondary} />
                        ) : (
                          <Eye size={20} color={C.textTertiary} />
                        )}
                      </Pressable>
                    </View>
                  )}
                />
                {errors.password && (
                  <Text variant="footnote" rawColor={C.error} style={s.inlineError}>
                    {errors.password.message}
                  </Text>
                )}
              </View>

              {/* Forgot Password Link */}
              <Pressable
                style={s.forgotRow}
                onPress={() => router.push('/forgot-password' as any)}
                hitSlop={8}
              >
                <Text variant="footnote" rawColor={C.brandHero} style={{ fontWeight: '700' }}>
                  Forgot Password?
                </Text>
              </Pressable>
            </View>

            {/* Submit Button */}
            <ShinyButton
              label="Sign In"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting || !!isLockedOut}
              onPress={handleSubmit(onSubmit)}
              style={s.signInBtn}
            />

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text variant="caption" rawColor={C.textTertiary} style={s.dividerText}>
                or continue with
              </Text>
              <View style={s.dividerLine} />
            </View>

            {/* Google OAuth Button */}
            <ShinyButton
              label="Continue with Google"
              variant="secondary"
              size="md"
              fullWidth
              loading={isGoogleLoading}
              disabled={isGoogleLoading}
              onPress={handleGoogleSignIn}
              style={s.googleBtn}
            />
          </GlassCard>

          {/* Footer Navigation */}
          <View style={s.footerRow}>
            <Text variant="subhead" rawColor={C.textSecondary}>
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/sign-up' as any)} hitSlop={10}>
              <Text variant="subhead" rawColor={C.brandHero} style={{ fontWeight: '700' }}>
                Sign Up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#071216',
  },
  content: {
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  tagline: {
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  card: {
    width: '100%',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardSub: {
    marginTop: 6,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: C.errorBg,
    borderWidth: 1.2,
    borderColor: C.error,
    marginBottom: 18,
  },
  formFields: {
    width: '100%',
    marginBottom: 24,
  },
  fieldBlock: {
    width: '100%',
    marginBottom: 20,
  },
  fieldLabel: {
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    paddingLeft: 2,
  },
  inputContainer: {
    backgroundColor: C.fieldBg,
    borderWidth: 1.5,
    borderColor: C.borderDefault,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  inputContainerFocused: {
    borderColor: C.borderFocused,
    backgroundColor: C.fieldBgFocused,
    shadowColor: C.brandHero,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainerError: {
    borderColor: C.error,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 4,
  },
  inlineError: {
    paddingLeft: 4,
    marginTop: 6,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 4,
  },
  signInBtn: {
    height: 56,
    marginBottom: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  dividerText: {
    letterSpacing: 0.8,
  },
  googleBtn: {
    height: 52,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
});
