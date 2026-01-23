import { useState, useCallback } from 'react';
import { AppShell } from './components/layout/AppShell';
import { PlayBar } from './components/playbar/PlayBar';
import { AssignableSliders } from './components/playbar/AssignableSliders';
import { TransportControls } from './components/transport/TransportControls';
import { StepSequencer } from './components/sequencer/StepSequencer';
import { InstrumentPatternGrid } from './components/pattern/InstrumentPatternGrid';
import { SequenceBuilder } from './components/pattern/SequenceBuilder';
import { DrumControls } from './components/drums/DrumControls';
import { SynthSection } from './components/synth/SynthSection';
import { AudioUnlockOverlay } from './components/AudioUnlockOverlay';
import { useProjectStore, usePatternStore, useSynthStore } from './store';
import { useSequenceStore, type InstrumentId } from './store/sequenceStore';
import type { TrackPattern, Step } from './types';

function App() {
  const [showOverlay, setShowOverlay] = useState(true);
  const [drumClipboard, setDrumClipboard] = useState<TrackPattern[] | null>(null);
  const [synthClipboard, setSynthClipboard] = useState<Step[] | null>(null);
  const setInitialized = useProjectStore((s) => s.setInitialized);
  const { patterns, currentPatternId, setCurrentPattern, pasteTracksIntoPattern } = usePatternStore();
  const { patterns: synthPatterns, selectedSynthIndex, currentSynthPatternIndex, setCurrentSynthPattern, pasteStepsIntoCurrentPattern } = useSynthStore();
  const drumMode = useSequenceStore((s) => s.modes.drums);
  const modes = useSequenceStore((s) => s.modes);
  const setMode = useSequenceStore((s) => s.setMode);

  const handleAudioUnlock = useCallback(() => {
    setInitialized(true);
    setShowOverlay(false);
  }, [setInitialized]);

  // --- Drum pattern grid ---
  const drumPatternIndex = parseInt(currentPatternId.replace('pattern-', ''), 10) - 1;

  const drumHasContent = useCallback(
    (index: number) => {
      const pattern = patterns[index];
      if (!pattern) return false;
      return pattern.tracks.some((track) => track.steps.some((step) => step.active));
    },
    [patterns]
  );

  const handleDrumPatternSelect = useCallback(
    (index: number) => {
      setCurrentPattern(`pattern-${index + 1}`);
    },
    [setCurrentPattern]
  );

  const handleDrumCopy = useCallback(() => {
    const pattern = patterns.find((p) => p.id === currentPatternId);
    if (pattern) {
      setDrumClipboard(pattern.tracks.map((t) => ({ ...t, steps: t.steps.map((s) => ({ ...s })) })));
    }
  }, [patterns, currentPatternId]);

  const handleDrumPaste = useCallback(() => {
    if (drumClipboard) {
      pasteTracksIntoPattern(currentPatternId, drumClipboard);
    }
  }, [drumClipboard, currentPatternId, pasteTracksIntoPattern]);

  // --- Synth pattern grid ---
  const synthInstrumentId = `synth-${selectedSynthIndex + 1}` as InstrumentId;
  const synthMode = modes[synthInstrumentId];

  const synthHasContent = useCallback(
    (index: number) => {
      const pattern = synthPatterns[selectedSynthIndex]?.[index];
      if (!pattern) return false;
      return pattern.steps.some((step) => step.active);
    },
    [synthPatterns, selectedSynthIndex]
  );

  const handleSynthPatternSelect = useCallback(
    (index: number) => {
      setCurrentSynthPattern(selectedSynthIndex, index);
    },
    [selectedSynthIndex, setCurrentSynthPattern]
  );

  const handleSynthCopy = useCallback(() => {
    const patIdx = currentSynthPatternIndex[selectedSynthIndex];
    const pattern = synthPatterns[selectedSynthIndex]?.[patIdx];
    if (pattern) {
      setSynthClipboard(pattern.steps.map((s) => ({ ...s, notes: s.notes ? [...s.notes] : [] })));
    }
  }, [synthPatterns, selectedSynthIndex, currentSynthPatternIndex]);

  const handleSynthPaste = useCallback(() => {
    if (synthClipboard) {
      pasteStepsIntoCurrentPattern(selectedSynthIndex, synthClipboard);
    }
  }, [synthClipboard, selectedSynthIndex, pasteStepsIntoCurrentPattern]);

  return (
    <>
      {showOverlay && <AudioUnlockOverlay onUnlock={handleAudioUnlock} />}
      <PlayBar />
      <AppShell>
        <TransportControls />
        <AssignableSliders />
        <InstrumentPatternGrid
          label="Drums"
          selectedIndex={drumPatternIndex}
          hasContent={drumHasContent}
          onSelectPattern={handleDrumPatternSelect}
          onCopy={handleDrumCopy}
          onPaste={handleDrumPaste}
          canPaste={drumClipboard !== null}
          mode={drumMode}
          onModeChange={(mode) => setMode('drums', mode)}
        />
        {drumMode === 'sequence' && <SequenceBuilder instrumentId="drums" />}
        <InstrumentPatternGrid
          label="Synths"
          selectedIndex={currentSynthPatternIndex[selectedSynthIndex]}
          hasContent={synthHasContent}
          onSelectPattern={handleSynthPatternSelect}
          onCopy={handleSynthCopy}
          onPaste={handleSynthPaste}
          canPaste={synthClipboard !== null}
          mode={synthMode}
          onModeChange={(mode) => setMode(synthInstrumentId, mode)}
        />
        {synthMode === 'sequence' && <SequenceBuilder instrumentId={synthInstrumentId} />}
        <StepSequencer />
        <DrumControls />
        <SynthSection />
      </AppShell>
    </>
  );
}

export default App;
