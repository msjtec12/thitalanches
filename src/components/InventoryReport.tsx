import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Package, 
  Plus, 
  Search, 
  TrendingUp, 
  Calendar,
  Filter,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '@/utils/format';

export function InventoryReport() {
  const { orders, categories } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');


  const exportToExcel = () => {
    // Header
    let csvContent = "Produto;Categoria;Quantidade Saida;Total Bruto (R$)\n";
    
    // Rows
    statsList.forEach(p => {
      csvContent += `${p.name};${p.category};${p.qty};${p.total.toFixed(2).replace('.', ',')}\n`;
    });

    // Extras
    csvContent += "\n\nADICIONAIS MAIS PEDIDOS\n";
    csvContent += "Adicional;Quantidade;Total (R$)\n";
    extrasList.forEach(e => {
      csvContent += `${e.name};${e.qty};${e.total.toFixed(2).replace('.', ',')}\n`;
    });

    // Create Blob
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const fileName = `relatorio_saida_${period}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const completedOrders = orders.filter(o => o.status === 'completed');

  // Filter orders by period
  const filteredOrders = completedOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    
    if (period === 'today') {
      return orderDate.toDateString() === now.toDateString();
    }
    if (period === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return orderDate >= sevenDaysAgo;
    }
    if (period === 'month') {
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
    return true; // 'all'
  });

  // Logic to count product sales
  const productStats = filteredOrders.reduce((acc, order) => {
    order.items.forEach(item => {
      const id = item.product.id;
      if (!acc[id]) {
        acc[id] = { 
          name: item.product.name, 
          category: categories.find(c => c.id === item.product.categoryId)?.name || 'Sem Categoria',
          qty: 0, 
          total: 0,
          cost: item.product.costPrice || 0
        };
      }
      acc[id].qty += item.quantity;
      acc[id].total += (item.product.price * item.quantity);
    });
    return acc;
  }, {} as Record<string, { name: string, category: string, qty: number, total: number, cost: number }>);

  // Logic to count extras sales
  const extraStats = filteredOrders.reduce((acc, order) => {
    order.items.forEach(item => {
      item.selectedExtras.forEach(extra => {
        const id = extra.id;
        if (!acc[id]) {
          acc[id] = { name: extra.name, qty: 0, total: 0 };
        }
        acc[id].qty += item.quantity;
        acc[id].total += (extra.price * item.quantity);
      });
    });
    return acc;
  }, {} as Record<string, { name: string, qty: number, total: number }>);

  const statsList = Object.values(productStats)
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.qty - a.qty);

  const extrasList = Object.values(extraStats).sort((a, b) => b.qty - a.qty);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Demonstrativo de Saídas</h2>
          <p className="text-sm text-muted-foreground">Controle detalhado de quantidades vendidas por produto.</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-secondary/30 rounded-xl border border-border/50">
          <Button 
            variant={period === 'today' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setPeriod('today')}
            className="rounded-lg h-8 text-[10px] font-bold uppercase tracking-wider"
          >
            Hoje
          </Button>
          <Button 
            variant={period === 'week' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setPeriod('week')}
            className="rounded-lg h-8 text-[10px] font-bold uppercase tracking-wider"
          >
            7 Dias
          </Button>
          <Button 
            variant={period === 'month' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setPeriod('month')}
            className="rounded-lg h-8 text-[10px] font-bold uppercase tracking-wider"
          >
            Mês
          </Button>
          <Button 
            variant={period === 'all' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setPeriod('all')}
            className="rounded-lg h-8 text-[10px] font-bold uppercase tracking-wider"
          >
            Tudo
          </Button>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportToExcel}
          className="gap-2 h-10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 font-bold uppercase tracking-widest text-[10px]"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Exportar Excel
        </Button>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar produto..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Total de Itens Vendidos</p>
              <p className="text-2xl font-black">{statsList.reduce((sum, p) => sum + p.qty, 0)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-emerald-500/5 border-emerald-500/10">
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Produto Mais Vendido</p>
              <p className="text-lg font-black truncate max-w-[150px]">{statsList[0]?.name || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/10">
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Plus className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Total em Adicionais</p>
              <p className="text-2xl font-black">{formatPrice(extrasList.reduce((sum, e) => sum + e.total, 0))}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Product Table */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Relatório de Saída de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase">Produto</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Categoria</TableHead>
                  <TableHead className="text-center font-bold text-xs uppercase">Qtd Saída</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase">Total Bruto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statsList.map((product, index) => (
                  <TableRow key={index} className="hover:bg-secondary/10 transition-colors">
                    <TableCell>
                      <span className="font-bold text-sm text-zinc-800">{product.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase bg-background">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-black text-primary">
                      {product.qty}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(product.total)}
                    </TableCell>
                  </TableRow>
                ))}
                {statsList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                      Nenhum produto encontrado no período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Extras Summary */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              Saída de Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {extrasList.map((extra, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/50">
                <div>
                  <p className="text-sm font-bold">{extra.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{extra.qty} unidades</p>
                </div>
                <p className="text-sm font-black text-emerald-600">{formatPrice(extra.total)}</p>
              </div>
            ))}
            {extrasList.length === 0 && (
              <p className="text-center py-8 text-sm text-muted-foreground italic">Sem registros de adicionais.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
