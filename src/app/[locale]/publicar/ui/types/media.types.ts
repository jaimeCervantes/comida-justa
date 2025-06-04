export interface MediaFile {
  type: string;
  name: string;
  size: number;
  data: string; // base64
  thumbnail?: string;
  duration?: number; // para videos en segundos
  dimensions?: { 
    width: number; 
    height: number; 
    aspectRatio: number;
  };
  metadata?: {
    originalSize: number;
    compressionApplied: boolean;
    processingTime: number;
  };
}

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  savings: number; // porcentaje de ahorro
  compressionTime: number; // tiempo en ms
  method: 'ffmpeg' | 'canvas' | 'none';
}

export interface MediaUploaderOptions {
  maxVideoSize: number; // MB
  maxImageSize: number; // MB
  videoQuality: 'low' | 'medium' | 'high';
  imageQuality: number; // 0.1 - 1.0
  maxWidth: number;
  maxHeight: number;
  allowedVideoFormats?: string[];
  allowedImageFormats?: string[];
  generateThumbnails?: boolean;
  autoCompress?: boolean;
}

export interface UploadProgress {
  stage: 'validating' | 'compressing' | 'uploading' | 'complete' | 'error';
  progress: number; // 0-100
  message?: string;
}

export interface MediaProcessingResult {
  success: boolean;
  file?: MediaFile;
  stats?: CompressionStats;
  error?: string;
  warnings?: string[];
}

// Tipos para callbacks
export type OnProgressCallback = (progress: UploadProgress) => void;
export type OnCompleteCallback = (result: MediaProcessingResult) => void;
export type OnErrorCallback = (error: string) => void;

// Configuraciones predefinidas
export const COMPRESSION_PRESETS = {
  // Para avatares y fotos de perfil
  avatar: {
    maxVideoSize: 10,
    maxImageSize: 2,
    videoQuality: 'medium' as const,
    imageQuality: 0.85,
    maxWidth: 400,
    maxHeight: 400
  },
  
  // Para posts de comida (tu caso)
  foodPost: {
    maxVideoSize: 120,
    maxImageSize: 10,
    videoQuality: 'medium' as const,
    imageQuality: 0.8,
    maxWidth: 1080,
    maxHeight: 1080
  },
  
  // Para contenido de alta calidad
  highQuality: {
    maxVideoSize: 150,
    maxImageSize: 20,
    videoQuality: 'high' as const,
    imageQuality: 0.9,
    maxWidth: 1920,
    maxHeight: 1080
  }
} as const;