export const getCurrentPeruDateTimeObject = () => {
  const now = new Date();
  // Opciones para formatear en la zona horaria de Perú (America/Lima)
  const options = {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: 'numeric', // 'numeric' para obtener el número del mes
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false, // Formato de 24 horas
  };
  const formatter = new Intl.DateTimeFormat('en-CA', options); // 'en-CA' da YYYY-MM-DD
  const parts = formatter.formatToParts(now);
  const dateParts = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      // Convertir a número, especialmente para mes y día
      dateParts[part.type] = parseInt(part.value, 10);
    }
  }
  // Crear un nuevo objeto Date usando los componentes de la zona horaria de Perú
  // Nota: El mes en el constructor de Date es 0-indexado (0 para Enero, 11 para Diciembre)
  return new Date(dateParts.year, dateParts.month - 1, dateParts.day, dateParts.hour, dateParts.minute, dateParts.second);
};

export const getTodayPeruDateString = () => {
  const nowInPeru = getCurrentPeruDateTimeObject();
  const year = nowInPeru.getFullYear();
  const month = (nowInPeru.getMonth() + 1).toString().padStart(2, '0'); // Mes es 0-indexado
  const day = nowInPeru.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
