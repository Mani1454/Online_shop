import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { Product } from '../../types/schema';
import { Colors, Typography, Spacing, Shadows, TouchTargets } from '../../theme/colors';
import { AddProductModal } from './AddProductModal';
import { storageService } from '../../services/StorageService';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { productsCol, isFirebaseConfigured } from '../../services/firebaseConfig';
import { analyticsService } from '../../services/AnalyticsService';
import { crashlyticsService } from '../../services/CrashlyticsService';

const INITIAL_INVENTORY_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    categoryId: 'groceries',
    name: 'Aashirvaad Shudh Chakki Atta',
    nameLocalized: 'आशीर्वाद चक्की आटा',
    description: '100% whole wheat flour for soft rotis',
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
    tags: ['Daily Essential'],
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
    unit: 'Pack of 4',
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
    isInStock: false,
    imageUrl: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=400&q=80',
    tags: ['Cleaning'],
    isActive: true,
  },
];

export const InventoryScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_INVENTORY_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editMrp, setEditMrp] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Self-serve Product Addition with Firebase Storage & Firestore Sync
  const handleAddProduct = async (
    newProductData: Omit<Product, 'id' | 'discountPercent'>,
    imageSource: File | Blob | string
  ) => {
    const newId = `prod_${Date.now()}`;

    // 1. Upload & compress image via StorageService
    const { downloadUrl } = await storageService.uploadProductImage(imageSource, newId);

    const discountAmount =
      newProductData.mrp > newProductData.sellingPrice
        ? newProductData.mrp - newProductData.sellingPrice
        : 0;
    const discountPercent =
      newProductData.mrp > 0 ? Math.round((discountAmount / newProductData.mrp) * 100) : 0;

    const fullProduct: Product = {
      ...newProductData,
      id: newId,
      imageUrl: downloadUrl,
      discountPercent,
    };

    // 2. Database mutation: Firestore write
    if (isFirebaseConfigured()) {
      try {
        const productDocRef = doc(productsCol, newId);
        await setDoc(productDocRef, {
          product_id: newId,
          category: fullProduct.categoryId,
          name: fullProduct.name,
          name_localized: fullProduct.nameLocalized || fullProduct.name,
          mrp: fullProduct.mrp,
          selling_price: fullProduct.sellingPrice,
          unit_size: fullProduct.unit,
          image_url: fullProduct.imageUrl,
          is_in_stock: fullProduct.isInStock,
          created_at: Timestamp.now(),
        });
        console.log(`[Inventory] Product created in Firestore: ${newId}`);
      } catch (err: any) {
        console.error('[Inventory] Firestore product creation error:', err);
        crashlyticsService.recordError(err, false, { context: 'handleAddProduct', productId: newId });
      }
    }

    // 3. Optimistic local state update (prepend to top)
    setProducts((prev) => [fullProduct, ...prev]);

    // 4. Dispatch Telemetry
    analyticsService.logProductViewed({
      productId: fullProduct.id,
      category: fullProduct.categoryId,
      isInStock: fullProduct.isInStock,
    });
    crashlyticsService.logBreadcrumb(
      'inventory',
      `Product added: ${fullProduct.name} (${fullProduct.unit} @ ₹${fullProduct.sellingPrice})`
    );

    // 5. Success Toast
    setSuccessToast(`✅ "${fullProduct.name}" added to live store catalog!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // 1-Tap Single Click Stock Toggle (No confirmation popup, instant update!)
  const handleToggleStock = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return { ...p, isInStock: !p.isInStock };
        }
        return p;
      })
    );
  };

  const openQuickEdit = (product: Product) => {
    setEditingProduct(product);
    setEditMrp(product.mrp.toString());
    setEditSellingPrice(product.sellingPrice.toString());
  };

  const handleSavePrice = () => {
    if (!editingProduct) return;

    const mrpNum = parseFloat(editMrp);
    const sellingNum = parseFloat(editSellingPrice);

    if (isNaN(sellingNum) || sellingNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid selling price.');
      return;
    }

    const finalMrp = isNaN(mrpNum) || mrpNum < sellingNum ? sellingNum : mrpNum;
    const discount = Math.round(((finalMrp - sellingNum) / finalMrp) * 100);

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            mrp: finalMrp,
            sellingPrice: sellingNum,
            discountPercent: discount,
          };
        }
        return p;
      })
    );

    setEditingProduct(null);
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nameLocalized?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Real-time Success Notification Toast */}
      {successToast && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{successToast}</Text>
        </View>
      )}

      {/* Top Search & Stats Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Fast Search by product name or Hindi keyword..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Total Products:</Text>
            <Text style={styles.statVal}>{products.length}</Text>
          </View>
          <View style={[styles.statPill, styles.statOut]}>
            <Text style={styles.statLabel}>Out of Stock:</Text>
            <Text style={[styles.statVal, styles.statValOut]}>
              {products.filter((p) => !p.isInStock).length}
            </Text>
          </View>

          {/* Self-Serve Add Product Action Button (≥48dp) */}
          <TouchableOpacity
            style={styles.addProductBtn}
            onPress={() => setIsAddModalOpen(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Add New Product"
          >
            <Text style={styles.addProductBtnText}>➕ Add Product (नया सामान)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Product List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tableHeader}>
          <Text style={styles.thName}>Product</Text>
          <Text style={styles.thUnit}>Unit</Text>
          <Text style={styles.thPrice}>Pricing (MRP / Selling)</Text>
          <Text style={styles.thStock}>1-Tap Stock Switch</Text>
        </View>

        {filtered.map((prod) => (
          <View
            key={prod.id}
            style={[
              styles.productRow,
              !prod.isInStock && styles.productRowOutOfStock,
            ]}
          >
            {/* Details */}
            <View style={styles.colProduct}>
              <Image
                source={{ uri: prod.imageUrl }}
                style={styles.productThumb}
                resizeMode="cover"
              />
              <View style={styles.nameGroup}>
                <Text style={styles.nameText}>{prod.name}</Text>
                {prod.nameLocalized && (
                  <Text style={styles.localizedText}>{prod.nameLocalized}</Text>
                )}
              </View>
            </View>

            {/* Unit */}
            <View style={styles.colUnit}>
              <View style={styles.unitBadge}>
                <Text style={styles.unitBadgeText}>{prod.unit}</Text>
              </View>
            </View>

            {/* Pricing & Quick Edit Button */}
            <View style={styles.colPricing}>
              <View style={styles.pricesDisplay}>
                <Text style={styles.sellingPriceText}>₹{prod.sellingPrice}</Text>
                <Text style={styles.mrpText}>₹{prod.mrp}</Text>
                {prod.discountPercent > 0 && (
                  <View style={styles.discountPill}>
                    <Text style={styles.discountPillText}>
                      {prod.discountPercent}% OFF
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.quickEditBtn}
                onPress={() => openQuickEdit(prod)}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.quickEditBtnText}>✏️ Edit Price</Text>
              </TouchableOpacity>
            </View>

            {/* Massive 1-Tap Stock Toggle (Single click, zero modal delays) */}
            <View style={styles.colStock}>
              <TouchableOpacity
                style={[
                  styles.massiveStockBtn,
                  prod.isInStock
                    ? styles.massiveBtnInStock
                    : styles.massiveBtnOutOfStock,
                ]}
                onPress={() => handleToggleStock(prod.id)}
                activeOpacity={0.8}
                accessibilityRole="switch"
                accessibilityState={{ checked: prod.isInStock }}
                accessibilityLabel={`Stock switch for ${prod.name}`}
              >
                <View
                  style={[
                    styles.bulbIndicator,
                    prod.isInStock ? styles.bulbInStock : styles.bulbOutOfStock,
                  ]}
                />
                <Text style={styles.massiveStockBtnText}>
                  {prod.isInStock ? 'IN STOCK ✓' : 'OUT OF STOCK ✕'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.touchHint}>1 tap to toggle</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Simple Quick Edit Price Modal */}
      <Modal
        visible={!!editingProduct}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingProduct(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.quickEditModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Pricing</Text>
              <TouchableOpacity
                onPress={() => setEditingProduct(null)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {editingProduct && (
              <Text style={styles.modalProdName} numberOfLines={2}>
                {editingProduct.name} ({editingProduct.unit})
              </Text>
            )}

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MRP (₹)</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={editMrp}
                  onChangeText={setEditMrp}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Selling Price (₹) *</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputSelling]}
                  keyboardType="numeric"
                  value={editSellingPrice}
                  onChangeText={setEditSellingPrice}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditingProduct(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSavePrice}
              >
                <Text style={styles.modalSaveText}>Save Price ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Self-Serve Add Product Modal (Firebase Storage & Firestore) */}
      <AddProductModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleAddProduct}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    height: 48,
    minWidth: 320,
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
  clearText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: Typography.weights.bold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  statOut: {
    backgroundColor: '#FEE2E2',
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semiBold,
  },
  statVal: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  statValOut: {
    color: Colors.danger,
  },
  listContent: {
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
  thName: {
    flex: 2.5,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
  },
  thUnit: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
  },
  thPrice: {
    flex: 2,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
  },
  thStock: {
    flex: 2,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  productRow: {
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
  productRowOutOfStock: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  colProduct: {
    flex: 2.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
  },
  nameGroup: {
    flex: 1,
  },
  nameText: {
    fontSize: Typography.sizes.sm + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  localizedText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  colUnit: {
    flex: 1,
  },
  unitBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceSecondary,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  unitBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  colPricing: {
    flex: 2,
    paddingHorizontal: Spacing.sm,
  },
  pricesDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  sellingPriceText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  mrpText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  discountPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  discountPillText: {
    fontSize: 10,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  quickEditBtn: {
    alignSelf: 'flex-start',
  },
  quickEditBtnText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: Typography.weights.bold,
  },
  colStock: {
    flex: 2,
    alignItems: 'center',
  },
  massiveStockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52, // Massive touch target
    minWidth: 170,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    gap: 8,
    ...Shadows.card,
  },
  massiveBtnInStock: {
    backgroundColor: '#16A34A', // Vibrant Green
  },
  massiveBtnOutOfStock: {
    backgroundColor: '#DC2626', // Urgent Red
  },
  bulbIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bulbInStock: {
    backgroundColor: '#DCFCE7',
  },
  bulbOutOfStock: {
    backgroundColor: '#FEE2E2',
  },
  massiveStockBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.5,
  },
  touchHint: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  quickEditModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: Spacing.xl,
    ...Shadows.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
  },
  modalProdName: {
    fontSize: Typography.sizes.sm + 1,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  modalInputSelling: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    ...Shadows.card,
  },
  modalSaveText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textWhite,
  },
  addProductBtn: {
    height: TouchTargets.minHeight, // ≥48dp
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  addProductBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: Typography.sizes.sm,
  },
  toastBanner: {
    backgroundColor: '#064E3B',
    borderBottomWidth: 1,
    borderBottomColor: '#10B981',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  toastText: {
    color: '#A7F3D0',
    fontWeight: '800',
    fontSize: Typography.sizes.sm,
  },
});
