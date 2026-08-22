import { useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { Order, OrderStatus } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPrice, formatTime } from '@/utils/format';
import { toast } from 'sonner';
import { 
  Truck, 
  MapPin, 
  Phone, 
  ExternalLink, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Bike, 
  User, 
  Banknote, 
  CreditCard, 
  QrCode, 
  AlertTriangle,
  Navigation,
  Check,
  Search,
  ChevronRight,
  Sparkles,
  Receipt
} from 'lucide-react';
import { PixProofModal } from './PixProofModal';

export function DeliveryDispatch() {
  const { orders, updateOrderStatus, updatePaymentStatus, settings } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPixOrder, setSelectedPixOrder] = useState<Order | null>(null);
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'kitchen' | 'ready' | 'in_route' | 'delivered'>('all');
  const [motoboyAssignments, setMotoboyAssignments] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('thita_motoboy_assignments');
    return saved ? JSON.parse(saved) : {};
  });

  const motoboyList = ['Entregador 1', 'Entregador 2', 'Entregador 3', 'Motoboy Próprio', 'Outro'];

  // Filter only delivery orders
  const deliveryOrders = orders.filter(o => 
    o.pickupType === 'delivery' && o.status !== 'cancelled'
  );

  const filteredOrders = deliveryOrders.filter(order => {
    // Status filter
    if (deliveryFilter === 'kitchen' && (order.status !== 'received' && order.status !== 'preparing')) return false;
    if (deliveryFilter === 'ready' && order.status !== 'ready') return false;
    if (deliveryFilter === 'delivered' && order.status !== 'completed') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const numMatch = String(order.number).includes(q);
      const nameMatch = (order.customerName || '').toLowerCase().includes(q);
      const phoneMatch = (order.customerPhone || '').includes(q);
      const streetMatch = (order.deliveryInfo?.street || '').toLowerCase().includes(q);
      const neighborhoodMatch = (order.deliveryInfo?.neighborhood || '').toLowerCase().includes(q);
      return numMatch || nameMatch || phoneMatch || streetMatch || neighborhoodMatch;
    }
    return true;
  });

  const handleAssignMotoboy = (orderId: string, motoboy: string) => {
    const updated = { ...motoboyAssignments, [orderId]: motoboy };
    setMotoboyAssignments(updated);
    localStorage.setItem('thita_motoboy_assignments', JSON.stringify(updated));
    toast.success(`Entregador ${motoboy} vinculado ao Pedido!`);
  };

  const formatWhatsAppNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 || digits.length === 10) return `55${digits}`;
    return digits;
  };

  const getMapsUrl = (order: Order) => {
    if (!order.deliveryInfo) return '';
    const query = `${order.deliveryInfo.street}, ${order.deliveryInfo.number}, ${order.deliveryInfo.neighborhood || ''}, ${order.deliveryInfo.city || 'Ibitinga'}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const handleNotifyDeliveryDeparted = (order: Order) => {
    if (!order.customerPhone) {
      toast.error('Telefone do cliente não informado.');
      return;
    }

    const motoboy = motoboyAssignments[order.id];
    const motoboyText = motoboy ? `\n🛵 *Entregador:* ${motoboy}` : '';
    const trackingLink = `${window.location.origin}/?order=${order.id}`;

    const message = encodeURIComponent(
      `*🛵 SEU PEDIDO SAIU PARA ENTREGA! (#${order.number})*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Olá, *${order.customerName || 'Cliente'}*!\n` +
      `Seu pedido acabou de sair da nossa cozinha e está a caminho! 🚀${motoboyText}\n\n` +
      `🏠 *Endereço:* ${order.deliveryInfo?.street || ''}, ${order.deliveryInfo?.number || ''}\n` +
      `💰 *Total:* ${formatPrice(order.total)}\n\n` +
      `🔗 *Acompanhe em tempo real:*\n${trackingLink}\n\n` +
      `Por favor, fique atento para receber o entregador! 😉\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Enviado via ${settings.name}_`
    );

    window.open(`https://wa.me/${formatWhatsAppNumber(order.customerPhone)}?text=${message}`, '_blank');
  };

  const countByStage = {
    all: deliveryOrders.length,
    kitchen: deliveryOrders.filter(o => o.status === 'received' || o.status === 'preparing').length,
    ready: deliveryOrders.filter(o => o.status === 'ready').length,
    delivered: deliveryOrders.filter(o => o.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Central de Entregas ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/90 border border-white/10 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-400">
            <Truck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black italic text-white uppercase tracking-tight flex items-center gap-2">
              CENTRAL DE <span className="text-amber-400">ENTREGAS & EXPEDIÇÃO</span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Controle de rotas, despacho de motoboys, endereços no Maps e WhatsApp de saída
            </p>
          </div>
        </div>

        {/* Filtros de Estágio de Entrega */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-white/5 flex-wrap">
          {[
            { id: 'all', label: 'Todas Entregas', count: countByStage.all },
            { id: 'kitchen', label: 'Na Cozinha', count: countByStage.kitchen, color: 'text-blue-400' },
            { id: 'ready', label: 'Prontos para Sair', count: countByStage.ready, color: 'text-emerald-400 font-black' },
            { id: 'delivered', label: 'Entregues', count: countByStage.delivered, color: 'text-zinc-500' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setDeliveryFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                deliveryFilter === tab.id
                  ? 'bg-amber-500 text-black shadow-md font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${deliveryFilter === tab.id ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Barra de Busca de Entregas ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Buscar por número do pedido, nome do cliente, telefone, rua ou bairro..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-zinc-900/80 border-white/10 text-white rounded-xl text-xs"
          />
        </div>
      </div>

      {/* ── Lista de Entregas ── */}
      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-zinc-900/30 rounded-3xl border border-dashed border-white/10 space-y-2">
          <Bike className="w-12 h-12 text-zinc-600 mx-auto" />
          <p className="text-base font-bold text-zinc-400">Nenhuma entrega encontrada para os filtros aplicados</p>
          <p className="text-xs text-zinc-600">Pedidos com modalidade "Entrega (Delivery)" aparecerão aqui automaticamente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map(order => {
            const mapsUrl = getMapsUrl(order);
            const motoboy = motoboyAssignments[order.id] || '';
            const isReadyToShip = order.status === 'ready';
            const isCompleted = order.status === 'completed';

            return (
              <div
                key={order.id}
                className={`rounded-2xl border-2 p-5 bg-zinc-900/90 shadow-xl transition-all space-y-4 ${
                  isReadyToShip 
                    ? 'border-emerald-500/70 shadow-emerald-500/10' 
                    : isCompleted 
                      ? 'border-white/5 opacity-70' 
                      : 'border-amber-500/40 shadow-amber-500/5'
                }`}
              >
                {/* Header do Card de Entrega */}
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-white tracking-wider">#{order.number}</span>
                      <Badge className={`text-[10px] font-black uppercase ${
                        order.status === 'received' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        order.status === 'preparing' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        order.status === 'ready' ? 'bg-emerald-500 text-black font-black' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {order.status === 'received' ? 'Recebido' :
                         order.status === 'preparing' ? 'Em Preparo' :
                         order.status === 'ready' ? 'Pronto para Sair' : 'Entregue'}
                      </Badge>

                      {order.deliveryInfo?.deliveryFee ? (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Taxa: {formatPrice(order.deliveryInfo.deliveryFee)}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-sm font-extrabold text-white mt-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      {order.customerName || 'Cliente sem nome'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-400">{formatPrice(order.total)}</p>
                    <p className="text-[10px] text-zinc-500 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Bloco de Endereço em Destaque */}
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white leading-snug">
                        {order.deliveryInfo?.street || 'Rua não informada'}, {order.deliveryInfo?.number || 'S/N'}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {order.deliveryInfo?.neighborhood ? `Bairro: ${order.deliveryInfo.neighborhood}` : ''}
                        {order.deliveryInfo?.city ? ` • ${order.deliveryInfo.city}` : ''}
                      </p>
                      {order.deliveryInfo?.complement && (
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          <b>Compl:</b> {order.deliveryInfo.complement}
                        </p>
                      )}
                      {order.deliveryInfo?.reference && (
                        <p className="text-[10px] text-amber-400/90 font-medium mt-0.5">
                          <b>Ref:</b> {order.deliveryInfo.reference}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botões de Ação de Rota */}
                  <div className="flex gap-2 pt-1 border-t border-white/5">
                    {mapsUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(mapsUrl, '_blank')}
                        className="flex-1 h-8 text-[11px] font-bold border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black gap-1.5 rounded-lg"
                      >
                        <Navigation className="w-3 h-3" />
                        Abrir no Google Maps / Waze
                      </Button>
                    )}

                    {order.customerPhone && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://wa.me/${formatWhatsAppNumber(order.customerPhone!)}`, '_blank')}
                        className="h-8 text-[11px] font-bold border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black gap-1.5 rounded-lg"
                      >
                        <Phone className="w-3 h-3" />
                        WhatsApp
                      </Button>
                    )}
                  </div>
                </div>

                {/* Informações Financeiras para o Motoboy */}
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {order.paymentMethod === 'cash' ? <Banknote className="w-4 h-4 text-emerald-400" /> :
                     order.paymentMethod === 'pix' ? <QrCode className="w-4 h-4 text-blue-400" /> :
                     <CreditCard className="w-4 h-4 text-amber-400" />}

                    <span className="font-bold text-zinc-300">
                      {order.paymentMethod === 'cash' ? 'Dinheiro' :
                       order.paymentMethod === 'pix' ? 'Pix' : 'Cartão na Entrega'}
                    </span>

                    <Badge className={`text-[9px] ${order.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {order.paymentStatus === 'paid' ? 'Pago' : 'Cobrar na Entrega'}
                    </Badge>

                    {/* Badge Comprovante Pix */}
                    {(order.paymentMethod === 'pix' || order.pixProofUrl) && (
                      <Badge 
                        onClick={() => setSelectedPixOrder(order)}
                        className={`text-[9px] font-black cursor-pointer uppercase transition-all flex items-center gap-1 shadow-sm ${
                          order.pixProofUrl 
                            ? 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-300 animate-pulse' 
                            : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40'
                        }`}
                        title="Conferir Comprovante Pix"
                      >
                        <Receipt className="w-3 h-3" />
                        {order.pixProofUrl ? '🧾 Comprovante' : 'Conferir Pix'}
                      </Badge>
                    )}
                  </div>

                  {/* Se houver troco */}
                  {order.generalObservation && order.generalObservation.includes('Troco') && (
                    <div className="bg-amber-500/20 px-2.5 py-1 rounded-lg text-amber-300 font-black text-[11px] border border-amber-500/40">
                      ⚠️ {order.generalObservation.split('|').find(p => p.includes('Troco')) || 'Verificar troco'}
                    </div>
                  )}
                </div>

                {/* Resumo de Itens do Pedido */}
                <div className="text-xs space-y-1 text-zinc-400 border-l-2 border-primary/40 pl-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-white font-semibold">{item.quantity}x {item.product.name}</span>
                    </div>
                  ))}
                </div>

                {/* Seleção do Motoboy + Ações de Despacho */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-400">Entregador:</span>
                    <Input
                      placeholder="Nome do motoboy..."
                      value={motoboy}
                      onChange={e => handleAssignMotoboy(order.id, e.target.value)}
                      className="h-8 bg-zinc-950 border-white/10 text-xs text-white rounded-lg flex-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Botão de Avisar no WhatsApp que saiu */}
                    <Button
                      size="sm"
                      onClick={() => handleNotifyDeliveryDeparted(order)}
                      className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-md"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Avisar Saída (Zap)
                    </Button>

                    {/* Botão de Concluir Entrega */}
                    {order.status !== 'completed' ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          updateOrderStatus(order.id, 'completed');
                          updatePaymentStatus(order.id, 'paid');
                          toast.success(`Pedido #${order.number} marcado como Entregue!`);
                        }}
                        className="h-10 bg-primary hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl gap-1.5 shadow-lg shadow-primary/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Concluir Entrega
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled
                        className="h-10 bg-zinc-800 text-zinc-500 font-bold text-xs rounded-xl gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Entrega Concluída
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Conferência de Pix */}
      <PixProofModal 
        order={selectedPixOrder} 
        isOpen={!!selectedPixOrder} 
        onClose={() => setSelectedPixOrder(null)} 
      />
    </div>
  );
}
