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
      let zExtrema = findZExtrema(terrainData);
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
 * Handles keyboard controls for the terrain editor
 */
export function useKeyboardControls({
  sculptMode,
  setSculptMode,
  wireframe,
  setWireframe,
  brushSettings,
  resetTerrain,
  materialRef,
  useHistoryStoreUndo,
  useHistoryStoreRedo,
}) {
  useEffect(() => {
    const handleKeyDown = e => {
      // Toggle sculpt mode with Tab key
      if (e.key === "Tab") {
        e.preventDefault();
        setSculptMode(!sculptMode);
        console.log(`Mode: ${!sculptMode ? "Sculpting" : "Camera Control"}`);
      }

      // Toggle wireframe with W key
      if (e.key === "w" || e.key === "W") {
        setWireframe(!wireframe);
        if (materialRef.current) {
          materialRef.current.wireframe = !materialRef.current.wireframe;
          console.log(`Wireframe: ${materialRef.current.wireframe ? "On" : "Off"}`);
        }
      }

      // Undo with u
      if (e.key === "u" || e.key === "U") {
        useHistoryStoreUndo();
        console.log("Undo");
      }

      // Redo with y
      if (e.key === "y" || e.key === "Y") {
        useHistoryStoreRedo();
        console.log("Redo");
      }

      // Shift key to lower terrain
      if (e.key === "Shift") {
        brushSettings.current.mode = -1;
      }

      // Bracket keys to adjust brush size
      if (e.key === "[") {
        brushSettings.current.radius = Math.max(0.02, brushSettings.current.radius - 0.02);
        console.log(`Brush radius: ${brushSettings.current.radius.toFixed(2)}`);
      }
      if (e.key === "]") {
        brushSettings.current.radius = Math.min(0.5, brushSettings.current.radius + 0.02);
        console.log(`Brush radius: ${brushSettings.current.radius.toFixed(2)}`);
      }

      // - and = keys to adjust brush strength
      if (e.key === "-") {
        brushSettings.current.strength = Math.max(0.01, brushSettings.current.strength - 0.01);
        console.log(`Brush strength: ${brushSettings.current.strength.toFixed(2)}`);
      }
      if (e.key === "=") {
        brushSettings.current.strength = Math.min(0.2, brushSettings.current.strength + 0.01);
        console.log(`Brush strength: ${brushSettings.current.strength.toFixed(2)}`);
      }

      // R key to reset terrain
      if (e.key === "R") {
        resetTerrain();
        console.log("Terrain reset");
      }
    };

    const handleKeyUp = e => {
      // Reset to raising terrain when Shift is released
      if (e.key === "Shift") {
        brushSettings.current.mode = 1;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [sculptMode, wireframe, setWireframe, setSculptMode, resetTerrain, materialRef, useHistoryStoreUndo, useHistoryStoreRedo]);
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
