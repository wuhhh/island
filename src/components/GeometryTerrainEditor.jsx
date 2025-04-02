import * as THREE from "three/webgpu";
import React, { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Html, Plane } from "@react-three/drei";
import useStore from "../stores/useStore";

export default function GeometryTerrainEditor() {
  const planeSubdivisions = useStore(state => state.planeSubdivisions);
  const [pointerDown, setPointerDown] = useState(false);
  const { persisted, actions } = useStore();
  const { wireframe } = persisted;
  const setWireframe = actions.setWireframe;
  const { sculptMode, setSculptMode } = useStore();
  const planeRef = useRef();
  const materialRef = useRef();
  const mousePos = useRef(new THREE.Vector2(0.5, 0.5));
  const [edgeClampRadius, setEdgeClampRadius] = useState(0.1); // Configurable edge clamp radius
  const [showControls, setShowControls] = useState(true); // Toggle for UI controls

  // Brush settings with default values
  const brushSettings = useRef({
    radius: 0.1,
    strength: 0.01,
    mode: 1, // 1 for raise, -1 for lower
  });

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

  // Add keyboard controls for brush settings and mode toggle
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

      // H key to toggle UI controls
      if (e.key === "h" || e.key === "H") {
        setShowControls(!showControls);
      }

      // R key to reset terrain
      if (e.key === "r" || e.key === "R") {
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
  }, [sculptMode, showControls]);

  // Create a compatible material for WebGPU
  useEffect(() => {
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true, // Set vertex colors based on height
      // flatShading: true,
      wireframe,
    });

    materialRef.current = material;

    // Function to update vertex colors based on height
    const updateColors = () => {
      if (!planeRef.current) return;

      const geometry = planeRef.current.geometry;
      const positions = geometry.attributes.position.array;

      // Find min and max height
      let minHeight = Infinity;
      let maxHeight = -Infinity;

      for (let i = 0; i < positions.length; i += 3) {
        const height = positions[i + 2]; // z is height
        minHeight = Math.min(minHeight, height);
        maxHeight = Math.max(maxHeight, height);
      }

      // Add padding to range
      const padding = (maxHeight - minHeight) * 0.1;
      const effectiveMin = minHeight - padding;
      const effectiveMax = maxHeight + padding;

      // Create color attribute if it doesn't exist
      if (!geometry.attributes.color) {
        const colors = new Float32Array(positions.length);
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      }

      const colors = geometry.attributes.color.array;

      // Color palette
      const deepColor = new THREE.Color(0x2c3e50);
      const lowColor = new THREE.Color(0x3498db);
      const midColor = new THREE.Color(0x27ae60);
      const highColor = new THREE.Color(0xf1c40f);
      const peakColor = new THREE.Color(0xe74c3c);
      const topColor = new THREE.Color(0xecf0f1);

      // Set color for each vertex based on height
      for (let i = 0; i < positions.length; i += 3) {
        const height = positions[i + 2];

        // Normalize height to 0-1 range
        const t = Math.max(0, Math.min(1, (height - effectiveMin) / (effectiveMax - effectiveMin)));

        let color = new THREE.Color();

        // Color gradient logic
        if (t < 0.2) {
          color.lerpColors(deepColor, lowColor, t / 0.2);
        } else if (t < 0.4) {
          color.lerpColors(lowColor, midColor, (t - 0.2) / 0.2);
        } else if (t < 0.7) {
          color.lerpColors(midColor, highColor, (t - 0.4) / 0.3);
        } else if (t < 0.9) {
          color.lerpColors(highColor, peakColor, (t - 0.7) / 0.2);
        } else {
          color.lerpColors(peakColor, topColor, (t - 0.9) / 0.1);
        }

        // Set RGB color values
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
      }

      // Mark colors for update
      geometry.attributes.color.needsUpdate = true;
    };

    // Initial color update
    updateColors();

    // Store the update function for later use
    materialRef.current.updateTerrainColors = updateColors;
  }, [wireframe]);

  // Improved brush application with spatial optimization and edge clamping
  const applyBrush = (x, y) => {
    if (!planeRef.current || !sculptMode) return;

    const { radius, strength, mode } = brushSettings.current;
    const geometry = planeRef.current.geometry;
    const positions = geometry.attributes.position.array;
    const uvs = geometry.attributes.uv.array;

    // We'll build a spatial index first - a mapping from UV regions to vertex indices
    // This is an initial implementation - for production, you'd want to build this once and reuse
    if (!planeRef.current.spatialIndex) {
      // Create a more efficient data structure that maps UV coordinates to vertices
      const verticesByUV = [];
      const gridSize = 20; // Number of cells to divide the UV space into (adjust based on performance needs)

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

      // Store the spatial index on the mesh for reuse
      planeRef.current.spatialIndex = { grid: verticesByUV, size: gridSize };
    }

    // Use the spatial index to efficiently find vertices within the brush radius
    const spatialIndex = planeRef.current.spatialIndex;
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

    // Update terrain colors if available
    if (materialRef.current && materialRef.current.updateTerrainColors) {
      materialRef.current.updateTerrainColors();
    }

    // For debugging
    // console.log(`Processed ${modifiedVertices.length} vertices instead of ${positions.length/3}`);
  };

  // Function to reset terrain to original flat state
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
    if (materialRef.current && materialRef.current.updateTerrainColors) {
      materialRef.current.updateTerrainColors();
    }
  };

  // Handle mouse events with better hit detection
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

  const handlePointerMove = e => {
    if (!pointerDown || !sculptMode) return;

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

  const { scene } = useThree();

  // Update the cursor based on the current mode
  useEffect(() => {
    document.body.style.cursor = sculptMode ? "crosshair" : "grab";

    // You could also add a visual indicator in the scene
    return () => {
      document.body.style.cursor = "default";
    };
  }, [sculptMode]);

  // Update terrain colors when geometry changes
  useEffect(() => {
    if (materialRef.current && materialRef.current.updateTerrainColors) {
      materialRef.current.updateTerrainColors();
    }
  }, [pointerDown]);

  return (
    <>
      <Plane
        ref={planeRef}
        args={[2, 2, planeSubdivisions, planeSubdivisions]} // Adjusted for better resolution
        rotation={[-Math.PI * 0.5, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setPointerDown(false)}
        onPointerLeave={() => setPointerDown(false)}
      >
        {materialRef.current && <primitive object={materialRef.current} />}
      </Plane>
      <directionalLight position={[-1, 1, 1]} />
      <ambientLight intensity={0.4} />

      {/* Optional UI controls */}
      {showControls && (
        <Html position={[-2, 0.5, 0]}>
          <div
            style={{
              background: "rgba(0,0,0,0.7)",
              padding: "10px",
              borderRadius: "5px",
              color: "white",
              width: "200px",
              fontFamily: "Arial, sans-serif",
            }}
          >
            <div style={{ marginBottom: "10px" }}>
              <strong>Edge Clamp Radius:</strong>
              <input
                type='range'
                min='0.05'
                max='0.4'
                step='0.01'
                value={edgeClampRadius}
                onChange={e => setEdgeClampRadius(parseFloat(e.target.value))}
                style={{ width: "100%" }}
              />
              <span>{edgeClampRadius.toFixed(2)}</span>
            </div>
            <button
              onClick={resetTerrain}
              style={{
                padding: "5px 10px",
                marginRight: "5px",
                background: "#3498db",
                border: "none",
                borderRadius: "3px",
                color: "white",
                cursor: "pointer",
              }}
            >
              Reset Terrain
            </button>
            <div style={{ marginTop: "10px", fontSize: "12px" }}>
              <div>[Tab] Toggle Sculpt Mode</div>
              <div>[W] Toggle Wireframe</div>
              <div>[[ ]] Adjust Brush Size</div>
              <div>[- =] Adjust Strength</div>
              <div>[Shift] Lower Terrain</div>
              <div>[R] Reset Terrain</div>
              <div>[H] Hide Controls</div>
            </div>
          </div>
        </Html>
      )}
    </>
  );
}
