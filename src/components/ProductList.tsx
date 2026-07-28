import { Product, Category } from '@/types/order';
import { ProductCard } from './ProductCard';
import { ShoppingBag, Loader2 } from 'lucide-react';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  activeCategory: string;
  searchQuery?: string;
  isLoading?: boolean;
}

export function ProductList({ products, categories, activeCategory, searchQuery = '', isLoading }: ProductListProps) {
  const query = searchQuery.trim().toLowerCase();
  
  // Se houver busca ativa, filtra produtos por nome ou descrição em todo o cardápio
  const filteredProducts = query 
    ? products.filter(p => p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query))
    : activeCategory 
      ? products.filter(p => p.categoryId === activeCategory)
      : [];

  // Estado de carregamento
  if (isLoading) {
    return (
      <section className="py-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando cardápio...</p>
      </section>
    );
  }

  // Busca ativa mas sem resultados
  if (query && filteredProducts.length === 0) {
    return (
      <section className="py-10 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <ShoppingBag className="w-10 h-10 text-muted-foreground opacity-40" />
        <p className="text-base font-semibold text-foreground">Nenhum lanche encontrado para "{searchQuery}"</p>
        <p className="text-xs text-muted-foreground">Tente buscar por outro nome ou ingrediente.</p>
      </section>
    );
  }

  // Nenhuma categoria selecionada e sem busca
  if (!activeCategory && !query) {
    return (
      <section className="py-10 flex flex-col items-center justify-center gap-3 min-h-[180px]">
        <ShoppingBag className="w-10 h-10 text-primary/30" />
        <p className="text-sm text-muted-foreground font-medium">Selecione uma categoria acima ou busque seu lanche favorito</p>
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
      <div className="grid gap-3">
        {[...filteredProducts].sort((a,b) => {
          const orderA = Number(a.sortOrder) || 0;
          const orderB = Number(b.sortOrder) || 0;
          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name);
        }).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
