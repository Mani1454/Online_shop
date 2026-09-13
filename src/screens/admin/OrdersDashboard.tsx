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
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { useAudioAlert } from '../../hooks/useAudioAlert';
import { OrderCard } from './components/OrderCard';
import { Colors, Typography, Spacing, Shadows } from '../../theme/colors';

export const OrdersDashboard: React.FC = () => {
  const {
    orders,
    newOrders,
    packingOrders,
    outOrders,
    acceptOrder,
    dispatchOrder,
    markDelivered,
    simulateIncomingOrder,
  } = useAdminOrders();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<
    'ALL' | 'NEW' | 'PACKING' | 'OUT'
  >('ALL');

  // Trigger audio alert when there are any unaccepted new orders
  const hasNewOrders = newOrders.length > 0;
  const { isRinging, isMuted, toggleMute, playChime } = useAudioAlert(hasNewOrders);

  // Filter orders by search
  const filteredNew = useMemo(() => {
    if (!searchQuery.trim()) return newOrders;
    const q = searchQuery.toLowerCase().trim();
    return newOrders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
    );
  }, [newOrders, searchQuery]);

  const filteredPacking = useMemo(() => {
    if (!searchQuery.trim()) return packingOrders;
    const q = searchQuery.toLowerCase().trim();
    return packingOrders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
    );
  }, [packingOrders, searchQuery]);

  const filteredOut = useMemo(() => {
    if (!searchQuery.trim()) return outOrders;
    const q = searchQuery.toLowerCase().trim();
    return outOrders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
    );
  }, [outOrders, searchQuery]);

  return (
    <View style={styles.container}>
      {/* High-Priority Audio Alert Banner */}
      {isRinging && (
        <View style={styles.audioAlertBanner}>
          <View style={styles.audioAlertInfo}>
            <Text style={styles.bellEmoji}>🔔</Text>
            <View>
              <Text style={styles.audioAlertTitle}>
                NEW ORDER ALERT! ({newOrders.length} Waiting for Confirmation)
              </Text>
              <Text style={styles.audioAlertSub}>
                Chime is ringing... Tap "Accept & Start Packing" to silence the bell.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.silenceButton}
            onPress={toggleMute}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Silence bell"
          >
            <Text style={styles.silenceButtonText}>
              {isMuted ? '🔇 Unmute Chime' : '🔕 Silence Bell'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Control Toolbar */}
      <View style={styles.toolbar}>
        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Order ID (#ORD-...), Customer, or Phone..."
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

        {/* View Switcher Tabs (For Tablet Viewports) */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[
              styles.switchBtn,
              activeTabFilter === 'ALL' && styles.switchBtnActive,
            ]}
            onPress={() => setActiveTabFilter('ALL')}
          >
            <Text
              style={[
                styles.switchBtnText,
                activeTabFilter === 'ALL' && styles.switchBtnTextActive,
              ]}
            >
              All Columns
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchBtn,
              activeTabFilter === 'NEW' && styles.switchBtnActive,
            ]}
            onPress={() => setActiveTabFilter('NEW')}
          >
            <Text
              style={[
                styles.switchBtnText,
                activeTabFilter === 'NEW' && styles.switchBtnTextActive,
              ]}
            >
              New ({newOrders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchBtn,
              activeTabFilter === 'PACKING' && styles.switchBtnActive,
            ]}
            onPress={() => setActiveTabFilter('PACKING')}
          >
            <Text
              style={[
                styles.switchBtnText,
                activeTabFilter === 'PACKING' && styles.switchBtnTextActive,
              ]}
            >
              Packing ({packingOrders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchBtn,
              activeTabFilter === 'OUT' && styles.switchBtnActive,
            ]}
            onPress={() => setActiveTabFilter('OUT')}
          >
            <Text
              style={[
                styles.switchBtnText,
                activeTabFilter === 'OUT' && styles.switchBtnTextActive,
              ]}
            >
              Out ({outOrders.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Test Simulator & Audio Controls */}
        <View style={styles.quickControls}>
          <TouchableOpacity
            style={styles.simulateOrderBtn}
            onPress={simulateIncomingOrder}
            activeOpacity={0.85}
          >
            <Text style={styles.simulateIcon}>⚡</Text>
            <Text style={styles.simulateText}>Simulate New Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.muteToggleBtn,
              isMuted && styles.muteToggleBtnActive,
            ]}
            onPress={toggleMute}
            activeOpacity={0.85}
          >
            <Text style={styles.muteToggleText}>
              {isMuted ? '🔇 Muted' : '🔊 Chimes ON'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3-Column Kanban Board */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.boardScroll}
      >
        {/* ================================================================= */}
        {/* Column 1: New Orders */}
        {/* ================================================================= */}
        {(activeTabFilter === 'ALL' || activeTabFilter === 'NEW') && (
          <View style={[styles.column, styles.colNew]}>
            <View style={[styles.colHeader, styles.colHeaderNew]}>
              <View style={styles.colTitleRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.colTitle}>New Orders</Text>
              </View>
              <View style={styles.badgeNew}>
                <Text style={styles.badgeTextNew}>{filteredNew.length}</Text>
              </View>
            </View>

            <ScrollView
              style={styles.colBodyScroll}
              showsVerticalScrollIndicator={false}
            >
              {filteredNew.length === 0 ? (
                <View style={styles.emptyColBox}>
                  <Text style={styles.emptyEmoji}>☕</Text>
                  <Text style={styles.emptyTitle}>No New Orders</Text>
                  <Text style={styles.emptySub}>
                    Incoming orders will chime and appear here immediately.
                  </Text>
                </View>
              ) : (
                filteredNew.map((order) => (
                  <OrderCard
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
        )}

        {/* ================================================================= */}
        {/* Column 2: Packing / Preparing */}
        {/* ================================================================= */}
        {(activeTabFilter === 'ALL' || activeTabFilter === 'PACKING') && (
          <View style={[styles.column, styles.colPacking]}>
            <View style={[styles.colHeader, styles.colHeaderPacking]}>
              <View style={styles.colTitleRow}>
                <Text style={styles.colEmoji}>🛍️</Text>
                <Text style={styles.colTitle}>Packing in Store</Text>
              </View>
              <View style={styles.badgePacking}>
                <Text style={styles.badgeTextPacking}>
                  {filteredPacking.length}
                </Text>
              </View>
            </View>

            <ScrollView
              style={styles.colBodyScroll}
              showsVerticalScrollIndicator={false}
            >
              {filteredPacking.length === 0 ? (
                <View style={styles.emptyColBox}>
                  <Text style={styles.emptyEmoji}>📦</Text>
                  <Text style={styles.emptyTitle}>Nothing Packing</Text>
                  <Text style={styles.emptySub}>
                    Accepted orders will land here for bag packing.
                  </Text>
                </View>
              ) : (
                filteredPacking.map((order) => (
                  <OrderCard
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
        )}

        {/* ================================================================= */}
        {/* Column 3: Out for Delivery */}
        {/* ================================================================= */}
        {(activeTabFilter === 'ALL' || activeTabFilter === 'OUT') && (
          <View style={[styles.column, styles.colOut]}>
            <View style={[styles.colHeader, styles.colHeaderOut]}>
              <View style={styles.colTitleRow}>
                <Text style={styles.colEmoji}>🛵</Text>
                <Text style={styles.colTitle}>Out for Delivery</Text>
              </View>
              <View style={styles.badgeOut}>
                <Text style={styles.badgeTextOut}>{filteredOut.length}</Text>
              </View>
            </View>

            <ScrollView
              style={styles.colBodyScroll}
              showsVerticalScrollIndicator={false}
            >
              {filteredOut.length === 0 ? (
                <View style={styles.emptyColBox}>
                  <Text style={styles.emptyEmoji}>🛣️</Text>
                  <Text style={styles.emptyTitle}>No Active Deliveries</Text>
                  <Text style={styles.emptySub}>
                    Dispatched orders on the road will be shown here.
                  </Text>
                </View>
              ) : (
                filteredOut.map((order) => (
                  <OrderCard
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
        )}
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
    backgroundColor: '#DC2626', // Urgent Red
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.floating,
  },
  audioAlertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bellEmoji: {
    fontSize: 28,
  },
  audioAlertTitle: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.5,
  },
  audioAlertSub: {
    color: '#FEE2E2',
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  silenceButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.textWhite,
  },
  silenceButtonText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.xs + 1,
    fontWeight: Typography.weights.bold,
  },
  toolbar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    minWidth: 280,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
  },
  clearSearch: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: Typography.weights.bold,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  switchBtn: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: 10,
  },
  switchBtnActive: {
    backgroundColor: Colors.surface,
    ...Shadows.card,
  },
  switchBtnText: {
    fontSize: Typography.sizes.xs + 1,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semiBold,
  },
  switchBtnTextActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.bold,
  },
  quickControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  simulateOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    gap: 6,
    ...Shadows.card,
  },
  simulateIcon: {
    fontSize: 14,
  },
  simulateText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.xs + 1,
    fontWeight: Typography.weights.bold,
  },
  muteToggleBtn: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
  },
  muteToggleBtnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  muteToggleText: {
    fontSize: Typography.sizes.xs + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  boardScroll: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  column: {
    width: 380,
    borderRadius: 22,
    padding: Spacing.md,
    maxHeight: '100%',
    borderWidth: 1,
  },
  colNew: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  colPacking: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  colOut: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  colHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    marginBottom: Spacing.md,
  },
  colHeaderNew: {},
  colHeaderPacking: {},
  colHeaderOut: {},
  colTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
  },
  colEmoji: {
    fontSize: 18,
  },
  colTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  badgeNew: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeTextNew: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: Typography.weights.extraBold,
  },
  badgePacking: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeTextPacking: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: Typography.weights.extraBold,
  },
  badgeOut: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeTextOut: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: Typography.weights.extraBold,
  },
  colBodyScroll: {
    flex: 1,
  },
  emptyColBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: Spacing.lg,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
