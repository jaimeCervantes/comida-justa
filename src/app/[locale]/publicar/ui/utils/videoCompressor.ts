import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface VideoCompressionOptions {
  quality?: 'low' | 'medium' | 'high';
  maxWidth?: number;
  maxHeight?: number;
  maxBitrate?: string;
  onProgress?: (progress: number) => void;
}

let ffmpegInstance: FFmpeg | null = null;
let isFFmpegLoaded = false;

export async function initializeFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && isFFmpegLoaded) {
    return ffmpegInstance;
  }

  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
  }

  if (!isFFmpegLoaded) {
    // Cargar FFmpeg core desde CDN
    await ffmpegInstance.load({
      coreURL: await toBlobURL(`https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm`, 'application/wasm'),
    });
    isFFmpegLoaded = true;
  }

  return ffmpegInstance;
}

export async function compressVideo(
  file: File, 
  options: VideoCompressionOptions = {}
): Promise<File> {
  const {
    quality = 'medium',
    maxWidth = 640,
    maxHeight = 640,
    maxBitrate = '700k',
    onProgress
  } = options;

  const ffmpeg = await initializeFFmpeg();
  
  // Configurar listener de progreso
  if (onProgress) {
    ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`;
  const outputName = `output_${Date.now()}.mp4`;

  try {
    // Escribir archivo de entrada
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Configurar parámetros según calidad
    const qualitySettings = {
      low: { crf: '32', preset: 'superfast' },
      medium: { crf: '30', preset: 'veryfast' },
      high: { crf: '26', preset: 'fast' }
    };

    const settings = qualitySettings[quality];

    // Argumentos de compresión optimizados para web
    const args = [
      '-i', inputName,
      '-c:v', 'libx264',                    // Codec H.264
      '-preset', settings.preset,           // Velocidad de encoding
      '-crf', settings.crf,                 // Factor de calidad
      '-maxrate', maxBitrate,               // Bitrate máximo
      '-bufsize', '1M',                     // Buffer size
      '-vf', `scale=${maxWidth}:${maxHeight}:force_original_aspect_ratio=decrease`, // Escalar manteniendo aspecto
      '-c:a', 'aac',                        // Codec audio
      '-b:a', '128k',                       // Bitrate audio
      '-movflags', '+faststart',            // Optimización para streaming
      '-f', 'mp4',                          // Formato salida
      '-y',                                 // Sobrescribir archivo existente
      outputName
    ];

    await ffmpeg.exec(args);

    // Leer archivo comprimido
    const data = await ffmpeg.readFile(outputName);
    // Convertir FileData a Uint8Array con un ArrayBuffer compatible
    const uint8Data = new Uint8Array(Uint8Array.from(data as any).buffer);
    const compressedBlob = new Blob([uint8Data], { type: 'video/mp4' });


     return new File([compressedBlob], file.name, {
      type: 'video/mp4',
      lastModified: Date.now()
    });


  } finally {
    // Limpiar archivos temporales
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (error) {
      console.warn('Error limpiando archivos temporales:', error);
    }
  }
}

// Función para obtener metadatos del video
export async function getVideoMetadata(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
  size: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size
      });
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => {
      reject(new Error('Error cargando metadatos del video'));
      URL.revokeObjectURL(video.src);
    };
    
    video.src = URL.createObjectURL(file);
  });
}