import { useOrders } from '@/contexts/OrderContext';
import { Check, Clock, Package, Bike, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
            <div className="relative">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const Icon = step.icon;

                return (
                  <div key={step.status} className="flex items-start gap-4 mb-8 last:mb-0">
                    <div className="relative z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isCompleted ? 'bg-primary border-primary text-white' : 'bg-background border-border text-muted-foreground'
                      } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div className={`absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-8 ${
                          index < currentStatusIndex ? 'bg-primary' : 'bg-border'
                        }`} />
                      )}
                    </div>
                    <div className="pt-2">
                      <p className={`font-bold uppercase tracking-tighter text-sm ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-primary font-medium animate-pulse">
                          {order.status === 'received' && 'Aguardando confirmação...'}
                          {order.status === 'preparing' && 'Estamos preparando com carinho!'}
                          {order.status === 'ready' && 'Seu pedido está pronto para retirada!'}
                          {order.status === 'completed' && 'Esperamos que aprove seu lanche!'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Resumo</h4>
              <div className="space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="text-sm flex justify-between">
                    <span>{item.quantity}x {item.product.name}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>

            <Button className="w-full" variant="outline" onClick={handleClose}>
              Continuar comprando
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
