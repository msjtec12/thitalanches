import { useOrders } from '@/contexts/OrderContext';
import { OrderCard } from './OrderCard';
import { OrderStatus } from '@/types/order';

const columns: { status: OrderStatus; title: string; color: string }[] = [
  { status: 'received', title: 'Recebido', color: 'bg-status-received' },
  { status: 'preparing', title: 'Em preparo', color: 'bg-status-preparing' },
  { status: 'ready', title: 'Pronto', color: 'bg-status-ready' },
  { status: 'completed', title: 'Finalizado', color: 'bg-status-completed' },
];

export function KanbanBoard() {
  const { orders } = useOrders();

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter(order => order.status === status && order.status !== 'cancelled');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnOrders = getOrdersByStatus(column.status);
        return (
          <div key={column.status} className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="font-semibold">{column.title}</h3>
              <span className="text-sm text-muted-foreground">({columnOrders.length})</span>
            </div>
            <div className="space-y-3">
              {columnOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {columnOrders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum pedido
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
