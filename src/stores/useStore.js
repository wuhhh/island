import { create } from "zustand";
import { persist } from "zustand/middleware";

const useStore = create(
  persist(
    (set, get) => ({
      // Configuration
      planeSubdivisions: 128, // Default value, can be changed

      // Computed property for vertex count
      get vertexCount() {
        const subdivisions = get().planeSubdivisions;
        return (subdivisions + 1) * (subdivisions + 1); // For a square plane
      },

      // Current terrain state - initialized with correct size based on subdivisions
      currentHeightMap: null, // Will be initialized in an effect

      // Initialize or resize the height map when subdivisions change
      initializeHeightMap: () => {
        const { vertexCount } = get();
        set({ currentHeightMap: new Float32Array(vertexCount) });
      },

      sculptMode: false,
      setSculptMode: sculptMode => set({ sculptMode }),

      persisted: {
        wireframe: false,
      },

      actions: {
        setWireframe: wireframe => set(state => ({ persisted: { ...state.persisted, wireframe } })),
      },
    }),
    {
      name: "wuhhh/island",
      // Only persist the 'persisted' object
      partialize: state => ({ persisted: state.persisted }),
    }
  )
);

export default useStore;
