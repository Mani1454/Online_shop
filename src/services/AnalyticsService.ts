export interface ProductViewedEvent {
  productId: string;
  category: string;
  isInStock: boolean;
}

export interface CartUpdatedEvent {
  cartTotal: number;
  itemCount: number;
  qualifiesForFreeDelivery: boolean;
}

export interface CheckoutStartedEvent {
  subtotal: number;
  deliveryFee: number;
  addressType: 'Home' | 'Work' | 'Shop' | 'Other';
}

export interface OrderPlacedEvent {
  orderId: string;
  totalAmount: number;
  paymentMethod: 'COD' | 'UPI';
  itemsCount: number;
}

export interface OneTapReorderClickedEvent {
  sourceOrderId: string;
  reorderedItemsCount: number;
}

export interface OrderLifecycleDurationEvent {
  orderId: string;
  durationMinutes: number;
  finalStatus: string;
}

class AnalyticsService {
  private anonymizedUserId: string = 'anon_guest';
  private eventLog: Array<{ event: string; params: any; timestamp: string }> = [];

  /**
   * Set Anonymized User ID
   * Strictly redacts any phone numbers or personal names before assigning.
   */
  setUserId(userId: string) {
    // Redact if phone number format
    if (userId.startsWith('+') || /^\d{10,}$/.test(userId)) {
      this.anonymizedUserId = `anon_${userId.slice(-4)}_${Date.now().toString(36)}`;
    } else {
      this.anonymizedUserId = userId;
    }
  }

  /**
   * Strict PII Sanitization Guard
   * Strips phone numbers, email addresses, street addresses, and UPI IDs
   */
  private sanitizeParams(params: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, val] of Object.entries(params)) {
      // Skip sensitive keys
      if (['phone', 'phoneNumber', 'customerPhone', 'address', 'streetAddress', 'upiId', 'vpa'].includes(key)) {
        continue;
      }

      if (typeof val === 'string') {
        // Redact phone number patterns (+91... or 10 digits)
        const redacted = val
          .replace(/(\+91|91)?[6-9]\d{9}/g, '[REDACTED_PHONE]')
          .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
          .replace(/[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}/g, '[REDACTED_UPI]');
        sanitized[key] = redacted;
      } else {
        sanitized[key] = val;
      }
    }

    return sanitized;
  }

  /**
   * Core tracking dispatcher
   */
  private track(eventName: string, params: Record<string, any> = {}) {
    const sanitizedParams = this.sanitizeParams({
      ...params,
      user_id: this.anonymizedUserId,
      app_platform: typeof window !== 'undefined' ? 'web' : 'native',
    });

    const timestamp = new Date().toISOString();
    this.eventLog.push({ event: eventName, params: sanitizedParams, timestamp });
    if (this.eventLog.length > 50) this.eventLog.shift();

    console.log(`[Analytics] 📊 Event: ${eventName}`, sanitizedParams);

    // 1. PostHog Web Integration
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(eventName, sanitizedParams);
    }

    // 2. Firebase Analytics Web Integration
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, sanitizedParams);
    }
  }

  // ---------------------------------------------------------------------------
  // TYPE-SAFE FUNNEL EVENT DISPATCHERS
  // ---------------------------------------------------------------------------

  logProductViewed(params: ProductViewedEvent) {
    this.track('product_viewed', {
      product_id: params.productId,
      category: params.category,
      is_in_stock: params.isInStock,
    });
  }

  logCartUpdated(params: CartUpdatedEvent) {
    this.track('cart_updated', {
      cart_total: params.cartTotal,
      item_count: params.itemCount,
      qualifies_for_free_delivery: params.qualifiesForFreeDelivery,
    });
  }

  logCheckoutStarted(params: CheckoutStartedEvent) {
    this.track('checkout_started', {
      subtotal: params.subtotal,
      delivery_fee: params.deliveryFee,
      address_type: params.addressType,
    });
  }

  logOrderPlaced(params: OrderPlacedEvent) {
    this.track('order_placed', {
      order_id: params.orderId,
      total_amount: params.totalAmount,
      payment_method: params.paymentMethod,
      items_count: params.itemsCount,
    });
  }

  logOneTapReorderClicked(params: OneTapReorderClickedEvent) {
    this.track('one_tap_reorder_clicked', {
      source_order_id: params.sourceOrderId,
      reordered_items_count: params.reorderedItemsCount,
    });
  }

  logOrderLifecycleDuration(params: OrderLifecycleDurationEvent) {
    this.track('order_lifecycle_duration', {
      order_id: params.orderId,
      duration_minutes: params.durationMinutes,
      final_status: params.finalStatus,
    });
  }

  logScreenView(screenName: string) {
    this.track('screen_view', { screen_name: screenName });
  }

  getRecentEvents() {
    return [...this.eventLog];
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
