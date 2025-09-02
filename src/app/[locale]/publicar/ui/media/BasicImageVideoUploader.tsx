"use client";
import { useCallback } from "react";
import { useMediaUploader } from "../hooks/useMediaUploader";
import { MediaFile } from "../types/media.types";

interface Props {
  label: string;
  name: string;
  onUploaded: (data: { media: MediaFile | null; isLoading: boolean; stats?: any } | null) => void;
  className?: string;
  accept: string;
  required?: boolean;
  maxVideoSize?: number;
  maxImageSize?: number;
}

export default function ImageVideoUploader({
  label,
  onUploaded,
  className = "",
  accept,
  required = false,
  maxVideoSize = 120,
  maxImageSize = 10
}: Props) {
  
  const { 
    processFile, 
    isProcessing, 
    progress, 
    error, 
    compressionStats,
    clearError 
  } = useMediaUploader({ 
    maxVideoSize, 
    maxImageSize 
  });

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearError();
    onUploaded({ media: null, isLoading: true });

    const result = await processFile(file);
    
    onUploaded({ 
      media: result, 
      isLoading: false,
      stats: compressionStats 
    });
  }, [processFile, onUploaded, compressionStats, clearError]);

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">
        {label}
      </label>
      
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        required={required}
        disabled={isProcessing}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
      />
      
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
      
      {isProcessing && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Optimizando archivo...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-1">
        Máximo: {maxVideoSize}MB videos, {maxImageSize}MB imágenes
      </p>
    </div>
  );
}