import { useState, useEffect, useRef, useMemo } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { Order, OrderStatus } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/utils/format';
import { 
  Flame, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  VolumeX, 
  Printer, 
  Utensils, 
  ChefHat,
  BellRing,
  ArrowRight,
  PackageCheck,
  Truck,
  Store,
  Sparkles,
  Layers
} from 'lucide-react';

export function KitchenKDS() {
  const { orders, updateOrderStatus, markOrderAsPrinted, settings } = useOrders();
  const [statusFilter, setStatusFilter] = useState<'all' | 'received' | 'preparing' | 'ready'>('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'delivery' | 'table' | 'counter'>('all');
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const previousReceivedCount = useRef<number>(0);

  // Pedidos ativos da cozinha (recebidos, em preparo ou prontos)
  const activeOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status === 'completed' || o.status === 'cancelled') return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      
      if (originFilter === 'delivery' && o.pickupType !== 'delivery') return false;
      if (originFilter === 'table' && o.origin !== 'table') return false;
      if (originFilter === 'counter' && o.origin !== 'counter' && o.origin !== 'counter_qr' && (o.pickupType !== 'immediate' || o.origin === 'table')) return false;

      return true;
    });
  }, [orders, statusFilter, originFilter]);

  // Resumo de Itens Pendentes na Cozinha (Produção Agregada da Chapa)
  const kitchenItemsSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    orders
      .filter(o => o.status === 'received' || o.status === 'preparing')
      .forEach(o => {
        o.items.forEach(item => {
          const name = item.product.name;
          summary[name] = (summary[name] || 0) + item.quantity;
        });
      });
    return Object.entries(summary).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const receivedOrdersCount = orders.filter(o => o.status === 'received').length;

  // Alerta sonoro quando entra um novo pedido recebido
  useEffect(() => {
    if (receivedOrdersCount > previousReceivedCount.current && previousReceivedCount.current !== 0) {
      if (!isSoundMuted) {
        playKitchenAlertSound();
      }
    }
    previousReceivedCount.current = receivedOrdersCount;
  }, [receivedOrdersCount, isSoundMuted]);

  const playKitchenAlertSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.9;
      audio.play().catch(() => {});
    } catch (e) {
      console.warn("Could not play alert sound:", e);
    }
  };

  const getElapsedTimeMinutes = (createdAt: Date) => {
    const diffMs = new Date().getTime() - new Date(createdAt).getTime();
    return Math.floor(diffMs / 60000);
  };

  const getOriginBadge = (order: Order) => {
    if (order.pickupType === 'delivery') {
      return { label: '🛵 DELIVERY', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    }
    if (order.origin === 'table') {
      return { label: `🍽️ MESA ${order.tableNumber || ''}`, bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    }
    return { label: '🛍️ BALCÃO', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
  };

  return (
    <div className="space-y-6">
      {/* ── Top Bar KDS ───────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-zinc-900/90 border border-white/10 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl border border-primary/30 text-primary">
            <ChefHat className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black italic text-white uppercase tracking-tight flex items-center gap-2">
              MONITOR DE COZINHA <span className="text-primary">KDS</span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">Exibição de pedidos em tempo real com controle de produção</p>
          </div>
        </div>

        {/* Filtros + Som */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Som Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsSoundMuted(!isSoundMuted);
              if (isSoundMuted) playKitchenAlertSound();
            }}
            className={`gap-2 h-10 rounded-xl border-white/10 ${isSoundMuted ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="font-bold text-xs">{isSoundMuted ? 'Som Mudo' : 'Alerta Sonoro Ativo'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={playKitchenAlertSound}
            className="h-10 text-xs font-bold text-zinc-400 hover:text-white"
          >
            <BellRing className="w-4 h-4 mr-1.5 text-primary" /> Testar Alerta
          </Button>

          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* Filtros por Status */}
          <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5">
            {[
              { id: 'all', label: 'Todos', count: orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length },
              { id: 'received', label: 'Recebidos', count: orders.filter(o => o.status === 'received').length },
              { id: 'preparing', label: 'Em Preparo', count: orders.filter(o => o.status === 'preparing').length },
              { id: 'ready', label: 'Prontos', count: orders.filter(o => o.status === 'ready').length },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === f.id ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Resumo de Produção da Chapa (Itens Agregados) ── */}
      {kitchenItemsSummary.length > 0 && (
        <div className="bg-zinc-900/80 border border-amber-500/30 p-4 rounded-2xl shadow-lg space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
            <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Resumo de Produção na Chapa (Pendente)</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {kitchenItemsSummary.map(([itemName, qty]) => (
              <div 
                key={itemName}
                className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-white/10 text-xs shadow-sm"
              >
                <span className="font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                  {qty}x
                </span>
                <span className="font-bold text-white">{itemName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Grid de Pedidos KDS ───────────────────────────────── */}
      {activeOrders.length === 0 ? (
        <div className="py-20 text-center bg-zinc-900/30 rounded-3xl border border-dashed border-white/10 space-y-3">
          <ChefHat className="w-14 h-14 text-zinc-600 mx-auto" />
          <div>
            <p className="text-lg font-bold text-zinc-300">Nenhum pedido pendente na cozinha</p>
            <p className="text-xs text-zinc-500 mt-1">Novos pedidos entrarão aqui automaticamente com alarme sonoro.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {activeOrders.map(order => {
            const elapsedMin = getElapsedTimeMinutes(order.createdAt);
            const isUrgent = elapsedMin > (settings.prepTime || 30);
            const originInfo = getOriginBadge(order);

            return (
              <div
                key={order.id}
                className={`rounded-2xl border-2 overflow-hidden flex flex-col justify-between shadow-2xl transition-all ${
                  order.status === 'received'
                    ? 'bg-zinc-900/90 border-blue-500/60 shadow-blue-500/10'
                    : order.status === 'preparing'
                      ? 'bg-zinc-900/90 border-amber-500/70 shadow-amber-500/10'
                      : 'bg-zinc-900/90 border-emerald-500/70 shadow-emerald-500/10'
                }`}
              >
                {/* Top Header Card */}
                <div className={`p-4 border-b flex items-center justify-between ${
                  order.status === 'received'
                    ? 'bg-blue-500/15 border-blue-500/30'
                    : order.status === 'preparing'
                      ? 'bg-amber-500/15 border-amber-500/30'
                      : 'bg-emerald-500/15 border-emerald-500/30'
                }`}>
                  <div>
                    <span className="text-2xl font-black text-white tracking-wider">#{order.number}</span>
                    <Badge className={`ml-2 text-xs font-black border ${originInfo.bg}`}>
                      {originInfo.label}
                    </Badge>
                  </div>

                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                    isUrgent ? 'bg-red-500 text-white animate-bounce shadow-md' : 'bg-black/50 text-zinc-300'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsedMin} min</span>
                  </div>
                </div>

                {/* Info Cliente / Destino */}
                <div className="px-4 py-2 bg-black/40 text-xs text-zinc-300 font-semibold border-b border-white/5 flex justify-between items-center">
                  <span className="truncate">👤 {order.customerName || (order.origin === 'table' ? `Mesa ${order.tableNumber}` : 'Cliente')}</span>
                  <span className="text-[11px] text-zinc-400 shrink-0">
                    {order.pickupType === 'delivery' ? '🛵 Entrega' : order.pickupType === 'scheduled' ? `🕒 Agendado ${order.scheduledTime || ''}` : '🛍️ Retirada'}
                  </span>
                </div>

                {/* Lista de Itens do Pedido (Fonte Grande para Cozinha) */}
                <div className="p-5 flex-1 space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="space-y-1 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <span className="text-xl font-black text-primary bg-primary/10 rounded-xl w-10 h-10 flex items-center justify-center shrink-0 border border-primary/20">
                          {item.quantity}x
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-black text-white leading-snug">
                            {item.product.name}
                          </p>

                          {/* Complementos em Destaque */}
                          {item.selectedExtras && item.selectedExtras.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.selectedExtras.map(extra => (
                                <p key={extra.id} className="text-xs font-black text-emerald-400 leading-tight">
                                  + {extra.name}
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Observação do Item em Amarelo Alerta */}
                          {item.observation && (
                            <div className="mt-1.5 bg-amber-500/20 border border-amber-500/40 p-2 rounded-xl">
                              <p className="text-xs font-black text-amber-300 italic leading-tight">
                                ⚠️ OBS: {item.observation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Observação Geral do Pedido */}
                  {order.generalObservation && (
                    <div className="mt-3 p-3 bg-red-500/15 border border-red-500/40 rounded-xl space-y-0.5">
                      <p className="text-xs font-black text-red-400 uppercase tracking-wider">Atenção Geral:</p>
                      <p className="text-xs font-bold text-white italic">{order.generalObservation}</p>
                    </div>
                  )}
                </div>

                {/* Footer Ações KDS */}
                <div className="p-4 bg-zinc-950/80 border-t border-white/10 space-y-2">
                  {order.status === 'received' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-black font-black text-sm uppercase tracking-wider rounded-xl gap-2 shadow-lg shadow-amber-500/20"
                    >
                      <Flame className="w-5 h-5 fill-current" />
                      Iniciar Preparo
                    </Button>
                  )}

                  {order.status === 'preparing' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-sm uppercase tracking-wider rounded-xl gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Pronto para Entrega / Retirada
                    </Button>
                  )}

                  {order.status === 'ready' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-sm uppercase tracking-wider rounded-xl gap-2 border border-white/10"
                    >
                      <PackageCheck className="w-5 h-5 text-emerald-400" />
                      Finalizar Pedido
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
