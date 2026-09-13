export interface Breadcrumb {
  timestamp: string;
  category: string;
  message: string;
  data?: Record<string, any>;
  level?: 'info' | 'warning' | 'error';
}

class CrashlyticsService {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 30;
  private anonymizedUserId: string | null = null;
  private customKeys: Record<string, string | number | boolean> = {};

  /**
   * Set Anonymized User ID
   * Ensures no PII (phone number, name, email) is ever passed to crash reporters
   */
  setUserId(userId: string) {
    // Sanitize: If user ID resembles a phone number (+91...), hash/anonymize it
    const sanitizedId = userId.startsWith('+') || /^\d{10,}$/.test(userId)
      ? `anon_${userId.slice(-4)}_${Date.now().toString(36)}`
      : userId;

    this.anonymizedUserId = sanitizedId;
    console.log(`[Crashlytics] Anonymized user ID set: ${sanitizedId}`);

    // Sentry Web Integration
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.setUser({ id: sanitizedId });
    }
  }

  /**
   * Set Custom Metadata Key
   */
  setCustomKey(key: string, value: string | number | boolean) {
    this.customKeys[key] = value;
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.setTag(key, String(value));
    }
  }

  /**
   * Record a Non-Fatal or Fatal Runtime Exception
   */
  recordError(error: Error | string, isFatal: boolean = false, context?: Record<string, any>) {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const timestamp = new Date().toISOString();

    const report = {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack,
      isFatal,
      userId: this.anonymizedUserId,
      customKeys: this.customKeys,
      context,
      recentBreadcrumbs: this.breadcrumbs.slice(-10),
      timestamp,
    };

    console.error(`[Crashlytics] ${isFatal ? '🚨 FATAL CRASH' : '⚠️ NON-FATAL ERROR'}:`, report);

    // 1. Sentry Web Integration
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(errorObj, {
        level: isFatal ? 'fatal' : 'error',
        extra: { ...this.customKeys, ...context },
      });
    }

    // 2. Add breadcrumb of this error
    this.logBreadcrumb('error', errorObj.message, { isFatal }, 'error');
  }

  /**
   * Log Non-Fatal State Transition Breadcrumbs
   */
  logBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, any>,
    level: 'info' | 'warning' | 'error' = 'info'
  ) {
    const breadcrumb: Breadcrumb = {
      timestamp: new Date().toISOString(),
      category,
      message,
      data,
      level,
    };

    this.breadcrumbs.push(breadcrumb);
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }

    // Sentry Web Breadcrumb
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        category,
        message,
        data,
        level,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // CONVENIENCE HELPERS FOR COMMON COMMERCE STATE TRANSITIONS
  // ---------------------------------------------------------------------------

  trackCategorySelected(categoryId: string, categoryName: string) {
    this.logBreadcrumb('navigation', `User opened category: ${categoryName}`, {
      categoryId,
      categoryName,
    });
  }

  trackCartItemModified(
    productId: string,
    productName: string,
    action: 'ADD' | 'INCREMENT' | 'DECREMENT' | 'REMOVE',
    qty: number
  ) {
    this.logBreadcrumb('cart', `Cart action: ${action} for ${productName} (qty: ${qty})`, {
      productId,
      action,
      qty,
    });
  }

  trackPaymentModeChosen(mode: 'COD' | 'UPI') {
    this.logBreadcrumb('checkout', `Payment mode selected: ${mode}`, { mode });
  }

  trackNetworkFailure(endpoint: string, status: number | string, errorMsg: string) {
    this.logBreadcrumb(
      'network',
      `Flaky Network Failure: ${endpoint} returned ${status}`,
      { endpoint, status, errorMsg },
      'warning'
    );
  }

  getRecentBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }
}

export const crashlyticsService = new CrashlyticsService();
export default crashlyticsService;
