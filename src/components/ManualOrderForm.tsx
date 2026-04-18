import { useState, useEffect, useRef } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { OrderOrigin, PickupType, Product, ProductExtra, ExtraGroup } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, X, ShoppingCart, Check, AlertTriangle, ArrowLeft, ChevronDown, ChevronUp, Trash2, Package } from 'lucide-react';
import { maskPhone, unmaskPhone } from '@/utils/phoneHelper';
import { formatPrice } from '@/utils/format';

interface ManualCartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedExtras: ProductExtra[];
  observation: string;
}

interface ManualOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManualOrderForm({ isOpen, onClose }: ManualOrderFormProps) {
  const { addOrder, products, categories, settings, orders } = useOrders();
  const [step, setStep] = useState<'products' | 'details' | 'success'>('products');
  const [items, setItems] = useState<ManualCartItem[]>([]);
  const [origin, setOrigin] = useState<OrderOrigin>('counter');
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [pickupType, setPickupType] = useState<PickupType>('immediate');
  const [scheduledTime, setScheduledTime] = useState('');
  const [internalObservation, setInternalObservation] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'cash'>('pix');
  const [changeAmount, setChangeAmount] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [deliveryInfo, setDeliveryInfo] = useState({
    neighborhoodId: '',
    street: '',
    number: '',
    complement: '',
    reference: '',
  });
  const cartRef = useRef<HTMLDivElement>(null);

  const total = items.reduce((sum, item) => {
    const extrasTotal = item.selectedExtras.reduce((e, extra) => e + extra.price, 0);
    return sum + (item.product.price + extrasTotal) * item.quantity;
  }, 0);

  const selectedNeighborhood = (settings.neighborhoods || []).find(n => n.id === deliveryInfo.neighborhoodId);
  const deliveryFee = pickupType === 'delivery' && selectedNeighborhood ? selectedNeighborhood.deliveryFee : 0;
  const grandTotal = total + deliveryFee;

  const isStreetInNeighborhood = () => {
    if (!settings.isStreetValidationEnabled) return true;
    if (pickupType !== 'delivery' || !selectedNeighborhood || !deliveryInfo.street || deliveryInfo.street.length < 3) return true;
    if (!selectedNeighborhood.allowedStreets || selectedNeighborhood.allowedStreets.length === 0) return true;
    
    const streetInput = deliveryInfo.street.toLowerCase().trim();
    return selectedNeighborhood.allowedStreets.some(s => {
      const allowed = s.toLowerCase().trim();
      return streetInput.includes(allowed) || allowed.includes(streetInput);
    });
  };

