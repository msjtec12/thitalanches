import { useState, useEffect, useRef, useMemo } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { Product, ProductExtra, CartItem, OrderOrigin, PickupType, PaymentMethod, Category, ExtraGroup } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatPrice } from '@/utils/format';
import { toast } from 'sonner';
import { 
  Store, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Receipt, 
  CheckCircle2, 
  User, 
  Utensils, 
  ShoppingBag, 
  Sparkles, 
  X, 
  Calculator, 
  Clock, 
  ArrowRight, 
  RotateCcw, 
  Layers, 
  Check, 
  Flame, 
  Coffee, 
  Tag, 
  Truck
} from 'lucide-react';
import { OrderPrinter } from './OrderPrinter';

interface PDVCartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedExtras: ProductExtra[];
  observation: string;
}

const QUICK_OBSERVATIONS = [
  'Sem cebola',
  'Sem tomate',
  'Sem milho',
  'Sem maionese',
  'Sem salada',
  'Sem bacon',
  'Bem passado',
  'Ao ponto',
  'Cortar ao meio',
  'Caprichar no molho',
  'Embalar para viagem',
];

export function PDVModule() {
  const { products, categories, addOrder, settings, markOrderAsPrinted } = useOrders();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<PDVCartItem[]>([]);
  
  // Order Header Info
  const [orderType, setOrderType] = useState<'counter' | 'table' | 'takeaway' | 'delivery'>('counter');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [amountReceived, setAmountReceived] = useState<number | ''>('');
  const [autoPrint, setAutoPrint] = useState(true);

  // Customization modal for product extras & notes
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [customQuantity, setCustomQuantity] = useState(1);
  const [customExtras, setCustomExtras] = useState<ProductExtra[]>([]);
  const [customObservation, setCustomObservation] = useState('');

  // Success Modal
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter active products
  const activeProducts = useMemo(() => {
    return products.filter(p => p.isActive);
  }, [products]);

  // Filtered products by search and category
  const filteredProducts = useMemo(() => {
    return activeProducts.filter(p => {
      const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [activeProducts, selectedCategory, searchQuery]);

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const extrasSum = item.selectedExtras.reduce((eSum, ex) => eSum + ex.price, 0);
      return sum + ((item.product.price + extrasSum) * item.quantity);
    }, 0);
  }, [cart]);

  // Discount calculation
  const calculatedDiscount = useMemo(() => {
    if (!discountValue || discountValue <= 0) return 0;
    if (discountType === 'percent') {
      return (subtotal * discountValue) / 100;
    }
    return Math.min(subtotal, discountValue);
  }, [subtotal, discountValue, discountType]);

  // Total
  const grandTotal = useMemo(() => {
    const delivery = orderType === 'delivery' ? Number(deliveryFee) || 0 : 0;
    return Math.max(0, subtotal - calculatedDiscount + delivery);
  }, [subtotal, calculatedDiscount, orderType, deliveryFee]);

  // Change / Troco calculation
  const changeDue = useMemo(() => {
    if (paymentMethod !== 'cash' || typeof amountReceived !== 'number' || isNaN(amountReceived)) {
      return 0;
    }
    return Math.max(0, amountReceived - grandTotal);
  }, [paymentMethod, amountReceived, grandTotal]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Finalizar Venda
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) {
          handleFinishSale();
        }
      }
      // F4: Limpar comanda
      if (e.key === 'F4') {
        e.preventDefault();
        handleClearCart();
      }
      // F8 or Ctrl+K: Focar busca
      if (e.key === 'F8' || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, grandTotal, paymentMethod, orderType, customerName, tableNumber, amountReceived, autoPrint]);

  // Find extra groups for customizing product's category
  const productCategoryExtras = useMemo(() => {
    if (!customizingProduct) return [];
    const cat = categories.find(c => c.id === customizingProduct.categoryId);
    if (!cat || !cat.extraGroups) return [];
    
    // Filter out extra items that are disabled specifically for this product
    const disabledIds = customizingProduct.disabledExtraIds || [];
    return cat.extraGroups
      .filter(g => g.isActive)
      .map(g => ({
        ...g,
        items: (g.items || []).filter(i => i.isActive && !disabledIds.includes(i.id))
      }))
      .filter(g => g.items.length > 0);
  }, [customizingProduct, categories]);

  // Quick Add / Open Customizer
  const handleProductClick = (product: Product) => {
    const cat = categories.find(c => c.id === product.categoryId);
    const hasExtras = cat?.extraGroups && cat.extraGroups.some(g => g.isActive && g.items.length > 0);

    if (hasExtras) {
      // Open quick customization dialog
      setCustomizingProduct(product);
      setCustomQuantity(1);
      setCustomExtras([]);
      setCustomObservation('');
    } else {
      // Direct add to cart
      addToCartDirect(product, 1, [], '');
    }
  };

  const addToCartDirect = (product: Product, quantity: number, extras: ProductExtra[], observation: string) => {
    setCart(prev => {
      // Check if exact same product with exact same extras and observation exists
      const extrasIds = extras.map(e => e.id).sort().join(',');
      const existingIdx = prev.findIndex(item => 
        item.product.id === product.id &&
        item.observation === observation &&
        item.selectedExtras.map(e => e.id).sort().join(',') === extrasIds
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }

      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          product,
          quantity,
          selectedExtras: extras,
          observation
        }
      ];
    });

    toast.success(`${product.name} adicionado!`, { duration: 1200 });
  };

  const handleConfirmCustomization = () => {
    if (!customizingProduct) return;
    addToCartDirect(customizingProduct, customQuantity, customExtras, customObservation.trim());
    setCustomizingProduct(null);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as PDVCartItem[]);
  };

  const handleRemoveItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Deseja limpar todos os itens da comanda atual?')) {
      setCart([]);
      setDiscountValue(0);
      setAmountReceived('');
      setCustomerName('');
      setTableNumber('');
      toast.info('Comanda limpa');
    }
  };

  const handleToggleExtraInCustomizer = (extra: ProductExtra) => {
    setCustomExtras(prev => {
      const exists = prev.some(e => e.id === extra.id);
      if (exists) {
        return prev.filter(e => e.id !== extra.id);
      }
      return [...prev, extra];
    });
  };

  const handleToggleQuickObservation = (obs: string) => {
    setCustomObservation(prev => {
      const parts = prev ? prev.split(', ').filter(Boolean) : [];
      if (parts.includes(obs)) {
        return parts.filter(p => p !== obs).join(', ');
      } else {
        return [...parts, obs].join(', ');
      }
    });
  };

  const handleFinishSale = async () => {
    if (cart.length === 0) {
      toast.error('Adicione pelo menos um item à comanda antes de finalizar.');
      return;
    }

    if (orderType === 'table' && !tableNumber.trim()) {
      toast.error('Informe o número da mesa.');
      return;
    }

    let mappedOrigin: OrderOrigin = 'counter';
    let mappedPickup: PickupType = 'immediate';

    if (orderType === 'table') {
      mappedOrigin = 'table';
    } else if (orderType === 'takeaway') {
      mappedOrigin = 'counter';
      mappedPickup = 'immediate';
    } else if (orderType === 'delivery') {
      mappedOrigin = 'counter';
      mappedPickup = 'delivery';
    }

    const changeNote = (paymentMethod === 'cash' && typeof amountReceived === 'number' && amountReceived > grandTotal)
      ? ` | Pago: ${formatPrice(amountReceived)} (Troco: ${formatPrice(changeDue)})`
      : '';

    const discountNote = calculatedDiscount > 0
      ? ` | Desconto: -${formatPrice(calculatedDiscount)}`
      : '';

    const tableNote = orderType === 'table' ? `Mesa: ${tableNumber}` : '';
    const takeawayNote = orderType === 'takeaway' ? '[PARA VIAGEM]' : '';

    const generalNote = [takeawayNote, tableNote, changeNote, discountNote]
      .filter(Boolean)
      .join(' ')
      .trim();

    try {
      const newOrder = await addOrder({
        origin: mappedOrigin,
        pickupType: mappedPickup,
        customerName: customerName.trim() || (orderType === 'table' ? `Mesa ${tableNumber}` : 'Balcão'),
        tableNumber: orderType === 'table' ? tableNumber.trim() : undefined,
        deliveryInfo: orderType === 'delivery' ? {
          street: 'Balcão / Rápido',
          number: 'S/N',
          deliveryFee: Number(deliveryFee) || 0,
          estimatedTime: settings.prepTime || 20
        } : undefined,
        items: cart.map(item => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          selectedExtras: item.selectedExtras,
          observation: item.observation
        })),
        generalObservation: generalNote,
        status: 'received',
        paymentMethod: paymentMethod,
        paymentStatus: 'paid', // Balcão assume recebido
        total: grandTotal
      });

      setCompletedOrder(newOrder);
      setIsSuccessModalOpen(true);

      // Auto Print if checked
      if (autoPrint) {
        setTimeout(() => {
          window.print();
          if (newOrder.id) {
            markOrderAsPrinted(newOrder.id);
          }
        }, 300);
      }

      // Reset Current POS State for next sale
      setCart([]);
      setDiscountValue(0);
      setAmountReceived('');
      setCustomerName('');
      setTableNumber('');
      setDeliveryFee(0);

    } catch (err: any) {
      console.error('Erro ao finalizar venda no PDV:', err);
      toast.error('Erro ao registrar venda. Tente novamente.');
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Top Bar / Modo de Atendimento ── */}
      <div className="bg-zinc-900/90 border border-white/10 p-3 sm:p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/20 rounded-xl border border-primary/30 text-primary">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black italic text-white uppercase tracking-tight">
                Frente de Caixa <span className="text-primary">PDV</span>
              </h2>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">Lançamento rápido e controle de comandas</p>
          </div>
        </div>

        {/* Tipos de Atendimento */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-white/10 flex-wrap">
          <Button
            type="button"
            size="sm"
            variant={orderType === 'counter' ? 'default' : 'ghost'}
            onClick={() => setOrderType('counter')}
            className={`h-8 px-3 text-xs font-bold rounded-lg transition-all ${
              orderType === 'counter' ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5 mr-1.5" />
            Balcão
          </Button>

          <Button
            type="button"
            size="sm"
            variant={orderType === 'table' ? 'default' : 'ghost'}
            onClick={() => setOrderType('table')}
            className={`h-8 px-3 text-xs font-bold rounded-lg transition-all ${
              orderType === 'table' ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 mr-1.5" />
            Mesa / Comanda
          </Button>

          <Button
            type="button"
            size="sm"
            variant={orderType === 'takeaway' ? 'default' : 'ghost'}
            onClick={() => setOrderType('takeaway')}
            className={`h-8 px-3 text-xs font-bold rounded-lg transition-all ${
              orderType === 'takeaway' ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
            Viagem
          </Button>

          <Button
            type="button"
            size="sm"
            variant={orderType === 'delivery' ? 'default' : 'ghost'}
            onClick={() => setOrderType('delivery')}
            className={`h-8 px-3 text-xs font-bold rounded-lg transition-all ${
              orderType === 'delivery' ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5 mr-1.5" />
            Entrega
          </Button>
        </div>

        {/* Inputs de identificação */}
        <div className="flex items-center gap-2 flex-grow sm:flex-grow-0 min-w-[200px]">
          {orderType === 'table' ? (
            <div className="flex items-center gap-2 w-full">
              <Label className="text-xs text-zinc-400 font-bold uppercase whitespace-nowrap">Nº Mesa:</Label>
              <Input
                placeholder="Ex: 05"
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value)}
                className="h-8 bg-zinc-950 border-white/10 text-center font-black text-sm text-primary w-24 rounded-lg focus:border-primary"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <Label className="text-xs text-zinc-400 font-bold uppercase whitespace-nowrap">Cliente / Senha:</Label>
              <Input
                placeholder="Nome ou senha (opcional)"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="h-8 bg-zinc-950 border-white/10 text-xs rounded-lg focus:border-primary"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Main Split View ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ── COLUNA ESQUERDA: Catálogo e Busca (7 Colunas) ── */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-3">
          {/* Busca & Categorias */}
          <div className="bg-zinc-900/80 border border-white/10 p-3 rounded-2xl space-y-3 shadow-lg backdrop-blur-sm">
            {/* Input de Busca */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar produto por nome ou ingrediente... (F8 ou Ctrl+K)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-10 bg-zinc-950/80 border-white/10 focus:border-primary rounded-xl text-sm font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Chips de Categorias */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <Button
                size="sm"
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
                className={`h-8 px-3 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === 'all' ? 'bg-primary text-white' : 'border-white/10 bg-zinc-950 text-zinc-400 hover:text-white'
                }`}
              >
                Todos ({activeProducts.length})
              </Button>
              {categories.filter(c => c.isActive).map(cat => {
                const count = activeProducts.filter(p => p.categoryId === cat.id).length;
                return (
                  <Button
                    key={cat.id}
                    size="sm"
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`h-8 px-3 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id ? 'bg-primary text-white' : 'border-white/10 bg-zinc-950 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat.name} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Grade de Produtos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 pb-4">
            {filteredProducts.map(product => {
              const cat = categories.find(c => c.id === product.categoryId);
              const hasExtras = cat?.extraGroups && cat.extraGroups.some(g => g.isActive && g.items.length > 0);

              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="group relative bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/5 hover:border-primary/50 p-3 rounded-2xl cursor-pointer transition-all duration-200 shadow-md hover:shadow-primary/10 flex flex-col justify-between active:scale-[0.98] select-none"
                >
                  <div className="space-y-1.5">
                    {/* Imagem ou Ícone */}
                    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-zinc-600 group-hover:text-primary transition-colors">
                          <Flame className="w-8 h-8 opacity-40" />
                        </div>
                      )}

                      {/* Badge / Selo */}
                      {product.badge && (
                        <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                          {product.badge === 'bestseller' ? 'Mais Pedido' : product.badge === 'promo' ? 'Promoção' : product.badge}
                        </span>
                      )}

                      {hasExtras && (
                        <span className="absolute bottom-1.5 right-1.5 bg-zinc-950/80 text-amber-400 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border border-amber-500/30 backdrop-blur-sm">
                          + Adicionais
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-black text-xs sm:text-sm text-white line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    <span className="text-xs sm:text-sm font-black text-emerald-400">
                      {formatPrice(product.price)}
                    </span>
                    <div className="h-7 w-7 rounded-lg bg-primary/20 group-hover:bg-primary text-primary group-hover:text-white flex items-center justify-center transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-12 text-zinc-500 space-y-2">
                <Search className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-sm font-medium">Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* ── COLUNA DIREITA: Comanda & Fechamento da Venda (5 Colunas) ── */}
        <div className="lg:col-span-5 xl:col-span-5 bg-zinc-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col sticky top-16">
          {/* Header da Comanda */}
          <div className="p-3.5 bg-zinc-950/80 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black uppercase italic tracking-tight text-white">
                Comanda Atual ({cart.reduce((s, i) => s + i.quantity, 0)} itens)
              </h3>
            </div>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                className="h-7 px-2 text-[10px] text-zinc-400 hover:text-destructive hover:bg-destructive/10 font-bold uppercase gap-1"
                title="Limpar Comanda (F4)"
              >
                <Trash2 className="w-3 h-3" />
                Limpar (F4)
              </Button>
            )}
          </div>

          {/* Lista de Itens da Comanda */}
          <div className="p-3 space-y-2.5 max-h-[280px] overflow-y-auto scrollbar-thin">
            {cart.map(item => {
              const extrasTotal = item.selectedExtras.reduce((s, e) => s + e.price, 0);
              const itemTotal = (item.product.price + extrasTotal) * item.quantity;

              return (
                <div key={item.id} className="bg-zinc-950/70 border border-white/5 p-2.5 rounded-xl space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-medium">
                        {formatPrice(item.product.price + extrasTotal)} un.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center bg-zinc-900 rounded-lg border border-white/10 p-0.5">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="h-6 w-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-black text-xs text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="h-6 w-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-6 w-6 text-zinc-500 hover:text-destructive p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Adicionais discriminados */}
                  {item.selectedExtras.length > 0 && (
                    <div className="space-y-0.5 pl-2 border-l-2 border-primary/40 text-[10px] text-zinc-400">
                      {item.selectedExtras.map(ex => (
                        <div key={ex.id} className="flex justify-between">
                          <span>+ {ex.name}</span>
                          <span className="text-emerald-400 font-bold">+{formatPrice(ex.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Observação do Item */}
                  {item.observation && (
                    <p className="text-[10px] font-bold text-amber-400/90 italic bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Obs: {item.observation}
                    </p>
                  )}

                  <div className="flex justify-end pt-1 border-t border-white/5 text-xs font-black text-emerald-400">
                    Total: {formatPrice(itemTotal)}
                  </div>
                </div>
              );
            })}

            {cart.length === 0 && (
              <div className="py-8 text-center text-zinc-500 space-y-1">
                <Receipt className="w-7 h-7 mx-auto opacity-30" />
                <p className="text-xs font-medium">Nenhum item na comanda</p>
                <p className="text-[10px] text-zinc-600">Clique nos produtos ao lado para lançar</p>
              </div>
            )}
          </div>

          {/* Painel Financeiro e Pagamento */}
          <div className="p-3.5 bg-zinc-950 border-t border-white/10 space-y-3">
            {/* Subtotal, Desconto e Taxa */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal:</span>
                <span className="font-bold text-white">{formatPrice(subtotal)}</span>
              </div>

              {orderType === 'delivery' && (
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Taxa de Entrega:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]">R$</span>
                    <Input
                      type="number"
                      value={deliveryFee || ''}
                      onChange={e => setDeliveryFee(Number(e.target.value) || 0)}
                      placeholder="0,00"
                      className="h-6 w-20 bg-zinc-900 border-white/10 text-right text-xs p-1"
                    />
                  </div>
                </div>
              )}

              {/* Desconto */}
              <div className="flex justify-between items-center text-zinc-400">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-primary" /> Desconto:
                </span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={discountValue || ''}
                    onChange={e => setDiscountValue(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="h-6 w-16 bg-zinc-900 border-white/10 text-right text-xs p-1"
                  />
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="h-6 bg-zinc-900 border border-white/10 rounded text-[10px] text-zinc-300 px-1"
                  >
                    <option value="fixed">R$</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>

              {/* TOTAL GIGANTE */}
              <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                <span className="text-sm font-black uppercase text-white tracking-tight">TOTAL A PAGAR:</span>
                <span className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            {/* Métodos de Pagamento */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Forma de Pagamento</Label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-black uppercase transition-all ${
                    paymentMethod === 'pix'
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'bg-zinc-900/60 text-zinc-400 border-white/5 hover:border-white/20'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  Pix
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-black uppercase transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'bg-zinc-900/60 text-zinc-400 border-white/5 hover:border-white/20'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  Dinheiro
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('debit_card')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-black uppercase transition-all ${
                    paymentMethod === 'debit_card'
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'bg-zinc-900/60 text-zinc-400 border-white/5 hover:border-white/20'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Débito
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-black uppercase transition-all ${
                    paymentMethod === 'credit_card'
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'bg-zinc-900/60 text-zinc-400 border-white/5 hover:border-white/20'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Crédito
                </button>
              </div>
            </div>

            {/* Se for Dinheiro: Calculadora de Troco Rápido */}
            {paymentMethod === 'cash' && (
              <div className="p-2.5 bg-zinc-900/90 border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-[10px] font-bold uppercase text-zinc-400">Valor Recebido:</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-zinc-400">R$</span>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={amountReceived}
                      onChange={e => setAmountReceived(e.target.value === '' ? '' : Number(e.target.value))}
                      className="h-7 w-24 bg-zinc-950 border-white/10 text-right font-black text-sm text-white"
                    />
                  </div>
                </div>

                {/* Botões Rápidos de Notas */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setAmountReceived(grandTotal)}
                    className="h-6 px-2 text-[10px] rounded border-white/10 bg-zinc-950 hover:bg-white/10"
                  >
                    Exato
                  </Button>
                  {[10, 20, 50, 100].map(val => (
                    <Button
                      key={val}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setAmountReceived(val)}
                      className="h-6 px-2 text-[10px] rounded border-white/10 bg-zinc-950 hover:bg-white/10 font-bold"
                    >
                      R${val}
                    </Button>
                  ))}
                </div>

                {/* Exibição do Troco */}
                {typeof amountReceived === 'number' && amountReceived >= grandTotal && (
                  <div className="flex justify-between items-center pt-1.5 border-t border-white/10">
                    <span className="text-xs font-black uppercase text-emerald-400">TROCO A DEVOLVER:</span>
                    <span className="text-base font-black text-emerald-400">
                      {formatPrice(changeDue)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Checkbox Auto-Print & Botão de Fechamento */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoPrint}
                  onChange={e => setAutoPrint(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary h-4 w-4"
                />
                <span>Imprimir comanda automaticamente após fechar</span>
              </label>

              <Button
                onClick={handleFinishSale}
                disabled={cart.length === 0}
                className="w-full h-12 bg-primary hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>FINALIZAR VENDA (F2)</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL DE PERSONALIZAÇÃO RÁPIDA (Adicionais & Observações) ── */}
      <Dialog open={!!customizingProduct} onOpenChange={open => !open && setCustomizingProduct(null)}>
        <DialogContent className="max-w-md bg-zinc-950 border border-white/10 text-white p-5 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base font-black italic uppercase">
              <span>{customizingProduct?.name}</span>
              <span className="text-emerald-400">{customizingProduct && formatPrice(customizingProduct.price)}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* Quantidade */}
            <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-xl border border-white/5">
              <span className="text-xs font-bold uppercase text-zinc-300">Quantidade:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomQuantity(q => Math.max(1, q - 1))}
                  className="h-8 w-8 rounded-lg bg-zinc-950 border border-white/10 flex items-center justify-center hover:bg-white/10"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-black text-sm">{customQuantity}</span>
                <button
                  type="button"
                  onClick={() => setCustomQuantity(q => q + 1)}
                  className="h-8 w-8 rounded-lg bg-zinc-950 border border-white/10 flex items-center justify-center hover:bg-white/10"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grupos de Complementos / Adicionais */}
            {productCategoryExtras.length > 0 && (
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Adicionais Disponíveis
                </Label>
                {productCategoryExtras.map(group => (
                  <div key={group.id} className="space-y-1.5">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase">{group.name}</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {group.items.map(item => {
                        const isSelected = customExtras.some(e => e.id === item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleToggleExtraInCustomizer(item)}
                            className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                              isSelected
                                ? 'bg-primary/20 border-primary text-white font-bold'
                                : 'bg-zinc-900 border-white/5 text-zinc-300 hover:border-white/20'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`h-4 w-4 rounded flex items-center justify-center text-[10px] ${
                                isSelected ? 'bg-primary text-white' : 'border border-zinc-700'
                              }`}>
                                {isSelected && <Check className="w-3 h-3" />}
                              </span>
                              {item.name}
                            </span>
                            <span className="text-emerald-400 font-bold">+{formatPrice(item.price)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Observações Rápidas */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Observações Rápidas</Label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_OBSERVATIONS.map(obs => {
                  const isIncluded = customObservation.includes(obs);
                  return (
                    <button
                      key={obs}
                      type="button"
                      onClick={() => handleToggleQuickObservation(obs)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        isIncluded
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {obs}
                    </button>
                  );
                })}
              </div>
              <Input
                placeholder="Outra observação personalizada..."
                value={customObservation}
                onChange={e => setCustomObservation(e.target.value)}
                className="h-8 bg-zinc-900 border-white/10 text-xs rounded-lg"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              onClick={handleConfirmCustomization}
              className="w-full h-11 bg-primary hover:bg-red-700 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-primary/20"
            >
              Adicionar à Comanda ({customQuantity}x)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL DE VENDA CONCLUÍDA COM SUCESSO ── */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-sm bg-zinc-950 border border-primary/30 text-white p-6 rounded-3xl text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tight text-white">
              Venda Concluída!
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Pedido #{completedOrder?.number} enviado para a cozinha
            </p>
          </div>

          {completedOrder && (
            <div className="bg-zinc-900/80 border border-white/5 p-3 rounded-xl text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Total da Venda:</span>
                <span className="font-black text-white">{formatPrice(completedOrder.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Pagamento:</span>
                <span className="font-bold uppercase text-primary">{completedOrder.paymentMethod}</span>
              </div>
              {completedOrder.generalObservation?.includes('Troco') && (
                <div className="flex justify-between text-emerald-400 font-black">
                  <span>Troco:</span>
                  <span>{completedOrder.generalObservation.split('Troco:')[1]?.replace(')', '').trim()}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Button
              onClick={() => {
                window.print();
                if (completedOrder?.id) markOrderAsPrinted(completedOrder.id);
              }}
              variant="outline"
              className="w-full h-10 border-white/10 hover:bg-white/10 font-bold text-xs uppercase gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Reimprimir Comanda
            </Button>

            <Button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full h-11 bg-primary hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20"
              autoFocus
            >
              Próxima Venda (Enter)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
