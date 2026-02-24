import { Product, Category } from '@/types/order';
import { ProductCard } from './ProductCard';
import { ShoppingBag, Loader2 } from 'lucide-react';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  activeCategory: string;
  isLoading?: boolean;
}

export function ProductList({ products, categories, activeCategory, isLoading }: ProductListProps) {
  const filteredProducts = products.filter(p => p.categoryId === activeCategory);
  const categoryName = categories.find(c => c.id === activeCategory)?.name || '';

  // Estado de carregamento
  if (isLoading) {
    return (
      <section className="py-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando cardápio...</p>
      </section>
    );
  }

  // Nenhuma categoria selecionada ainda (categorias ainda carregando ou vazias)
  if (!activeCategory) {
    return (
      <section className="py-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando categorias...</p>
      </section>
    );
  }

  // Categoria selecionada mas sem produtos
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
      <h2 className="text-lg font-semibold mb-4">{categoryName}</h2>
      <div className="grid gap-3">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