  const formatWhatsAppNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 || digits.length === 10) {
      return `55${digits}`;
    }
    return digits;
  };

  // Product selection state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productExtras, setProductExtras] = useState<ProductExtra[]>([]);
  const [productObservation, setProductObservation] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const generateTimeSlots = () => {
    const slots: string[] = [];
    const now = new Date();
    const minAdvance = 30; // 30 min minimum
    const startTime = new Date(now.getTime() + minAdvance * 60000);
    
    // Generar slots considerando intervalos de 15 min nas próximas 24h
    for (let i = 0; i < 96; i++) {
      const slot = new Date();
      // Arredonda para o próximo intervalo de 15min e soma os slots
      const startMinutes = Math.ceil(now.getMinutes() / 15) * 15;
      slot.setMinutes(startMinutes + (i * 15), 0, 0);
      
      if (slot > startTime) {
        const timeStr = `${slot.getHours().toString().padStart(2, '0')}:${slot.getMinutes().toString().padStart(2, '0')}`;
        if (!slots.includes(timeStr)) slots.push(timeStr);
      }
      if (slots.length >= 24) break; // Mostra as próximas horas disponíveis
    }
    return slots;
  };

  const addItem = () => {
    if (!selectedProduct) return;
    const newItem: ManualCartItem = {
      id: `manual-${Date.now()}`,
      product: selectedProduct,
      quantity: productQuantity,
      selectedExtras: productExtras,
      observation: productObservation,
    };
    setItems(prev => [...prev, newItem]);
    resetProductSelection();
    // Scroll cart into view on mobile
    setTimeout(() => {
      cartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const resetProductSelection = () => {
    setSelectedProduct(null);
    setProductQuantity(1);
    setProductExtras([]);
    setProductObservation('');
  };


  const handleSubmit = async () => {
    const newOrder = await addOrder({
      origin,
      pickupType,
      scheduledTime: pickupType === 'scheduled' ? scheduledTime : undefined,
      customerName: origin === 'table' ? '' : customerName,
      customerPhone: (origin !== 'table' && customerPhone) ? formatWhatsAppNumber(customerPhone) : undefined,
      tableNumber: origin === 'table' ? tableNumber : undefined,
      deliveryInfo: pickupType === 'delivery' && selectedNeighborhood ? {
        ...deliveryInfo,
        deliveryFee,
        estimatedTime: 20 + Math.ceil(selectedNeighborhood.estimatedDistanceKm * 5),
      } : undefined,
      items,
      generalObservation: (paymentMethod === 'cash' && changeAmount) 
        ? `Troco para: R$ ${changeAmount}` 
        : '',
      internalObservation: internalObservation || undefined,
      status: 'received',
      paymentStatus,
      paymentMethod: (paymentStatus === 'paid' || pickupType === 'delivery') ? paymentMethod : undefined,
      total: grandTotal,
    });
    setCreatedOrder(newOrder);
    setStep('success');
  };

  const resetForm = () => {
    setItems([]);
    setOrigin('counter');
    setCustomerName('');
    setTableNumber('');
    setPickupType('immediate');
    setScheduledTime('');
    setInternalObservation('');
    setCreatedOrder(null);
    setStep('products');
  };

  // Customer historical lookup
  useEffect(() => {
    const cleanPhone = unmaskPhone(customerPhone);
    if (cleanPhone.length >= 10 && orders.length > 0) {
      const pastOrder = orders.find(o => o.customerPhone && unmaskPhone(o.customerPhone) === cleanPhone);
      if (pastOrder) {
        if (!customerName) setCustomerName(pastOrder.customerName);
        if (pastOrder.deliveryInfo && !deliveryInfo.street) {
          setDeliveryInfo({
            neighborhoodId: pastOrder.deliveryInfo.neighborhoodId,
            street: pastOrder.deliveryInfo.street,
            number: pastOrder.deliveryInfo.number,
            complement: pastOrder.deliveryInfo.complement || '',
            reference: pastOrder.deliveryInfo.reference || '',
          });
        }
      }
    }
  }, [customerPhone, orders]);

  const handleClose = () => {
    onClose();
    resetForm();
  };

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close with 'Escape'
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleExtra = (extra: ProductExtra, group: ExtraGroup) => {
    const isSelected = productExtras.some(e => e.id === extra.id);
    if (isSelected) {
      setProductExtras(prev => prev.filter(e => e.id !== extra.id));
    } else {
      const groupCount = productExtras.filter(se => group.items.some(gi => gi.id === se.id)).length;
      if (group.maxQty > 0 && groupCount >= group.maxQty) {
        if (group.maxQty === 1) {
          setProductExtras(prev => [...prev.filter(e => !group.items.some(gi => gi.id === e.id)), extra]);
        }
        return;
      }
      setProductExtras(prev => [...prev, extra]);
    }
  };

  // Auto-expand first category
  useEffect(() => {
    if (isOpen && !expandedCategory) {
      const sortedCats = categories.filter(c => c.isActive !== false).sort((a, b) => a.order - b.order);
      if (sortedCats.length > 0) setExpandedCategory(sortedCats[0].id);
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  // ── Full-page split layout ──
  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col animate-in fade-in duration-200">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-950/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose} 
            className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-sm font-black italic tracking-tighter text-white uppercase">
              NOVO <span className="text-primary">PEDIDO</span>
            </h2>
            <p className="text-[10px] text-zinc-500 font-medium">Selecione os itens e finalize</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
              <span className="text-xs font-black text-white">{formatPrice(total)}</span>
            </div>
          )}
        </div>
      </div>

      {step === 'success' ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md mx-auto p-8">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-emerald-500/20">
              <Check className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-2xl font-black italic text-white">Pedido #{createdOrder?.number} criado!</h3>
              <p className="text-zinc-400 mt-2">O pedido foi adicionado à fila de produção.</p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1 h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white">
                Voltar ao painel
              </Button>
              <Button onClick={resetForm} className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Novo pedido
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Split Layout: Menu Left | Cart Right ── */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* ═══ LEFT: Menu / Cardápio ═══ */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 lg:p-6">
              {step === 'products' && (
                <>
                  {!selectedProduct ? (
                    <div className="space-y-2">
                      {categories.filter(c => c.isActive !== false).slice().sort((a,b) => a.order - b.order).map((category) => {
                        const categoryProducts = [...products]
                          .filter(p => p.categoryId === category.id)
                          .sort((a,b) => {
                            const orderA = Number(a.sortOrder) || 0;
                            const orderB = Number(b.sortOrder) || 0;
                            if (orderA !== orderB) return orderA - orderB;
                            return a.name.localeCompare(b.name);
                          });
                        if (categoryProducts.length === 0) return null;
                        const isExpanded = expandedCategory === category.id;
                        return (
                          <div key={category.id} className="rounded-xl border border-white/5 bg-zinc-900/50 overflow-hidden">
                            <button 
                              onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                              className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                            >
                              <h4 className="text-sm font-bold text-white">
                                <span className="text-primary mr-1.5">{category.order.toString().padStart(2, '0')}.</span>
                                {category.name}
                                <span className="ml-2 text-[10px] text-zinc-500 font-medium">({categoryProducts.length})</span>
                              </h4>
                              {isExpanded 
                                ? <ChevronUp className="w-4 h-4 text-zinc-500" /> 
                                : <ChevronDown className="w-4 h-4 text-zinc-500" />
                              }
                            </button>
                            {isExpanded && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 pt-0">
                                {categoryProducts.map((product) => (
                                  <button
                                    key={product.id}
                                    onClick={() => setSelectedProduct(product)}
                                    className="text-left p-3 bg-zinc-800/60 rounded-xl hover:bg-zinc-800 border border-white/5 hover:border-primary/30 transition-all duration-150 group"
                                  >
                                    <p className="font-semibold text-sm text-white group-hover:text-primary transition-colors">
                                      {product.sortOrder ? `${product.sortOrder.toString().padStart(2, '0')}. ` : ''}
                                      {product.name}
                                    </p>
                                    <p className="text-primary font-bold text-sm mt-1">{formatPrice(product.price)}</p>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ── Product Detail / Extras Selection ── */
                    <div className="max-w-2xl mx-auto">
                      <div className="space-y-4 p-5 bg-zinc-900/60 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg text-white">{selectedProduct.name}</h4>
                            {selectedProduct.description && (
                              <p className="text-sm text-zinc-400 mt-0.5">{selectedProduct.description}</p>
                            )}
                            <p className="text-primary font-black text-xl mt-2">{formatPrice(selectedProduct.price)}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={resetProductSelection} className="hover:bg-destructive/10 hover:text-destructive rounded-xl">
                            <X className="w-5 h-5" />
                          </Button>
                        </div>

                        {/* ── Grupos de Complementos (estilo iFood) ── */}
                        {(() => {
                          const cat = categories.find(c => c.id === selectedProduct.categoryId);
                          const activeGroups = (cat?.extraGroups || []).filter(g => g.isActive);
                          if (activeGroups.length === 0) return null;
                          return activeGroups.map(group => {
                            const activeItems = group.items.filter(i => i.isActive);
                            if (activeItems.length === 0) return null;
                            const groupCount = productExtras.filter(se => group.items.some(gi => gi.id === se.id)).length;
                            return (
                              <div key={group.id} className="space-y-2">
                                <div className="flex items-center justify-between bg-zinc-800/60 -mx-5 px-5 py-2.5 border-y border-white/5">
                                  <div>
                                    <h4 className="text-xs font-bold text-white">{group.name}</h4>
                                    <p className="text-[10px] text-zinc-500">
                                      {group.isRequired ? `Escolha de ${group.minQty} a ${group.maxQty > 0 ? group.maxQty : '∞'}` : group.maxQty > 0 ? `Até ${group.maxQty}` : 'Opcional'}
                                    </p>
                                  </div>
                                  {group.isRequired && (
                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                                      groupCount >= group.minQty ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    }`}>{groupCount >= group.minQty ? '✓ OK' : 'OBRIGATÓRIO'}</span>
                                  )}
                                </div>
                                {activeItems.map(extra => {
                                  const isSelected = productExtras.some(e => e.id === extra.id);
                                  const isRadio = group.maxQty === 1;
                                  return (
                                    <button key={extra.id} type="button" onClick={() => toggleExtra(extra, group)}
                                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-150 text-left
                                        ${isSelected ? 'border-primary bg-primary/10 shadow-sm shadow-primary/10' : 'border-white/5 bg-zinc-800/40 hover:border-primary/30 hover:bg-zinc-800/60'}`}>
                                      <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 ${isRadio ? 'rounded-full' : 'rounded-sm'} border-2 flex items-center justify-center flex-shrink-0 transition-all
                                          ${isSelected ? 'border-primary bg-primary' : 'border-zinc-600'}`}>
                                          {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                        </div>
                                        <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{extra.name}</span>
                                      </div>
                                      {extra.price > 0 && <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-zinc-500'}`}>+{formatPrice(extra.price)}</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          });
                        })()}

                        {/* ── Observação ── */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Observação do item</span>
                          <Input
                            placeholder="Ex: Sem cebola, bem passado..."
                            value={productObservation}
                            onChange={(e) => setProductObservation(e.target.value)}
                            className="bg-zinc-800/60 border-white/5 focus:border-primary/50"
                          />
                        </div>

                        {/* ── Quantidade + Adicionar ── */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-white/10 bg-zinc-800 hover:bg-zinc-700" onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}>
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-12 text-center font-black text-lg text-white">{productQuantity}</span>
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-white/10 bg-zinc-800 hover:bg-zinc-700" onClick={() => setProductQuantity(productQuantity + 1)}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button onClick={addItem} className="gap-2 shadow-lg shadow-primary/20 font-bold h-11 px-6 rounded-xl">
                            <Plus className="w-4 h-4" />
                            Adicionar {formatPrice((selectedProduct.price + productExtras.reduce((s, e) => s + e.price, 0)) * productQuantity)}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {step === 'details' && (
                <div className="max-w-2xl mx-auto space-y-5">
                  <div className="space-y-3">
                    <Label className="text-white font-bold text-sm">Origem do pedido</Label>
                    <RadioGroup value={origin} onValueChange={(v) => setOrigin(v as OrderOrigin)} className="flex flex-wrap gap-3">
                      {[{value: 'counter', label: 'Balcão'}, {value: 'table', label: 'Mesa'}, {value: 'ifood', label: 'iFood'}].map(opt => (
                        <label key={opt.value} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all
                          ${origin === opt.value ? 'border-primary bg-primary/10 text-white' : 'border-white/10 bg-zinc-900/50 text-zinc-400 hover:border-white/20'}`}>
                          <RadioGroupItem value={opt.value} id={opt.value} className="sr-only" />
                          <span className="text-sm font-semibold">{opt.label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {origin === 'table' ? (
                    <div className="space-y-2">
                      <Label htmlFor="tableNumber" className="text-white">Número da mesa</Label>
                      <Input
                        id="tableNumber"
                        placeholder="Ex: 5"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="bg-zinc-900/50 border-white/10"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customerName" className="text-white">Nome do cliente</Label>
                        <Input
                          id="customerName"
                          placeholder="Nome do cliente"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="bg-zinc-900/50 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customerPhone" className="text-white">WhatsApp do cliente</Label>
                        <Input
                          id="customerPhone"
                          placeholder="(00) 00000-0000"
                          value={maskPhone(customerPhone)}
                          onChange={(e) => setCustomerPhone(unmaskPhone(e.target.value))}
                          className="bg-zinc-900/50 border-white/10"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-white font-bold text-sm">Tipo de retirada</Label>
                    <RadioGroup value={pickupType} onValueChange={(v) => setPickupType(v as PickupType)} className="flex flex-wrap gap-3">
                      {[{value: 'immediate', label: 'Imediata'}, {value: 'delivery', label: 'Entrega'}, {value: 'scheduled', label: 'Agendada'}].map(opt => (
                        <label key={opt.value} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all
                          ${pickupType === opt.value ? 'border-primary bg-primary/10 text-white' : 'border-white/10 bg-zinc-900/50 text-zinc-400 hover:border-white/20'}`}>
                          <RadioGroupItem value={opt.value} id={`pickup-${opt.value}`} className="sr-only" />
                          <span className="text-sm font-semibold">{opt.label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {pickupType === 'delivery' && (
                    <div className="space-y-4 p-4 border border-white/10 rounded-xl bg-zinc-900/30">
                      <div className="space-y-2">
                        <Label className="text-white">Seu bairro</Label>
                        <Select 
                          value={deliveryInfo.neighborhoodId} 
                          onValueChange={(v) => setDeliveryInfo({...deliveryInfo, neighborhoodId: v})}
                        >
                          <SelectTrigger className="bg-zinc-800/60 border-white/10">
                            <SelectValue placeholder="Selecione seu bairro" />
                          </SelectTrigger>
                          <SelectContent>
                            {settings.neighborhoods.map((n) => (
                              <SelectItem key={n.id} value={n.id}>
                                {n.name} - {formatPrice(n.deliveryFee)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="street" className="text-white">Rua</Label>
                          <Input 
                            id="street" 
                            placeholder="Nome da rua" 
                            value={deliveryInfo.street}
                            onChange={(e) => setDeliveryInfo({...deliveryInfo, street: e.target.value})}
                            className="bg-zinc-800/60 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="number" className="text-white">Nº</Label>
                          <Input 
                            id="number" 
                            placeholder="123" 
                            value={deliveryInfo.number}
                            onChange={(e) => setDeliveryInfo({...deliveryInfo, number: e.target.value})}
                            className="bg-zinc-800/60 border-white/10"
                          />
                        </div>
                      </div>

                      {settings.isStreetValidationEnabled && deliveryInfo.street.length > 3 && !isStreetInNeighborhood() && (
                        <div className="bg-destructive/10 border border-destructive/20 p-2 rounded-lg flex gap-2 items-start mt-2">
                          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          <p className="text-[10px] text-destructive font-medium leading-tight">
                            Atenção: Esta rua não está vinculada ao bairro {selectedNeighborhood?.name} no sistema.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {pickupType === 'scheduled' && (
                    <div className="space-y-2">
                      <Label className="text-white">Horário</Label>
                      <Select value={scheduledTime} onValueChange={setScheduledTime}>
                        <SelectTrigger className="bg-zinc-800/60 border-white/10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateTimeSlots().map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-white font-bold text-sm">Status do pagamento</Label>
                    <RadioGroup value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as any)} className="flex gap-3">
                      {[{value: 'pending', label: 'Pendente'}, {value: 'paid', label: 'Pago'}].map(opt => (
                        <label key={opt.value} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all
                          ${paymentStatus === opt.value ? 'border-primary bg-primary/10 text-white' : 'border-white/10 bg-zinc-900/50 text-zinc-400 hover:border-white/20'}`}>
                          <RadioGroupItem value={opt.value} id={`pay-${opt.value}`} className="sr-only" />
                          <span className="text-sm font-semibold">{opt.label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {(paymentStatus === 'paid' || pickupType === 'delivery') && (
                    <div className="space-y-3">
                      <Label className="text-white font-bold text-sm">Forma de pagamento {paymentStatus === 'pending' ? '(Prevista)' : ''}</Label>
                      <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="grid grid-cols-2 gap-3">
                        {[{value: 'pix', label: 'Pix'}, {value: 'cash', label: 'Dinheiro'}, {value: 'credit_card', label: 'Crédito'}, {value: 'debit_card', label: 'Débito'}].map(opt => (
                          <label key={opt.value} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all
                            ${paymentMethod === opt.value ? 'border-primary bg-primary/10 text-white' : 'border-white/10 bg-zinc-900/50 text-zinc-400 hover:border-white/20'}`}>
                            <RadioGroupItem value={opt.value} id={`meth-${opt.value}`} className="sr-only" />
                            <span className="text-sm font-semibold">{opt.label}</span>
                          </label>
                        ))}
                      </RadioGroup>

                      {paymentMethod === 'cash' && (
                        <div className="mt-2 space-y-2 p-3 bg-zinc-900/50 rounded-xl border border-white/10">
                          <Label htmlFor="change" className="text-white">Precisa de troco para quanto?</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">R$</span>
                            <Input
                              id="change"
                              placeholder="0,00"
                              className="pl-10 bg-zinc-800/60 border-white/10"
                              value={changeAmount}
                              onChange={(e) => setChangeAmount(e.target.value)}
                            />
                          </div>
                          {changeAmount && (
                            <p className="text-xs text-zinc-400">
                              Troco a devolver: <b className="text-white">{formatPrice(Math.max(0, parseFloat(changeAmount.replace(',', '.')) - grandTotal))}</b>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="internal" className="text-white">Observação interna</Label>
                    <Textarea
                      id="internal"
                      placeholder="Observação para a cozinha/equipe"
                      value={internalObservation}
                      onChange={(e) => setInternalObservation(e.target.value)}
                      className="bg-zinc-900/50 border-white/10"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══ RIGHT: Cart / Carrinho ═══ */}
          <div ref={cartRef} className="lg:w-[420px] xl:w-[460px] border-t lg:border-t-0 lg:border-l border-white/10 bg-zinc-900/40 flex flex-col shrink-0">
            <div className="p-4 border-b border-white/10 bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-white">Carrinho</h3>
                {items.length > 0 && (
                  <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
                    {items.length}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-800/60 flex items-center justify-center mb-4">
                    <Package className="w-7 h-7 text-zinc-600" />
                  </div>
                  <p className="text-sm text-zinc-500 font-medium">Nenhum item adicionado</p>
                  <p className="text-[11px] text-zinc-600 mt-1">Selecione itens no cardápio ao lado</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                    <span className="text-sm font-black text-primary bg-primary/10 rounded-lg w-8 h-8 flex items-center justify-center shrink-0 mt-0.5">{item.quantity}x</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.product.name}</p>
                      {item.selectedExtras.length > 0 && (
                        <p className="text-[11px] text-emerald-400 mt-0.5 truncate">
                          + {item.selectedExtras.map(e => e.name).join(', ')}
                        </p>
                      )}
                      {item.observation && (
                        <p className="text-[10px] text-zinc-500 mt-0.5 italic truncate">Obs: {item.observation}</p>
                      )}
                      <p className="text-xs font-bold text-zinc-400 mt-1">
                        {formatPrice((item.product.price + item.selectedExtras.reduce((s, e) => s + e.price, 0)) * item.quantity)}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeItem(item.id)} 
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 hover:bg-destructive/10 hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* ── Cart Footer / Totals ── */}
            <div className="border-t border-white/10 p-4 bg-zinc-900/80 space-y-3">
              {pickupType === 'delivery' && deliveryFee > 0 && (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Taxa de entrega</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white">Total</span>
                <span className="font-black text-xl text-primary">{formatPrice(grandTotal)}</span>
              </div>
              
              {step === 'products' ? (
                <Button 
                  onClick={() => setStep('details')} 
                  disabled={items.length === 0}
                  className="w-full h-12 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-30 disabled:shadow-none gap-2"
                >
                  Continuar
                  <span className="text-[10px] font-medium opacity-70">({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('products')} 
                    className="flex-1 h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                    disabled={pickupType === 'delivery' && !isStreetInNeighborhood()}
                  >
                    Criar pedido
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
