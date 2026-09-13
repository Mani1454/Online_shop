import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Category } from '../types/schema';
import { Colors, Typography, Spacing, Shadows } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = Spacing.lg * 2;
const GRID_GAP = Spacing.md;
// 4 columns on mobile
const ITEM_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING - GRID_GAP * 3) / 4;

// Accessible category visual configurations
const CATEGORY_STYLE_MAP: Record<
  string,
  { emoji: string; bgLight: string; borderColor: string }
> = {
  groceries: { emoji: '🌾', bgLight: '#FEF3C7', borderColor: '#F59E0B' },
  dairy: { emoji: '🥛', bgLight: '#E0F2FE', borderColor: '#38BDF8' },
  'oils-masalas': { emoji: '🌶️', bgLight: '#FEE2E2', borderColor: '#F87171' },
  snacks: { emoji: '🍪', bgLight: '#FFEDD5', borderColor: '#FB923C' },
  beverages: { emoji: '☕', bgLight: '#DCFCE7', borderColor: '#4ADE80' },
  household: { emoji: '🧼', bgLight: '#F3E8FF', borderColor: '#C084FC' },
  'personal-care': { emoji: '🧴', bgLight: '#FCE7F3', borderColor: '#F472B6' },
  'instant-food': { emoji: '🍜', bgLight: '#FEF9C3', borderColor: '#FACC15' },
};

interface CategoryGridProps {
  categories: Category[];
  selectedCategoryId?: string | null;
  onSelectCategory: (categoryId: string) => void;
  onViewAllPress?: () => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onViewAllPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <Text style={styles.sectionSubtitle}>कैटेगरी अनुसार सामान चुनें</Text>
        </View>

        {onViewAllPress && (
          <TouchableOpacity
            onPress={onViewAllPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="View all categories"
          >
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Grid Container */}
      <View style={styles.gridContainer}>
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          const styleConfig = CATEGORY_STYLE_MAP[category.id] || {
            emoji: '🛒',
            bgLight: '#F1F5F9',
            borderColor: '#CBD5E1',
          };

          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                { width: ITEM_WIDTH },
                isSelected && styles.categoryCardSelected,
              ]}
              onPress={() => onSelectCategory(category.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${category.name}, ${category.nameLocalized || ''}. ${
                isSelected ? 'Currently selected' : 'Tap to filter'
              }`}
              accessibilityState={{ selected: isSelected }}
            >
              {/* Icon Container with soft pastel tint */}
              <View
                style={[
                  styles.iconTile,
                  { backgroundColor: styleConfig.bgLight },
                  isSelected && {
                    borderColor: Colors.primary,
                    borderWidth: 2,
                  },
                ]}
              >
                <Text style={styles.categoryEmoji}>{styleConfig.emoji}</Text>
              </View>

              {/* Bilingual Accessible Typography */}
              <Text
                style={[
                  styles.categoryName,
                  isSelected && styles.categoryNameSelected,
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {category.name}
              </Text>

              {Boolean(category.nameLocalized) && (
                <Text
                  style={styles.categoryLocalized}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {category.nameLocalized}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: Typography.weights.medium,
  },
  viewAllText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.lg,
  },
  categoryCard: {
    alignItems: 'center',
  },
  categoryCardSelected: {
    transform: [{ scale: 1.04 }],
  },
  iconTile: {
    width: ITEM_WIDTH - 6,
    height: ITEM_WIDTH - 6,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Shadows.card,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    marginTop: Spacing.xs + 2,
    fontSize: Typography.sizes.xs + 1,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 15,
  },
  categoryNameSelected: {
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },
  categoryLocalized: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 1,
  },
});
