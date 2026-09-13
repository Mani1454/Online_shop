import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import { useStore } from './context/StoreContext';
import { OrderKanbanCard } from './components/OrderKanbanCard';
import { Colors, Typography, Spacing, Shadows } from '../theme/colors';

export const LiveOrdersScreen: React.FC = () => {
  const {
    orders,
    acceptOrder,
    dispatchOrder,
    markDelivered,
    rejectOrder,
    simulateIncomingOrder,
    isAudioRinging,
    isAudioMuted,
    toggleMuteAudio,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Filter orders by ID or customer name
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
    );
  }, [orders, searchQuery]);

  // Group into 3 Kanban Columns
  const newOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'RECEIVED'),
    [filteredOrders]
  );
  const preparingOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'PREPARING'),
    [filteredOrders]
  );
  const outForDeliveryOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'OUT_FOR_DELIVERY'),
    [filteredOrders]
  );

  return (
    <View style={styles.container}>
      {/* Real-Time Audio Alert Banner (Plays continuous chime until accepted) */}
      {isAudioRinging && (
        <View style={styles.audioAlertBanner}>
          <View style={styles.audioAlertContent}>
            <Text style={styles.bellIcon}>🔔</Text>
            <View>
              <Text style={styles.alertBannerTitle}>
                NEW INCOMING ORDER RECEIVED! ({newOrders.length})
              </Text>
              <Text style={styles.alertBannerSubtitle}>
                Chime ringing... Tap "Accept & Start Packing" to silence the bell.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.silenceBtn}
            onPress={toggleMuteAudio}
            activeOpacity={0.8}
          >
            <Text style={styles.silenceBtnText}>
              {isAudioMuted ? '🔇 Unmute' : '🔕 Silence Bell'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Top Action Bar */}
      <View style={styles.topBar}>
        {/* Search Orders */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Order ID (#ORD-...) or Customer..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons: Simulate & Sound Toggle */}
        <View style={styles.topActionsGroup}>
          <TouchableOpacity
            style={styles.simulateBtn}
            onPress={simulateIncomingOrder}
            activeOpacity={0.85}
          >
            <Text style={styles.simulateBtnIcon}>⚡</Text>
            <Text style={styles.simulateBtnText}>Simulate Test Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.soundToggleBtn,
              isAudioMuted && styles.soundToggleMuted,
            ]}
            onPress={toggleMuteAudio}
            activeOpacity={0.85}
          >
            <Text style={styles.soundToggleText}>
              {isAudioMuted ? '🔇 Sound Muted' : '🔊 Sound Alerts ON'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3-Column Kanban Board */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.kanbanScrollContainer}
      >
        {/* =================================================================== */}
        {/* Column 1: New Orders (Red / Alerting) */}
        {/* =================================================================== */}
        <View style={[styles.kanbanColumn, styles.columnNew]}>
          <View style={[styles.columnHeader, styles.headerNew]}>
            <View style={styles.columnTitleRow}>
              <View style={styles.redPulseDot} />
              <Text style={styles.columnTitle}>New Orders</Text>
            </View>
            <View style={styles.countBadgeNew}>
              <Text style={styles.countBadgeTextNew}>{newOrders.length}</Text>
            </View>
          </View>

          <ScrollView
            style={styles.columnCardsScroll}
            showsVerticalScrollIndicator={false}
          >
            {newOrders.length === 0 ? (
              <View style={styles.emptyColumnBox}>
                <Text style={styles.emptyColumnEmoji}>☕</Text>
                <Text style={styles.emptyColumnTitle}>No New Orders</Text>
                <Text style={styles.emptyColumnSub}>
                  You're all caught up! New orders will ring automatically.
                </Text>
              </View>
            ) : (
              newOrders.map((order) => (
                <OrderKanbanCard
                  key={order.id}
                  order={order}
                  onAccept={acceptOrder}
                  onDispatch={dispatchOrder}
                  onMarkDelivered={markDelivered}
                  onReject={rejectOrder}
                />
              ))
            )}
          </ScrollView>
        </View>

        {/* =================================================================== */}
        {/* Column 2: Preparing / Packing (Yellow / Amber) */}
        {/* =================================================================== */}
        <View style={[styles.kanbanColumn, styles.columnPreparing]}>
          <View style={[styles.columnHeader, styles.headerPreparing]}>
            <View style={styles.columnTitleRow}>
              <Text style={styles.columnEmojiIcon}>🛍️</Text>
              <Text style={styles.columnTitle}>Preparing in Store</Text>
            </View>
            <View style={styles.countBadgePreparing}>
              <Text style={styles.countBadgeTextPreparing}>
                {preparingOrders.length}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.columnCardsScroll}
            showsVerticalScrollIndicator={false}
          >
            {preparingOrders.length === 0 ? (
              <View style={styles.emptyColumnBox}>
                <Text style={styles.emptyColumnEmoji}>📦</Text>
                <Text style={styles.emptyColumnTitle}>Nothing Packing</Text>
                <Text style={styles.emptyColumnSub}>
                  Accepted orders will appear here for packaging.
                </Text>
              </View>
            ) : (
              preparingOrders.map((order) => (
                <OrderKanbanCard
                  key={order.id}
                  order={order}
                  onAccept={acceptOrder}
                  onDispatch={dispatchOrder}
                  onMarkDelivered={markDelivered}
                />
              ))
            )}
          </ScrollView>
        </View>

        {/* =================================================================== */}
        {/* Column 3: Out for Delivery (Blue) */}
        {/* =================================================================== */}
        <View style={[styles.kanbanColumn, styles.columnOut]}>
          <View style={[styles.columnHeader, styles.headerOut]}>
            <View style={styles.columnTitleRow}>
              <Text style={styles.columnEmojiIcon}>🛵</Text>
              <Text style={styles.columnTitle}>Out for Delivery</Text>
            </View>
            <View style={styles.countBadgeOut}>
              <Text style={styles.countBadgeTextOut}>
                {outForDeliveryOrders.length}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.columnCardsScroll}
            showsVerticalScrollIndicator={false}
          >
            {outForDeliveryOrders.length === 0 ? (
              <View style={styles.emptyColumnBox}>
                <Text style={styles.emptyColumnEmoji}>🛣️</Text>
                <Text style={styles.emptyColumnTitle}>No Active Deliveries</Text>
                <Text style={styles.emptyColumnSub}>
                  Orders dispatched with the rider will show here.
                </Text>
              </View>
            ) : (
              outForDeliveryOrders.map((order) => (
                <OrderKanbanCard
                  key={order.id}
                  order={order}
                  onAccept={acceptOrder}
                  onDispatch={dispatchOrder}
                  onMarkDelivered={markDelivered}
                />
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Slate 100
  },
  audioAlertBanner: {
    backgroundColor: '#DC2626', // Red 600
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.floating,
  },
  audioAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bellIcon: {
    fontSize: 28,
  },
  alertBannerTitle: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.5,
  },
  alertBannerSubtitle: {
    color: '#FEE2E2',
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  silenceBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.textWhite,
  },
  silenceBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.xs + 1,
    fontWeight: Typography.weights.bold,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    height: 44,
    maxWidth: 420,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
  clearSearch: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: Typography.weights.bold,
  },
  topActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED', // Purple accent
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    gap: 6,
    ...Shadows.card,
  },
  simulateBtnIcon: {
    fontSize: 14,
  },
  simulateBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.xs + 1,
    fontWeight: Typography.weights.bold,
  },
  soundToggleBtn: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
  },
  soundToggleMuted: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  soundToggleText: {
    fontSize: Typography.sizes.xs + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  kanbanScrollContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  kanbanColumn: {
    width: 360,
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    padding: Spacing.md,
    maxHeight: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  columnNew: {
    backgroundColor: '#FEF2F2', // Soft Red
    borderColor: '#FECACA',
  },
  columnPreparing: {
    backgroundColor: '#FFFBEB', // Soft Yellow
    borderColor: '#FDE68A',
  },
  columnOut: {
    backgroundColor: '#EFF6FF', // Soft Blue
    borderColor: '#BFDBFE',
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    marginBottom: Spacing.md,
  },
  headerNew: {},
  headerPreparing: {},
  headerOut: {},
  columnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
  },
  columnEmojiIcon: {
    fontSize: 18,
  },
  columnTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  countBadgeNew: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeTextNew: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: Typography.weights.extraBold,
  },
  countBadgePreparing: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeTextPreparing: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: Typography.weights.extraBold,
  },
  countBadgeOut: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeTextOut: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: Typography.weights.extraBold,
  },
  columnCardsScroll: {
    flex: 1,
  },
  emptyColumnBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.lg,
  },
  emptyColumnEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  emptyColumnTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  emptyColumnSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
