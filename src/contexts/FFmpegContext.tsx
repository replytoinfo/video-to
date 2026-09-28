import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { createFFmpegInstance } from '../utils/ffmpegUtils';
import { useLanguage } from './LanguageContext';

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
  const { t } = useLanguage();
  // Читаем t через ref, чтобы смена языка не пересоздавала loadFFmpeg
  // (иначе useEffect с deps [loadFFmpeg] перезапускал бы загрузку FFmpeg).
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  const [ffmpeg, setFfmpeg] = useState<any>(null);
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const [isFFmpegLoading, setIsFFmpegLoading] = useState(false);
  const [ffmpegLoadingError, setFfmpegLoadingError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [, setIsTabActive] = useState(true);

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
        toast.success(tRef.current('ffmpegLoadedSafariMode'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ FFmpeg loading failed:', errorMessage, error);

      // Обработка различных типов ошибок
      if (errorMessage.includes('Safari compatibility issue')) {
        // Это наше специальное сообщение для Safari
        setFfmpegLoadingError(errorMessage);
        toast.error(tRef.current('safariCompatibilityRecommendChrome'), {
          duration: 10000,
          action: {
            label: tRef.current('learnMoreAction'),
            onClick: () => console.log('Show Safari compatibility info')
          }
        });
      } else if (errorMessage.includes('blob') || errorMessage.includes('webkit') || errorMessage.includes('resource')) {
        // Устаревшая blob ошибка (не должна появляться с новой логикой)
        console.warn('🍎 Legacy WebKit blob resource error detected');
        setFfmpegLoadingError(tRef.current('webkitBlobResourceIssue'));
        toast.error(tRef.current('safariCompatibilityRecommendChrome'));
      } else if (errorMessage.includes('Safari') && errorMessage.includes('too old')) {
        setFfmpegLoadingError(errorMessage);
        toast.error(tRef.current('updateSafariVersionMessage'));
      } else if (errorMessage.includes('SharedArrayBuffer')) {
        setFfmpegLoadingError(tRef.current('sharedArrayBufferNotSupportedShort'));
        toast.error(tRef.current('browserCompatibilityIssueRetry'));
      } else if (errorMessage.includes('FFmpeg loading timeout')) {
        setFfmpegLoadingError(tRef.current('ffmpegLoadingTimeoutDetailed'));
        toast.error(tRef.current('ffmpegLoadingTimeoutCheckConnection'));
      } else {
        setFfmpegLoadingError(errorMessage);
        toast.error(tRef.current('ffmpegLoadingFailedRefreshPage'));
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
      setFfmpegLoadingError(tRef.current('sharedArrayBufferNotSupportedFull'));
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
            } catch {
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
