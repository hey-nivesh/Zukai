/**
 * ZUKAI — Sign Up Screen
 * Enterprise-grade 3D Glassmorphic Registration with Generous Spacing & High-Contrast Cyber Aesthetics.
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
import { User, Mail, Lock, Eye, EyeOff, Check, ChevronLeft, AlertCircle } from 'lucide-react-native';
import { MeshBackground } from '../../components/MeshBackground';
import { GlassCard } from '../../components/GlassCard';
import { Text } from '../../components/Text';
import { ShinyButton } from '../../components/ShinyButton';
import { BrandLogo } from '../../components/BrandLogo';
import { useAuth } from '../../components/AuthProvider';
import {
  signUpSchema,
  calculatePasswordStrength,
  type SignUpFormData,
} from '../../lib/validations/authSchemas';

const C = {
  brandHero: '#92F702',
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

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const auth = useAuth();

  const [showPass, setShowPass] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      acceptTerms: false,
    },
  });

  const currentPassword = watch('password') || '';
  const passwordStrength = calculatePasswordStrength(currentPassword);

  const onSubmit = async (data: SignUpFormData) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await auth.signUpWithEmail(data.email, data.password, data.name);
    setIsSubmitting(false);

    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError(result.error || 'Registration failed');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result.needsVerification) {
        router.replace('/(auth)/verify-email' as any);
      } else {
        router.replace('/(onboarding)/language' as any);
      }
    }
  };

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
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Navigation Bar */}
          <View style={s.navBar}>
            <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
              <ChevronLeft size={24} color={C.textSecondary} strokeWidth={2.4} />
            </Pressable>
          </View>

          {/* Brand Header */}
          <View style={s.brandHeader}>
            <BrandLogo size={64} layout="column" />
          </View>

          {/* 3D Frosted Glass Card */}
          <GlassCard style={s.card} padding={28} borderRadius={28}>
            <View style={s.cardHeader}>
              <Text variant="title2" rawColor={C.textPrimary} style={s.cardTitle}>
                Create Account
              </Text>
              <Text variant="subhead" rawColor={C.textSecondary} style={s.cardSub}>
                Start your audio learning journey
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

            {/* Form Fields with Generous Breathing Space */}
            <View style={s.formFields}>
              {/* Full Name */}
              <View style={s.fieldBlock}>
                <Text variant="caption" rawColor={C.textSecondary} style={s.fieldLabel}>
                  FULL NAME
                </Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View
                      style={[
                        s.inputContainer,
                        nameFocused && s.inputContainerFocused,
                        errors.name && s.inputContainerError,
                      ]}
                    >
                      <User
                        size={20}
                        color={errors.name ? C.error : nameFocused ? C.brandHero : C.textTertiary}
                        strokeWidth={2}
                      />
                      <TextInput
                        placeholder="Alex Morgan"
                        placeholderTextColor={C.textMuted}
                        style={s.input}
                        textContentType="name"
                        autoComplete="name"
                        value={value}
                        onChangeText={onChange}
                        onFocus={() => setNameFocused(true)}
                        onBlur={() => {
                          setNameFocused(false);
                          onBlur();
                        }}
                      />
                    </View>
                  )}
                />
                {errors.name && (
                  <Text variant="footnote" rawColor={C.error} style={s.inlineError}>
                    {errors.name.message}
                  </Text>
                )}
              </View>

              {/* Email Address */}
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

              {/* Password */}
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
                        placeholder="Min 8 chars, letters & numbers"
                        placeholderTextColor={C.textMuted}
                        style={s.input}
                        secureTextEntry={!showPass}
                        textContentType="newPassword"
                        autoComplete="password-new"
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

                {/* Password Strength Meter */}
                {currentPassword.length > 0 && (
                  <View style={s.strengthMeter}>
                    <View style={s.strengthBars}>
                      {[1, 2, 3, 4].map((step) => (
                        <View
                          key={step}
                          style={[
                            s.strengthBar,
                            {
                              backgroundColor:
                                step <= passwordStrength.score
                                  ? passwordStrength.color
                                  : 'rgba(255, 255, 255, 0.12)',
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text
                      variant="caption"
                      rawColor={passwordStrength.color}
                      style={{ fontWeight: '700' }}
                    >
                      {passwordStrength.label}
                    </Text>
                  </View>
                )}
              </View>

              {/* Terms Checkbox */}
              <View style={s.termsBlock}>
                <Controller
                  control={control}
                  name="acceptTerms"
                  render={({ field: { onChange, value } }) => (
                    <Pressable
                      style={s.termsRow}
                      onPress={() => onChange(!value)}
                      hitSlop={8}
                    >
                      <View
                        style={[
                          s.checkbox,
                          value && s.checkboxActive,
                          errors.acceptTerms && { borderColor: C.error },
                        ]}
                      >
                        {value && <Check size={14} color="#071216" strokeWidth={3.5} />}
                      </View>
                      <Text variant="footnote" rawColor={C.textSecondary} style={{ flex: 1, lineHeight: 20 }}>
                        I agree to the{' '}
                        <Text variant="footnote" rawColor={C.brandHero} style={{ fontWeight: '700' }}>
                          Terms of Service
                        </Text>{' '}
                        and{' '}
                        <Text variant="footnote" rawColor={C.brandHero} style={{ fontWeight: '700' }}>
                          Privacy Policy
                        </Text>
                      </Text>
                    </Pressable>
                  )}
                />
                {errors.acceptTerms && (
                  <Text variant="footnote" rawColor={C.error} style={s.inlineError}>
                    {errors.acceptTerms.message}
                  </Text>
                )}
              </View>
            </View>

            {/* Submit Button */}
            <ShinyButton
              label="Create Account"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting}
              onPress={handleSubmit(onSubmit)}
              style={s.submitBtn}
            />
          </GlassCard>

          {/* Footer Navigation */}
          <View style={s.footerRow}>
            <Text variant="subhead" rawColor={C.textSecondary}>
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/sign-in' as any)} hitSlop={10}>
              <Text variant="subhead" rawColor={C.brandHero} style={{ fontWeight: '700' }}>
                Sign In
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
  navBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
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
  strengthMeter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  termsBlock: {
    width: '100%',
    marginTop: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.8,
    borderColor: C.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  checkboxActive: {
    backgroundColor: C.brandHero,
    borderColor: C.brandHero,
  },
  submitBtn: {
    height: 56,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
});
