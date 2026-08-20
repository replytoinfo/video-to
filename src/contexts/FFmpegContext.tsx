import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { createFFmpegInstance } from '../utils/ffmpegUtils';

interface FFmpegContextType {
  ffmpeg: any;
  isFFmpegLoaded: boolean;
  isFFmpegLoading: boolean;
  ffmpegLoadingError: string | null;
  loadFFmpeg: () => Promise<void>;
  loadingProgress: number;
}

const FFmpegContext = createContext<FFmpegContextType | undefined>(undefined);

export const useFFmpeg = () => {
  const context = useContext(FFmpegContext);
  if (!context) {
    throw new Error('useFFmpeg must be used within an FFmpegProvider');
  }
  return context;
};

interface FFmpegProviderProps {
  children: React.ReactNode;
}

// Кэш для FFmpeg инстанса
let ffmpegInstanceCache: any = null;
let ffmpegLoadingPromise: Promise<any> | null = null;

export const FFmpegProvider: React.FC<FFmpegProviderProps> = ({ children }) => {
  const [ffmpeg, setFfmpeg] = useState<any>(null);
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const [isFFmpegLoading, setIsFFmpegLoading] = useState(false);
  const [ffmpegLoadingError, setFfmpegLoadingError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isTabActive, setIsTabActive] = useState(true);

  // Мемоизированная функция загрузки FFmpeg
  const loadFFmpeg = useCallback(async () => {
    // Если уже загружается, возвращаем существующий промис
    if (ffmpegLoadingPromise) {
      return ffmpegLoadingPromise;
    }

    // Если уже загружен, возвращаем кэшированный инстанс
    if (ffmpegInstanceCache) {
      setFfmpeg(ffmpegInstanceCache);
      setIsFFmpegLoaded(true);
      return;
    }

    setIsFFmpegLoading(true);
    setFfmpegLoadingError(null);
    setLoadingProgress(0);

    try {
      console.log('🚀 Starting FFmpeg loading process...');
      
      // Создаем промис для загрузки с обновленной логикой
      ffmpegLoadingPromise = createFFmpegInstance();
      
      const ffmpegInstance = await ffmpegLoadingPromise;
      
      // Кэшируем инстанс
      ffmpegInstanceCache = ffmpegInstance;
      
      setFfmpeg(ffmpegInstance);
      setIsFFmpegLoaded(true);
      setLoadingProgress(100);
      
      console.log('✅ FFmpeg loaded successfully');
      
      // Показываем успешное уведомление только для Safari пользователей
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      if (isSafari) {
        toast.success('FFmpeg loaded successfully! Safari compatibility mode active.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ FFmpeg loading failed:', errorMessage, error);
      
      // Обработка различных типов ошибок
      if (errorMessage.includes('Safari compatibility issue')) {
        // Это наше специальное сообщение для Safari
        setFfmpegLoadingError(errorMessage);
        toast.error('Safari compatibility issue detected. We recommend using Chrome or Firefox for video processing.', {
          duration: 10000,
          action: {
            label: 'Learn More',
            onClick: () => console.log('Show Safari compatibility info')
          }
        });
      } else if (errorMessage.includes('blob') || errorMessage.includes('webkit') || errorMessage.includes('resource')) {
        // Устаревшая blob ошибка (не должна появляться с новой логикой)
        console.warn('🍎 Legacy WebKit blob resource error detected');
        setFfmpegLoadingError('WebKit blob resource issue. This is a known Safari limitation. Please try using Chrome or Firefox for the best experience.');
        toast.error('Safari compatibility issue detected. We recommend using Chrome or Firefox for video processing.');
      } else if (errorMessage.includes('Safari') && errorMessage.includes('too old')) {
        setFfmpegLoadingError(errorMessage);
        toast.error('Please update Safari to version 14+ or use Chrome/Firefox.');
      } else if (errorMessage.includes('SharedArrayBuffer')) {
        setFfmpegLoadingError('SharedArrayBuffer not supported. Please enable cross-origin isolation or use a different browser.');
        toast.error('Browser compatibility issue. Please try Chrome or Firefox.');
      } else if (errorMessage.includes('FFmpeg loading timeout')) {
        setFfmpegLoadingError('FFmpeg loading timeout. This may be due to slow internet connection or browser limitations.');
        toast.error('Loading timeout. Please check your internet connection and try again.');
      } else {
        setFfmpegLoadingError(errorMessage);
        toast.error('FFmpeg loading failed. Please try refreshing the page.');
      }
    } finally {
      setIsFFmpegLoading(false);
      ffmpegLoadingPromise = null;
    }
  }, []);

  // Автоматическая загрузка при монтировании компонента
  useEffect(() => {
    // Проверяем поддержку SharedArrayBuffer
    if (typeof SharedArrayBuffer === 'undefined') {
      setFfmpegLoadingError('SharedArrayBuffer is not supported in this browser. Please use a modern browser with cross-origin isolation enabled.');
      return;
    }

    // Загружаем FFmpeg автоматически
    loadFFmpeg();
  }, [loadFFmpeg]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabActive(isVisible);
      
      // If tab becomes visible and FFmpeg was loaded but might be broken
      if (isVisible && isFFmpegLoaded && !isFFmpegLoading) {
        // Test FFmpeg instance after tab switch
        setTimeout(() => {
          if (ffmpeg) {
            try {
              // Simple test to see if FFmpeg is still responsive
              ffmpeg.FS('writeFile', 'test.txt', new Uint8Array([1]));
              ffmpeg.FS('unlink', 'test.txt');
            } catch (error) {
              // FFmpeg is broken, reload it
              console.warn('FFmpeg broke after tab switch, reloading...');
              setIsFFmpegLoaded(false);
              setFfmpeg(null);
              loadFFmpeg();
            }
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isFFmpegLoaded, isFFmpegLoading, ffmpeg, loadFFmpeg]);

  // Мемоизированное значение контекста
  const contextValue = useMemo(() => ({
    ffmpeg,
    isFFmpegLoaded,
    isFFmpegLoading,
    ffmpegLoadingError,
    loadFFmpeg,
    loadingProgress
  }), [ffmpeg, isFFmpegLoaded, isFFmpegLoading, ffmpegLoadingError, loadFFmpeg, loadingProgress]);

  return (
    <FFmpegContext.Provider value={contextValue}>
      {children}
    </FFmpegContext.Provider>
  );
};
