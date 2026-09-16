import { describe, expect, it } from 'vitest';
import { filterAndSortProducts } from '@/utils/products';
import type { Product } from '@/types/order';

const products: Product[] = [
  { id: '2', name: 'X-Bacon', description: 'Bacon crocante', price: 25, costPrice: 10, isActive: true, categoryId: 'lanches', sortOrder: 2 },
  { id: '1', name: 'X-Salada', description: 'Alface e tomate', price: 20, costPrice: 8, isActive: true, categoryId: 'lanches', sortOrder: 1 },
  { id: '3', name: 'Coca-Cola', description: 'Lata', price: 7, costPrice: 3, isActive: true, categoryId: 'bebidas', sortOrder: 1 },
];

describe('filterAndSortProducts', () => {
  it('filtra por categoria e respeita sortOrder', () => {
    expect(filterAndSortProducts(products, 'lanches').map((p) => p.id)).toEqual(['1', '2']);
  });

  it('pesquisa por nome ignorando maiúsculas/minúsculas', () => {
    expect(filterAndSortProducts(products, '', 'x-bacon').map((p) => p.id)).toEqual(['2']);
  });

  it('pesquisa também pela descrição', () => {
    expect(filterAndSortProducts(products, '', 'tomate').map((p) => p.id)).toEqual(['1']);
  });

  it('retorna lista vazia sem categoria e sem busca', () => {
    expect(filterAndSortProducts(products, '')).toEqual([]);
  });
});
