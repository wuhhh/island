import { useCallback } from "react";
import { useIslandStore } from "./useIslandStore";
import { useHistoryStore } from "./useHistoryStore";

export function useResetIsland() {
  const terrainSystem = useIslandStore(state => state.terrainSystem);
  const setTerrainGeomAttrsPosArr = useHistoryStore(state => state.setTerrainGeomAttrsPosArr);
  const clearPlacedItems = useHistoryStore(state => state.clearPlacedItems);

  return useCallback(() => {
    if (terrainSystem) {
      terrainSystem.resetTerrain();
      setTerrainGeomAttrsPosArr(terrainSystem.positions);
    }

    clearPlacedItems();
  }, [terrainSystem, setTerrainGeomAttrsPosArr]);
}
