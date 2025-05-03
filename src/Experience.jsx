import { Loader } from "@react-three/drei";
import { Canvas, extend } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import * as THREE from "three/webgpu";

import CameraController from "./components/CameraController";
import Grid from "./components/Grid";
import Ocean from "./components/Ocean";
import Terrain from "./components/Terrain";
import UserInterface from "./components/UserInterface.jsx";
import { useKeyboardManager } from "./hooks/useKeyboardManager";
import { CAMERA_POSITION, CAMERA_TARGET, useIslandStore } from "./stores/useIslandStore";
import DecorSystem from "./systems/DecorSystem";
import { loadSnapshotFromPath } from "./utils/islandSnapshot.js";

extend(THREE);

const Scene = () => {
  const editMode = useIslandStore(state => state.editMode);

  return (
    <>
      <Suspense fallback={null}>
        <Grid
          visible={editMode}
          args={[2, 2]}
          position={[0, 0.001, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          gridSize={20}
          lineWidth={2}
          gridAlpha={0.1}
          lineColor='cyan'
        />
        <Terrain position={[0, 0, 0]} />
        <DecorSystem />
        <Ocean args={[6, 0, 6]} position={[0, -0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} resolution={1} />
        <group rotation={[0, Math.PI, 0]}>
          <directionalLight position={[0.25, 0.1, 0.25]} intensity={1.5} color='red' />
          <directionalLight position={[0.25, 0.1, -0.25]} intensity={1.5} color='pink' />
          <directionalLight position={[-0.25, 0.1, -0.25]} intensity={1.5} color='orange' />
          <directionalLight position={[-0.05, 10, 2]} intensity={1.5} color='yellow' shadow-mapSize={1024} shadow-bias={0.001} castShadow />
        </group>
        <ambientLight intensity={2} />
        <CameraController />
      </Suspense>
    </>
  );
};

const Experience = () => {
  useKeyboardManager();

  const snapshotId = useIslandStore(state => state.persisted.snapshotId);
  const { setPointerDown } = useIslandStore(state => state.actions);

  useEffect(() => {
    if (!snapshotId) {
      const defaultIslandPath = "/island/snapshots/default.json"; // Replace with your actual path
      loadSnapshotFromPath(defaultIslandPath).catch(error => {
        new Error("Error loading default island:", error);
      });
    }
  }, [snapshotId]);

  return (
    <>
      <Canvas
        shadows
        gl={async props => {
          const renderer = new THREE.WebGPURenderer(props);
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          await renderer.init();
          return renderer;
        }}
        camera={{ fov: 35, position: CAMERA_POSITION, target: CAMERA_TARGET }}
        onPointerDown={() => setPointerDown(true)}
        onPointerUp={() => setPointerDown(false)}
      >
        <Scene />
      </Canvas>
      <UserInterface />
      <Loader />
    </>
  );
};

export default Experience;
