import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { StoreHeader } from '@/components/StoreHeader';
import { CategoryNav } from '@/components/CategoryNav';
import { ProductList } from '@/components/ProductList';
import { Cart } from '@/components/Cart';
import { OrderTracking } from '@/components/OrderTracking';

export default function CustomerOrder() {
  const { products, categories } = useOrders();
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '');

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
        <div className="my-6 p-6 rounded-2xl bg-zinc-950 border border-primary/20 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-20 w-20 md:h-24 md:w-24 object-contain rounded-full border-2 border-primary/40 bg-white/5 p-1 shadow-2xl"
            />
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none mb-2">
                BEM-VINDO AO <span className="text-primary">THITA LANCHES</span>
              </h2>
              <p className="text-zinc-400 text-sm font-medium">
                Os melhores lanches e dogs de Ribeirão Preto. 
                Qualidade e sabor que você conhece desde 2015.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider">
                  🌭 Hot Dogs
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider">
                  🍔 Burgers
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider">
                  🍟 Porções
                </div>
              </div>
            </div>
          </div>
        </div>
        <ProductList 
          products={activeProducts} 
          categories={categories}
          activeCategory={activeCategory} 
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
