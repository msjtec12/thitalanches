import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Order, OrderStatus, Product, StoreSettings, Category, CashierLog } from '@/types/order';
import { initialOrders, products as initialProducts, storeSettings as initialSettings, categories as initialCategories } from '@/data/mockData';

interface OrderContextType {
  orders: Order[];
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  addOrder: (order: Omit<Order, 'id' | 'number' | 'createdAt'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
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
  // Load from localStorage on init
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('speedy_orders');
    return saved ? JSON.parse(saved).map((o: any) => ({ ...o, createdAt: new Date(o.createdAt) })) : initialOrders;
  });
  
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('speedy_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });
  
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('speedy_settings');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // Merge neighborhoods: if parsed has neighborhoods, only use them if they are not empty
          // Otherwise use initialSettings.neighborhoods (the big list from spreadsheet)
          const mergedNeighborhoods = (parsed.neighborhoods && parsed.neighborhoods.length > 0) 
            ? parsed.neighborhoods 
            : initialSettings.neighborhoods;
            
          return { 
            ...initialSettings, 
            ...parsed,
            neighborhoods: mergedNeighborhoods 
          };
        }
      }
    } catch (e) {
      console.error('Error parsing settings:', e);
    }
    return initialSettings;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('speedy_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [cashierLogs, setCashierLogs] = useState<CashierLog[]>(() => {
    const saved = localStorage.getItem('speedy_cashier_logs');
    return saved ? JSON.parse(saved).map((l: any) => ({ ...l, timestamp: new Date(l.timestamp) })) : [];
  });

  const [userRole, setUserRole] = useState<'admin' | 'employee'>(() => {
    const saved = localStorage.getItem('speedy_user_role');
    return (saved as 'admin' | 'employee') || 'admin';
  });

  const [orderCounter, setOrderCounter] = useState(() => {
    const saved = localStorage.getItem('speedy_order_counter');
    return saved ? Number(saved) : initialOrders.length + 1;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('speedy_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('speedy_products', JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem('speedy_categories', JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem('speedy_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('speedy_cashier_logs', JSON.stringify(cashierLogs));
  }, [cashierLogs]);

  useEffect(() => {
    localStorage.setItem('speedy_user_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('speedy_order_counter', orderCounter.toString());
  }, [orderCounter]);

  const getNextOrderNumber = () => orderCounter;

  const addOrder = (orderData: Omit<Order, 'id' | 'number' | 'createdAt'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `order-${Date.now()}`,
      number: orderCounter,
      createdAt: new Date(),
    };
    setOrders(prev => [newOrder, ...prev]);
    setOrderCounter(prev => prev + 1);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    );
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

  const updateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
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
