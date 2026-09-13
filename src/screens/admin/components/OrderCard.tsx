import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { Order } from '../../../types/schema';
import { Colors, Typography, Spacing, Shadows } from '../../../theme/colors';

interface OrderCardProps {
  order: Order;
  onAccept: (orderId: string) => void;
  onDispatch: (orderId: string) => void;
  onMarkDelivered: (orderId: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onAccept,
  onDispatch,
  onMarkDelivered,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculate elapsed minutes for visual urgency
  const elapsedMinutes = Math.floor(
    (Date.now() - new Date(order.createdAt).getTime()) / 60000
  );

  const isNew = order.status === 'RECEIVED';
  const isPacking = order.status === 'PREPARING';
  const isOut = order.status === 'OUT_FOR_DELIVERY';

  // Visual Urgency for New Orders:
  // < 5m: Normal | 5-10m: Yellow Alert | > 10m: Urgent Red
  let urgencyLevel: 'NORMAL' | 'MEDIUM' | 'URGENT' = 'NORMAL';
  if (isNew) {
    if (elapsedMinutes >= 10) {
      urgencyLevel = 'URGENT';
    } else if (elapsedMinutes >= 5) {
      urgencyLevel = 'MEDIUM';
    }
  }

  const elapsedText =
    elapsedMinutes < 1 ? 'Just now' : `${elapsedMinutes}m ago`;

  return (
    <View
      style={[
        styles.card,
        isNew && urgencyLevel === 'NORMAL' && styles.cardNewNormal,
        isNew && urgencyLevel === 'MEDIUM' && styles.cardNewMedium,
        isNew && urgencyLevel === 'URGENT' && styles.cardNewUrgent,
        isPacking && styles.cardPacking,
        isOut && styles.cardOut,
      ]}
    >
      {/* Visual Urgency Alert Ribbon (if delayed) */}
      {isNew && urgencyLevel === 'URGENT' && (
        <View style={styles.urgentBanner}>
          <Text style={styles.urgentBannerText}>
            🚨 URGENT: Order waiting {elapsedMinutes} mins! Pack immediately.
          </Text>
        </View>
      )}

      {isNew && urgencyLevel === 'MEDIUM' && (
        <View style={styles.mediumBanner}>
          <Text style={styles.mediumBannerText}>
            ⚠️ Delayed: {elapsedMinutes} mins elapsed since placement
          </Text>
        </View>
      )}

      {/* Card Header: Order ID & Time Elapsed */}
      <View style={styles.cardHeader}>
        <View style={styles.idGroup}>
          <Text style={styles.orderId}>{order.id}</Text>
          <View
            style={[
              styles.elapsedBadge,
              urgencyLevel === 'URGENT' && styles.elapsedUrgent,
              urgencyLevel === 'MEDIUM' && styles.elapsedMedium,
            ]}
          >
            <Text
              style={[
                styles.elapsedText,
                urgencyLevel === 'URGENT' && styles.elapsedTextUrgent,
              ]}
            >
              ⏱️ {elapsedText}
            </Text>
          </View>
        </View>

        {/* Total Price & Payment Mode Tag */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceValue}>₹{order.finalTotal}</Text>
          <View
            style={[
              styles.paymentTag,
              order.paymentMethod === 'COD'
                ? styles.paymentTagCod
                : styles.paymentTagUpi,
            ]}
          >
            <Text
              style={[
                styles.paymentTagText,
                order.paymentMethod === 'COD'
                  ? styles.paymentTextCod
                  : styles.paymentTextUpi,
              ]}
            >
              {order.paymentMethod === 'COD' ? '💵 COD (Cash)' : '⚡ UPI Paid'}
            </Text>
          </View>
        </View>
      </View>

      {/* Customer Info & Quick Phone Call */}
      <View style={styles.customerBox}>
        <View style={styles.customerRow}>
          <Text style={styles.customerName}>{order.customerName}</Text>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => Linking.openURL(`tel:${order.customerPhone}`)}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.callButtonText}>📞 {order.customerPhone}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.addressText} numberOfLines={2}>
          📍 {order.deliveryAddress.streetAddress}
          {order.deliveryAddress.landmark
            ? ` (Near ${order.deliveryAddress.landmark})`
            : ''}
        </Text>
      </View>

      {/* Items Summary & Toggleable Checklist */}
      <TouchableOpacity
        style={styles.itemsSummaryToggle}
        onPress={() => setIsExpanded((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Text style={styles.itemsCountText}>
          {order.items.length} {order.items.length === 1 ? 'item' : 'items'} to pack
        </Text>
        <Text style={styles.expandHint}>
          {isExpanded ? 'Hide Checklist ▲' : 'Show Checklist ▼'}
        </Text>
      </TouchableOpacity>

      {/* Expanded Checklist */}
      {isExpanded ? (
        <View style={styles.checklistCard}>
          {order.items.map((it) => {
            const isChecked = !!checkedItems[it.id];
            return (
              <TouchableOpacity
                key={it.id}
                style={[
                  styles.checklistItem,
                  isChecked && styles.checklistItemChecked,
                ]}
                onPress={() => toggleCheck(it.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    isChecked && styles.checkboxBoxChecked,
                  ]}
                >
                  {isChecked && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text
                  style={[
                    styles.itemTitle,
                    isChecked && styles.itemTitleChecked,
                  ]}
                >
                  {it.productName} ({it.unit})
                </Text>
                <Text style={styles.itemQty}>x{it.quantity}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        /* Compact preview snippet */
        <Text style={styles.compactSnippet} numberOfLines={1}>
          {order.items
            .map((i) => `${i.productName} (x${i.quantity})`)
            .join(', ')}
        </Text>
      )}

      {/* 1-Click Chunky Fulfillment Action Button (Min 48px height) */}
      <View style={styles.actionContainer}>
        {isNew && (
          <TouchableOpacity
            style={[
              styles.chunkyBtn,
              styles.btnAccept,
              urgencyLevel === 'URGENT' && styles.btnAcceptUrgent,
            ]}
            onPress={() => onAccept(order.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.chunkyBtnIcon}>🔔</Text>
            <Text style={styles.chunkyBtnText}>Accept & Start Packing</Text>
          </TouchableOpacity>
        )}

        {isPacking && (
          <TouchableOpacity
            style={[styles.chunkyBtn, styles.btnDispatch]}
            onPress={() => onDispatch(order.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.chunkyBtnIcon}>🛵</Text>
            <Text style={styles.chunkyBtnText}>
              Dispatch (Out for Delivery)
            </Text>
          </TouchableOpacity>
        )}

        {isOut && (
          <TouchableOpacity
            style={[styles.chunkyBtn, styles.btnDelivered]}
            onPress={() => onMarkDelivered(order.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.chunkyBtnIcon}>✓</Text>
            <Text style={styles.chunkyBtnText}>Mark Delivered</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.md + 2,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  // Visual Urgency states
  cardNewNormal: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFFFF',
  },
  cardNewMedium: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFDF0',
  },
  cardNewUrgent: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  cardPacking: {
    borderColor: '#FBBF24',
    backgroundColor: '#FFFDF5',
  },
  cardOut: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
  },
  urgentBanner: {
    backgroundColor: '#DC2626',
    marginHorizontal: -Spacing.lg,
    marginTop: -Spacing.lg,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginBottom: Spacing.sm,
  },
  urgentBannerText: {
    color: Colors.textWhite,
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  mediumBanner: {
    backgroundColor: '#F59E0B',
    marginHorizontal: -Spacing.lg,
    marginTop: -Spacing.lg,
    paddingVertical: 5,
    paddingHorizontal: Spacing.md,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginBottom: Spacing.sm,
  },
  mediumBannerText: {
    color: Colors.textWhite,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  elapsedBadge: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  elapsedMedium: {
    backgroundColor: '#FEF3C7',
  },
  elapsedUrgent: {
    backgroundColor: '#FEE2E2',
  },
  elapsedText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
  },
  elapsedTextUrgent: {
    color: Colors.danger,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  paymentTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  paymentTagCod: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  paymentTagUpi: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  paymentTagText: {
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
  },
  paymentTextCod: {
    color: '#B45309',
  },
  paymentTextUpi: {
    color: '#15803D',
  },
  customerBox: {
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.md,
    borderRadius: 12,
    marginVertical: Spacing.xs,
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
  callButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  callButtonText: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  addressText: {
    fontSize: Typography.sizes.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  itemsSummaryToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 4,
  },
  itemsCountText: {
    fontSize: Typography.sizes.xs + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  expandHint: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: Typography.weights.semiBold,
  },
  compactSnippet: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  checklistCard: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 6,
    borderRadius: 6,
    gap: 8,
  },
  checklistItemChecked: {
    backgroundColor: '#F0FDF4',
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxTick: {
    color: Colors.textWhite,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  itemTitle: {
    flex: 1,
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
  itemTitleChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  itemQty: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  actionContainer: {
    marginTop: Spacing.xs,
  },
  chunkyBtn: {
    minHeight: 52, // Chunky touch target for 1-meter away kiosk visibility
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: 8,
    ...Shadows.card,
  },
  btnAccept: {
    backgroundColor: '#16A34A', // Green
  },
  btnAcceptUrgent: {
    backgroundColor: '#DC2626', // Urgent flashing red
  },
  btnDispatch: {
    backgroundColor: '#2563EB', // Blue
  },
  btnDelivered: {
    backgroundColor: '#059669', // Emerald
  },
  chunkyBtnIcon: {
    fontSize: 20,
  },
  chunkyBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.5,
  },
});
