export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice?: number;
  isActive: boolean;
  categoryId: string;
  image?: string;
  extras?: ProductExtra[];
}

export interface ProductExtra {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedExtras: ProductExtra[];
  observation: string;
}

export type OrderOrigin = 'online' | 'counter' | 'table' | 'ifood';
export type PickupType = 'immediate' | 'scheduled' | 'delivery';
export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentMethod = 'pix' | 'card' | 'credit_card' | 'debit_card' | 'cash';
export type PaymentStatus = 'pending' | 'paid';

export interface neighborhood {
  id: string;
  name: string;
  deliveryFee: number;
  estimatedDistanceKm: number;
  allowedStreets?: string[];
}

export interface DeliveryInfo {
  neighborhoodId: string;
  street: string;
  number: string;
  complement?: string;
  reference?: string;
  deliveryFee: number;
  estimatedTime: number; // in minutes
}

export interface Order {
  id: string;
  number: number;
  origin: OrderOrigin;
  pickupType: PickupType;
  scheduledTime?: string;
  customerName: string;
  customerPhone?: string;
  tableNumber?: string;
  deliveryInfo?: DeliveryInfo;
  items: CartItem[];
  generalObservation: string;
  internalObservation?: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: Date;
  isPrinted?: boolean;
}

export interface StoreSettings {
  name: string;
  isOpen: boolean;
  isCashierOpen: boolean;
  prepTime: number; // in minutes
  neighborhoods: neighborhood[];
  deliveryRadius: number; // in km
  openingHours: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
  }[];
  whatsappNumber?: string;
  schedulingInterval: number; // in minutes
  adminPin?: string;
  isStreetValidationEnabled?: boolean;
}

export interface CashierLog {
  id: string;
  type: 'open' | 'close';
  timestamp: Date;
  value: number; // For open, it's initial change; for close, it's final count
  responsible: string;
  note?: string;
  // Summary fields (only for 'close')
  summary?: {
    pix: number;
    cash: number;
    credit: number;
    debit: number;
    delivery: number;
    counter: number;
    online: number;
    totalOrders: number;
    totalSales: number;
  };
}

