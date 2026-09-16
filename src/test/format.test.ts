import { describe, expect, it } from 'vitest';
import { formatPrice, formatTime } from '@/utils/format';

describe('formatPrice', () => {
  it('formata reais em pt-BR', () => {
    expect(formatPrice(19.9)).toMatch(/R\$\s?19,90/);
  });

  it('trata valor ausente como zero', () => {
    expect(formatPrice(undefined)).toBe('R$ 0,00');
    expect(formatPrice(null)).toBe('R$ 0,00');
  });
});

describe('formatTime', () => {
  it('mantém minutos abaixo de uma hora', () => {
    expect(formatTime(45)).toBe('45 min');
  });

  it('formata horas inteiras', () => {
    expect(formatTime(120)).toBe('2h');
  });

  it('formata horas e minutos', () => {
    expect(formatTime(95)).toBe('1h 35m');
  });
});
