import { memo, useCallback } from 'react';
import { useSequenceStore, type InstrumentId } from '../../store/sequenceStore';
import { useTransportStore } from '../../store';

interface SequenceBuilderProps {
  instrumentId: InstrumentId;
}

export const SequenceBuilder = memo(function SequenceBuilder({ instrumentId }: SequenceBuilderProps) {
  const sequences = useSequenceStore((s) => s.sequences[instrumentId]);
  const activeSequenceId = useSequenceStore((s) => s.activeSequenceIds[instrumentId]);
  const cuedSequenceId = useSequenceStore((s) => s.cuedSequenceIds[instrumentId]);
  const sequencePosition = useSequenceStore((s) => s.sequencePositions[instrumentId]);
  const { createSequence, deleteSequence, addPatternToSequence, removePatternFromSequence, setActiveSequence, setCuedSequence } =
    useSequenceStore();
  const transportState = useTransportStore((s) => s.state);

  const activeSequence = sequences.find((s) => s.id === activeSequenceId);

  const handleCreate = useCallback(() => {
    const id = createSequence(instrumentId, `Sequence ${sequences.length + 1}`);
    setActiveSequence(instrumentId, id);
  }, [instrumentId, sequences.length, createSequence, setActiveSequence]);

  const handleAddPattern = useCallback(
    (patternIndex: number) => {
      if (!activeSequenceId) return;
      addPatternToSequence(instrumentId, activeSequenceId, patternIndex);
    },
    [instrumentId, activeSequenceId, addPatternToSequence]
  );

  const handleRemovePattern = useCallback(
    (position: number) => {
      if (!activeSequenceId) return;
      removePatternFromSequence(instrumentId, activeSequenceId, position);
    },
    [instrumentId, activeSequenceId, removePatternFromSequence]
  );

  return (
    <div className="p-3 bg-[var(--color-bg-secondary)] rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Sequence</span>
        <button
          onClick={handleCreate}
          className="px-2 py-0.5 text-xs rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          + New
        </button>
      </div>

      {/* Sequence list */}
      {sequences.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {sequences.map((seq) => (
            <button
              key={seq.id}
              onClick={() => {
                if (activeSequenceId === seq.id) return;
                if (transportState === 'playing') {
                  // While playing, always cue - starts at next bar boundary
                  setCuedSequence(instrumentId, seq.id);
                } else {
                  // When stopped, activate immediately
                  setActiveSequence(instrumentId, seq.id);
                }
              }}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                activeSequenceId === seq.id
                  ? 'bg-[var(--color-accent)] text-white'
                  : cuedSequenceId === seq.id
                  ? 'bg-[var(--color-accent)] bg-opacity-50 text-white'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {seq.name}
            </button>
          ))}
        </div>
      )}

      {/* Active sequence timeline */}
      {activeSequence && (
        <div className="mb-2">
          <div className="flex gap-1 flex-wrap items-center">
            {activeSequence.patternIds.map((patId, pos) => (
              <button
                key={pos}
                onClick={() => handleRemovePattern(pos)}
                className={`w-7 h-7 rounded text-xs font-bold flex items-center justify-center transition-colors ${
                  pos === sequencePosition
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-red-500 hover:bg-opacity-50'
                }`}
                title={`Pattern ${patId + 1} (click to remove)`}
              >
                {patId + 1}
              </button>
            ))}
            {activeSequence.patternIds.length === 0 && (
              <span className="text-xs text-[var(--color-text-secondary)]">Add patterns below</span>
            )}
          </div>
        </div>
      )}

      {/* Pattern palette (add patterns to sequence) */}
      {activeSequenceId && (
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 16 }, (_, i) => (
            <button
              key={i}
              onClick={() => handleAddPattern(i)}
              className="w-6 h-6 rounded text-[10px] font-bold bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
              title={`Add pattern ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Delete active sequence */}
      {activeSequenceId && (
        <button
          onClick={() => deleteSequence(instrumentId, activeSequenceId)}
          className="mt-2 px-2 py-0.5 text-xs rounded text-red-400 hover:text-red-300 hover:bg-red-500 hover:bg-opacity-20"
        >
          Delete Sequence
        </button>
      )}
    </div>
  );
});
