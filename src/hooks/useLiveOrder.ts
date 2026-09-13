import { useState, useEffect, useMemo } from 'react';
import { Order, OrderStatus } from '../types/schema';

export interface UseLiveOrderResult {
  order: Order | null;
  currentStepIndex: number;
  etaText: string;
  etaSubtext: string;
  isDelivered: boolean;
  isCancelled: boolean;
  statusColor: string;
}

export const ORDER_STEPS: {
  status: OrderStatus;
  title: string;
  titleLocalized: string;
  subtitle: string;
  icon: string;
}[] = [
  {
    status: 'RECEIVED',
    title: 'Order Received',
    titleLocalized: 'ऑर्डर प्राप्त हुआ',
    subtitle: 'Storekeeper has received your order and is verifying items',
    icon: '✓',
  },
  {
    status: 'PREPARING',
    title: 'Preparing in Store',
    titleLocalized: 'सामान पैक किया जा रहा है',
    subtitle: 'Items are being packed fresh into your delivery bag',
    icon: '📦',
  },
  {
    status: 'OUT_FOR_DELIVERY',
    title: 'Out for Delivery',
    titleLocalized: 'डिलीवरी बॉय निकल चुका है',
    subtitle: 'Delivery partner is on the way to your address',
    icon: '🛵',
  },
  {
    status: 'DELIVERED',
    title: 'Delivered',
    titleLocalized: 'सामान डिलीवर हो गया',
    subtitle: 'Delivered safely at your doorstep',
    icon: '🏠',
  },
];

/**
 * Custom hook that tracks an order's status in real-time,
 * deriving dynamic ETAs, active step indices, and status messages.
 */
export function useLiveOrder(
  activeOrder: Order | null,
  ordersList?: Order[]
): UseLiveOrderResult {
  // If activeOrder ID is known and an updated ordersList is provided,
  // find the latest version from the live store state
  const order = useMemo(() => {
    if (!activeOrder) return null;
    if (!ordersList) return activeOrder;
    const found = ordersList.find((o) => o.id === activeOrder.id);
    return found || activeOrder;
  }, [activeOrder, ordersList]);

  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    const idx = ORDER_STEPS.findIndex((s) => s.status === order.status);
    return idx >= 0 ? idx : 0;
  }, [order?.status]);

  const { etaText, etaSubtext } = useMemo(() => {
    if (!order) return { etaText: '--', etaSubtext: '' };

    switch (order.status) {
      case 'RECEIVED':
        return {
          etaText: 'Within 1 Hour',
          etaSubtext: 'Awaiting shopkeeper packing confirmation',
        };
      case 'PREPARING':
        return {
          etaText: '35 - 45 Mins',
          etaSubtext: 'Shopkeeper is packing your carry bag right now',
        };
      case 'OUT_FOR_DELIVERY':
        return {
          etaText: '15 - 20 Mins',
          etaSubtext: 'Rider is on the way heading to your address!',
        };
      case 'DELIVERED':
        return {
          etaText: 'Delivered ✓',
          etaSubtext: 'Order completed. Enjoy your groceries!',
        };
      case 'CANCELLED':
        return {
          etaText: 'Order Cancelled',
          etaSubtext: 'This order was cancelled by the store',
        };
      default:
        return {
          etaText: '15 - 20 Mins',
          etaSubtext: 'Standard neighborhood delivery',
        };
    }
  }, [order?.status]);

  const statusColor = useMemo(() => {
    switch (order?.status) {
      case 'RECEIVED':
        return '#DC2626'; // Alerting red
      case 'PREPARING':
        return '#D97706'; // Amber
      case 'OUT_FOR_DELIVERY':
        return '#2563EB'; // Blue
      case 'DELIVERED':
        return '#16A34A'; // Green
      default:
        return '#64748B';
    }
  }, [order?.status]);

  return {
    order,
    currentStepIndex,
    etaText,
    etaSubtext,
    isDelivered: order?.status === 'DELIVERED',
    isCancelled: order?.status === 'CANCELLED',
    statusColor,
  };
}

export { useCustomerLiveOrderRealtime } from './useCustomerLiveOrderRealtime';
