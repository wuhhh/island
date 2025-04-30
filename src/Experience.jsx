import { Canvas, extend } from "@react-three/fiber";
import * as THREE from "three/webgpu";

import CameraController from "./components/CameraController";
import Grid from "./components/Grid";
import IslandEditorUI from "./components/IslandEditorUI";
import Ocean from "./components/Ocean";
import Terrain from "./components/Terrain";
import { useKeyboardManager } from "./hooks/useKeyboardManager";
import { CAMERA_POSITION, CAMERA_TARGET, useIslandStore } from "./stores/useIslandStore";
import DecorSystem from "./systems/DecorSystem";

extend(THREE);

const Scene = () => {
  const editMode = useIslandStore(state => state.editMode);

  return (
    <>
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
      <Terrain renderOrder={1} position={[0, 0, 0]} />
      <DecorSystem />
      <Ocean args={[6, 0, 6]} position={[0, -0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} resolution={1} />
      <directionalLight position={[5, 2, 1]} intensity={2} color='red' />
      <directionalLight position={[1, 2, -1]} intensity={2} color='pink' />
      <directionalLight position={[-1, 2, -1]} intensity={2} color='orange' />
      <directionalLight position={[-0.1, 2, 1]} intensity={2} color='yellow' shadow-mapSize={1024} shadow-bias={0.001} castShadow />
      <ambientLight intensity={1.2} />
      <CameraController />
    </>
  );
};

const Experience = () => {
  useKeyboardManager();

  const { setPointerDown } = useIslandStore(state => state.actions);

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
      <IslandEditorUI />
    </>
  );
};

export default Experience;
