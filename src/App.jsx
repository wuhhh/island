import * as THREE from "three/webgpu";
import React, { useEffect, useRef } from "react";
import { Canvas, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import GeometryTerrainEditor from "./components/GeometryTerrainEditor";
import { useStore } from "./stores/useStore";

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

const Experience = () => {
  const { sculptMode } = useStore();

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

export default Experience;
