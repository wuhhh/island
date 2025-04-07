import * as THREE from "three/webgpu";
import { useEffect, useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Plane } from "@react-three/drei";
import { useControls, button } from "leva";
import { TERRAIN_RESOLUTION, useIslandStore, useIslandHydration } from "../stores/useIslandStore";
import { useHistoryStore, useHistoryHydration } from "../stores/useHistoryStore";
import * as t from "three/tsl";

export default function GeometryTerrainEditor() {
  // Refs
  const planeRef = useRef();
  const materialRef = useRef();
  const mousePos = useRef(new THREE.Vector2(0.5, 0.5));

  // Store state
  const getTerrainData = useHistoryStore(state => state.getTerrainData);
  const terrainGeomAttrsPosArr = useHistoryStore(state => state.terrainGeomAttrsPosArr);
  const setTerrainGeomAttrsPosArr = useHistoryStore(state => state.setTerrainGeomAttrsPosArr);
  const { undo: useHistoryStoreUndo, redo: useHistoryStoreRedo, clear: useHistoryStoreClear } = useHistoryStore.temporal.getState();
  const { persisted, actions } = useIslandStore();
  const { wireframe } = persisted;
  const setWireframe = actions.setWireframe;
  const { sculptMode, setSculptMode } = useIslandStore();
  const islandStoreHydrated = useIslandHydration();
  const historyStoreHydrated = useHistoryHydration();

  // Local state
  const [brushing, setBrushing] = useState(false);
  const [pointerDown, setPointerDown] = useState(false);

  // Brush settings with default values
  const brushSettings = useRef({
    radius: 0.1,
    strength: 0.01,
    mode: 1, // 1 for raise, -1 for lower
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
    reset: button(() => resetTerrain(), {
      label: "Reset Terrain",
    }),
  });

  // Add brush controls to Leva
  useControls("Brush Settings", {
    radius: {
      value: 0.1,
      min: 0.02,
      max: 0.5,
      step: 0.01,
      onChange: v => {
        brushSettings.current.radius = v;
      },
    },
    strength: {
      value: 0.01,
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
   * Create a spatial index for the plane geometry
   * This allows for efficient vertex selection based on UV coordinates
   * and is particularly useful for brush operations.
   * The spatial index is a grid that maps UV coordinates to vertex indices.
   */
  const spatialIndex = useMemo(() => {
    if (!planeRef.current) return null;

    const geometry = planeRef.current.geometry;
    const positions = geometry.attributes.position.array;
    const uvs = geometry.attributes.uv.array;

    // Create a more efficient data structure that maps UV coordinates to vertices
    const verticesByUV = [];
    const gridSize = 20; // Number of cells to divide the UV space into

    // Initialize the spatial grid
    for (let i = 0; i < gridSize; i++) {
      verticesByUV[i] = [];
      for (let j = 0; j < gridSize; j++) {
        verticesByUV[i][j] = [];
      }
    }

    // Populate the grid with vertex indices
    for (let i = 0; i < positions.length / 3; i++) {
      const uvIndex = i * 2;
      const u = uvs[uvIndex];
      const v = uvs[uvIndex + 1];

      // Calculate which grid cell this vertex belongs to
      const gridU = Math.min(gridSize - 1, Math.floor(u * gridSize));
      const gridV = Math.min(gridSize - 1, Math.floor(v * gridSize));

      // Add this vertex to the appropriate cell
      verticesByUV[gridU][gridV].push(i);
    }

    return { grid: verticesByUV, size: gridSize };
  }, [planeRef.current?.geometry]); // Recalculate when geometry changes

  /**
   * Set the initial state of the plane
   */
  useEffect(() => {
    if (!historyStoreHydrated || !planeRef.current) return;

    // Get data from store as proper Float32Array
    const terrainData = getTerrainData();

    // console.log("Setting initial terrain data:", terrainData);
    // console.log("Terrain data length:", terrainData.length);

    if (terrainData.length > 0) {
      // Apply to geometry if we have valid data
      if (planeRef.current.geometry.attributes.position) {
        planeRef.current.geometry.attributes.position.array = terrainData;
        const geometry = planeRef.current.geometry;
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
      }
    } else {
      console.warn("No terrain data available to set.");
    }
  }, [historyStoreHydrated, getTerrainData]);

  /**
   * Edge clamping effect
   * Maintains the effect of terrain being an island
   * by clamping the edges based on distance from the center
   */
  useEffect(() => {
    if (!planeRef.current) return;

    const geometry = planeRef.current.geometry;

    // Recreate the edge weights whenever the clamp radius changes
    const positions = geometry.attributes.position.array;

    // Store original positions if not already stored
    if (!geometry.userData.originalPositions) {
      geometry.userData.originalPositions = new Float32Array(positions.length);
      for (let i = 0; i < positions.length; i++) {
        geometry.userData.originalPositions[i] = positions[i];
      }
    }

    // Store edge weights for each vertex
    geometry.userData.edgeWeights = new Float32Array(positions.length / 3);

    // Calculate the center of the plane
    const centerU = 0.5;
    const centerV = 0.5;

    // Calculate edge weights for each vertex with a smooth, non-linear falloff
    for (let i = 0; i < positions.length / 3; i++) {
      const uvIndex = i * 2;
      const uvs = geometry.attributes.uv.array;
      const uvX = uvs[uvIndex];
      const uvY = uvs[uvIndex + 1];

      // Calculate distance from center in UV space (0 to 0.5 range)
      const distX = Math.abs(uvX - centerU);
      const distY = Math.abs(uvY - centerV);

      // Use a smooth radial distance measure to avoid grid-aligned artifacts
      // This blends between max distance and Euclidean distance
      const maxDist = Math.max(distX, distY);
      const euclideanDist = Math.sqrt(distX * distX + distY * distY);
      const blendFactor = 0.7; // Adjust this to control the blend
      const distFromCenter = maxDist * blendFactor + euclideanDist * (1 - blendFactor);

      // Calculate normalized distance from edge (1 at center, 0 at edge)
      // Using 0.5 as this is the half-width of the plane in UV space
      const distFromEdge = 0.5 - distFromCenter;

      // Apply a smooth sigmoid-like function for gradual falloff
      // This creates a much smoother transition than linear interpolation
      let edgeWeight;

      if (distFromEdge <= 0) {
        // Beyond the edge, fully clamped
        edgeWeight = 0;
      } else if (distFromEdge >= edgeClampRadius) {
        // Well inside the sculptable region, no clamping
        edgeWeight = 1;
      } else {
        // In the transition zone, apply a smooth easing function
        // Using smoothstep for a gentler, more natural transition
        const t = distFromEdge / edgeClampRadius;

        // Smoothstep function: 3t² - 2t³ (classic smoothstep)
        // This creates an S-curve with smooth derivative at endpoints
        // edgeWeight = t * t * (3 - 2 * t);

        // For even smoother transition, can use smootherstep: 6t⁵ - 15t⁴ + 10t³
        edgeWeight = t * t * t * (t * (t * 6 - 15) + 10);
      }

      // Store the weight
      geometry.userData.edgeWeights[i] = edgeWeight;
    }

    // Optionally, visualize the weights as colors for debugging
    if (false) {
      // Set to true to enable visualization
      if (!geometry.attributes.color) {
        const colors = new Float32Array(positions.length);
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      }

      const colors = geometry.attributes.color.array;
      for (let i = 0; i < positions.length / 3; i++) {
        const weight = geometry.userData.edgeWeights[i];
        colors[i * 3] = weight; // Red channel
        colors[i * 3 + 1] = weight; // Green channel
        colors[i * 3 + 2] = weight; // Blue channel
      }

      geometry.attributes.color.needsUpdate = true;
    }
  }, [edgeClampRadius]);

  /**
   * Add keyboard controls for brush settings and mode toggle
   * - Tab: Toggle between sculpt mode and camera control
   * - W: Toggle wireframe mode
   * - Shift: Lower terrain instead of raising
   * - [ ]: Adjust brush size
   * - - =: Adjust brush strength
   * - R: Reset terrain
   */
  useEffect(() => {
    const handleKeyDown = e => {
      // Toggle between edit mode and camera control mode with Tab key
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

      // Shift key to lower terrain instead of raising
      if (e.key === "Shift") {
        brushSettings.current.mode = -1;
        console.log("Lowering terrain");
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
  }, [sculptMode, wireframe, setWireframe, setSculptMode]);

  /**
   * Set up the material for the terrain
   */
  const oceanLand = t.Fn(({ position, colour }) => {
    // return vec4(color(colour), step(0.0, position.z));
    return t.vec4(t.color(colour), 1);
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
      // flatShading: true,
      transparent: true,
      wireframe,
    });

    materialRef.current = material;

    console.log(terrainMaterialConfig, "<= material color");

    // Apply the material
    material.colorNode = oceanLand({ position: t.positionGeometry, colour: terrainMaterialConfig.color });
  }, [wireframe, islandStoreHydrated, terrainMaterialConfig.color]);

  /**
   * Apply brush effect to the terrain
   * - Uses a spatial index for efficient vertex selection
   * - Applies height changes based on brush settings
   * - Uses a smooth quadratic falloff for brush effect
   */
  const applyBrush = (x, y) => {
    if (!planeRef.current || !sculptMode) return;

    const { radius, strength, mode } = brushSettings.current;
    const geometry = planeRef.current.geometry;
    const positions = geometry.attributes.position.array;
    const uvs = geometry.attributes.uv.array;

    // Use the spatial index to efficiently find vertices within the brush radius
    // const spatialIndex = planeRef.current.spatialIndex;
    const modifiedVertices = [];

    // Calculate which grid cells the brush overlaps
    const brushRadiusInGrid = Math.ceil(radius * spatialIndex.size);
    const centerU = Math.floor(x * spatialIndex.size);
    const centerV = Math.floor(y * spatialIndex.size);

    // Determine the grid cells to check, clamping to valid grid indices
    const startU = Math.max(0, centerU - brushRadiusInGrid);
    const endU = Math.min(spatialIndex.size - 1, centerU + brushRadiusInGrid);
    const startV = Math.max(0, centerV - brushRadiusInGrid);
    const endV = Math.min(spatialIndex.size - 1, centerV + brushRadiusInGrid);

    // Check each vertex in the overlapped grid cells
    for (let gridU = startU; gridU <= endU; gridU++) {
      for (let gridV = startV; gridV <= endV; gridV++) {
        // Get all vertices in this grid cell
        const verticesInCell = spatialIndex.grid[gridU][gridV];

        // Check each vertex in the cell
        for (let i = 0; i < verticesInCell.length; i++) {
          const vertexIndex = verticesInCell[i];
          const uvIndex = vertexIndex * 2;

          // Get the actual UV coordinates
          const uvX = uvs[uvIndex];
          const uvY = uvs[uvIndex + 1];

          // Calculate distance from brush center in UV space
          const dx = uvX - x;
          const dy = uvY - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Apply brush with falloff if within radius
          if (dist <= radius) {
            // Get the edge weight for this vertex (0 = fully clamped at edge, 1 = fully modifiable)
            const edgeWeight = geometry.userData.edgeWeights[vertexIndex];

            // Skip if completely clamped
            if (edgeWeight <= 0) continue;

            // Use a smooth quadratic falloff for more natural brush shape
            const falloff = Math.pow(1.0 - dist / radius, 2);

            // Apply the height change with the current mode, scaled by edge weight
            const posIndex = vertexIndex * 3 + 2; // z component

            // Set the new height
            positions[posIndex] += strength * 0.5 * falloff * mode * edgeWeight;

            // Track the modified vertex
            modifiedVertices.push(vertexIndex);
          }
        }
      }
    }

    // Mark the position attribute as needing update
    geometry.attributes.position.needsUpdate = true;

    // Recalculate normals
    geometry.computeVertexNormals();

    // For debugging
    console.log(`Processed ${modifiedVertices.length} vertices instead of ${positions.length / 3}`);
  };

  /**
   * resetTerrain
   */
  const resetTerrain = () => {
    if (!planeRef.current) return;

    const geometry = planeRef.current.geometry;

    // Skip if no original positions were stored
    if (!geometry.userData.originalPositions) return;

    // Get the current positions array
    const positions = geometry.attributes.position.array;

    // Restore original positions
    for (let i = 0; i < positions.length; i++) {
      positions[i] = geometry.userData.originalPositions[i];
    }

    // Mark positions for update
    geometry.attributes.position.needsUpdate = true;

    // Update normals and colors
    geometry.computeVertexNormals();

    // Clear the history store
    useHistoryStoreClear();
    setTerrainGeomAttrsPosArr(geometry.attributes.position.array);
    console.log("Terrain reset and history cleared");
  };

  /**
   * useEffect to update terrain on undo / redo
   */
  useEffect(() => {
    if (!planeRef.current) return;

    // Get the current positions array
    const positions = planeRef.current.geometry.attributes.position.array;

    // Restore the terrain data from the store
    const terrainData = getTerrainData();

    // Apply to geometry if we have valid data
    if (terrainData.length > 0) {
      for (let i = 0; i < positions.length; i++) {
        positions[i] = terrainData[i];
      }

      // Mark positions for update
      planeRef.current.geometry.attributes.position.needsUpdate = true;
      planeRef.current.geometry.computeVertexNormals();
    }
  }, [useHistoryStoreUndo, useHistoryStoreRedo, terrainGeomAttrsPosArr]);

  /**
   * handlePointerDown
   */
  const handlePointerDown = e => {
    if (!sculptMode) return;

    setPointerDown(true);
    if (e.intersections && e.intersections.length > 0) {
      // Find the intersection with our plane
      const intersection = e.intersections.find(i => i.object === planeRef.current);
      if (intersection) {
        const uv = intersection.uv;
        mousePos.current.set(uv.x, uv.y);
        applyBrush(uv.x, uv.y);
      }
    }
  };

  /**
   * handlePointerUp
   */
  const handlePointerUp = e => {
    console.log("Pointer up");

    setPointerDown(false);

    if (brushing) {
      setBrushing(false);

      // Store the current terrain state in the history store
      const currentTerrain = planeRef.current.geometry.attributes.position.array;
      setTerrainGeomAttrsPosArr(currentTerrain);
    }
  };

  /**
   * handlePointerMove
   * - Apply brush effect if pointer is down
   */
  const handlePointerMove = e => {
    if (!pointerDown || !sculptMode) return;

    if (e.intersections && e.intersections.length > 0) {
      // Find the intersection with our plane
      const intersection = e.intersections.find(i => i.object === planeRef.current);
      if (intersection) {
        setBrushing(true);
        const uv = intersection.uv;
        mousePos.current.set(uv.x, uv.y);
        applyBrush(uv.x, uv.y);
      }
    }
  };

  /**
   * useEffect to set cursor style
   */
  useEffect(() => {
    document.body.style.cursor = sculptMode ? "crosshair" : "grab";

    // You could also add a visual indicator in the scene
    return () => {
      document.body.style.cursor = "default";
    };
  }, [sculptMode]);

  return (
    <Plane
      ref={planeRef}
      args={[2, 2, TERRAIN_RESOLUTION, TERRAIN_RESOLUTION]}
      rotation={[-Math.PI * 0.5, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => setPointerDown(false)}
    >
      {materialRef.current && <primitive object={materialRef.current} />}
    </Plane>
  );
}
