import React, { useEffect, useRef, useState, useCallback } from "react";
import { useControls, button } from "leva";
import debounce from "debounce";
import CustomCameraControls from "./CustomCameraControls";
import { CAMERA_POSITION, CAMERA_TARGET, useIslandStore, useIslandHydration } from "../stores/useIslandStore";

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

  useControls("Camera", {
    reset: button(
      () => {
        if (cameraControls.current) {
          cameraControls.current.setPosition(...CAMERA_POSITION);
          cameraControls.current.setTarget(...CAMERA_TARGET);
          // setCameraPosition(CAMERA_POSITION);
          // setCameraTarget(CAMERA_TARGET);
        }
      },
      {
        label: "Reset Camera",
      }
    ),
  });

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
