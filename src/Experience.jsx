import * as THREE from "three/webgpu";
import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, extend, useThree } from "@react-three/fiber";
import { Box, Plane } from "@react-three/drei";
import WebGPUReflectorSurface from "./components/WebGPUReflector";
import CustomCameraControls from "./components/CustomCameraControls";
import GeometryTerrainEditor from "./components/GeometryTerrainEditor";
import { CAMERA_POSITION, CAMERA_TARGET, useIslandStore, useIslandHydration } from "./stores/useIslandStore";
import debounce from "debounce";
import { Leva, useControls } from "leva";

extend(THREE);

const Scene = () => {
  const waterMaterial = useRef();
  const [cameraReady, setCameraReady] = useState(false);
  const cameraControls = useRef();
  const { sculptMode } = useIslandStore();
  const { actions, persisted } = useIslandStore();
  const { setCameraPosition, setCameraTarget } = actions;
  const { cameraPosition, cameraTarget } = persisted;
  const islandStoreHydrated = useIslandHydration();
  const { gl } = useThree();

  useEffect(() => {
    console.log("gl.state: ", gl.state);
  }, [gl]);

  /**
   * useEffect
   * @description Sets the camera position and target when the camera controls are ready and the store is hydrated.
   * @returns {void}
   */
  useEffect(() => {
    if (cameraControls.current && islandStoreHydrated) {
      if (cameraPosition && cameraTarget) {
        // console.log("Camera controls are ready and store is hydrated", cameraPosition, cameraTarget);
        cameraControls.current.setPosition(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        cameraControls.current.setTarget(cameraTarget.x, cameraTarget.y, cameraTarget.z);
      }
    }
  }, [islandStoreHydrated, cameraReady]);

  /**
   * handleCameraControlsChange
   * @param {Event} event - The event object from the camera controls
   * @description Handles camera controls change event and updates the camera position and target in the store.
   */
  const handleCameraControlsChange = event => {
    // console.log("Camera controls changed", event, event.target.enabled);

    if (event.target.enabled) {
      setCameraPosition(event.target.getPosition());
      setCameraTarget(event.target.getTarget());
    }
  };

  /**
   * handleControlsReady
   * @param {Object} controls - The camera controls object
   * @description Handles camera controls ready event and sets the camera as ready.
   */
  const handleControlsReady = controls => {
    setCameraReady(true);
  };

  // const waterMaterialConfig = useControls("water material", {
  //   color: "#347e93",
  //   opacity: { value: 0.7, min: 0, max: 1 },
  //   roughness: { value: 0.7, min: 0, max: 1 },
  //   metalness: { value: 0, min: 0, max: 1 },
  //   blending: {
  //     value: "Additive",
  //     options: ["Normal", "Additive", "Multiply", "Subtractive", "None"],
  //     onChange: value => {
  //       console.log("Blending changed", value);
  //       if (value === "None") {
  //         waterMaterial.current.blending = THREE.NoBlending;
  //       } else {
  //         waterMaterial.current.blending = THREE[`${value}Blending`];
  //       }
  //       waterMaterial.current.needsUpdate = true;
  //     },
  //   },
  //   transparent: true,
  // });

  return (
    <>
      {/* <Plane renderOrder={1} rotation={[-Math.PI / 2, 0, 0]} args={[2, 2]} position={[0, 0.08, 0]}>
        <meshStandardMaterial ref={waterMaterial} {...waterMaterialConfig} />
      </Plane> */}
      {/* <Plane args={[4000, 4000]} position={[0, 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color='blue' />
      </Plane> */}
      <Box scale={0.15} position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color='white' />
      </Box>
      <WebGPUReflectorSurface position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} args={[30, 0.001, 30]} resolution={1} />
      <GeometryTerrainEditor />
      <directionalLight position={[1, 1, 1]} intensity={1} color='red' />
      <directionalLight position={[1, 1, -1]} intensity={1} color='pink' />
      <directionalLight position={[-1, 1, -1]} intensity={1} color='orange' />
      <directionalLight position={[-1, 1, 1]} intensity={1} color='yellow' />
      <ambientLight intensity={1.5} />
      <CustomCameraControls
        ref={cameraControls}
        enabled={!sculptMode}
        makeDefault
        makeDefaultRotation={true}
        // TODO: Waiting for Drei to add latest events, e.g. sleep
        onChange={debounce(handleCameraControlsChange, 100)}
        onReady={handleControlsReady}
      />
    </>
  );
};

const Experience = () => {
  return (
    <>
      <Canvas
        gl={async props => {
          const renderer = new THREE.WebGPURenderer(props);
          await renderer.init();
          return renderer;
        }}
        camera={{ fov: 35, position: CAMERA_POSITION, target: CAMERA_TARGET }}
      >
        <Scene />
      </Canvas>
      <Leva />
    </>
  );
};

export default Experience;
