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
      
      <footer
        className="mt-8 border-t border-white/5 shadow-inner"
        style={{
          background: `
            repeating-linear-gradient(
              90deg,
              #1a1a1a 0px,
              #1a1a1a 18px,
              #111111 18px,
              #111111 22px,
              #1a1a1a 22px,
              #1a1a1a 26px,
              #0e0e0e 26px,
              #0e0e0e 28px
            )
          `,
        }}
      >
        {/* Overlay igual ao header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20 pointer-events-none" />

          <div className="container relative py-8 flex flex-col items-center gap-4">
            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
              <img
                src="/logo.png"
                alt="Thita Lanches"
                className="h-14 w-14 object-contain rounded-full border-2 border-amber-500/30 bg-black/30 p-0.5"
                style={{ filter: 'drop-shadow(0 0 8px rgba(212,168,83,0.4))' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span
                className="text-lg font-black italic tracking-tighter text-white uppercase leading-none"
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
              >
                THITA <span style={{ color: 'var(--primary)' }}>LANCHES</span>
              </span>
              <span
                className="text-[10px] font-semibold italic"
                style={{ color: '#d4a853', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
              >
                "O Lanche raíz de respeito!"
              </span>
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: '#5a4a2a' }}>
                Since 2015 • Ribeirão Preto
              </span>
            </div>

            {/* Endereço */}
            <a
              href="https://maps.google.com/?q=Rua+Magda+Perona+Frossard+565+Jardim+Nova+Alianca+Ribeirao+Preto"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <svg className="w-3 h-3 flex-shrink-0" style={{ color: '#d4a853' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] font-medium" style={{ color: '#a08040' }}>
                R. Magda Perona Frossard, 565 • Jd. Nova Aliança • Ribeirão Preto
              </span>
            </a>

            {/* Divider */}
            <div className="w-24 h-px bg-amber-500/20" />

            {/* Copyright */}
            <p className="text-[9px] text-zinc-600 font-medium">
              © {new Date().getFullYear()} Thita Lanches. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
