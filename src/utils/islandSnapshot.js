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
      cameraPosition: islandState.persisted.cameraPosition, // Array
      cameraTarget: islandState.persisted.cameraTarget, // Array
    },
    history: {
      terrainGeomAttrsPosArr: terrainDataArray, // Ensure it's a regular Array
      placedItems: historyState.getPlacedItems(), // Array
    },
  };

  return JSON.stringify(snapshot, null, 2);
}

/**
 * Restores island from a previously created snapshot
 * @param {string|Object} data  Either the raw JSON or an already‐parsed snapshot.
 */
export function loadSnapshot(data) {
  const { island, history } = typeof data === "string" ? JSON.parse(data) : data;

  // restore island store
  const setCameraPosition = useIslandStore.getState().actions.setCameraPosition;
  const setCameraTarget = useIslandStore.getState().actions.setCameraTarget;

  if (island.cameraPosition) {
    setCameraPosition(island.cameraPosition);
  }
  if (island.cameraTarget) {
    setCameraTarget(island.cameraTarget);
  }

  // If terrain data is an object with numeric keys, convert it to an array
  let terrainData = history.terrainGeomAttrsPosArr;
  if (terrainData && !Array.isArray(terrainData)) {
    terrainData = Object.values(terrainData);
  }

  // restore terrain data
  useHistoryStore.getState().setTerrainGeomAttrsPosArr(terrainData);

  // Similarly, ensure placedItems is an array
  let placedItems = history.placedItems;
  if (placedItems && !Array.isArray(placedItems)) {
    placedItems = Object.values(placedItems);
  }

  useHistoryStore.getState().setPlacedItems(placedItems);
}

/**
 * Load a snapshot from a path
 * @param {string} path  The path to the snapshot file.
 * @returns {Promise}  A promise that resolves when the snapshot is loaded.
 */
export async function loadSnapshotFromPath(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load snapshot from ${path}: ${response.statusText}`);
  }
  const data = await response.json();
  loadSnapshot(data);
}
