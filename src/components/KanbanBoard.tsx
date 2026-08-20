import { useState, useMemo } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { OrderCard } from './OrderCard';
import { DeliveryDispatch } from './DeliveryDispatch';
import { OrderStatus, Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Columns, 
  Truck, 
  Store, 
  Utensils, 
  Globe, 
  Search, 
  AlertTriangle, 
  Clock, 
  Filter,
  CheckCircle,
  Flame,
  PackageCheck
} from 'lucide-react';

const columns: { status: OrderStatus; title: string; color: string; bgBadge: string }[] = [
  { status: 'received', title: 'Recebido', color: 'bg-blue-500', bgBadge: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { status: 'preparing', title: 'Em preparo', color: 'bg-amber-500', bgBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { status: 'ready', title: 'Pronto', color: 'bg-emerald-500', bgBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { status: 'completed', title: 'Finalizado', color: 'bg-zinc-600', bgBadge: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
];

export function KanbanBoard() {
  const { orders, settings } = useOrders();
  const [viewMode, setViewMode] = useState<'kanban' | 'dispatch'>('kanban');
  const [originFilter, setOriginFilter] = useState<'all' | 'delivery' | 'counter' | 'table' | 'online'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate active deliveries and late orders
  const deliveryCount = orders.filter(o => o.pickupType === 'delivery' && o.status !== 'completed' && o.status !== 'cancelled').length;
  const tableCount = orders.filter(o => o.origin === 'table' && o.status !== 'completed' && o.status !== 'cancelled').length;
  const counterCount = orders.filter(o => (o.origin === 'counter' || o.origin === 'counter_qr' || (o.pickupType === 'immediate' && o.origin !== 'table')) && o.status !== 'completed' && o.status !== 'cancelled').length;
  
  const lateOrdersCount = orders.filter(o => {
    if (o.status !== 'received' && o.status !== 'preparing') return false;
    const diff = (new Date().getTime() - new Date(o.createdAt).getTime()) / 60000;
    return diff > (settings.prepTime || 30);
  }).length;

  // Filter orders based on origin & search query
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (order.status === 'cancelled') return false;

      // Filter by origin channel
      if (originFilter === 'delivery') {
        if (order.pickupType !== 'delivery') return false;
      } else if (originFilter === 'counter') {
        if (order.origin !== 'counter' && order.origin !== 'counter_qr' && order.pickupType !== 'immediate') return false;
      } else if (originFilter === 'table') {
        if (order.origin !== 'table') return false;
      } else if (originFilter === 'online') {
        if (order.origin !== 'online') return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = String(order.number).includes(q);
        const nameMatch = (order.customerName || '').toLowerCase().includes(q);
        const phoneMatch = (order.customerPhone || '').includes(q);
        const tableMatch = (order.tableNumber || '').includes(q);
        const streetMatch = (order.deliveryInfo?.street || '').toLowerCase().includes(q);
        return numMatch || nameMatch || phoneMatch || tableMatch || streetMatch;
      }

      return true;
    });
  }, [orders, originFilter, searchQuery]);

  const getOrdersByStatus = (status: OrderStatus) => {
    return filteredOrders.filter(order => order.status === status);
  };

  return (
    <div className="space-y-5">
      {/* ── Barra de Controle e Filtros de Pedidos ── */}
      <div className="bg-zinc-900/90 border border-white/10 p-4 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Alternador de Modo de Visão: Kanban vs Central de Entregas */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                viewMode === 'kanban'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Columns className="w-4 h-4" />
              <span>Painel de Pedidos (Kanban)</span>
            </button>

            <button
              onClick={() => setViewMode('dispatch')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 relative ${
                viewMode === 'dispatch'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Central de Entregas (Delivery)</span>
              {deliveryCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-black text-amber-400">
                  {deliveryCount}
                </span>
              )}
            </button>
          </div>

          {/* Alertas Operacionais */}
          <div className="flex items-center gap-2 flex-wrap">
            {lateOrdersCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded-xl text-xs font-black animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                <span>{lateOrdersCount} pedido(s) em atraso!</span>
              </div>
            )}

            {deliveryCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold">
                <Truck className="w-3.5 h-3.5" />
                <span>{deliveryCount} entrega(s) ativa(s)</span>
              </div>
            )}
          </div>
        </div>

        {/* Linha de Filtros de Canal e Busca */}
        {viewMode === 'kanban' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-white/5">
            {/* Filtros por Origem */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
              {[
                { id: 'all', label: 'Todos os Pedidos', icon: Filter },
                { id: 'delivery', label: `🛵 Delivery (${deliveryCount})`, icon: Truck },
                { id: 'counter', label: `🛍️ Balcão (${counterCount})`, icon: Store },
                { id: 'table', label: `🍽️ Mesas (${tableCount})`, icon: Utensils },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setOriginFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    originFilter === f.id
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Campo de Busca Rápida */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <Input
                placeholder="Buscar pedido, cliente, telefone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-zinc-950 border-white/10 text-xs text-white rounded-xl"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Renderização do Modo Selecionado ── */}
      {viewMode === 'dispatch' ? (
        <DeliveryDispatch />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {columns.map(column => {
            const columnOrders = getOrdersByStatus(column.status);
            return (
              <div 
                key={column.status} 
                className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 flex flex-col min-h-[500px] shadow-lg"
              >
                {/* Header da Coluna */}
                <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color} shadow-sm`} />
                    <h3 className="font-black text-sm text-white uppercase tracking-wider">{column.title}</h3>
                  </div>
                  <Badge className={`text-xs font-black ${column.bgBadge}`}>
                    {columnOrders.length}
                  </Badge>
                </div>

                {/* Lista de Cards da Coluna */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                  {columnOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                  {columnOrders.length === 0 && (
                    <div className="text-center py-16 text-zinc-600 space-y-1">
                      <p className="text-xs font-medium">Nenhum pedido nesta etapa</p>
                    </div>
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
