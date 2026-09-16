import type { Product } from '@/types/order';

export function filterAndSortProducts(
  products: Product[],
  activeCategory: string,
  searchQuery = '',
): Product[] {
  const query = searchQuery.trim().toLocaleLowerCase('pt-BR');

  const filtered = query
    ? products.filter((product) => {
        const name = product.name.toLocaleLowerCase('pt-BR');
        const description = product.description?.toLocaleLowerCase('pt-BR') || '';
        return name.includes(query) || description.includes(query);
      })
    : activeCategory
      ? products.filter((product) => product.categoryId === activeCategory)
      : [];

  return [...filtered].sort((a, b) => {
    const orderA = Number(a.sortOrder) || 0;
    const orderB = Number(b.sortOrder) || 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}
