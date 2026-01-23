import { useEffect, useCallback, useRef, useState } from 'react';
import { audioEngine } from '../audio/engine/AudioEngine';
import { useTransportStore, usePatternStore, useProjectStore, useSynthStore, useDrumStore } from '../store';
import type { Step } from '../types';

export function useAudioEngine() {
  const { state, bpm, swing, play, stop, pause, setCurrentStep } = useTransportStore();
  const { patterns, currentPatternId } = usePatternStore();
  const { masterVolume, isInitialized, setInitialized } = useProjectStore();
  const { synths, patterns: synthPatterns, currentSynthPatternIndex, synthsEnabled } = useSynthStore();
  const { params: drumParams } = useDrumStore();
  const isPlayingRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);

  // Initialize audio engine
  const initialize = useCallback(async () => {
    if (isInitialized) return;
    // Unlock audio synchronously first (for iOS)
    audioEngine.unlockAudio();
    await audioEngine.initialize();
    setInitialized(true);
  }, [isInitialized, setInitialized]);

  // Sync BPM with audio engine
  useEffect(() => {
    audioEngine.setBpm(bpm);
  }, [bpm]);

  // Sync swing with audio engine
  useEffect(() => {
    audioEngine.setSwing(swing);
  }, [swing]);

  // Sync master volume with audio engine
  useEffect(() => {
    audioEngine.setMasterVolume(masterVolume);
  }, [masterVolume]);

  // Sync drum pattern with audio engine
  useEffect(() => {
    const pattern = patterns.find((p) => p.id === currentPatternId);
    if (!pattern) return;

    const patternMap = new Map<string, Step[]>();
    pattern.tracks.forEach((track) => {
      patternMap.set(track.trackId, track.steps);
    });

    audioEngine.setPattern(patternMap);
  }, [patterns, currentPatternId]);

  // Sync synth patterns with audio engine (pass currently selected pattern per synth)
  useEffect(() => {
    const currentPatterns = synthPatterns.map((synthPats, i) => synthPats[currentSynthPatternIndex[i]]);
    audioEngine.setSynthPatterns(currentPatterns);
  }, [synthPatterns, currentSynthPatternIndex]);

  // Sync synths enabled state
  useEffect(() => {
    audioEngine.setSynthsEnabled(synthsEnabled);
  }, [synthsEnabled]);

  // Sync drum params with audio engine
  useEffect(() => {
    audioEngine.applyAllDrumParams(drumParams);
  }, [drumParams]);

  // Sync synth settings with audio engine
  useEffect(() => {
    synths.forEach((synthSettings, index) => {
      audioEngine.updateSynthSettings(index, synthSettings);
    });
  }, [synths]);

  // Set up step callback
  useEffect(() => {
    audioEngine.setStepCallback((step) => {
      setCurrentStep(step);
    });

    return () => {
      audioEngine.setStepCallback(null);
    };
  }, [setCurrentStep]);

  // Set up recording callback
  useEffect(() => {
    audioEngine.setRecordingCallback((recording) => {
      setIsRecording(recording);
    });

    return () => {
      audioEngine.setRecordingCallback(null);
    };
  }, []);

  // Handle transport state changes
  useEffect(() => {
    const handleStateChange = async () => {
      if (state === 'playing' && !isPlayingRef.current) {
        // Unlock audio synchronously first (for iOS)
        audioEngine.unlockAudio();
        await audioEngine.ensureResumed();
        audioEngine.play();
        isPlayingRef.current = true;
      } else if (state === 'stopped' && isPlayingRef.current) {
        audioEngine.stop();
        isPlayingRef.current = false;
      } else if (state === 'paused' && isPlayingRef.current) {
        audioEngine.pause();
        isPlayingRef.current = false;
      }
    };

    handleStateChange();
  }, [state]);

  // Trigger drum sound (for pad hits)
  const triggerDrum = useCallback(
    async (drumId: string, velocity: number = 100) => {
      // Unlock audio synchronously first (for iOS)
      audioEngine.unlockAudio();
      await audioEngine.ensureResumed();
      audioEngine.triggerDrum(drumId, velocity);
    },
    []
  );

  // Trigger synth note (for preview)
  const triggerSynthNote = useCallback(
    async (synthIndex: number, note: number, velocity: number = 100) => {
      // Unlock audio synchronously first (for iOS)
      audioEngine.unlockAudio();
      await audioEngine.ensureResumed();
      audioEngine.triggerSynthNote(synthIndex, note, velocity);
    },
    []
  );

  // Start recording
  const startRecording = useCallback(async () => {
    console.log('startRecording called');
    // Unlock audio synchronously first (for iOS)
    audioEngine.unlockAudio();
    await initialize();
    await audioEngine.ensureResumed();
    audioEngine.startRecording();
    setIsRecording(true);
    console.log('Recording state set to true');
  }, [initialize]);

  // Stop recording and get WAV blob
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    console.log('stopRecording called');
    const blob = await audioEngine.stopRecording();
    setIsRecording(false);
    console.log('Recording state set to false, blob:', blob);
    return blob;
  }, []);

  // Stop recording and trigger download
  const stopRecordingAndDownload = useCallback(async () => {
    console.log('stopRecordingAndDownload called');
    const blob = await stopRecording();
    if (blob) {
      console.log('Triggering download for blob size:', blob.size);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drum-machine-${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      console.log('No blob to download');
    }
  }, [stopRecording]);

  return {
    initialize,
    isInitialized,
    play,
    stop,
    pause,
    triggerDrum,
    triggerSynthNote,
    state,
    bpm,
    isRecording,
    startRecording,
    stopRecording,
    stopRecordingAndDownload,
  };
}
