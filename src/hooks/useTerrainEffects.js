import { useEffect, useMemo } from "react";

import { findZExtrema, calculateEdgeWeights, createSpatialIndex } from "../utils/terrainUtils";

/**
 * Manages terrain initialization from history store
 */
export function useTerrainInitialization({ planeRef, historyStoreHydrated, getTerrainData, setTerrainZExtrema }) {
  useEffect(() => {
    if (!historyStoreHydrated || !planeRef.current) return;

    const terrainData = getTerrainData();

    if (terrainData.length > 0 && planeRef.current.geometry.attributes.position) {
      // Apply to geometry
      planeRef.current.geometry.attributes.position.array = terrainData;
      const geometry = planeRef.current.geometry;
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();

      // Calculate and store extrema
      const zExtrema = findZExtrema(terrainData);
      setTerrainZExtrema(zExtrema);
    }
  }, [historyStoreHydrated, getTerrainData, planeRef, setTerrainZExtrema]);
}

/**
 * Handles edge clamping effect
 */
export function useEdgeClampEffect({ planeRef, edgeClampRadius }) {
  useEffect(() => {
    if (!planeRef.current) return;
    calculateEdgeWeights(planeRef.current.geometry, edgeClampRadius);
  }, [planeRef, edgeClampRadius]);
}

/**
 * Creates and manages the spatial index for efficient vertex selection
 */
export function useSpatialIndex(planeRef) {
  return useMemo(() => {
    if (!planeRef.current) return null;
    return createSpatialIndex(planeRef.current.geometry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planeRef.current?.geometry]);
}
