import { useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Plus, Trash2, Upload, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { neighborhood } from '@/types/order';
import { toast } from '@/hooks/use-toast';
import { formatPrice } from '@/utils/format';

export function NeighborhoodManager() {
  const { settings, updateSettings } = useOrders();
  const [newNeighborhood, setNewNeighborhood] = useState({ name: '', fee: 0, distance: 0 });
  const [importText, setImportText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddNeighborhood = () => {
    if (!newNeighborhood.name) return;
    
    const neighborhood: neighborhood = {
      id: Math.random().toString(36).substr(2, 9),
      name: newNeighborhood.name,
      deliveryFee: newNeighborhood.fee,
      estimatedDistanceKm: newNeighborhood.distance,
      allowedStreets: []
    };

    updateSettings({
      ...settings,
      neighborhoods: [...(settings.neighborhoods || []), neighborhood]
    });
    
    setNewNeighborhood({ name: '', fee: 0, distance: 0 });
  };

  const handleRemoveNeighborhood = (id: string) => {
    updateSettings({
      ...settings,
      neighborhoods: settings.neighborhoods.filter(n => n.id !== id)
    });
  };

  const handleImportStreets = () => {
    // Expected format: Neighborhood;Street Name
    const lines = importText.split('\n');
    const updatedNeighborhoods = [...settings.neighborhoods];
    let importedCount = 0;

    lines.forEach(line => {
      const [nName, sName] = line.split(';').map(s => s?.trim());
      if (nName && sName) {
        const neighborhood = updatedNeighborhoods.find(n => 
          n.name.toLowerCase() === nName.toLowerCase()
        );
        
        if (neighborhood) {
          if (!neighborhood.allowedStreets) neighborhood.allowedStreets = [];
          if (!neighborhood.allowedStreets.includes(sName)) {
            neighborhood.allowedStreets.push(sName);
            importedCount++;
          }
        }
      }
    });

    updateSettings({
      ...settings,
      neighborhoods: updatedNeighborhoods
    });
    
    toast({
      title: "Importação concluída",
      description: `${importedCount} ruas vinculadas aos bairros correspondentes.`,
    });
    setImportText('');
  };

  const filteredNeighborhoods = settings.neighborhoods.filter(n => 
    n.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Management List */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Bairros Atendidos
                </CardTitle>
                <CardDescription>Gerencie as taxas e bairros de entrega.</CardDescription>
              </div>
              <div className="relative w-48">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input 
                  placeholder="Buscar bairro..." 
                  className="pl-8 h-9 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pb-4 border-b border-border">
              <div className="sm:col-span-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Nome do Bairro</Label>
                <Input 
                  placeholder="Ex: Centro" 
                  value={newNeighborhood.name}
                  onChange={(e) => setNewNeighborhood({...newNeighborhood, name: e.target.value})}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Taxa (R$)</Label>
                <Input 
                  type="number"
                  placeholder="0,00" 
                  value={newNeighborhood.fee}
                  onChange={(e) => setNewNeighborhood({...newNeighborhood, fee: Number(e.target.value)})}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddNeighborhood} size="sm" className="w-full h-8 gap-1">
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {filteredNeighborhoods.map((n) => (
                <div key={n.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/50 group">
                  <div>
                    <p className="font-semibold text-sm">{n.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Fee: {formatPrice(n.deliveryFee)} • {n.allowedStreets?.length || 0} ruas cadastradas
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveNeighborhood(n.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {filteredNeighborhoods.length === 0 && (
                <p className="text-center py-8 text-muted-foreground text-sm italic">Nenhum bairro encontrado.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Street Importer / Validation Tool */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              Importador de Ruas (Excel/CSV)
            </CardTitle>
            <CardDescription>Vincule ruas aos bairros para validação automática.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-xs text-amber-900/80 dark:text-amber-200/80">
                <p className="font-bold mb-1">Dica de Importação:</p>
                <p>Copie as colunas do seu Excel e cole aqui no formato:</p>
                <code className="block mt-1 p-1 bg-black/10 rounded font-mono">Bairro;Nome da Rua</code>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="import-data">Dados do Excel/CSV</Label>
              <Textarea 
                id="import-data"
                placeholder="Centro;Rua General Osório&#10;Centro;Rua Saldanha Marinho&#10;Vila Mariana;Av. Independência"
                className="min-h-[200px] font-mono text-xs"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
            </div>

            <Button onClick={handleImportStreets} className="w-full gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Vincular Ruas aos Bairros
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider font-black italic">Estratégia de Verificação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
            <div className="space-y-1">
              <p className="font-bold">Bloquear entrega em ruas não cadastradas</p>
              <p className="text-xs text-muted-foreground">O sistema impedirá que o cliente finalize o pedido se a rua digitada não pertencer ao bairro selecionado.</p>
            </div>
            <div className="flex items-center gap-2">
               <span className={`text-[10px] font-bold uppercase py-1 px-2 rounded ${settings.isStreetValidationEnabled ? 'bg-emerald-500/20 text-emerald-600' : 'bg-zinc-500/20 text-zinc-600'}`}>
                 {settings.isStreetValidationEnabled ? 'Ativado' : 'Desativado'}
               </span>
               <Button 
                variant={settings.isStreetValidationEnabled ? "destructive" : "default"}
                size="sm"
                onClick={() => updateSettings({...settings, isStreetValidationEnabled: !settings.isStreetValidationEnabled})}
               >
                 {settings.isStreetValidationEnabled ? 'Desativar' : 'Ativar'}
               </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
