import * as THREE from "three/webgpu";
import React, { useEffect, useRef, useState } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { Plane, OrbitControls } from "@react-three/drei";

extend(THREE);

// Custom OrbitControls that can be enabled/disabled
const ToggleableOrbitControls = ({ enabled }) => {
  const controlsRef = useRef();

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = enabled;
    }
  }, [enabled]);

  return <OrbitControls ref={controlsRef} />;
};

const GeometryTerrainEditor = () => {
  const [pointerDown, setPointerDown] = useState(false);
  const [editMode, setEditMode] = useState(true); // Start in edit mode
  const [showWireframe, setShowWireframe] = useState(true); // Toggle for wireframe display
  const planeRef = useRef();
  const materialRef = useRef();
  const mousePos = useRef(new THREE.Vector2(0.5, 0.5));

  // Brush settings with default values
  const brushSettings = useRef({
    radius: 0.1,
    strength: 0.01,
    mode: 1, // 1 for raise, -1 for lower
  });

  // Add keyboard controls for brush settings and mode toggle
  useEffect(() => {
    const handleKeyDown = e => {
      // Toggle between edit mode and camera control mode with Tab key
      if (e.key === "Tab") {
        e.preventDefault(); // Prevent the tab from changing focus
        setEditMode(prev => !prev);
        console.log(`Mode: ${!editMode ? "Sculpting" : "Camera Control"}`);
      }

      // Toggle wireframe with W key
      if (e.key === "w" || e.key === "W") {
        setShowWireframe(prev => !prev);
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
  }, [editMode]);

  // Create a compatible material for WebGPU
  useEffect(() => {
    // For WebGPU, we'll use MeshPhongMaterial and adjust its appearance based on height
    const material = new THREE.MeshPhongMaterial({
      vertexColors: true, // We'll set vertex colors based on height
      wireframe: showWireframe,
      shininess: 30,
      specular: 0x111111,
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
  }, [showWireframe]);

  // Improved brush application with proper distance calculation and settings
  const applyBrush = (x, y) => {
    if (!planeRef.current || !editMode) return;

    const { radius, strength, mode } = brushSettings.current;

    const geometry = planeRef.current.geometry;
    const positions = geometry.attributes.position.array;
    const uvs = geometry.attributes.uv.array;
    const count = positions.length / 3;

    // Loop through each vertex
    for (let i = 0; i < count; i++) {
      // Get the actual UV coordinates from the geometry
      const uvIndex = i * 2;
      const uvX = uvs[uvIndex];
      const uvY = uvs[uvIndex + 1];

      // Calculate distance from brush in UV space
      const dx = uvX - x;
      const dy = uvY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Apply brush with falloff if within radius
      if (dist <= radius) {
        // Use a smooth quadratic falloff for more natural brush shape
        const falloff = Math.pow(1.0 - dist / radius, 2);

        // Apply the height change with the current mode (raise or lower)
        positions[i * 3 + 2] += strength * falloff * mode;
      }
    }

    // Mark geometry as needing update
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals(); // Recalculate normals

    // Update terrain colors if available
    if (materialRef.current && materialRef.current.updateTerrainColors) {
      materialRef.current.updateTerrainColors();
    }
  };

  // Handle mouse events with better hit detection
  const handlePointerDown = e => {
    if (!editMode) return;

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
    if (!pointerDown || !editMode) return;

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
    document.body.style.cursor = editMode ? "crosshair" : "grab";

    // You could also add a visual indicator in the scene
    return () => {
      document.body.style.cursor = "default";
    };
  }, [editMode]);

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
        args={[2, 2, 64, 64]}
        rotation={[-Math.PI * 0.5, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setPointerDown(false)}
        onPointerLeave={() => setPointerDown(false)}
      >
        {materialRef.current && <primitive object={materialRef.current} />}
      </Plane>
      <directionalLight position={[1, 1, 1]} />
      <ambientLight intensity={0.4} />
      <ToggleableOrbitControls enabled={!editMode} />

      {/* Optional: Visual mode indicator */}
      <mesh position={[0.9, 0.9, 0]} scale={0.05}>
        <sphereGeometry />
        <meshBasicMaterial color={editMode ? "red" : "green"} />
      </mesh>
    </>
  );
};

const App = () => {
  return (
    <Canvas
      gl={async props => {
        const renderer = new THREE.WebGPURenderer(props);
        await renderer.init();
        return renderer;
      }}
      camera={{ fov: 35, position: [1, 1, 2] }}
    >
      <GeometryTerrainEditor />
    </Canvas>
  );
};

export default App;
