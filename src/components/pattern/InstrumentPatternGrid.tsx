import { memo } from 'react';

interface InstrumentPatternGridProps {
  selectedIndex: number;
  hasContent: (index: number) => boolean;
  onSelectPattern: (index: number) => void;
  onCopy?: () => void;
  onPaste?: () => void;
  canPaste?: boolean;
  mode: 'pattern' | 'sequence';
  onModeChange: (mode: 'pattern' | 'sequence') => void;
  label?: string;
}

export const InstrumentPatternGrid = memo(function InstrumentPatternGrid({
  selectedIndex,
  hasContent,
  onSelectPattern,
  onCopy,
  onPaste,
  canPaste,
  mode,
  onModeChange,
  label,
}: InstrumentPatternGridProps) {
  return (
    <div className="p-3 bg-[var(--color-bg-secondary)] rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {label && (
            <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">{label}</span>
          )}
          {onCopy && (
            <button
              onClick={onCopy}
              className="px-2 py-0.5 text-xs rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              title="Copy pattern"
            >
              Copy
            </button>
          )}
          {onPaste && (
            <button
              onClick={onPaste}
              disabled={!canPaste}
              className="px-2 py-0.5 text-xs rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
              title="Paste pattern"
            >
              Paste
            </button>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onModeChange('pattern')}
            className={`px-2 py-0.5 text-xs rounded ${
              mode === 'pattern'
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Pattern
          </button>
          <button
            onClick={() => onModeChange('sequence')}
            className={`px-2 py-0.5 text-xs rounded ${
              mode === 'sequence'
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Sequence
          </button>
        </div>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: 16 }, (_, i) => {
          const isSelected = i === selectedIndex;
          const hasData = hasContent(i);
          return (
            <button
              key={i}
              onClick={() => onSelectPattern(i)}
              className={`h-7 rounded text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-[var(--color-accent)] text-white scale-95'
                  : hasData
                  ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:bg-opacity-50'
                  : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
              aria-label={`Pattern ${i + 1}${isSelected ? ', selected' : ''}${hasData ? ', has content' : ''}`}
            >
              {i + 1}
              {hasData && !isSelected && (
                <span className="block w-1 h-1 mx-auto mt-0.5 rounded-full bg-[var(--color-accent)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
