import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatPrice } from '@/utils/format';
import { toast } from 'sonner';
import { 
  Utensils, 
  Receipt, 
  CreditCard, 
  Banknote, 
  QrCode, 
  CheckCircle2, 
  BellRing, 
  Copy, 
  Check, 
  Clock, 
  AlertCircle,
  X
} from 'lucide-react';

export function TableServiceBar() {
  const [searchParams] = useSearchParams();
  const { orders, addOrder, settings } = useOrders();

  // Read table from query params or session
  const tableParam = searchParams.get('table') || searchParams.get('mesa') || sessionStorage.getItem('thita_active_table');

  const [activeTable, setActiveTable] = useState<string | null>(tableParam);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billPaymentMethod, setBillPaymentMethod] = useState<'pix' | 'card' | 'cash'>('pix');
  const [changeForAmount, setChangeForAmount] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [billRequestedSuccess, setBillRequestedSuccess] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
    if (tableParam) {
      setActiveTable(tableParam);
      sessionStorage.setItem('thita_active_table', tableParam);
    }
  }, [tableParam]);

  // Find all active orders made by this table in the current session
  const tableOrders = useMemo(() => {
    if (!activeTable) return [];
    return orders.filter(o => 
      o.origin === 'table' && 
      String(o.tableNumber) === String(activeTable) && 
      o.status !== 'cancelled'
    );
  }, [orders, activeTable]);

  // Accumulated total for this table
  const tableTotal = useMemo(() => {
    return tableOrders.reduce((sum, o) => sum + o.total, 0);
  }, [tableOrders]);

  if (!activeTable) {
    return null;
  }

  const handleRequestBill = async () => {
    setIsRequesting(true);
    try {
      const changeNote = (billPaymentMethod === 'cash' && changeForAmount) 
        ? ` (Troco para: R$ ${changeForAmount})` 
        : '';

      const methodLabels = {
        pix: '💎 PIX NA MESA',
        card: '💳 CARTÃO (MÁQUINA NA MESA)',
        cash: `💵 DINHEIRO${changeNote}`
      };

      // Dispara o pedido de conta para o sistema em tempo real
      await addOrder({
        origin: 'table',
        pickupType: 'immediate',
        customerName: `SOLICITAÇÃO DE CONTA - Mesa ${activeTable}`,
        tableNumber: String(activeTable),
        items: [],
        generalObservation: `🚨 PEDIDO DE CONTA NA MESA ${activeTable}! Forma preferida: ${methodLabels[billPaymentMethod]}. Valor estimado: ${formatPrice(tableTotal)}`,
        status: 'received',
        paymentStatus: 'pending',
        paymentMethod: billPaymentMethod === 'card' ? 'credit_card' : billPaymentMethod === 'cash' ? 'cash' : 'pix',
        total: tableTotal
      });

      setBillRequestedSuccess(true);
      toast.success(`Conta da Mesa ${activeTable} solicitada!`, {
        description: 'O garçom já foi notificado e está a caminho da sua mesa.',
        duration: 5000,
      });
    } catch (e) {
      console.error('Erro ao pedir conta:', e);
      toast.error('Não foi possível solicitar a conta automaticamente. Por favor, chame o atendente.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCopyPix = () => {
    const pixKey = settings.whatsappNumber || '16999999999';
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    toast.success('Chave Pix copiada com sucesso!');
    setTimeout(() => setCopiedPix(false), 3000);
  };

  return (
    <>
      {/* ── Top Fixed Table Indicator ── */}
      <div className="sticky top-0 z-40 bg-zinc-950/95 border-b border-amber-500/30 backdrop-blur-md px-4 py-2 text-white shadow-lg">
        <div className="container flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black italic uppercase text-white tracking-tight truncate">
                  Você está na <span className="text-amber-400">Mesa {activeTable}</span>
                </span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate">
                Faça pedidos direto para a cozinha e peça a conta pelo celular
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setBillRequestedSuccess(false);
              setIsBillModalOpen(true);
            }}
            className="h-8 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black font-black text-xs uppercase tracking-wider border border-amber-500/40 shadow-sm transition-all gap-1.5 flex-shrink-0"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Pedir a Conta</span>
          </Button>
        </div>
      </div>

      {/* ── MODAL: PEDIR A CONTA NA MESA ── */}
      <Dialog open={isBillModalOpen} onOpenChange={setIsBillModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border border-amber-500/30 text-white p-5 rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base font-black italic uppercase">
              <span className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                Comanda & Conta — Mesa {activeTable}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Revise seu consumo ou solicite o fechamento sem sair da mesa.
            </DialogDescription>
          </DialogHeader>

          {billRequestedSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase text-white">
                  Conta Solicitada com Sucesso!
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  O garçom já recebeu o chamado no painel e está a caminho da <b>Mesa {activeTable}</b>.
                </p>
              </div>

              {billPaymentMethod === 'pix' && (
                <div className="p-4 bg-zinc-900 border border-white/10 rounded-2xl space-y-2 text-center">
                  <p className="text-xs font-bold text-amber-400 uppercase">Pagamento via Pix na Mesa</p>
                  <p className="text-[11px] text-zinc-400">Copie a chave Pix abaixo para agilizar:</p>
                  <div className="flex items-center justify-between gap-2 bg-zinc-950 p-2.5 rounded-xl border border-white/10">
                    <span className="text-xs font-mono text-white truncate">
                      {settings.whatsappNumber || 'thita.lanches@pix.com.br'}
                    </span>
                    <Button size="sm" onClick={handleCopyPix} className="h-7 text-xs gap-1 bg-primary">
                      {copiedPix ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedPix ? 'Copiado' : 'Copiar'}
                    </Button>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setIsBillModalOpen(false)}
                className="w-full h-11 bg-primary hover:bg-red-700 font-bold text-xs uppercase tracking-wider rounded-xl"
              >
                Voltar ao Cardápio
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Resumo do Consumo da Mesa */}
              <div className="bg-zinc-900/90 border border-white/10 p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-400 uppercase">
                  <span>Itens pedidos na mesa:</span>
                  <span className="text-white">{tableOrders.length} pedido(s)</span>
                </div>

                {tableOrders.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs divide-y divide-white/5">
                    {tableOrders.map(order => (
                      <div key={order.id} className="pt-1.5 first:pt-0">
                        <div className="flex justify-between font-bold text-white">
                          <span>Pedido #{order.number}</span>
                          <span className="text-emerald-400">{formatPrice(order.total)}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-1">
                          {order.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic py-2 text-center">
                    Você ainda não finalizou pedidos nesta sessão pelo aplicativo.
                  </p>
                )}

                {tableTotal > 0 && (
                  <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
                    <span className="text-xs font-black uppercase text-white">Total Consumido:</span>
                    <span className="text-xl font-black text-amber-400">
                      {formatPrice(tableTotal)}
                    </span>
                  </div>
                )}
              </div>

              {/* Como você prefere pagar? */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Como deseja pagar?
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillPaymentMethod('pix')}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-xs font-black uppercase transition-all ${
                      billPaymentMethod === 'pix'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                        : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-amber-400" />
                    <span>Pix</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillPaymentMethod('card')}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-xs font-black uppercase transition-all ${
                      billPaymentMethod === 'card'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                        : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    <span>Cartão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillPaymentMethod('cash')}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-xs font-black uppercase transition-all ${
                      billPaymentMethod === 'cash'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                        : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-amber-400" />
                    <span>Dinheiro</span>
                  </button>
                </div>
              </div>

              {/* Se for Dinheiro: Troco */}
              {billPaymentMethod === 'cash' && (
                <div className="space-y-1.5 bg-zinc-900/80 p-3 rounded-xl border border-white/10">
                  <Label className="text-xs text-zinc-400 font-bold uppercase">Precisa de troco para quanto?</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">R$</span>
                    <Input
                      placeholder="Ex: 50,00 ou 100,00"
                      value={changeForAmount}
                      onChange={e => setChangeForAmount(e.target.value)}
                      className="h-8 bg-zinc-950 border-white/10 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleRequestBill}
                disabled={isRequesting}
                className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <BellRing className="w-4 h-4" />
                <span>{isRequesting ? 'Notificando garçom...' : `Confirmar e Chamar Garçom (Mesa ${activeTable})`}</span>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
