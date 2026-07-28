import { useState, useEffect, useRef } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { Order, OrderStatus } from '@/types/order';
import { Button } from '@/components/ui/button';
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
  PackageCheck
} from 'lucide-react';

export function KitchenKDS() {
  const { orders, updateOrderStatus, markOrderAsPrinted, settings } = useOrders();
  const [filter, setFilter] = useState<'all' | 'received' | 'preparing' | 'ready'>('all');
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const previousReceivedCount = useRef<number>(0);

  // Pedidos ativos da cozinha (recebidos, em preparo ou prontos)
  const activeOrders = orders.filter(o => 
    o.status !== 'completed' && 
    o.status !== 'cancelled' &&
    (filter === 'all' || o.status === filter)
  );

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

  const getOriginLabel = (origin: string) => {
    const origins: Record<string, string> = {
      online: '🌐 ONLINE',
      counter: '🛍️ BALCÃO',
      table: '🍽️ MESA',
      ifood: '🛵 IFOOD',
      counter_qr: '📱 QR BALCÃO'
    };
    return origins[origin] || origin.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* ── Top Bar KDS ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/90 border border-white/10 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl border border-primary/30 text-primary">
            <ChefHat className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black italic text-white uppercase tracking-tight flex items-center gap-2">
              MONITOR DE COZINHA <span className="text-primary">KDS</span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">Exibição de pedidos em tempo real para produção</p>
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

          {/* Filtros */}
          <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5">
            {[
              { id: 'all', label: 'Todos', count: orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length },
              { id: 'received', label: 'Recebidos', count: orders.filter(o => o.status === 'received').length },
              { id: 'preparing', label: 'Em Preparo', count: orders.filter(o => o.status === 'preparing').length },
              { id: 'ready', label: 'Prontos', count: orders.filter(o => o.status === 'ready').length },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f.id ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid de Pedidos KDS ───────────────────────────────── */}
      {activeOrders.length === 0 ? (
        <div className="py-20 text-center bg-zinc-900/30 rounded-3xl border border-dashed border-white/10">
          <Utensils className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-lg font-bold text-zinc-400">Nenhum pedido pendente na cozinha</p>
          <p className="text-xs text-zinc-600 mt-1">Novos pedidos aparecerão aqui automaticamente com alarme sonoro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {activeOrders.map(order => {
            const elapsedMin = getElapsedTimeMinutes(order.createdAt);
            const isUrgent = elapsedMin > (settings.prepTime || 30);

            return (
              <div
                key={order.id}
                className={`rounded-2xl border-2 overflow-hidden flex flex-col justify-between shadow-2xl transition-all ${
                  order.status === 'received'
                    ? 'bg-zinc-900/90 border-blue-500/50 shadow-blue-500/10'
                    : order.status === 'preparing'
                      ? 'bg-zinc-900/90 border-amber-500/60 shadow-amber-500/10'
                      : 'bg-zinc-900/90 border-emerald-500/60 shadow-emerald-500/10'
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
                    <span className="ml-3 text-xs font-bold px-2 py-0.5 rounded-full bg-black/40 text-zinc-300 border border-white/10">
                      {getOriginLabel(order.origin)}
                    </span>
                  </div>

                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                    isUrgent ? 'bg-red-500 text-white animate-bounce' : 'bg-black/50 text-zinc-300'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsedMin} min</span>
                  </div>
                </div>

                {/* Info Cliente / Mesa */}
                <div className="px-4 py-2 bg-black/30 text-xs text-zinc-400 font-semibold border-b border-white/5 flex justify-between">
                  <span>👤 {order.customerName || `Mesa ${order.tableNumber || '---'}`}</span>
                  <span>{order.pickupType === 'delivery' ? '🛵 Entrega' : order.pickupType === 'scheduled' ? `🕒 Agendado ${order.scheduledTime || ''}` : '🛍️ Retirada'}</span>
                </div>

                {/* Lista de Itens do Pedido (Fonte Grande para Cozinha) */}
                <div className="p-5 flex-1 space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="space-y-1 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <span className="text-xl font-black text-primary bg-primary/10 rounded-lg w-9 h-9 flex items-center justify-center shrink-0">
                          {item.quantity}x
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-extrabold text-white leading-snug">
                            {item.product.name}
                          </p>

                          {/* Complementos em Destaque */}
                          {item.selectedExtras && item.selectedExtras.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.selectedExtras.map(extra => (
                                <p key={extra.id} className="text-xs font-bold text-emerald-400 leading-tight">
                                  + {extra.name}
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Observação do Item em Amarelo Alerta */}
                          {item.observation && (
                            <div className="mt-1 bg-amber-500/20 border border-amber-500/40 p-1.5 rounded-lg">
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
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <p className="text-xs font-black text-red-400 uppercase tracking-wider mb-0.5">Observação do Pedido:</p>
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
