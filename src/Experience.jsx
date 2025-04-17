import * as THREE from "three/webgpu";
import { Canvas, extend } from "@react-three/fiber";
import Ocean from "./components/Ocean";
import Grid from "./components/Grid";
import CameraController from "./components/CameraController";
import Terrain from "./components/Terrain";
import ShoreLine from "./components/ShoreLine";
import { CAMERA_POSITION, CAMERA_TARGET, useIslandStore } from "./stores/useIslandStore";
import { Leva } from "leva";

extend(THREE);

const Scene = () => {
  const sculptMode = useIslandStore(state => state.sculptMode);

  return (
    <>
      <Grid
        visible={sculptMode}
        args={[2, 2]}
        position={[0, 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        gridSize={20}
        lineWidth={2}
        gridAlpha={0.1}
        lineColor='cyan'
      />
      <Terrain renderOrder={1} position={[0, 0, 0]} />
      {/* <ShoreLine position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} /> */}
      <Ocean args={[30, 0, 30]} position={[0, -0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} resolution={1} />
      <directionalLight position={[1, 1, 1]} intensity={2} color='red' />
      <directionalLight position={[1, 1, -1]} intensity={2} color='pink' />
      <directionalLight position={[-1, 1, -1]} intensity={2} color='orange' />
      <directionalLight position={[-1, 1, 1]} intensity={2} color='yellow' />
      <ambientLight intensity={1.5} />
      <CameraController />
    </>
  );
};

const Experience = () => {
  const { setPointerDown } = useIslandStore(state => state.actions);

  return (
    <>
      <Canvas
        gl={async props => {
          const renderer = new THREE.WebGPURenderer(props);
          await renderer.init();
          return renderer;
        }}
        camera={{ fov: 35, position: CAMERA_POSITION, target: CAMERA_TARGET }}
        onPointerDown={() => setPointerDown(true)}
        onPointerUp={() => setPointerDown(false)}
      >
        <Scene />
      </Canvas>
      <Leva hidden />
    </>
  );
};

export default Experience;
