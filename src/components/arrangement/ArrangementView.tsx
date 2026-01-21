import { memo, useCallback } from 'react';
import { useArrangementStore, usePatternStore } from '../../store';
import { Button } from '../ui/Button';

export const ArrangementView = memo(function ArrangementView() {
  const {
    arrangements,
    currentArrangementId,
    mode,
    setMode,
    createArrangement,
    setCurrentArrangement,
    addPatternToArrangement,
    removePatternFromArrangement,
    getCurrentArrangement,
  } = useArrangementStore();

  const { patterns } = usePatternStore();

  const currentArrangement = getCurrentArrangement();

  const handleCreateArrangement = useCallback(() => {
    createArrangement(`Song ${arrangements.length + 1}`);
  }, [arrangements.length, createArrangement]);

  const handleAddPattern = useCallback(
    (patternId: string) => {
      if (currentArrangementId) {
        addPatternToArrangement(currentArrangementId, patternId);
      }
    },
    [currentArrangementId, addPatternToArrangement]
  );

  const handleRemovePattern = useCallback(
    (position: number) => {
      if (currentArrangementId) {
        removePatternFromArrangement(currentArrangementId, position);
      }
    },
    [currentArrangementId, removePatternFromArrangement]
  );

  return (
    <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm text-[var(--color-text-secondary)] uppercase tracking-wide">
          Arrangement
        </h3>
        <div className="flex gap-2">
          <Button
            variant={mode === 'pattern' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setMode('pattern')}
          >
            Pattern
          </Button>
          <Button
            variant={mode === 'arrangement' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setMode('arrangement')}
          >
            Song
          </Button>
        </div>
      </div>

      {mode === 'arrangement' && (
        <div className="space-y-4">
          {/* Arrangement selector */}
          <div className="flex flex-wrap gap-2">
            {arrangements.map((arr) => (
              <Button
                key={arr.id}
                variant={arr.id === currentArrangementId ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setCurrentArrangement(arr.id)}
              >
                {arr.name}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={handleCreateArrangement}>
              + New
            </Button>
          </div>

          {/* Current arrangement timeline */}
          {currentArrangement && (
            <div className="space-y-2">
              <div className="text-xs text-[var(--color-text-secondary)]">
                Timeline (click pattern to add):
              </div>

              {/* Pattern palette */}
              <div className="flex flex-wrap gap-1">
                {patterns.slice(0, 8).map((pattern, index) => (
                  <button
                    key={pattern.id}
                    onClick={() => handleAddPattern(pattern.id)}
                    className="w-8 h-8 rounded text-xs font-bold bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-accent)] transition-colors"
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Sequence display */}
              <div className="flex flex-wrap gap-1 min-h-[40px] p-2 bg-[var(--color-bg-primary)] rounded-lg">
                {currentArrangement.sequence.length === 0 ? (
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Click patterns above to build your song
                  </span>
                ) : (
                  currentArrangement.sequence.map((patternId, position) => {
                    const pattern = patterns.find((p) => p.id === patternId);
                    const patternNum = patterns.findIndex((p) => p.id === patternId) + 1;
                    return (
                      <button
                        key={`${patternId}-${position}`}
                        onClick={() => handleRemovePattern(position)}
                        className="w-8 h-8 rounded text-xs font-bold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors"
                        title={`${pattern?.name || patternId} - Click to remove`}
                      >
                        {patternNum}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'pattern' && (
        <div className="text-sm text-[var(--color-text-secondary)]">
          Pattern mode: Edit patterns using the sequencer grid below
        </div>
      )}
    </div>
  );
});
