import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Colors, Typography, Spacing, Shadows } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

export interface PromoItem {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  badgeColor: string;
  bgColor: string;
  accentIcon: string;
  actionLabel?: string;
  onPress?: () => void;
}

const DEFAULT_PROMOS: PromoItem[] = [
  {
    id: 'promo-1',
    tag: 'NEIGHBORHOOD SPECIAL',
    title: 'FREE Delivery on ₹150+',
    subtitle: 'Delivered to your doorstep in 15-20 minutes with zero hassle',
    badgeColor: Colors.primaryDark,
    bgColor: '#ECFDF5', // Soft green background
    accentIcon: '🛵',
    actionLabel: 'Shop Now',
  },
  {
    id: 'promo-2',
    tag: 'DAILY STAPLE DISCOUNT',
    title: 'Flat 10% OFF on Atta & Dal',
    subtitle: 'Stock up your kitchen with fresh, unadulterated essentials',
    badgeColor: '#9A3412',
    bgColor: '#FFF7ED', // Soft orange background
    accentIcon: '🌾',
    actionLabel: 'Explore',
  },
  {
    id: 'promo-3',
    tag: 'LOCAL HELP & SUPPORT',
    title: 'Direct Call / WhatsApp Order',
    subtitle: 'Prefer writing a list? Send your photo or list straight to Sharma ji',
    badgeColor: '#1E40AF',
    bgColor: '#EFF6FF', // Soft blue background
    accentIcon: '📞',
    actionLabel: 'Call Shop',
  },
];

interface PromoBannerProps {
  promos?: PromoItem[];
  onPromoPress?: (promo: PromoItem) => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({
  promos = DEFAULT_PROMOS,
  onPromoPress,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
    if (slide !== activeIndex && slide >= 0 && slide < promos.length) {
      setActiveIndex(slide);
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH + Spacing.md}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
      >
        {promos.map((promo) => (
          <TouchableOpacity
            key={promo.id}
            style={[styles.bannerCard, { backgroundColor: promo.bgColor }]}
            activeOpacity={0.85}
            onPress={() => (promo.onPress ? promo.onPress() : onPromoPress?.(promo))}
            accessibilityRole="button"
            accessibilityLabel={`${promo.title}, ${promo.subtitle}`}
          >
            <View style={styles.cardContent}>
              <View style={styles.textContainer}>
                <View style={[styles.badge, { backgroundColor: promo.badgeColor }]}>
                  <Text style={styles.badgeText}>{promo.tag}</Text>
                </View>
                <Text style={styles.title} numberOfLines={1}>
                  {promo.title}
                </Text>
                <Text style={styles.subtitle} numberOfLines={2}>
                  {promo.subtitle}
                </Text>
              </View>

              <View style={styles.iconContainer}>
                <Text style={styles.emojiIcon}>{promo.accentIcon}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Indicators */}
      <View style={styles.pagination}>
        {promos.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  bannerCard: {
    width: BANNER_WIDTH,
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Shadows.card,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: Spacing.xs,
  },
  badgeText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiIcon: {
    fontSize: 32,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 20,
    backgroundColor: Colors.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: Colors.divider,
  },
});
