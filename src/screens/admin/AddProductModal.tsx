import React, { useState, useId } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Product } from '../../types/schema';
import { Colors, Typography, Spacing, Shadows, TouchTargets } from '../../theme/colors';
import { KIRANA_PHOTO_PRESETS, ProductPhotoPreset } from '../../services/StorageService';

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onAddProduct: (
    newProduct: Omit<Product, 'id' | 'discountPercent'>,
    imageSource: File | Blob | string
  ) => Promise<void>;
}

const CATEGORIES = [
  { id: 'groceries', label: 'Atta, Rice & Dal', labelHi: 'अनाज व दाल', icon: '🌾' },
  { id: 'dairy', label: 'Milk & Bread', labelHi: 'दूध व ब्रेड', icon: '🥛' },
  { id: 'instant-food', label: 'Instant Food', labelHi: 'मैगी व नूडल्स', icon: '🍜' },
  { id: 'beverages', label: 'Tea & Coffee', labelHi: 'चाय व कॉफ़ी', icon: '☕' },
  { id: 'household', label: 'Cleaning & Detergent', labelHi: 'सफाई व साबुन', icon: '🧼' },
  { id: 'snacks', label: 'Biscuits & Snacks', labelHi: 'बिस्कुट व नमकीन', icon: '🍪' },
];

