import { supabase } from './supabase';
import { ensureCustomerSession, getStaffSession } from './auth';
import type { Order, Product } from '@/types/order';

const PUBLIC_PRODUCT_COLUMNS = 'id,name,description,price,is_active,category_id,image_url,is_combo,combo_items,sort_order,disabled_extra_ids,badge';

function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: Number(p.price) || 0,
    costPrice: Number(p.cost_price) || 0,
    isActive: p.is_active ?? true,
    categoryId: p.category_id,
    image: p.image_url || undefined,
    isCombo: p.is_combo ?? false,
    comboItems: p.combo_items || [],
    sortOrder: p.sort_order || 0,
    disabledExtraIds: p.disabled_extra_ids || [],
    badge: p.badge || undefined,
  };
}

function mapOrder(o: any): Order {
  return {
    id: o.id,
    number: o.number,
    origin: o.origin,
    pickupType: o.pickup_type,
    scheduledTime: o.scheduled_time || undefined,
    customerName: o.customer_name,
    customerPhone: o.customer_phone || undefined,
    tableNumber: o.table_number || undefined,
    deliveryInfo: o.delivery_info || undefined,
    items: o.items || [],
    generalObservation: o.general_observation || '',
    internalObservation: o.internal_observation || undefined,
    status: o.status,
    paymentMethod: o.payment_method || undefined,
    paymentStatus: o.payment_status,
    total: Number(o.total) || 0,
    createdAt: new Date(o.created_at),
    isPrinted: o.is_printed ?? false,
    pixProofUrl: o.pix_proof_url || undefined,
  };
}

export const secureDb = {
  async getProducts(): Promise<Product[]> {
    const staff = await getStaffSession();
    if (staff?.role === 'admin') {
      const { data, error } = await supabase.rpc('get_staff_products');
      if (!error && data) return data.map(mapProduct);
    }

    const { data, error } = await supabase
      .from('products')
      .select(PUBLIC_PRODUCT_COLUMNS)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapProduct);
  },

  async upsertProduct(product: Product): Promise<Product> {
    const staff = await getStaffSession();
    if (staff?.role !== 'admin') throw new Error('Apenas administradores podem alterar produtos.');

    const isNew = product.id.startsWith('prod-');
    const { data, error } = await supabase.rpc('staff_upsert_product', {
      p_id: isNew ? null : product.id,
      p_name: product.name,
      p_description: product.description || null,
      p_price: product.price,
      p_cost_price: product.costPrice ?? null,
      p_category_id: product.categoryId,
      p_is_active: product.isActive,
      p_image_url: product.image || null,
      p_is_combo: product.isCombo ?? false,
      p_combo_items: product.comboItems || [],
      p_sort_order: product.sortOrder || 0,
      p_disabled_extra_ids: product.disabledExtraIds || [],
      p_badge: product.badge || null,
    });
    if (error) throw error;
    return mapProduct(data);
  },

  async createOrder(order: Omit<Order, 'id' | 'number' | 'createdAt'>): Promise<Order> {
    const session = await ensureCustomerSession();
    const userId = session.user.id;
    const isBillRequest = order.items.length === 0 && order.origin === 'table';

    const payload = {
      customer_user_id: userId,
      order_type: isBillRequest ? 'bill_request' : 'sale',
      origin: order.origin,
      pickup_type: order.pickupType,
      scheduled_time: order.scheduledTime || null,
      customer_name: order.customerName.trim().slice(0, 120),
      customer_phone: order.customerPhone?.replace(/\D/g, '').slice(0, 15) || null,
      table_number: order.tableNumber?.slice(0, 20) || null,
      delivery_info: order.deliveryInfo || null,
      items: order.items,
      general_observation: (order.generalObservation || '').slice(0, 1200),
      internal_observation: null,
      status: 'received',
      payment_method: order.paymentMethod || null,
      payment_status: 'pending',
      total: isBillRequest ? 0 : order.total,
      is_printed: false,
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return mapOrder(data);
  },

  async getOwnOrders(): Promise<Order[]> {
    const session = await ensureCustomerSession();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapOrder);
  },

  async attachPixProof(orderId: string, dataUrl: string): Promise<void> {
    const session = await ensureCustomerSession();
    const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i.exec(dataUrl);
    if (!match) throw new Error('Formato de comprovante inválido.');

    const mime = match[1].toLowerCase();
    const base64 = match[2];
    const binary = atob(base64);
    if (binary.length > 3 * 1024 * 1024) throw new Error('O comprovante deve ter no máximo 3 MB.');

    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const path = `${session.user.id}/${orderId}-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('pix-proofs')
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (uploadError) throw uploadError;

    const { error: rpcError } = await supabase.rpc('attach_order_pix_proof', {
      p_order_id: orderId,
      p_storage_path: path,
    });
    if (rpcError) {
      await supabase.storage.from('pix-proofs').remove([path]);
      throw rpcError;
    }
  },
};
