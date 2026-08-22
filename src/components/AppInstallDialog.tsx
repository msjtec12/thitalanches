import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Smartphone, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  QrCode, 
  Sparkles, 
  Zap, 
  WifiOff, 
  Bell
} from 'lucide-react';

interface AppInstallDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppInstallDialog({ isOpen, onClose }: AppInstallDialogProps) {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);

  const handleInstall = async () => {
    if (isInstallable) {
      const installed = await promptInstall();
      if (installed) {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2500);
      }
    }
  };

  const currentUrl = window.location.origin;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}&color=0-0-0&bgcolor=255-255-255`;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md bg-zinc-950 border border-white/10 text-white p-6 rounded-3xl shadow-2xl">
        <DialogHeader className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl border-2 border-amber-500/50 bg-black/60 p-2 mx-auto shadow-lg flex items-center justify-center">
            <img src="/logo.png" alt="Thita Lanches" className="w-full h-full object-contain" />
          </div>
          <DialogTitle className="text-lg font-black italic uppercase tracking-tight text-white">
            Baixar Aplicativo <span className="text-primary">Thita Lanches</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Tenha nosso cardápio completo, promoções e pedidos rápidos direto na tela do seu celular!
          </DialogDescription>
        </DialogHeader>

        {installSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-black italic uppercase text-white">
              Aplicativo Instalado com Sucesso!
            </h4>
            <p className="text-xs text-zinc-400">
              O ícone do Thita Lanches foi adicionado à tela inicial do seu aparelho.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Vantagens do App */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-white/5 space-y-1">
                <Zap className="w-4 h-4 text-amber-400 mx-auto" />
                <p className="text-[10px] font-bold text-white uppercase">Super Rápido</p>
                <p className="text-[9px] text-zinc-400">Carrega na hora</p>
              </div>

              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-white/5 space-y-1">
                <WifiOff className="w-4 h-4 text-emerald-400 mx-auto" />
                <p className="text-[10px] font-bold text-white uppercase">Leve & Grátis</p>
                <p className="text-[9px] text-zinc-400">Não pesa nada</p>
              </div>

              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-white/5 space-y-1">
                <Bell className="w-4 h-4 text-blue-400 mx-auto" />
                <p className="text-[10px] font-bold text-white uppercase">Rastreamento</p>
                <p className="text-[9px] text-zinc-400">Status em tempo real</p>
              </div>
            </div>

            {/* Android / Navegadores com suporte nativo */}
            {isInstallable && (
              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleInstall}
                  className="w-full h-12 bg-primary hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Instalar Aplicativo Agora
                </Button>
                <p className="text-[10px] text-center text-zinc-500">
                  Instalação segura e instantânea direto pelo navegador
                </p>
              </div>
            )}

            {/* Guia para iOS (iPhone / iPad) */}
            {isIOS && (
              <div className="p-4 bg-zinc-900 border border-amber-500/30 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase">
                  <Smartphone className="w-4 h-4" />
                  Como instalar no iPhone / iPad:
                </div>
                <div className="space-y-2 text-xs text-zinc-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </span>
                    <p className="text-xs">
                      Toque no botão de <b>Compartilhar</b> <Share className="w-3.5 h-3.5 text-blue-400 inline mx-1" /> na barra inferior do Safari.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </span>
                    <p className="text-xs">
                      Role a lista para baixo e toque em <PlusSquare className="w-3.5 h-3.5 text-white inline mx-1" /> <b>Adicionar à Tela de Início</b>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      3
                    </span>
                    <p className="text-xs">
                      Confirme clicando em <b>Adicionar</b> no canto superior direito. Pronto! 🎉
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop: QR Code para instalar no celular */}
            {!isIOS && !isInstallable && (
              <div className="p-4 bg-zinc-900 border border-white/10 rounded-2xl text-center space-y-3">
                <p className="text-xs font-bold text-white uppercase flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-primary" />
                  Aponte a câmera do seu celular:
                </p>
                <div className="flex justify-center">
                  <div className="bg-white p-2.5 rounded-xl shadow-md">
                    <img src={qrCodeUrl} alt="QR Code Instalar App" className="w-36 h-36" />
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Escaneie o código para abrir e instalar o aplicativo direto no seu smartphone.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
