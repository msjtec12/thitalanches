import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Order, OrderStatus, Product, StoreSettings, Category, CashierLog } from '@/types/order';
import { initialOrders, products as initialProducts, storeSettings as initialSettings, categories as initialCategories } from '@/data/mockData';
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
  getNextOrderNumber: () => number;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
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

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [cashierLogs, setCashierLogs] = useState<CashierLog[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('admin');
  const [orderCounter, setOrderCounter] = useState(1);

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

  const addOrder = async (orderData: Omit<Order, 'id' | 'number' | 'createdAt'>) => {
    try {
      const newOrder = await db.createOrder(orderData);
      setOrders(prev => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      console.error("Error adding order:", err);
      // Fallback local for UX
      const localOrder: Order = { ...orderData, id: `temp-${Date.now()}`, number: orders.length + 1, createdAt: new Date() };
      setOrders(prev => [localOrder, ...prev]);
      return localOrder;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    await db.updateOrderStatus(orderId, status);
  };

  const updatePaymentStatus = (orderId: string, status: Order['paymentStatus'], method?: Order['paymentMethod']) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, paymentStatus: status, paymentMethod: method || order.paymentMethod } : order
      )
    );
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

  const getNextOrderNumber = () => orders.length + 1;

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    
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

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const updateSettings = async (newSettings: StoreSettings) => {
    setSettings(newSettings);
    await db.updateSettings(newSettings);
  };

  const markOrderAsPrinted = (orderId: string) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, isPrinted: true } : order
      )
    );
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
      getNextOrderNumber,
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
