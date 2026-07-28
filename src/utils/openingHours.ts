import { StoreSettings } from '@/types/order';

export interface StoreOpenStatus {
  isOpen: boolean;
  statusText: string;
  nextTimeText?: string;
}

export function checkStoreOpenStatus(settings: StoreSettings): StoreOpenStatus {
  // Se o admin desativou manualmente o funcionamento
  if (settings.isOpen === false) {
    return {
      isOpen: false,
      statusText: 'Loja Fechada',
      nextTimeText: 'Fechada temporariamente pelo administrador'
    };
  }

  const hours = settings.openingHours || [];
  if (hours.length === 0) {
    return {
      isOpen: true,
      statusText: 'Loja Aberta'
    };
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Domingo, 1 = Segunda...
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Procura horário cadastrado para o dia da semana atual
  const todaysHours = hours.filter(h => h.dayOfWeek === currentDay);

  for (const h of todaysHours) {
    if (!h.openTime || !h.closeTime) continue;

    const [openH, openM] = h.openTime.split(':').map(Number);
    const [closeH, closeM] = h.closeTime.split(':').map(Number);

    let openMinutes = openH * 60 + openM;
    let closeMinutes = closeH * 60 + closeM;

    // Se o horário de fechamento for na madrugada do dia seguinte (ex: 18:00 às 02:00)
    if (closeMinutes <= openMinutes) {
      closeMinutes += 24 * 60;
    }

    let checkMinutes = currentMinutes;
    // Se passou da meia-noite e o horário abria no dia anterior
    if (checkMinutes < openMinutes && closeMinutes > 24 * 60) {
      checkMinutes += 24 * 60;
    }

    if (checkMinutes >= openMinutes && checkMinutes <= closeMinutes) {
      return {
        isOpen: true,
        statusText: 'Loja Aberta',
        nextTimeText: `Fecha às ${h.closeTime}`
      };
    }
  }

  // Se chegou aqui, está fora do horário do dia
  const firstToday = todaysHours[0];
  const nextText = firstToday?.openTime ? `Abre hoje às ${firstToday.openTime}` : 'Consulte os horários de funcionamento';

  return {
    isOpen: false,
    statusText: 'Loja Fechada',
    nextTimeText: nextText
  };
}
