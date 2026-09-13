import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { CartItem } from '../types/schema';
import { Colors, Typography, Spacing, Shadows } from '../theme/colors';

interface CartScreenProps {
  cart: Record<string, CartItem>;
  freeDeliveryThreshold?: number;
  standardDeliveryFee?: number;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart?: () => void;
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  cart,
  freeDeliveryThreshold = 150,
  standardDeliveryFee = 20,
  onIncrement,
  onDecrement,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onContinueShopping,
}) => {
  const itemsList = useMemo(() => Object.values(cart), [cart]);

  // Calculations
  const { itemTotal, totalItemsCount, totalSavings } = useMemo(() => {
    let total = 0;
    let count = 0;
    let savings = 0;

    itemsList.forEach(({ product, quantity }) => {
      total += product.sellingPrice * quantity;
      count += quantity;
      if (product.mrp > product.sellingPrice) {
        savings += (product.mrp - product.sellingPrice) * quantity;
      }
    });

    return { itemTotal: total, totalItemsCount: count, totalSavings: savings };
  }, [itemsList]);

  const isFreeDelivery = itemTotal >= freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : standardDeliveryFee;
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - itemTotal);
  const grandTotal = itemTotal + deliveryFee;

  // ---------------------------------------------------------------------------
  // Empty Cart State
  // ---------------------------------------------------------------------------
  if (itemsList.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyEmoji}>🛒</Text>
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>
            आपकी टोकरी खाली है। रोज़मर्रा का ज़रूरी सामान चुनने के लिए नीचे दिए बटन पर क्लिक करें।
          </Text>

          <TouchableOpacity
            style={styles.browseButton}
            onPress={onContinueShopping}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Browse store products"
          >
            <Text style={styles.browseButtonText}>Browse Essentials / सामान चुनें</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onContinueShopping}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to store"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Order Summary</Text>
          <Text style={styles.headerSubtitle}>
            {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in your cart
          </Text>
        </View>

        {onClearCart && (
          <TouchableOpacity
            onPress={onClearCart}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Clear entire cart"
          >
            <Text style={styles.clearCartText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Free Delivery Threshold Incentive Banner */}
        <View
          style={[
            styles.thresholdBanner,
            isFreeDelivery ? styles.thresholdUnlocked : styles.thresholdPending,
          ]}
        >
          <Text style={styles.thresholdIcon}>{isFreeDelivery ? '🎉' : '🛵'}</Text>
          <View style={styles.thresholdTextContainer}>
            <Text style={styles.thresholdTitle}>
              {isFreeDelivery
                ? 'FREE Home Delivery Unlocked!'
                : `Add ₹${amountNeededForFreeDelivery} more to unlock FREE Delivery`}
            </Text>
            <Text style={styles.thresholdSubtitle}>
              {isFreeDelivery
                ? 'Enjoy free neighborhood delivery to your doorstep!'
                : `Standard delivery fee of ₹${standardDeliveryFee} applies under ₹${freeDeliveryThreshold}`}
            </Text>
          </View>
        </View>

        {/* Product Items List */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionHeading}>Items in Cart</Text>

          {itemsList.map(({ product, quantity }) => {
            const itemSubtotal = product.sellingPrice * quantity;
            return (
              <View key={product.id} style={styles.cartItemCard}>
                {/* Thumbnail */}
                <Image
                  source={{ uri: product.imageUrl }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />

                {/* Details */}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  {Boolean(product.nameLocalized) && (
                    <Text style={styles.itemLocalizedName}>
                      {product.nameLocalized}
                    </Text>
                  )}
                  <Text style={styles.itemUnit}>{product.unit}</Text>

                  {/* Price & Savings */}
                  <View style={styles.priceRow}>
                    <Text style={styles.itemPrice}>₹{product.sellingPrice}</Text>
                    {product.mrp > product.sellingPrice && (
                      <Text style={styles.itemMrp}>₹{product.mrp}</Text>
                    )}
                  </View>
                </View>

                {/* Right Column: Quantity Stepper & Subtotal */}
                <View style={styles.itemActions}>
                  <Text style={styles.itemSubtotal}>₹{itemSubtotal}</Text>

                  <View style={styles.stepperWrapper}>
                    {/* Decrement Button */}
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => onDecrement(product.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Decrease quantity of ${product.name}`}
                    >
                      <Text style={styles.stepperButtonText}>−</Text>
                    </TouchableOpacity>

                    {/* Quantity Value */}
                    <Text style={styles.quantityText}>{quantity}</Text>

                    {/* Increment Button */}
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => onIncrement(product.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Increase quantity of ${product.name}`}
                    >
                      <Text style={styles.stepperButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Remove Trash Button */}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => onRemoveItem(product.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${product.name} from cart`}
                  >
                    <Text style={styles.removeIcon}>🗑️ Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Bill Receipt Breakdown Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>Bill Breakdown</Text>
            <Text style={styles.receiptSubtitle}>बिल का विवरण</Text>
          </View>

          {/* Item Total */}
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Item Total ({totalItemsCount} items)</Text>
            <Text style={styles.receiptValue}>₹{itemTotal}</Text>
          </View>

          {/* Delivery Fee */}
          <View style={styles.receiptRow}>
            <View style={styles.deliveryLabelGroup}>
              <Text style={styles.receiptLabel}>Delivery Partner Fee</Text>
              {isFreeDelivery && (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.receiptValue,
                isFreeDelivery && styles.strikethroughText,
              ]}
            >
              {isFreeDelivery ? `₹${standardDeliveryFee}` : `₹${deliveryFee}`}
            </Text>
          </View>

          {/* Savings Highlight */}
          {totalSavings > 0 && (
            <View style={styles.savingsRow}>
              <Text style={styles.savingsLabel}>🎉 Store Discount Savings</Text>
              <Text style={styles.savingsValue}>−₹{totalSavings}</Text>
            </View>
          )}

          <View style={styles.receiptDivider} />

          {/* Grand Total */}
          <View style={styles.grandTotalRow}>
            <View>
              <Text style={styles.grandTotalLabel}>To Pay / कुल राशि</Text>
              <Text style={styles.taxesIncludedText}>Inclusive of all taxes</Text>
            </View>
            <Text style={styles.grandTotalValue}>₹{grandTotal}</Text>
          </View>
        </View>

        {/* Trust & Local Delivery Notice */}
        <View style={styles.trustBanner}>
          <Text style={styles.trustIcon}>🛡️</Text>
          <Text style={styles.trustText}>
            Direct delivery from your neighborhood store. Pay with cash or UPI upon delivery.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotalGroup}>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalValue}>₹{grandTotal}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={onProceedToCheckout}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={`Proceed to checkout. Total payable ₹${grandTotal}`}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Text style={styles.checkoutButtonArrow}>›</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
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
  clearCartText: {
    fontSize: Typography.sizes.sm,
    color: Colors.danger,
    fontWeight: Typography.weights.bold,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 110, // Avoid overlap with bottom sticky button
  },
  thresholdBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 14,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  thresholdUnlocked: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  thresholdPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  thresholdIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  thresholdTextContainer: {
    flex: 1,
  },
  thresholdTitle: {
    fontSize: Typography.sizes.sm + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  thresholdSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemsSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeading: {
    fontSize: Typography.sizes.md + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
  },
  itemDetails: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: Typography.sizes.sm + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  itemLocalizedName: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemUnit: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  itemMrp: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: Spacing.sm,
  },
  itemSubtotal: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  stepperWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 36,
  },
  stepperButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonText: {
    fontSize: 18,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  quantityText: {
    fontSize: Typography.sizes.sm + 1,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    marginTop: 4,
  },
  removeIcon: {
    fontSize: 11,
    color: Colors.danger,
    fontWeight: Typography.weights.semiBold,
  },
  receiptCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  receiptHeader: {
    marginBottom: Spacing.md,
  },
  receiptTitle: {
    fontSize: Typography.sizes.md + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  receiptSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm + 2,
  },
  deliveryLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  receiptValue: {
    fontSize: Typography.sizes.sm + 1,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.bold,
  },
  freeBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freeBadgeText: {
    color: Colors.primaryDark,
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
  },
  strikethroughText: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
    padding: Spacing.sm,
    borderRadius: 8,
    marginVertical: Spacing.xs,
  },
  savingsLabel: {
    fontSize: Typography.sizes.xs + 1,
    color: Colors.success,
    fontWeight: Typography.weights.bold,
  },
  savingsValue: {
    fontSize: Typography.sizes.xs + 1,
    color: Colors.success,
    fontWeight: Typography.weights.extraBold,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
    borderStyle: 'dashed',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  taxesIncludedText: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.textMuted,
    marginTop: 2,
  },
  grandTotalValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.md,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  trustIcon: {
    fontSize: 20,
  },
  trustText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
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
    fontWeight: Typography.weights.medium,
  },
  bottomTotalValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  checkoutButton: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: 16,
    gap: 8,
    ...Shadows.card,
  },
  checkoutButtonText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  checkoutButtonArrow: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: Typography.weights.bold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyEmoji: {
    fontSize: 44,
  },
  emptyTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: 16,
    ...Shadows.card,
  },
  browseButtonText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
});
