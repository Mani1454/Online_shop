import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, Shadows, TouchTargets } from '../../theme/colors';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { sendPhoneOtp, verifyOtp, loading, error, clearError, quickLoginDemo } = useAuth();

  // Screen State: 'PHONE_ENTRY' | 'OTP_ENTRY'
  const [step, setStep] = useState<'PHONE_ENTRY' | 'OTP_ENTRY'>('PHONE_ENTRY');
  
  // Phone Input State (10 digits without +91)
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // 6-digit OTP Array State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Refs for 6 OTP input boxes for auto-advancing focus
  const otpInputRefs = useRef<Array<TextInput | null>>([]);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval: any = null;
    if (step === 'OTP_ENTRY' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  // Handle phone input formatting & validation
  const handlePhoneChange = (text: string) => {
    clearError();
    setPhoneError(null);
    // Allow only numeric digits
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 10) {
      setPhoneNumber(cleaned);
    }
  };

  // Validate and submit phone number
  const handleRequestOtp = async () => {
    clearError();
    if (phoneNumber.length !== 10) {
      setPhoneError('Please enter a complete 10-digit mobile number.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      setPhoneError('Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    const fullPhone = `+91${phoneNumber}`;
    const success = await sendPhoneOtp(fullPhone);
    if (success) {
      setStep('OTP_ENTRY');
      setResendTimer(30);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  };

  // Auto-advancing OTP Box handler
  const handleOtpDigitChange = (value: string, index: number) => {
    clearError();
    const cleanDigit = value.replace(/[^0-9]/g, '');
    
    // Handle paste of full 6-digit OTP
    if (cleanDigit.length === 6) {
      const digits = cleanDigit.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
      triggerVerify(cleanDigit);
      return;
    }

    const nextDigits = [...otpDigits];
    nextDigits[index] = cleanDigit.slice(-1); // Only take latest single digit
    setOtpDigits(nextDigits);

    // Auto-advance to next box if digit was typed
    if (cleanDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Automatically trigger verification once all 6 boxes are filled
    const fullOtp = nextDigits.join('');
    if (fullOtp.length === 6) {
      triggerVerify(fullOtp);
    }
  };

  // Handle backspace key to retreat to previous box
  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
        const nextDigits = [...otpDigits];
        nextDigits[index - 1] = '';
        setOtpDigits(nextDigits);
      }
    }
  };

  // Trigger OTP Verification
  const triggerVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) return;

    const success = await verifyOtp(code);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!canResend) return;
    const fullPhone = `+91${phoneNumber}`;
    const success = await sendPhoneOtp(fullPhone);
    if (success) {
      setResendTimer(30);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Branding & Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🏪</Text>
          </View>
          <Text style={styles.title}>Apna Kirana</Text>
          <Text style={styles.subtitle}>
            {step === 'PHONE_ENTRY'
              ? 'Enter your mobile number to get instant neighborhood deliveries'
              : `Enter the 6-digit code sent to +91 ${phoneNumber}`}
          </Text>
        </View>

        {/* Global Error Banner */}
        {(error || phoneError) && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error || phoneError}</Text>
          </View>
        )}

        {/* --------------------------------------------------------------- */}
        {/* STEP 1: PHONE NUMBER INPUT                                      */}
        {/* --------------------------------------------------------------- */}
        {step === 'PHONE_ENTRY' && (
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Mobile Phone Number</Text>

            <View style={styles.phoneInputContainer}>
              {/* Country Code Fixed Tag */}
              <View style={styles.countryCodeBadge}>
                <Text style={styles.flagEmoji}>🇮🇳</Text>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>

              {/* 10-Digit Clean Input Field */}
              <TextInput
                style={styles.phoneInput}
                placeholder="98765 43210"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                autoFocus
                editable={!loading}
              />
            </View>

            <Text style={styles.helperText}>
              We will send you a 6-digit SMS verification code. No password required!
            </Text>

            {/* Primary Action Button (Min 48x48dp target) */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (phoneNumber.length !== 10 || loading) && styles.disabledButton,
              ]}
              onPress={handleRequestOtp}
              disabled={phoneNumber.length !== 10 || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Get Verification Code →</Text>
              )}
            </TouchableOpacity>

            {/* Quick Demo Shortcuts for instant 1-tap testing */}
            <View style={styles.demoSection}>
              <Text style={styles.demoLabel}>⚡ Quick Test Shortcuts (Instant Demo)</Text>
              <View style={styles.demoButtonsRow}>
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => {
                    quickLoginDemo('customer');
                    onSuccess?.();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.demoButtonText}>👤 Customer Login</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.demoButton, styles.demoAdminButton]}
                  onPress={() => {
                    quickLoginDemo('admin');
                    onSuccess?.();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.demoAdminButtonText}>💼 Shopkeeper Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* --------------------------------------------------------------- */}
        {/* STEP 2: 6-DIGIT AUTO-ADVANCING OTP VERIFICATION                 */}
        {/* --------------------------------------------------------------- */}
        {step === 'OTP_ENTRY' && (
          <View style={styles.card}>
            <View style={styles.phoneVerificationRow}>
              <Text style={styles.verifyingText}>
                Verifying <Text style={styles.phoneBold}>+91 {phoneNumber}</Text>
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setStep('PHONE_ENTRY');
                  clearError();
                }}
              >
                <Text style={styles.editPhoneLink}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* Demo OTP Helper Banner */}
            <View style={{ backgroundColor: '#ECFDF5', padding: 10, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#A7F3D0' }}>
              <Text style={{ fontSize: 12, color: '#065F46', textAlign: 'center', fontWeight: 'bold' }}>
                💡 Demo Mode: Enter code 123456 to verify
              </Text>
            </View>

            {/* 6 Auto-Advancing OTP Boxes */}
            <View style={styles.otpBoxesContainer}>
              {otpDigits.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(el) => (otpInputRefs.current[idx] = el)}
                  style={[
                    styles.otpBox,
                    digit ? styles.otpBoxFilled : null,
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(val) => handleOtpDigitChange(val, idx)}
                  onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                  editable={!loading}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Verification Loading Indicator */}
            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={Colors.brandPrimary} size="small" />
                <Text style={styles.loadingText}>Verifying code with server...</Text>
              </View>
            )}

            {/* Verify CTA */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (otpDigits.join('').length !== 6 || loading) && styles.disabledButton,
              ]}
              onPress={() => triggerVerify()}
              disabled={otpDigits.join('').length !== 6 || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Verify & Proceed ✓</Text>
              )}
            </TouchableOpacity>

            {/* Resend OTP Section */}
            <View style={styles.resendContainer}>
              {canResend ? (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendActiveText}>Didn't get code? <Text style={styles.resendUnderline}>Resend OTP</Text></Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendDisabledText}>
                  Resend code in <Text style={styles.resendTimer}>{resendTimer}s</Text>
                </Text>
              )}
            </View>

            <View style={styles.demoHintBox}>
              <Text style={styles.demoHintText}>
                💡 <Text style={{ fontWeight: 'bold', color: '#E2E8F0' }}>Demo Tip:</Text> Enter <Text style={styles.monoCode}>123456</Text> to verify instantly in offline mode.
              </Text>
            </View>
          </View>
        )}

        {/* Hidden reCAPTCHA container for Firebase Phone Auth */}
        <View id="recaptcha-container" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
    maxWidth: 460,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    ...Shadows.md,
  },
  logoEmoji: {
    fontSize: 32,
  },
  title: {
    ...Typography.titleLarge,
    color: '#FFFFFF',
    fontWeight: '900',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: '#334155',
    ...Shadows.lg,
  },
  inputLabel: {
    ...Typography.labelMedium,
    color: '#E2E8F0',
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    height: TouchTargets.minHeight, // ≥48dp
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    backgroundColor: '#1E293B',
    height: '100%',
    borderRightWidth: 1.5,
    borderRightColor: '#334155',
    gap: 6,
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCodeText: {
    ...Typography.bodyLarge,
    color: '#F8FAFC',
    fontWeight: '800',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.md,
    color: '#FFFFFF',
    ...Typography.bodyLarge,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  helperText: {
    ...Typography.bodySmall,
    color: '#94A3B8',
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  primaryButton: {
    height: TouchTargets.minHeight, // ≥48dp
    backgroundColor: Colors.brandPrimary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    marginBottom: Spacing.md,
  },
  disabledButton: {
    backgroundColor: '#475569',
    opacity: 0.6,
  },
  primaryButtonText: {
    ...Typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#451A1A',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: Spacing.md,
    borderRadius: 16,
    marginBottom: Spacing.md,
    gap: 8,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorText: {
    ...Typography.bodySmall,
    color: '#FECACA',
    fontWeight: '700',
    flex: 1,
  },
  phoneVerificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  verifyingText: {
    ...Typography.bodyMedium,
    color: '#94A3B8',
  },
  phoneBold: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  editPhoneLink: {
    ...Typography.labelMedium,
    color: Colors.brandPrimary,
    fontWeight: '800',
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 52, // ≥48dp
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 14,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  otpBoxFilled: {
    borderColor: Colors.brandPrimary,
    backgroundColor: '#062B16',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.brandPrimary,
    fontWeight: '700',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  resendActiveText: {
    ...Typography.bodySmall,
    color: '#94A3B8',
  },
  resendUnderline: {
    color: Colors.brandPrimary,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  resendDisabledText: {
    ...Typography.bodySmall,
    color: '#64748B',
  },
  resendTimer: {
    color: '#CBD5E1',
    fontWeight: '800',
  },
  demoSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  demoLabel: {
    ...Typography.labelSmall,
    color: '#94A3B8',
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoButton: {
    flex: 1,
    height: 42,
    backgroundColor: '#064E3B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#059669',
  },
  demoButtonText: {
    ...Typography.labelSmall,
    color: '#A7F3D0',
    fontWeight: '800',
  },
  demoAdminButton: {
    backgroundColor: '#1E293B',
    borderColor: '#64748B',
  },
  demoAdminButtonText: {
    ...Typography.labelSmall,
    color: '#F1F5F9',
    fontWeight: '800',
  },
  demoHintBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: Spacing.sm,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  demoHintText: {
    ...Typography.bodySmall,
    color: '#94A3B8',
    textAlign: 'center',
  },
  monoCode: {
    color: '#34D399',
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
