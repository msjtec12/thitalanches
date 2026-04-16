export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number; // Mandatory for reports
  isActive: boolean;
  categoryId: string;
  image?: string;
  isCombo?: boolean;
  comboItems?: string[]; // IDs of products that are part of this combo
  sortOrder: number;
  disabledExtraIds?: string[]; // IDs of extra items disabled for this specific product
}

// ── Complementos estilo iFood ──────────────────────────
// Grupo de complementos (ex: "Escolha o molho", "Adicionais")
export interface ExtraGroup {
  id: string;
  name: string;       // Nome do grupo (ex: "Adicionais de carne")
  minQty: number;     // Mínimo de itens (0 = opcional)
  maxQty: number;     // Máximo de itens (0 = ilimitado)
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  items: ExtraItem[];
}

// Item individual dentro de um grupo
export interface ExtraItem {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

// Alias for backward compatibility in cart/order serialization
export type ProductExtra = ExtraItem;
export type CategoryExtra = ExtraItem; // backward compat

export interface Category {
  id: string;
  name: string;
  order: number;
  photoUrl?: string;
  isActive: boolean;
  extraGroups?: ExtraGroup[];
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedExtras: ProductExtra[]; // flat list for price calculation
  observation: string;
}

export type OrderOrigin = 'online' | 'counter' | 'table' | 'ifood' | 'counter_qr';
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

export type AddressType = 'casa' | 'apartamento' | 'outros';

export interface DeliveryInfo {
  cep?: string;
  addressType?: AddressType;
  street: string;
  number: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  complement?: string;
  reference?: string;
  deliveryFee: number;
  estimatedTime: number; // in minutes
  distanceKm?: number;
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
  storeCep?: string;
  storeStreet?: string;
  storeNumber?: string;
  storeCity?: string;
  storeState?: string;
  storeLat?: number;
  storeLng?: number;
  openingHours: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
  }[];
  whatsappNumber?: string;
  schedulingInterval: number; // in minutes
  adminPin?: string;
  isStreetValidationEnabled?: boolean;
  // Branding
  logoUrl?: string;
  primaryColor?: string; // Hex color
  primaryColorHover?: string;
  // Notifications
  isSoundEnabled?: boolean;
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
