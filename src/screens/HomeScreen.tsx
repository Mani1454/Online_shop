import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Header } from '../components/Header';
import { PromoBanner, PromoItem } from '../components/PromoBanner';
import { CategoryGrid } from '../components/CategoryGrid';
import { ProductCard } from '../components/ProductCard';
import { FloatingCartBar } from '../components/FloatingCartBar';
import { Category, Product, CartItem, StoreConfig } from '../types/schema';
import { Colors, Typography, Spacing } from '../theme/colors';

// -----------------------------------------------------------------------------
// MOCK DATA: Seed Categories & Products for Local Kirana / General Store
// -----------------------------------------------------------------------------
const MOCK_STORE: StoreConfig = {
  id: 'store_001',
  storeName: 'Apna Kirana & Daily Needs',
  isStoreOpen: true,
  minOrderFreeDelivery: 150,
  standardDeliveryFee: 20,
  deliveryRadiusKm: 3.5,
  storeCoordinates: { latitude: 28.6139, longitude: 77.209 },
  upiVpa: 'apnakirana@okaxis',
  contactPhone: '+919876543210',
};

const MOCK_CATEGORIES: Category[] = [
  { id: 'groceries', name: 'Atta, Rice & Dal', nameLocalized: 'अनाज, आटा व दालें', iconName: 'wheat', displayOrder: 1, isActive: true },
  { id: 'dairy', name: 'Milk & Bread', nameLocalized: 'दूध, दही व ब्रेड', iconName: 'milk', displayOrder: 2, isActive: true },
  { id: 'oils-masalas', name: 'Oil & Spices', nameLocalized: 'तेल व मसाले', iconName: 'flame', displayOrder: 3, isActive: true },
  { id: 'snacks', name: 'Biscuits & Snacks', nameLocalized: 'नमकीन व बिस्कुट', iconName: 'cookie', displayOrder: 4, isActive: true },
  { id: 'beverages', name: 'Tea & Cold Drinks', nameLocalized: 'चाय व कोल्ड ड्रिंक्स', iconName: 'coffee', displayOrder: 5, isActive: true },
  { id: 'household', name: 'Cleaners & Soaps', nameLocalized: 'सफाई का सामान', iconName: 'spray-can', displayOrder: 6, isActive: true },
  { id: 'personal-care', name: 'Shampoo & Paste', nameLocalized: 'व्यक्तिगत देखभाल', iconName: 'heart-pulse', displayOrder: 7, isActive: true },
  { id: 'instant-food', name: 'Maggi & Noodles', nameLocalized: 'मैगी व नूडल्स', iconName: 'utensils', displayOrder: 8, isActive: true },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    categoryId: 'groceries',
    name: 'Aashirvaad Shudh Chakki Atta',
    nameLocalized: 'आशीर्वाद चक्की आटा',
    description: '100% whole wheat flour for soft, fluffy rotis',
    unit: '5 kg',
    mrp: 270,
    sellingPrice: 245,
    discountPercent: 9,
    isInStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
    tags: ['Daily Essential', 'Bestseller'],
    isActive: true,
  },
  {
    id: 'prod_2',
    categoryId: 'groceries',
    name: 'India Gate Basmati Rice Rozzana',
    nameLocalized: 'इंडिया गेट बासमती चावल',
    description: 'Aromatic long grain basmati rice',
    unit: '1 kg',
    mrp: 125,
    sellingPrice: 99,
    discountPercent: 21,
    isInStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
    tags: ['Daily Essential'],
    isActive: true,
  },
  {
    id: 'prod_3',
    categoryId: 'dairy',
    name: 'Amul Taaza Toned Fresh Milk',
    nameLocalized: 'अमुल ताज़ा दूध',
    description: 'Fresh pasteurized toned milk pouch',
    unit: '500 ml',
    mrp: 27,
    sellingPrice: 27,
    discountPercent: 0,
    isInStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
    tags: ['Daily Essential', 'Fresh'],
    isActive: true,
  },
  {
    id: 'prod_4',
    categoryId: 'dairy',
    name: 'Harvest Gold White Sandwich Bread',
    nameLocalized: 'सफेद ब्रेड',
    description: 'Soft baked bread for quick morning sandwiches',
    unit: '400 g',
    mrp: 45,
    sellingPrice: 42,
    discountPercent: 7,
    isInStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    tags: ['Breakfast'],
    isActive: true,
  },
  {
    id: 'prod_5',
    categoryId: 'instant-food',
    name: 'Maggi 2-Minute Masala Noodles',
    nameLocalized: 'मैगी मसाला नूडल्स',
    description: 'India’s favorite instant spiced noodles',
    unit: 'Pack of 4 (280g)',
    mrp: 60,
    sellingPrice: 54,
    discountPercent: 10,
    isInStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80',
    tags: ['Bestseller'],
    isActive: true,
  },
  {
    id: 'prod_6',
    categoryId: 'beverages',
    name: 'Tata Tea Gold Leaf Blend',
    nameLocalized: 'टाटा टी गोल्ड पत्ती चाय',
    description: 'Rich aroma tea leaves for authentic kadak chai',
    unit: '500 g',
    mrp: 320,
    sellingPrice: 275,
    discountPercent: 14,
    isInStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80',
    tags: ['Daily Essential'],
    isActive: true,
  },
  {
    id: 'prod_7',
    categoryId: 'household',
    name: 'Surf Excel Easy Wash Detergent Powder',
    nameLocalized: 'सर्फ एक्सेल पाउडर',
    description: 'Tough stain remover powder for bucket wash',
    unit: '1 kg',
    mrp: 145,
    sellingPrice: 128,
    discountPercent: 12,
    isInStock: false, // Out of stock demo
    imageUrl: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=400&q=80',
    tags: ['Cleaning'],
    isActive: true,
  },
];

