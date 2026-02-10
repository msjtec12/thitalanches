import { useOrders } from '@/contexts/OrderContext';
import { Check, Clock, Package, Bike, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OrderStatus } from '@/types/order';

import { formatPrice } from '@/utils/format';

const statusSteps: { status: OrderStatus; label: string; icon: any }[] = [
  { status: 'received', label: 'Recebido', icon: Check },
  { status: 'preparing', label: 'Preparando', icon: Clock },
  { status: 'ready', label: 'Pronto', icon: Package },
  { status: 'completed', label: 'Entregue', icon: CheckCircle2 },
];

export function OrderTracking() {
  const { orders } = useOrders();
  const [searchParams, setSearchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  
  const order = orders.find(o => o.id === orderId);

  if (!orderId) return null;

  const handleClose = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('order');
    setSearchParams(newParams);
  };

  const currentStatusIndex = statusSteps.findIndex(s => s.status === order?.status);

  return (
    <Dialog open={!!orderId} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Acompanhamento do Pedido</span>
            <span className="text-primary font-bold">#{order?.number}</span>
          </DialogTitle>
        </DialogHeader>

        {!order ? (
          <div className="py-8 text-center space-y-3">
            <X className="w-12 h-12 text-destructive mx-auto opacity-50" />
            <p className="text-muted-foreground">Pedido não encontrado.</p>
            <Button variant="outline" onClick={handleClose}>Voltar ao início</Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Progress Bar superior */}
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-primary transition-all duration-1000 ease-in-out" 
                 style={{ width: `${((currentStatusIndex + 1) / statusSteps.length) * 100}%` }}
               />
            </div>

            <div className="relative">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const Icon = step.icon;

                return (
                  <div key={step.status} className="flex items-start gap-4 mb-8 last:mb-0">
                    <div className="relative z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                         isCompleted ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-background border-border text-muted-foreground'
                       } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                        <Icon className={`w-5 h-5 ${isCurrent ? 'animate-bounce' : ''}`} />
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div className={`absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-8 transition-colors duration-500 ${
                          index < currentStatusIndex ? 'bg-primary' : 'bg-border'
                        }`} />
                      )}
                    </div>
                    <div className="pt-2">
                      <p className={`font-black uppercase tracking-tighter text-sm ${isCompleted ? 'text-zinc-900' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <div className="mt-1 space-y-1">
                          <p className="text-xs text-primary font-bold uppercase tracking-widest animate-pulse">
                            {order.status === 'received' && 'Aguardando confirmação...'}
                            {order.status === 'preparing' && 'Estamos preparando com carinho!'}
                            {order.status === 'ready' && 'Seu pedido está pronto para retirada!'}
                            {order.status === 'completed' && 'Esperamos que aprove seu lanche!'}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-medium">
                            {order.status === 'preparing' && 'Previsão: 15-25 min'}
                            {order.status === 'ready' && 'Balcão de retirada liberado'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-zinc-400">Resumo do Pedido</h4>
                <Badge variant="outline" className="text-[10px] font-bold">{order.pickupType === 'delivery' ? 'Entrega' : 'Retirada'}</Badge>
              </div>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="text-sm flex justify-between items-center">
                    <span className="font-medium text-zinc-700">{item.quantity}x {item.product.name}</span>
                    <span className="text-zinc-400 text-xs">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-200 pt-3 flex justify-between items-center font-black">
                <span className="text-zinc-500 uppercase text-[10px] tracking-widest">Total Pago</span>
                <span className="text-primary text-xl tracking-tighter italic">{formatPrice(order.total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button className="w-full h-12 font-bold uppercase tracking-widest text-[10px]" variant="outline" onClick={handleClose}>
                Novo Pedido
              </Button>
              <Button 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold uppercase tracking-widest text-[10px] gap-2"
                onClick={() => window.open(`https://wa.me/5516999999999?text=Olá, status do meu pedido #${order.number}`, '_blank')}
              >
                Suporte Whats
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
