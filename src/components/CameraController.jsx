import React, { useEffect, useRef, useState, useCallback } from "react";
import CustomCameraControls from "./CustomCameraControls";
import { useIslandStore, useIslandHydration } from "../stores/useIslandStore";
import debounce from "debounce";

const CameraController = () => {
  const [cameraReady, setCameraReady] = useState(false);
  const cameraControls = useRef();
  const sculptMode = useIslandStore(state => state.sculptMode);
  const actions = useIslandStore(state => state.actions);
  const persisted = useIslandStore(state => state.persisted);
  const { setCameraPosition, setCameraTarget } = actions;
  const { cameraPosition, cameraTarget } = persisted;
  const islandStoreHydrated = useIslandHydration();

  const handleCameraControlsChange = useCallback(
    event => {
      if (event.target.enabled) {
        setCameraPosition(event.target.getPosition());
        setCameraTarget(event.target.getTarget());
      }
    },
    [setCameraPosition, setCameraTarget]
  );

  const handleControlsReady = useCallback(() => {
    setCameraReady(true);
  }, []);

  useEffect(() => {
    if (cameraControls.current && islandStoreHydrated) {
      if (cameraPosition && cameraTarget) {
        cameraControls.current.setPosition(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        cameraControls.current.setTarget(cameraTarget.x, cameraTarget.y, cameraTarget.z);
      }
    }
  }, [islandStoreHydrated, cameraReady, cameraPosition, cameraTarget]);

  return (
    <CustomCameraControls
      ref={cameraControls}
      enabled={!sculptMode}
      makeDefault
      makeDefaultRotation={true}
      onChange={debounce(handleCameraControlsChange, 100)}
      onReady={handleControlsReady}
    />
  );
};

export default CameraController;
