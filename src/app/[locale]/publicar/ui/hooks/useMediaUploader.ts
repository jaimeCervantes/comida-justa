import { useCallback, useState } from 'react';
import { useVideoCompression } from './useVideoCompression';
import { useImageCompression } from '../hooks/useImageCompression';
import { MediaFile, MediaUploaderOptions } from '../types/media.types';
import { validateMediaFile } from '../utils/mediaValidation';

const defaultOptions: MediaUploaderOptions = {
  maxVideoSize: 120,
  maxImageSize: 10,
  videoQuality: 'medium',
  imageQuality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080
};

export function useMediaUploader(options: Partial<MediaUploaderOptions> = {}) {
  const finalOptions = { ...defaultOptions, ...options };
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoCompression = useVideoCompression();
  const imageCompression = useImageCompression();

  const processFile = useCallback(async (file: File): Promise<MediaFile | null> => {
    setError(null);
    setIsProcessing(true);

    try {
      // Validar archivo
      const validation = validateMediaFile(file, finalOptions);
      if (!validation.isValid) {
        setError(validation.error!);
        return null;
      }

      let processedFile = file;
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      // Comprimir según el tipo
      if (isVideo && file.size > finalOptions.maxVideoSize * 1024 * 1024) {
        processedFile = await videoCompression.compress(file);
      } else if (isImage && file.size > finalOptions.maxImageSize * 1024 * 1024) {
        processedFile = await imageCompression.compress(file);
      }

      // Convertir a MediaFile
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            type: processedFile.type,
            name: processedFile.name,
            size: processedFile.size,
            data: processedFile,
          });
        };
        reader.readAsDataURL(processedFile);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando archivo');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [finalOptions, videoCompression, imageCompression]);

  return {
    processFile,
    isProcessing: isProcessing || videoCompression.isCompressing || imageCompression.isCompressing,
    progress: videoCompression.progress || imageCompression.progress,
    error,
    compressionStats: videoCompression.stats || imageCompression.stats,
    clearError: () => setError(null)
  };
}
