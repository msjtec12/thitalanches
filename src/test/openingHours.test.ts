import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkStoreOpenStatus } from '@/utils/openingHours';
import type { StoreSettings } from '@/types/order';

const baseSettings: StoreSettings = {
  name: 'Thita Lanches',
  isOpen: true,
  isCashierOpen: true,
  prepTime: 30,
  neighborhoods: [],
  deliveryRadius: 12,
  openingHours: [],
  schedulingInterval: 15,
};

function settingsWithHours(openingHours: StoreSettings['openingHours']): StoreSettings {
  return { ...baseSettings, openingHours };
}

describe('checkStoreOpenStatus', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('respeita fechamento manual do administrador', () => {
    expect(checkStoreOpenStatus({ ...baseSettings, isOpen: false })).toMatchObject({
      isOpen: false,
      statusText: 'Loja Fechada',
    });
  });

  it('considera aberta quando não há grade de horários', () => {
    expect(checkStoreOpenStatus(baseSettings).isOpen).toBe(true);
  });

  it('detecta horário diurno aberto', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 14, 19, 30)); // segunda-feira

    const result = checkStoreOpenStatus(settingsWithHours([
      { dayOfWeek: 1, openTime: '18:00', closeTime: '23:00' },
    ]));

    expect(result).toEqual({
      isOpen: true,
      statusText: 'Loja Aberta',
      nextTimeText: 'Fecha às 23:00',
    });
  });

  it('mantém aberto após meia-noite quando o expediente começou no dia anterior', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 15, 1, 0)); // terça-feira

    const result = checkStoreOpenStatus(settingsWithHours([
      { dayOfWeek: 1, openTime: '18:00', closeTime: '02:00' },
    ]));

    expect(result.isOpen).toBe(true);
    expect(result.nextTimeText).toBe('Fecha às 02:00');
  });

  it('informa a próxima abertura do mesmo dia', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 14, 16, 0));

    const result = checkStoreOpenStatus(settingsWithHours([
      { dayOfWeek: 1, openTime: '18:00', closeTime: '23:00' },
    ]));

    expect(result).toEqual({
      isOpen: false,
      statusText: 'Loja Fechada',
      nextTimeText: 'Abre hoje às 18:00',
    });
  });
});
