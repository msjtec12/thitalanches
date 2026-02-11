import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Order, OrderStatus, Product, StoreSettings, Category, CashierLog } from '@/types/order';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface OrderContextType {
  orders: Order[];
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
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
};

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cashierLogs, setCashierLogs] = useState<CashierLog[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('employee');

  // Load from Supabase on init
  useEffect(() => {
    const fetchData = async () => {
      const dbSettings = await db.getSettings();
      if (dbSettings) setSettings(dbSettings);
      
      const dbProducts = await db.getProducts();
      if (dbProducts.length > 0) setProducts(dbProducts);
      
      const dbCategories = await db.getCategories();
      if (dbCategories.length > 0) setCategories(dbCategories);
      
      const dbOrders = await db.getOrders();
      if (dbOrders.length > 0) setOrders(dbOrders);
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
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    await db.updateProduct(updatedProduct);
    
    // Reflect price change in open orders
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
  const addCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
  };

  const updateCategory = (updatedCategory: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };

  const deleteCategory = (categoryId: string) => {
    const isUsed = products.some(p => p.categoryId === categoryId);
    if (isUsed) {
      alert("Esta categoria está sendo usada por produtos e não pode ser excluída.");
      return;
    }
    setCategories(prev => prev.filter(c => c.id !== categoryId));
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
      setUserRole
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
