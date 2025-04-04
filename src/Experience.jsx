import * as THREE from "three/webgpu";
import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, extend } from "@react-three/fiber";
import CustomCameraControls from "./components/CustomCameraControls";
import GeometryTerrainEditor from "./components/GeometryTerrainEditor";
import { CAMERA_POSITION, CAMERA_TARGET, useIslandStore, useIslandHydration } from "./stores/useIslandStore";
import debounce from "debounce";

extend(THREE);

const Experience = () => {
  const [cameraReady, setCameraReady] = useState(false);
  const cameraControls = useRef();
  const { sculptMode } = useIslandStore();
  const { actions, persisted } = useIslandStore();
  const { setCameraPosition, setCameraTarget } = actions;
  const { cameraPosition, cameraTarget } = persisted;

  const islandStoreHydrated = useIslandHydration();

  /**
   * useEffect
   * @description Sets the camera position and target when the camera controls are ready and the store is hydrated.
   * @returns {void}
   */
  useEffect(() => {
    if (cameraControls.current && islandStoreHydrated) {
      cameraControls.current.setPosition(cameraPosition.x, cameraPosition.y, cameraPosition.z, true);
      cameraControls.current.setTarget(cameraTarget.x, cameraTarget.y, cameraTarget.z);
    }
  }, [islandStoreHydrated, cameraReady]);

  /**
   * handleCameraControlsChange
   * @param {Event} event - The event object from the camera controls
   * @description Handles camera controls change event and updates the camera position and target in the store.
   */
  const handleCameraControlsChange = event => {
    setCameraPosition(event.target.getPosition());
    setCameraTarget(event.target.getTarget());
  };

  /**
   * handleControlsReady
   * @param {Object} controls - The camera controls object
   * @description Handles camera controls ready event and sets the camera as ready.
   */
  const handleControlsReady = controls => {
    setCameraReady(true);
  };

  return (
    <Canvas
      gl={async props => {
        const renderer = new THREE.WebGPURenderer(props);
        await renderer.init();
        return renderer;
      }}
      camera={{ fov: 35, position: CAMERA_POSITION, target: CAMERA_TARGET }}
    >
      <GeometryTerrainEditor />
      <directionalLight position={[-1, 1, 1]} />
      <ambientLight intensity={1} />
      <CustomCameraControls
        ref={cameraControls}
        enabled={!sculptMode}
        makeDefault
        makeDefaultRotation={true}
        // TODO: Waiting for Drei to add latest events, e.g. sleep
        onChange={debounce(handleCameraControlsChange, 100)}
        onReady={handleControlsReady}
      />
    </Canvas>
  );
};

export default Experience;
