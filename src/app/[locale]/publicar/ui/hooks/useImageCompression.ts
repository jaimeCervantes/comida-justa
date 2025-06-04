import { useCallback, useState } from 'react';
import { compressImage } from '../utils/imageCompressor';
import { CompressionStats } from '../types/media.types';

export function useImageCompression() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<CompressionStats | null>(null);

  const compress = useCallback(async (file: File, quality: number = 0.8): Promise<File> => {
    setIsCompressing(true);
    setProgress(0);
    
    const startTime = Date.now();
    const originalSize = file.size;

    try {
      // Simular progreso para la UI
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const compressedFile = await compressImage(file, {
        quality,
        maxWidth: 1920,
        maxHeight: 1080
      });

      clearInterval(progressInterval);
      setProgress(100);

      const compressionTime = Date.now() - startTime;
      const savings = Math.round(((originalSize - compressedFile.size) / originalSize) * 100);

      setStats({
        originalSize,
        compressedSize: compressedFile.size,
        savings,
        compressionTime,
        method: 'canvas' // Cambia esto si usas otro método de compresión
      });

      return compressedFile;
    } finally {
      setIsCompressing(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, []);

  return {
    compress,
    isCompressing,
    progress,
    stats
  };
}