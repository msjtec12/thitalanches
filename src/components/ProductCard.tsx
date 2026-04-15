import { useState } from 'react';
import { Product, ProductExtra } from '@/types/order';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, Check, ChevronRight, UtensilsCrossed } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<ProductExtra[]>([]);
  const [observation, setObservation] = useState('');

  const activeExtras = (product.extras || []).filter(e => e.isActive !== false);
  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
  const itemTotal = (product.price + extrasTotal) * quantity;

  const handleExtraToggle = (extra: ProductExtra) => {
    setSelectedExtras(prev =>
      prev.find(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const handleAddToCart = () => {
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
              {activeExtras.length > 0 && (
                <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  +{activeExtras.length} opções
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

            {/* ── Seção de Complementos / Adicionais ── */}
            {activeExtras.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">
                    Complementos
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-2">
                  {activeExtras.map((extra) => {
                    const isSelected = selectedExtras.some(e => e.id === extra.id);
                    return (
                      <button
                        key={extra.id}
                        type="button"
                        onClick={() => handleExtraToggle(extra)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-150 text-left
                          ${isSelected
                            ? 'border-primary bg-primary/8 shadow-sm shadow-primary/10'
                            : 'border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/60'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Indicador de seleção */}
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
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
                        <span className={`text-sm font-semibold flex-shrink-0 ml-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                          +{formatPrice(extra.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>

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
                className="gap-2 shadow-lg shadow-primary/20 font-bold min-w-[150px]"
                size="lg"
              >
                <span>Adicionar</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-md text-sm">
                  {formatPrice(itemTotal)}
                </span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
