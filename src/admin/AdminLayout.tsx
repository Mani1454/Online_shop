import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { useStore } from './context/StoreContext';
import { LiveOrdersScreen } from './LiveOrdersScreen';
import { InventoryScreen } from './InventoryScreen';
import { Colors, Typography, Spacing, Shadows } from '../theme/colors';

export const AdminLayout: React.FC = () => {
  const { isStoreOpen, toggleStoreOpen, orders, products, isAudioRinging } =
    useStore();
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'INVENTORY' | 'SETTINGS'>(
    'ORDERS'
  );

  const activeOrdersCount = orders.filter(
    (o) => o.status === 'RECEIVED' || o.status === 'PREPARING'
  ).length;

  const outOfStockCount = products.filter((p) => !p.isInStock).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Top Header Bar for Counter Tablet */}
      <View style={styles.headerBar}>
        {/* Brand & Kiosk Title */}
        <View style={styles.brandGroup}>
          <Text style={styles.storeLogo}>🏪</Text>
          <View>
            <Text style={styles.storeTitle}>Apna Kirana</Text>
            <Text style={styles.portalSubtitle}>Shopkeeper Counter Portal</Text>
          </View>
        </View>

        {/* Master Store Open / Closed Toggle Switch */}
        <TouchableOpacity
          style={[
            styles.masterStoreToggle,
            isStoreOpen ? styles.toggleStoreOpen : styles.toggleStoreClosed,
          ]}
          onPress={toggleStoreOpen}
          activeOpacity={0.85}
          accessibilityRole="switch"
          accessibilityState={{ checked: isStoreOpen }}
          accessibilityLabel={`Store is currently ${
            isStoreOpen ? 'Open and accepting orders' : 'Closed'
          }. Tap to switch.`}
        >
          <View
            style={[
              styles.statusBulb,
              isStoreOpen ? styles.bulbOpen : styles.bulbClosed,
            ]}
          />
          <View>
            <Text style={styles.toggleMainText}>
              {isStoreOpen
                ? 'STORE OPEN (Accepting Orders)'
                : 'STORE PAUSED (Closed)'}
            </Text>
            <Text style={styles.toggleSubText}>
              {isStoreOpen
                ? 'Customers can place delivery orders'
                : 'Ordering disabled on customer app'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Navigation Tabs */}
        <View style={styles.navTabsGroup}>
          {/* Tab 1: Live Orders */}
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'ORDERS' && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab('ORDERS')}
            activeOpacity={0.8}
          >
            <Text style={styles.tabIcon}>📦</Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'ORDERS' && styles.tabLabelActive,
              ]}
            >
              Live Orders
            </Text>
            {activeOrdersCount > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  isAudioRinging && styles.tabBadgePulsing,
                ]}
              >
                <Text style={styles.tabBadgeText}>{activeOrdersCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Tab 2: Inventory & Stock */}
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'INVENTORY' && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab('INVENTORY')}
            activeOpacity={0.8}
          >
            <Text style={styles.tabIcon}>📋</Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'INVENTORY' && styles.tabLabelActive,
              ]}
            >
              Inventory
            </Text>
            {outOfStockCount > 0 && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockBadgeText}>
                  {outOfStockCount} out
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Screen Outlet */}
      <View style={styles.contentOutlet}>
        {activeTab === 'ORDERS' && <LiveOrdersScreen />}
        {activeTab === 'INVENTORY' && <InventoryScreen />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  headerBar: {
    backgroundColor: '#0F172A', // Slate 900
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  storeLogo: {
    fontSize: 32,
  },
  storeTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textWhite,
  },
  portalSubtitle: {
    fontSize: Typography.sizes.xs,
    color: '#94A3B8',
    fontWeight: Typography.weights.medium,
  },
  masterStoreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: 14,
    gap: Spacing.md,
    borderWidth: 2,
    ...Shadows.card,
  },
  toggleStoreOpen: {
    backgroundColor: '#064E3B', // Deep Emerald
    borderColor: '#10B981',
  },
  toggleStoreClosed: {
    backgroundColor: '#7F1D1D', // Deep Red
    borderColor: '#EF4444',
  },
  statusBulb: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  bulbOpen: {
    backgroundColor: '#34D399',
  },
  bulbClosed: {
    backgroundColor: '#F87171',
  },
  toggleMainText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.xs + 1,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.5,
  },
  toggleSubText: {
    color: '#E2E8F0',
    fontSize: 10,
    opacity: 0.8,
  },
  navTabsGroup: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: 10,
    gap: 8,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    color: '#94A3B8',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  tabLabelActive: {
    color: Colors.textWhite,
  },
  tabBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgePulsing: {
    backgroundColor: Colors.danger,
  },
  tabBadgeText: {
    color: Colors.textWhite,
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
  },
  outOfStockBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  outOfStockBadgeText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  contentOutlet: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
});
