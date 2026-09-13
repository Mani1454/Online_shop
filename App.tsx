import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/Auth/LoginScreen';
import { AdminPortal } from './src/screens/admin/AdminPortal';
import { HomeScreen } from './src/screens/HomeScreen';
import { CartScreen } from './src/screens/CartScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { OrderTrackingScreen } from './src/screens/OrderTrackingScreen';
import { OrderHistoryScreen } from './src/screens/OrderHistoryScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineBanner } from './src/hooks/useNetworkStatus';
import { analyticsService } from './src/services/AnalyticsService';
import { crashlyticsService } from './src/services/CrashlyticsService';
import { CartItem, Product, Order, OrderItem } from './src/types/schema';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './src/services/firebaseConfig';

const INITIAL_PAST_ORDERS: Order[] = [
  {
    id: '#ORD-1045',
    customerId: 'user_1',
    customerName: 'Rohit Kumar',
    customerPhone: '+919876543210',
    deliveryAddress: {
      id: 'addr_1',
      userId: 'user_1',
      label: 'Home',
      streetAddress: 'Flat 302, Green Valley Apartments, Pocket 2',
      landmark: 'Near Community Park Gate 1',
      pincode: '110001',
      isDefault: true,
    },
    items: [
      {
        id: 'item_past_1',
        productId: 'prod_1',
        productName: 'Aashirvaad Shudh Chakki Atta',
        unit: '5 kg',
        quantity: 1,
        unitPrice: 245,
        totalPrice: 245,
      },
      {
        id: 'item_past_2',
        productId: 'prod_3',
        productName: 'Amul Taaza Toned Fresh Milk',
        unit: '500 ml',
        quantity: 2,
        unitPrice: 27,
        totalPrice: 54,
      },
    ],
    itemTotal: 299,
    deliveryFee: 0,
    discountAmount: 0,
    finalTotal: 299,
    paymentMethod: 'UPI',
    paymentStatus: 'COMPLETED',
    status: 'DELIVERED',
    statusTimeline: [
      {
        status: 'DELIVERED',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

function AppContent() {
  const { isAuthenticated, userProfile, role, signOut } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<
    'HOME' | 'CART' | 'CHECKOUT' | 'TRACKING' | 'HISTORY' | 'LOGIN' | 'ADMIN'
  >('HOME');
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [orders, setOrders] = useState<Order[]>(INITIAL_PAST_ORDERS);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // 1. Rehydrate Cart from Local Device Storage on Mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('apna_kirana_cart');
        if (saved) {
          setCart(JSON.parse(saved));
        }
      }
    } catch (e) {}
  }, []);

  // 2. Persist Cart & Dispatch cart_updated Telemetry
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('apna_kirana_cart', JSON.stringify(cart));
      }
      const total = Object.values(cart).reduce(
        (sum, it) => sum + it.product.sellingPrice * it.quantity,
        0
      );
      const count = Object.values(cart).reduce((sum, it) => sum + it.quantity, 0);
      if (count > 0) {
        analyticsService.logCartUpdated({
          cartTotal: total,
          itemCount: count,
          qualifiesForFreeDelivery: total >= 150,
        });
      }
    } catch (e) {}
  }, [cart]);

  // 3. Connect Anonymized User Session to Telemetry
  useEffect(() => {
    if (userProfile?.uid) {
      analyticsService.setUserId(userProfile.uid);
      crashlyticsService.setUserId(userProfile.uid);
      crashlyticsService.setCustomKey('userRole', role);
    }
  }, [userProfile, role]);

  // Track screen transitions as breadcrumbs
  useEffect(() => {
    analyticsService.logScreenView(currentScreen);
    crashlyticsService.logBreadcrumb('navigation', `Screen switched to: ${currentScreen}`);
  }, [currentScreen]);

  // 4. Real-time active order subscription from Firestore (Admin -> Customer updates)
  useEffect(() => {
    if (!activeOrder?.id || !isFirebaseConfigured()) return;
    const cleanId = activeOrder.id.replace('#', '');
    try {
      const unsub = onSnapshot(
        doc(db, 'orders', cleanId),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const remoteStatus = data.status;
            if (remoteStatus && remoteStatus !== activeOrder.status) {
              console.log('🔄 Live order status update received from store:', remoteStatus);
              setActiveOrder((prev) => (prev ? { ...prev, status: remoteStatus } : null));
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === activeOrder.id ? { ...o, status: remoteStatus } : o
                )
              );
            }
          }
        },
        (err) => {
          console.warn('Live order listener note:', err.message);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Live order listener setup note:', e);
    }
  }, [activeOrder?.id, activeOrder?.status]);

  // If not authenticated, render LoginScreen directly
  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => setCurrentScreen('HOME')} />;
  }

  // If user is Admin and Admin view is selected
  if (role === 'admin' && currentScreen === 'ADMIN') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <View style={appStyles.authBar}>
          <Text style={appStyles.authBarText}>
            {`💼 ${userProfile?.name || 'Shopkeeper'} (${userProfile?.phone_number || ''})`}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setCurrentScreen('HOME')}
              style={appStyles.authBarButton}
            >
              <Text style={appStyles.authBarButtonText}>📱 Customer View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => signOut()}
              style={[appStyles.authBarButton, { backgroundColor: '#451A1A' }]}
            >
              <Text style={[appStyles.authBarButtonText, { color: '#FCA5A5' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
        <AdminPortal />
      </View>
    );
  }

  // Cart manipulation handlers
  const handleAddToCart = (product: Product) => {
    crashlyticsService.trackCartItemModified(product.id, product.name, 'ADD', 1);
    analyticsService.logProductViewed({
      productId: product.id,
      category: product.categoryId,
      isInStock: product.isInStock,
    });
    setCart((prev) => ({
      ...prev,
      [product.id]: { product, quantity: 1 },
    }));
  };

  const handleIncrement = (productOrId: Product | string) => {
    const id = typeof productOrId === 'string' ? productOrId : productOrId.id;
    crashlyticsService.trackCartItemModified(id, '', 'INCREMENT', 1);
    setCart((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      return {
        ...prev,
        [id]: { ...existing, quantity: existing.quantity + 1 },
      };
    });
  };

  const handleDecrement = (productOrId: Product | string) => {
    const id = typeof productOrId === 'string' ? productOrId : productOrId.id;
    crashlyticsService.trackCartItemModified(id, '', 'DECREMENT', 1);
    setCart((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return {
        ...prev,
        [id]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const handleRemoveItem = (productId: string) => {
    crashlyticsService.trackCartItemModified(productId, '', 'REMOVE', 0);
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handleClearCart = () => {
    crashlyticsService.logBreadcrumb('cart', 'Cart cleared by user');
    setCart({});
  };

  const handleOrderPlaced = async (newOrder: Order) => {
    analyticsService.logOrderPlaced({
      orderId: newOrder.id,
      totalAmount: newOrder.finalTotal,
      paymentMethod: newOrder.paymentMethod,
      itemsCount: newOrder.items.length,
    });
    crashlyticsService.logBreadcrumb('order', `Order placed: ${newOrder.id}`);
    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    setCart({});
    setCurrentScreen('TRACKING');

    // Sync to Firestore so Shopkeeper Admin counter tablet chimes and receives it live
    if (isFirebaseConfigured()) {
      try {
        const cleanId = newOrder.id.replace('#', '');
        const orderRef = doc(db, 'orders', cleanId);
        await setDoc(orderRef, {
          order_id: newOrder.id,
          customer_uid: newOrder.customerId || userProfile?.uid || 'cust_user_001',
          customer_name: newOrder.customerName || userProfile?.name || 'Customer',
          customer_phone: newOrder.customerPhone || userProfile?.phone_number || '+919876543210',
          delivery_address: newOrder.deliveryAddress,
          items: newOrder.items.map((it) => ({
            product_id: it.productId,
            name: it.productName,
            unit_size: it.unit,
            quantity: it.quantity,
            selling_price: it.unitPrice,
            subtotal: it.totalPrice,
            image_url: it.imageUrl || '',
          })),
          item_total: newOrder.itemTotal,
          delivery_fee: newOrder.deliveryFee,
          discount_amount: newOrder.discountAmount,
          total_amount: newOrder.finalTotal,
          final_total: newOrder.finalTotal,
          payment_method: newOrder.paymentMethod,
          payment_status: newOrder.paymentStatus,
          transaction_ref: newOrder.transactionRef || '',
          status: 'RECEIVED',
          status_timeline: [
            {
              status: 'RECEIVED',
              timestamp: new Date().toISOString(),
              note: 'Order placed by customer via mobile app',
            },
          ],
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        console.log('✅ Order synced to Firestore collection orders:', cleanId);
      } catch (err: any) {
        console.warn('⚠️ Firestore order write note:', err.message);
      }
    }
  };

  const handleTrackOrder = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (target) {
      setActiveOrder(target);
      setCurrentScreen('TRACKING');
    }
  };

  const handleReorder = (items: OrderItem[]) => {
    analyticsService.logOneTapReorderClicked({
      sourceOrderId: 'past_order',
      reorderedItemsCount: items.length,
    });
    crashlyticsService.logBreadcrumb('order', `Reorder triggered for ${items.length} items`);
    const newCart: Record<string, CartItem> = {};
    items.forEach((item) => {
      newCart[item.productId] = {
        product: {
          id: item.productId,
          categoryId: 'groceries',
          name: item.productName,
          description: '',
          unit: item.unit,
          mrp: item.unitPrice,
          sellingPrice: item.unitPrice,
          discountPercent: 0,
          isInStock: true,
          imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
          tags: [],
          isActive: true,
        },
        quantity: item.quantity,
      };
    });
    setCart(newCart);
    setCurrentScreen('CART');
  };

  // Render Customer Screen with persistent auth header bar
  const renderScreen = () => {
    switch (currentScreen) {
      case 'CART':
        return (
          <CartScreen
            cart={cart}
            onIncrement={(id) => handleIncrement(id)}
            onDecrement={(id) => handleDecrement(id)}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onProceedToCheckout={() => setCurrentScreen('CHECKOUT')}
            onContinueShopping={() => setCurrentScreen('HOME')}
          />
        );

      case 'CHECKOUT':
        return (
          <CheckoutScreen
            cart={cart}
            onBackToCart={() => setCurrentScreen('CART')}
            onOrderPlaced={handleOrderPlaced}
            onTrackOrder={handleTrackOrder}
          />
        );

      case 'TRACKING':
        if (!activeOrder) {
          return (
            <HomeScreen
              cart={cart}
              onAddToCart={handleAddToCart}
              onIncrement={(p) => handleIncrement(p.id)}
              onDecrement={(p) => handleDecrement(p.id)}
              onViewCart={() => setCurrentScreen('CART')}
            />
          );
        }
        return (
          <OrderTrackingScreen
            order={activeOrder}
            liveOrdersList={orders}
            onBackToHome={() => setCurrentScreen('HOME')}
            onViewOrderHistory={() => setCurrentScreen('HISTORY')}
          />
        );

      case 'HISTORY':
        return (
          <OrderHistoryScreen
            orders={orders}
            onReorder={handleReorder}
            onTrackOrder={(ord) => {
              setActiveOrder(ord);
              setCurrentScreen('TRACKING');
            }}
            onBackToHome={() => setCurrentScreen('HOME')}
          />
        );

      case 'HOME':
      default:
        return (
          <HomeScreen
            cart={cart}
            onAddToCart={handleAddToCart}
            onIncrement={(p) => handleIncrement(p.id)}
            onDecrement={(p) => handleDecrement(p.id)}
            onViewCart={() => setCurrentScreen('CART')}
          />
        );
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Persistent Auth Top Bar */}
      <View style={appStyles.authBar}>
        <Text style={appStyles.authBarText}>
          {`👤 ${userProfile?.name || 'Customer'} (${userProfile?.phone_number || ''})`}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {role === 'admin' && (
            <TouchableOpacity
              onPress={() => setCurrentScreen('ADMIN')}
              style={[appStyles.authBarButton, { backgroundColor: '#064E3B' }]}
            >
              <Text style={[appStyles.authBarButtonText, { color: '#A7F3D0' }]}>💻 Counter Tablet</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => signOut()}
            style={[appStyles.authBarButton, { backgroundColor: '#334155' }]}
          >
            <Text style={appStyles.authBarButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
      <OfflineBanner />
      {renderScreen()}
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

const appStyles = StyleSheet.create({
  authBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#090D16',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  authBarText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  authBarButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  authBarButtonText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
});
