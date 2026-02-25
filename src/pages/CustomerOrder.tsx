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

  useEffect(() => {
    if (categories.length > 0 && !initialCategorySet.current) {
      initialCategorySet.current = true;
    }
  }, [categories]);

  const activeProducts = products.filter(p => p.isActive);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <StoreHeader />

      {/* Layout de duas colunas no desktop */}
      <div className="md:flex md:items-start md:gap-0">

        {/* Coluna principal: categoria + produtos */}
        <div className="flex-1 min-w-0">
          <CategoryNav
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
          <main className="container py-2">
            <ProductList
              products={activeProducts}
              categories={categories}
              activeCategory={activeCategory}
              isLoading={isLoadingData}
            />
          </main>
        </div>

        {/* Coluna do carrinho (desktop) — sticky, à direita */}
        <aside className="hidden md:block w-80 xl:w-96 flex-shrink-0 sticky top-4 self-start max-h-[calc(100vh-1rem)] overflow-y-auto mr-4 mt-4">
          <Cart desktopInline />
        </aside>
      </div>

      {/* Botão flutuante mobile */}
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
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20 pointer-events-none" />

          <div className="container relative py-12 flex flex-col items-center gap-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative overflow-hidden rounded-full border-2 border-amber-500/60 bg-black/40 shadow-[0_0_20px_rgba(212,168,83,0.3)]">
                <img
                  src="/logo.png"
                  alt="Thita Lanches"
                  className="object-contain"
                  style={{
                    width: '110px',
                    height: '110px',
                    transform: 'scale(1.75)',
                    transition: 'transform 0.5s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.85)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.75)'; }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <span
                  className="text-sm md:text-lg font-bold italic text-white"
                  style={{ textShadow: '0 2px 10px rgba(0,0,0,0.95)' }}
                >
                  "O Lanche raíz de respeito!"
                </span>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">
                  Since 2015 • Ribeirão Preto
                </span>
              </div>
            </div>

            <a
              href="https://maps.google.com/?q=Rua+Magda+Perona+Frossard+565+Jardim+Nova+Alianca+Ribeirao+Preto"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-all group/footer-addr"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0 text-white/40 group-hover/footer-addr:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-[11px] font-medium text-white/40 group-hover/footer-addr:text-white transition-colors">
                Rua Magda Perona Frossard, 565 • Jd. Nova Aliança
              </span>
            </a>

            <div className="w-24 h-px bg-amber-500/20" />

            <p className="text-[9px] text-zinc-600 font-medium">
              © {new Date().getFullYear()} Thita Lanches. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
