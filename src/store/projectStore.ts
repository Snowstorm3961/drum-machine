import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProjectStore {
  projectName: string;
  masterVolume: number;
  isInitialized: boolean;

  // Actions
  setProjectName: (name: string) => void;
  setMasterVolume: (volume: number) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projectName: 'Untitled Project',
      masterVolume: 0.8,
      isInitialized: false,

      setProjectName: (name) => set({ projectName: name }),
      setMasterVolume: (volume) => set({ masterVolume: Math.max(0, Math.min(1, volume)) }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),
    }),
    {
      name: 'drum-machine-project',
      partialize: (state) => ({
        projectName: state.projectName,
        masterVolume: state.masterVolume,
      }),
    }
  )
);
