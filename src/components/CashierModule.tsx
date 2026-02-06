import { useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { CashierLog, Order } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  BookOpen, 
  Lock, 
  Unlock, 
  FileText, 
  Printer, 
  History,
  TrendingUp,
  CreditCard,
  Banknote,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

import { formatPrice } from '@/utils/format';

export function CashierModule() {
  const { 
    orders, 
    settings, 
    updateSettings, 
    cashierLogs, 
    addCashierLog, 
    userRole 
  } = useOrders();

  const [initialValue, setInitialValue] = useState<number>(0);
  const [note, setNote] = useState('');

  const lastLog = cashierLogs[0];
  const lastOpenLog = cashierLogs.find(l => l.type === 'open');

  // Calculate current session stats (since last open)
  const currentSessionOrders = orders.filter(o => 
    o.status === 'completed' && 
    (!lastOpenLog || new Date(o.createdAt) > new Date(lastOpenLog.timestamp))
  );

  const calculateSessionSummary = (sessionOrders: Order[]) => {
    const summary = {
      pix: 0,
      cash: 0,
      credit: 0,
      debit: 0,
      delivery: 0,
      counter: 0,
      online: 0,
      totalOrders: sessionOrders.length,
      totalSales: 0
    };

    sessionOrders.forEach(o => {
      summary.totalSales += o.total;
      
      // Payment Methods
      if (o.paymentMethod === 'pix') summary.pix += o.total;
      else if (o.paymentMethod === 'cash') summary.cash += o.total;
      else if (o.paymentMethod === 'credit_card') summary.credit += o.total;
      else if (o.paymentMethod === 'debit_card') summary.debit += o.total;

      // Origins/Pickup
      if (o.pickupType === 'delivery') summary.delivery += o.total;
      if (o.origin === 'online') summary.online += o.total;
      else summary.counter += o.total;
    });

    return summary;
  };

  const sessionSummary = calculateSessionSummary(currentSessionOrders);

  const handleOpenCashier = () => {
    addCashierLog({
      type: 'open',
      timestamp: new Date(),
      value: initialValue,
      responsible: userRole === 'admin' ? 'Administrador' : 'Funcionário',
      note: note.trim() || undefined
    });
    updateSettings({ ...settings, isCashierOpen: true });
    setInitialValue(0);
    setNote('');
  };

  const handleCloseCashier = () => {
    const summary = calculateSessionSummary(currentSessionOrders);
    addCashierLog({
      type: 'close',
      timestamp: new Date(),
      value: summary.totalSales, // Or actual physical count if provided
      responsible: userRole === 'admin' ? 'Administrador' : 'Funcionário',
      summary
    });
    updateSettings({ ...settings, isCashierOpen: false });
  };

  const handlePrintReport = (log: CashierLog) => {
    if (!log.summary) return;
    
    const printContent = `
      ================================
      RELATÓRIO DE FECHAMENTO
      ================================
      DATA: ${new Date(log.timestamp).toLocaleDateString()}
      HORA: ${new Date(log.timestamp).toLocaleTimeString()}
      RESP: ${log.responsible}
      --------------------------------
      VENDAS POR PAGAMENTO:
      PIX:      ${formatPrice(log.summary.pix)}
      DINHEIRO: ${formatPrice(log.summary.cash)}
      CRÉDITO:  ${formatPrice(log.summary.credit)}
      DÉBITO:   ${formatPrice(log.summary.debit)}
      --------------------------------
      VENDAS POR ORIGEM:
      SITE/WHATS: ${formatPrice(log.summary.online)}
      BALCÃO:     ${formatPrice(log.summary.counter)}
      DELIVERY:   ${formatPrice(log.summary.delivery)}
      --------------------------------
      RESUMO:
      PEDIDOS:    ${log.summary.totalOrders}
      TOTAL:      ${formatPrice(log.summary.totalSales)}
      ================================
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; padding: 20px;">${printContent}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Fluxo de Caixa</h2>
          <p className="text-sm text-muted-foreground">Gerenciamento de aberturas, fechamentos e vendas.</p>
        </div>
        <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${settings.isCashierOpen ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
          {settings.isCashierOpen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span className="text-xs font-bold uppercase tracking-wider">Caixa {settings.isCashierOpen ? 'Aberto' : 'Fechado'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashier Control Card */}
        <Card className="lg:col-span-1 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Controle de Turno</CardTitle>
            <CardDescription>Inicie ou finalize seu período de trabalho.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!settings.isCashierOpen ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Troco Inicial</Label>
                  <Input 
                    type="number" 
                    placeholder="R$ 0,00" 
                    value={initialValue} 
                    onChange={(e) => setInitialValue(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observação (Opcional)</Label>
                  <Input 
                    placeholder="Ex: Nota de R$ 50 para troco" 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <Button onClick={handleOpenCashier} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 h-11">
                  <BookOpen className="w-4 h-4" />
                  Abrir Caixa
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-secondary/30 rounded-xl border border-border/50 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sessão Atual</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Vendas</p>
                      <p className="text-lg font-bold text-primary">{formatPrice(sessionSummary.totalSales)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Pedidos</p>
                      <p className="text-lg font-bold">{sessionSummary.totalOrders}</p>
                    </div>
                  </div>
                  <div className="pt-2 grid grid-cols-2 gap-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                      <Wallet className="w-3 h-3" /> Pix: {formatPrice(sessionSummary.pix)}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground justify-end">
                      <Banknote className="w-3 h-3" /> Din: {formatPrice(sessionSummary.cash)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button onClick={handleCloseCashier} variant="destructive" className="w-full gap-2 h-11">
                    <History className="w-4 h-4" />
                    Fechar Caixa
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground italic">
                    Ao fechar, o relatório será gerado automaticamente.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Livro Caixa (History) - Visible to Admin or limited to Employee */}
        <Card className="lg:col-span-2 shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Livro Caixa / Histórico</CardTitle>
              <CardDescription>Registros de movimentações e fechamentos.</CardDescription>
            </div>
            <History className="w-5 h-5 text-muted-foreground opacity-20" />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[150px]">Data/Hora</TableHead>
                    <TableHead>Operação</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashierLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                        Nenhum registro encontrado no livro caixa.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cashierLogs.map((log) => (
                      <TableRow key={log.id} className="group">
                        <TableCell className="text-xs font-medium">
                          <div className="flex flex-col">
                            <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                            <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {log.type === 'open' ? (
                              <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="bg-amber-100 text-amber-700 p-1.5 rounded-lg">
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <span className="font-bold text-xs uppercase tracking-wider">
                              {log.type === 'open' ? 'Abertura' : 'Fechamento'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{log.responsible}</TableCell>
                        <TableCell className="text-right font-bold text-xs">
                          {formatPrice(log.value)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {log.summary && (
                              <>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                      <FileText className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Resumo do Fechamento</DialogTitle>
                                      <DialogDescription>
                                        Finalizado em {new Date(log.timestamp).toLocaleString()} por {log.responsible}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Vendas por Pagamento</p>
                                          <div className="text-sm space-y-1 font-medium">
                                            <div className="flex justify-between"><span>Pix:</span> <span>{formatPrice(log.summary.pix)}</span></div>
                                            <div className="flex justify-between"><span>Dinheiro:</span> <span>{formatPrice(log.summary.cash)}</span></div>
                                            <div className="flex justify-between"><span>Crédito:</span> <span>{formatPrice(log.summary.credit)}</span></div>
                                            <div className="flex justify-between"><span>Débito:</span> <span>{formatPrice(log.summary.debit)}</span></div>
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Vendas por Origem</p>
                                          <div className="text-sm space-y-1 font-medium">
                                            <div className="flex justify-between"><span>Site/Whats:</span> <span>{formatPrice(log.summary.online)}</span></div>
                                            <div className="flex justify-between"><span>Balcão:</span> <span>{formatPrice(log.summary.counter)}</span></div>
                                            <div className="flex justify-between"><span>Delivery:</span> <span>{formatPrice(log.summary.delivery)}</span></div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="pt-4 border-t border-border flex justify-between items-end">
                                        <div>
                                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Total de Pedidos</p>
                                          <p className="text-lg font-bold">{log.summary.totalOrders}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Faturamento Total</p>
                                          <p className="text-2xl font-black text-primary">{formatPrice(log.summary.totalSales)}</p>
                                        </div>
                                      </div>
                                      <Button onClick={() => handlePrintReport(log)} className="w-full gap-2">
                                        <Printer className="w-4 h-4" />
                                        Imprimir Relatório
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => handlePrintReport(log)}
                                >
                                  <Printer className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {userRole === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-primary mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Vendas Totais</span>
              </div>
              <p className="text-2xl font-black">{formatPrice(orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0))}</p>
            </CardContent>
          </Card>
          {/* Add more admin stats here if needed */}
        </div>
      )}
    </div>
  );
}
