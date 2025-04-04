import * as THREE from "three/webgpu";
import React, { useEffect, useRef } from "react";
import { Canvas, extend } from "@react-three/fiber";
import CustomCameraControls from "./components/CustomCameraControls";
import GeometryTerrainEditor from "./components/GeometryTerrainEditor";
import { useIslandStore } from "./stores/useIslandStore";

extend(THREE);

const Experience = () => {
  const { sculptMode } = useIslandStore();

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
      <CustomCameraControls
        enabled={!sculptMode}
        makeDefaultRotation={true} // Now dragging pans, shift+drag rotates
      />
    </Canvas>
  );
};

export default Experience;
