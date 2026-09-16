export const calculateDeliveryFee = (distanceKm: number): number | null => {
  if (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > 12) return null;
  if (distanceKm <= 1) return 3.00;
  if (distanceKm <= 2) return 4.25;
  if (distanceKm <= 3) return 5.50;
  if (distanceKm <= 4) return 6.75;
  if (distanceKm <= 5) return 8.00;
  if (distanceKm <= 6) return 9.25;
  if (distanceKm <= 7) return 10.50;
  if (distanceKm <= 8) return 11.75;
  if (distanceKm <= 9) return 13.00;
  if (distanceKm <= 10) return 14.25;
  if (distanceKm <= 11) return 15.50;
  return 16.75;
};

export const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return 0;
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1.3;
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

async function fetchJson(url: string | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error('Erro em serviço de endereço:', err);
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const fetchAddressFromCep = async (cep: string) => {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  const data = await fetchJson(`https://viacep.com.br/ws/${cleanCep}/json/`);
  if (!data || data.erro) return null;

  return {
    street: data.logradouro,
    neighborhood: data.bairro,
    city: data.localidade,
    state: data.uf,
    cep: cleanCep,
  };
};

export const fetchCoordinatesFromAddress = async (street: string, city: string, state: string) => {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.append('street', street);
  url.searchParams.append('city', city);
  url.searchParams.append('state', state);
  url.searchParams.append('country', 'Brazil');
  url.searchParams.append('format', 'json');
  url.searchParams.append('limit', '1');

  const data = await fetchJson(url.toString(), {
    headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
  });

  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = Number.parseFloat(data[0].lat);
  const lng = Number.parseFloat(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};