interface HomeScreenProps {
  cart?: Record<string, CartItem>;
  onAddToCart?: (product: Product) => void;
  onIncrement?: (product: Product) => void;
  onDecrement?: (product: Product) => void;
  onViewCart?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  cart: externalCart,
  onAddToCart: externalAddToCart,
  onIncrement: externalIncrement,
  onDecrement: externalDecrement,
  onViewCart: externalViewCart,
}) => {
  // ---------------------------------------------------------------------------
  // State: Search, Selected Category & Local Cart Fallback
  // ---------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [localCart, setLocalCart] = useState<Record<string, CartItem>>({});

  const cart = externalCart !== undefined ? externalCart : localCart;
  const isExternalCart = externalCart !== undefined;

  // ---------------------------------------------------------------------------
  // Cart Actions
  // ---------------------------------------------------------------------------
  const handleAddToCart = (product: Product) => {
    if (externalAddToCart) {
      externalAddToCart(product);
      return;
    }
    setLocalCart((prev) => ({
      ...prev,
      [product.id]: { product, quantity: 1 },
    }));
  };

  const handleIncrement = (product: Product) => {
    if (externalIncrement) {
      externalIncrement(product);
      return;
    }
    setLocalCart((prev) => {
      const existing = prev[product.id];
      const newQty = (existing?.quantity || 0) + 1;
      return {
        ...prev,
        [product.id]: { product, quantity: newQty },
      };
    });
  };

  const handleDecrement = (product: Product) => {
    if (externalDecrement) {
      externalDecrement(product);
      return;
    }
    setLocalCart((prev) => {
      const existing = prev[product.id];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      }
      return {
        ...prev,
        [product.id]: { product, quantity: existing.quantity - 1 },
      };
    });
  };

  // ---------------------------------------------------------------------------
  // Calculations: Items count & Subtotal
  // ---------------------------------------------------------------------------
  const { totalItems, subtotal } = useMemo(() => {
    let items = 0;
    let sum = 0;
    Object.values(cart).forEach((item) => {
      items += item.quantity;
      sum += item.quantity * item.product.sellingPrice;
    });
    return { totalItems: items, subtotal: sum };
  }, [cart]);

  // ---------------------------------------------------------------------------
  // Filtered Products List
  // ---------------------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      // Category filter
      if (selectedCategoryId && product.categoryId !== selectedCategoryId) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesLocalized = product.nameLocalized?.toLowerCase().includes(q);
        const matchesTag = product.tags.some((t) => t.toLowerCase().includes(q));
        return matchesName || matchesLocalized || matchesTag;
      }
      return true;
    });
  }, [selectedCategoryId, searchQuery]);

  // ---------------------------------------------------------------------------
  // Category Selection Toggle
  // ---------------------------------------------------------------------------
  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId((prev) => (prev === catId ? null : catId));
  };

  const handlePromoPress = (promo: PromoItem) => {
    Alert.alert(promo.title, promo.subtitle);
  };

  const handleViewCart = () => {
    if (externalViewCart) {
      externalViewCart();
      return;
    }
    Alert.alert(
      'Proceed to Checkout',
      `You have ${totalItems} items worth ₹${subtotal}. Minimum ₹${MOCK_STORE.minOrderFreeDelivery} for free delivery!`,
      [
        { text: 'Keep Shopping', style: 'cancel' },
        { text: 'Checkout Now', onPress: () => {} },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Persistent Accessible Header */}
      <Header
        storeName={MOCK_STORE.storeName}
        isStoreOpen={MOCK_STORE.isStoreOpen}
        deliveryTimeEstimate="15-25 min"
        currentAddressLabel="Home"
        currentAddressSnippet="Flat 302, Green Valley Apts"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddressPress={() => Alert.alert('Select Delivery Address', 'Choose from saved addresses or add a new one')}
        onVoiceSearchPress={() => Alert.alert('Voice Search', 'Listening... Please speak the grocery item you need.')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContainer,
          totalItems > 0 && { paddingBottom: 110 }, // Space for floating cart
        ]}
      >
        {/* Promotional Offers Banner */}
        <PromoBanner onPromoPress={handlePromoPress} />

        {/* Categories Grid */}
        <CategoryGrid
          categories={MOCK_CATEGORIES}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleSelectCategory}
          onViewAllPress={() => setSelectedCategoryId(null)}
        />

        {/* Filter State Reset Banner */}
        {selectedCategoryId && (
          <View style={styles.activeFilterPill}>
            <Text style={styles.activeFilterText}>
              Showing category:{' '}
              <Text style={{ fontWeight: '700' }}>
                {MOCK_CATEGORIES.find((c) => c.id === selectedCategoryId)?.name}
              </Text>
            </Text>
            <TouchableOpacity onPress={() => setSelectedCategoryId(null)}>
              <Text style={styles.clearFilterText}>Show All ✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Product Section Header */}
        <View style={styles.productSectionHeader}>
          <Text style={styles.productSectionTitle}>
            {searchQuery
              ? `Results for "${searchQuery}" (${filteredProducts.length})`
              : selectedCategoryId
              ? 'Category Products'
              : 'Popular Daily Essentials'}
          </Text>
          <Text style={styles.productSectionSubtitle}>
            आसपास की दुकान से ताज़ा सामान
          </Text>
        </View>

        {/* Products Grid (2 columns) */}
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching with another term or browse another category.
            </Text>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantityInCart={cart[product.id]?.quantity || 0}
                onAddToCart={handleAddToCart}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onPressProduct={(p) =>
                  Alert.alert(p.name, `${p.description}\nUnit: ${p.unit}\nPrice: ₹${p.sellingPrice}`)
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      <FloatingCartBar
        itemCount={totalItems}
        subtotal={subtotal}
        freeDeliveryThreshold={MOCK_STORE.minOrderFreeDelivery}
        onViewCart={handleViewCart}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: 10,
    marginBottom: Spacing.sm,
  },
  activeFilterText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primaryDark,
  },
  clearFilterText: {
    fontSize: Typography.sizes.sm,
    color: Colors.danger,
    fontWeight: Typography.weights.bold,
  },
  productSectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  productSectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  productSectionSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
