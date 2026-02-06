import { Link } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { ManualOrderForm } from '@/components/ManualOrderForm';
import { KanbanBoard } from '@/components/KanbanBoard';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Settings, ListChecks, UserCircle, ShieldCheck, Lock, BarChart3 } from 'lucide-react';
import { DashboardStats } from '@/components/DashboardStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MenuManagement } from '@/components/MenuManagement';
import { SystemDashboard } from '@/components/SystemDashboard';
import { InventoryReport } from '@/components/InventoryReport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminDashboard() {
  const { settings, userRole, setUserRole } = useOrders();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });

  const handleRoleChange = (role: 'admin' | 'employee') => {
    if (role === 'admin' && userRole !== 'admin') {
      setIsPinModalOpen(true);
      setPinInput('');
      setPinError(false);
    } else {
      setUserRole(role);
    }
  };

  const verifyPin = () => {
    if (pinInput === (settings.adminPin || '1234')) {
      setUserRole('admin');
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setIsPinModalOpen(false);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Adiciona um fundo decorativo sutil */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>
        
        <div className="w-full max-w-[400px] space-y-8 relative z-10">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-primary/20 p-4 rounded-full border border-primary/30 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">
                ACESSO <span className="text-primary">RESTRITO</span>
              </h2>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Insira seu PIN de acesso</p>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="space-y-4">
              <Input 
                type="password" 
                placeholder="****" 
                className={`text-center text-4xl tracking-[0.5em] font-black h-20 bg-zinc-950/50 border-white/5 focus:border-primary/50 transition-all rounded-2xl ${pinError ? 'border-destructive ring-destructive animate-shake' : ''}`}
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') verifyPin();
                }}
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-destructive font-bold text-center uppercase tracking-wider animate-bounce">
                  PIN INCORETO! TENTE NOVAMENTE
                </p>
              )}
            </div>

            <Button onClick={verifyPin} className="w-full h-14 text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              ENTRAR NO PAINEL
            </Button>
            
            <Link to="/" className="block text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
              Voltar para o site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="orders" value={activeTab} onValueChange={setActiveTab} className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 bg-zinc-950 border-b border-primary/20 shadow-lg backdrop-blur-md bg-zinc-950/90">
        <div className="container py-2 sm:py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3 group">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-full border border-primary/30"
                />
                <div className="flex flex-col">
                  <h1 className="text-sm sm:text-base font-black italic tracking-tighter text-white uppercase leading-none group-hover:text-primary transition-colors">
                    THITA <span className="text-primary italic">ADMIN</span>
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Painel de Controle</span>
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                  </div>
                </div>
              </Link>
              
              <Link 
                to="/" 
                className="flex md:hidden items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-primary"
              >
                <ShoppingBag className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex items-center justify-center sm:justify-start">
              <TabsList className="bg-zinc-900 border border-white/5 p-1 h-10 gap-1 rounded-full px-2">
                <TabsTrigger value="orders" className="gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">
                  <ListChecks className="w-4 h-4" />
                  <span className="hidden xs:inline">Pedidos</span>
                </TabsTrigger>
                {userRole === 'admin' && (
                  <TabsTrigger value="menu" className="gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">
                    <UtensilsCrossed className="w-4 h-4" />
                    <span className="hidden xs:inline">Cardápio</span>
                  </TabsTrigger>
                )}
                {userRole === 'admin' && (
                  <TabsTrigger value="reports" className="gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden xs:inline">Relatórios</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="settings" className="gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Settings className="w-4 h-4" />
                  <span className="hidden xs:inline">Sistema</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-primary">
                    {userRole === 'admin' ? <ShieldCheck className="w-4 h-4 text-primary" /> : <UserCircle className="w-4 h-4" />}
                    <span>{userRole === 'admin' ? 'Admin' : 'Funcionário'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Alternar Perfil</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleRoleChange('admin')} className="gap-2">
                    <ShieldCheck className="w-4 h-4" /> Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleChange('employee')} className="gap-2">
                    <UserCircle className="w-4 h-4" /> Funcionário
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Acesso Restrito
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">Insira o PIN de administrador para acessar o painel completo.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">PIN de Acesso</Label>
              <Input 
                id="pin" 
                type="password" 
                placeholder="****" 
                className={`text-center text-2xl tracking-[1em] font-black h-14 ${pinError ? 'border-destructive ring-destructive' : ''}`}
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') verifyPin();
                }}
                autoFocus
              />
              {pinError && <p className="text-xs text-destructive font-medium text-center">PIN incorreto. Tente novamente.</p>}
            </div>
            <Button onClick={verifyPin} className="w-full h-11 font-bold">Verificar Acesso</Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="container py-6 flex-1">

          <TabsContent value="orders" className="space-y-6 outline-none">
            <DashboardStats />
            <KanbanBoard />
          </TabsContent>

          <TabsContent value="menu" className="outline-none">
            <MenuManagement />
          </TabsContent>

          <TabsContent value="settings" className="outline-none">
            <SystemDashboard />
          </TabsContent>

          <TabsContent value="reports" className="outline-none">
            <InventoryReport />
          </TabsContent>
        </main>
        {activeTab !== 'settings' && <ManualOrderForm />}
      </Tabs>
  );
}
