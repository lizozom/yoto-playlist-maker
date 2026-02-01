import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StageNavigationProps {
  onBack?: () => void;
  onContinue?: () => void;
  backLabel?: string;
  continueLabel?: string;
  continueDisabled?: boolean;
}

export function StageNavigation({
  onBack,
  onContinue,
  backLabel = 'Back',
  continueLabel = 'Continue',
  continueDisabled = false,
}: StageNavigationProps) {
  return (
    <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-700">
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {backLabel}
          </button>
        )}
      </div>
      <div>
        {onContinue && (
          <button
            onClick={onContinue}
            disabled={continueDisabled}
            className="btn btn-primary flex items-center gap-2"
          >
            {continueLabel}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
