import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ChefHat, ListChecks, Lock, LogOut, Plus, Settings, ShieldCheck, Store, UtensilsCrossed } from 'lucide-react';
import { useOrders } from '@/contexts/OrderContext';
import { getStaffSession, signInStaff, signOutStaff } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManualOrderForm } from '@/components/ManualOrderForm';
import { KanbanBoard } from '@/components/KanbanBoard';
import { KitchenKDS } from '@/components/KitchenKDS';
import { DashboardStats } from '@/components/DashboardStats';
import { MenuManagement } from '@/components/MenuManagement';
import { SystemDashboard } from '@/components/SystemDashboard';
import { InventoryReport } from '@/components/InventoryReport';
import { PDVModule } from '@/components/PDVModule';

export default function AdminDashboard() {
  const { userRole, setUserRole, refetchOrders, refreshSessionRole } = useOrders();
  const [activeTab, setActiveTab] = useState('orders');
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    void getStaffSession().then(async (staff) => {
      if (!mounted) return;
      if (staff) {
        setUserRole(staff.role);
        setIsAuthenticated(true);
        await refetchOrders();
      }
      setIsCheckingSession(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === '+' || event.key === '=') && !isManualOrderOpen && isAuthenticated) {
        event.preventDefault();
        setIsManualOrderOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isManualOrderOpen, isAuthenticated]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setLoginError('Informe e-mail e senha.');
      return;
    }
    setIsSigningIn(true);
    setLoginError('');
    try {
      const staff = await signInStaff(email.trim(), password);
      setUserRole(staff.role);
      setIsAuthenticated(true);
      await refetchOrders();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível entrar.';
      setLoginError(message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await signOutStaff();
    await refreshSessionRole();
    setIsAuthenticated(false);
    setPassword('');
  };

  if (isCheckingSession) {
    return <div className="min-h-screen bg-zinc-950 grid place-items-center text-zinc-400">Verificando acesso seguro...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/70 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic uppercase text-white">Thita Admin</h1>
              <p className="text-sm text-zinc-400">Acesso por conta autorizada do Supabase.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-email" className="text-zinc-200">E-mail</Label>
              <Input id="staff-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="bg-zinc-950 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-password" className="text-zinc-200">Senha</Label>
              <Input id="staff-password" type="password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setLoginError(''); }} onKeyDown={(e) => { if (e.key === 'Enter') void handleLogin(); }} className="bg-zinc-950 border-white/10" />
            </div>
            {loginError && <p className="text-sm text-red-400" role="alert">{loginError}</p>}
            <Button onClick={() => void handleLogin()} disabled={isSigningIn} className="w-full h-12 font-black uppercase tracking-wider">
              {isSigningIn ? 'Entrando...' : 'Entrar no painel'}
            </Button>
          </div>

          <Link to="/" className="block text-center text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white">Voltar ao cardápio</Link>
        </div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-primary/20 bg-zinc-950/95 backdrop-blur-md">
        <div className="container py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Thita Lanches" className="h-10 w-10 rounded-full object-contain border border-primary/30" />
              <div>
                <p className="font-black italic uppercase text-white leading-none">Thita <span className="text-primary">Admin</span></p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">{userRole === 'admin' ? 'Administrador' : 'Funcionário'}</p>
              </div>
            </Link>
            <Button size="sm" onClick={() => setIsManualOrderOpen(true)} className="lg:hidden gap-1"><Plus className="h-4 w-4" />Novo</Button>
          </div>

          <div className="overflow-x-auto">
            <TabsList className="bg-zinc-900 border border-white/5 h-10 rounded-full">
              <TabsTrigger value="pdv"><Store className="w-4 h-4 mr-1" />PDV</TabsTrigger>
              <TabsTrigger value="orders"><ListChecks className="w-4 h-4 mr-1" />Pedidos</TabsTrigger>
              <TabsTrigger value="kds"><ChefHat className="w-4 h-4 mr-1" />Cozinha</TabsTrigger>
              {userRole === 'admin' && <TabsTrigger value="menu"><UtensilsCrossed className="w-4 h-4 mr-1" />Cardápio</TabsTrigger>}
              {userRole === 'admin' && <TabsTrigger value="reports"><BarChart3 className="w-4 h-4 mr-1" />Relatórios</TabsTrigger>}
              <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1" />Sistema</TabsTrigger>
            </TabsList>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Button onClick={() => setIsManualOrderOpen(true)} className="gap-2"><Plus className="w-4 h-4" />Novo pedido</Button>
            <Button variant="ghost" onClick={() => void handleLogout()} className="gap-2 text-zinc-400 hover:text-white"><LogOut className="w-4 h-4" />Sair</Button>
          </div>
        </div>
      </header>

      <main className="container py-6 flex-1">
        <TabsContent value="pdv"><PDVModule /></TabsContent>
        <TabsContent value="orders" className="space-y-6"><DashboardStats /><KanbanBoard /></TabsContent>
        <TabsContent value="kds"><KitchenKDS /></TabsContent>
        {userRole === 'admin' && <TabsContent value="menu"><MenuManagement /></TabsContent>}
        <TabsContent value="settings"><SystemDashboard /></TabsContent>
        {userRole === 'admin' && <TabsContent value="reports"><InventoryReport /></TabsContent>}
      </main>

      <ManualOrderForm isOpen={isManualOrderOpen} onClose={() => setIsManualOrderOpen(false)} />
    </Tabs>
  );
}
