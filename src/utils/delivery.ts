export const calculateDeliveryFee = (distanceKm: number): number | null => {
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
  if (distanceKm <= 12) return 16.75;
  return null; // For distances greater than 12km
};

export const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d * 1.3; // Adjustment factor for driving distance compared to straight line
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

export const fetchAddressFromCep = async (cep: string) => {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
      cep: cleanCep
    };
  } catch (err) {
    console.error("Error fetching CEP:", err);
    return null;
  }
};

export const fetchCoordinatesFromAddress = async (street: string, city: string, state: string) => {
  try {
    // URL encode components to search safely
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.append('street', street);
    url.searchParams.append('city', city);
    url.searchParams.append('state', state);
    url.searchParams.append('country', 'Brazil');
    url.searchParams.append('format', 'json');
    url.searchParams.append('limit', '1');

    const res = await fetch(url.toString(), {
       headers: {
         'Accept-Language': 'pt-BR,pt;q=0.9',
         'User-Agent': 'ThitaLanches/1.0' // Good practice for Nominatim API
       }
    });
    const data = await res.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching coordinates:", err);
    return null;
  }
};
