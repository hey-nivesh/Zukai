/**
 * ZUKAI — Reset Password Screen
 * Final step of password recovery: sets a new secure password.
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
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { MeshBackground } from '../../components/MeshBackground';
import { GlassCard } from '../../components/GlassCard';
import { Text } from '../../components/Text';
import { ShinyButton } from '../../components/ShinyButton';
import { BrandLogo } from '../../components/BrandLogo';
import { supabase } from '../../lib/supabase';
import { mapAuthError } from '../../lib/authErrors';
import {
  resetPasswordSchema,
  calculatePasswordStrength,
  type ResetPasswordFormData,
} from '../../lib/validations/authSchemas';

const C = {
  brandHero: '#92F702',
  textPrimary: '#F8F9FA',
  textSecondary: '#B5C4CC',
  textTertiary: '#6B828F',
  textInverse: '#09161B',
  glassBorder: 'rgba(255,255,255,0.14)',
  glassSurface: 'rgba(15,31,38,0.70)',
  error: '#FF3D71',
  errorBg: 'rgba(255,61,113,0.12)',
  success: '#00E676',
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const currentPassword = watch('password') || '';
  const passwordStrength = calculatePasswordStrength(currentPassword);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setFormError(null);
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      setIsSubmitting(false);

      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const mapped = mapAuthError(error);
        setFormError(mapped.message);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsSuccess(true);
      }
    } catch (err) {
      setIsSubmitting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const mapped = mapAuthError(err);
      setFormError(mapped.message);
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
            { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BrandLogo size={44} style={s.logo} />

          <GlassCard style={s.card}>
            {isSuccess ? (
              <View style={s.successView}>
                <View style={s.iconCircle}>
                  <CheckCircle size={32} color={C.success} strokeWidth={2} />
                </View>
                <Text variant="title2" rawColor={C.textPrimary} style={{ textAlign: 'center' }}>
                  Password Updated!
                </Text>
                <Text variant="body" rawColor={C.textSecondary} style={{ textAlign: 'center', lineHeight: 22 }}>
                  Your password has been securely reset. You can now sign in with your new credentials.
                </Text>

                <ShinyButton
                  label="Sign In"
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<ArrowLeft size={18} color={C.textInverse} />}
                  onPress={() => router.replace('/(auth)/sign-in' as any)}
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : (
              <>
                <Text variant="title2" rawColor={C.textPrimary} style={s.cardTitle}>
                  Create New Password
                </Text>
                <Text variant="subhead" rawColor={C.textSecondary} style={s.cardSub}>
                  Enter a strong password with at least 8 characters, letters and numbers.
                </Text>

                {formError && (
                  <View style={s.errorBanner}>
                    <AlertCircle size={16} color={C.error} strokeWidth={2} />
                    <Text variant="footnote" rawColor={C.error} style={{ flex: 1 }}>
                      {formError}
                    </Text>
                  </View>
                )}

                {/* New Password */}
                <View style={s.fieldGroup}>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={[s.inputWrap, errors.password && { borderColor: C.error }]}>
                        <Lock size={18} color={errors.password ? C.error : C.textTertiary} strokeWidth={2} />
                        <TextInput
                          placeholder="New password"
                          placeholderTextColor={C.textTertiary}
                          style={s.input}
                          secureTextEntry={!showPass}
                          textContentType="newPassword"
                          autoComplete="password-new"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                        <Pressable onPress={() => setShowPass((p) => !p)} hitSlop={8}>
                          {showPass ? (
                            <EyeOff size={18} color={C.textTertiary} />
                          ) : (
                            <Eye size={18} color={C.textTertiary} />
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
                                    : 'rgba(255,255,255,0.12)',
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

                {/* Confirm Password */}
                <View style={s.fieldGroup}>
                  <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={[s.inputWrap, errors.confirmPassword && { borderColor: C.error }]}>
                        <Lock size={18} color={errors.confirmPassword ? C.error : C.textTertiary} strokeWidth={2} />
                        <TextInput
                          placeholder="Confirm new password"
                          placeholderTextColor={C.textTertiary}
                          style={s.input}
                          secureTextEntry={!showPass}
                          textContentType="newPassword"
                          autoComplete="password-new"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                      </View>
                    )}
                  />
                  {errors.confirmPassword && (
                    <Text variant="footnote" rawColor={C.error} style={s.inlineError}>
                      {errors.confirmPassword.message}
                    </Text>
                  )}
                </View>

                <ShinyButton
                  label="Update Password"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  onPress={handleSubmit(onSubmit)}
                  style={s.submitBtn}
                />
              </>
            )}
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09161B' },
  content: { paddingHorizontal: 24, alignItems: 'center' },
  logo: { fontSize: 28, fontWeight: '800', letterSpacing: 4, textAlign: 'center', marginBottom: 24 },
  card: { width: '100%', padding: 24, borderRadius: 24, gap: 14 },
  cardTitle: { textAlign: 'center' },
  cardSub: { textAlign: 'center', marginBottom: 4, lineHeight: 20 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: C.error,
  },
  fieldGroup: { width: '100%', gap: 4 },
  inputWrap: {
    backgroundColor: C.glassSurface,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  input: { flex: 1, color: '#F8F9FA', fontSize: 15 },
  inlineError: { paddingLeft: 4, marginTop: 2 },
  strengthMeter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  strengthBars: { flex: 1, flexDirection: 'row', gap: 6 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  submitBtn: { marginTop: 6 },
  successView: { alignItems: 'center', gap: 12, width: '100%' },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});

