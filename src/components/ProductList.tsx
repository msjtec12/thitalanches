import { useMemo } from 'react';
import { Product, Category } from '@/types/order';
import { ProductCard } from './ProductCard';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { filterAndSortProducts } from '@/utils/products';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  activeCategory: string;
  searchQuery?: string;
  isLoading?: boolean;
}

export function ProductList({ products, activeCategory, searchQuery = '', isLoading }: ProductListProps) {
  const query = searchQuery.trim().toLowerCase();
  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, activeCategory, searchQuery),
    [products, activeCategory, searchQuery],
  );

  if (isLoading) {
    return (
      <section className="py-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando cardápio...</p>
      </section>
    );
  }

  if (query && filteredProducts.length === 0) {
    return (
      <section className="py-10 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <ShoppingBag className="w-10 h-10 text-muted-foreground opacity-40" />
        <p className="text-base font-semibold text-foreground">Nenhum lanche encontrado para "{searchQuery}"</p>
        <p className="text-xs text-muted-foreground">Tente buscar por outro nome ou ingrediente.</p>
      </section>
    );
  }

  if (!activeCategory && !query) {
    return (
      <section className="py-10 flex flex-col items-center justify-center gap-3 min-h-[180px]">
        <ShoppingBag className="w-10 h-10 text-primary/30" />
        <p className="text-sm text-muted-foreground font-medium">Selecione uma categoria acima ou busque seu lanche favorito</p>
      </section>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <section className="py-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <ShoppingBag className="w-10 h-10 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">Nenhum produto disponível nesta categoria.</p>
      </section>
    );
  }

  return (
    <section className="py-4">
      <div className="grid gap-3">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
