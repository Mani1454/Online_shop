import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { OrdersDashboard } from './OrdersDashboard';
import { InventoryScreen } from './InventoryScreen';
import { SettingsScreen } from './SettingsScreen';
import { Colors, Typography, Spacing, Shadows } from '../../theme/colors';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'INVENTORY' | 'SETTINGS'>(
    'ORDERS'
  );
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Counter Kiosk Top Navigation Bar */}
      <View style={styles.topHeader}>
        <View style={styles.brandTitleRow}>
          <Text style={styles.brandEmoji}>🏪</Text>
          <View>
            <Text style={styles.brandTitle}>Apna Kirana</Text>
            <Text style={styles.brandSubtitle}>Counter Kiosk & Tablet Portal</Text>
          </View>
        </View>

        {/* Master Store Status Pill */}
        <TouchableOpacity
          style={[
            styles.statusPill,
            isStoreOpen ? styles.statusPillOpen : styles.statusPillClosed,
          ]}
          onPress={() => setIsStoreOpen(!isStoreOpen)}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.statusDot,
              isStoreOpen ? styles.statusDotOpen : styles.statusDotClosed,
            ]}
          />
          <Text style={styles.statusPillText}>
            {isStoreOpen ? 'STORE OPEN' : 'STORE CLOSED'}
          </Text>
        </TouchableOpacity>

        {/* Main Nav Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'ORDERS' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('ORDERS')}
          >
            <Text style={styles.tabIcon}>📦</Text>
            <Text
              style={[
                styles.tabText,
                activeTab === 'ORDERS' && styles.tabTextActive,
              ]}
            >
              Live Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'INVENTORY' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('INVENTORY')}
          >
            <Text style={styles.tabIcon}>📋</Text>
            <Text
              style={[
                styles.tabText,
                activeTab === 'INVENTORY' && styles.tabTextActive,
              ]}
            >
              Inventory
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'SETTINGS' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('SETTINGS')}
          >
            <Text style={styles.tabIcon}>⚙️</Text>
            <Text
              style={[
                styles.tabText,
                activeTab === 'SETTINGS' && styles.tabTextActive,
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Body */}
      <View style={styles.screenBody}>
        {activeTab === 'ORDERS' && <OrdersDashboard />}
        {activeTab === 'INVENTORY' && <InventoryScreen />}
        {activeTab === 'SETTINGS' && <SettingsScreen />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topHeader: {
    backgroundColor: '#0F172A',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  brandEmoji: {
    fontSize: 28,
  },
  brandTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textWhite,
  },
  brandSubtitle: {
    fontSize: Typography.sizes.xs - 1,
    color: '#94A3B8',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
  },
  statusPillOpen: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  statusPillClosed: {
    backgroundColor: '#7F1D1D',
    borderColor: '#EF4444',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotOpen: {
    backgroundColor: '#34D399',
  },
  statusDotClosed: {
    backgroundColor: '#F87171',
  },
  statusPillText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: 10,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabText: {
    color: '#94A3B8',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  tabTextActive: {
    color: Colors.textWhite,
  },
  screenBody: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
});
