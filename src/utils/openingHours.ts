import { StoreSettings } from '@/types/order';

export interface StoreOpenStatus {
  isOpen: boolean;
  statusText: string;
  nextTimeText?: string;
}

const parseMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

export function checkStoreOpenStatus(settings: StoreSettings): StoreOpenStatus {
  if (settings.isOpen === false) {
    return {
      isOpen: false,
      statusText: 'Loja Fechada',
      nextTimeText: 'Fechada temporariamente pelo administrador',
    };
  }

  const hours = settings.openingHours || [];
  if (hours.length === 0) {
    return { isOpen: true, statusText: 'Loja Aberta' };
  }

  const now = new Date();
  const currentDay = now.getDay();
  const previousDay = (currentDay + 6) % 7;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const today = hours.filter((entry) => entry.dayOfWeek === currentDay);
  const previous = hours.filter((entry) => entry.dayOfWeek === previousDay);

  for (const entry of today) {
    if (!entry.openTime || !entry.closeTime) continue;
    const openMinutes = parseMinutes(entry.openTime);
    const closeMinutes = parseMinutes(entry.closeTime);
    if (openMinutes === null || closeMinutes === null) continue;

    const crossesMidnight = closeMinutes <= openMinutes;
    const isOpenNow = crossesMidnight
      ? currentMinutes >= openMinutes
      : currentMinutes >= openMinutes && currentMinutes <= closeMinutes;

    if (isOpenNow) {
      return {
        isOpen: true,
        statusText: 'Loja Aberta',
        nextTimeText: `Fecha às ${entry.closeTime}`,
      };
    }
  }

  for (const entry of previous) {
    if (!entry.openTime || !entry.closeTime) continue;
    const openMinutes = parseMinutes(entry.openTime);
    const closeMinutes = parseMinutes(entry.closeTime);
    if (openMinutes === null || closeMinutes === null) continue;

    const crossesMidnight = closeMinutes <= openMinutes;
    if (crossesMidnight && currentMinutes <= closeMinutes) {
      return {
        isOpen: true,
        statusText: 'Loja Aberta',
        nextTimeText: `Fecha às ${entry.closeTime}`,
      };
    }
  }

  const nextToday = today
    .filter((entry) => entry.openTime)
    .map((entry) => ({ entry, minutes: parseMinutes(entry.openTime) }))
    .filter((candidate): candidate is { entry: StoreSettings['openingHours'][number]; minutes: number } => candidate.minutes !== null)
    .filter((candidate) => candidate.minutes > currentMinutes)
    .sort((a, b) => a.minutes - b.minutes)[0];

  return {
    isOpen: false,
    statusText: 'Loja Fechada',
    nextTimeText: nextToday
      ? `Abre hoje às ${nextToday.entry.openTime}`
      : 'Consulte os horários de funcionamento',
  };
}
