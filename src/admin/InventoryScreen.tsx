import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useStore } from './context/StoreContext';
import { Product } from '../types/schema';
import { Colors, Typography, Spacing, Shadows } from '../theme/colors';

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'groceries', label: 'Atta, Rice & Dal' },
  { id: 'dairy', label: 'Milk & Bread' },
  { id: 'instant-food', label: 'Instant Food' },
  { id: 'beverages', label: 'Tea & Coffee' },
  { id: 'household', label: 'Cleaning & Soaps' },
];

export const InventoryScreen: React.FC = () => {
  const { products, toggleProductStock, updateProductPrices } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Local state for editing prices inline
  const [priceEdits, setPriceEdits] = useState<
    Record<string, { mrp: string; sellingPrice: string }>
  >({});

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesLocalized = p.nameLocalized?.toLowerCase().includes(q);
        return matchesName || matchesLocalized;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const handlePriceChange = (
    productId: string,
    field: 'mrp' | 'sellingPrice',
    val: string
  ) => {
    setPriceEdits((prev) => ({
      ...prev,
      [productId]: {
        mrp: field === 'mrp' ? val : prev[productId]?.mrp ?? '',
        sellingPrice:
          field === 'sellingPrice' ? val : prev[productId]?.sellingPrice ?? '',
      },
    }));
  };

  const handleSavePrice = (product: Product) => {
    const edit = priceEdits[product.id];
    if (!edit) return;

    const newMrp = parseFloat(edit.mrp);
    const newSellingPrice = parseFloat(edit.sellingPrice);

    if (isNaN(newSellingPrice) || newSellingPrice <= 0) {
      Alert.alert('Invalid Price', 'Selling price must be a valid number.');
      return;
    }

    const finalMrp = isNaN(newMrp) || newMrp < newSellingPrice ? newSellingPrice : newMrp;

    updateProductPrices(product.id, finalMrp, newSellingPrice);

    // Clear local edit tracking for this product
    setPriceEdits((prev) => {
      const copy = { ...prev };
      delete copy[product.id];
      return copy;
    });

    Alert.alert(
      'Price Updated',
      `Updated ${product.name} to ₹${newSellingPrice} (MRP: ₹${finalMrp})`
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Search & Filter Bar */}
      <View style={styles.topControlPanel}>
        {/* Search */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items by name or hindi keyword..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillSelected,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Inventory Items Table / Card Feed */}
      <ScrollView
        contentContainerStyle={styles.inventoryListContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tableHeader}>
          <Text style={styles.thItem}>Product Details</Text>
          <Text style={styles.thPricing}>Pricing (MRP & Selling)</Text>
          <Text style={styles.thStock}>1-Tap Stock Switch</Text>
        </View>

        {filteredProducts.map((product) => {
          const isOutOfStock = !product.isInStock;
          const currentEdit = priceEdits[product.id];
          const mrpVal = currentEdit?.mrp ?? product.mrp.toString();
          const sellingVal = currentEdit?.sellingPrice ?? product.sellingPrice.toString();
          const hasUnsavedChanges = !!currentEdit;

          return (
            <View
              key={product.id}
              style={[
                styles.productRowCard,
                isOutOfStock && styles.rowOutOfStock,
              ]}
            >
              {/* Column 1: Image & Details */}
              <View style={styles.productDetailsCol}>
                <Image
                  source={{ uri: product.imageUrl }}
                  style={styles.thumbImage}
                  resizeMode="cover"
                />

                <View style={styles.nameContainer}>
                  <Text style={styles.productName}>{product.name}</Text>
                  {product.nameLocalized && (
                    <Text style={styles.productLocalized}>
                      {product.nameLocalized}
                    </Text>
                  )}
                  <View style={styles.unitPill}>
                    <Text style={styles.unitText}>{product.unit}</Text>
                  </View>
                </View>
              </View>

              {/* Column 2: Inline Price Editor */}
              <View style={styles.pricingCol}>
                <View style={styles.priceInputsRow}>
                  {/* MRP */}
                  <View style={styles.priceField}>
                    <Text style={styles.priceFieldLabel}>MRP (₹)</Text>
                    <TextInput
                      style={styles.priceInput}
                      keyboardType="numeric"
                      value={mrpVal}
                      onChangeText={(val) =>
                        handlePriceChange(product.id, 'mrp', val)
                      }
                    />
                  </View>

                  {/* Selling Price */}
                  <View style={styles.priceField}>
                    <Text style={styles.priceFieldLabel}>Selling (₹)</Text>
                    <TextInput
                      style={[styles.priceInput, styles.sellingPriceInput]}
                      keyboardType="numeric"
                      value={sellingVal}
                      onChangeText={(val) =>
                        handlePriceChange(product.id, 'sellingPrice', val)
                      }
                    />
                  </View>
                </View>

                {hasUnsavedChanges && (
                  <TouchableOpacity
                    style={styles.savePriceBtn}
                    onPress={() => handleSavePrice(product)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.savePriceText}>Save New Price ✓</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Column 3: The Critical One-Tap Stock Toggle */}
              <View style={styles.stockCol}>
                <TouchableOpacity
                  style={[
                    styles.oneTapStockBtn,
                    product.isInStock
                      ? styles.stockBtnInStock
                      : styles.stockBtnOutOfStock,
                  ]}
                  onPress={() => toggleProductStock(product.id)}
                  activeOpacity={0.8}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: product.isInStock }}
                  accessibilityLabel={`Toggle stock for ${product.name}. Currently ${
                    product.isInStock ? 'In Stock' : 'Out of Stock'
                  }`}
                >
                  <View
                    style={[
                      styles.toggleIndicatorDot,
                      product.isInStock
                        ? styles.dotInStock
                        : styles.dotOutOfStock,
                    ]}
                  />
                  <Text
                    style={[
                      styles.stockBtnText,
                      product.isInStock
                        ? styles.stockTextInStock
                        : styles.stockTextOutOfStock,
                    ]}
                  >
                    {product.isInStock ? 'IN STOCK ✓' : 'OUT OF STOCK ✕'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.oneTapHint}>Tap once to toggle</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topControlPanel: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
  },
  clearSearch: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: Typography.weights.bold,
  },
  categoryPillScroll: {
    gap: Spacing.sm,
  },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryPillText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semiBold,
  },
  categoryPillTextSelected: {
    color: Colors.textWhite,
    fontWeight: Typography.weights.bold,
  },
  inventoryListContent: {
    padding: Spacing.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  thItem: {
    flex: 2,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
  },
  thPricing: {
    flex: 1.5,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
  },
  thStock: {
    flex: 1.5,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  productRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  rowOutOfStock: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  productDetailsCol: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  thumbImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
  },
  nameContainer: {
    flex: 1,
  },
  productName: {
    fontSize: Typography.sizes.sm + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  productLocalized: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  unitPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  unitText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
  },
  pricingCol: {
    flex: 1.5,
    paddingHorizontal: Spacing.sm,
  },
  priceInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priceField: {
    flex: 1,
  },
  priceFieldLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
    fontWeight: Typography.weights.semiBold,
  },
  priceInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    height: 36,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  sellingPriceInput: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  savePriceBtn: {
    marginTop: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  savePriceText: {
    color: Colors.textWhite,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  stockCol: {
    flex: 1.5,
    alignItems: 'center',
  },
  oneTapStockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: 14,
    gap: 8,
    minWidth: 160,
    minHeight: 48, // 48dp touch target
    ...Shadows.card,
  },
  stockBtnInStock: {
    backgroundColor: '#16A34A', // Vibrant Green
  },
  stockBtnOutOfStock: {
    backgroundColor: '#DC2626', // Vibrant Red
  },
  toggleIndicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotInStock: {
    backgroundColor: '#DCFCE7',
  },
  dotOutOfStock: {
    backgroundColor: '#FEE2E2',
  },
  stockBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.5,
  },
  stockTextInStock: {},
  stockTextOutOfStock: {},
  oneTapHint: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
