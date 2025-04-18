import * as THREE from "three/webgpu";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Plane } from "@react-three/drei";
import { useControls, button } from "leva";
import { TERRAIN_RESOLUTION, useIslandStore, useIslandHydration } from "../stores/useIslandStore";
import { useHistoryStore, useHistoryHydration } from "../stores/useHistoryStore";
import * as t from "three/tsl";

import { useTerrainInitialization, useEdgeClampEffect, useSpatialIndex } from "../hooks/useTerrainEffects";
import { TerrainSystem } from "../systems/TerrainSystem";
import { findZExtrema } from "../utils/terrainUtils";

export default function Terrain({ ...props }) {
  // Refs
  const planeRef = useRef();
  const materialRef = useRef();
  const mousePos = useRef(new THREE.Vector2(0.5, 0.5));
  const terrainSystem = useRef(null);

  // Store state
  const getTerrainData = useHistoryStore(state => state.getTerrainData);
  const terrainGeomAttrsPosArr = useHistoryStore(state => state.terrainGeomAttrsPosArr);
  const setTerrainGeomAttrsPosArr = useHistoryStore(state => state.setTerrainGeomAttrsPosArr);
  const setTerrainZExtrema = useIslandStore(state => state.actions.setTerrainZExtrema);
  const { undo: useHistoryStoreUndo, redo: useHistoryStoreRedo, clear: useHistoryStoreClear } = useHistoryStore.temporal.getState();
  const { pointerDown, editMode, sculpt, wireframe, actions } = useIslandStore();
  const { setEditMode, setSculptProp, setWireframe } = actions;
  const islandStoreHydrated = useIslandHydration();
  const historyStoreHydrated = useHistoryHydration();

  // Local state
  const [brushing, setBrushing] = useState(false);
  const [altIsPressed, setAltIsPressed] = useState(false);

  // Set up Leva controls
  const { edgeClampRadius } = useControls("Island Settings", {
    edgeClampRadius: {
      value: 0.1,
      min: 0.05,
      max: 0.4,
      step: 0.01,
      label: "Edge Clamp Radius",
    },
    reset: button(
      () => {
        terrainSystem.current?.resetTerrain();
        useHistoryStoreClear();
        setTerrainGeomAttrsPosArr(planeRef.current.geometry.attributes.position.array);
      },
      {
        label: "Reset Terrain",
      }
    ),
  });

  // Use custom hooks
  useTerrainInitialization({
    planeRef,
    historyStoreHydrated,
    getTerrainData,
    setTerrainZExtrema,
  });

  useEdgeClampEffect({
    planeRef,
    edgeClampRadius,
  });

  // Get spatial index
  const spatialIndex = useSpatialIndex(planeRef);

  // Initialize terrain system when geometry is ready
  useEffect(() => {
    if (!planeRef.current || !spatialIndex) return;
    terrainSystem.current = new TerrainSystem(planeRef.current.geometry, spatialIndex);
  }, [planeRef.current, spatialIndex]);

  /**
   * Set up the material for the terrain
   */
  const oceanLand = t.Fn(({ position, colour }) => {
    const gradient = t.oneMinus(t.dot(t.normalGeometry, t.vec3(0, 0, 1))); // 0.0 flat, 1.0 steep
    const waterLevel = 0.02;
    const height = t.positionGeometry.z;
    const level1 = t.smoothstep(0, waterLevel, t.mul(height, t.pow(gradient, 0.01)));
    const shorelineColor = t.color("burlywood");
    const level1Mix = t.mix(shorelineColor, t.color(colour), t.step(0.8, level1));
    return t.vec4(level1Mix, t.step(waterLevel, level1));
  });

  const terrainMaterialConfig = useControls("Terrain Material", {
    color: {
      value: "#246913",
      onChange: v => {
        if (materialRef.current) {
          materialRef.current.colorNode = oceanLand({ position: t.positionGeometry, colour: v });
          materialRef.current.needsUpdate = true;
        }
      },
      transient: false,
    },
  });

  useEffect(() => {
    const material = new THREE.MeshStandardNodeMaterial({
      transparent: true,
      wireframe,
    });

    materialRef.current = material;
    material.colorNode = oceanLand({ position: t.positionGeometry, colour: terrainMaterialConfig.color });
  }, [wireframe, islandStoreHydrated, terrainMaterialConfig.color]);

  /**
   * Update terrain on undo/redo
   */
  useEffect(() => {
    if (!planeRef.current) return;

    const positions = planeRef.current.geometry.attributes.position.array;
    const terrainData = getTerrainData();

    if (terrainData.length > 0) {
      // Apply from store
      for (let i = 0; i < positions.length; i++) {
        positions[i] = terrainData[i];
      }

      // Update geometry
      planeRef.current.geometry.attributes.position.needsUpdate = true;
      planeRef.current.geometry.computeVertexNormals();
    }
  }, [useHistoryStoreUndo, useHistoryStoreRedo, terrainGeomAttrsPosArr]);

  /**
   * Handle pointer up - store state in history
   */
  useEffect(() => {
    if (!pointerDown && brushing && planeRef.current) {
      setBrushing(false);

      // Store current terrain in history
      const currentTerrain = planeRef.current.geometry.attributes.position.array;
      setTerrainGeomAttrsPosArr(currentTerrain);

      // Update extrema
      const extrema = findZExtrema(currentTerrain);
      setTerrainZExtrema(extrema);
    }
  }, [pointerDown]);

  /**
   * Apply brush on pointer move
   */
  useFrame(({ raycaster }) => {
    if (pointerDown && editMode && sculpt.active && terrainSystem.current) {
      setBrushing(true);
      const intersection = raycaster.intersectObject(planeRef.current);

      if (intersection.length > 0) {
        const uv = intersection[0].uv;
        mousePos.current.set(uv.x, uv.y);
        const brushSettings = {
          mode: sculpt.mode,
          brushSize: sculpt.brushSize,
          brushStrength: sculpt.brushStrength,
        };
        terrainSystem.current.applyBrush(uv.x, uv.y, brushSettings);
        // console.log("Applying brush at", uv.x, uv.y, brushSettings);
      }
    }
  });

  /**
   * Set cursor style based on mode
   */
  useEffect(() => {
    document.body.style.cursor = editMode && sculpt.active ? "crosshair" : "grab";
    return () => {
      document.body.style.cursor = "default";
    };
  }, [editMode, sculpt.active]);

  return (
    <Plane ref={planeRef} args={[2, 2, TERRAIN_RESOLUTION, TERRAIN_RESOLUTION]} rotation={[-Math.PI * 0.5, 0, 0]} {...props}>
      {materialRef.current && <primitive object={materialRef.current} />}
    </Plane>
  );
}
