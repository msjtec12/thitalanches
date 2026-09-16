import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInAnonymously: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      signInAnonymously: mocks.signInAnonymously,
    },
  },
}));

import { ensureCustomerSession } from '@/lib/auth';

describe('ensureCustomerSession', () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.signInAnonymously.mockReset();
  });

  it('reutiliza uma sessão existente sem autenticação anônima adicional', async () => {
    const session = { user: { id: 'existing-user' } };
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });

    await expect(ensureCustomerSession()).resolves.toBe(session);
    expect(mocks.signInAnonymously).not.toHaveBeenCalled();
  });

  it('cria sessão anônima quando o visitante ainda não possui sessão', async () => {
    const session = { user: { id: 'anonymous-user' } };
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.signInAnonymously.mockResolvedValue({ data: { session }, error: null });

    await expect(ensureCustomerSession()).resolves.toBe(session);
    expect(mocks.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('propaga falha ao criar sessão segura', async () => {
    const error = new Error('anonymous sign-in disabled');
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.signInAnonymously.mockResolvedValue({ data: { session: null }, error });

    await expect(ensureCustomerSession()).rejects.toThrow('anonymous sign-in disabled');
  });
});
