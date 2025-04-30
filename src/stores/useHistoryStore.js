import { temporal } from "zundo";

import { createBoundStore, useHydration } from "./useBoundStore";

// Create history store with temporal middleware for undo/redo functionality
export const useHistoryStore = createBoundStore(
  (set, get) => ({
    // Terrain (geometry.attributes.position.array)
    terrainGeomAttrsPosArr: null,

    // Decor placement
    placedItems: [],

    /**
     * setTerrainGeomAttrsPosArr
     * @param {Float32Array} terrainGeomAttrsPosArr - The new terrain geometry attributes position array
     * @returns {void}
     * @description Sets the terrain geometry attributes position array in the store.
     */
    setTerrainGeomAttrsPosArr: terrainGeomAttrsPosArr => {
      // Store as Array to ensure proper serialization
      const arrayData = Array.from(terrainGeomAttrsPosArr);
      set({ terrainGeomAttrsPosArr: arrayData });
    },

    /**
     * getTerrainData
     * @returns {Float32Array} The terrain data as a Float32Array
     * @description Gets the terrain data converted to a proper Float32Array
     */
    getTerrainData: () => {
      const state = get();
      // Convert back to Float32Array if it's not already
      return state.terrainGeomAttrsPosArr instanceof Float32Array
        ? state.terrainGeomAttrsPosArr
        : new Float32Array(state.terrainGeomAttrsPosArr || []);
    },

    /**
     * setPlacedItems
     * @param {Array} placedItems - The new array of placed items
     * @returns {void}
     * @description Sets the array of placed items in the store.
     */
    setPlacedItems: placedItems => {
      // Store as Array to ensure proper serialization
      const arrayData = Array.from(placedItems);
      set({ placedItems: arrayData });
    },

    /**
     * getPlacedItems
     * @returns {Array} The array of placed items
     * @description Gets the array of placed items from the store.
     */
    getPlacedItems: () => {
      const state = get();
      // Convert back to Array if it's not already
      return Array.isArray(state.placedItems) ? state.placedItems : [];
    },

    /**
     * deletePlacedItems
     * @param {array} item - An array of IDs to delete
     * @returns {void}
     * @description Deletes placed items from the store based on their IDs.
     */
    deletePlacedItems: ids => {
      const placedItems = get().getPlacedItems();
      const newPlacedItems = placedItems.filter(item => !ids.includes(item.id));
      set({ placedItems: newPlacedItems });
    },

    /**
     * clearPlacedItems
     * @returns {void}
     * @description Clears all placed items from the store.
     */
    clearPlacedItems: () => {
      set({ placedItems: [] });
    },
  }),
  {
    name: "wuhhh/island:parent-storage",
    middlewares: [temporal],
    middlewareOptions: {
      temporal: {
        wrapTemporal:
          storeInitializer =>
          // Note: This is a middleware wrapping another middleware
          (set, get, api) =>
            storeInitializer(set, get, {
              ...api,
              // Custom storage configuration for the temporal state
              storage: {
                ...api.storage,
                name: "wuhhh/island:temporal-storage",
              },
            }),
      },
    },
  }
);

// Re-export the hydration hook with the history store bound to it
export const useHistoryHydration = () => useHydration(useHistoryStore);
