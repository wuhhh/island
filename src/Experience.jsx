import * as THREE from "three/webgpu";
import { Canvas, extend } from "@react-three/fiber";
import { Box } from "@react-three/drei";
import Ocean from "./components/Ocean";
import Grid from "./components/Grid";
import CameraController from "./components/CameraController";
import GeometryTerrainEditor from "./components/Terrain";
import { CAMERA_POSITION, CAMERA_TARGET, useIslandStore } from "./stores/useIslandStore";
import { Leva } from "leva";

extend(THREE);

const Scene = () => {
  const sculptMode = useIslandStore(state => state.sculptMode);

  return (
    <>
      <Box scale={0.15} position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color='white' />
      </Box>
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
      <Ocean position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} args={[30, 0.001, 30]} resolution={1} />
      <GeometryTerrainEditor />
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
      <Leva />
    </>
  );
};

export default Experience;
