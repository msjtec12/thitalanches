import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Order, OrderStatus, Product, StoreSettings, Category, CashierLog } from '@/types/order';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface OrderContextType {
  orders: Order[];
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  isLoadingData: boolean;
  addOrder: (order: Omit<Order, 'id' | 'number' | 'createdAt'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updatePaymentStatus: (orderId: string, status: Order['paymentStatus'], method?: Order['paymentMethod']) => void;
  updateScheduledTime: (orderId: string, time: string) => void;
  cancelOrder: (orderId: string) => void;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateSettings: (settings: StoreSettings) => void;
  markOrderAsPrinted: (orderId: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  cashierLogs: CashierLog[];
  addCashierLog: (log: Omit<CashierLog, 'id'>) => void;
  userRole: 'admin' | 'employee';
  setUserRole: (role: 'admin' | 'employee') => void;
  refetchOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Default settings to avoid breakages during loading
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
  storeLng: -47.8224098
};

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cashierLogs, setCashierLogs] = useState<CashierLog[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('employee');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Utilitário: timeout para qualquer Promise
  const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout após ${ms}ms`)), ms)
    );
    return Promise.race([promise, timeout]);
  };

  // Load from Supabase on init
  useEffect(() => {
    let attempt = 0;

    const loadPublicData = () =>
      withTimeout(
        Promise.all([db.getProducts(), db.getCategories(), db.getSettings()]),
        8000
      );

    const fetchData = async () => {
      if (attempt === 0) setIsLoadingData(true);
      try {
        // 1. Fetch Public Data com timeout de 8s
        const [dbProducts, dbCategories, dbSettings] = await loadPublicData();

        setProducts(dbProducts);
        setCategories(dbCategories);
        if (dbSettings) {
          setSettings({
            ...dbSettings,
            // Valores fixos do endereço solicitados (Substitui o que vem do banco pois a tabela pode não ter essas colunas ativas ainda)
            storeCep: '14026596',
            storeStreet: 'R. Magda Perona Frossard',
            storeNumber: '565',
            storeCity: 'Ribeirão Preto',
            storeState: 'SP',
            storeLat: -21.2185116,
            storeLng: -47.8224098
          });
        }

        // 2. Conditional data fetch based on role
        const isAdmin = sessionStorage.getItem('admin_authenticated') === 'true';
        if (isAdmin) {
          setUserRole('admin');
          const dbOrders = await db.getOrders();
          setOrders(dbOrders);
        } else {
          // For customers, check if they are tracking a specific order
          const params = new URLSearchParams(window.location.search);
          const trackingId = params.get('order');
          if (trackingId) {
            const { data: trackerOrder } = await supabase
              .from('orders')
              .select('*')
              .eq('id', trackingId)
              .single();
            
            if (trackerOrder) {
              const mapped: Order = {
                id: trackerOrder.id,
                number: trackerOrder.number,
                origin: trackerOrder.origin,
                pickupType: trackerOrder.pickup_type,
                scheduledTime: trackerOrder.scheduled_time,
                customerName: trackerOrder.customer_name,
                customerPhone: trackerOrder.customer_phone,
                tableNumber: trackerOrder.table_number,
                deliveryInfo: trackerOrder.delivery_info,
                items: trackerOrder.items,
                generalObservation: trackerOrder.general_observation,
                internalObservation: trackerOrder.internal_observation,
                status: trackerOrder.status,
                paymentMethod: trackerOrder.payment_method,
                paymentStatus: trackerOrder.payment_status,
                total: trackerOrder.total,
                createdAt: new Date(trackerOrder.created_at),
                isPrinted: trackerOrder.is_printed
              };
              setOrders([mapped]);
            }
          }
        }
      } catch (err: any) {
        if (attempt === 0) {
          // Retry automático: 1 tentativa após 2s antes de desistir
          attempt = 1;
          console.warn('Erro ao carregar cardápio, tentando novamente em 2s...', err?.message);
          setTimeout(fetchData, 2000);
          return;
        }
        // Log estruturado para produção
        console.error('Erro ao carregar cardápio:', {
          message: err?.message,
          stack: err?.stack,
        });
      } finally {
        if (attempt !== 1) setIsLoadingData(false);
      }
    };

    fetchData();

    // Listen for real-time order updates
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refetchOrders = async () => {
    const dbOrders = await db.getOrders();
    setOrders(dbOrders);
  };

  // Notification sound effect
  useEffect(() => {
    if (orders.length > 0 && settings.isSoundEnabled && userRole === 'admin') {
      const lastOrder = orders[0];
      const isNew = (new Date().getTime() - new Date(lastOrder.createdAt).getTime()) < 10000; // Less than 10s old
      
      if (lastOrder.status === 'received' && isNew) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Sound blocked by browser:", e));
      }
    }
  }, [orders, settings.isSoundEnabled, userRole]);

  const addOrder = async (orderData: Omit<Order, 'id' | 'number' | 'createdAt'>) => {
    try {
      const newOrder = await db.createOrder(orderData);
      
      // If DB failed to return a sequential number, fallback to local count
      if (!newOrder.number) {
        const lastNumber = orders.length > 0 ? Math.max(...orders.map(o => o.number || 0)) : 0;
        newOrder.number = lastNumber + 1;
      }

      setOrders(prev => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      console.error("Error adding order:", err);
      // Fallback local for UX
      const lastNumber = orders.length > 0 ? Math.max(...orders.map(o => o.number || 0)) : 0;
      const localOrder: Order = { ...orderData, id: `temp-${Date.now()}`, number: lastNumber + 1, createdAt: new Date() };
      setOrders(prev => [localOrder, ...prev]);
      return localOrder;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    await db.updateOrderStatus(orderId, status);
  };

  const updatePaymentStatus = async (orderId: string, status: Order['paymentStatus'], method?: Order['paymentMethod']) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, paymentStatus: status, paymentMethod: method || order.paymentMethod } : order
      )
    );
    await db.updatePaymentStatus(orderId, status, method);
  };

  const updateScheduledTime = (orderId: string, time: string) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, scheduledTime: time } : order
      )
    );
  };

  const cancelOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled');
  };


  const updateProduct = async (updatedProduct: Product) => {
    const isNew = updatedProduct.id.startsWith('prod-');

    if (!isNew) {
      // Produto existente: atualiza imediatamente no estado local
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    }

    // Salva no banco e recebe o objeto com o ID real gerado
    const savedProduct = await db.updateProduct(updatedProduct);

    if (isNew && savedProduct) {
      // Produto novo: adiciona à lista com o ID real do banco
      const newProductWithRealId: Product = {
        ...updatedProduct,
        id: savedProduct.id,
        name: savedProduct.name,
        description: savedProduct.description,
        price: savedProduct.price,
        costPrice: savedProduct.cost_price,
        categoryId: savedProduct.category_id,
        isActive: savedProduct.is_active,
        image: savedProduct.image_url,
        isCombo: savedProduct.is_combo,
        comboItems: savedProduct.combo_items || [],
        sortOrder: savedProduct.sort_order || 0,
      };
      setProducts(prev => [...prev, newProductWithRealId]);
    }

    // Reflect price change in open orders (só para produtos existentes)
    if (!isNew) {
      setOrders(prevOrders => prevOrders.map(order => {
        if (order.status === 'completed' || order.status === 'cancelled') return order;

        let orderChanged = false;
        const updatedItems = order.items.map(item => {
          if (item.product.id === updatedProduct.id) {
            orderChanged = true;
            return { ...item, product: updatedProduct };
          }
          return item;
        });

        if (orderChanged) {
          const newTotal = updatedItems.reduce((sum, item) => {
            const extrasTotal = item.selectedExtras.reduce((e, extra) => e + extra.price, 0);
            return sum + (item.product.price + extrasTotal) * item.quantity;
          }, 0);
          return { ...order, items: updatedItems, total: newTotal };
        }
        return order;
      }));
    }
  };

  const deleteProduct = async (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    await db.deleteProduct(productId);
  };

  const updateSettings = async (newSettings: StoreSettings) => {
    setSettings(newSettings);
    await db.updateSettings(newSettings);
  };

  const markOrderAsPrinted = async (orderId: string) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, isPrinted: true } : order
      )
    );
    await db.markOrderAsPrinted(orderId);
  };
  const addCategory = async (category: Category) => {
    // Persiste no Supabase
    const created = await db.createCategory(category.name, categories.length + 1);
    if (created) {
      setCategories(prev => [...prev, created]);
    } else {
      // Fallback local se falhar
      setCategories(prev => [...prev, category]);
    }
  };

  const updateCategory = async (updatedCategory: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    await db.updateCategory(updatedCategory);
    // Save category extra groups and items (estilo iFood)
    if (updatedCategory.extraGroups) {
      await db.saveCategoryExtraGroups(updatedCategory.id, updatedCategory.extraGroups);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    const isUsed = products.some(p => p.categoryId === categoryId);
    if (isUsed) {
      alert("Esta categoria está sendo usada por produtos e não pode ser excluída.");
      return;
    }
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    await db.deleteCategory(categoryId);
  };

  const addCashierLog = (logData: Omit<CashierLog, 'id'>) => {
    const newLog: CashierLog = {
      ...logData,
      id: `log-${Date.now()}`
    };
    setCashierLogs(prev => [newLog, ...prev]);
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
      refetchOrders
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
