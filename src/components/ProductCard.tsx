import { useState } from 'react';
import { Product, ProductExtra } from '@/types/order';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<ProductExtra[]>([]);
  const [observation, setObservation] = useState('');

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full text-left bg-card rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground">{product.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
            <p className="text-primary font-semibold mt-2">{formatPrice(product.price)}</p>
          </div>
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
        </div>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">{product.description}</p>
            <p className="text-lg font-semibold text-primary">{formatPrice(product.price)}</p>

            {product.extras && product.extras.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Adicionais</h4>
                {product.extras.map((extra) => (
                  <label
                    key={extra.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedExtras.some(e => e.id === extra.id)}
                        onCheckedChange={() => handleExtraToggle(extra)}
                      />
                      <span className="text-sm">{extra.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">+{formatPrice(extra.price)}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Observações</h4>
              <Textarea
                placeholder="Ex: Sem cebola, bem passado..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between py-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <Button onClick={handleAddToCart} className="min-w-[140px]">
                Adicionar {formatPrice(itemTotal)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
