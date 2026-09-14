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
  const { sendPhoneOtp, verifyOtp, loginWithPin, loading, error, clearError } = useAuth();

  // Mode: 'CUSTOMER' | 'SHOPKEEPER'
  const [loginMode, setLoginMode] = useState<'CUSTOMER' | 'SHOPKEEPER'>('CUSTOMER');

  // Screen Step: 'PHONE_ENTRY' | 'OTP_ENTRY'
  const [step, setStep] = useState<'PHONE_ENTRY' | 'OTP_ENTRY'>('PHONE_ENTRY');
  
  // Phone Input State (10 digits without +91)
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Shopkeeper Credentials State
  const [shopkeeperPhone, setShopkeeperPhone] = useState('9876543210');
  const [shopkeeperPin, setShopkeeperPin] = useState('');
  const [shopkeeperError, setShopkeeperError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

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

  // Validate and submit Shopkeeper PIN login
  const handleShopkeeperLogin = async () => {
    clearError();
    setShopkeeperError(null);
    if (!shopkeeperPhone || shopkeeperPhone.length !== 10) {
      setShopkeeperError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!shopkeeperPin || shopkeeperPin.length < 4) {
      setShopkeeperError('Please enter your 4-digit Store Security PIN.');
      return;
    }
    const success = await loginWithPin(shopkeeperPhone, shopkeeperPin);
    if (success && onSuccess) {
      onSuccess();
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
              ? 'Enter your mobile number for fast neighborhood grocery deliveries'
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
        {/* STEP 1A: CUSTOMER MOBILE OTP LOGIN                              */}
        {/* --------------------------------------------------------------- */}
        {step === 'PHONE_ENTRY' && loginMode === 'CUSTOMER' && (
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Customer Mobile Number</Text>

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

            {/* Primary Action Button */}
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
                <Text style={styles.primaryButtonText}>Get Verification Code</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* --------------------------------------------------------------- */}
        {/* STEP 1B: SHOPKEEPER CREDENTIAL PIN LOGIN                         */}
        {/* --------------------------------------------------------------- */}
        {step === 'PHONE_ENTRY' && loginMode === 'SHOPKEEPER' && (
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Shopkeeper Registered Phone</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.flagEmoji}>🇮🇳</Text>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="98765 43210"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={10}
                value={shopkeeperPhone}
                onChangeText={(t) => {
                  setShopkeeperPhone(t.replace(/\D/g, '').slice(0, 10));
                  clearError();
                  setShopkeeperError(null);
                }}
                editable={!loading}
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>
              Store Security PIN (सुरक्षा पिन)
            </Text>
            <View style={styles.pinInputContainer}>
              <TextInput
                style={styles.pinInput}
                placeholder="Enter 4-digit PIN"
                placeholderTextColor="#64748B"
                keyboardType="number-pad"
                secureTextEntry={!showPin}
                maxLength={6}
                value={shopkeeperPin}
                onChangeText={(t) => {
                  setShopkeeperPin(t.replace(/\D/g, ''));
                  clearError();
                  setShopkeeperError(null);
                }}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPin(!showPin)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeButtonText}>{showPin ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.helperText}>
              💡 Store Security PIN is configured in Store Settings (Default PIN: 8873)
            </Text>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                styles.shopkeeperButton,
                (!shopkeeperPin || shopkeeperPhone.length !== 10 || loading) && styles.disabledButton,
              ]}
              onPress={handleShopkeeperLogin}
              disabled={!shopkeeperPin || shopkeeperPhone.length !== 10 || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Login as Shopkeeper</Text>
              )}
            </TouchableOpacity>
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

            {/* Demo OTP Helper Banner with 1-Tap Fill */}
            <TouchableOpacity
              onPress={() => {
                setOtpDigits(['1', '2', '3', '4', '5', '6']);
                triggerVerify('123456');
              }}
              style={{
                backgroundColor: '#ECFDF5',
                padding: 12,
                borderRadius: 12,
                marginBottom: 16,
                borderWidth: 1.5,
                borderColor: '#6EE7B7',
                alignItems: 'center',
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 13, color: '#065F46', textAlign: 'center', fontWeight: 'bold' }}>
                💡 Verification Code: 123456
              </Text>
              <Text style={{ fontSize: 11, color: '#047857', marginTop: 3, fontWeight: '600' }}>
                ⚡ Tap here to auto-fill 123456 & Proceed
              </Text>
            </TouchableOpacity>

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
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTabActive: {
    backgroundColor: Colors.brandPrimary,
    ...Shadows.sm,
  },
  roleTabText: {
    ...Typography.labelMedium,
    color: '#94A3B8',
    fontWeight: '700',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  pinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 16,
    marginBottom: Spacing.xs,
  },
  pinInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: Spacing.md,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  eyeButtonText: {
    fontSize: 18,
  },
  shopkeeperButton: {
    backgroundColor: '#059669',
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
