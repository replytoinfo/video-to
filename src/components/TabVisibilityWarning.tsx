import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const TabVisibilityWarning: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsVisible(false);
        setShowWarning(true);
      } else {
        setIsVisible(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (!showWarning || isVisible) return null;

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <strong>Важно:</strong> При переключении на другие вкладки обработка видео может приостановиться. 
        Для стабильной работы оставайтесь на этой вкладке во время конвертации.
      </AlertDescription>
    </Alert>
  );
};