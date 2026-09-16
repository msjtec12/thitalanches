import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type StaffRole = 'admin' | 'employee';

export interface StaffSession {
  user: User;
  role: StaffRole;
}

export async function ensureCustomerSession(): Promise<Session> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session) return sessionData.session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) {
    throw error || new Error('Não foi possível iniciar uma sessão segura.');
  }
  return data.session;
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user || userData.user.is_anonymous) return null;

  const { data, error } = await supabase
    .from('staff_users')
    .select('role,is_active')
    .eq('user_id', userData.user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  if (data.role !== 'admin' && data.role !== 'employee') return null;

  return { user: userData.user, role: data.role };
}

export async function signInStaff(email: string, password: string): Promise<StaffSession> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const staff = await getStaffSession();
  if (!staff) {
    await supabase.auth.signOut();
    throw new Error('Esta conta não possui acesso ao painel.');
  }
  return staff;
}

export async function signOutStaff(): Promise<void> {
  await supabase.auth.signOut();
  await ensureCustomerSession();
}
