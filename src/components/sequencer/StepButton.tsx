import { memo } from 'react';

interface StepButtonProps {
  active: boolean;
  isCurrentStep: boolean;
  stepIndex: number;
  color: string;
  velocity: number;
  onToggle: () => void;
}

// Map velocity to visual opacity for active steps
function velocityToOpacity(velocity: number): number {
  if (velocity <= 26) return 0.4;
  if (velocity <= 52) return 0.6;
  if (velocity <= 78) return 0.8;
  if (velocity <= 104) return 0.9;
  return 1.0;
}

export const StepButton = memo(function StepButton({
  active,
  isCurrentStep,
  stepIndex,
  color,
  velocity,
  onToggle,
}: StepButtonProps) {
  // Highlight every 4th step for visual beat reference
  const isBeatStart = stepIndex % 4 === 0;

  return (
    <button
      className={`
        step-button
        w-11 h-11 min-w-[44px] min-h-[44px]
        rounded-md
        border-2
        transition-all duration-75
        ${active ? 'scale-95' : 'scale-100'}
        ${isCurrentStep ? 'ring-2 ring-[var(--color-step-current)] ring-offset-1 ring-offset-[var(--color-bg-primary)]' : ''}
        ${isBeatStart && !active ? 'border-[var(--color-bg-tertiary)]' : 'border-transparent'}
      `}
      style={{
        backgroundColor: active ? color : 'var(--color-step-inactive)',
        opacity: active ? velocityToOpacity(velocity) : isBeatStart ? 0.6 : 0.4,
      }}
      onClick={onToggle}
      aria-label={`Step ${stepIndex + 1}, ${active ? 'active' : 'inactive'}`}
      aria-pressed={active}
    />
  );
});
