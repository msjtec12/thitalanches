import { useEffect, useState } from 'react';
import { DollarSign, Map, QrCode, Settings2, Store } from 'lucide-react';
import { toast } from 'sonner';
import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CashierModule } from './CashierModule';
import { DeliveryConfig } from './DeliveryConfig';
import { TableQRManager } from './TableQRManager';
import { formatPrice } from '@/utils/format';
import { maskPhone, unmaskPhone } from '@/utils/phoneHelper';

export function SystemDashboard() {
  const { settings, updateSettings, orders, userRole } = useOrders();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => setLocalSettings(settings), [settings]);

  const completedOrders = orders.filter((order) => order.status === 'completed');
  const totalSales = completedOrders.reduce((sum, order) => sum + order.total, 0);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // PIN is intentionally not part of settings anymore. Authorization is handled
      // exclusively by Supabase Auth + staff_users/RLS.
      const { adminPin: _legacyPin, ...safeSettings } = localSettings;
      await updateSettings(safeSettings);
      toast.success('Configurações salvas com segurança.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível salvar as configurações.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-max min-w-full justify-start bg-zinc-900/50 border border-white/5">
            <TabsTrigger value="overview" className="gap-2"><DollarSign className="w-4 h-4" />Visão geral</TabsTrigger>
            {userRole === 'admin' && <TabsTrigger value="delivery" className="gap-2"><Map className="w-4 h-4" />Entrega</TabsTrigger>}
            {userRole === 'admin' && <TabsTrigger value="config" className="gap-2"><Settings2 className="w-4 h-4" />Configurações</TabsTrigger>}
            {userRole === 'admin' && <TabsTrigger value="qrcodes" className="gap-2"><QrCode className="w-4 h-4" />QR Codes</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <CashierModule />
          {userRole === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle>Faturamento concluído</CardTitle>
                <CardDescription>Somente pedidos marcados como concluídos.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-primary">{formatPrice(totalSales)}</p>
                <p className="text-xs text-muted-foreground mt-1">{completedOrders.length} pedido(s) concluído(s)</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {userRole === 'admin' && (
          <TabsContent value="delivery">
            <DeliveryConfig />
          </TabsContent>
        )}

        {userRole === 'admin' && (
          <TabsContent value="config">
            <Card className="max-w-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Store className="w-4 h-4 text-primary" />Configurações da loja</CardTitle>
                <CardDescription>Acesso administrativo é gerenciado por usuários do Supabase Auth, não por PIN.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="store-name">Nome da loja</Label>
                    <Input id="store-name" value={localSettings.name} onChange={(e) => setLocalSettings({ ...localSettings, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input id="whatsapp" value={maskPhone(localSettings.whatsappNumber || '')} onChange={(e) => setLocalSettings({ ...localSettings, whatsappNumber: unmaskPhone(e.target.value) })} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prep-time">Tempo médio de preparo (min)</Label>
                    <Input id="prep-time" type="number" min={1} max={240} value={localSettings.prepTime} onChange={(e) => setLocalSettings({ ...localSettings, prepTime: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo-url">Logo da loja (URL)</Label>
                    <Input id="logo-url" value={localSettings.logoUrl || ''} onChange={(e) => setLocalSettings({ ...localSettings, logoUrl: e.target.value })} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Cor principal</Label>
                    <div className="flex gap-2">
                      <Input id="primary-color" type="color" className="w-14 p-1" value={localSettings.primaryColor || '#ef4444'} onChange={(e) => setLocalSettings({ ...localSettings, primaryColor: e.target.value })} />
                      <Input value={localSettings.primaryColor || '#ef4444'} onChange={(e) => setLocalSettings({ ...localSettings, primaryColor: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <Label htmlFor="store-open">Loja aberta para pedidos</Label>
                    <p className="text-xs text-muted-foreground">Desative para impedir novos pedidos no cardápio.</p>
                  </div>
                  <Switch id="store-open" checked={localSettings.isOpen} onCheckedChange={(checked) => setLocalSettings({ ...localSettings, isOpen: checked })} />
                </div>

                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <Label htmlFor="sound-enabled">Alertas sonoros</Label>
                    <p className="text-xs text-muted-foreground">Toca um aviso para novos pedidos no painel.</p>
                  </div>
                  <Switch id="sound-enabled" checked={Boolean(localSettings.isSoundEnabled)} onCheckedChange={(checked) => setLocalSettings({ ...localSettings, isSoundEnabled: checked })} />
                </div>

                <Button onClick={() => void handleSaveSettings()} disabled={isSaving} className="w-full h-11 font-bold">
                  {isSaving ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {userRole === 'admin' && (
          <TabsContent value="qrcodes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><QrCode className="w-4 h-4 text-primary" />QR do balcão</CardTitle>
                <CardDescription>Use o link abaixo para pedidos iniciados no balcão.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-5 items-center">
                <div className="bg-white p-3 rounded-2xl">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}?origin=counter_qr`)}`} alt="QR Code do balcão" className="w-36 h-36" />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <code className="block break-all rounded-lg bg-muted p-3 text-xs">{window.location.origin}?origin=counter_qr</code>
                  <Button variant="outline" onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}?origin=counter_qr`); toast.success('Link copiado.'); }}>Copiar link</Button>
                </div>
              </CardContent>
            </Card>
            <TableQRManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
