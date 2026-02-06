import { useOrders } from '@/contexts/OrderContext';
import { ShoppingBag, Clock, CheckCircle2, DollarSign } from 'lucide-react';
import { formatPrice } from '@/utils/format';

export function DashboardStats() {
  const { orders } = useOrders();

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const pendingOrders = orders.filter(o => o.status === 'received');
  const completedToday = orders.filter(o => o.status === 'completed');
  
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const stats = [
    {
      label: 'Pedidos Ativos',
      value: activeOrders.length,
      icon: ShoppingBag,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Aguardando',
      value: pendingOrders.length,
      icon: Clock,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      label: 'Finalizados (Hoje)',
      value: completedToday.length,
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      label: 'Faturamento Total',
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className={`p-3 rounded-lg ${stat.bg}`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
