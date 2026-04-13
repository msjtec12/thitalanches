import { Category } from '@/types/order';
import { ChevronLeft, Grid2X2 } from 'lucide-react';

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const CATEGORY_IMAGES: Record<string, string> = {
  // Combos
  'combo':          'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop&q=80',
  // Hot Dog / Prensados
  'hot dog':        'https://images.unsplash.com/photo-1612392166886-ee8475b03af2?w=400&h=300&fit=crop&q=80',
  'prensado':       'https://images.unsplash.com/photo-1612392166886-ee8475b03af2?w=400&h=300&fit=crop&q=80',
  // Hambúrguer
  'hambúrguer':     'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80',
  'hamburger':      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80',
  'hamburguer':     'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80',
  // Frango
  'frango':         'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=300&fit=crop&q=80',
  // Churrasco
  'churrasco':      'https://images.unsplash.com/photo-1558030137-a56c1b013eed?w=400&h=300&fit=crop&q=80',
  // Calabresa
  'calabresa':      'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop&q=80',
  // Universitário
  'universitário':  'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop&q=80',
  'universitario':  'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop&q=80',
  // Especiais
  'especial':       'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop&q=80',
  'especiais':      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop&q=80',
  // Chicken
  'chicken':        'https://images.unsplash.com/photo-1643985426932-42b4b51e8a65?w=400&h=300&fit=crop&q=80',
  'frango frito':   'https://images.unsplash.com/photo-1643985426932-42b4b51e8a65?w=400&h=300&fit=crop&q=80',
  // Batata Frita
  'batata':         'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&h=300&fit=crop&q=80',
  // Molhos
  'molho':          'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400&h=300&fit=crop&q=80',
  // Bebidas
  'bebida':         'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop&q=80',
  'bebidas':        'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop&q=80',
  // Açaí
  'açaí':           'https://images.unsplash.com/photo-1613843439331-2e8b55f52e70?w=400&h=300&fit=crop&q=80',
  'acai':           'https://images.unsplash.com/photo-1613843439331-2e8b55f52e70?w=400&h=300&fit=crop&q=80',
  // Sorvetes
  'sorvete':        'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop&q=80',
  // Milk Shake
  'milk shake':     'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop&q=80',
  'milkshake':      'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop&q=80',
  'shake':          'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop&q=80',
  // Sobremesas
  'sobremesa':      'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop&q=80',
  // Genérico
  'lanche':         'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=300&fit=crop&q=80',
  'porção':         'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&h=300&fit=crop&q=80',
  'porcao':         'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&h=300&fit=crop&q=80',
};
const FALLBACK = 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=300&fit=crop&q=80';

function getCategoryImage(category: Category): string {
  if (category.photoUrl) return category.photoUrl;
  const lower = category.name.toLowerCase();
  for (const key of Object.keys(CATEGORY_IMAGES)) {
    if (lower.includes(key)) return CATEGORY_IMAGES[key];
  }
  return FALLBACK;
}

export function CategoryNav({ categories, activeCategory, onCategoryChange }: CategoryNavProps) {
  const activecat = categories.find(c => c.id === activeCategory);

  // ── MODO SELECIONADO: só a categoria ativa + botão voltar ──────────────
  if (activecat) {
    return (
      <div className="border-b border-border">
        {/* Banner da categoria selecionada */}
        <div className="relative h-28 md:h-36 overflow-hidden">
          {/* Foto de fundo */}
          <img
            src={getCategoryImage(activecat)}
            alt={activecat.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.45)' }}
          />
          {/* Gradiente */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

          {/* Conteúdo sobre a foto */}
          <div className="relative h-full container flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                Categoria {activecat.order.toString().padStart(2, '0')}
              </span>
              <h2
                className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none"
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
              >
                {activecat.order.toString().padStart(2, '0')}. {activecat.name}
              </h2>
            </div>

            {/* Botão voltar */}
            <button
              onClick={() => onCategoryChange('')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-primary/50 text-white text-sm font-semibold transition-all backdrop-blur-sm group"
            >
              <Grid2X2 className="w-4 h-4 text-primary" />
              <span>Ver todas</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Tarja inferior colorida */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary"
            style={{ boxShadow: '0 0 12px var(--primary)' }}
          />
        </div>
      </div>
    );
  }

  // ── MODO INICIAL: grid com todas as categorias ─────────────────────────
  return (
    <section className="bg-background py-4 border-b border-border">
      <div className="container">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
          {categories.slice().sort((a,b) => a.order - b.order).map((category) => {
            const imgUrl = getCategoryImage(category);
            const displayIndex = category.order.toString().padStart(2, '0');
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className="group relative overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{
                  aspectRatio: '4/3',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {/* Foto */}
                <img
                  src={imgUrl}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  style={{ filter: 'brightness(0.55)' }}
                  loading="lazy"
                />
                {/* Gradiente */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
                  }}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/15 transition-colors duration-300 rounded-xl" />

                {/* Nome */}
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <span
                    className="block text-[10px] sm:text-xs font-bold uppercase tracking-wide leading-tight text-left text-white group-hover:text-primary transition-colors"
                    style={{ textShadow: '0 1px 6px rgba(0,0,0,1)' }}
                  >
                    {displayIndex}. {category.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
