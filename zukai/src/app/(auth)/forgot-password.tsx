/**
 * ZUKAI — Forgot Password Screen
 * Sends password recovery link to user's registered email.
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
import { Mail, ChevronLeft, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { MeshBackground } from '../../components/MeshBackground';
import { GlassCard } from '../../components/GlassCard';
import { Text } from '../../components/Text';
import { ShinyButton } from '../../components/ShinyButton';
import { BrandLogo } from '../../components/BrandLogo';
import { useAuth } from '../../components/AuthProvider';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await auth.sendPasswordReset(data.email);
    setIsSubmitting(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSentEmail(data.email);
      setIsSuccess(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError(result.error || 'Failed to send reset link');
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
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Navigation */}
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={C.textSecondary} strokeWidth={2} />
          </Pressable>

          <BrandLogo size={44} style={s.logo} />

          <GlassCard style={s.card}>
            {isSuccess ? (
              <View style={s.successView}>
                <View style={s.iconCircle}>
                  <CheckCircle size={32} color={C.success} strokeWidth={2} />
                </View>
                <Text variant="title2" rawColor={C.textPrimary} style={{ textAlign: 'center' }}>
                  Reset Link Sent
                </Text>
                <Text variant="body" rawColor={C.textSecondary} style={{ textAlign: 'center' }}>
                  We sent password reset instructions to:
                </Text>
                <Text variant="headline" rawColor={C.brandHero} style={{ textAlign: 'center' }}>
                  {sentEmail}
                </Text>
                <Text variant="footnote" rawColor={C.textTertiary} style={{ textAlign: 'center', lineHeight: 20 }}>
                  Click the link in the email to set a new password on your device.
                </Text>

                <ShinyButton
                  label="Back to Sign In"
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
                  Reset Password
                </Text>
                <Text variant="subhead" rawColor={C.textSecondary} style={s.cardSub}>
                  Enter your email address and we'll send you a recovery link.
                </Text>

                {formError && (
                  <View style={s.errorBanner}>
                    <AlertCircle size={16} color={C.error} strokeWidth={2} />
                    <Text variant="footnote" rawColor={C.error} style={{ flex: 1 }}>
                      {formError}
                    </Text>
                  </View>
                )}

                <View style={s.fieldGroup}>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={[s.inputWrap, errors.email && { borderColor: C.error }]}>
                        <Mail size={18} color={errors.email ? C.error : C.textTertiary} strokeWidth={2} />
                        <TextInput
                          placeholder="Enter your email"
                          placeholderTextColor={C.textTertiary}
                          style={s.input}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="email-address"
                          textContentType="emailAddress"
                          autoComplete="email"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
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

                <ShinyButton
                  label="Send Reset Link"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  onPress={handleSubmit(onSubmit)}
                  style={s.submitBtn}
                />

                <ShinyButton
                  label="Cancel"
                  variant="secondary"
                  size="md"
                  fullWidth
                  onPress={() => router.back()}
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
  backBtn: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logo: { fontSize: 28, fontWeight: '800', letterSpacing: 4, textAlign: 'center', marginBottom: 20 },
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

