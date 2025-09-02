import { useCallback, useRef, useState } from 'react';
import { compressVideo } from '../utils/videoCompressor';
import { CompressionStats } from '../types/media.types';

export function useVideoCompression() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<CompressionStats | null>(null);

  const compress = useCallback(async (file: File): Promise<File> => {
    setIsCompressing(true);
    setProgress(0);
    
    const startTime = Date.now();
    const originalSize = file.size;

    try {
      const compressedFile = await compressVideo(file, {
        onProgress: setProgress,
        quality: 'medium'
      });

      const compressionTime = Date.now() - startTime;
      const savings = Math.round(((originalSize - compressedFile.size) / originalSize) * 100);

      setStats({
        originalSize,
        compressedSize: compressedFile.size,
        savings,
        compressionTime,
        method: 'ffmpeg' // or 'canvas' or 'none', depending on your implementation
      });

      return compressedFile;
    } finally {
      setIsCompressing(false);
      setProgress(0);
    }
  }, []);

  return {
    compress,
    isCompressing,
    progress,
    stats
  };
}