const UNIT_PRESETS = ['1 kg', '500 g', '250 g', '5 kg', '1 L', '500 ml', 'Pack of 4', '1 pc'];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  visible,
  onClose,
  onAddProduct,
}) => {
  // Form State
  const [name, setName] = useState('');
  const [nameLocalized, setNameLocalized] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [unit, setUnit] = useState('1 kg');
  const [mrp, setMrp] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isInStock, setIsInStock] = useState(true);

  // Image upload & Preset selection state
  const [selectedImageSource, setSelectedImageSource] = useState<File | Blob | string>(
    KIRANA_PHOTO_PRESETS[0].url
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>(KIRANA_PHOTO_PRESETS[0].id);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>(KIRANA_PHOTO_PRESETS[0].url);
  const [imageFileName, setImageFileName] = useState<string>('');

  // Loading & Error States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const fileInputId = useId();

  // Price & Discount Calculation
  const mrpNum = parseFloat(mrp) || 0;
  const sellingNum = parseFloat(sellingPrice) || 0;
  const discountAmount = mrpNum > sellingNum && sellingNum > 0 ? mrpNum - sellingNum : 0;
  const discountPercent = mrpNum > 0 && discountAmount > 0 ? Math.round((discountAmount / mrpNum) * 100) : 0;

  // Handle image file selection (Web / Native)
  const handleFileChange = (e: any) => {
    const file = e.target?.files?.[0];
    if (file) {
      setSelectedImageSource(file);
      setSelectedPresetId('');
      setImageFileName(file.name);
      const localUrl = URL.createObjectURL(file);
      setImagePreviewUrl(localUrl);
    }
  };

  const handleSelectPreset = (preset: ProductPhotoPreset) => {
    setSelectedImageSource(preset.url);
    setSelectedPresetId(preset.id);
    setImagePreviewUrl(preset.url);
    setImageFileName('');
    if (!nameLocalized && preset.labelLocalized) {
      setNameLocalized(preset.labelLocalized);
    }
  };

  const resetForm = () => {
    setName('');
    setNameLocalized('');
    setCategory(CATEGORIES[0].id);
    setUnit('1 kg');
    setMrp('');
    setSellingPrice('');
    setDescription('');
    setIsInStock(true);
    setSelectedImageSource(KIRANA_PHOTO_PRESETS[0].url);
    setSelectedPresetId(KIRANA_PHOTO_PRESETS[0].id);
    setImagePreviewUrl(KIRANA_PHOTO_PRESETS[0].url);
    setImageFileName('');
    setValidationError('');
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    setValidationError('');

    if (!name.trim()) {
      setValidationError('Please enter a product name in English.');
      return;
    }

    if (!unit.trim()) {
      setValidationError('Please specify a unit size (e.g. 1 kg, 500 ml).');
      return;
    }

    if (sellingNum <= 0) {
      setValidationError('Please enter a valid selling price greater than ₹0.');
      return;
    }

    const finalMrp = mrpNum >= sellingNum ? mrpNum : sellingNum;

    try {
      setIsSubmitting(true);

      const newProductPayload: Omit<Product, 'id' | 'discountPercent'> = {
        categoryId: category,
        name: name.trim(),
        nameLocalized: nameLocalized.trim() || undefined,
        description: description.trim() || `${name.trim()} (${unit})`,
        unit: unit.trim(),
        mrp: finalMrp,
        sellingPrice: sellingNum,
        isInStock,
        imageUrl: imagePreviewUrl,
        tags: ['New Arrival'],
        isActive: true,
      };

      await onAddProduct(newProductPayload, selectedImageSource);
      resetForm();
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>➕ Add New Product</Text>
              <Text style={styles.headerSubtitle}>नया सामान स्टोर कैटलॉग में जोड़ें</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close Modal"
              disabled={isSubmitting}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body Form */}
          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {validationError.length > 0 && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>⚠️ {validationError}</Text>
              </View>
            )}

            {/* 1. English Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Product Name (English) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Tata Salt Vacuum Evaporated"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
                editable={!isSubmitting}
              />
            </View>

            {/* 2. Hindi / Local Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Product Name (Hindi / Local) <Text style={styles.optional}>(वैकल्पिक)</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="उदा., टाटा नमक आयोडीन"
                placeholderTextColor={Colors.textMuted}
                value={nameLocalized}
                onChangeText={setNameLocalized}
                editable={!isSubmitting}
              />
            </View>

            {/* 3. Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Category (श्रेणी) <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.chipsRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                      onPress={() => setCategory(cat.id)}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.chipIcon}>{cat.icon}</Text>
                      <View>
                        <Text
                          style={[
                            styles.categoryChipText,
                            isSelected && styles.categoryChipTextActive,
                          ]}
                        >
                          {cat.label}
                        </Text>
                        <Text
                          style={[
                            styles.categoryChipSubtext,
                            isSelected && styles.categoryChipSubtextActive,
                          ]}
                        >
                          {cat.labelHi}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Unit Size */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Unit Size (वजन या मात्रा) <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.unitPresetsRow}>
                {UNIT_PRESETS.map((u) => {
                  const isSelected = unit === u;
                  return (
                    <TouchableOpacity
                      key={u}
                      style={[styles.unitChip, isSelected && styles.unitChipActive]}
                      onPress={() => setUnit(u)}
                      disabled={isSubmitting}
                    >
                      <Text
                        style={[
                          styles.unitChipText,
                          isSelected && styles.unitChipTextActive,
                        ]}
                      >
                        {u}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                style={[styles.textInput, { marginTop: 8 }]}
                placeholder="Or custom unit: e.g., 200 ml, Pack of 6"
                placeholderTextColor={Colors.textMuted}
                value={unit}
                onChangeText={setUnit}
                editable={!isSubmitting}
              />
            </View>

            {/* 5. Pricing: MRP & Selling Price */}
            <View style={styles.pricingRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>MRP (₹)</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="₹ MRP"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={mrp}
                  onChangeText={setMrp}
                  editable={!isSubmitting}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Selling Price (₹) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.priceInput, styles.sellingPriceInput]}
                  placeholder="₹ Offer Price"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Discount Preview Pill */}
            {discountAmount > 0 && (
              <View style={styles.discountPill}>
                <Text style={styles.discountPillText}>
                  🎉 Customer Saves ₹{discountAmount} ({discountPercent}% OFF)
                </Text>
              </View>
            )}

            {/* 6. Product Image Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Product Photo (फोटो अपलोड या चुने) <Text style={styles.required}>*</Text>
              </Text>

              {/* Image Preview & Upload Button */}
              <View style={styles.imageUploadContainer}>
                <Image
                  source={{ uri: imagePreviewUrl }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />

                <View style={styles.imageUploadRight}>
                  <Text style={styles.imageUploadTitle}>
                    {imageFileName ? `📷 ${imageFileName}` : '⚡ High-Quality Photo'}
                  </Text>
                  <Text style={styles.imageUploadSubtitle}>
                    Automatic client compression to ~80KB saves mobile data on 3G/4G tablets.
                  </Text>

                  {/* Web Native File Input Button */}
                  {Platform.OS === 'web' && (
                    <div>
                      <input
                        id={fileInputId}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                      />
                      <label
                        htmlFor={fileInputId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#1E293B',
                          color: '#38BDF8',
                          border: '1px solid #0284C7',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          fontWeight: '700',
                          fontSize: '13px',
                        }}
                      >
                        📸 Take Photo or Upload File
                      </label>
                    </div>
                  )}
                </View>
              </View>

              {/* Quick Kirana Photo Presets */}
              <Text style={styles.presetsLabel}>
                Or pick from popular grocery photo presets (तेज़ चुनाव):
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsScroll}
              >
                {KIRANA_PHOTO_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      style={[styles.presetCard, isSelected && styles.presetCardActive]}
                      onPress={() => handleSelectPreset(preset)}
                      disabled={isSubmitting}
                    >
                      <Image
                        source={{ uri: preset.url }}
                        style={styles.presetThumb}
                        resizeMode="cover"
                      />
                      <Text
                        style={[
                          styles.presetCardText,
                          isSelected && styles.presetCardTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 7. Stock Status Toggle */}
            <View style={styles.stockToggleContainer}>
              <View>
                <Text style={styles.stockToggleTitle}>Initial Stock Availability</Text>
                <Text style={styles.stockToggleSubtitle}>
                  {isInStock ? '✅ Item will be live and ready for customers' : '⚠️ Mark Out of Stock'}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.stockSwitch,
                  isInStock ? styles.stockSwitchOn : styles.stockSwitchOff,
                ]}
                onPress={() => setIsInStock(!isInStock)}
                disabled={isSubmitting}
              >
                <Text style={styles.stockSwitchText}>
                  {isInStock ? 'IN STOCK' : 'OUT OF STOCK'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel (रद्द करें)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                isSubmitting && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              {isSubmitting ? (
                <View style={styles.submittingContent}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Compressing & Saving...</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>✨ Add to Store Catalog (स्टोर में जोड़ें)</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '92%',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    ...Shadows.floating,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#1E293B',
  },
  headerTitle: {
    ...Typography.titleLarge,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#F8FAFC',
    fontWeight: '700',
  },
  formScroll: {
    padding: Spacing.xl,
    flex: 1,
  },
  errorBanner: {
    backgroundColor: '#451A1A',
    borderColor: '#DC2626',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorBannerText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodyMedium,
    color: '#E2E8F0',
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  required: {
    color: '#EF4444',
  },
  optional: {
    color: '#64748B',
    fontWeight: '400',
  },
  textInput: {
    height: TouchTargets.minHeight, // ≥48dp touch target
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#F8FAFC',
    fontSize: 15,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChipActive: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  chipIcon: {
    fontSize: 18,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  categoryChipSubtext: {
    fontSize: 11,
    color: '#64748B',
  },
  categoryChipSubtextActive: {
    color: '#A7F3D0',
  },
  unitPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  unitChip: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unitChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  unitChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  unitChipTextActive: {
    color: '#FFFFFF',
  },
  pricingRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  priceInput: {
    height: TouchTargets.minHeight, // ≥48dp
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  sellingPriceInput: {
    borderColor: '#059669',
    backgroundColor: '#064E3B22',
    color: '#34D399',
  },
  discountPill: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
  },
  discountPillText: {
    color: '#A7F3D0',
    fontWeight: '800',
    fontSize: 13,
  },
  imageUploadContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  imagePreview: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#475569',
  },
  imageUploadRight: {
    flex: 1,
    gap: 6,
  },
  imageUploadTitle: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
  },
  imageUploadSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  presetsLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  presetsScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  presetCard: {
    width: 110,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    gap: 4,
  },
  presetCardActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0C4A6E',
  },
  presetThumb: {
    width: 98,
    height: 60,
    borderRadius: 8,
  },
  presetCardText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
    textAlign: 'center',
  },
  presetCardTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  stockToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  stockToggleTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  stockToggleSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  stockSwitch: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  stockSwitchOn: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
    borderWidth: 1,
  },
  stockSwitchOff: {
    backgroundColor: '#451A1A',
    borderColor: '#DC2626',
    borderWidth: 1,
  },
  stockSwitchText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#1E293B',
  },
  cancelBtn: {
    height: TouchTargets.minHeight, // ≥48dp
    paddingHorizontal: Spacing.xl,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  cancelBtnText: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 14,
  },
  submitBtn: {
    height: TouchTargets.minHeight, // ≥48dp
    paddingHorizontal: Spacing.xxl,
    borderRadius: 14,
    backgroundColor: Colors.brandPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  submittingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default AddProductModal;
