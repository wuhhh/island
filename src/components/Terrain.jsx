import { Plane } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useMemo } from "react";
import * as t from "three/tsl";
import * as THREE from "three/webgpu";

import { useTerrainInitialization, useEdgeClampEffect, useSpatialIndex } from "../hooks/useTerrainEffects";
import { useHistoryStore, useHistoryHydration } from "../stores/useHistoryStore";
import { TERRAIN_RESOLUTION, useIslandStore } from "../stores/useIslandStore";
import { TerrainSystem } from "../systems/TerrainSystem";
import { findZExtrema } from "../utils/terrainUtils";

export default function Terrain({ ...props }) {
  // Refs
  const planeRef = useRef();
  const mousePos = useRef(new THREE.Vector2(0.5, 0.5));
  const brushingRef = useRef(false);

  // Minimal subscriptions for rendering
  const wireframe = useIslandStore(state => state.wireframe);
  const editMode = useIslandStore(state => state.editMode);
  const sculptActive = useIslandStore(state => state.sculpt.active);
  const historyStoreHydrated = useHistoryHydration();

  // Store values in ref to avoid re-renders
  const storeRef = useRef({
    activeTool: useIslandStore.getState().activeTool,
    pointerDown: useIslandStore.getState().pointerDown,
    sculpt: useIslandStore.getState().sculpt,
    terrainSystem: useIslandStore.getState().terrainSystem,
    terrainGeomAttrsPosArr: useHistoryStore.getState().terrainGeomAttrsPosArr,
  });

  // Store functions for use in effects
  const setTerrainSystem = useIslandStore(state => state.actions.setTerrainSystem);
  const setTerrainGeomAttrsPosArr = useHistoryStore(state => state.setTerrainGeomAttrsPosArr);
  const setTerrainZExtrema = useIslandStore(state => state.actions.setTerrainZExtrema);
  const getTerrainData = useHistoryStore(state => state.getTerrainData);

  // Use custom hooks
  useTerrainInitialization({
    planeRef,
    historyStoreHydrated,
    getTerrainData,
    setTerrainZExtrema,
  });

  useEdgeClampEffect({
    planeRef,
    edgeClampRadius: 0.1,
  });

  // Get spatial index
  const spatialIndex = useSpatialIndex(planeRef);

  // Initialize terrain system when geometry is ready
  useEffect(() => {
    if (!planeRef.current || !spatialIndex) return;
    const system = new TerrainSystem(planeRef.current, spatialIndex);
    setTerrainSystem(system);
    storeRef.current.terrainSystem = system;
  }, [setTerrainSystem, spatialIndex]);

  /**
   * Set up the material for the terrain
   */
  const oceanLand = t.Fn(({ colour }) => {
    const gradient = t.oneMinus(t.dot(t.normalGeometry, t.vec3(0, 0, 1))); // 0.0 flat, 1.0 steep
    const waterLevel = 0.02;
    const height = t.positionGeometry.z;
    const level1 = t.smoothstep(0, waterLevel, t.mul(height, t.pow(gradient, 0.01)));
    const shorelineColor = t.color("burlywood");
    const level1Mix = t.mix(shorelineColor, t.color(colour), t.step(0.8, level1));
    return t.vec4(level1Mix, t.step(waterLevel, level1));
  });

  // Memoize material creation
  const material = useMemo(() => {
    const material = new THREE.MeshStandardNodeMaterial({
      transparent: true,
      wireframe,
    });
    // Interesting...
    // material.normalNode = t.normalView.add(t.mx_fractal_noise_float(t.positionGeometry.mul(0)).mul(0.25).sub(0.5));
    material.colorNode = oceanLand({ position: t.positionGeometry, colour: "#246913" });
    return material;
  }, [wireframe, oceanLand]);

  /**
   * Subscribe to store changes without causing re-renders
   */
  useEffect(() => {
    // Island store subscription
    const unsubscribe = useIslandStore.subscribe(
      state => ({
        activeTool: state.activeTool,
        pointerDown: state.pointerDown,
        sculpt: state.sculpt,
        terrainSystem: state.terrainSystem,
      }),
      newState => {
        const prevPointerDown = storeRef.current.pointerDown;

        // Update ref with new values
        storeRef.current = {
          ...storeRef.current,
          activeTool: newState.activeTool,
          pointerDown: newState.pointerDown,
          sculpt: newState.sculpt,
          terrainSystem: newState.terrainSystem,
        };

        // Handle pointer up logic directly here
        if (prevPointerDown && !newState.pointerDown && brushingRef.current && planeRef.current) {
          brushingRef.current = false;

          // Store current terrain in history
          const currentTerrain = planeRef.current.geometry.attributes.position.array;
          setTerrainGeomAttrsPosArr(currentTerrain);

          // Update extrema
          const extrema = findZExtrema(currentTerrain);
          setTerrainZExtrema(extrema);
        }
      }
    );

    // History store subscription for undo/redo
    const historyUnsubscribe = useHistoryStore.subscribe(
      state => state.terrainGeomAttrsPosArr,
      terrainGeomAttrsPosArr => {
        storeRef.current.terrainGeomAttrsPosArr = terrainGeomAttrsPosArr;

        // Update terrain on change
        if (planeRef.current) {
          const positions = planeRef.current.geometry.attributes.position.array;

          if (terrainGeomAttrsPosArr.length > 0) {
            // Apply from store
            for (let i = 0; i < positions.length; i++) {
              positions[i] = terrainGeomAttrsPosArr[i];
            }

            // Update geometry
            planeRef.current.geometry.attributes.position.needsUpdate = true;
            planeRef.current.geometry.computeVertexNormals();
          }
        }
      }
    );

    return () => {
      unsubscribe();
      historyUnsubscribe();
    };
  }, [setTerrainGeomAttrsPosArr, setTerrainZExtrema, getTerrainData]);

  /**
   * Set cursor style based on mode
   */
  useEffect(() => {
    document.body.style.cursor = editMode && sculptActive ? "crosshair" : "grab";
    return () => {
      document.body.style.cursor = "default";
    };
  }, [editMode, sculptActive]);

  /**
   * Apply brush on pointer move
   */
  useFrame(({ raycaster }) => {
    const { pointerDown, activeTool, sculpt, terrainSystem } = storeRef.current;

    if (pointerDown && editMode && sculptActive && terrainSystem) {
      brushingRef.current = true;
      const intersection = raycaster.intersectObject(planeRef.current);

      if (intersection.length > 0) {
        const uv = intersection[0].uv;
        mousePos.current.set(uv.x, uv.y);
        const brushSettings = {
          activeTool,
          brushSize: sculpt.brushSize,
          brushStrength: sculpt.brushStrength,
        };
        terrainSystem.applyBrush(uv.x, uv.y, brushSettings);
      }
    }
  });

  return (
    <Plane ref={planeRef} args={[2, 2, TERRAIN_RESOLUTION, TERRAIN_RESOLUTION]} rotation={[-Math.PI * 0.5, 0, 0]} {...props} receiveShadow>
      {material && <primitive object={material} />}
    </Plane>
  );
}
