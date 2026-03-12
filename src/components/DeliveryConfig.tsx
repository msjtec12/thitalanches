import { useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { fetchAddressFromCep, fetchCoordinatesFromAddress } from '@/utils/delivery';

export function DeliveryConfig() {
  const { settings, updateSettings } = useOrders();

  const [cep, setCep] = useState(settings.storeCep || '');
  const [street, setStreet] = useState(settings.storeStreet || '');
  const [number, setNumber] = useState(settings.storeNumber || '');
  const [city, setCity] = useState(settings.storeCity || '');
  const [state, setState] = useState(settings.storeState || '');
  const [lat, setLat] = useState<number | undefined>(settings.storeLat);
  const [lng, setLng] = useState<number | undefined>(settings.storeLng);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchCep = async () => {
    setIsLoading(true);
    const data = await fetchAddressFromCep(cep);
    if (data) {
      setStreet(data.street);
      setCity(data.city);
      setState(data.state);
      toast({ title: 'CEP encontrado', description: 'Endereço preenchido. Buscando coordenadas...' });

      // Automatically fetch coordinates
      const coords = await fetchCoordinatesFromAddress(data.street, data.city, data.state);
      if (coords) {
        setLat(coords.lat);
        setLng(coords.lng);
        toast({ title: 'Coordenadas encontradas', description: 'Localização do estabelecimento confirmada.' });
      } else {
        toast({ title: 'Aviso', description: 'Não foi possível encontrar as coordenadas exatas deste endereço. Preencha manualmente ou tente outro.', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Erro', description: 'CEP não encontrado.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleSave = () => {
    updateSettings({
      ...settings,
      storeCep: cep,
      storeStreet: street,
      storeNumber: number,
      storeCity: city,
      storeState: state,
      storeLat: lat,
      storeLng: lng,
    });
    toast({ title: 'Sucesso', description: 'Configurações de entrega por distância salvas com sucesso!' });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Configuração de Entrega por Distância
        </CardTitle>
        <CardDescription>
          Defina o endereço físico da loja para calcular as taxas de entrega com base na distância. O limite máximo é de 12km.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>CEP do Estabelecimento</Label>
            <div className="flex gap-2">
              <Input
                placeholder="00000-000"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                maxLength={9}
              />
              <Button disabled={isLoading || cep.length < 8} onClick={handleSearchCep} variant="secondary">
                 <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Rua / Logradouro</Label>
            <Input value={street} onChange={(e) => setStreet(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-2">
            <Label>Número</Label>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="md:col-span-1 space-y-2">
            <Label>Cidade</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="md:col-span-1 space-y-2">
            <Label>Estado (UF)</Label>
            <Input value={state} onChange={(e) => setState(e.target.value)} maxLength={2} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
             <Label>Latitude {lat ? '(Confirmado)' : ''}</Label>
             <Input 
                value={lat || ''} 
                onChange={(e) => setLat(parseFloat(e.target.value))} 
                placeholder="-23.5505" 
                type="number" 
                disabled 
             />
          </div>
          <div className="space-y-2">
             <Label>Longitude {lng ? '(Confirmado)' : ''}</Label>
             <Input 
                value={lng || ''} 
                onChange={(e) => setLng(parseFloat(e.target.value))} 
                placeholder="-46.6333" 
                type="number" 
                disabled 
             />
          </div>
        </div>
        
        <div className="p-4 bg-primary/10 rounded-lg text-sm text-primary mb-4">
          <p className="font-bold mb-1">Tabela de Preços (Raio até 12km):</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <span>Até 1km: R$ 3,00</span>
            <span>1 a 2km: R$ 4,25</span>
            <span>2 a 3km: R$ 5,50</span>
            <span>3 a 4km: R$ 6,75</span>
            <span>4 a 5km: R$ 8,00</span>
            <span>5 a 6km: R$ 9,25</span>
            <span>6 a 7km: R$ 10,50</span>
            <span>7 a 8km: R$ 11,75</span>
            <span>8 a 9km: R$ 13,00</span>
            <span>9 a 10km: R$ 14,25</span>
            <span>10 a 11km: R$ 15,50</span>
            <span>11 a 12km: R$ 16,75</span>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full flex" disabled={!lat || !lng || !number}>
          Salvar Configurações e Habilitar Entrega
        </Button>
      </CardContent>
    </Card>
  );
}
