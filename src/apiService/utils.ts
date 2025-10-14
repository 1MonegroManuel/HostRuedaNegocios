import type { QueryParams } from './types';

// Utilidades para manejo de datos y formateo

/**
 * Formatea una fecha para la API
 */
export const formatDateForAPI = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString();
};

/**
 * Formatea una fecha para mostrar
 */
export const formatDateForDisplay = (date: string | Date, format: 'short' | 'long' | 'time' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('es-ES');
    case 'long':
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'time':
      return dateObj.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    default:
      return dateObj.toLocaleDateString('es-ES');
  }
};

/**
 * Formatea un número para mostrar
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Formatea un porcentaje
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Formatea un tamaño de archivo
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Valida un email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida un teléfono
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Valida una contraseña
 */
export const isValidPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Genera un ID único
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait) as any;
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Convierte un objeto a QueryParams
 */
export const objectToQueryParams = (obj: Record<string, any>): QueryParams => {
  const params: QueryParams = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== '') {
      params[key] = value;
    }
  });
  
  return params;
};

/**
 * Convierte QueryParams a string de URL
 */
export const queryParamsToString = (params: QueryParams): string => {
  const searchParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  
  return searchParams.toString();
};

/**
 * Obtiene el nombre del archivo de una URL
 */
export const getFileNameFromUrl = (url: string): string => {
  return url.split('/').pop() || '';
};

/**
 * Obtiene la extensión de un archivo
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Obtiene el tipo MIME de un archivo por extensión
 */
export const getMimeTypeFromExtension = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'json': 'application/json',
    'xml': 'application/xml',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

/**
 * Valida el tipo de archivo
 */
export const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Valida el tamaño del archivo
 */
export const isValidFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

/**
 * Convierte un archivo a base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Descarga un archivo desde un blob
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Copia texto al portapapeles
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error al copiar al portapapeles:', error);
    return false;
  }
};

/**
 * Obtiene el color de estado
 */
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'pendiente': '#ff9800',
    'enviada': '#2196f3',
    'leida': '#4caf50',
    'fallida': '#f44336',
    'programada': '#ff9800',
    'confirmada': '#2196f3',
    'completada': '#4caf50',
    'cancelada': '#f44336',
    'no_show': '#9e9e9e',
    'aceptada': '#4caf50',
    'rechazada': '#f44336',
  };
  
  return statusColors[status] || '#9e9e9e';
};

/**
 * Obtiene el icono de estado
 */
export const getStatusIcon = (status: string): string => {
  const statusIcons: Record<string, string> = {
    'pendiente': '⏳',
    'enviada': '📤',
    'leida': '✅',
    'fallida': '❌',
    'programada': '📅',
    'confirmada': '✅',
    'completada': '🎉',
    'cancelada': '❌',
    'no_show': '👻',
    'aceptada': '✅',
    'rechazada': '❌',
  };
  
  return statusIcons[status] || '❓';
};

/**
 * Formatea un estado para mostrar
 */
export const formatStatus = (status: string): string => {
  const statusLabels: Record<string, string> = {
    'pendiente': 'Pendiente',
    'enviada': 'Enviada',
    'leida': 'Leída',
    'fallida': 'Fallida',
    'programada': 'Programada',
    'confirmada': 'Confirmada',
    'completada': 'Completada',
    'cancelada': 'Cancelada',
    'no_show': 'No se presentó',
    'aceptada': 'Aceptada',
    'rechazada': 'Rechazada',
  };
  
  return statusLabels[status] || status;
};

/**
 * Obtiene el color de canal
 */
export const getChannelColor = (channel: string): string => {
  const channelColors: Record<string, string> = {
    'app': '#2196f3',
    'email': '#ff9800',
    'sms': '#4caf50',
    'whatsapp': '#25d366',
  };
  
  return channelColors[channel] || '#9e9e9e';
};

/**
 * Obtiene el icono de canal
 */
