
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const formatPhone = (phone: string): string => {
  // Remove non-numeric characters
  const numericPhone = phone.replace(/\D/g, "");
  
  // Format as (XX) XXXXX-XXXX
  if (numericPhone.length === 11) {
    return `(${numericPhone.substring(0, 2)}) ${numericPhone.substring(2, 7)}-${numericPhone.substring(7)}`;
  }
  
  // Format as (XX) XXXX-XXXX
  if (numericPhone.length === 10) {
    return `(${numericPhone.substring(0, 2)}) ${numericPhone.substring(2, 6)}-${numericPhone.substring(6)}`;
  }
  
  // Return as is if format doesn't match
  return phone;
};

export const formatDuration = (minutes: number): string => {
  if (minutes <= 0) {
    return "0 minutos";
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
  }
  
  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  
  return `${hours} ${hours === 1 ? 'hora' : 'horas'} e ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
};

/**
 * Formats minutes into human-readable time format (hours and minutes)
 */
export function formatMinutesToHumanTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
  } else if (remainingMinutes === 0) {
    return `${hours} hora${hours !== 1 ? 's' : ''}`;
  } else {
    return `${hours} hora${hours !== 1 ? 's' : ''} e ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
  }
}

/**
 * Formats available time for schedule display
 * Converts minutes to a human-readable format like "11 horas disponíveis" or "1 hora e 15 minutos"
 */
export function formatAvailableTime(minutes: number): string {
  if (minutes <= 0) {
    return "Sem disponibilidade";
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} ${mins === 1 ? 'minuto disponível' : 'minutos disponíveis'}`;
  }
  
  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hora disponível' : 'horas disponíveis'}`;
  }
  
  return `${hours}h e ${mins}min disponíveis`;
}
