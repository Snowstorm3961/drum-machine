import { memo, useCallback, useMemo } from 'react';
import { useParamSliderStore, getParamValue, setParamValue } from '../../store/paramSliderStore';
import { ASSIGNABLE_PARAMS, getParamById } from '../../data/assignableParams';
import { useDrumStore } from '../../store';
import { useSynthStore } from '../../store';

// Group params by category for the dropdown
function getGroupedParams() {
  const groups: Record<string, { id: string; label: string }[]> = {};
  for (const p of ASSIGNABLE_PARAMS) {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push({ id: p.id, label: p.label });
  }
  return groups;
}

const GROUPED = getGroupedParams();

export const AssignableSliders = memo(function AssignableSliders() {
  const { slots, setSlotTarget } = useParamSliderStore();

  // Subscribe to drum and synth stores to trigger re-render on value changes
  useDrumStore((s) => s.params);
  useSynthStore((s) => s.synths);

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-xl">
      {slots.map((slot, i) => (
        <SliderSlot
          key={i}
          index={i}
          targetId={slot.targetId}
          value={slot.targetId ? getParamValue(slot.targetId) : 0}
          setSlotTarget={setSlotTarget}
        />
      ))}
    </div>
  );
});

interface SliderSlotProps {
  index: number;
  targetId: string | null;
  value: number;
  setSlotTarget: (index: number, targetId: string | null) => void;
}

const SliderSlot = memo(function SliderSlot({ index, targetId, value, setSlotTarget }: SliderSlotProps) {
  const param = useMemo(() => (targetId ? getParamById(targetId) : null), [targetId]);

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setSlotTarget(index, val === '' ? null : val);
    },
    [index, setSlotTarget]
  );

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (targetId) {
        setParamValue(targetId, parseFloat(e.target.value));
      }
    },
    [targetId]
  );

  return (
    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
      <select
        value={targetId ?? ''}
        onChange={handleSelectChange}
        className="w-28 text-xs bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-bg-tertiary)] rounded px-1 py-1 truncate"
        aria-label={`Slider ${index + 1} parameter`}
      >
        <option value="">--</option>
        {Object.entries(GROUPED).map(([category, params]) => (
          <optgroup key={category} label={category}>
            {params.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <input
        type="range"
        min={param?.min ?? 0}
        max={param?.max ?? 1}
        step={param?.step ?? 0.01}
        value={value}
        onChange={handleSliderChange}
        disabled={!targetId}
        className="flex-1 h-2 bg-[var(--color-bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)] disabled:opacity-30"
        aria-label={param?.label ?? `Slider ${index + 1}`}
      />
    </div>
  );
});
