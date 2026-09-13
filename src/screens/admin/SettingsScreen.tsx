import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, Shadows } from '../../theme/colors';

export const SettingsScreen: React.FC = () => {
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [minFreeDelivery, setMinFreeDelivery] = useState('150');
  const [standardDeliveryFee, setStandardDeliveryFee] = useState('20');
  const [deliveryRadius, setDeliveryRadius] = useState('3.5');
  const [upiVpa, setUpiVpa] = useState('apnakirana@okaxis');
  const [storePhone, setStorePhone] = useState('+919876543210');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveSettings = () => {
    setIsSaved(true);
    Alert.alert(
      'Settings Saved',
      'Delivery settings and store configurations have been updated live across all customer apps.'
    );
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Store Control Panel</Text>
        <Text style={styles.headerSubtitle}>
          Adjust master store status, neighborhood delivery rules, and payment options.
        </Text>
      </View>

      {/* 1. Giant Master Store Switch */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Master Store Switch</Text>
        <Text style={styles.cardSubtitle}>
          Instantly control whether neighborhood customers can place orders.
        </Text>

        <TouchableOpacity
          style={[
            styles.giantStoreBtn,
            isStoreOpen ? styles.giantBtnOpen : styles.giantBtnClosed,
          ]}
          onPress={() => setIsStoreOpen(!isStoreOpen)}
          activeOpacity={0.88}
          accessibilityRole="switch"
          accessibilityState={{ checked: isStoreOpen }}
        >
          <View
            style={[
              styles.giantBulb,
              isStoreOpen ? styles.giantBulbOpen : styles.giantBulbClosed,
            ]}
          />
          <View style={styles.giantTextGroup}>
            <Text style={styles.giantStatusHeading}>
              {isStoreOpen
                ? 'STORE OPEN (Accepting Orders)'
                : 'STORE CLOSED (Orders Paused)'}
            </Text>
            <Text style={styles.giantStatusSub}>
              {isStoreOpen
                ? 'Customers can browse, add items, and checkout for delivery.'
                : 'Checkouts are temporarily blocked. Customers are shown "Store Closed".'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 2. Delivery Rules Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Neighborhood Delivery Rules</Text>
        <Text style={styles.cardSubtitle}>
          Configure incentives for higher cart value and delivery fees.
        </Text>

        <View style={styles.inputGrid}>
          {/* Min Order Value for Free Delivery */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>
              Minimum Order Value for FREE Delivery (₹)
            </Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={minFreeDelivery}
              onChangeText={setMinFreeDelivery}
              placeholder="e.g. 150"
            />
            <Text style={styles.fieldHint}>
              Customers ordering above this amount get free doorstep delivery.
            </Text>
          </View>

          {/* Standard Delivery Fee */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>
              Standard Delivery Fee (₹)
            </Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={standardDeliveryFee}
              onChangeText={setStandardDeliveryFee}
              placeholder="e.g. 20"
            />
            <Text style={styles.fieldHint}>
              Charged to customer when order total is below free delivery limit.
            </Text>
          </View>

          {/* Delivery Radius */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>
              Maximum Delivery Radius (Kilometers)
            </Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={deliveryRadius}
              onChangeText={setDeliveryRadius}
              placeholder="e.g. 3.5"
            />
            <Text style={styles.fieldHint}>
              Approximate neighborhood boundary for 15-20 min quick delivery.
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Shopkeeper UPI & Contact Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment & Store Helpdesk</Text>
        <Text style={styles.cardSubtitle}>
          UPI VPA for customer one-tap payments and customer phone support.
        </Text>

        <View style={styles.inputGrid}>
          {/* UPI VPA */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Shopkeeper UPI VPA / ID</Text>
            <TextInput
              style={styles.textInput}
              value={upiVpa}
              onChangeText={setUpiVpa}
              placeholder="e.g. apnakirana@okaxis"
            />
            <Text style={styles.fieldHint}>
              Used for generating upi://pay deep links for GPay, PhonePe, Paytm.
            </Text>
          </View>

          {/* Phone */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Shopkeeper Helpline Phone</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="phone-pad"
              value={storePhone}
              onChangeText={setStorePhone}
              placeholder="+919876543210"
            />
            <Text style={styles.fieldHint}>
              Shown to customers on the "Call Store" button.
            </Text>
          </View>
        </View>
      </View>

      {/* Save Settings Action Button */}
      <TouchableOpacity
        style={[styles.saveBtn, isSaved && styles.saveBtnSuccess]}
        onPress={handleSaveSettings}
        activeOpacity={0.88}
      >
        <Text style={styles.saveBtnText}>
          {isSaved ? 'Settings Saved Successfully ✓' : 'Save All Settings'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 60,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: Typography.sizes.xs + 1,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  giantStoreBtn: {
    minHeight: 84, // Chunky touch target visible from 1 meter away
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    ...Shadows.floating,
  },
  giantBtnOpen: {
    backgroundColor: '#064E3B', // Deep Emerald
    borderColor: '#10B981',
  },
  giantBtnClosed: {
    backgroundColor: '#7F1D1D', // Deep Red
    borderColor: '#EF4444',
  },
  giantBulb: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  giantBulbOpen: {
    backgroundColor: '#34D399',
  },
  giantBulbClosed: {
    backgroundColor: '#F87171',
  },
  giantTextGroup: {
    flex: 1,
  },
  giantStatusHeading: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.md + 1,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.5,
  },
  giantStatusSub: {
    color: '#E2E8F0',
    fontSize: Typography.sizes.xs,
    marginTop: 4,
    opacity: 0.9,
  },
  inputGrid: {
    gap: Spacing.lg,
  },
  fieldWrapper: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52, // Chunky touch target
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  fieldHint: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.textMuted,
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    minHeight: 56, // 56px height
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  saveBtnSuccess: {
    backgroundColor: Colors.success,
  },
  saveBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.md + 1,
    fontWeight: Typography.weights.extraBold,
  },
});
