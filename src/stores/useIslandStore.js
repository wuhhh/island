import { createBoundStore, useHydration } from "./useBoundStore";

export const TERRAIN_RESOLUTION = 128; // Resolution of the terrain (number of vertices along one side)

// Create store with the extracted bound store utility
export const useIslandStore = createBoundStore(
  (set, get) => ({
    // Editing
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
  }
);

// Re-export the hydration hook with the specific store bound to it
export const useIslandHydration = () => useHydration(useIslandStore);
