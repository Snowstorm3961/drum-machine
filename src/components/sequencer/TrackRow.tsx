import { memo, useCallback } from 'react';
import { StepButton } from './StepButton';
import type { Step, DrumSound } from '../../types';
import { usePatternStore, useTransportStore } from '../../store';
import { useAudioEngine } from '../../hooks/useAudioEngine';

interface TrackRowProps {
  sound: DrumSound;
  steps: Step[];
}

export const TrackRow = memo(function TrackRow({ sound, steps }: TrackRowProps) {
  const { toggleStep } = usePatternStore();
  const { currentStep, state } = useTransportStore();
  const { triggerDrum, initialize } = useAudioEngine();

  const handleToggle = useCallback(
    async (stepIndex: number) => {
      await initialize();
      toggleStep(sound.id, stepIndex);
      // Play sound when activating a step
      if (!steps[stepIndex].active) {
        triggerDrum(sound.id, steps[stepIndex].velocity);
      }
    },
    [sound.id, steps, toggleStep, triggerDrum, initialize]
  );

  const handlePadHit = useCallback(async () => {
    await initialize();
    triggerDrum(sound.id, 100);
  }, [sound.id, triggerDrum, initialize]);

  const isPlaying = state === 'playing';

  return (
    <div className="flex items-center gap-2 py-1">
      {/* Drum pad / label */}
      <button
        className="w-14 h-11 min-w-[56px] rounded-md text-xs font-bold uppercase tracking-wide flex items-center justify-center transition-transform active:scale-95"
        style={{ backgroundColor: sound.color }}
        onClick={handlePadHit}
        aria-label={`Play ${sound.name}`}
      >
        {sound.shortName}
      </button>

      {/* Step buttons */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {steps.map((step, index) => (
          <StepButton
            key={index}
            active={step.active}
            isCurrentStep={isPlaying && currentStep === index}
            stepIndex={index}
            color={sound.color}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </div>
    </div>
  );
});
