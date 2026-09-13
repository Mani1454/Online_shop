import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { Order, OrderStatus } from '../../types/schema';
import { Colors, Typography, Spacing, Shadows } from '../../theme/colors';

interface OrderKanbanCardProps {
  order: Order;
  onAccept: (orderId: string) => void;
  onDispatch: (orderId: string) => void;
  onMarkDelivered: (orderId: string) => void;
  onReject?: (orderId: string) => void;
}

export const OrderKanbanCard: React.FC<OrderKanbanCardProps> = ({
  order,
  onAccept,
  onDispatch,
  onMarkDelivered,
  onReject,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Toggle item in packing checklist
  const toggleItemCheck = (itemId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Calculate human-friendly elapsed time
  const getElapsedTime = (isoString: string): string => {
    const elapsedMs = Date.now() - new Date(isoString).getTime();
    const elapsedMins = Math.floor(elapsedMs / 60000);
    if (elapsedMins < 1) return 'Just now';
    if (elapsedMins === 1) return '1m ago';
    if (elapsedMins < 60) return `${elapsedMins}m ago`;
    const hours = Math.floor(elapsedMins / 60);
    return `${hours}h ago`;
  };

  const isNew = order.status === 'RECEIVED';
  const isPreparing = order.status === 'PREPARING';
  const isOut = order.status === 'OUT_FOR_DELIVERY';

  const allItemsChecked =
    order.items.length > 0 &&
    order.items.every((item) => checkedItems[item.id] === true);

  return (
    <View
      style={[
        styles.card,
        isNew && styles.cardNew,
        isPreparing && styles.cardPreparing,
        isOut && styles.cardOut,
      ]}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderIdText}>{order.id}</Text>
          <View
            style={[
              styles.timePill,
              isNew ? styles.timePillAlert : styles.timePillNormal,
            ]}
          >
            <Text
              style={[
                styles.timePillText,
                isNew && styles.timePillTextAlert,
              ]}
            >
              ⏱️ {getElapsedTime(order.createdAt)}
            </Text>
          </View>
        </View>

        {/* Payment Badge */}
        <View
          style={[
            styles.paymentBadge,
            order.paymentMethod === 'COD'
              ? styles.paymentBadgeCod
              : styles.paymentBadgeUpi,
          ]}
        >
          <Text
            style={[
              styles.paymentBadgeText,
              order.paymentMethod === 'COD'
                ? styles.paymentTextCod
                : styles.paymentTextUpi,
            ]}
          >
            {order.paymentMethod === 'COD'
              ? `💵 COD: Collect ₹${order.finalTotal}`
              : `⚡ UPI Paid (Online)`}
          </Text>
        </View>
      </View>

      {/* Customer Info & Address */}
      <View style={styles.customerBox}>
        <View style={styles.customerRow}>
          <Text style={styles.customerName}>{order.customerName}</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${order.customerPhone}`)}
            style={styles.callBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.callBtnText}>📞 Call {order.customerPhone}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.addressText} numberOfLines={2}>
          📍 {order.deliveryAddress.streetAddress}
          {order.deliveryAddress.landmark
            ? ` (Near ${order.deliveryAddress.landmark})`
            : ''}
        </Text>
      </View>

      {/* Accordion / Expand Toggle for Packing Checklist */}
      <TouchableOpacity
        style={styles.expandHeader}
        onPress={() => setIsExpanded((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Text style={styles.itemsCountTitle}>
          Items ({order.items.length}) • Total ₹{order.finalTotal}
        </Text>
        <Text style={styles.expandIcon}>{isExpanded ? '▲ Hide' : '▼ View Items'}</Text>
      </TouchableOpacity>

      {/* Packing Checklist */}
      {isExpanded && (
        <View style={styles.checklistContainer}>
          <Text style={styles.checklistHint}>
            Tap items to check off while packing carry bag:
          </Text>

          {order.items.map((item) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.checklistItem,
                  isChecked && styles.checklistItemChecked,
                ]}
                onPress={() => toggleItemCheck(item.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkboxCircle,
                    isChecked && styles.checkboxCircleChecked,
                  ]}
                >
                  {isChecked && <Text style={styles.checkmarkIcon}>✓</Text>}
                </View>

                <View style={styles.itemInfo}>
                  <Text
                    style={[
                      styles.itemTitle,
                      isChecked && styles.itemTitleChecked,
                    ]}
                  >
                    {item.productName}
                  </Text>
                  <Text style={styles.itemUnit}>
                    {item.unit} • ₹{item.unitPrice} each
                  </Text>
                </View>

                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyText}>x{item.quantity}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Action Buttons Section */}
      <View style={styles.actionRow}>
        {isNew && (
          <View style={styles.actionButtonGroup}>
            {onReject && (
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => onReject(order.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.rejectBtnText}>Decline</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => onAccept(order.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.acceptBtnIcon}>🔔</Text>
              <Text style={styles.acceptBtnText}>Accept & Start Packing</Text>
            </TouchableOpacity>
          </View>
        )}

        {isPreparing && (
          <TouchableOpacity
            style={[
              styles.dispatchBtn,
              !allItemsChecked && styles.dispatchBtnPendingCheck,
            ]}
            onPress={() => onDispatch(order.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.dispatchBtnIcon}>🛵</Text>
            <Text style={styles.dispatchBtnText}>
              Hand Over to Rider (Dispatch) →
            </Text>
          </TouchableOpacity>
        )}

        {isOut && (
          <View style={styles.outForDeliveryRow}>
            {order.deliveryPartner && (
              <Text style={styles.riderText}>
                Rider: {order.deliveryPartner.name}
              </Text>
            )}
            <TouchableOpacity
              style={styles.deliveredBtn}
              onPress={() => onMarkDelivered(order.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.deliveredBtnText}>Mark Delivered ✓</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: Spacing.md + 2,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardNew: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  cardPreparing: {
    borderColor: '#FBBF24',
    backgroundColor: '#FFFDF5',
  },
  cardOut: {
    borderColor: '#60A5FA',
    backgroundColor: '#F8FAFC',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderIdText: {
    fontSize: Typography.sizes.md + 1,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  timePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
  },
  timePillAlert: {
    backgroundColor: '#FEE2E2',
  },
  timePillNormal: {
    backgroundColor: Colors.surfaceSecondary,
  },
  timePillText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
  },
  timePillTextAlert: {
    color: Colors.danger,
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentBadgeCod: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  paymentBadgeUpi: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
  },
  paymentTextCod: {
    color: '#B45309',
  },
  paymentTextUpi: {
    color: '#15803D',
  },
  customerBox: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: Spacing.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: Spacing.sm,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: Typography.sizes.sm + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  callBtn: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  callBtnText: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  addressText: {
    fontSize: Typography.sizes.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  expandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    marginTop: 2,
  },
  itemsCountTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  expandIcon: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: Typography.weights.bold,
  },
  checklistContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  checklistHint: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    fontStyle: 'italic',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: Colors.surfaceSecondary,
  },
  checklistItemChecked: {
    backgroundColor: '#F0FDF4',
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  checkboxCircleChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmarkIcon: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: Typography.weights.bold,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: Typography.sizes.xs + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  itemTitleChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  itemUnit: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  qtyBadge: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  actionRow: {
    marginTop: Spacing.sm,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rejectBtn: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  rejectBtnText: {
    fontSize: Typography.sizes.sm,
    color: Colors.danger,
    fontWeight: Typography.weights.bold,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    ...Shadows.card,
  },
  acceptBtnIcon: {
    fontSize: 16,
  },
  acceptBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
  },
  dispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB', // Vibrant Blue
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    ...Shadows.card,
  },
  dispatchBtnPendingCheck: {
    backgroundColor: '#3B82F6',
  },
  dispatchBtnIcon: {
    fontSize: 18,
  },
  dispatchBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.sm + 1,
    fontWeight: Typography.weights.bold,
  },
  outForDeliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riderText: {
    fontSize: Typography.sizes.xs + 1,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semiBold,
  },
  deliveredBtn: {
    backgroundColor: Colors.success,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    ...Shadows.card,
  },
  deliveredBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
});
