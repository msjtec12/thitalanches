import { supabase } from './supabase';
import { Product, Category, Order, StoreSettings, neighborhood, CashierLog } from '@/types/order';

export const db = {
  // Settings
  async getSettings(): Promise<StoreSettings | null> {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) return null;
    
    // Fetch neighborhoods separately to match the interface
    const { data: neighborhoods } = await supabase
      .from('neighborhoods')
      .select('*')
      .order('name');

    return {
      ...data,
      isStreetValidationEnabled: data.is_street_validation_enabled,
      neighborhoods: (neighborhoods || []).map(n => ({
        id: n.id,
        name: n.name,
        deliveryFee: n.delivery_fee,
        estimatedDistanceKm: n.estimated_distance_km,
        allowedStreets: n.allowed_streets
      }))
    };
  },

  async updateSettings(settings: Partial<StoreSettings>) {
    const { neighborhoods, ...rest } = settings;
    const { error } = await supabase
      .from('store_settings')
      .update({
        name: rest.name,
        is_open: rest.isOpen,
        is_cashier_open: rest.isCashierOpen,
        prep_time: rest.prepTime,
        delivery_radius: rest.deliveryRadius,
        whatsapp_number: rest.whatsappNumber,
        scheduling_interval: rest.schedulingInterval,
        admin_pin: rest.adminPin,
        is_street_validation_enabled: rest.isStreetValidationEnabled
      })
      .eq('id', 1);
    
    return !error;
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    return error ? [] : data.map(c => ({ id: c.id, name: c.name, order: c.sort_order }));
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_extras (*)
      `)
      .order('name');
    
    if (error) return [];
    
    return data.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      costPrice: p.cost_price,
      isActive: p.is_active,
      categoryId: p.category_id,
      image: p.image_url,
      extras: p.product_extras.map((e: any) => ({
        id: e.id,
        name: e.name,
        price: e.price,
        isActive: e.is_active
      }))
    }));
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data.map(o => ({
      ...o,
      createdAt: new Date(o.created_at)
    }));
  },

  async createOrder(order: Omit<Order, 'id' | 'number' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        origin: order.origin,
        pickup_type: order.pickupType,
        scheduled_time: order.scheduledTime,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        table_number: order.tableNumber,
        delivery_info: order.deliveryInfo,
        items: order.items,
        general_observation: order.generalObservation,
        internal_observation: order.internalObservation,
        status: order.status,
        payment_method: order.paymentMethod,
        payment_status: order.paymentStatus,
        total: order.total
      }])
      .select()
      .single();
    
    if (error) throw error;
    return { ...data, createdAt: new Date(data.created_at) };
  },

  async updateOrderStatus(orderId: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', orderId);
  },

  // Neighborhoods
  async upsertNeighborhood(n: neighborhood) {
     const { error } = await supabase
      .from('neighborhoods')
      .upsert({
        id: n.id.includes('-') ? n.id : undefined, // Check if it's a real UUID or temp ID
        name: n.name,
        delivery_fee: n.deliveryFee,
        estimated_distance_km: n.estimatedDistanceKm,
        allowed_streets: n.allowedStreets
      });
    return !error;
  }
};
