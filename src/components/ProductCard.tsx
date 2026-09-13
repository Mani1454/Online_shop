import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Product } from '../types/schema';
import { Colors, Typography, Spacing, Shadows } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 2 product cards per row
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onIncrement: (product: Product) => void;
  onDecrement: (product: Product) => void;
  onPressProduct?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  onAddToCart,
  onIncrement,
  onDecrement,
  onPressProduct,
}) => {
  const isOutOfStock = !product.isInStock;
  const hasDiscount = product.mrp > product.sellingPrice;

  return (
    <View style={[styles.card, isOutOfStock && styles.cardOutOfStock]}>
      {/* Product Image & Badges */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPressProduct?.(product)}
        style={styles.imageWrapper}
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, ${product.unit}, selling price ₹${product.sellingPrice}`}
      >
        <Image
          source={{ uri: product.imageUrl }}
          style={[styles.productImage, isOutOfStock && styles.imageFaded]}
          resizeMode="cover"
        />

        {/* Discount Badge */}
        {hasDiscount && !isOutOfStock && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{product.discountPercent}% OFF</Text>
          </View>
        )}

        {/* Out of Stock Ribbon */}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Details Container */}
      <View style={styles.detailsContainer}>
        {/* Unit / Weight Pill */}
        <View style={styles.unitBadge}>
          <Text style={styles.unitText}>{product.unit}</Text>
        </View>

        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">
          {product.name}
        </Text>

        {/* Localized Hindi Name */}
        {Boolean(product.nameLocalized) && (
          <Text style={styles.localizedName} numberOfLines={1}>
            {product.nameLocalized}
          </Text>
        )}

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.sellingPrice}>₹{product.sellingPrice}</Text>
          {hasDiscount && (
            <Text style={styles.mrpPrice}>₹{product.mrp}</Text>
          )}
        </View>

        {/* Action Button: + ADD or Stepper [- Qty +] or Out of Stock */}
        <View style={styles.actionWrapper}>
          {isOutOfStock ? (
            <View style={styles.disabledBtn}>
              <Text style={styles.disabledBtnText}>Unavailable</Text>
            </View>
          ) : quantityInCart === 0 ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => onAddToCart(product)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Add ${product.name} to cart`}
            >
              <Text style={styles.addButtonText}>+ ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => onDecrement(product)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Text style={styles.stepperSymbol}>−</Text>
              </TouchableOpacity>

              <Text style={styles.stepperQuantity}>{quantityInCart}</Text>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => onIncrement(product)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Text style={styles.stepperSymbol}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  cardOutOfStock: {
    opacity: 0.8,
  },
  imageWrapper: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageFaded: {
    opacity: 0.5,
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: Colors.danger,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  discountText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: Colors.textWhite,
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.5,
  },
  detailsContainer: {
    marginTop: Spacing.sm,
    flex: 1,
  },
  unitBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceSecondary,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  unitText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semiBold,
  },
  productName: {
    fontSize: Typography.sizes.sm + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    lineHeight: 18,
    minHeight: 36,
  },
  localizedName: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sellingPrice: {
    fontSize: Typography.sizes.md + 1,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  mrpPrice: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  actionWrapper: {
    marginTop: 'auto',
  },
  addButton: {
    backgroundColor: Colors.accent,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  addButtonText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.3,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryDark,
    height: 38,
    borderRadius: 10,
    paddingHorizontal: Spacing.sm,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperSymbol: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: Typography.weights.bold,
  },
  stepperQuantity: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
  },
  disabledBtn: {
    backgroundColor: Colors.surfaceSecondary,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabledBtnText: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
});
