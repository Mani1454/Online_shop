import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { app, db, isFirebaseConfigured } from './firebaseConfig';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'ORDER_OUT_FOR_DELIVERY' | 'ORDER_RECEIVED' | 'ORDER_DELIVERED' | 'GENERAL';
  timestamp: string;
  orderId?: string;
}

type NotificationListener = (notification: AppNotification) => void;

class NotificationService {
  private messaging: Messaging | null = null;
  private listeners: NotificationListener[] = [];
  private currentToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined' && isFirebaseConfigured()) {
      try {
        this.messaging = getMessaging(app);
      } catch (err) {
        console.warn('[NotificationService] FCM messaging initialization warning:', err);
      }
    }
  }

  /**
   * Request Notification Permission & Register FCM Token
   * Saves device token to user's Firestore document
   */
  async registerForPushNotifications(userId: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    try {
      // 1. Request Browser / Device Permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('[NotificationService] Notification permission was not granted.');
          return null;
        }
      }

      // 2. Fetch FCM Token if Firebase is configured
      if (this.messaging && isFirebaseConfigured()) {
        const vapidKey = process.env.VITE_FIREBASE_VAPID_KEY || 'BPMockVapidKeyForNeighborhoodStore123456';
        const token = await getToken(this.messaging, { vapidKey });
        
        if (token) {
          this.currentToken = token;
          console.log('[NotificationService] Generated FCM Device Token:', token);

          // Save token to users collection
          const userDocRef = doc(db, 'users', userId);
          await updateDoc(userDocRef, {
            fcm_token: token,
            updated_at: serverTimestamp(),
          });

          return token;
        }
      } else {
        // Mock token for demo & development
        const mockToken = `fcm_mock_token_${userId.slice(0, 8)}_${Date.now()}`;
        this.currentToken = mockToken;
        console.log('[NotificationService] Registered demo push token:', mockToken);
        return mockToken;
      }
    } catch (err) {
      console.warn('[NotificationService] Push registration error:', err);
    }
    return null;
  }

  /**
   * Listen to Foreground Incoming Messages
   */
  initForegroundListener() {
    if (this.messaging && isFirebaseConfigured()) {
      onMessage(this.messaging, (payload) => {
        console.log('[NotificationService] Received foreground FCM message:', payload);
        const notification: AppNotification = {
          id: payload.messageId || `msg_${Date.now()}`,
          title: payload.notification?.title || 'Apna Kirana Update',
          body: payload.notification?.body || 'Your order status has changed.',
          type: (payload.data?.type as any) || 'GENERAL',
          timestamp: new Date().toISOString(),
          orderId: payload.data?.orderId,
        };

        this.notifySubscribers(notification);
        this.showNativeNotification(notification.title, notification.body);
      });
    }
  }

  /**
   * Triggers an in-app or system notification for delivery updates
   */
  triggerOrderDeliveryNotification(orderId: string, riderName = 'Ramesh') {
    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: '🛵 Order Out for Delivery!',
      body: `${riderName} is on the way with your grocery bag. Arriving in 5-10 minutes!`,
      type: 'ORDER_OUT_FOR_DELIVERY',
      timestamp: new Date().toISOString(),
      orderId,
    };

    this.notifySubscribers(notif);
    this.showNativeNotification(notif.title, notif.body);
  }

  /**
   * Triggers an in-app or system notification for new incoming orders (Shopkeeper)
   */
  triggerNewOrderNotification(orderId: string, customerName: string, amount: number) {
    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: '🚨 New Order Received!',
      body: `${customerName} placed order ${orderId} (₹${amount}). Tap to start packing.`,
      type: 'ORDER_RECEIVED',
      timestamp: new Date().toISOString(),
      orderId,
    };

    this.notifySubscribers(notif);
    this.showNativeNotification(notif.title, notif.body);
  }

  /**
   * Displays native system notification when browser/app is in background
   */
  private showNativeNotification(title: string, body: string) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=100&q=80',
          });
        } catch (e) {}
      }
    }
  }

  /**
   * Subscribe in-app components to receive toast notifications
   */
  subscribe(callback: NotificationListener): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifySubscribers(notification: AppNotification) {
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (err) {
        console.error('[NotificationService] Listener callback error:', err);
      }
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
