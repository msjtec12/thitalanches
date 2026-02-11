import { useState, useEffect } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { OrderOrigin, PickupType, Product, ProductExtra } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Minus, X, ShoppingCart, Check, AlertTriangle } from 'lucide-react';
import { maskPhone, unmaskPhone } from '@/utils/phoneHelper';
import { formatPrice } from '@/utils/format';

interface ManualCartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedExtras: ProductExtra[];
  observation: string;
}

export function ManualOrderForm() {
  const { addOrder, products, categories, settings, orders } = useOrders();
  const [isOpen, setIsOpen] = useState(false);
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
    setIsOpen(false);
    resetForm();
  };

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with '+' or '='
      if ((e.key === '+' || e.key === '=') && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
      // Close with 'Escape'
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleExtra = (extra: ProductExtra) => {
    setProductExtras(prev =>
      prev.find(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="fixed bottom-6 right-6 z-50 h-14 w-14 md:h-16 md:w-auto md:px-6 rounded-full shadow-[0_8px_30px_rgb(220,38,38,0.3)] bg-primary hover:bg-red-700 text-white transition-all duration-300 hover:scale-110 active:scale-95 group border-2 border-white/20"
          title="Novo Pedido (Atalho: +)"
        >
          <div className="relative">
            <Plus className="w-6 h-6 md:mr-2 group-hover:rotate-90 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping md:hidden"></div>
          </div>
          <span className="hidden md:inline font-black italic tracking-tighter uppercase">Novo <span className="text-zinc-900/50">Pedido</span></span>
          <div className="hidden lg:flex items-center justify-center ml-3 bg-black/20 rounded px-1.5 py-0.5 text-[10px] font-bold border border-white/10 uppercase">
            Atalho: +
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'products' && 'Adicionar itens'}
            {step === 'details' && 'Detalhes do pedido'}
            {step === 'success' && 'Pedido criado!'}
          </DialogTitle>
        </DialogHeader>

        {step === 'products' && (
          <div className="space-y-4">
            {/* Product selector */}
            {!selectedProduct ? (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.id}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">{category.name}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {products.filter(p => p.categoryId === category.id).map((product) => (
                        <button
                          key={product.id}
                          onClick={() => setSelectedProduct(product)}
                          className="text-left p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                        >
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-primary text-sm">{formatPrice(product.price)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 p-4 bg-secondary rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{selectedProduct.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                    <p className="text-primary font-semibold mt-1">{formatPrice(selectedProduct.price)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={resetProductSelection}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {selectedProduct.extras && selectedProduct.extras.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Adicionais</h5>
                    {selectedProduct.extras.map((extra) => (
                      <label key={extra.id} className="flex items-center justify-between p-2 bg-background rounded cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={productExtras.some(e => e.id === extra.id)}
                            onCheckedChange={() => toggleExtra(extra)}
                          />
                          <span className="text-sm">{extra.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">+{formatPrice(extra.price)}</span>
                      </label>
                    ))}
                  </div>
                )}

                <Input
                  placeholder="Observação do item"
                  value={productObservation}
                  onChange={(e) => setProductObservation(e.target.value)}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center">{productQuantity}</span>
                    <Button variant="outline" size="icon" onClick={() => setProductQuantity(productQuantity + 1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button onClick={addItem}>Adicionar</Button>
                </div>
              </div>
            )}

            {/* Current items */}
            {items.length > 0 && (
              <div className="border-t border-border pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Itens do pedido
                </h4>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-secondary rounded">
                      <span className="text-sm font-medium">{item.quantity}x</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.product.name}</p>
                        {item.selectedExtras.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            + {item.selectedExtras.map(e => e.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="font-semibold">Itens: {formatPrice(total)}</span>
                  <Button onClick={() => setStep('details')}>Continuar</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Origem do pedido</Label>
              <RadioGroup value={origin} onValueChange={(v) => setOrigin(v as OrderOrigin)} className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="counter" id="counter" />
                  <Label htmlFor="counter">Balcão</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="table" id="table" />
                  <Label htmlFor="table">Mesa</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="ifood" id="ifood" />
                  <Label htmlFor="ifood">iFood</Label>
                </div>
              </RadioGroup>
            </div>

            {origin === 'table' ? (
              <div>
                <Label htmlFor="tableNumber">Número da mesa</Label>
                <Input
                  id="tableNumber"
                  placeholder="Ex: 5"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Nome do cliente</Label>
                  <Input
                    id="customerName"
                    placeholder="Nome do cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">WhatsApp do cliente</Label>
                  <Input
                    id="customerPhone"
                    placeholder="(00) 00000-0000"
                    value={maskPhone(customerPhone)}
                    onChange={(e) => setCustomerPhone(unmaskPhone(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label>Tipo de retirada</Label>
              <RadioGroup value={pickupType} onValueChange={(v) => setPickupType(v as PickupType)} className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="immediate" id="imm" />
                  <Label htmlFor="imm">Imediata</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="delivery" id="deliv" />
                  <Label htmlFor="deliv">Entrega</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="scheduled" id="sch" />
                  <Label htmlFor="sch">Agendada</Label>
                </div>
              </RadioGroup>
            </div>

            {pickupType === 'delivery' && (
              <div className="space-y-4 p-4 border border-border rounded-xl bg-secondary/20">
                <div className="space-y-2">
                  <Label>Seu bairro</Label>
                  <Select 
                    value={deliveryInfo.neighborhoodId} 
                    onValueChange={(v) => setDeliveryInfo({...deliveryInfo, neighborhoodId: v})}
                  >
                    <SelectTrigger>
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
                    <Label htmlFor="street">Rua</Label>
                    <Input 
                      id="street" 
                      placeholder="Nome da rua" 
                      value={deliveryInfo.street}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, street: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Nº</Label>
                    <Input 
                      id="number" 
                      placeholder="123" 
                      value={deliveryInfo.number}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, number: e.target.value})}
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
              <div>
                <Label>Horário</Label>
                <Select value={scheduledTime} onValueChange={setScheduledTime}>
                  <SelectTrigger className="mt-1">
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
              <Label>Status do pagamento</Label>
              <RadioGroup value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as any)} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="pending" id="pay-pending" />
                  <Label htmlFor="pay-pending">Pendente</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="paid" id="pay-paid" />
                  <Label htmlFor="pay-paid">Pago</Label>
                </div>
              </RadioGroup>
            </div>

            {(paymentStatus === 'paid' || pickupType === 'delivery') && (
              <div className="space-y-3">
                <Label>Forma de pagamento {paymentStatus === 'pending' ? '(Prevista)' : ''}</Label>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="pix" id="meth-pix" />
                    <Label htmlFor="meth-pix">Pix</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="cash" id="meth-cash" />
                    <Label htmlFor="meth-cash">Dinheiro</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="credit_card" id="meth-credit" />
                    <Label htmlFor="meth-credit">Cartão de Crédito</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="debit_card" id="meth-debit" />
                    <Label htmlFor="meth-debit">Cartão de Débito</Label>
                  </div>
                </RadioGroup>

                {paymentMethod === 'cash' && (
                  <div className="mt-2 space-y-2 p-3 bg-secondary/30 rounded-lg border border-border/50">
                    <Label htmlFor="change">Precisa de troco para quanto?</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                      <Input
                        id="change"
                        placeholder="0,00"
                        className="pl-10"
                        value={changeAmount}
                        onChange={(e) => setChangeAmount(e.target.value)}
                      />
                    </div>
                    {changeAmount && (
                      <p className="text-xs text-muted-foreground">
                        Troco a devolver: <b>{formatPrice(Math.max(0, parseFloat(changeAmount.replace(',', '.')) - grandTotal))}</b>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="internal">Observação interna</Label>
              <Textarea
                id="internal"
                placeholder="Observação para a cozinha/equipe"
                value={internalObservation}
                onChange={(e) => setInternalObservation(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            {pickupType === 'delivery' && (
              <div className="pt-2 text-sm border-t border-border space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxa de entrega</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center py-3 border-t border-border mt-2">
              <span className="font-bold">Total do Pedido:</span>
              <span className="font-black text-xl text-primary">{formatPrice(grandTotal)}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep('products')} className="flex-1">
                Voltar
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={pickupType === 'delivery' && !isStreetInNeighborhood()}
              >
                Criar pedido
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Pedido #{createdOrder?.number} criado!</h3>
              <p className="text-muted-foreground">O pedido foi adicionado à fila.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Fechar
              </Button>
              <Button onClick={resetForm} className="flex-1">
                Novo pedido
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
