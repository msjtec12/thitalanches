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
      name: data.name,
      isOpen: data.is_open,
      isCashierOpen: data.is_cashier_open,
      prepTime: data.prep_time,
      deliveryRadius: data.delivery_radius,
      whatsappNumber: data.whatsapp_number,
      schedulingInterval: data.scheduling_interval,
      adminPin: data.admin_pin,
      isStreetValidationEnabled: data.is_street_validation_enabled,
      openingHours: data.opening_hours || [],
      neighborhoods: (neighborhoods || []).map(n => ({
        id: String(n.id),
        name: n.name,
        deliveryFee: Number(n.delivery_fee) || 0,
        estimatedDistanceKm: Number(n.estimated_distance_km) || 0,
        allowedStreets: Array.isArray(n.allowed_streets) ? n.allowed_streets : []
      }))
    };
  },

  async updateSettings(settings: Partial<StoreSettings>) {
    const { neighborhoods, ...rest } = settings;
    
    const updateData: any = {};
    if (rest.name !== undefined) updateData.name = rest.name;
    if (rest.isOpen !== undefined) updateData.is_open = rest.isOpen;
    if (rest.isCashierOpen !== undefined) updateData.is_cashier_open = rest.isCashierOpen;
    if (rest.prepTime !== undefined) updateData.prep_time = Number(rest.prepTime) || 0;
    if (rest.deliveryRadius !== undefined) updateData.delivery_radius = Number(rest.deliveryRadius) || 0;
    if (rest.whatsappNumber !== undefined) updateData.whatsapp_number = rest.whatsappNumber;
    if (rest.schedulingInterval !== undefined) updateData.scheduling_interval = Number(rest.schedulingInterval) || 0;
    if (rest.isStreetValidationEnabled !== undefined) updateData.is_street_validation_enabled = rest.isStreetValidationEnabled;
    if (rest.adminPin !== undefined) updateData.admin_pin = rest.adminPin;

    const { error } = await supabase
      .from('store_settings')
      .update(updateData)
      .eq('id', 1);

    if (error) {
        console.error("Error updating settings:", error);
        return false;
    }

    if (neighborhoods) {
      for (const n of neighborhoods) {
        await db.upsertNeighborhood(n);
      }
      const { data: dbN } = await supabase.from('neighborhoods').select('id');
      const currentIds = (dbN || []).map(x => String(x.id));
      const newIds = neighborhoods.map(x => String(x.id)).filter(id => !id.startsWith('temp-'));
      const toDelete = currentIds.filter(id => !newIds.includes(id));
      if (toDelete.length > 0) {
        await supabase.from('neighborhoods').delete().in('id', toDelete);
      }
    }
    return true;
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
      id: o.id,
      number: o.number,
      origin: o.origin,
      pickupType: o.pickup_type,
      scheduledTime: o.scheduled_time,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      tableNumber: o.table_number,
      deliveryInfo: o.delivery_info,
      items: o.items,
      generalObservation: o.general_observation,
      internalObservation: o.internal_observation,
      status: o.status,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      total: o.total,
      createdAt: new Date(o.created_at),
      isPrinted: o.is_printed
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
    return {
      id: data.id,
      number: data.number,
      origin: data.origin,
      pickupType: data.pickup_type,
      scheduledTime: data.scheduled_time,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      tableNumber: data.table_number,
      deliveryInfo: data.delivery_info,
      items: data.items,
      generalObservation: data.general_observation,
      internalObservation: data.internal_observation,
      status: data.status,
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      total: data.total,
      createdAt: new Date(data.created_at),
      isPrinted: data.is_printed
    };
  },

  async updateOrderStatus(orderId: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', orderId);
  },

  async updatePaymentStatus(orderId: string, status: string, method?: string) {
    const updateData: any = { payment_status: status };
    if (method) updateData.payment_method = method;
    await supabase.from('orders').update(updateData).eq('id', orderId);
  },

  async markOrderAsPrinted(orderId: string) {
    await supabase.from('orders').update({ is_printed: true }).eq('id', orderId);
  },

  // Neighborhoods
  async upsertNeighborhood(n: neighborhood) {
     const isRealId = n.id && !n.id.startsWith('temp-');
     const { error } = await supabase
      .from('neighborhoods')
      .upsert({
        id: isRealId ? (isNaN(Number(n.id)) ? n.id : Number(n.id)) : undefined,
        name: n.name,
        delivery_fee: n.deliveryFee,
        estimated_distance_km: n.estimatedDistanceKm,
        allowed_streets: n.allowedStreets
      });
    return !error;
  }
};
