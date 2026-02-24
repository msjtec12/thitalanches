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

          {/* Logo + Nome + Tagline */}
          <Link to="/" className="flex items-center gap-3 md:gap-4 group">
            {/* Logo */}
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1.5 bg-amber-500/20 rounded-full blur-md group-hover:bg-amber-500/35 transition-all duration-300" />
              <img
                src={settings.logoUrl || '/logo.png'}
                alt="Thita Lanches Logo"
                className="relative h-14 w-14 md:h-18 md:w-18 object-contain rounded-full border-2 border-amber-500/40 bg-black/30 p-0.5"
                style={{ width: '60px', height: '60px' }}
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
              />
            </div>

            {/* Textos */}
            <div className="flex flex-col gap-0.5">
              <span
                className="text-xl md:text-2xl font-black italic tracking-tighter text-white uppercase leading-none group-hover:text-amber-400 transition-colors duration-300"
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
              >
                THITA <span className="text-primary">LANCHES</span>
              </span>

              {/* Tagline */}
              <span
                className="text-[11px] md:text-xs font-semibold italic tracking-wide leading-none"
                style={{
                  color: '#d4a853',
                  textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                }}
              >
                "O Lanche raíz de respeito!"
              </span>

              <span className="text-[9px] text-zinc-500 font-bold tracking-[0.18em] uppercase mt-0.5 hidden sm:block">
                Since 2015 • Ribeirão Preto
              </span>
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
