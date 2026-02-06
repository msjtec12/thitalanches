import { Order, OrderStatus } from '@/types/order';
import { useOrders } from '@/contexts/OrderContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, X, Clock, Edit2, Printer, CheckCircle, MessageSquare, Truck, Store as StoreIcon, MapPin, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OrderPrinter } from './OrderPrinter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatPrice, formatTime as formatTimeUtil } from '@/utils/format';

interface OrderCardProps {
  order: Order;
}

const statusConfig: Record<OrderStatus, { label: string; next: OrderStatus | null }> = {
  received: { label: 'Recebido', next: 'preparing' },
  preparing: { label: 'Em preparo', next: 'ready' },
  ready: { label: 'Pronto', next: 'completed' },
  completed: { label: 'Finalizado', next: null },
  cancelled: { label: 'Cancelado', next: null },
};

const originLabels: Record<string, string> = {
  online: 'WhatsApp',
  counter: 'Balcão',
  table: 'Mesa',
  ifood: 'iFood',
  counter_qr: 'Balcão',
};

const paymentMethodLabels: Record<string, string> = {
  pix: 'Pix',
  cash: 'Dinheiro',
  credit_card: 'Crédito',
  debit_card: 'Débito',
  card: 'Cartão',
};

export function OrderCard({ order }: OrderCardProps) {
  const { updateOrderStatus, updateScheduledTime, cancelOrder, updatePaymentStatus, markOrderAsPrinted, settings } = useOrders();
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [newTime, setNewTime] = useState(order.scheduledTime || '');

  const formatWhatsAppNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 || digits.length === 10) {
      return `55${digits}`;
    }
    return digits;
  };

  const formatTime = (date: Date) => {
    try {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '--:--';
    }
  };

  const handleAdvanceStatus = () => {
    const nextStatus = statusConfig[order.status].next;
    if (nextStatus) {
      updateOrderStatus(order.id, nextStatus);
    }
  };

  const handleSaveTime = () => {
    updateScheduledTime(order.id, newTime);
    setIsEditingTime(false);
  };

  const handleMarkAsPaid = (method: Order['paymentMethod']) => {
    updatePaymentStatus(order.id, 'paid', method);
  };

  const handlePrint = () => {
    window.print();
    markOrderAsPrinted(order.id);
  };

  const isLate = () => {
    if (order.status !== 'received' && order.status !== 'preparing') return false;
    const diff = (new Date().getTime() - new Date(order.createdAt).getTime()) / 60000;
    return diff > settings.prepTime;
  };

  const handleNotifyReady = () => {
    if (!order.customerPhone) return;
    
    const trackingLink = `${window.location.origin}/?order=${order.id}`;
    
    const message = encodeURIComponent(
      `*✅ SEU PEDIDO ESTÁ PRONTO! (#${order.number})*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Olá, *${order.customerName || 'Cliente'}*!\n` +
      `Passando para avisar que seu pedido já está pronto para retirada.\n\n` +
      `📍 *Local:* ${settings.name}\n` +
      `💰 *Total:* ${formatPrice(order.total)}\n\n` +
      `🔗 *Acompanhe o status aqui:*\n${trackingLink}\n\n` +
      `Pode vir buscar que estamos te aguardando! 🚀\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Enviado via ${settings.name}_`
    );
    
    window.open(`https://wa.me/${formatWhatsAppNumber(order.customerPhone)}?text=${message}`, '_blank');
  };

  const handleForwardToCustomer = () => {
    if (!order.customerPhone) return;

    const trackingLink = `${window.location.origin}/?order=${order.id}`;

    const itemsText = order.items.map(item => {
      const extras = item.selectedExtras.length > 0 
        ? `\n   └─ + ${item.selectedExtras.map(e => e.name).join(', ')}` 
        : '';
      return `▫️ *${item.quantity}x ${item.product.name.toUpperCase()}*${extras}${item.observation ? `\n   _Obs: ${item.observation}_` : ''}`;
    }).join('\n\n');

    const paymentTexts = {
      pix: '💎 PIX',
      cash: '💵 DINHEIRO',
      credit_card: '💳 CARTÃO DE CRÉDITO',
      debit_card: '💳 CARTÃO DE DÉBITO',
      card: '💳 CARTÃO'
    };

    const locationText = order.pickupType === 'delivery' 
      ? `🚀 *ENTREGA (DELIVERY)*\n` +
        `🏠 *ENDEREÇO:* ${order.deliveryInfo?.street}, ${order.deliveryInfo?.number}\n` +
        `🏘️ *BAIRRO:* ${settings.neighborhoods.find(n => n.id === order.deliveryInfo?.neighborhoodId)?.name}\n` +
        (order.deliveryInfo?.complement ? `🏢 *COMPLEMENTO:* ${order.deliveryInfo.complement}\n` : '') +
        (order.deliveryInfo?.reference ? `📍 *REFERÊNCIA:* ${order.deliveryInfo.reference}\n` : '')
      : order.pickupType === 'immediate' 
        ? '🚀 *RETIRADA IMEDIATA*' 
        : `🕒 *RETIRADA AGENDADA - ${order.scheduledTime}*`;

    const message = encodeURIComponent(
      `*🆕 RESUMO DO PEDIDO #${order.number}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 *CLIENTE:* ${order.customerName.toUpperCase()}\n` +
      `${locationText}\n` +
      `💰 *PAGAMENTO:* ${order.paymentMethod ? paymentTexts[order.paymentMethod as keyof typeof paymentTexts] : 'Pendente'}\n\n` +
      `🛒 *ITENS DO PEDIDO:*\n${itemsText}\n\n` +
      (order.generalObservation ? `📝 *OBSERVAÇÃO:* ${order.generalObservation}\n\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      (order.deliveryInfo?.deliveryFee ? `🛵 *TAXA DE ENTREGA: ${formatPrice(order.deliveryInfo.deliveryFee)}*\n` : '') +
      `*TOTAL: ${formatPrice(order.total)}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🔗 *ACOMPANHE SEU PEDIDO:*\n${trackingLink}\n\n` +
      `_Enviado via ${settings.name}_`
    );

    window.open(`https://wa.me/${formatWhatsAppNumber(order.customerPhone)}?text=${message}`, '_blank');
  };

  const handleConfirmOrder = () => {
    if (!order.customerPhone) return;
    const message = encodeURIComponent(
      `✅ *PEDIDO RECEBIDO!* \n\n` +
      `Olá, *${order.customerName}*! \n` +
      `Recebemos seu pedido *#${order.number}* e já vamos começar a preparar com todo carinho. \n\n` +
      `Você pode acompanhar o status por aqui: ${window.location.origin}/?order=${order.id}`
    );
    window.open(`https://wa.me/${formatWhatsAppNumber(order.customerPhone)}?text=${message}`, '_blank');
  };

  if (order.status === 'cancelled') return null;

  return (
    <>
      <div className="bg-card rounded-lg border border-border p-4 space-y-3 overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">#{order.number || '---'}</span>
            <Badge 
              variant="secondary" 
              onClick={order.customerPhone ? handleForwardToCustomer : undefined}
              className={`text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                order.origin === 'online' ? 'bg-origin-online/10 text-origin-online' :
                order.origin === 'counter' || order.origin === 'counter_qr' ? 'bg-origin-counter/10 text-origin-counter' :
                order.origin === 'table' ? 'bg-origin-table/10 text-origin-table' :
                'bg-red-500/10 text-red-600 border-red-200'
              }`}
            >
              <div className="flex items-center gap-1">
                {order.origin === 'online' && <MessageSquare className="w-3 h-3" />}
                {originLabels[order.origin]}
              </div>
            </Badge>
            <Badge 
              variant={order.paymentStatus === 'paid' ? 'default' : 'outline'}
              className={`text-xs ${order.paymentStatus === 'paid' ? 'bg-success text-success-foreground' : 'text-warning border-warning'}`}
            >
              {order.paymentStatus === 'paid' ? `Pago (${paymentMethodLabels[order.paymentMethod || 'cash']})` : 'Pendente'}
            </Badge>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs font-bold ${isLate() ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
              {formatTime(order.createdAt)}
            </span>
            {order.isPrinted && (
              <Badge variant="outline" className="text-[9px] py-0 h-4 bg-blue-50 text-blue-600 border-blue-200 gap-1 px-1">
                <Printer className="w-2 h-2" />
                IMPRESSO
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {order.origin === 'table' ? (
            <span className="font-medium">Mesa {order.tableNumber}</span>
          ) : (
            <span className="font-medium">{order.customerName || 'Cliente'}</span>
          )}
          {order.pickupType === 'scheduled' && (
            <div className="flex items-center gap-1 text-warning bg-warning/10 px-2 py-0.5 rounded text-[10px] font-bold">
              <Clock className="w-3 h-3" />
              <span>AGENDADO: {order.scheduledTime}</span>
              <button onClick={() => setIsEditingTime(true)} className="p-0.5 hover:bg-warning/20 rounded ml-1">
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
          {order.pickupType === 'delivery' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 text-[10px] py-0 h-5 px-1.5 gap-1">
               <Truck className="w-3 h-3" />
               DELIVERY
            </Badge>
          )}
          {order.pickupType === 'immediate' && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200 text-[10px] py-0 h-5 px-1.5 gap-1">
               <StoreIcon className="w-3 h-3" />
               RETIRADA
            </Badge>
          )}
        </div>

        {order.pickupType === 'delivery' && order.deliveryInfo && (
          <div className="bg-secondary/30 p-2 rounded text-xs space-y-0.5 border border-border/50">
            <p className="font-bold flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" />
              {order.deliveryInfo.street}, {order.deliveryInfo.number}
            </p>
            <p className="text-muted-foreground ml-4">
              {settings.neighborhoods.find(n => n.id === order.deliveryInfo?.neighborhoodId)?.name}
              {order.deliveryInfo.complement ? ` • ${order.deliveryInfo.complement}` : ''}
            </p>
          </div>
        )}

        <div className="space-y-1.5 py-2 border-t border-b border-border">
          {order.items.map((item) => (
            <div key={item.id} className="text-sm">
              <div className="flex justify-between">
                <span>
                  <span className="font-medium">{item.quantity}x</span> {item.product.name}
                </span>
              </div>
              {item.selectedExtras.length > 0 && (
                <p className="text-xs text-muted-foreground ml-4">
                  + {item.selectedExtras.map(e => e.name).join(', ')}
                </p>
              )}
              {item.observation && (
                <div className="mt-2 bg-yellow-400 text-black px-3 py-1.5 rounded-md shadow-[0_2px_10px_rgba(250,204,21,0.4)] animate-pulse border-2 border-black/10">
                  <p className="text-[11px] font-[900] uppercase tracking-tighter flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    ATENÇÃO: {item.observation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {(order.generalObservation || order.internalObservation) && (
          <div className="space-y-1 mt-2">
            {order.generalObservation && (
              <div className="bg-orange-500 text-white p-2 rounded-lg text-[11px] font-black uppercase flex items-center gap-2 shadow-md">
                <MessageSquare className="w-3.5 h-3.5" />
                OBS GERAL: {order.generalObservation}
              </div>
            )}
            {order.internalObservation && (
              <div className="bg-zinc-800 text-white p-2 rounded-lg text-[11px] font-black uppercase flex items-center gap-2 border border-zinc-700">
                <Lock className="w-3.5 h-3.5" />
                INTERNO: {order.internalObservation}
              </div>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg text-primary">{formatPrice(order.total)}</span>
            {statusConfig[order.status].next && (
              <Button size="sm" onClick={handleAdvanceStatus} className="gap-1 px-4">
                {order.status === 'received' && 'Preparar'}
                {order.status === 'preparing' && 'Pronto'}
                {order.status === 'ready' && 'Entregar'}
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {order.paymentStatus === 'pending' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1 border-success text-success hover:bg-success hover:text-white flex-1 min-w-[100px]">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Receber
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleMarkAsPaid('pix')}>💵 Pix</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMarkAsPaid('cash')}>💰 Dinheiro</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMarkAsPaid('credit_card')}>💳 C. Crédito</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMarkAsPaid('debit_card')}>💳 C. Débito</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrint} 
                className={`h-8 w-8 p-0 ${order.isPrinted ? 'text-blue-500 border-blue-200' : ''}`}
                title={order.isPrinted ? 'Reimprimir comanda' : 'Imprimir comanda'}
              >
                <Printer className="w-3.5 h-3.5" />
              </Button>
              {order.status !== 'completed' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => cancelOrder(order.id)} 
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
              {order.status === 'received' && order.customerPhone && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleConfirmOrder} 
                  className="h-8 gap-1 border-primary/30 text-primary hover:bg-primary/10 flex-1"
                  title="Confirmar recebimento via WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Confirmar
                </Button>
              )}
              {order.customerPhone && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleForwardToCustomer} 
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                  title="Encaminhar comprovante ao cliente"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </Button>
              )}
              {order.status === 'ready' && order.customerPhone && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNotifyReady} 
                  className="h-8 gap-1.5 border-primary text-primary hover:bg-primary hover:text-white"
                  title="Avisar que está pronto"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Avisar</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <OrderPrinter order={order} />

      <Dialog open={isEditingTime} onOpenChange={setIsEditingTime}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Editar horário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditingTime(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSaveTime} className="flex-1">
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
