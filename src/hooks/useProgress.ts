import { useState, useCallback } from 'react';
import { ProgressStep } from '@/components/common/DetailedProgress';

export interface UseProgressReturn {
  steps: ProgressStep[];
  isVisible: boolean;
  currentStep: string | undefined;
  overallProgress: number;
  addStep: (id: string, name: string, details?: string) => void;
  startStep: (id: string, details?: string) => void;
  updateStep: (id: string, progress?: number, details?: string) => void;
  completeStep: (id: string, details?: string) => void;
  errorStep: (id: string, details?: string) => void;
  reset: () => void;
  show: () => void;
  hide: () => void;
}

export const useProgress = (): UseProgressReturn => {
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | undefined>();

  const addStep = useCallback((id: string, name: string, details?: string) => {
    setSteps(prev => [...prev, {
      id,
      name,
      status: 'pending',
      details
    }]);
  }, []);

  const startStep = useCallback((id: string, details?: string) => {
    setCurrentStep(id);
    setSteps(prev => prev.map(step => 
      step.id === id 
        ? { ...step, status: 'running' as const, startTime: Date.now(), details: details || step.details }
        : step
    ));
  }, []);

  const updateStep = useCallback((id: string, progress?: number, details?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === id 
        ? { ...step, progress, details: details || step.details }
        : step
    ));
  }, []);

  const completeStep = useCallback((id: string, details?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === id 
        ? { ...step, status: 'completed' as const, endTime: Date.now(), progress: 100, details: details || step.details }
        : step
    ));
  }, []);

  const errorStep = useCallback((id: string, details?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === id 
        ? { ...step, status: 'error' as const, endTime: Date.now(), details: details || step.details }
        : step
    ));
  }, []);

  const reset = useCallback(() => {
    setSteps([]);
    setCurrentStep(undefined);
    setIsVisible(false);
  }, []);

  const show = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const totalSteps = steps.length;
  const overallProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return {
    steps,
    isVisible,
    currentStep,
    overallProgress,
    addStep,
    startStep,
    updateStep,
    completeStep,
    errorStep,
    reset,
    show,
    hide
  };
};