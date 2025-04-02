import * as THREE from "three/webgpu";
import React, { useEffect, useRef, useState } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import GeometryTerrainEditor from "./components/GeometryTerrainEditor";
import useStore from "./stores/useStore";

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

const App = () => {
  const { sculptMode } = useStore();

  useEffect(() => {
    console.log(`Sculpt Mode: ${sculptMode ? "Enabled" : "Disabled"}`);
  }, [sculptMode]);

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
      <ToggleableOrbitControls enabled={!sculptMode} />
    </Canvas>
  );
};

export default App;
