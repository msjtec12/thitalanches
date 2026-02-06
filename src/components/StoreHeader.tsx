import { useOrders } from '@/contexts/OrderContext';
import { Link } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';

export function StoreHeader() {
  const { settings } = useOrders();

  return (
    <header className="sticky top-0 z-40 bg-zinc-950 border-b border-primary/20 shadow-2xl">
      <div className="container py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur group-hover:bg-primary/40 transition-all"></div>
                <img 
                  src="/logo.png" 
                  alt="Thita Lanches Logo" 
                  className="relative h-12 w-12 md:h-16 md:w-16 object-contain rounded-full border-2 border-primary/30 bg-primary/5 p-0.5"
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xl font-black italic tracking-tighter text-white uppercase leading-none group-hover:text-primary transition-colors">
                  THITA <span className="text-primary italic">LANCHES</span>
                </span>
                <span className="text-[9px] text-zinc-500 font-bold tracking-[0.2em] uppercase mt-0.5">
                  Since 2015 • Ribeirão Preto
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all shadow-inner ${
              settings.isOpen 
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] ${
                settings.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
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
