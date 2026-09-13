import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { PaymentMethod } from '../types/schema';
import { Colors, Typography, Spacing, Shadows } from '../theme/colors';

interface PaymentOptionsProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  totalAmount: number;
  shopName?: string;
  shopkeeperVpa?: string;
  isAddressSelected: boolean;
  minOrderValue?: number;
  onPaymentSuccess?: (transactionRef?: string) => void;
}

export const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  selectedMethod,
  onSelectMethod,
  totalAmount,
  shopName = 'Apna Kirana Store',
  shopkeeperVpa = 'apnakirana@okaxis',
  isAddressSelected,
  minOrderValue = 50,
}) => {
  const isMinOrderMet = totalAmount >= minOrderValue;
  const isOrderValid = isMinOrderMet && isAddressSelected;

  // Generate standard NPCI compliant UPI Intent deep link
  const buildUpiDeepLink = (): string => {
    const formattedAmount = totalAmount.toFixed(2);
    const note = encodeURIComponent(`Order at ${shopName}`);
    const payeeName = encodeURIComponent(shopName);

    return `upi://pay?pa=${shopkeeperVpa}&pn=${payeeName}&am=${formattedAmount}&cu=INR&tn=${note}`;
  };

  const handleTriggerUpiPayment = async () => {
    if (!isOrderValid) {
      if (!isAddressSelected) {
        Alert.alert('Delivery Address Required', 'Please select or add a delivery address first.');
        return;
      }
      if (!isMinOrderMet) {
        Alert.alert('Minimum Order Not Met', `Minimum order amount is ₹${minOrderValue}.`);
        return;
      }
      return;
    }

    const upiUrl = buildUpiDeepLink();

    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
        await Linking.openURL(upiUrl);
      } else {
        // Fallback for simulators or devices without UPI installed
        Alert.alert(
          'UPI Payment Request',
          `UPI Intent URL generated:\n\n${upiUrl}\n\nVPA: ${shopkeeperVpa}\nAmount: ₹${totalAmount}\n\n(On physical devices, this directly opens GPay, PhonePe, or Paytm).`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Simulate Success (Demo)',
              onPress: () => {
                onSelectMethod('UPI');
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'UPI App Error',
        'Could not open UPI app automatically. You can also pay via Cash on Delivery.'
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Module Title */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <Text style={styles.sectionSubtitle}>भुगतान का तरीका चुनें</Text>
      </View>

      {/* Validation Warnings */}
      {!isAddressSelected && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Please select a delivery address above to proceed with payment.
          </Text>
        </View>
      )}

      {!isMinOrderMet && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Minimum order value is ₹{minOrderValue}. Please add more items.
          </Text>
        </View>
      )}

      {/* Option 1: UPI One-Tap Digital Payment */}
      <TouchableOpacity
        style={[
          styles.optionCard,
          selectedMethod === 'UPI' && styles.optionCardSelected,
        ]}
        onPress={() => onSelectMethod('UPI')}
        activeOpacity={0.8}
        accessibilityRole="radio"
        accessibilityState={{ checked: selectedMethod === 'UPI' }}
        accessibilityLabel={`Pay online via UPI for ₹${totalAmount}`}
      >
        <View style={styles.radioRow}>
          {/* Custom Large Radio Indicator */}
          <View
            style={[
              styles.radioCircle,
              selectedMethod === 'UPI' && styles.radioCircleSelected,
            ]}
          >
            {selectedMethod === 'UPI' && <View style={styles.radioDot} />}
          </View>

          <View style={styles.optionContent}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.optionTitle}>UPI One-Tap Payment</Text>
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedBadgeText}>INSTANT</Text>
              </View>
            </View>

            <Text style={styles.optionDescription}>
              Pay via Google Pay, PhonePe, Paytm, or BHIM directly
            </Text>

            {/* Popular UPI Apps Pill Icons */}
            <View style={styles.upiBadgesRow}>
              <View style={styles.appPill}>
                <Text style={styles.appPillText}>GPay</Text>
              </View>
              <View style={styles.appPill}>
                <Text style={styles.appPillText}>PhonePe</Text>
              </View>
              <View style={styles.appPill}>
                <Text style={styles.appPillText}>Paytm</Text>
              </View>
              <View style={styles.appPill}>
                <Text style={styles.appPillText}>BHIM</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Selected UPI Details & One-Tap Launch Button */}
        {selectedMethod === 'UPI' && (
          <View style={styles.upiActionBox}>
            <View style={styles.vpaInfoRow}>
              <Text style={styles.vpaLabel}>Paying To Shop VPA:</Text>
              <Text style={styles.vpaValue}>{shopkeeperVpa}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.upiLaunchBtn,
                !isOrderValid && styles.btnDisabled,
              ]}
              onPress={handleTriggerUpiPayment}
              disabled={!isOrderValid}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Launch UPI App to pay ₹${totalAmount}`}
            >
              <Text style={styles.upiLaunchIcon}>⚡</Text>
              <Text style={styles.upiLaunchText}>
                Pay ₹{totalAmount} via Any UPI App
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>

      {/* Option 2: Cash on Delivery (COD) */}
      <TouchableOpacity
        style={[
          styles.optionCard,
          selectedMethod === 'COD' && styles.optionCardSelected,
        ]}
        onPress={() => onSelectMethod('COD')}
        activeOpacity={0.8}
        accessibilityRole="radio"
        accessibilityState={{ checked: selectedMethod === 'COD' }}
        accessibilityLabel="Cash on Delivery. Pay at your doorstep."
      >
        <View style={styles.radioRow}>
          {/* Custom Large Radio Indicator */}
          <View
            style={[
              styles.radioCircle,
              selectedMethod === 'COD' && styles.radioCircleSelected,
            ]}
          >
            {selectedMethod === 'COD' && <View style={styles.radioDot} />}
          </View>

          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Cash on Delivery (COD)</Text>
            <Text style={styles.optionDescription}>
              घर पर डिलीवरी मिलने पर नकद दें या डिलीवरी बॉय के QR कोड पर स्कैन करके भुगतान करें
            </Text>

            <View style={styles.codPerksRow}>
              <Text style={styles.codPerkItem}>💵 Exact Cash Accepted</Text>
              <Text style={styles.codPerkItem}>📲 Rider QR Available</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  headerRow: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  warningIcon: {
    fontSize: 18,
  },
  warningText: {
    flex: 1,
    fontSize: Typography.sizes.xs + 1,
    color: '#92400E',
    fontWeight: Typography.weights.medium,
  },
  optionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginRight: Spacing.md,
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  optionContent: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  recommendedBadge: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  recommendedBadgeText: {
    color: Colors.primaryDark,
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
  },
  optionDescription: {
    fontSize: Typography.sizes.xs + 1,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  upiBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.sm,
  },
  appPill: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  appPillText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  upiActionBox: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  vpaInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  vpaLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  vpaValue: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  upiLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 48, // 48dp touch target
    borderRadius: 12,
    gap: 8,
    ...Shadows.card,
  },
  btnDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.textMuted,
  },
  upiLaunchIcon: {
    fontSize: 16,
  },
  upiLaunchText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.sm + 1,
    fontWeight: Typography.weights.bold,
  },
  codPerksRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  codPerkItem: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
});
