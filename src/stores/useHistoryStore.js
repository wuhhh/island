import isDeepEqual from "fast-deep-equal";
import { temporal } from "zundo";

import { createBoundStore, useHydration } from "./useBoundStore";

// Create history store with temporal middleware for undo/redo functionality
export const useHistoryStore = createBoundStore(
  (set, get) => ({
    // Decor placement
    placedItems: [],

    // Terrain (geometry.attributes.position.array)
    terrainGeomAttrsPosArr: null,

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
     * deletePlacedItems
     * @param {array} item - An array of IDs to delete
     * @returns {void}
     * @description Deletes placed items from the store based on their IDs.
     */
    deletePlacedItems: ids => {
      const placedItems = get().placedItems;
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

    /**
     * resetIsland
     * @param {Array} terrainPositions - The terrain positions to reset
     * @returns {void}
     * @description Resets the island state with a single write operation.
     */
    resetIsland: terrainPositions => {
      set({
        terrainGeomAttrsPosArr: terrainPositions,
        placedItems: [],
      });
    },

    /**
     * restoreIsland
     * @param {Array} placedItems - The placed items to restore
     * @param {Array} terrainGeomAttrsPosArr - The terrain positions to restore
     * @returns {void}
     * @description Restores the island state with a single write operation.
     */
    restoreIsland: (placedItems, terrainGeomAttrsPosArr) => {
      set({
        terrainGeomAttrsPosArr,
        placedItems,
      });
    },
  }),
  {
    name: "wuhhh/island:parent-storage",
    middlewares: [temporal],
    middlewareOptions: {
      temporal: {
        equality: (past, current) => {
          const eq = isDeepEqual(past, current);
          return eq;
        },
        partialize: state => {
          const { placedItems, terrainGeomAttrsPosArr } = state;
          return { placedItems, terrainGeomAttrsPosArr };
        },
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
