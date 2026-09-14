import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { AddressSelector } from '../components/AddressSelector';
import { PaymentOptions } from '../components/PaymentOptions';
import { useAuth } from '../context/AuthContext';
import { Address, CartItem, PaymentMethod, Order } from '../types/schema';
import { Colors, Typography, Spacing, Shadows } from '../theme/colors';

const DEFAULT_SITAMARHI_ADDRESSES: Address[] = [
  {
    id: 'addr_sitamarhi_1',
    userId: 'cust_sitamarhi',
    label: 'Home',
    streetAddress: 'Main Market, Sitamarhi, Bihar',
    landmark: 'Near City Center',
    pincode: '843302',
    latitude: 26.5947,
    longitude: 85.4891,
    isDefault: true,
  },
  {
    id: 'addr_sitamarhi_2',
    userId: 'cust_sitamarhi',
    label: 'Work',
    streetAddress: 'Court Road, Sitamarhi, Bihar',
    landmark: 'Opposite State Bank of India',
    pincode: '843302',
    latitude: 26.5955,
    longitude: 85.4912,
    isDefault: false,
  },
];

interface CheckoutScreenProps {
  cart: Record<string, CartItem>;
  shopName?: string;
  shopkeeperVpa?: string;
  freeDeliveryThreshold?: number;
  standardDeliveryFee?: number;
  onBackToCart: () => void;
  onOrderPlaced: (order: Order) => void;
  onTrackOrder: (orderId: string) => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  cart,
  shopName = 'Apna Kirana & Daily Needs',
  shopkeeperVpa = '8873679268@apl',
  freeDeliveryThreshold = 150,
  standardDeliveryFee = 20,
  onBackToCart,
  onOrderPlaced,
  onTrackOrder,
}) => {
  const { userProfile } = useAuth();
  const [transactionRef, setTransactionRef] = useState<string>('');

  const [addresses, setAddresses] = useState<Address[]>(() => {
    if (userProfile?.saved_addresses && userProfile.saved_addresses.length > 0) {
      return userProfile.saved_addresses.map((a, idx) => ({
        id: a.id || `addr_${idx}`,
        userId: userProfile.uid,
        label: (a.label as any) || 'Home',
        streetAddress: (a as any).street_address || (a as any).streetAddress || 'Main Market, Sitamarhi, Bihar',
        landmark: a.landmark || 'Near City Center',
        pincode: a.pincode || '843302',
        isDefault: a.is_default ?? idx === 0,
      }));
    }
    return DEFAULT_SITAMARHI_ADDRESSES;
  });

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(() => {
    return addresses[0] || null;
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const cartList = useMemo(() => Object.values(cart), [cart]);

  // Price Totals
  const { itemTotal, totalItemsCount } = useMemo(() => {
    let total = 0;
    let count = 0;
    cartList.forEach(({ product, quantity }) => {
      total += product.sellingPrice * quantity;
      count += quantity;
    });
    return { itemTotal: total, totalItemsCount: count };
  }, [cartList]);

  const isFreeDelivery = itemTotal >= freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : standardDeliveryFee;
  const grandTotal = itemTotal + deliveryFee;

  const handleAddNewAddress = (newAddrData: Omit<Address, 'id' | 'userId'>) => {
    const newAddress: Address = {
      ...newAddrData,
      id: `addr_${Date.now()}`,
      userId: userProfile?.uid || 'cust_user_001',
    };
    setAddresses((prev) => [newAddress, ...prev]);
    setSelectedAddress(newAddress);
  };

  const submitOrderRecord = (friendlyOrderId: string, custUid: string, custName: string, custPhone: string) => {
    setIsSubmitting(true);
    const cleanUtr = transactionRef.trim();

    const newOrder: Order = {
      id: friendlyOrderId,
      customerId: custUid,
      customerName: custName,
      customerPhone: custPhone,
      deliveryAddress: selectedAddress!,
      items: cartList.map(({ product, quantity }) => ({
        id: `item_${product.id}_${Date.now()}`,
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        quantity,
        unitPrice: product.sellingPrice,
        totalPrice: product.sellingPrice * quantity,
        imageUrl: product.imageUrl,
      })),
      itemTotal,
      deliveryFee,
      discountAmount: 0,
      finalTotal: grandTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'UPI' ? (cleanUtr ? 'COMPLETED' : 'PENDING') : 'PENDING',
      transactionRef: paymentMethod === 'UPI' ? (cleanUtr || `UPI-${Date.now().toString().slice(-6)}`) : undefined,
      status: 'RECEIVED',
      statusTimeline: [
        {
          status: 'RECEIVED',
          timestamp: new Date().toISOString(),
          note: paymentMethod === 'UPI'
            ? `Order placed with UPI${cleanUtr ? ` (UTR: ${cleanUtr})` : ''}`
            : 'Order placed with Cash on Delivery',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setCreatedOrder(newOrder);
      setShowSuccessModal(true);
      onOrderPlaced(newOrder);
    }, 600);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Missing Address', 'Please select or add a delivery address.');
      return;
    }

    if (itemTotal === 0) {
      Alert.alert('Cart is empty', 'Add items before checking out.');
      return;
    }

    const friendlyOrderId = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const custPhone = userProfile?.phone_number || '+918873679268';
    const custName = userProfile?.name || 'Neighborhood Customer';
    const custUid = userProfile?.uid || `cust_${custPhone.replace(/\D/g, '').slice(-10) || Date.now()}`;

    // If UPI chosen and user hasn't entered a confirmed UTR yet, launch the UPI app directly
    if (paymentMethod === 'UPI') {
      const formattedAmount = grandTotal.toFixed(2);
      const note = encodeURIComponent(`Order_${friendlyOrderId}`);
      const payeeName = encodeURIComponent(shopName);
      const upiUrl = `upi://pay?pa=${shopkeeperVpa}&pn=${payeeName}&am=${formattedAmount}&cu=INR&tn=${note}`;

      try {
        const canOpen = await Linking.canOpenURL(upiUrl);
        if (canOpen) {
          await Linking.openURL(upiUrl);
          Alert.alert(
            'UPI App Launched ⚡',
            `Complete payment of ₹${formattedAmount} in your UPI app.\n\nAfter paying, enter your 12-digit Bank UTR or tap "Confirm Order" to place your order.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Confirm Order ✓',
                onPress: () => submitOrderRecord(friendlyOrderId, custUid, custName, custPhone),
              },
            ]
          );
          return;
        } else {
          // No UPI app on device/simulator
          Alert.alert(
            'Pay via UPI',
            `Shop UPI VPA: ${shopkeeperVpa}\nAmount: ₹${formattedAmount}\n\nPlease scan the BharatQR code or pay using your UPI app and tap Confirm.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Confirm Order ✓',
                onPress: () => submitOrderRecord(friendlyOrderId, custUid, custName, custPhone),
              },
            ]
          );
          return;
        }
      } catch (err) {
        console.warn('UPI intent launch note:', err);
      }
    }

    // Direct submission for COD
    submitOrderRecord(friendlyOrderId, custUid, custName, custPhone);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBackToCart}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Cart"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Checkout & Payment</Text>
          <Text style={styles.headerSubtitle}>
            Delivery in ~1 hr to your doorstep
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Module 1: Delivery Address Selection */}
        <AddressSelector
          savedAddresses={addresses}
          selectedAddressId={selectedAddress?.id || null}
          onSelectAddress={setSelectedAddress}
          onAddNewAddress={handleAddNewAddress}
        />

        {/* Module 2: Order Items Summary Capsule */}
        <View style={styles.orderSummaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>
              Order Summary ({totalItemsCount} items)
            </Text>
            <TouchableOpacity onPress={onBackToCart}>
              <Text style={styles.editCartText}>Edit Cart</Text>
            </TouchableOpacity>
          </View>

          {cartList.slice(0, 3).map(({ product, quantity }) => (
            <View key={product.id} style={styles.itemRow}>
              <Text style={styles.itemRowName} numberOfLines={1}>
                {product.name} ({product.unit})
              </Text>
              <Text style={styles.itemRowQty}>x{quantity}</Text>
              <Text style={styles.itemRowPrice}>
                ₹{product.sellingPrice * quantity}
              </Text>
            </View>
          ))}

          {cartList.length > 3 && (
            <Text style={styles.moreItemsText}>
              + {cartList.length - 3} more items in your cart
            </Text>
          )}

          <View style={styles.summaryDivider} />

          {/* Mini receipt */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Item Total</Text>
            <Text style={styles.priceValue}>₹{itemTotal}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery</Text>
            <Text style={styles.priceValue}>
              {isFreeDelivery ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>
          <View style={[styles.priceRow, { marginTop: 4 }]}>
            <Text style={styles.totalPriceLabel}>Grand Total</Text>
            <Text style={styles.totalPriceValue}>₹{grandTotal}</Text>
          </View>
        </View>

        {/* Module 3: Payment Options */}
        <PaymentOptions
          selectedMethod={paymentMethod}
          onSelectMethod={setPaymentMethod}
          totalAmount={grandTotal}
          shopName={shopName}
          shopkeeperVpa={shopkeeperVpa}
          isAddressSelected={!!selectedAddress}
          minOrderValue={50}
          transactionRef={transactionRef}
          onTransactionRefChange={setTransactionRef}
        />
      </ScrollView>

      {/* Sticky Bottom Place Order CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotalGroup}>
          <Text style={styles.bottomTotalLabel}>Total Payable</Text>
          <Text style={styles.bottomTotalValue}>₹{grandTotal}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (!selectedAddress || isSubmitting) && styles.btnDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={!selectedAddress || isSubmitting}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={`Place order with ${paymentMethod}. Total ₹${grandTotal}`}
        >
          <Text style={styles.placeOrderButtonText}>
            {isSubmitting
              ? 'Placing Order...'
              : paymentMethod === 'UPI'
              ? 'Pay & Place Order ⚡'
              : 'Confirm COD Order 📦'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Order Success Modal & Animation */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            {/* Animated Checkmark Circle */}
            <View style={styles.successIconCircle}>
              <Text style={styles.successCheckmark}>✓</Text>
            </View>

            <Text style={styles.successTitle}>Order Placed Successfully!</Text>
            <Text style={styles.successSubtitle}>
              ऑर्डर सफलतापूर्वक दर्ज हो गया है!
            </Text>

            {createdOrder && (
              <View style={styles.orderDetailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID:</Text>
                  <Text style={styles.detailValueBold}>{createdOrder.id}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Estimated Delivery:</Text>
                  <Text style={styles.detailValue}>Within 1 Hour</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method:</Text>
                  <Text style={styles.detailValue}>
                    {createdOrder.paymentMethod === 'UPI' ? 'UPI Online' : 'Cash on Delivery'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={styles.detailValueBold}>₹{createdOrder.finalTotal}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.trackOrderButton}
              onPress={() => {
                setShowSuccessModal(false);
                if (createdOrder) {
                  onTrackOrder(createdOrder.id);
                }
              }}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Track your order status"
            >
              <Text style={styles.trackOrderButtonText}>Track Live Delivery 🛵</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
  },
  backButtonText: {
    fontSize: 22,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.bold,
  },
  headerTitleGroup: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 110,
  },
  orderSummaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: Spacing.sm,
    ...Shadows.card,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  editCartText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemRowName: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
  itemRowQty: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md,
  },
  itemRowPrice: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.bold,
  },
  moreItemsText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm + 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: Typography.sizes.xs + 1,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: Typography.sizes.xs + 1,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.bold,
  },
  totalPriceLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  totalPriceValue: {
    fontSize: Typography.sizes.md + 1,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 24 : Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.floating,
  },
  bottomTotalGroup: {
    justifyContent: 'center',
  },
  bottomTotalLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  bottomTotalValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  placeOrderButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: 16,
    ...Shadows.card,
  },
  btnDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.textMuted,
  },
  placeOrderButtonText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  successCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.xxl,
    alignItems: 'center',
    ...Shadows.floating,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  successCheckmark: {
    fontSize: 42,
    color: Colors.textWhite,
    fontWeight: Typography.weights.extraBold,
  },
  successTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: Typography.sizes.xs + 1,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  orderDetailsBox: {
    width: '100%',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 14,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: Typography.sizes.xs,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
  detailValueBold: {
    fontSize: Typography.sizes.sm,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  trackOrderButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    ...Shadows.card,
  },
  trackOrderButtonText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
});
