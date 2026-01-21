import { memo, useCallback } from 'react';
import { usePatternStore } from '../../store';

export const PatternSelector = memo(function PatternSelector() {
  const { patterns, currentPatternId, setCurrentPattern } = usePatternStore();

  const handlePatternSelect = useCallback(
    (patternId: string) => {
      setCurrentPattern(patternId);
    },
    [setCurrentPattern]
  );

  // Check if a pattern has any active steps
  const hasContent = (patternId: string) => {
    const pattern = patterns.find((p) => p.id === patternId);
    if (!pattern) return false;
    return pattern.tracks.some((track) => track.steps.some((step) => step.active));
  };

  return (
    <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl">
      <h3 className="text-sm text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
        Patterns
      </h3>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {patterns.map((pattern, index) => {
          const isSelected = pattern.id === currentPatternId;
          const hasData = hasContent(pattern.id);

          return (
            <button
              key={pattern.id}
              onClick={() => handlePatternSelect(pattern.id)}
              className={`
                w-full aspect-square
                rounded-lg
                text-sm font-bold
                transition-all duration-100
                ${
                  isSelected
                    ? 'bg-[var(--color-accent)] text-white scale-95'
                    : hasData
                    ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:bg-opacity-50'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                }
              `}
              aria-label={`Pattern ${index + 1}${isSelected ? ', selected' : ''}${hasData ? ', has content' : ''}`}
              aria-pressed={isSelected}
            >
              {index + 1}
              {hasData && !isSelected && (
                <span className="block w-1.5 h-1.5 mx-auto mt-1 rounded-full bg-[var(--color-accent)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
