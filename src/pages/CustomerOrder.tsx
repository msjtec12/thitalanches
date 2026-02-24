import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { StoreHeader } from '@/components/StoreHeader';
import { CategoryNav } from '@/components/CategoryNav';
import { ProductList } from '@/components/ProductList';
import { Cart } from '@/components/Cart';
import { OrderTracking } from '@/components/OrderTracking';

export default function CustomerOrder() {
  const { products, categories, isLoadingData } = useOrders();
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('');

  const initialCategorySet = useRef(false);

  // Define a categoria ativa APENAS na primeira carga das categorias
  useEffect(() => {
    if (categories.length > 0 && !initialCategorySet.current) {
      initialCategorySet.current = true;
      // Começa sem categoria selecionada — usuário escolhe no grid
      // Descomente a linha abaixo se quiser pré-selecionar uma:
      // const snacks = categories.find(c => c.name.toLowerCase().includes('lanche'));
      // setActiveCategory(snacks ? snacks.id : categories[0].id);
    }
  }, [categories]);

  const activeProducts = products.filter(p => p.isActive);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <StoreHeader />
      <CategoryNav 
        categories={categories} 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory} 
      />
      <main className="container md:pr-96">
        <ProductList 
          products={activeProducts} 
          categories={categories}
          activeCategory={activeCategory}
          isLoading={isLoadingData}
        />
      </main>
      <Cart />
      <OrderTracking />
      
      <footer className="py-12 border-t border-border mt-8 bg-zinc-50/50">
        <div className="container flex flex-col items-center gap-6">
          <div className="text-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#0A0A0A]">Thita <span className="text-primary italic">Lanches</span></h3>
            <p className="text-[10px] text-muted-foreground font-medium mt-1">Os melhores lanches e dogs de Ribeirão Preto</p>
          </div>
          
          <p className="text-[9px] text-zinc-400 font-medium">© {new Date().getFullYear()} Thita Lanches. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
