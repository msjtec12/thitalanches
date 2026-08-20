import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  QrCode, 
  Printer, 
  ExternalLink, 
  Copy, 
  Utensils, 
  Plus, 
  Trash2, 
  Layers, 
  Check, 
  Sparkles,
  Smartphone,
  Store
} from 'lucide-react';

export function TableQRManager() {
  const [tableCount, setTableCount] = useState<number>(15);
  const [customTables, setCustomTables] = useState<string[]>(() => {
    const saved = localStorage.getItem('thita_custom_tables');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return Array.from({ length: 15 }, (_, i) => `Mesa ${String(i + 1).padStart(2, '0')}`);
  });

  const [newTableName, setNewTableName] = useState('');
  const [selectedTableForPrint, setSelectedTableForPrint] = useState<string | null>(null);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);

  const saveTables = (tables: string[]) => {
    setCustomTables(tables);
    localStorage.setItem('thita_custom_tables', JSON.stringify(tables));
  };

  const handleAddTable = () => {
    const name = newTableName.trim();
    if (!name) return;
    if (customTables.includes(name)) {
      toast.error('Já existe uma mesa com esse nome.');
      return;
    }
    const updated = [...customTables, name];
    saveTables(updated);
    setNewTableName('');
    toast.success(`${name} adicionada com sucesso!`);
  };

  const handleRemoveTable = (name: string) => {
    if (window.confirm(`Deseja remover a ${name}?`)) {
      const updated = customTables.filter(t => t !== name);
      saveTables(updated);
      toast.info(`${name} removida.`);
    }
  };

  const handleGenerateSequential = (count: number) => {
    const generated = Array.from({ length: count }, (_, i) => `Mesa ${String(i + 1).padStart(2, '0')}`);
    saveTables(generated);
    toast.success(`${count} mesas geradas com sucesso!`);
  };

  const getTableUrl = (tableName: string) => {
    const cleanNumber = tableName.replace(/[^0-9]/g, '') || tableName;
    return `${window.location.origin}/?origin=table&table=${encodeURIComponent(cleanNumber)}`;
  };

  const getQrCodeImageUrl = (tableName: string, size = 300) => {
    const url = getTableUrl(tableName);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&color=0-0-0&bgcolor=255-255-255`;
  };

  const handleCopyLink = (tableName: string) => {
    const url = getTableUrl(tableName);
    navigator.clipboard.writeText(url);
    toast.success(`Link da ${tableName} copiado!`);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Config ── */}
      <Card className="border-border shadow-sm bg-zinc-900/60">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <QrCode className="w-5 h-5 text-primary" />
                Gerenciador de QR Codes de Mesas
              </CardTitle>
              <CardDescription>
                Gere displays elegantes para totens, adesivos e porta-guardanapos para os clientes pedirem e pagarem direto da mesa.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsBatchPrintOpen(true)}
                className="gap-2 bg-primary hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-primary/20"
              >
                <Printer className="w-4 h-4" />
                Imprimir Todas as Mesas (Lote)
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Ações de Geração Rápida */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-950/80 rounded-2xl border border-white/5">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-zinc-400">Gerar Mesas Sequenciais</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={tableCount}
                  onChange={e => setTableCount(Math.max(1, Number(e.target.value)))}
                  className="h-9 w-24 bg-zinc-900 border-white/10 text-center font-bold"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateSequential(tableCount)}
                  className="h-9 font-bold text-xs border-white/10 hover:bg-white/10"
                >
                  Gerar {tableCount} Mesas (01 a {String(tableCount).padStart(2, '0')})
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-zinc-400">Adicionar Mesa Específica / Setor</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ex: Varanda 01, Deck 02"
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  className="h-9 bg-zinc-900 border-white/10 text-xs"
                />
                <Button
                  size="sm"
                  onClick={handleAddTable}
                  className="h-9 font-bold text-xs bg-primary hover:bg-red-700 text-white gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </Button>
              </div>
            </div>
          </div>

          {/* Grade de Mesas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
                Mesas Cadastradas ({customTables.length})
              </Label>
              <span className="text-[11px] text-zinc-500">Clique para pré-visualizar ou imprimir individualmente</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {customTables.map(tableName => {
                const url = getTableUrl(tableName);
                const qrUrl = getQrCodeImageUrl(tableName, 150);

                return (
                  <div
                    key={tableName}
                    className="bg-zinc-950 border border-white/5 hover:border-primary/50 p-3 rounded-2xl transition-all space-y-3 group shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-white">{tableName}</h4>
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            QR Ativo
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveTable(tableName)}
                        className="text-zinc-600 hover:text-destructive p-1 transition-colors"
                        title="Remover Mesa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Miniatura do QR Code */}
                    <div 
                      onClick={() => setSelectedTableForPrint(tableName)}
                      className="bg-white p-2.5 rounded-xl flex items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform shadow-inner"
                    >
                      <img src={qrUrl} alt={`QR ${tableName}`} className="w-28 h-28 object-contain" />
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/5 text-[10px]">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyLink(tableName)}
                        className="h-7 px-1 text-[10px] text-zinc-400 hover:text-white font-bold"
                        title="Copiar Link"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Link
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(url, '_blank')}
                        className="h-7 px-1 text-[10px] text-zinc-400 hover:text-white font-bold"
                        title="Testar no Celular"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Testar
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedTableForPrint(tableName)}
                        className="h-7 px-1 text-[10px] text-primary hover:text-white hover:bg-primary font-bold"
                        title="Imprimir Display"
                      >
                        <Printer className="w-3 h-3 mr-1" />
                        Imprimir
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── MODAL: DISPLAY INDIVIDUAL DE MESA PRONTO PARA IMPRIMIR ── */}
      <Dialog open={!!selectedTableForPrint} onOpenChange={open => !open && setSelectedTableForPrint(null)}>
        <DialogContent className="max-w-md bg-zinc-950 border border-white/10 text-white p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base font-black italic uppercase">
              <span>Display de Mesa — {selectedTableForPrint}</span>
              <Badge className="bg-primary text-white text-[10px]">Pronto para Imprimir</Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedTableForPrint && (
            <div className="space-y-4 py-2">
              {/* O Cartão Imprimível com Design Premium */}
              <div 
                id="printable-table-card"
                className="p-6 rounded-2xl text-center space-y-4 shadow-2xl border-2 border-amber-500/40 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)',
                  color: '#ffffff'
                }}
              >
                {/* Logo e Nome */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full border-2 border-amber-500/60 overflow-hidden bg-black/60 p-1 shadow-md">
                    <img src="/logo.png" alt="Thita Lanches" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg italic uppercase tracking-tight text-white">
                      THITA <span className="text-primary">LANCHES</span>
                    </h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                      Auto-atendimento na Mesa
                    </p>
                  </div>
                </div>

                {/* Número da Mesa Gigante */}
                <div className="py-2 px-4 bg-primary/20 border border-primary/40 rounded-xl inline-block">
                  <span className="text-2xl font-black italic uppercase tracking-wider text-white">
                    {selectedTableForPrint}
                  </span>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-3.5 rounded-2xl shadow-xl border border-zinc-200">
                    <img 
                      src={getQrCodeImageUrl(selectedTableForPrint, 250)} 
                      alt={`QR ${selectedTableForPrint}`}
                      className="w-44 h-44"
                    />
                  </div>
                </div>

                {/* Instruções */}
                <div className="space-y-1 text-zinc-300">
                  <p className="text-xs font-bold flex items-center justify-center gap-1 text-white">
                    <Smartphone className="w-4 h-4 text-primary" /> Aponte a câmera do seu celular
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    1. Faça seu pedido direto para a cozinha<br />
                    2. Acompanhe o preparo em tempo real<br />
                    3. Peça e pague a conta sem sair da mesa!
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => window.print()}
                  className="w-full h-11 bg-primary hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Display da {selectedTableForPrint}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── MODAL: IMPRESSÃO EM LOTE DE TODAS AS MESAS ── */}
      <Dialog open={isBatchPrintOpen} onOpenChange={setIsBatchPrintOpen}>
        <DialogContent className="max-w-4xl bg-zinc-950 border border-white/10 text-white p-6 rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base font-black italic uppercase">
              <span>Impressão em Lote — Todas as Mesas ({customTables.length})</span>
              <Button
                onClick={() => window.print()}
                className="gap-2 bg-primary hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-primary/20"
              >
                <Printer className="w-4 h-4" />
                Imprimir Todas Agora
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-4">
            {customTables.map(tableName => (
              <div 
                key={tableName}
                className="p-5 rounded-2xl text-center space-y-3 shadow-lg border border-amber-500/30 bg-zinc-900 text-white break-inside-avoid"
              >
                <div className="flex items-center justify-center gap-2">
                  <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain rounded-full border border-amber-500/40" />
                  <span className="font-black text-xs uppercase italic tracking-tight">Thita Lanches</span>
                </div>

                <div className="py-1 px-3 bg-primary/20 border border-primary/40 rounded-lg inline-block">
                  <span className="text-base font-black italic uppercase text-white">
                    {tableName}
                  </span>
                </div>

                <div className="flex justify-center">
                  <div className="bg-white p-2 rounded-xl">
                    <img 
                      src={getQrCodeImageUrl(tableName, 180)} 
                      alt={`QR ${tableName}`}
                      className="w-32 h-32"
                    />
                  </div>
                </div>

                <p className="text-[9px] font-bold text-zinc-300">
                  📱 Peça e Pague Direto da Mesa
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
