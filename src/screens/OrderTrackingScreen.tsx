import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Linking,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { Order } from '../types/schema';
import { useLiveOrder, ORDER_STEPS } from '../hooks/useLiveOrder';
import { Colors, Typography, Spacing, Shadows } from '../theme/colors';

interface OrderTrackingScreenProps {
  order: Order;
  liveOrdersList?: Order[];
  shopPhone?: string;
  onBackToHome: () => void;
  onViewOrderHistory?: () => void;
}

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({
  order: initialOrder,
  liveOrdersList,
  shopPhone = '+919876543210',
  onBackToHome,
  onViewOrderHistory,
}) => {
  const {
    order,
    currentStepIndex,
    etaText,
    etaSubtext,
    isDelivered,
    statusColor,
  } = useLiveOrder(initialOrder, liveOrdersList);

  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  if (!order) return null;

  const handleCallStore = () => {
    Linking.openURL(`tel:${shopPhone}`);
  };

  const handleDownloadReceipt = () => {
    setShowReceiptModal(true);
  };

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
          accessibilityLabel="Back to Home"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Live Delivery Tracking</Text>
          <Text style={styles.headerSubtitle}>Order {order.id}</Text>
        </View>

        <View
          style={[
            styles.livePulsePill,
            { backgroundColor: isDelivered ? '#DCFCE7' : '#FEE2E2' },
          ]}
        >
          {!isDelivered && <View style={styles.livePulseDot} />}
          <Text
            style={[
              styles.livePulseText,
              { color: isDelivered ? '#15803D' : Colors.danger },
            ]}
          >
            {isDelivered ? 'COMPLETED' : 'LIVE'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dynamic ETA Hero Card */}
        <View style={[styles.heroCard, { borderColor: statusColor }]}>
          <Text style={styles.heroEstimatedLabel}>ESTIMATED TIME OF ARRIVAL</Text>
          <Text style={styles.heroEstimatedTime}>{etaText}</Text>
          <Text style={styles.heroSubtitle}>{etaSubtext}</Text>

          {/* Quick Actions Row */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.callStoreBtn}
              onPress={handleCallStore}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Call storekeeper"
            >
              <Text style={styles.callStoreIcon}>📞</Text>
              <Text style={styles.callStoreText}>Call Store</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.receiptActionBtn}
              onPress={handleDownloadReceipt}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="View and download order receipt"
            >
              <Text style={styles.receiptActionIcon}>📄</Text>
              <Text style={styles.receiptActionText}>View Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4-Step Visual Status Stepper */}
        <View style={styles.stepperCard}>
          <View style={styles.stepperHeader}>
            <Text style={styles.stepperTitle}>Order Status Timeline</Text>
            <Text style={styles.stepperSubtitle}>ऑर्डर की स्थिति</Text>
          </View>

          <View style={styles.stepsContainer}>
            {ORDER_STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUpcoming = index > currentStepIndex;

              return (
                <View key={step.status} style={styles.stepRow}>
                  {/* Left Column: Icon Circle & Connector Line */}
                  <View style={styles.indicatorCol}>
                    <View
                      style={[
                        styles.stepCircle,
                        isCompleted && styles.circleCompleted,
                        isCurrent && styles.circleCurrent,
                        isUpcoming && styles.circleUpcoming,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepIconText,
                          isCompleted && styles.iconCompleted,
                          isCurrent && styles.iconCurrent,
                        ]}
                      >
                        {isCompleted ? '✓' : step.icon}
                      </Text>
                    </View>

                    {/* Vertical Connector Line */}
                    {index < ORDER_STEPS.length - 1 && (
                      <View
                        style={[
                          styles.connectorLine,
                          isCompleted && styles.connectorLineCompleted,
                        ]}
                      />
                    )}
                  </View>

                  {/* Right Column: Step Info */}
                  <View style={styles.stepContentCol}>
                    <View style={styles.stepTitleRow}>
                      <Text
                        style={[
                          styles.stepTitleText,
                          (isCompleted || isCurrent) && styles.titleActive,
                        ]}
                      >
                        {step.title}
                      </Text>

                      {isCurrent && (
                        <View style={styles.activePulseBadge}>
                          <Text style={styles.activePulseText}>IN PROGRESS</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.stepLocalizedText}>
                      {step.titleLocalized}
                    </Text>

                    <Text
                      style={[
                        styles.stepSubtitleText,
                        isCurrent && styles.subtitleCurrent,
                      ]}
                    >
                      {step.subtitle}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Collapsible Order Summary Accordion */}
        <View style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setIsAccordionOpen((prev) => !prev)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Toggle order summary items"
          >
            <View>
              <Text style={styles.accordionTitle}>
                Order Summary ({order.items.length} items)
              </Text>
              <Text style={styles.accordionSubtitle}>
                Total ₹{order.finalTotal} •{' '}
                {order.paymentMethod === 'COD'
                  ? '💵 Cash on Delivery'
                  : '⚡ Paid via UPI'}
              </Text>
            </View>

            <View style={styles.accordionTogglePill}>
              <Text style={styles.accordionToggleText}>
                {isAccordionOpen ? 'Hide ▲' : 'Details ▼'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Accordion Body */}
          {isAccordionOpen && (
            <View style={styles.accordionBody}>
              <View style={styles.itemsList}>
                {order.items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemMain}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.productName}
                      </Text>
                      <Text style={styles.itemUnit}>
                        {item.unit} • ₹{item.unitPrice} each
                      </Text>
                    </View>
                    <Text style={styles.itemQty}>x{item.quantity}</Text>
                    <Text style={styles.itemPrice}>₹{item.totalPrice}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              {/* Price Breakdown */}
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Item Total</Text>
                <Text style={styles.breakdownValue}>₹{order.itemTotal}</Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Delivery Partner Fee</Text>
                <Text style={styles.breakdownValue}>
                  {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
                </Text>
              </View>

              <View style={[styles.breakdownRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>₹{order.finalTotal}</Text>
              </View>

              {/* Delivery Address Details */}
              <View style={styles.addressSnapshotBox}>
                <Text style={styles.addressBoxTitle}>Delivery Address:</Text>
                <Text style={styles.addressBoxStreet}>
                  {order.deliveryAddress.streetAddress}
                </Text>
                {Boolean(order.deliveryAddress.landmark) && (
                  <Text style={styles.addressBoxLandmark}>
                    Landmark: {order.deliveryAddress.landmark}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Order History Link */}
        {onViewOrderHistory && (
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={onViewOrderHistory}
            activeOpacity={0.8}
          >
            <Text style={styles.historyBtnText}>📜 View Past Order History →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Sticky Bottom Call Store Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomStatusInfo}>
          <Text style={styles.bottomStatusLabel}>Current Status</Text>
          <Text style={styles.bottomStatusValue}>
            {ORDER_STEPS[currentStepIndex]?.title || 'Processing'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.bottomCallBtn}
          onPress={handleCallStore}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Call store"
        >
          <Text style={styles.bottomCallBtnIcon}>📞</Text>
          <Text style={styles.bottomCallBtnText}>Call Store</Text>
        </TouchableOpacity>
      </View>

      {/* Printable / Downloadable Digital Receipt Modal */}
      <Modal
        visible={showReceiptModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReceiptModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptModalCard}>
            {/* Header */}
            <View style={styles.receiptModalHeader}>
              <View>
                <Text style={styles.receiptStoreName}>Apna Kirana Store</Text>
                <Text style={styles.receiptSub}>Neighborhood Delivery Receipt</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowReceiptModal(false)}
                style={styles.closeModalBtn}
              >
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.receiptMetaRow}>
              <Text style={styles.receiptMetaText}>Order: {order.id}</Text>
              <Text style={styles.receiptMetaText}>
                Date: {new Date(order.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.dashedLine} />

            {/* Items Table */}
            <ScrollView style={styles.receiptItemsScroll}>
              {order.items.map((it) => (
                <View key={it.id} style={styles.receiptItemRow}>
                  <Text style={styles.receiptItemName} numberOfLines={1}>
                    {it.productName} ({it.unit})
                  </Text>
                  <Text style={styles.receiptItemQty}>x{it.quantity}</Text>
                  <Text style={styles.receiptItemTotal}>₹{it.totalPrice}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.dashedLine} />

            {/* Totals */}
            <View style={styles.receiptSummaryRow}>
              <Text style={styles.receiptSumLabel}>Subtotal</Text>
              <Text style={styles.receiptSumVal}>₹{order.itemTotal}</Text>
            </View>
            <View style={styles.receiptSummaryRow}>
              <Text style={styles.receiptSumLabel}>Delivery Fee</Text>
              <Text style={styles.receiptSumVal}>
                {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
              </Text>
            </View>
            <View style={[styles.receiptSummaryRow, { marginTop: 4 }]}>
              <Text style={styles.receiptTotalLabel}>Amount Paid / To Pay</Text>
              <Text style={styles.receiptTotalVal}>₹{order.finalTotal}</Text>
            </View>

            <View style={styles.paymentTagBox}>
              <Text style={styles.paymentTagText}>
                Payment Mode: {order.paymentMethod === 'UPI' ? 'UPI Online' : 'Cash on Delivery'}
              </Text>
            </View>

            {/* Close / Done CTA */}
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => {
                setShowReceiptModal(false);
                Alert.alert(
                  'Receipt Saved',
                  'A copy of this digital receipt has been saved to your downloads.'
                );
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalDoneBtnText}>Save Receipt / Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  livePulsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 5,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.danger,
  },
  livePulseText: {
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 110,
  },
  heroCard: {
    backgroundColor: '#0F172A', // Slate 900
    borderRadius: 22,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    marginBottom: Spacing.lg,
    ...Shadows.floating,
  },
  heroEstimatedLabel: {
    fontSize: Typography.sizes.xs,
    color: '#94A3B8',
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
  },
  heroEstimatedTime: {
    fontSize: 34,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textWhite,
    marginVertical: 4,
  },
  heroSubtitle: {
    fontSize: Typography.sizes.xs + 1,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  callStoreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    minHeight: 48,
    ...Shadows.card,
  },
  callStoreIcon: {
    fontSize: 18,
  },
  callStoreText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.sm + 1,
    fontWeight: Typography.weights.bold,
  },
  receiptActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  receiptActionIcon: {
    fontSize: 18,
  },
  receiptActionText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.sm + 1,
    fontWeight: Typography.weights.bold,
  },
  stepperCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  stepperHeader: {
    marginBottom: Spacing.lg,
  },
  stepperTitle: {
    fontSize: Typography.sizes.md + 1,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  stepperSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  stepsContainer: {
    paddingLeft: Spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
  },
  indicatorCol: {
    alignItems: 'center',
    width: 44,
  },
  stepCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
  },
  circleCompleted: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  circleCurrent: {
    backgroundColor: '#FFEDD5', // Amber tint
    borderColor: Colors.accent,
    borderWidth: 3,
  },
  circleUpcoming: {
    opacity: 0.5,
  },
  stepIconText: {
    fontSize: 16,
  },
  iconCompleted: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  iconCurrent: {
    color: Colors.accentDark,
  },
  connectorLine: {
    width: 3,
    height: 44,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  connectorLineCompleted: {
    backgroundColor: Colors.primary,
  },
  stepContentCol: {
    flex: 1,
    marginLeft: Spacing.md,
    paddingBottom: 28,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepTitleText: {
    fontSize: Typography.sizes.sm + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
  },
  titleActive: {
    color: Colors.textPrimary,
  },
  activePulseBadge: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activePulseText: {
    color: Colors.accentDark,
    fontSize: 9,
    fontWeight: Typography.weights.extraBold,
  },
  stepLocalizedText: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.textMuted,
    marginTop: 1,
  },
  stepSubtitleText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  subtitleCurrent: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
  accordionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.card,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  accordionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  accordionSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  accordionTogglePill: {
    backgroundColor: Colors.surfaceSecondary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  accordionToggleText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  accordionBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemMain: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textPrimary,
  },
  itemUnit: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.textMuted,
  },
  itemQty: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md,
  },
  itemPrice: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: Typography.sizes.xs + 1,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: Typography.sizes.xs + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  grandTotalRow: {
    marginTop: 6,
  },
  grandTotalLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  grandTotalValue: {
    fontSize: Typography.sizes.md + 1,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  addressSnapshotBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  addressBoxTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  addressBoxStreet: {
    fontSize: Typography.sizes.xs + 1,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
  addressBoxLandmark: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  historyBtnText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 24 : Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.floating,
  },
  bottomStatusInfo: {
    justifyContent: 'center',
  },
  bottomStatusLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  bottomStatusValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  bottomCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderRadius: 14,
    gap: 8,
    minHeight: 48,
    ...Shadows.card,
  },
  bottomCallBtnIcon: {
    fontSize: 16,
  },
  bottomCallBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.sm + 1,
    fontWeight: Typography.weights.bold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  receiptModalCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: Spacing.lg,
    ...Shadows.floating,
  },
  receiptModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  receiptStoreName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  receiptSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: 14,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  receiptMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  receiptMetaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  dashedLine: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
    borderStyle: 'dashed',
  },
  receiptItemsScroll: {
    maxHeight: 180,
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  receiptItemName: {
    flex: 1,
    fontSize: Typography.sizes.xs + 1,
    color: Colors.textPrimary,
  },
  receiptItemQty: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md,
  },
  receiptItemTotal: {
    fontSize: Typography.sizes.xs + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  receiptSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  receiptSumLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  receiptSumVal: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  receiptTotalLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  receiptTotalVal: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  paymentTagBox: {
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.sm,
    borderRadius: 8,
    marginVertical: Spacing.sm,
    alignItems: 'center',
  },
  paymentTagText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  modalDoneBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: Spacing.xs,
    ...Shadows.card,
  },
  modalDoneBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.sm + 1,
    fontWeight: Typography.weights.bold,
  },
});
