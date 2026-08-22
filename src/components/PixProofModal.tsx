import { useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { Order } from '@/types/order';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/utils/format';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  ExternalLink, 
  ZoomIn, 
  Clock, 
  Receipt, 
  User, 
  Utensils, 
  Phone,
  QrCode,
  AlertTriangle
} from 'lucide-react';

interface PixProofModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PixProofModal({ order, isOpen, onClose }: PixProofModalProps) {
  const { updatePaymentStatus, settings } = useOrders();
  const [isApproving, setIsApproving] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!order) return null;

  const isPaid = order.paymentStatus === 'paid';
  const proofUrl = order.pixProofUrl;

  const formatWhatsAppNumber = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 || digits.length === 10) return `55${digits}`;
    return digits;
  };

  const handleApprovePix = async () => {
    setIsApproving(true);
    try {
      await updatePaymentStatus(order.id, 'paid', 'pix');
      toast.success(`Pix do Pedido #${order.number} APROVADO!`, {
        description: `Pagamento de ${formatPrice(order.total)} confirmado no caixa.`,
      });
      onClose();
    } catch (e) {
      toast.error('Erro ao aprovar comprovante.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!order.customerPhone) {
      toast.error('Telefone do cliente não informado.');
      return;
    }

    const message = encodeURIComponent(
      `Olá *${order.customerName || 'Cliente'}*! Aqui é do *${settings.name}*.\n` +
      `Estamos conferindo o pagamento Pix do seu pedido *#${order.number}* no valor de *${formatPrice(order.total)}*.\n\n` +
      (isPaid ? `✅ Seu Pix já foi aprovado e confirmado!` : `Poderia por gentileza nos reenviar o comprovante do banco?`)
    );

    window.open(`https://wa.me/${formatWhatsAppNumber(order.customerPhone)}?text=${message}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg bg-zinc-950 border border-amber-500/40 text-white p-5 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-base font-black italic uppercase text-white">
              <QrCode className="w-5 h-5 text-amber-400" />
              Conferência de Pix — Pedido #{order.number}
            </DialogTitle>
            <Badge className={`text-xs font-black uppercase ${
              isPaid ? 'bg-emerald-500 text-black' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
            }`}>
              {isPaid ? '✅ Pix Aprovado' : '⏳ Aguardando Aprovação'}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Confira o valor e os dados do comprovante antes de aprovar o pagamento no caixa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Cartão de Destaque Financeiro */}
          <div className="bg-zinc-900/90 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Valor Esperado do Pedido:</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                {formatPrice(order.total)}
              </p>
            </div>

            <div className="text-right space-y-1">
              <p className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
                {order.origin === 'table' ? <Utensils className="w-3.5 h-3.5 text-amber-400" /> : <User className="w-3.5 h-3.5 text-zinc-400" />}
                {order.origin === 'table' ? `Mesa ${order.tableNumber || '---'}` : (order.customerName || 'Cliente')}
              </p>
              <p className="text-[11px] text-zinc-400 flex items-center justify-end gap-1">
                <Clock className="w-3 h-3" />
                {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Visualizador do Comprovante */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-zinc-300 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-400" />
                Comprovante Anexado:
              </span>
              {proofUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="h-7 text-xs text-zinc-400 hover:text-white gap-1"
                >
                  <ZoomIn className="w-3 h-3" />
                  {isZoomed ? 'Reduzir' : 'Ampliar Imagem'}
                </Button>
              )}
            </div>

            {proofUrl ? (
              <div className="bg-black/60 border border-white/10 rounded-2xl p-2 flex justify-center items-center overflow-hidden">
                <img 
                  src={proofUrl} 
                  alt="Comprovante Pix" 
                  className={`rounded-xl object-contain transition-all cursor-pointer ${
                    isZoomed ? 'max-h-[500px] w-full' : 'max-h-[300px] w-auto'
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                />
              </div>
            ) : (
              <div className="py-10 text-center bg-zinc-900/50 rounded-2xl border border-dashed border-white/10 space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-xs font-bold text-zinc-300">Nenhuma foto de comprovante anexada pelo cliente</p>
                <p className="text-[11px] text-zinc-500">
                  O cliente pode ter enviado o comprovante diretamente no WhatsApp ou realizado a transferência no caixa.
                </p>
              </div>
            )}
          </div>

          {/* Ações Rápidas de Conferência */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            {!isPaid ? (
              <Button
                onClick={handleApprovePix}
                disabled={isApproving}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isApproving ? 'Aprovando no sistema...' : `✅ APROVAR PIX (${formatPrice(order.total)})`}</span>
              </Button>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Pagamento Pix aprovado e computado no caixa!
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {order.customerPhone && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenWhatsApp}
                  className="h-9 text-xs font-bold border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black gap-1.5 rounded-xl"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chamar no WhatsApp
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-9 text-xs font-bold border-white/10 text-zinc-400 hover:text-white rounded-xl"
              >
                Fechar Janela
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
