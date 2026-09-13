/**
 * WhatsApp Rider Dispatch & Customer Updates Utility
 * ---------------------------------------------------
 * Generates formatted WhatsApp messages for instant delivery boy dispatch
 * and customer order confirmation via WhatsApp Web / App.
 */

import { Order } from '../types/schema';

export function formatRiderDispatchMessage(order: Order, storeName: string = 'Apna Kirana'): string {
  const itemsText = order.items
    .map((item, idx) => `   ${idx + 1}. ${item.productName} (${item.unit}) x ${item.quantity} = ₹${item.totalPrice}`)
    .join('\n');

  const paymentText = order.paymentMethod === 'COD'
    ? `💵 Collect Cash: ₹${order.finalTotal}`
    : `✅ Paid Online via UPI: ₹${order.finalTotal}`;

  return `🛵 *${storeName.toUpperCase()} - NEW DELIVERY ORDER*
━━━━━━━━━━━━━━━━━━━━━
📦 *Order ID:* ${order.id}
👤 *Customer:* ${order.customerName}
📞 *Call Customer:* tel:${order.customerPhone}

📍 *Delivery Address:*
${order.deliveryAddress.streetAddress}
${order.deliveryAddress.landmark ? `🏛️ Landmark: ${order.deliveryAddress.landmark}` : ''}
PIN: ${order.deliveryAddress.pincode}

🛒 *Items to Deliver:*
${itemsText}

💰 *Payment Status:*
${paymentText}
━━━━━━━━━━━━━━━━━━━━━
⚠️ *Delivery Target: 15-25 Mins. Drive Safely!*`;
}

export function getWhatsAppDispatchUrl(order: Order, riderPhone?: string, storeName?: string): string {
  const message = formatRiderDispatchMessage(order, storeName);
  const encoded = encodeURIComponent(message);
  
  if (riderPhone) {
    const cleanPhone = riderPhone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    return `https://wa.me/${phoneWithCountry}?text=${encoded}`;
  }
  
  return `https://wa.me/?text=${encoded}`;
}
