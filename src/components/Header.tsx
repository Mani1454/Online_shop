import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Shadows } from '../theme/colors';

interface HeaderProps {
  storeName: string;
  isStoreOpen: boolean;
  deliveryTimeEstimate?: string;
  currentAddressLabel?: string;
  currentAddressSnippet?: string;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onAddressPress?: () => void;
  onVoiceSearchPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  storeName,
  isStoreOpen,
  deliveryTimeEstimate = '~1 hr',
  currentAddressLabel = 'Home',
  currentAddressSnippet = 'Sitamarhi, Bihar',
  searchQuery,
  onSearchChange,
  onAddressPress,
  onVoiceSearchPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Row: Store Badge & Delivery Location */}
      <View style={styles.topRow}>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName} numberOfLines={1}>
            {storeName}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: isStoreOpen ? Colors.success : Colors.danger },
              ]}
            />
            <Text style={styles.statusText}>
              {isStoreOpen ? `Open • Delivery in ${deliveryTimeEstimate}` : 'Currently Closed'}
            </Text>
          </View>
        </View>

        {/* Deliver to address selector */}
        <TouchableOpacity
          style={styles.addressPill}
          onPress={onAddressPress}
          activeOpacity={0.7}
          accessibilityLabel={`Delivering to ${currentAddressLabel}, ${currentAddressSnippet}. Double tap to change.`}
          accessibilityRole="button"
        >
          <Text style={styles.addressTitle}>Deliver to: {currentAddressLabel} ▾</Text>
          <Text style={styles.addressSnippet} numberOfLines={1}>
            {currentAddressSnippet}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Global Accessible Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search atta, dal, milk, soap, biscuits..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search products in local store"
            accessibilityHint="Type to filter groceries by name or brand"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              style={styles.clearBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Voice Search Button (Great for elderly shoppers) */}
        <TouchableOpacity
          style={styles.voiceButton}
          onPress={onVoiceSearchPress}
          activeOpacity={0.8}
          accessibilityLabel="Search with voice"
          accessibilityRole="button"
        >
          <Text style={styles.voiceIcon}>🎙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  storeInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  storeName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textWhite,
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryLight,
    fontWeight: Typography.weights.medium,
  },
  addressPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    maxWidth: 160,
  },
  addressTitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textWhite,
    fontWeight: Typography.weights.bold,
  },
  addressSnippet: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.primaryLight,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    height: 48, // Accessible touch target
    ...Shadows.card,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  clearBtnText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: Typography.weights.bold,
  },
  voiceButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  voiceIcon: {
    fontSize: 20,
  },
});
