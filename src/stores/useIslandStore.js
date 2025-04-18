import { createBoundStore, useHydration } from "./useBoundStore";

export const TERRAIN_RESOLUTION = 128; // Resolution of the terrain (number of vertices along one side)
export const CAMERA_POSITION = [1, 1, 2]; // Default camera position
export const CAMERA_TARGET = [0, 0, 0]; // Default camera target position

// Create store with the extracted bound store utility
export const useIslandStore = createBoundStore(
  set => ({
    editMode: false,
    pointerDown: false,
    sculpt: {
      active: false,
      mode: "add", // "add", "subtract"
      brushSize: 0.5,
      brushStrength: 0.5,
    },
    terrainZExtrema: [0, 0],
    wireframe: false,

    persisted: {
      cameraPosition: null,
      cameraTarget: null,
    },

    actions: {
      setEditMode: editMode => set({ editMode }),
      setPointerDown: pointerDown => set({ pointerDown }),
      setSculptProp(property, value) {
        console.log(`setSculptProp: ${property} = ${value}`);

        set(state => ({
          sculpt: {
            ...state.sculpt,
            [property]: value,
          },
        }));
      },
      setWireframe: wireframe =>
        set(state => ({
          persisted: {
            ...state.persisted,
            wireframe,
          },
        })),
      setCameraPosition: cameraPosition =>
        set(state => ({
          persisted: {
            ...state.persisted,
            cameraPosition,
          },
        })),
      setCameraTarget: cameraTarget =>
        set(state => ({
          persisted: {
            ...state.persisted,
            cameraTarget,
          },
        })),
      /**
       * setTerrainZExtrema
       * @param {number[]} extrema - The new terrain Z extrema
       * @returns {void}
       */
      setTerrainZExtrema: extrema => {
        set({ terrainZExtrema: extrema });
      },
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
