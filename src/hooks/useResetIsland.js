import { useCallback } from "react";

import { useHistoryStore } from "../stores/useHistoryStore";
import { useIslandStore } from "../stores/useIslandStore";

export function useResetIsland() {
  const snapshotId = useIslandStore(state => state.persisted.snapshotId);
  const setSnapshotId = useIslandStore(state => state.actions.setSnapshotId);
  const terrainSystem = useIslandStore(state => state.terrainSystem);
  const resetCamera = useIslandStore(state => state.actions.resetCamera);
  const setTerrainGeomAttrsPosArr = useHistoryStore(state => state.setTerrainGeomAttrsPosArr);
  const clearPlacedItems = useHistoryStore(state => state.clearPlacedItems);
  const { clear } = useHistoryStore.temporal.getState();

  return useCallback(() => {
    if (terrainSystem) {
      terrainSystem.resetTerrain();
      setTerrainGeomAttrsPosArr(terrainSystem.positions);
    }

    clearPlacedItems();
    resetCamera();

    if (snapshotId === "default") {
      clear(); // clear history to prevent weird undo/redo behavior
    }

    setSnapshotId("reset");
  }, [terrainSystem, clearPlacedItems, resetCamera, snapshotId, setSnapshotId, setTerrainGeomAttrsPosArr, clear]);
}