export const getChannelIcon = (channel: string): string => {
  const channelIcons: Record<string, string> = {
    'app': '📱',
    'email': '📧',
    'sms': '💬',
    'whatsapp': '📱',
  };
  
  return channelIcons[channel] || '📡';
};

/**
 * Formatea un canal para mostrar
 */
export const formatChannel = (channel: string): string => {
  const channelLabels: Record<string, string> = {
    'app': 'Aplicación',
    'email': 'Correo electrónico',
    'sms': 'SMS',
    'whatsapp': 'WhatsApp',
  };
  
  return channelLabels[channel] || channel;
};

/**
 * Obtiene el color de tipo de archivo
 */
export const getFileTypeColor = (type: string): string => {
  const typeColors: Record<string, string> = {
    'MAPA': '#2196f3',
    'CRONOGRAMA': '#ff9800',
    'OTRO': '#9e9e9e',
  };
  
  return typeColors[type] || '#9e9e9e';
};

/**
 * Obtiene el icono de tipo de archivo
 */
export const getFileTypeIcon = (type: string): string => {
  const typeIcons: Record<string, string> = {
    'MAPA': '🗺️',
    'CRONOGRAMA': '📅',
    'OTRO': '📄',
  };
  
  return typeIcons[type] || '📄';
};

/**
 * Formatea un tipo de archivo para mostrar
 */
export const formatFileType = (type: string): string => {
  const typeLabels: Record<string, string> = {
    'MAPA': 'Mapa',
    'CRONOGRAMA': 'Cronograma',
    'OTRO': 'Otro',
  };
  
  return typeLabels[type] || type;
};

/**
 * Obtiene el color de rubro
 */
export const getRubroColor = (rubro: string): string => {
  const rubroColors: Record<string, string> = {
    'Agricultura': '#4caf50',
    'Ganadería': '#8bc34a',
    'Turismo': '#ff9800',
    'Tecnología': '#2196f3',
    'Construcción': '#795548',
    'Comercio': '#ff5722',
    'Logística': '#607d8b',
    'Servicios': '#9c27b0',
    'Manufactura': '#3f51b5',
    'Finanzas': '#009688',
  };
  
  return rubroColors[rubro] || '#9e9e9e';
};

/**
 * Obtiene el icono de rubro
 */
export const getRubroIcon = (rubro: string): string => {
  const rubroIcons: Record<string, string> = {
    'Agricultura': '🌾',
    'Ganadería': '🐄',
    'Turismo': '🏖️',
    'Tecnología': '💻',
    'Construcción': '🏗️',
    'Comercio': '🛒',
    'Logística': '🚚',
    'Servicios': '🔧',
    'Manufactura': '🏭',
    'Finanzas': '💰',
  };
  
  return rubroIcons[rubro] || '🏢';
};

/**
 * Formatea un rubro para mostrar
 */
export const formatRubro = (rubro: string): string => {
  return rubro || 'Sin especificar';
};

/**
 * Obtiene el color de tipo de usuario
 */
export const getUserTypeColor = (tipo: string): string => {
  const tipoColors: Record<string, string> = {
    'admin': '#f44336',
    'dueño': '#ff9800',
    'personal': '#2196f3',
  };
  
  return tipoColors[tipo] || '#9e9e9e';
};

/**
 * Obtiene el icono de tipo de usuario
 */
export const getUserTypeIcon = (tipo: string): string => {
  const tipoIcons: Record<string, string> = {
    'admin': '👑',
    'dueño': '👤',
    'personal': '👥',
  };
  
  return tipoIcons[tipo] || '👤';
};

/**
 * Formatea un tipo de usuario para mostrar
 */
export const formatUserType = (tipo: string): string => {
  const tipoLabels: Record<string, string> = {
    'admin': 'Administrador',
    'dueño': 'Dueño',
    'personal': 'Personal',
  };
  
  return tipoLabels[tipo] || tipo;
};
