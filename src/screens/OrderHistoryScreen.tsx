import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Order, OrderItem } from '../types/schema';
import { Colors, Typography, Spacing, Shadows } from '../theme/colors';

interface OrderHistoryScreenProps {
  orders: Order[];
  onReorder: (items: OrderItem[]) => void;
  onTrackOrder: (order: Order) => void;
  onBackToHome: () => void;
}

export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({
  orders,
  onReorder,
  onTrackOrder,
  onBackToHome,
}) => {
  // Sort chronological descending
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBackToHome}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to store"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Order History</Text>
          <Text style={styles.headerSubtitle}>पिछले ऑर्डर और रसीदें</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyEmoji}>📜</Text>
            </View>
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>
              You haven't placed any orders yet. Browse your local store essentials and place your first order!
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={onBackToHome}
              activeOpacity={0.85}
            >
              <Text style={styles.browseButtonText}>Browse Store / सामान चुनें</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sortedOrders.map((ord) => {
            const isDelivered = ord.status === 'DELIVERED';
            const isLive =
              ord.status === 'RECEIVED' ||
              ord.status === 'PREPARING' ||
              ord.status === 'OUT_FOR_DELIVERY';

            const formattedDate = new Date(ord.createdAt).toLocaleDateString(
              'en-IN',
              {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }
            );

            return (
              <View key={ord.id} style={styles.orderCard}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderIdText}>{ord.id}</Text>
                    <Text style={styles.dateText}>{formattedDate}</Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      isDelivered && styles.statusDelivered,
                      isLive && styles.statusLive,
                      ord.status === 'CANCELLED' && styles.statusCancelled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isDelivered && styles.statusTextDelivered,
                        isLive && styles.statusTextLive,
                        ord.status === 'CANCELLED' && styles.statusTextCancelled,
                      ]}
                    >
                      {isDelivered
                        ? 'Delivered ✓'
                        : isLive
                        ? '● In Progress'
                        : 'Cancelled'}
                    </Text>
                  </View>
                </View>

                {/* Items Summary Snippet */}
                <View style={styles.itemsBox}>
                  <Text style={styles.itemsSummaryLine} numberOfLines={2}>
                    {ord.items
                      .map((it) => `${it.productName} (x${it.quantity})`)
                      .join(' • ')}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.totalItemsCount}>
                      {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                    </Text>
                    <View style={styles.finalTotalGroup}>
                      <Text style={styles.paymentMethodLabel}>
                        {ord.paymentMethod === 'COD' ? '💵 COD' : '⚡ UPI'}
                      </Text>
                      <Text style={styles.finalTotalValue}>₹{ord.finalTotal}</Text>
                    </View>
                  </View>
                </View>

                {/* Card Actions */}
                <View style={styles.cardActionsRow}>
                  {/* Track Live button if still in progress */}
                  {isLive && (
                    <TouchableOpacity
                      style={styles.trackBtn}
                      onPress={() => onTrackOrder(ord)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`Track live delivery for ${ord.id}`}
                    >
                      <Text style={styles.trackBtnText}>Track Delivery 🛵</Text>
                    </TouchableOpacity>
                  )}

                  {/* One-Tap Reorder Button */}
                  <TouchableOpacity
                    style={[
                      styles.reorderBtn,
                      isLive && styles.reorderBtnSecondary,
                    ]}
                    onPress={() => onReorder(ord.items)}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel={`Reorder items from ${ord.id}`}
                  >
                    <Text
                      style={[
                        styles.reorderBtnText,
                        isLive && styles.reorderBtnTextSecondary,
                      ]}
                    >
                      🔄 Reorder All Items
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  orderIdText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDelivered: {
    backgroundColor: '#DCFCE7',
  },
  statusLive: {
    backgroundColor: '#FEF3C7',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  statusTextDelivered: {
    color: '#15803D',
  },
  statusTextLive: {
    color: '#B45309',
  },
  statusTextCancelled: {
    color: Colors.danger,
  },
  itemsBox: {
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.md,
    borderRadius: 12,
    marginVertical: Spacing.xs,
  },
  itemsSummaryLine: {
    fontSize: Typography.sizes.xs + 1,
    color: Colors.textPrimary,
    lineHeight: 18,
    fontWeight: Typography.weights.medium,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  totalItemsCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  finalTotalGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
  },
  finalTotalValue: {
    fontSize: Typography.sizes.md + 1,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  trackBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...Shadows.card,
  },
  trackBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  reorderBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...Shadows.card,
  },
  reorderBtnSecondary: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reorderBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  reorderBtnTextSecondary: {
    color: Colors.textPrimary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xxl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyEmoji: {
    fontSize: 38,
  },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.xl,
    lineHeight: 20,
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
