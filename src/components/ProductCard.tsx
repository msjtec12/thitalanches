import { useState } from 'react';
import { Product, ProductExtra, ExtraGroup } from '@/types/order';
import { useCart } from '@/contexts/CartContext';
import { useOrders } from '@/contexts/OrderContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, Check, ChevronRight, UtensilsCrossed, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatPrice } from '@/utils/format';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { categories } = useOrders();
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<ProductExtra[]>([]);
  const [observation, setObservation] = useState('');

  // Get extra groups from the product's category
  const category = categories.find(c => c.id === product.categoryId);
  const disabledIds = product.disabledExtraIds || [];
  const activeGroups = (category?.extraGroups || [])
    .filter(g => g.isActive)
    .map(g => ({
      ...g,
      items: g.items.filter(i => i.isActive && !disabledIds.includes(i.id))
    }))
    .filter(g => g.items.length > 0);
  const totalActiveItems = activeGroups.reduce((sum, g) => sum + g.items.length, 0);

  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
  const itemTotal = (product.price + extrasTotal) * quantity;

  // Count selected items per group
  const getGroupSelectedCount = (group: ExtraGroup) => {
    return selectedExtras.filter(se => group.items.some(gi => gi.id === se.id)).length;
  };

  // Check if all required groups are satisfied
  const allGroupsSatisfied = activeGroups.every(group => {
    if (!group.isRequired) return true;
    const count = getGroupSelectedCount(group);
    return count >= group.minQty;
  });

  const handleExtraToggle = (extra: ProductExtra, group: ExtraGroup) => {
    const isSelected = selectedExtras.some(e => e.id === extra.id);
    
    if (isSelected) {
      setSelectedExtras(prev => prev.filter(e => e.id !== extra.id));
    } else {
      // Check max limit
      const groupCount = getGroupSelectedCount(group);
      if (group.maxQty > 0 && groupCount >= group.maxQty) {
        // If max is 1, replace the selection (radio behavior)
        if (group.maxQty === 1) {
          setSelectedExtras(prev => [
            ...prev.filter(e => !group.items.some(gi => gi.id === e.id)),
            extra
          ]);
        }
        return;
      }
      setSelectedExtras(prev => [...prev, extra]);
    }
  };

  const handleAddToCart = () => {
    if (!allGroupsSatisfied) return;
    addItem(product, quantity, selectedExtras, observation);
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setQuantity(1);
    setSelectedExtras([]);
    setObservation('');
  };

  const handleOpen = () => {
    resetForm();
    setIsOpen(true);
  };

  return (
    <>
      {/* ── Card do produto ─────────────────────────────────── */}
      <button
        onClick={handleOpen}
        className="w-full text-left bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 overflow-hidden group"
      >
        {/* Imagem do produto (se existir) */}
        {product.image && (
          <div className="w-full h-36 overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <div className="p-4 flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground leading-tight">
              {Number(product.sortOrder) > 0
                ? `${product.sortOrder.toString().padStart(2, '0')}. `
                : ''}
              {product.name}
            </h3>
            {product.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              <p className="text-primary font-bold">{formatPrice(product.price)}</p>
              {totalActiveItems > 0 && (
                <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  +{totalActiveItems} opções
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors mt-0.5">
            <Plus className="w-4 h-4 text-primary" />
          </div>
        </div>
      </button>

      {/* ── Dialog de configuração do item ──────────────────── */}
      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto p-0">

          {/* Imagem do produto no topo do modal */}
          {product.image ? (
            <div className="w-full h-44 overflow-hidden">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-20 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <UtensilsCrossed className="w-8 h-8 text-primary/30" />
            </div>
          )}

          <div className="p-5 space-y-5">
            {/* Cabeçalho */}
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-bold leading-tight">{product.name}</DialogTitle>
              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              )}
              <p className="text-primary font-bold text-lg pt-1">{formatPrice(product.price)}</p>
            </DialogHeader>

            {/* ── Grupos de Complementos (estilo iFood) ── */}
            {activeGroups.map((group) => {
              const activeItems = group.items; // Already filtered above
              if (activeItems.length === 0) return null;
              
              const groupCount = getGroupSelectedCount(group);
              const isGroupSatisfied = !group.isRequired || groupCount >= group.minQty;

              return (
                <div key={group.id} className="space-y-3">
                  {/* Header do grupo */}
                  <div className="bg-secondary/40 -mx-5 px-5 py-2.5 border-y border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold">{group.name}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {group.isRequired ? (
                            group.minQty === group.maxQty 
                              ? `Escolha ${group.minQty}` 
                              : `Escolha de ${group.minQty} a ${group.maxQty > 0 ? group.maxQty : '∞'}`
                          ) : (
                            group.maxQty > 0 
                              ? `Escolha até ${group.maxQty}` 
                              : 'Opcional'
                          )}
                        </p>
                      </div>
                      {group.isRequired && (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isGroupSatisfied 
                            ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {isGroupSatisfied ? '✓ OK' : 'OBRIGATÓRIO'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Itens do grupo */}
                  <div className="space-y-2">
                    {activeItems.map((extra) => {
                      const isSelected = selectedExtras.some(e => e.id === extra.id);
                      const isRadio = group.maxQty === 1;
                      return (
                        <button
                          key={extra.id}
                          type="button"
                          onClick={() => handleExtraToggle(extra, group)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-150 text-left
                            ${isSelected
                              ? 'border-primary bg-primary/8 shadow-sm shadow-primary/10'
                              : 'border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/60'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Indicador de seleção */}
                            <div className={`w-5 h-5 ${isRadio ? 'rounded-full' : 'rounded-md'} border-2 flex items-center justify-center flex-shrink-0 transition-all
                              ${isSelected
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground/40'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                            </div>
                            <span className={`text-sm font-medium leading-tight ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                              {extra.name}
                            </span>
                          </div>
                          {extra.price > 0 && (
                            <span className={`text-sm font-semibold flex-shrink-0 ml-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                              +{formatPrice(extra.price)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Resumo dos selecionados */}
            {selectedExtras.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <ChevronRight className="w-3 h-3 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-primary">{selectedExtras.length}</span> complemento{selectedExtras.length > 1 ? 's' : ''} selecionado{selectedExtras.length > 1 ? 's' : ''}:&nbsp;
                  <span className="font-medium">{selectedExtras.map(e => e.name).join(', ')}</span>
                </p>
              </div>
            )}

            {/* ── Observações ── */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">
                  Observações
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <Textarea
                placeholder="Ex: Sem cebola, bem passado, sem molho..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="resize-none text-sm bg-secondary/30 border-border/50 focus:border-primary/50 transition-all"
                rows={2}
              />
            </div>

            {/* ── Quantidade + Botão ── */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-2"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-2"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={!allGroupsSatisfied}
                className={`gap-2 shadow-lg font-bold min-w-[150px] ${!allGroupsSatisfied ? 'opacity-50' : 'shadow-primary/20'}`}
                size="lg"
              >
                <span>Adicionar</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-md text-sm">
                  {formatPrice(itemTotal)}
                </span>
              </Button>
            </div>

            {/* Aviso se algum grupo obrigatório não foi preenchido */}
            {!allGroupsSatisfied && (
              <div className="flex items-center gap-2 text-red-500 bg-red-500/5 border border-red-500/20 rounded-lg p-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-[11px] font-medium">Preencha todos os campos obrigatórios para continuar.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
