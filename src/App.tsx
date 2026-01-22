import { useState, useCallback } from 'react';
import { AppShell } from './components/layout/AppShell';
import { TransportControls } from './components/transport/TransportControls';
import { StepSequencer } from './components/sequencer/StepSequencer';
import { PatternSelector } from './components/pattern/PatternSelector';
import { DrumControls } from './components/drums/DrumControls';
import { SynthSection } from './components/synth/SynthSection';
import { ArrangementView } from './components/arrangement/ArrangementView';
import { AudioUnlockOverlay } from './components/AudioUnlockOverlay';
import { useProjectStore } from './store';

function App() {
  const [showOverlay, setShowOverlay] = useState(true);
  const setInitialized = useProjectStore((s) => s.setInitialized);

  const handleAudioUnlock = useCallback(() => {
    // Audio is already initialized by the overlay
    setInitialized(true);
    setShowOverlay(false);
  }, [setInitialized]);

  return (
    <>
      {showOverlay && <AudioUnlockOverlay onUnlock={handleAudioUnlock} />}
      <AppShell>
        <TransportControls />
        <PatternSelector />
        <StepSequencer />
        <DrumControls />
        <SynthSection />
        <ArrangementView />
      </AppShell>
    </>
  );
}

export default App;
