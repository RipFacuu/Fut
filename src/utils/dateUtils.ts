/**
 * Utilidades para manejo de fechas y evitar problemas de zona horaria
 */

/**
 * Convierte una fecha de string a Date considerando la zona horaria local
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns Date object en zona horaria local
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Dividir la fecha en componentes
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Crear fecha en zona horaria local (sin conversión UTC)
  return new Date(year, month - 1, day);
}

/**
 * Formatea una fecha para mostrar en español sin problemas de zona horaria
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns String formateado en español
 */
export function formatLocalDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = parseLocalDate(dateString);
  
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formatea una fecha para mostrar en formato corto argentino
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns String formateado en formato DD/MM/YYYY
 */
export function formatShortDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = parseLocalDate(dateString);
  
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Convierte una fecha Date a string en formato YYYY-MM-DD para inputs de tipo date
 * @param date - Date object
 * @returns String en formato YYYY-MM-DD
 */
export function dateToInputString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
} 