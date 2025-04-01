import * as THREE from "three/webgpu";
import * as TSL from "three/tsl";
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

  // Create a basic material
  useEffect(() => {
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      wireframe: true,
    });

    materialRef.current = material;
  }, []);

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
        positions[i * 3 + 2] += strength * 0.2 * falloff * mode;
      }
    }

    // Mark geometry as needing update
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals(); // Recalculate normals
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
