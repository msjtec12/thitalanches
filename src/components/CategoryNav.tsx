import { Category } from '@/types/order';

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

// Mapeamento de foto por nome de categoria (Unsplash - gratuito)
const CATEGORY_IMAGES: Record<string, string> = {
  // Hot Dog / Prensados
  'hot dog': 'https://images.unsplash.com/photo-1612392166886-ee8475b03af2?w=400&h=300&fit=crop&q=80',
  'prensado': 'https://images.unsplash.com/photo-1612392166886-ee8475b03af2?w=400&h=300&fit=crop&q=80',

  // Hambúrguer
  'hambúrguer': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80',
  'hamburger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80',
  'hamburguer': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80',

  // Frango
  'frango': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=300&fit=crop&q=80',

  // Churrasco
  'churrasco': 'https://images.unsplash.com/photo-1558030137-a56c1b013eed?w=400&h=300&fit=crop&q=80',

  // Universitário
  'universitário': 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop&q=80',
  'universitario': 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop&q=80',

  // Chicken
  'chicken': 'https://images.unsplash.com/photo-1643985426932-42b4b51e8a65?w=400&h=300&fit=crop&q=80',

  // Especiais
  'especial': 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop&q=80',
  'especiais': 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop&q=80',

  // Açaí
  'açaí': 'https://images.unsplash.com/photo-1613843439331-2e8b55f52e70?w=400&h=300&fit=crop&q=80',
  'acai': 'https://images.unsplash.com/photo-1613843439331-2e8b55f52e70?w=400&h=300&fit=crop&q=80',

  // Milk Shake
  'milk shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop&q=80',
  'milkshake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop&q=80',
  'shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop&q=80',

  // Sorvete
  'sorvete': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop&q=80',
  'sorvetes': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop&q=80',

  // Bebidas
  'bebida': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop&q=80',
  'bebidas': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop&q=80',

  // Sobremesas
  'sobremesa': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop&q=80',
  'sobremesas': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop&q=80',
};

// Fallback genérico de lanche
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=300&fit=crop&q=80';

function getCategoryImage(name: string): string {
  const lower = name.toLowerCase();
  for (const key of Object.keys(CATEGORY_IMAGES)) {
    if (lower.includes(key)) return CATEGORY_IMAGES[key];
  }
  return FALLBACK_IMAGE;
}

export function CategoryNav({ categories, activeCategory, onCategoryChange }: CategoryNavProps) {
  return (
    <section className="bg-background py-4 border-b border-border">
      <div className="container">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            const imgUrl = getCategoryImage(category.name);

            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className="group relative overflow-hidden rounded-xl aspect-[4/3] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-transform duration-200 active:scale-95 hover:scale-[1.03]"
                style={{
                  boxShadow: isActive
                    ? '0 0 0 3px var(--primary), 0 4px 20px rgba(0,0,0,0.4)'
                    : '0 2px 8px rgba(0,0,0,0.25)',
                }}
              >
                {/* Foto de fundo */}
                <img
                  src={imgUrl}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />

                {/* Gradiente escuro para legibilidade */}
                <div
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{
                    background: isActive
                      ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.1) 100%)'
                      : 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.05) 100%)',
                  }}
                />

                {/* Borda ativa com cor primária */}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none" />
                )}

                {/* Badge ativo */}
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(255,140,0,0.8)] animate-pulse" />
                )}

                {/* Nome da categoria */}
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <span
                    className="block text-white text-[10px] sm:text-xs font-bold uppercase tracking-wide leading-tight text-left"
                    style={{
                      textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                      color: isActive ? 'var(--primary)' : 'white',
                    }}
                  >
                    {category.name}
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
