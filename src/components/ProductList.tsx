import { Product, Category } from '@/types/order';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  activeCategory: string;
}

export function ProductList({ products, categories, activeCategory }: ProductListProps) {
  const filteredProducts = products.filter(p => p.categoryId === activeCategory);
  const categoryName = categories.find(c => c.id === activeCategory)?.name || '';

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
