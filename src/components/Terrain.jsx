import * as THREE from "three/webgpu";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Plane } from "@react-three/drei";
import { useControls, button } from "leva";
import { TERRAIN_RESOLUTION, useIslandStore, useIslandHydration } from "../stores/useIslandStore";
import { useHistoryStore, useHistoryHydration } from "../stores/useHistoryStore";
import * as t from "three/tsl";

import { useTerrainInitialization, useEdgeClampEffect, useKeyboardControls, useSpatialIndex } from "../hooks/useTerrainEffects";
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
  const { pointerDown, sculptMode, wireframe, actions } = useIslandStore();
  const { setSculptMode, setWireframe } = actions;
  const islandStoreHydrated = useIslandHydration();
  const historyStoreHydrated = useHistoryHydration();

  // Local state
  const [brushing, setBrushing] = useState(false);
  const brushSettings = useRef({
    radius: 0.16,
    strength: 0.04,
    mode: 1,
  });

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

  // Use keyboard controls
  useKeyboardControls({
    sculptMode,
    setSculptMode,
    wireframe,
    setWireframe,
    brushSettings,
    resetTerrain: () => {
      terrainSystem.current?.resetTerrain();
      useHistoryStoreClear();
      setTerrainGeomAttrsPosArr(planeRef.current.geometry.attributes.position.array);
      console.log("Terrain reset and history cleared");
    },
    materialRef,
    useHistoryStoreUndo,
    useHistoryStoreRedo,
  });

  // Add brush controls to Leva
  useControls("Brush Settings", {
    radius: {
      value: 0.16,
      min: 0.02,
      max: 0.5,
      step: 0.01,
      onChange: v => {
        brushSettings.current.radius = v;
      },
    },
    strength: {
      value: 0.04,
      min: 0.01,
      max: 0.2,
      step: 0.01,
      onChange: v => {
        brushSettings.current.strength = v;
      },
    },
    sculptMode: {
      value: sculptMode,
      label: "Sculpt Mode",
      onChange: v => setSculptMode(v),
    },
    terrainVisible: {
      value: true,
      label: "Terrain Visible",
      onChange: v => {
        planeRef.current.visible = v;
        planeRef.current.material.visible = v;
      },
    },
  });

  // Add keyboard shortcuts info to Leva
  useControls(
    "Keyboard Shortcuts",
    {
      tab: { value: "Toggle Sculpt Mode", editable: false },
      w: { value: "Toggle Wireframe", editable: false },
      brackets: { value: "[ ] Adjust Brush Size", editable: false },
      minusEquals: { value: "- = Adjust Strength", editable: false },
      shift: { value: "Hold to Lower Terrain", editable: false },
      R: { value: "Reset Terrain", editable: false },
    },
    { collapsed: true }
  );

  /**
   * Set up the material for the terrain
   */
  const oceanLand = t.Fn(({ position, colour }) => {
    return t.vec4(t.color(colour), t.step(0.02, position.z));
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
    if (pointerDown && sculptMode && terrainSystem.current) {
      setBrushing(true);
      const intersection = raycaster.intersectObject(planeRef.current);

      if (intersection.length > 0) {
        const uv = intersection[0].uv;
        mousePos.current.set(uv.x, uv.y);
        terrainSystem.current.applyBrush(uv.x, uv.y, brushSettings.current);
      }
    }
  });

  /**
   * Set cursor style based on mode
   */
  useEffect(() => {
    document.body.style.cursor = sculptMode ? "crosshair" : "grab";
    return () => {
      document.body.style.cursor = "default";
    };
  }, [sculptMode]);

  return (
    <Plane ref={planeRef} args={[2, 2, TERRAIN_RESOLUTION, TERRAIN_RESOLUTION]} rotation={[-Math.PI * 0.5, 0, 0]} {...props}>
      {materialRef.current && <primitive object={materialRef.current} />}
    </Plane>
  );
}
