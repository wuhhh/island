import { useEffect, useMemo } from "react";
import * as THREE from "three/webgpu";

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
    } else {
      console.warn("No terrain data available to set.");
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
  }, [planeRef.current?.geometry]);
}

/**
 * Sets up the terrain material
 */
export function useTerrainMaterial({ wireframe, islandStoreHydrated, materialConfig }) {
  const materialRef = useRef();

  useEffect(() => {
    const material = new THREE.MeshStandardNodeMaterial({
      transparent: true,
      wireframe,
    });

    materialRef.current = material;

    // Apply the material with the color from config
    material.colorNode = oceanLand({
      position: t.positionGeometry,
      colour: materialConfig.color,
    });
  }, [wireframe, islandStoreHydrated, materialConfig.color]);

  return materialRef;
}
