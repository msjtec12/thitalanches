import { Category } from '@/types/order';
import { ChevronDown, ChevronLeft } from 'lucide-react';

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const CATEGORY_IMAGES: Record<string, string> = {
  'hot dog':        'https://images.unsplash.com/photo-1612392166886-ee8475b03af2?w=400&h=300&fit=crop&q=80',
  'prensado':       'https://images.unsplash.com/photo-1612392166886-ee8475b03af2?w=400&h=300&fit=crop&q=80',
  'hambúrguer':     'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80',
  'hamburger':      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80',
  'hamburguer':     'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80',
  'frango':         'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=300&fit=crop&q=80',
  'churrasco':      'https://images.unsplash.com/photo-1558030137-a56c1b013eed?w=400&h=300&fit=crop&q=80',
  'universitário':  'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop&q=80',
  'universitario':  'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop&q=80',
  'chicken':        'https://images.unsplash.com/photo-1643985426932-42b4b51e8a65?w=400&h=300&fit=crop&q=80',
  'especial':       'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop&q=80',
  'especiais':      'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop&q=80',
  'açaí':           'https://images.unsplash.com/photo-1613843439331-2e8b55f52e70?w=400&h=300&fit=crop&q=80',
  'acai':           'https://images.unsplash.com/photo-1613843439331-2e8b55f52e70?w=400&h=300&fit=crop&q=80',
  'milk shake':     'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop&q=80',
  'milkshake':      'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop&q=80',
  'shake':          'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop&q=80',
  'sorvete':        'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop&q=80',
  'sorvetes':       'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop&q=80',
  'bebida':         'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop&q=80',
  'bebidas':        'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop&q=80',
  'sobremesa':      'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop&q=80',
  'sobremesas':     'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop&q=80',
  'lanche':         'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=300&fit=crop&q=80',
  'porção':         'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&h=300&fit=crop&q=80',
  'porcao':         'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&h=300&fit=crop&q=80',
  'porções':        'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&h=300&fit=crop&q=80',
};
const FALLBACK = 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=300&fit=crop&q=80';

function getCategoryImage(category: Category): string {
  // Prioridade: foto customizada salva no banco
  if (category.photoUrl) return category.photoUrl;
  // Fallback: mapeamento por palavras-chave no nome
  const lower = category.name.toLowerCase();
  for (const key of Object.keys(CATEGORY_IMAGES)) {
    if (lower.includes(key)) return CATEGORY_IMAGES[key];
  }
  return FALLBACK;
}

export function CategoryNav({ categories, activeCategory, onCategoryChange }: CategoryNavProps) {
  const handleClick = (categoryId: string) => {
    onCategoryChange(categoryId === activeCategory ? '' : categoryId);
  };

  const activeName = categories.find(c => c.id === activeCategory)?.name;

  return (
    <section className="bg-background py-4 border-b border-border">
      <div className="container space-y-3">

        {/* Botão "Voltar ao menu" — aparece só quando uma categoria está aberta */}
        <div
          style={{
            maxHeight: activeCategory ? '48px' : '0px',
            opacity: activeCategory ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.3s ease, opacity 0.25s ease',
          }}
        >
          <button
            onClick={() => onCategoryChange('')}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar ao menu</span>
            {activeName && (
              <span className="text-xs text-muted-foreground font-normal ml-1">
                — {activeName}
              </span>
            )}
          </button>
        </div>

        {/* Grid de categorias */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            const imgUrl = getCategoryImage(category);

            return (
              <button
                key={category.id}
                onClick={() => handleClick(category.id)}
                className="group relative overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{
                  aspectRatio: '4/3',
                  transform: isActive ? 'scale(1.04)' : 'scale(1)',
                  transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, opacity 0.25s ease',
                  boxShadow: isActive
                    ? '0 0 0 3px var(--primary), 0 8px 32px rgba(0,0,0,0.55)'
                    : '0 2px 8px rgba(0,0,0,0.25)',
                  opacity: activeCategory && !isActive ? 0.55 : 1,
                  zIndex: isActive ? 2 : 1,
                }}
              >
                <img
                  src={imgUrl}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    transition: 'transform 0.4s ease, filter 0.25s ease',
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                    filter: isActive ? 'brightness(0.75)' : 'brightness(0.5)',
                  }}
                  loading="lazy"
                />

                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)',
                  }}
                />

                {isActive && (
                  <div className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none" />
                )}

                {isActive && (
                  <div
                    className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full bg-primary shadow-lg"
                    style={{ width: 20, height: 20 }}
                  >
                    <ChevronDown className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}

                {!isActive && (
                  <div
                    className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full bg-black/40 border border-white/20 opacity-0 group-hover:opacity-100"
                    style={{ width: 20, height: 20, transition: 'opacity 0.2s' }}
                  >
                    <ChevronLeft className="w-3 h-3 text-white rotate-180" strokeWidth={2} />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <span
                    className="block text-[10px] sm:text-xs font-bold uppercase tracking-wide leading-tight text-left"
                    style={{
                      textShadow: '0 1px 6px rgba(0,0,0,1)',
                      color: isActive ? 'var(--primary)' : 'white',
                      transition: 'color 0.2s',
                    }}
                  >
                    {category.name}
                  </span>
                </div>

                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-b-xl"
                    style={{ boxShadow: '0 0 8px var(--primary)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
