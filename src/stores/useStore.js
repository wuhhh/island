import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";

const useStore = create()(
  persist(
    (set, get) => ({
      // Hydration state
      _hasHydrated: false,
      setHasHydrated: state => {
        set({
          _hasHydrated: state,
        });
      },

      // Configuration
      planeSubdivisions: 128, // Default value, can be changed

      // Current terrain state - initialized with correct size based on subdivisions
      currentHeightMap: null, // Will be initialized in useEffect

      // Initialize or resize the height map when subdivisions change
      initializeHeightMap: () => {
        const subdivisions = get().planeSubdivisions;
        const vertexCount = (subdivisions + 1) * (subdivisions + 1);
        set({ currentHeightMap: new Float32Array(vertexCount) });
      },

      // Use a function to calculate vertex count instead of a getter
      getVertexCount: () => {
        const subdivisions = get().planeSubdivisions;
        return (subdivisions + 1) * (subdivisions + 1); // For a square plane
      },

      sculptMode: false,
      setSculptMode: sculptMode => set({ sculptMode }),

      persisted: {
        wireframe: false,
      },

      actions: {
        setWireframe: wireframe =>
          set(state => ({
            persisted: {
              ...state.persisted,
              wireframe,
            },
          })),
      },
    }),
    {
      name: "wuhhh/island:store",
      // Only persist the 'persisted' object
      partialize: state => ({ persisted: state.persisted }),
      onRehydrateStorage: () => state => {
        // This correctly waits for state to be available
        if (state) {
          state.setHasHydrated(true);
          // Initialize height map after hydration
          state.initializeHeightMap();
        }
      },
    }
  )
);

// Initialize the height map on first load if not hydrating from storage
// This is needed because onRehydrateStorage only runs when rehydrating
if (!useStore.getState().currentHeightMap) {
  useStore.getState().initializeHeightMap();
}

const useHydration = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Optional: track when hydration starts
    const unsubHydrate = useStore.persist.onHydrate(() => setHydrated(false));

    const unsubFinishHydration = useStore.persist.onFinishHydration(() => setHydrated(true));

    // Set initial state
    setHydrated(useStore.persist.hasHydrated());

    return () => {
      unsubHydrate();
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
};

// Convenience selector hook for vertex count
const useVertexCount = () => useStore(state => state.getVertexCount());

export { useStore, useHydration, useVertexCount };
