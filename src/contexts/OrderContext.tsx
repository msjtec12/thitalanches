import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { ensureCustomerSession, getStaffSession } from '@/lib/auth';
import { secureDb } from '@/lib/secureDb';
import type { CashierLog, Category, Order, OrderStatus, Product, StoreSettings } from '@/types/order';

interface OrderContextType {
  orders: Order[];
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  isLoadingData: boolean;
  addOrder: (order: Omit<Order, 'id' | 'number' | 'createdAt'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updatePaymentStatus: (orderId: string, status: Order['paymentStatus'], method?: Order['paymentMethod']) => Promise<void>;
  attachPixProof: (orderId: string, proofDataUrl: string) => Promise<void>;
  updateScheduledTime: (orderId: string, time: string) => void;
  cancelOrder: (orderId: string) => void;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateSettings: (settings: StoreSettings) => Promise<void>;
  markOrderAsPrinted: (orderId: string) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  cashierLogs: CashierLog[];
  addCashierLog: (log: Omit<CashierLog, 'id'>) => void;
  userRole: 'admin' | 'employee';
  setUserRole: (role: 'admin' | 'employee') => void;
  refetchOrders: () => Promise<void>;
  refreshSessionRole: () => Promise<'admin' | 'employee' | null>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const defaultSettings: StoreSettings = {
  name: 'Thita Lanches',
  isOpen: true,
  isCashierOpen: false,
  prepTime: 30,
  deliveryRadius: 10,
  neighborhoods: [],
  openingHours: [],
  schedulingInterval: 15,
  storeCep: '14026596',
  storeStreet: 'R. Magda Perona Frossard',
  storeNumber: '565',
  storeCity: 'Ribeirão Preto',
  storeState: 'SP',
  storeLat: -21.2185116,
  storeLng: -47.8224098,
};

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error(`Timeout após ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]);
};

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cashierLogs, setCashierLogs] = useState<CashierLog[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('employee');
  const [isLoadingData, setIsLoadingData] = useState(true);

  const refreshSessionRole = async () => {
    const staff = await getStaffSession();
    if (!staff) {
      setUserRole('employee');
      return null;
    }
    setUserRole(staff.role);
    return staff.role;
  };

  const loadOrdersForCurrentSession = async () => {
    const staff = await getStaffSession();
    const data = staff ? await db.getOrders() : await secureDb.getOwnOrders();
    setOrders(data);
  };

  const refetchOrders = async () => {
    await loadOrdersForCurrentSession();
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoadingData(true);
      try {
        await ensureCustomerSession();
        const role = await refreshSessionRole();
        const [dbProducts, dbCategories, dbSettings] = await withTimeout(
          Promise.all([secureDb.getProducts(), db.getCategories(), db.getSettings()]),
          10000,
        );
        if (!active) return;
        setProducts(dbProducts);
        setCategories(dbCategories);
        if (dbSettings) setSettings({ ...defaultSettings, ...dbSettings });

        if (role) {
          const dbOrders = await db.getOrders();
          if (active) setOrders(dbOrders);
        } else {
          const ownOrders = await secureDb.getOwnOrders();
          if (active) setOrders(ownOrders);
        }
      } catch (error) {
        console.error('Falha ao inicializar o sistema:', error);
      } finally {
        if (active) setIsLoadingData(false);
      }
    };

    void load();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => {
        void refreshSessionRole().then(() => loadOrdersForCurrentSession());
      }, 0);
    });

    const channel = supabase
      .channel(`orders-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void loadOrdersForCurrentSession();
      })
      .subscribe();

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (orders.length === 0 || !settings.isSoundEnabled) return;
    void getStaffSession().then((staff) => {
      if (!staff) return;
      const lastOrder = orders[0];
      const isNew = Date.now() - new Date(lastOrder.createdAt).getTime() < 10000;
      if (lastOrder.status === 'received' && isNew) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        void audio.play().catch(() => undefined);
      }
    });
  }, [orders, settings.isSoundEnabled]);

  const addOrder = async (orderData: Omit<Order, 'id' | 'number' | 'createdAt'>) => {
    const staff = await getStaffSession();
    const newOrder = staff ? await db.createOrder(orderData) : await secureDb.createOrder(orderData);
    setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const previous = orders;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    try {
      await db.updateOrderStatus(orderId, status);
    } catch (error) {
      setOrders(previous);
      throw error;
    }
  };

  const updatePaymentStatus = async (orderId: string, status: Order['paymentStatus'], method?: Order['paymentMethod']) => {
    const previous = orders;
    setOrders((prev) => prev.map((o) => (
      o.id === orderId ? { ...o, paymentStatus: status, paymentMethod: method || o.paymentMethod } : o
    )));
    try {
      await db.updatePaymentStatus(orderId, status, method);
    } catch (error) {
      setOrders(previous);
      throw error;
    }
  };

  const attachPixProof = async (orderId: string, proofDataUrl: string) => {
    await secureDb.attachPixProof(orderId, proofDataUrl);
  };

  const updateScheduledTime = (orderId: string, time: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, scheduledTime: time } : o)));
  };

  const cancelOrder = (orderId: string) => {
    void updateOrderStatus(orderId, 'cancelled');
  };

  const updateProduct = async (updatedProduct: Product) => {
    const normalized = await secureDb.upsertProduct(updatedProduct);
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === updatedProduct.id);
      return exists ? prev.map((p) => (p.id === updatedProduct.id ? normalized : p)) : [...prev, normalized];
    });
  };

  const deleteProduct = async (productId: string) => {
    await db.deleteProduct(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const updateSettings = async (newSettings: StoreSettings) => {
    const ok = await db.updateSettings(newSettings);
    if (!ok) throw new Error('Não foi possível salvar as configurações.');
    setSettings(newSettings);
  };

  const markOrderAsPrinted = async (orderId: string) => {
    await db.markOrderAsPrinted(orderId);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, isPrinted: true } : o)));
  };

  const addCategory = async (category: Category) => {
    const created = await db.createCategory(category.name, categories.length + 1);
    if (!created) throw new Error('Não foi possível criar a categoria.');
    setCategories((prev) => [...prev, created]);
  };

  const updateCategory = async (updatedCategory: Category) => {
    await db.updateCategory(updatedCategory);
    if (updatedCategory.extraGroups) {
      await db.saveCategoryExtraGroups(updatedCategory.id, updatedCategory.extraGroups);
    }
    setCategories((prev) => prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c)));
  };

  const deleteCategory = async (categoryId: string) => {
    if (products.some((p) => p.categoryId === categoryId)) {
      throw new Error('Esta categoria está sendo usada por produtos e não pode ser excluída.');
    }
    await db.deleteCategory(categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  };

  const addCashierLog = (logData: Omit<CashierLog, 'id'>) => {
    setCashierLogs((prev) => [{ ...logData, id: `log-${Date.now()}` }, ...prev]);
  };

  return (
    <OrderContext.Provider value={{
      orders,
      products,
      categories,
      settings,
      isLoadingData,
      addOrder,
      updateOrderStatus,
      updatePaymentStatus,
      attachPixProof,
      updateScheduledTime,
      cancelOrder,
      updateProduct,
      deleteProduct,
      updateSettings,
      markOrderAsPrinted,
      addCategory,
      updateCategory,
      deleteCategory,
      cashierLogs,
      addCashierLog,
      userRole,
      setUserRole,
      refetchOrders,
      refreshSessionRole,
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
}
