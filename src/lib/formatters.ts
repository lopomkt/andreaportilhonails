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
