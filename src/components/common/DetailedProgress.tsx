import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

export interface ProgressStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress?: number;
  details?: string;
  startTime?: number;
  endTime?: number;
}

interface DetailedProgressProps {
  title: string;
  steps: ProgressStep[];
  currentStep?: string;
  overallProgress?: number;
  isVisible: boolean;
}

const DetailedProgress: React.FC<DetailedProgressProps> = ({
  title,
  steps,
  // currentStep, // TODO: Use for step highlighting
  overallProgress,
  isVisible
}) => {
  if (!isVisible) return null;

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepDuration = (step: ProgressStep) => {
    if (step.startTime) {
      const endTime = step.endTime || Date.now();
      const duration = (endTime - step.startTime) / 1000;
      return `${duration.toFixed(1)}s`;
    }
    return '';
  };

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const totalSteps = steps.length;
  const calculatedProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const displayProgress = overallProgress !== undefined ? overallProgress : calculatedProgress;

  return (
    <Card className="w-full mt-4 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedSteps}/{totalSteps} steps
          </span>
        </CardTitle>
        <Progress 
          value={displayProgress} 
          className="h-2 mt-2"
        />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                step.status === 'running' 
                  ? 'bg-blue-100 border border-blue-200' 
                  : step.status === 'completed'
                  ? 'bg-green-50 border border-green-200'
                  : step.status === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-gray-50'
              }`}
            >
              {getStepIcon(step)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${
                    step.status === 'running' ? 'text-blue-700' : 
                    step.status === 'completed' ? 'text-green-700' :
                    step.status === 'error' ? 'text-red-700' : 'text-gray-700'
                  }`}>
                    {step.name}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {getStepDuration(step)}
                  </span>
                </div>
                
                {step.details && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.details}
                  </p>
                )}
                
                {step.status === 'running' && step.progress !== undefined && (
                  <Progress 
                    value={step.progress} 
                    className="h-1 mt-2"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DetailedProgress;