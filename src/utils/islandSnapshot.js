import { useHistoryStore } from "../stores/useHistoryStore.js";
import { useIslandStore } from "../stores/useIslandStore.js";

/**
 * Serializes the island state (terrain + placed items)
 * to a JSON string ready for download/export.
 */
export function createSnapshot() {
  // grab raw state objects
  const islandState = useIslandStore.getState();
  const historyState = useHistoryStore.getState();

  // Get terrain data and ensure it's a regular array
  const terrainData = historyState.getTerrainData();
  // Convert Float32Array to a regular array if it's not already
  const terrainDataArray = terrainData instanceof Float32Array ? Array.from(terrainData) : terrainData;

  const snapshot = {
    island: {
      id: "default",
      cameraPosition: islandState.persisted.cameraPosition,
      cameraTarget: islandState.persisted.cameraTarget,
    },
    history: {
      terrainGeomAttrsPosArr: terrainDataArray,
      placedItems: historyState.placedItems,
    },
  };

  return JSON.stringify(snapshot, null, 2);
}

/**
 * Restores island from a previously created snapshot
 * @param {string|Object} data Either the raw JSON or an already‐parsed snapshot.
 * @returns {Promise<void>} A promise that resolves when the snapshot has been fully loaded
 */
export async function loadSnapshot(data) {
  const { island, history } = typeof data === "string" ? JSON.parse(data) : data;

  const islandStore = useIslandStore.getState();
  const { setCameraPosition, setCameraTarget, setSnapshotId, setSnapshotLoading } = islandStore.actions;

  // Signal snapshot loading start
  setSnapshotLoading(true);

  try {
    // Process terrain data
    let terrainData = history.terrainGeomAttrsPosArr;
    if (terrainData && !Array.isArray(terrainData)) {
      terrainData = Object.values(terrainData);
    }

    // Process placed items
    let placedItems = history.placedItems;
    if (placedItems && !Array.isArray(placedItems)) {
      placedItems = Object.values(placedItems);
    }

    // Set camera position and target
    if (island.cameraPosition) {
      setCameraPosition(island.cameraPosition);
    }
    if (island.cameraTarget) {
      setCameraTarget(island.cameraTarget);
    }

    // Set snapshot ID
    if (island.id) {
      setSnapshotId(island.id);
    }

    // Restore island data with a promise-based approach
    await restoreIslandData(placedItems, terrainData);
  } finally {
    // Signal snapshot loading complete
    setSnapshotLoading(false);
  }
}

/**
 * Helper function to restore island data with proper async handling
 * @param {Array} placedItems The placed items to restore
 * @param {Array} terrainData The terrain data to restore
 * @returns {Promise<void>} A promise that resolves when restoration is complete
 */
async function restoreIslandData(placedItems, terrainData) {
  return new Promise(resolve => {
    // Call the history store's restore method
    useHistoryStore.getState().restoreIsland(placedItems, terrainData);

    // Use requestAnimationFrame to ensure the next frame has processed
    // This gives the Three.js scene time to update
    requestAnimationFrame(() => {
      // Use one more animation frame to be extra safe
      requestAnimationFrame(resolve);
    });
  });
}

/**
 * Load a snapshot from a path
 * @param {string} path The path to the snapshot file.
 * @returns {Promise<void>} A promise that resolves when the snapshot is loaded
 */
export async function loadSnapshotFromPath(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load snapshot from ${path}: ${response.statusText}`);
  }
  const data = await response.json();
  return loadSnapshot(data);
}
