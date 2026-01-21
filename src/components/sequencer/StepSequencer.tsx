import { memo, useCallback } from 'react';
import { StepButton } from './StepButton';
import { usePatternStore, useTransportStore } from '../../store';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { DRUM_SOUNDS } from '../../data/drumKit';

export const StepSequencer = memo(function StepSequencer() {
  const { getCurrentPattern, toggleStep } = usePatternStore();
  const { currentStep, state } = useTransportStore();
  const { triggerDrum, initialize } = useAudioEngine();
  const pattern = getCurrentPattern();
  const isPlaying = state === 'playing';

  const handleToggle = useCallback(
    async (drumId: string, stepIndex: number, isActive: boolean, velocity: number) => {
      await initialize();
      toggleStep(drumId, stepIndex);
      if (!isActive) {
        triggerDrum(drumId, velocity);
      }
    },
    [toggleStep, triggerDrum, initialize]
  );

  const handlePadHit = useCallback(
    async (drumId: string) => {
      await initialize();
      triggerDrum(drumId, 100);
    },
    [triggerDrum, initialize]
  );

  if (!pattern) {
    return <div className="text-[var(--color-text-secondary)]">No pattern selected</div>;
  }

  return (
    <div className="flex p-4 bg-[var(--color-bg-secondary)] rounded-xl">
      {/* Fixed drum pads column */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        {/* Spacer for header */}
        <div className="h-6 mb-2" />
        {/* Drum pads */}
        {DRUM_SOUNDS.map((sound) => (
          <button
            key={sound.id}
            className="w-14 h-11 min-w-[56px] rounded-md text-xs font-bold uppercase tracking-wide flex items-center justify-center transition-transform active:scale-95"
            style={{ backgroundColor: sound.color }}
            onClick={() => handlePadHit(sound.id)}
            aria-label={`Play ${sound.name}`}
          >
            {sound.shortName}
          </button>
        ))}
      </div>

      {/* Scrollable steps container */}
      <div className="flex flex-col gap-1 ml-2 overflow-x-auto">
        {/* Step numbers header */}
        <div className="flex gap-1 mb-2">
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className={`w-11 min-w-[44px] h-6 flex items-center justify-center text-xs font-mono ${
                i % 4 === 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
              } ${isPlaying && currentStep === i ? 'text-[var(--color-accent)] font-bold' : ''}`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Step rows - all in the same scrollable container */}
        {DRUM_SOUNDS.map((sound) => {
          const track = pattern.tracks.find((t) => t.trackId === sound.id);
          if (!track) return null;
          return (
            <div key={sound.id} className="flex gap-1">
              {track.steps.map((step, index) => (
                <StepButton
                  key={index}
                  active={step.active}
                  isCurrentStep={isPlaying && currentStep === index}
                  stepIndex={index}
                  color={sound.color}
                  onToggle={() => handleToggle(sound.id, index, step.active, step.velocity)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
});
