import { MediaUploaderOptions } from '../types/media.types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export function validateMediaFile(
  file: File,
  options: MediaUploaderOptions
): ValidationResult {
  const warnings: string[] = [];

  // Validar que el archivo existe
  if (!file) {
    return { isValid: false, error: 'No se seleccionó ningún archivo' };
  }

  // Validar tipo de archivo
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  if (!isVideo && !isImage) {
    return { 
      isValid: false, 
      error: 'Solo se permiten archivos de imagen o video' 
    };
  }

  // Validar tamaño máximo
  const maxSizeBytes = isVideo 
    ? options.maxVideoSize * 1024 * 1024 
    : options.maxImageSize * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    const maxSizeMB = isVideo ? options.maxVideoSize : options.maxImageSize;
    const currentSizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      isValid: false,
      error: `El archivo es demasiado grande (${currentSizeMB}MB). Máximo permitido: ${maxSizeMB}MB`
    };
  }

  // Validar formatos específicos
  const allowedVideoFormats = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  const allowedImageFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (isVideo && !allowedVideoFormats.includes(file.type)) {
    return {
      isValid: false,
      error: 'Formato de video no soportado. Use MP4, WebM, OGG o MOV'
    };
  }

  if (isImage && !allowedImageFormats.includes(file.type)) {
    return {
      isValid: false,
      error: 'Formato de imagen no soportado. Use JPEG, PNG o WebP'
    };
  }

  // Advertencias por tamaño
  const warningThreshold = isVideo ? 10 * 1024 * 1024 : 2 * 1024 * 1024; // 10MB video, 2MB imagen
  if (file.size > warningThreshold) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    warnings.push(`Archivo grande (${sizeMB}MB). Se aplicará compresión automática.`);
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

// Validar nombre de archivo
export function validateFileName(fileName: string): ValidationResult {
  // Caracteres no permitidos
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/g;
  
  if (invalidChars.test(fileName)) {
    return {
      isValid: false,
      error: 'El nombre del archivo contiene caracteres no válidos'
    };
  }

  // Longitud máxima
  if (fileName.length > 255) {
    return {
      isValid: false,
      error: 'El nombre del archivo es demasiado largo'
    };
  }

  return { isValid: true };
}

// Validar extensión
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}