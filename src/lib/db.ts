import { supabase } from './supabase';
import { Product, Category, ExtraGroup, ExtraItem, Order, StoreSettings, neighborhood, CashierLog } from '@/types/order';

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
      isStreetValidationEnabled: data.is_street_validation_enabled,
      openingHours: data.opening_hours || [],
      neighborhoods: (neighborhoods || []).map(n => ({
        id: String(n.id),
        name: n.name,
        deliveryFee: Number(n.delivery_fee) || 0,
        estimatedDistanceKm: Number(n.estimated_distance_km) || 0,
        allowedStreets: Array.isArray(n.allowed_streets) ? n.allowed_streets : []
      })),
      logoUrl: data.logo_url,
      primaryColor: data.primary_color,
      primaryColorHover: data.primary_color_hover,
      isSoundEnabled: data.is_sound_enabled,
      storeCep: data.store_cep,
      storeStreet: data.store_street,
      storeNumber: data.store_number,
      storeCity: data.store_city,
      storeState: data.store_state,
      storeLat: data.store_lat,
      storeLng: data.store_lng
      // adminPin is explicitly excluded for security
    };
  },

  async verifyAdminPin(pin: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('verify_admin_pin', { input_pin: pin });
    
    if (error) {
       // Fallback for when RPC is not yet created - NOT RECOMMENDED FOR PRODUCTION
       console.warn("RPC 'verify_admin_pin' not found. Falling back to insecure check.");
       const { data: directData } = await supabase
         .from('store_settings')
         .select('admin_pin')
         .eq('id', 1)
         .single();
       return directData?.admin_pin === pin;
    }
    
    return !!data;
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
    if (rest.logoUrl !== undefined) updateData.logo_url = rest.logoUrl;
    if (rest.primaryColor !== undefined) updateData.primary_color = rest.primaryColor;
    if (rest.primaryColorHover !== undefined) updateData.primary_color_hover = rest.primaryColorHover;
    if (rest.isSoundEnabled !== undefined) updateData.is_sound_enabled = rest.isSoundEnabled;
    if (rest.storeCep !== undefined) updateData.store_cep = rest.storeCep;
    if (rest.storeStreet !== undefined) updateData.store_street = rest.storeStreet;
    if (rest.storeNumber !== undefined) updateData.store_number = rest.storeNumber;
    if (rest.storeCity !== undefined) updateData.store_city = rest.storeCity;
    if (rest.storeState !== undefined) updateData.store_state = rest.storeState;
    if (rest.storeLat !== undefined) updateData.store_lat = rest.storeLat;
    if (rest.storeLng !== undefined) updateData.store_lng = rest.storeLng;

    const { error } = await supabase
      .from('store_settings')
      .update(updateData)
      .eq('id', 1);

    if (error) {
        console.error("Error updating settings:", error);
        return false;
    }

    /* 
    Deprecated: Neighborhood manager has been replaced by Distance based DeliveryConfig
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
    */
    return true;
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    // Try loading categories with extra groups + items
    let { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        category_extra_groups (
          *,
          category_extra_items (*)
        )
      `)
      .order('sort_order');
    
    // Fallback: if tables don't exist yet, query without joins
    if (error) {
      const fallback = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      data = fallback.data;
      error = fallback.error;
      if (error) return [];
      return (data || []).map(c => ({
        id: c.id,
        name: c.name,
        order: c.sort_order,
        photoUrl: c.photo_url || undefined,
        isActive: c.is_active ?? true,
        extraGroups: []
      }));
    }

    return data.map(c => ({
      id: c.id,
      name: c.name,
      order: c.sort_order,
      photoUrl: c.photo_url || undefined,
      isActive: c.is_active ?? true,
      extraGroups: (c.category_extra_groups || [])
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((g: any) => ({
          id: g.id,
          name: g.name,
          minQty: g.min_qty || 0,
          maxQty: g.max_qty || 0,
          isRequired: g.is_required ?? false,
          isActive: g.is_active ?? true,
          sortOrder: g.sort_order || 0,
          items: (g.category_extra_items || [])
            .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
            .map((i: any) => ({
              id: i.id,
              name: i.name,
              price: i.price,
              isActive: i.is_active ?? true,
              sortOrder: i.sort_order || 0
            }))
        }))
    }));
  },

  async createCategory(name: string, order: number): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, sort_order: order }])
      .select()
      .single();
    if (error) { console.error('Erro ao criar categoria:', error); return null; }
    return { id: data.id, name: data.name, order: data.sort_order, photoUrl: data.photo_url || undefined, isActive: data.is_active ?? true, extraGroups: [] };
  },

  async uploadCategoryImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `cat-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from('category-images')
      .upload(filename, file, { upsert: true, contentType: file.type });
    if (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      return null;
    }
    const { data: urlData } = supabase.storage
      .from('category-images')
      .getPublicUrl(data.path);
    return urlData.publicUrl;
  },

  async updateCategory(category: Category): Promise<void> {
    await supabase
      .from('categories')
      .update({ 
        name: category.name, 
        photo_url: category.photoUrl || null,
        sort_order: category.order,
        is_active: category.isActive
      })
      .eq('id', category.id);
  },

  async deleteCategory(categoryId: string): Promise<void> {
    // Cascade will handle deleting groups/items via FK
    await supabase.from('categories').delete().eq('id', categoryId);
  },

  // ── Extra Groups & Items (estilo iFood) ──────────────────
  async saveCategoryExtraGroups(categoryId: string, groups: ExtraGroup[]): Promise<void> {
    // 1. Get existing groups for this category
    const { data: existingGroups } = await supabase
      .from('category_extra_groups')
      .select('id')
      .eq('category_id', categoryId);
    
    const existingGroupIds = (existingGroups || []).map(g => g.id);
    const currentGroupIds = groups.filter(g => !g.id.startsWith('grp-')).map(g => g.id);
    const groupsToDelete = existingGroupIds.filter(id => !currentGroupIds.includes(id));
    
    // Delete removed groups (cascade will delete items)
    if (groupsToDelete.length > 0) {
      await supabase.from('category_extra_groups').delete().in('id', groupsToDelete);
    }
    
    // 2. Upsert each group and its items
    for (const group of groups) {
      const isNewGroup = group.id.startsWith('grp-');
      
      const { data: savedGroup, error: gError } = await supabase
        .from('category_extra_groups')
        .upsert({
          id: isNewGroup ? undefined : group.id,
          category_id: categoryId,
          name: group.name,
          min_qty: group.minQty,
          max_qty: group.maxQty,
          is_required: group.isRequired,
          is_active: group.isActive,
          sort_order: group.sortOrder
        })
        .select()
        .single();
      
      if (gError || !savedGroup) {
        console.error('Erro ao salvar grupo:', gError);
        continue;
      }
      
      const realGroupId = savedGroup.id;
      
      // Get existing items for this group
      const { data: existingItems } = await supabase
        .from('category_extra_items')
        .select('id')
        .eq('group_id', realGroupId);
      
      const existingItemIds = (existingItems || []).map(i => i.id);
      const currentItemIds = group.items.filter(i => !i.id.startsWith('item-')).map(i => i.id);
      const itemsToDelete = existingItemIds.filter(id => !currentItemIds.includes(id));
      
      if (itemsToDelete.length > 0) {
        await supabase.from('category_extra_items').delete().in('id', itemsToDelete);
      }
      
      // Upsert items
      for (const item of group.items) {
        const isNewItem = item.id.startsWith('item-');
        const { error: iError } = await supabase
          .from('category_extra_items')
          .upsert({
            id: isNewItem ? undefined : item.id,
            group_id: realGroupId,
            name: item.name,
            price: item.price,
            is_active: item.isActive,
            sort_order: item.sortOrder
          });
        if (iError) console.error('Erro ao salvar item:', iError);
      }
    }
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });
    
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
      isCombo: p.is_combo,
      comboItems: p.combo_items || [],
      sortOrder: p.sort_order || 0,
      disabledExtraIds: p.disabled_extra_ids || [],
    }));
  },

  async updateProduct(product: Product) {
    const isNew = product.id.startsWith('prod-');

    const baseData: any = {
      id: isNew ? undefined : product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      cost_price: product.costPrice,
      category_id: product.categoryId,
      is_active: product.isActive,
      image_url: product.image,
      is_combo: product.isCombo,
      combo_items: product.comboItems,
      sort_order: product.sortOrder,
    };

    // Try with disabled_extra_ids first
    const dataWithExtras = { ...baseData, disabled_extra_ids: product.disabledExtraIds || [] };

    let { data: savedProduct, error: pError } = await supabase
      .from('products')
      .upsert(dataWithExtras)
      .select()
      .single();

    // If column doesn't exist, retry without it
    if (pError && (pError.code === '42703' || pError.message?.includes('disabled_extra_ids'))) {
      console.warn('Coluna disabled_extra_ids não encontrada. Salvando sem ela.');
      const retry = await supabase
        .from('products')
        .upsert(baseData)
        .select()
        .single();
      savedProduct = retry.data;
      pError = retry.error;
    }

    if (pError) {
      console.error('Erro ao salvar produto:', pError);
      throw pError;
    }

    return savedProduct;
  },

  async deleteProduct(productId: string) {
    await supabase.from('products').delete().eq('id', productId);
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
