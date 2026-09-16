import { describe, expect, it, vi, afterEach } from 'vitest';
import { calculateDeliveryFee, fetchAddressFromCep, getDistanceKm } from '@/utils/delivery';

describe('calculateDeliveryFee', () => {
  it.each([
    [0, 3],
    [1, 3],
    [1.01, 4.25],
    [2, 4.25],
    [5, 8],
    [11, 15.5],
    [12, 16.75],
  ])('calcula a faixa correta para %s km', (distance, expected) => {
    expect(calculateDeliveryFee(distance)).toBe(expected);
  });

  it.each([-1, 12.01, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejeita distância inválida: %s',
    (distance) => {
      expect(calculateDeliveryFee(distance)).toBeNull();
    },
  );
});

describe('getDistanceKm', () => {
  it('retorna zero para o mesmo ponto', () => {
    expect(getDistanceKm(-21.2185, -47.8224, -21.2185, -47.8224)).toBe(0);
  });

  it('retorna distância positiva entre pontos diferentes', () => {
    expect(getDistanceKm(-21.2185, -47.8224, -21.17, -47.81)).toBeGreaterThan(0);
  });
});

describe('fetchAddressFromCep', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('não consulta a rede para CEP inválido', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchAddressFromCep('123')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normaliza e retorna endereço do ViaCEP', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        logradouro: 'Rua Teste',
        bairro: 'Centro',
        localidade: 'Ribeirão Preto',
        uf: 'SP',
      }),
    }));

    await expect(fetchAddressFromCep('14026-596')).resolves.toEqual({
      street: 'Rua Teste',
      neighborhood: 'Centro',
      city: 'Ribeirão Preto',
      state: 'SP',
      cep: '14026596',
    });
  });
});
