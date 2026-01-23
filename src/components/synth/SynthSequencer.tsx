import { memo, useCallback } from 'react';
import { useSynthStore, midiNoteToName, useTransportStore } from '../../store';
import { useAudioEngine } from '../../hooks/useAudioEngine';

interface SynthSequencerProps {
  synthIndex: number;
}

// Piano roll notes (2 octaves)
const NOTES = [
  72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 49, 48,
]; // C5 down to C3

// Map velocity to visual opacity
function velocityToOpacity(velocity: number): number {
  if (velocity <= 26) return 0.4;
  if (velocity <= 52) return 0.6;
  if (velocity <= 78) return 0.8;
  if (velocity <= 104) return 0.9;
  return 1.0;
}

export const SynthSequencer = memo(function SynthSequencer({ synthIndex }: SynthSequencerProps) {
  const { patterns, currentSynthPatternIndex, cycleNote } = useSynthStore();
  const { currentStep, state } = useTransportStore();
  const { initialize } = useAudioEngine();
  const patIdx = currentSynthPatternIndex[synthIndex];
  const pattern = patterns[synthIndex][patIdx];
  const isPlaying = state === 'playing';

  const handleCellClick = useCallback(
    async (stepIndex: number, note: number) => {
      await initialize();
      cycleNote(synthIndex, stepIndex, note);
    },
    [synthIndex, cycleNote, initialize]
  );

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Step numbers header */}
        <div className="flex">
          <div className="w-12 min-w-[48px]" /> {/* Spacer for note labels */}
          <div className="flex">
            {Array.from({ length: 16 }, (_, i) => (
              <div
                key={i}
                className={`w-8 min-w-[32px] text-center text-xs font-mono ${
                  i % 4 === 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
                } ${isPlaying && currentStep === i ? 'text-[var(--color-accent)] font-bold' : ''}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Piano roll grid */}
        <div className="flex flex-col">
          {NOTES.map((note) => {
            const noteName = midiNoteToName(note);
            const isBlackKey = noteName.includes('#');

            return (
              <div key={note} className="flex">
                {/* Note label */}
                <div
                  className={`w-12 min-w-[48px] h-5 flex items-center justify-end pr-1 text-xs font-mono ${
                    isBlackKey
                      ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]'
                  }`}
                >
                  {noteName}
                </div>

                {/* Step cells */}
                <div className="flex">
                  {Array.from({ length: 16 }, (_, stepIndex) => {
                    const stepData = pattern.steps[stepIndex];
                    const notes = stepData.notes || [];
                    const isActive = notes.includes(note);
                    const isBeatStart = stepIndex % 4 === 0;
                    const isCurrentStep = isPlaying && currentStep === stepIndex;

                    return (
                      <button
                        key={stepIndex}
                        onClick={() => handleCellClick(stepIndex, note)}
                        className={`w-8 min-w-[32px] h-5 border-r border-b transition-colors ${
                          isBlackKey ? 'border-[var(--color-bg-tertiary)]' : 'border-[var(--color-bg-primary)]'
                        } ${
                          isActive
                            ? 'bg-[var(--color-accent)]'
                            : isBeatStart
                            ? isBlackKey
                              ? 'bg-[var(--color-bg-primary)]'
                              : 'bg-[var(--color-bg-tertiary)]'
                            : isBlackKey
                            ? 'bg-[var(--color-bg-primary)] bg-opacity-50'
                            : 'bg-[var(--color-bg-secondary)]'
                        } ${isCurrentStep ? 'ring-1 ring-inset ring-[var(--color-step-current)]' : ''} hover:bg-[var(--color-accent)] hover:bg-opacity-30`}
                        style={isActive ? { opacity: velocityToOpacity(stepData.velocity) } : undefined}
                        aria-label={`Step ${stepIndex + 1}, Note ${noteName}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
