import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Store, Clock, DollarSign, Wallet, CreditCard, Banknote, Lock, Settings2, Map, QrCode } from 'lucide-react';
import { maskPhone, unmaskPhone } from '@/utils/phoneHelper';
import { formatPrice } from '@/utils/format';
import { useState, useEffect } from 'react';
import { CashierModule } from './CashierModule';
import { NeighborhoodManager } from './NeighborhoodManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from "sonner";

export function SystemDashboard() {
  const { settings, updateSettings, orders, userRole } = useOrders();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Stats calculation
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalSales = completedOrders.reduce((sum, o) => sum + o.total, 0);
  
  const webOrders = completedOrders.filter(o => o.origin === 'online');
  const counterOrders = completedOrders.filter(o => o.origin !== 'online');

  const webSales = webOrders.reduce((sum, o) => sum + o.total, 0);
  const counterSales = counterOrders.reduce((sum, o) => sum + o.total, 0);

  const salesByMethod = completedOrders.reduce((acc, o) => {
    let method = o.paymentMethod || 'cash';
    acc[method] = (acc[method] || 0) + o.total;
    return acc;
  }, {} as Record<string, number>);

  const totalCards = (salesByMethod.card || 0) + (salesByMethod.credit_card || 0) + (salesByMethod.debit_card || 0);

  const handleSaveSettings = () => {
    updateSettings(localSettings);
    toast.success("Configurações salvas com sucesso!", {
      description: "As alterações já estão valendo para a loja.",
      duration: 3000,
    });
  };

  return (
    <div className="space-y-10">
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-zinc-900/50 border border-white/5 p-1 h-10 gap-1 rounded-lg">
            <TabsTrigger value="overview" className="gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <DollarSign className="w-3.5 h-3.5" />
              Visão Geral
            </TabsTrigger>
            {userRole === 'admin' && (
              <TabsTrigger value="delivery" className="gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                <Map className="w-3.5 h-3.5" />
                Entrega / Taxas
              </TabsTrigger>
            )}
            {userRole === 'admin' && (
              <TabsTrigger value="config" className="gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                <Settings2 className="w-3.5 h-3.5" />
                Geral
              </TabsTrigger>
            )}
            {userRole === 'admin' && (
              <TabsTrigger value="qrcodes" className="gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                <QrCode className="w-3.5 h-3.5" />
                QR Codes
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0 space-y-6">
           <CashierModule />
           
           {userRole === 'admin' && (
             <div className="grid grid-cols-1 gap-6">
               <Card className="border-border shadow-sm bg-primary/[0.01]">
                 <CardHeader>
                   <div className="flex items-center justify-between">
                     <div>
                       <CardTitle className="text-base flex items-center gap-2">
                         <DollarSign className="w-4 h-4 text-primary" />
                         Faturamento Total (Bruto)
                       </CardTitle>
                       <CardDescription>Consolidado de todas as vendas concluídas.</CardDescription>
                     </div>
                     <p className="text-3xl font-black text-primary">{formatPrice(totalSales)}</p>
                   </div>
                 </CardHeader>
                 <CardContent className="space-y-6">
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div className="bg-background p-4 rounded-xl border border-border/50 shadow-sm hover:border-primary/30 transition-colors">
                       <div className="flex items-center gap-2 text-muted-foreground mb-1">
                         <Wallet className="w-4 h-4" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Pix</span>
                       </div>
                       <p className="text-xl font-black">{formatPrice(salesByMethod.pix || 0)}</p>
                     </div>
                     <div className="bg-background p-4 rounded-xl border border-border/50 shadow-sm hover:border-primary/30 transition-colors">
                       <div className="flex items-center gap-2 text-muted-foreground mb-1">
                         <CreditCard className="w-4 h-4" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Cartões</span>
                       </div>
                       <p className="text-xl font-black">{formatPrice(totalCards)}</p>
                       <div className="flex gap-2 mt-1">
                          <span className="text-[9px] text-muted-foreground">Cr: {formatPrice(salesByMethod.credit_card || 0)}</span>
                          <span className="text-[9px] text-muted-foreground">Déb: {formatPrice(salesByMethod.debit_card || 0)}</span>
                       </div>
                     </div>
                     <div className="bg-background p-4 rounded-xl border border-border/50 shadow-sm hover:border-primary/30 transition-colors">
                       <div className="flex items-center gap-2 text-muted-foreground mb-1">
                         <Banknote className="w-4 h-4" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Dinheiro</span>
                       </div>
                       <p className="text-xl font-black">{formatPrice(salesByMethod.cash || 0)}</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-border/50">
                     <div className="p-3">
                       <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">WhatsApp / Site</p>
                       <p className="text-lg font-bold text-blue-600">{formatPrice(webSales)}</p>
                       <p className="text-[10px] text-muted-foreground">{webOrders.length} pedidos</p>
                     </div>
                     <div className="text-right border-l border-border/50 p-3">
                       <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Vendas Presenciais</p>
                       <p className="text-lg font-bold text-orange-600">{formatPrice(counterSales)}</p>
                       <p className="text-[10px] text-muted-foreground">{counterOrders.length} pedidos</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </div>
           )}
        </TabsContent>

        {userRole === 'admin' && (
          <TabsContent value="delivery" className="mt-0">
            <NeighborhoodManager />
          </TabsContent>
        )}

        <TabsContent value="config" className="mt-0">
          {userRole === 'admin' && (
            <Card className="border-border shadow-sm max-w-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="w-4 h-4 text-primary" />
                  Geral do Sistema
                </CardTitle>
                <CardDescription>Configurações básicas de funcionamento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="store-name">Nome da Loja</Label>
                    <Input 
                      id="store-name" 
                      value={localSettings.name} 
                      onChange={(e) => setLocalSettings({...localSettings, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="flex items-center gap-2">WhatsApp Loja</Label>
                    <Input 
                      id="whatsapp" 
                      placeholder="(00) 00000-0000"
                      value={maskPhone(localSettings.whatsappNumber || '')} 
                      onChange={(e) => setLocalSettings({...localSettings, whatsappNumber: unmaskPhone(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prep-time" className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      Tempo Médio (min)
                    </Label>
                    <Input 
                      id="prep-time" 
                      type="number" 
                      value={localSettings.prepTime} 
                      onChange={(e) => setLocalSettings({...localSettings, prepTime: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-pin" className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5" />
                      PIN do Admin
                    </Label>
                    <Input 
                      id="admin-pin" 
                      type="password"
                      maxLength={4}
                      placeholder="**** (Oculto por segurança)"
                      value={localSettings.adminPin || ''} 
                      onChange={(e) => setLocalSettings({...localSettings, adminPin: e.target.value})}
                    />
                    <p className="text-[10px] text-muted-foreground italic">Preencha apenas se desejar alterar o PIN.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo da Loja (URL)</Label>
                    <Input 
                      id="logo" 
                      placeholder="https://..."
                      value={localSettings.logoUrl || ''} 
                      onChange={(e) => setLocalSettings({...localSettings, logoUrl: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Cor Principal</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="color" 
                        type="color"
                        className="w-12 p-1 h-10"
                        value={localSettings.primaryColor || '#ef4444'} 
                        onChange={(e) => setLocalSettings({...localSettings, primaryColor: e.target.value, primaryColorHover: e.target.value + 'dd'})}
                      />
                      <Input 
                        value={localSettings.primaryColor || '#ef4444'} 
                        onChange={(e) => setLocalSettings({...localSettings, primaryColor: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/50">
                  <div className="space-y-0.5">
                    <Label htmlFor="store-open">Loja Aberta (Site)</Label>
                    <p className="text-[10px] text-muted-foreground">Habilita ou desabilita as vendas pelo site.</p>
                  </div>
                  <Switch 
                    id="store-open"
                    checked={localSettings.isOpen}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, isOpen: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="space-y-0.5">
                    <Label htmlFor="sound-notif" className="text-primary font-bold">Alertas Sonoros</Label>
                    <p className="text-[10px] text-muted-foreground">Tocar som quando chegar um novo pedido.</p>
                  </div>
                  <Switch 
                    id="sound-notif"
                    checked={localSettings.isSoundEnabled}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, isSoundEnabled: checked})}
                  />
                </div>
                
                <Button onClick={handleSaveSettings} className="w-full mt-4 h-12 font-black uppercase tracking-widest shadow-lg shadow-primary/20">Salvar Alterações</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="qrcodes" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-primary" />
                  QR Code para Balcão
                </CardTitle>
                <CardDescription>Para clientes fazerem o pedido direto do celular ao chegar.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
                <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-xl">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '?origin=counter_qr')}`} 
                    alt="QR Counter"
                    className="w-48 h-48"
                  />
                </div>
                <div className="space-y-2 max-w-full">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">URL do Balcão:</p>
                  <p className="text-[10px] break-all text-zinc-400 font-mono bg-zinc-100 p-2 rounded-lg">{window.location.origin}?origin=counter_qr</p>
                </div>
                <Button variant="outline" className="w-full gap-2 font-bold" onClick={() => window.print()}>
                  Imprimir QR Code
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-primary" />
                  QR Code para Mesas
                </CardTitle>
                <CardDescription>Pedidos com auto-atendimento direto na mesa.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 py-10 opacity-70">
                <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm opacity-40">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '?origin=table')}`} 
                    alt="QR Table"
                    className="w-48 h-48 grayscale"
                  />
                </div>
                <p className="text-[10px] font-bold text-primary uppercase text-center bg-primary/10 px-4 py-2 rounded-full">
                  Recurso Premium: Pedidos por Mesa
                </p>
                <Button disabled className="w-full gap-2 font-bold opacity-50">
                  Configurar Mesas
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
