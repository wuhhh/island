import { createBoundStore, useHydration } from "./useBoundStore";

export const TERRAIN_RESOLUTION = 128; // Resolution of the terrain (number of vertices along one side)
export const CAMERA_POSITION = [1, 1, 2]; // Default camera position
export const CAMERA_TARGET = [0, 0, 0]; // Default camera target position

// Create store with the extracted bound store utility
export const useIslandStore = createBoundStore(
  set => ({
    activeTool: "move",
    editMode: false,
    pointerDown: false,
    place: {
      active: false,
      item: null,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    sculpt: {
      active: false,
      brushSize: 0.5,
      brushStrength: 0.5,
    },
    terrainSystem: null,
    terrainZExtrema: [0, 0],
    wireframe: false,

    persisted: {
      cameraPosition: null,
      cameraTarget: null,
    },

    actions: {
      setActiveTool: activeTool => set({ activeTool }),
      setEditMode: editMode => set({ editMode }),
      setPointerDown: pointerDown => set({ pointerDown }),
      setPlaceProp(property, value) {
        set(state => ({
          place: {
            ...state.place,
            [property]: value,
          },
        }));
      },
      setSculptProp(property, value) {
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
       * setTerrainSystem
       * @param {TerrainSystem} terrainSystem
       */
      setTerrainSystem: terrainSystem =>
        set(state => ({
          terrainSystem,
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
