import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';

export function PwaInstallBanner() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(true);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('thita_pwa_banner_dismissed');
    if (!dismissed && (isInstallable || isIOS) && !isInstalled) {
      setIsDismissed(false);
    }
  }, [isInstallable, isIOS, isInstalled]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('thita_pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await promptInstall();
      if (installed) {
        setIsDismissed(true);
      }
    } else if (isIOS) {
      setShowIosGuide(true);
    }
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <aside aria-label="Instalação do Aplicativo" className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-zinc-950/95 border border-primary/40 p-3.5 sm:p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-amber-500/40 bg-black/60 p-1 flex items-center justify-center shadow-inner">
            <img src="/logo.png" alt="Thita Lanches" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-black italic uppercase tracking-tight text-white flex items-center gap-1.5 truncate">
              Instale o App Thita
              <span className="bg-primary/20 text-primary text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Grátis</span>
            </h4>
            <p className="text-[11px] text-zinc-400 truncate">
              {isIOS ? 'Adicione à tela de início para pedir mais rápido' : 'Acesso rápido e pedidos sem gastar internet'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="h-8 px-3 rounded-xl bg-primary hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/20 gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </Button>

          <button
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-white p-1 transition-colors rounded-lg"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Modal / Tooltip Guide */}
      {showIosGuide && (
        <div className="mt-2 p-3 bg-zinc-900 border border-white/10 rounded-xl text-xs text-zinc-300 space-y-2 shadow-2xl">
          <div className="flex items-center justify-between font-bold text-white">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-primary" /> Como instalar no iPhone/iPad:
            </span>
            <button onClick={() => setShowIosGuide(false)} className="text-zinc-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-400">
            <li className="flex items-center gap-1">
              Toque no botão <Share className="w-3.5 h-3.5 text-blue-400 inline mx-0.5" /> <b>Compartilhar</b> no Safari.
            </li>
            <li className="flex items-center gap-1">
              Role para baixo e selecione <PlusSquare className="w-3.5 h-3.5 text-white inline mx-0.5" /> <b>Adicionar à Tela de Início</b>.
            </li>
          </ol>
        </div>
      )}
    </aside>
  );
}
