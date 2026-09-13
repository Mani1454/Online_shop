export type UserRole = 'customer' | 'shopkeeper' | 'delivery_partner';

export interface Address {
  id: string;
  userId: string;
  label: 'Home' | 'Shop' | 'Work' | 'Other';
  streetAddress: string;
  landmark?: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface User {
  id: string;
  role: UserRole;
  phone: string;
  name: string;
  email?: string;
  addresses?: Address[];
  fcmToken?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameLocalized?: string;
  iconName: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  nameLocalized?: string;
  description: string;
  unit: string;
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  isInStock: boolean;
  stockQuantity?: number;
  imageUrl: string;
  tags: string[];
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'RECEIVED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'COD' | 'UPI';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface OrderTimelineItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: Address;
  items: OrderItem[];
  itemTotal: number;
  deliveryFee: number;
  discountAmount: number;
  finalTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionRef?: string;
  status: OrderStatus;
  statusTimeline: OrderTimelineItem[];
  shopkeeperNotes?: string;
  deliveryPartner?: {
    name: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StoreConfig {
  id: string;
  storeName: string;
  isStoreOpen: boolean;
  minOrderFreeDelivery: number;
  standardDeliveryFee: number;
  deliveryRadiusKm: number;
  storeCoordinates: {
    latitude: number;
    longitude: number;
  };
  upiVpa: string;
  contactPhone: string;
}
