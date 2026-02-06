export const maskPhone = (value: string) => {
  if (!value) return '';
  // Remove 55 prefix if it exists to help the user migrate/handle raw data
  let cleaned = value.replace(/\D/g, '');
  if (cleaned.startsWith('55') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }
  
  const match = cleaned.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);
  if (!match) return cleaned;
  
  const ddd = match[1];
  const part1 = match[2];
  const part2 = match[3];
  
  if (cleaned.length <= 2) return ddd ? `(${ddd}` : '';
  if (cleaned.length <= 6) return `(${ddd}) ${part1}`;
  if (cleaned.length <= 10) return `(${ddd}) ${part1.substring(0, 4)}-${part1.substring(4)}${part2}`;
  return `(${ddd}) ${part1}-${part2}`;
};

export const unmaskPhone = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 10 && !cleaned.startsWith('55')) {
    return `55${cleaned}`;
  }
  return cleaned;
};
