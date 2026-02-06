import { Order } from '@/types/order';
import { storeSettings } from '@/data/mockData';

interface OrderPrinterProps {
  order: Order;
}

export function OrderPrinter({ order }: OrderPrinterProps) {
  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="print-only p-4 text-black bg-white font-mono text-sm leading-tight w-[80mm] mx-auto border border-black/10">
      <div className="text-center mb-4 border-b border-black border-dashed pb-2">
        <h1 className="text-xl font-bold uppercase">{storeSettings.name}</h1>
        <p className="text-xs">Comprovante de Pedido</p>
      </div>

      <div className="flex justify-between items-center mb-2">
        <span className="text-lg font-bold">#{order.number}</span>
        <span className="text-xs">{formatDateTime(order.createdAt)}</span>
      </div>

      <div className="mb-4 text-xs">
        <p><strong>Origem:</strong> {
          order.origin === 'online' ? 'WhatsApp' :
          order.origin === 'counter' ? 'Balcão' :
          order.origin === 'table' ? 'Mesa' : 'iFood'
        }</p>
        
        {order.origin === 'table' ? (
          <p><strong>Mesa:</strong> {order.tableNumber}</p>
        ) : (
          <p><strong>Cliente:</strong> {order.customerName}</p>
        )}

        {order.pickupType === 'delivery' && order.deliveryInfo && (
          <div className="mt-2 border-t border-black border-dotted pt-1">
             <p className="font-bold uppercase">ENTREGA (DELIVERY)</p>
             <p>End: {order.deliveryInfo.street}, {order.deliveryInfo.number}</p>
             <p>Bairro: {storeSettings.neighborhoods.find(n => n.id === order.deliveryInfo?.neighborhoodId)?.name}</p>
             {order.deliveryInfo.complement && <p>Comp: {order.deliveryInfo.complement}</p>}
             {order.deliveryInfo.reference && <p>Ref: {order.deliveryInfo.reference}</p>}
          </div>
        )}

        {order.pickupType === 'scheduled' && (
          <p className="text-sm font-bold mt-1">🕒 AGENDADO: {order.scheduledTime}</p>
        )}
      </div>

      <div className="border-t border-b border-black border-dashed py-2 mb-2">
        <div className="flex justify-between font-bold mb-1 border-b border-black border-dotted pb-1">
          <span>Item</span>
          <span>Tot.</span>
        </div>
        {order.items.map((item, idx) => (
          <div key={idx} className="mb-2">
            <div className="flex justify-between items-start">
              <span className="flex-1">
                {item.quantity}x {item.product.name}
              </span>
              <span className="ml-2">
                {formatPrice((item.product.price + item.selectedExtras.reduce((acc, e) => acc + e.price, 0)) * item.quantity)}
              </span>
            </div>
            {item.selectedExtras.length > 0 && (
              <div className="pl-4 text-[10px] italic">
                {item.selectedExtras.map(e => `+ ${e.name}`).join('\n')}
              </div>
            )}
            {item.observation && (
              <div className="pl-4 text-[10px] font-bold">
                Obs: {item.observation}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-1 mb-4">
        {order.generalObservation && (
          <div className="text-xs italic bg-gray-100 p-1">
            <strong>Obs. Geral:</strong> {order.generalObservation}
          </div>
        )}
        {order.internalObservation && (
          <div className="text-xs italic border border-black/20 p-1">
            <strong>Obs. Interna:</strong> {order.internalObservation}
          </div>
        )}
      </div>

      <div className="text-right text-lg font-bold pt-2 border-t-2 border-black">
        TOTAL: {formatPrice(order.total)}
      </div>

      <div className="text-center mt-6 text-[10px]">
        <p>Agradecemos a preferência!</p>
        <p>--- Thita Lanches ---</p>
      </div>

      <style>{`
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body * {
            visibility: hidden;
          }
          .print-only, .print-only * {
            visibility: visible;
          }
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
        }
        .print-only {
          display: none;
        }
        @media print {
          .print-only {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
