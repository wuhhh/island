import { useCallback } from "react";

import { useHistoryStore } from "../stores/useHistoryStore";
import { useIslandStore } from "../stores/useIslandStore";

export function useResetIsland() {
  const setSnapshotId = useIslandStore(state => state.actions.setSnapshotId);
  const terrainSystem = useIslandStore(state => state.terrainSystem);
  const resetCamera = useIslandStore(state => state.actions.resetCamera);
  const setTerrainGeomAttrsPosArr = useHistoryStore(state => state.setTerrainGeomAttrsPosArr);
  const clearPlacedItems = useHistoryStore(state => state.clearPlacedItems);

  return useCallback(() => {
    if (terrainSystem) {
      terrainSystem.resetTerrain();
      setTerrainGeomAttrsPosArr(terrainSystem.positions);
    }

    clearPlacedItems();
    resetCamera();

    setSnapshotId("reset");
  }, [terrainSystem, clearPlacedItems, resetCamera, setSnapshotId, setTerrainGeomAttrsPosArr]);
}
