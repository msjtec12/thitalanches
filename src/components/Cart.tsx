import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useOrders } from '@/contexts/OrderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Trash2, X, Check, CreditCard, Banknote, MapPin, Truck, Store as StoreIcon, AlertTriangle, MessageSquare } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PickupType, PaymentMethod } from '@/types/order';
import { maskPhone, unmaskPhone } from '@/utils/phoneHelper';
import { formatPrice } from '@/utils/format';

export function Cart() {
  const { items, removeItem, total, itemCount, clearCart } = useCart();
  const { addOrder, settings } = useOrders();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('thita_customer_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('thita_customer_phone') || '');
  const [pickupType, setPickupType] = useState<PickupType>('immediate');
  const [scheduledTime, setScheduledTime] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(() => {
    const saved = localStorage.getItem('thita_delivery_info');
    return saved ? JSON.parse(saved) : {
      neighborhoodId: '',
      street: '',
      number: '',
      complement: '',
      reference: '',
    };
  });
  const [generalObservation, setGeneralObservation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [changeAmount, setChangeAmount] = useState('');
  const [lastOrderUrl, setLastOrderUrl] = useState<string>('');
  const [customerWhatsAppUrl, setCustomerWhatsAppUrl] = useState<string>('');

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

  const getEstimatedTime = () => {
    if (pickupType === 'delivery' && selectedNeighborhood) {
      return 20 + Math.ceil(selectedNeighborhood.estimatedDistanceKm * 5);
    }
    return settings.prepTime;
  };


  const formatWhatsAppNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 || digits.length === 10) {
      return `55${digits}`;
    }
    return digits;
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];
    const now = new Date();
    const minAdvance = 30; // 30 min minimum
    const startTime = new Date(now.getTime() + minAdvance * 60000);
    
    // Generate slots for today and early tomorrow (up to 24h ahead)
    for (let i = 0; i < 96; i++) { // 15-min intervals for 24h
      const slot = new Date();
      slot.setMinutes(Math.ceil(now.getMinutes() / 15) * 15 + (i * 15), 0, 0);
      
      if (slot > startTime) {
        const timeStr = `${slot.getHours().toString().padStart(2, '0')}:${slot.getMinutes().toString().padStart(2, '0')}`;
        if (!slots.includes(timeStr)) slots.push(timeStr);
      }
      if (slots.length >= 20) break; // Limit to next 20 available slots
    }
    return slots;
  };

  const handleCheckout = () => {
    if (customerName.trim()) {
      setStep('checkout');
    }
  };

  const handleConfirmOrder = async () => {
    const urlOrigin = searchParams.get('origin');
    const orderOrigin = (urlOrigin === 'counter' || urlOrigin === 'counter_qr' || urlOrigin === 'table') 
      ? urlOrigin 
      : 'online';

    const changeNote = (paymentMethod === 'cash' && changeAmount) 
      ? ` | Troco para: R$ ${changeAmount}` 
      : '';

    const newOrder = await addOrder({
      origin: orderOrigin as any,
      pickupType,
      scheduledTime: pickupType === 'scheduled' ? scheduledTime : undefined,
      customerName,
      customerPhone: customerPhone || undefined,
      deliveryInfo: pickupType === 'delivery' && selectedNeighborhood ? {
        ...deliveryInfo,
        deliveryFee,
        estimatedTime: getEstimatedTime(),
      } : undefined,
      items,
      paymentMethod,
      paymentStatus: 'pending',
      generalObservation: generalObservation + changeNote,
      status: 'received',
      total: grandTotal,
    });
    
    const trackingLink = `${window.location.origin}${window.location.pathname}?order=${newOrder.id}`;

    if (settings.whatsappNumber) {
      const itemsText = items.map(item => {
        const extras = item.selectedExtras.length > 0 
          ? `\n   └─ + ${item.selectedExtras.map(e => e.name).join(', ')}` 
          : '';
        return `▫️ *${item.quantity}x ${item.product.name.toUpperCase()}*${extras}${item.observation ? `\n   _Obs: ${item.observation}_` : ''}`;
      }).join('\n\n');

      const paymentTexts = {
        pix: '💎 PIX',
        card: '💳 CARTÃO (MÁQUINA)',
        credit_card: '💳 CARTÃO DE CRÉDITO',
        debit_card: '💳 CARTÃO DE DÉBITO',
        cash: '💵 DINHEIRO'
      };

      const locationText = pickupType === 'delivery' 
        ? `🚀 *ENTREGA (DELIVERY)*\n` +
          `🏠 *ENDEREÇO:* ${deliveryInfo.street}, ${deliveryInfo.number}\n` +
          `🏘️ *BAIRRO:* ${selectedNeighborhood?.name}\n` +
          (deliveryInfo.complement ? `🏢 *COMPLEMENTO:* ${deliveryInfo.complement}\n` : '') +
          (deliveryInfo.reference ? `📍 *REFERÊNCIA:* ${deliveryInfo.reference}\n` : '')
        : pickupType === 'immediate' 
          ? '🚀 *RETIRADA IMEDIATA*' 
          : `🕒 *RETIRADA AGENDADA - ${scheduledTime}*`;

      const pixNote = paymentMethod === 'pix' 
        ? `\n⚠️ *IMPORTANTE:* Favor enviar o comprovante do PIX após esta mensagem!\n`
        : '';

      const deliveryFeeText = pickupType === 'delivery' 
        ? `🛵 *TAXA DE ENTREGA: ${formatPrice(deliveryFee)}*\n`
        : '';

      const message = encodeURIComponent(
        `*🆕 NOVO PEDIDO #${newOrder.number}*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👤 *CLIENTE:* ${customerName.toUpperCase()}\n` +
        `📞 *FONE:* ${customerPhone || 'Não informado'}\n` +
        `${locationText}\n` +
        `💰 *PAGAMENTO:* ${paymentTexts[paymentMethod]}${paymentMethod === 'cash' && changeAmount ? ` (Troco para R$ ${changeAmount})` : ''}\n` +
        pixNote +
        `\n🛒 *ITENS DO PEDIDO:*\n${itemsText}\n\n` +
        (generalObservation ? `📝 *OBSERVAÇÃO:* ${generalObservation}\n\n` : '') +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        deliveryFeeText +
        `*TOTAL: ${formatPrice(grandTotal)}*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🔗 *LINK DE ACOMPANHAMENTO:*\n${trackingLink}\n\n` +
        `_Enviado via ${settings.name}_`
      );
      
      const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(settings.whatsappNumber)}?text=${message}`;
      setLastOrderUrl(whatsappUrl);
    }

    if (customerPhone) {
      const customerMessage = encodeURIComponent(
        `*✅ PEDIDO CONFIRMADO! #${newOrder.number}*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Olá, *${customerName.toUpperCase()}*!\n` +
        `Seu pedido foi recebido com sucesso em *${settings.name}*.\n\n` +
        `🚀 *Status:* Recebido\n` +
        `🕒 *Tempo estimado:* ~${getEstimatedTime()} min\n\n` +
        (paymentMethod === 'pix' ? `⚠️ *Não esqueça de enviar o comprovante do PIX!*\n\n` : '') +
        `🔗 *Acompanhe seu pedido por aqui:*\n${trackingLink}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Obrigado pela preferência!_`
      );
      const customerUrl = `https://wa.me/${formatWhatsAppNumber(customerPhone)}?text=${customerMessage}`;
      setCustomerWhatsAppUrl(customerUrl);
      
      window.open(customerUrl, '_blank');
    }

    // Save to history
    localStorage.setItem('thita_customer_name', customerName);
    localStorage.setItem('thita_customer_phone', customerPhone);
    if (pickupType === 'delivery') {
      localStorage.setItem('thita_delivery_info', JSON.stringify(deliveryInfo));
    }

    clearCart();
    setStep('success');
  };

  const resetAndClose = () => {
    setStep('cart');
    setCustomerName('');
    setCustomerPhone('');
    setPickupType('immediate');
    setScheduledTime('');
    setGeneralObservation('');
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-4 right-4 z-50 shadow-lg gap-2 md:hidden">
          <ShoppingCart className="w-5 h-5" />
          {itemCount > 0 && (
            <>
              <span>{itemCount}</span>
              <span className="text-primary-foreground/80">•</span>
              <span>{formatPrice(total)}</span>
            </>
          )}
        </Button>
      </SheetTrigger>

      {/* Desktop floating cart */}
      <div className="hidden md:block fixed right-4 top-24 w-80 bg-card border border-border rounded-lg shadow-lg max-h-[calc(100vh-120px)] overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Carrinho
            {itemCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </h2>
        </div>
        
        {items.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Seu carrinho está vazio
          </div>
        ) : (
          <>
            <div className="max-h-64 overflow-y-auto p-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <span className="bg-secondary text-secondary-foreground w-6 h-6 rounded flex items-center justify-center text-xs font-medium">
                    {item.quantity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product.name}</p>
                    {item.selectedExtras.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        + {item.selectedExtras.map(e => e.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border space-y-3">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
              <Button className="w-full" onClick={() => setIsOpen(true)}>
                Finalizar pedido
              </Button>
            </div>
          </>
        )}
      </div>

      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {step === 'cart' && 'Seu pedido'}
            {step === 'checkout' && 'Finalizar pedido'}
            {step === 'success' && 'Pedido confirmado!'}
          </SheetTitle>
        </SheetHeader>

        {step === 'cart' && (
          <div className="mt-4 space-y-4">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Seu carrinho está vazio
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  {items.map((item) => {
                    const extrasTotal = item.selectedExtras.reduce((sum, e) => sum + e.price, 0);
                    const itemTotal = (item.product.price + extrasTotal) * item.quantity;
                    return (
                      <div key={item.id} className="flex gap-3 p-3 bg-secondary rounded-lg">
                        <span className="bg-card text-foreground w-8 h-8 rounded flex items-center justify-center text-sm font-medium">
                          {item.quantity}x
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{item.product.name}</p>
                          {item.selectedExtras.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              + {item.selectedExtras.map(e => e.name).join(', ')}
                            </p>
                          )}
                          {item.observation && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">
                              "{item.observation}"
                            </p>
                          )}
                          <p className="text-sm font-medium text-primary mt-1">{formatPrice(itemTotal)}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observation">Observação geral</Label>
                  <Textarea
                    id="observation"
                    placeholder="Alguma observação para o pedido?"
                    value={generalObservation}
                    onChange={(e) => setGeneralObservation(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-lg font-semibold mb-4">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name">Seu nome *</Label>
                      <Input
                        id="name"
                        placeholder="Digite seu nome"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">WhatsApp (opcional)</Label>
                      <Input
                        id="phone"
                        placeholder="(00) 00000-0000"
                        value={maskPhone(customerPhone)}
                        onChange={(e) => setCustomerPhone(unmaskPhone(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4" 
                    onClick={handleCheckout}
                    disabled={!customerName.trim()}
                  >
                    Continuar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'checkout' && (
          <div className="mt-4 space-y-6">
            <div className="space-y-3">
              <Label>Como deseja receber seu pedido?</Label>
              <RadioGroup value={pickupType} onValueChange={(v) => setPickupType(v as PickupType)}>
                <div className="flex items-center space-x-3 p-3 bg-secondary rounded-lg">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2">
                       <Truck className="w-4 h-4 text-primary" />
                       <span className="font-medium">Entrega (Delivery)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Receba em casa</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-secondary rounded-lg">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2">
                       <StoreIcon className="w-4 h-4 text-primary" />
                       <span className="font-medium">Retirada imediata</span>
                    </div>
                    <p className="text-[10px] text-orange-600 font-bold uppercase mt-0.5">⚠️ Pronto em 20-30 min</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-secondary rounded-lg">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled" className="cursor-pointer flex-1">
                    <span className="font-medium">Agendar retirada</span>
                    <p className="text-sm text-muted-foreground">Escolher horário (min. 30min de antecedência)</p>
                  </Label>
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
                      A rua digitada não foi encontrada nos registros do bairro {selectedNeighborhood?.name}. 
                      Por favor, verifique se selecionou o bairro correto.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento (opcional)</Label>
                  <Input 
                    id="complement" 
                    placeholder="Ap, bloco, etc" 
                    value={deliveryInfo.complement}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, complement: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">Ponto de referência (opcional)</Label>
                  <Input 
                    id="reference" 
                    placeholder="Perto de onde?" 
                    value={deliveryInfo.reference}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, reference: e.target.value})}
                  />
                </div>
              </div>
            )}

            {pickupType === 'scheduled' && (
              <div className="space-y-2">
                <Label>Horário de retirada</Label>
                <Select value={scheduledTime} onValueChange={setScheduledTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateTimeSlots().map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <Label>Forma de pagamento</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'pix' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`} onClick={() => setPaymentMethod('pix')}>
                    <RadioGroupItem value="pix" id="pay-pix" className="sr-only" />
                    <Check className={`w-4 h-4 mb-2 ${paymentMethod === 'pix' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-medium">Pix</span>
                  </div>
                  <div className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`} onClick={() => setPaymentMethod('cash')}>
                    <RadioGroupItem value="cash" id="pay-cash" className="sr-only" />
                    <Banknote className={`w-4 h-4 mb-2 ${paymentMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-medium">Dinheiro</span>
                  </div>
                  <div className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'credit_card' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`} onClick={() => setPaymentMethod('credit_card')}>
                    <RadioGroupItem value="credit_card" id="pay-credit" className="sr-only" />
                    <CreditCard className={`w-4 h-4 mb-2 ${paymentMethod === 'credit_card' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-medium text-center leading-tight">Cartão de Crédito</span>
                  </div>
                  <div className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'debit_card' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`} onClick={() => setPaymentMethod('debit_card')}>
                    <RadioGroupItem value="debit_card" id="pay-debit" className="sr-only" />
                    <CreditCard className={`w-4 h-4 mb-2 ${paymentMethod === 'debit_card' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-medium text-center leading-tight">Cartão de Débito</span>
                  </div>
                </div>
              </RadioGroup>

              {paymentMethod === 'cash' && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2 border border-border/50">
                  <Label htmlFor="checkout-change" className="text-sm font-medium">Troco para quanto?</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">R$</span>
                    <Input
                      id="checkout-change"
                      placeholder="0,00"
                      className="pl-10 h-10 bg-background"
                      value={changeAmount}
                      onChange={(e) => setChangeAmount(e.target.value)}
                    />
                  </div>
                  {changeAmount && (
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-muted-foreground">Troco a receber:</span>
                      <span className="font-bold text-primary">
                        {formatPrice(Math.max(0, parseFloat(changeAmount.replace(',', '.')) - grandTotal))}
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">Deixe em branco se não precisar de troco.</p>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <h3 className="font-medium">Resumo do pedido</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Cliente:</span> {customerName}</p>
                {pickupType === 'delivery' && (
                   <>
                     <p><span className="text-muted-foreground">Tipo:</span> Entrega</p>
                     <p><span className="text-muted-foreground">Endereço:</span> {deliveryInfo.street}, {deliveryInfo.number}</p>
                     <p><span className="text-muted-foreground">Bairro:</span> {selectedNeighborhood?.name}</p>
                   </>
                )}
                {pickupType !== 'delivery' && (
                  <p>
                    <span className="text-muted-foreground">Retirada:</span>{' '}
                    {pickupType === 'immediate' ? 'Imediata' : `Agendada - ${scheduledTime}`}
                  </p>
                )}
                <p>
                  <span className="text-muted-foreground">Tempo estimado:</span>{' '}
                  ~{getEstimatedTime()} min
                </p>
                <p>
                  <span className="text-muted-foreground">Pagamento:</span>{' '}
                  {paymentMethod === 'pix' ? 'Pix' : paymentMethod === 'cash' ? 'Dinheiro' : paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito'}
                </p>
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {pickupType === 'delivery' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-1 border-t border-border/50">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('cart')} className="flex-1">
                Voltar
              </Button>
              <Button 
                onClick={handleConfirmOrder} 
                className="flex-1"
                disabled={
                  (pickupType === 'scheduled' && !scheduledTime) ||
                  (pickupType === 'delivery' && (!deliveryInfo.neighborhoodId || !deliveryInfo.street || !deliveryInfo.number || !isStreetInNeighborhood()))
                }
              >
                Confirmar pedido
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="mt-8 text-center space-y-4">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Pedido enviado!</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Seu pedido foi recebido. Você pode acompanhar o status abaixo ou via WhatsApp.
              </p>
            </div>
            
            <div className="bg-secondary/30 p-4 rounded-xl space-y-3">
              {customerWhatsAppUrl && (
                <Button 
                  className="w-full gap-2 bg-success hover:bg-success/90 text-white"
                  onClick={() => window.open(customerWhatsAppUrl, '_blank')}
                >
                  <MessageSquare className="w-4 h-4" />
                  Salvar pedido no meu WhatsApp
                </Button>
              )}
              
              <div className="pt-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">Problemas com o pedido?</p>
                <Button 
                  variant="outline" 
                  className="w-full gap-2 border-primary/20 hover:border-primary/50 text-xs"
                  onClick={() => window.open(lastOrderUrl, '_blank')}
                >
                  <MessageSquare className="w-3 h-3 text-primary" />
                  Enviar novamente para a loja
                </Button>
              </div>
            </div>

            <Button onClick={resetAndClose} className="w-full">
              Fazer novo pedido
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
