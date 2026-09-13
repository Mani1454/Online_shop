import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Shadows } from '../theme/colors';

interface FloatingCartBarProps {
  itemCount: number;
  subtotal: number;
  freeDeliveryThreshold?: number;
  onViewCart: () => void;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({
  itemCount,
  subtotal,
  freeDeliveryThreshold = 150,
  onViewCart,
}) => {
  if (itemCount === 0) return null;

  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));
  const hasFreeDelivery = amountNeededForFreeDelivery === 0;

  return (
    <View style={styles.outerContainer}>
      {/* Free Delivery Banner Progress Indicator */}
      <View style={styles.deliveryProgressHeader}>
        <View style={styles.deliveryTextRow}>
          <Text style={styles.deliveryStatusIcon}>
            {hasFreeDelivery ? '🎉' : '🛵'}
          </Text>
          <Text style={styles.deliveryStatusText}>
            {hasFreeDelivery
              ? 'Congratulations! You unlocked FREE Delivery!'
              : `Add ₹${amountNeededForFreeDelivery} more for FREE Delivery`}
          </Text>
        </View>

        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%` },
              hasFreeDelivery && { backgroundColor: Colors.success },
            ]}
          />
        </View>
      </View>

      {/* Main Cart Bar Pill */}
      <TouchableOpacity
        style={styles.cartBar}
        onPress={onViewCart}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`View Cart. ${itemCount} items, total ₹${subtotal}`}
      >
        <View style={styles.cartInfo}>
          <Text style={styles.cartCountText}>
            {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
          </Text>
          <Text style={styles.cartTotalText}>₹{subtotal}</Text>
        </View>

        <View style={styles.viewCartAction}>
          <Text style={styles.viewCartText}>View Cart</Text>
          <Text style={styles.cartArrowIcon}>→</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.floating,
  },
  deliveryProgressHeader: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs + 2,
    paddingBottom: Spacing.xs,
  },
  deliveryTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  deliveryStatusIcon: {
    fontSize: 13,
  },
  deliveryStatusText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  cartInfo: {
    justifyContent: 'center',
  },
  cartCountText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryLight,
    fontWeight: Typography.weights.medium,
  },
  cartTotalText: {
    fontSize: Typography.sizes.lg,
    color: Colors.textWhite,
    fontWeight: Typography.weights.extraBold,
  },
  viewCartAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    gap: 6,
    ...Shadows.card,
  },
  viewCartText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textWhite,
  },
  cartArrowIcon: {
    fontSize: 16,
    color: Colors.textWhite,
    fontWeight: Typography.weights.bold,
  },
});
