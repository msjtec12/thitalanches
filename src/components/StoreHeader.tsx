import { useOrders } from '@/contexts/OrderContext';
import { Link } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';

export function StoreHeader() {
  const { settings } = useOrders();

  return (
    <header className="sticky top-0 z-40 shadow-2xl border-b border-white/5"
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
      {/* Overlay sutil para profundidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

      <div className="container relative py-3 md:py-4">
        <div className="flex items-center justify-between gap-4">

          {/* Logo + Tagline */}
          <Link to="/" className="flex items-center gap-3 md:gap-4 group">
            {/* Logo ampliada */}
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-2 bg-amber-500/25 rounded-full blur-lg group-hover:bg-amber-500/40 transition-all duration-300" />
              <img
                src={settings.logoUrl || '/logo.png'}
                alt="Thita Lanches Logo"
                className="relative object-contain rounded-full border-2 border-amber-500/50 bg-black/40 p-0.5"
                style={{
                  width: '80px',
                  height: '80px',
                  filter: 'drop-shadow(0 0 10px rgba(212,168,83,0.5))',
                }}
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
              />
            </div>

            {/* Tagline + Endereço */}
            <div className="flex flex-col gap-1">
              {/* Tagline */}
              <span
                className="text-[12px] md:text-sm font-semibold italic tracking-wide leading-none text-white"
                style={{ textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
              >
                "O Lanche raíz de respeito!"
              </span>

              {/* Endereço */}
              <a
                href="https://maps.google.com/?q=Rua+Magda+Perona+Frossard+565+Jardim+Nova+Alianca+Ribeirao+Preto"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 group/addr hidden sm:flex"
                onClick={e => e.stopPropagation()}
              >
                <svg className="w-2.5 h-2.5 flex-shrink-0 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span
                  className="text-[9px] font-medium tracking-wide leading-none truncate max-w-[220px] text-white/60 group-hover/addr:text-white group-hover/addr:underline transition-all"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                >
                  R. Magda Perona Frossard, 565 • Jd. Nova Aliança
                </span>
              </a>
            </div>
          </Link>

          {/* Status + Admin */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all shadow-inner ${
              settings.isOpen
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                : 'bg-red-500/10 text-red-400 border border-red-500/25'
            }`}>
              <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
                settings.isOpen ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-red-400'
              }`} />
              {settings.isOpen ? 'Loja Aberta' : 'Loja Fechada'}
            </div>

            <Link
              to="/admin"
              className="p-2 text-zinc-500 hover:text-primary transition-all rounded-full hover:bg-white/5 border border-transparent hover:border-primary/20"
              title="Acesso Administrativo"
            >
              <LayoutDashboard className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
