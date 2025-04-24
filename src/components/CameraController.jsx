import React, { useEffect, useRef, useState, useCallback } from "react";
import { useControls, button } from "leva";
import debounce from "debounce";
import CustomCameraControls from "./CustomCameraControls";
import { CAMERA_POSITION, CAMERA_TARGET, useIslandStore, useIslandHydration } from "../stores/useIslandStore";

// Helper to compare positions/targets without lodash
const positionsAreEqual = (a, b) => {
  return a && b && a.x === b.x && a.y === b.y && a.z === b.z;
};

const CameraController = () => {
  const [cameraReady, setCameraReady] = useState(false);
  const cameraControls = useRef();
  const editMode = useIslandStore(state => state.editMode);
  const place = useIslandStore(state => state.place);
  const sculpt = useIslandStore(state => state.sculpt);
  const persisted = useIslandStore(state => state.persisted);
  const cameraPosition = persisted.cameraPosition;
  const cameraTarget = persisted.cameraTarget;
  const setCameraPosition = useIslandStore(state => state.actions.setCameraPosition);
  const setCameraTarget = useIslandStore(state => state.actions.setCameraTarget);
  const islandStoreHydrated = useIslandHydration();

  const handleCameraControlsChange = useCallback(
    event => {
      const newPos = event.target.getPosition();
      const newTarget = event.target.getTarget();

      if (event.target.enabled) {
        if (!positionsAreEqual(newPos, cameraPosition)) {
          setCameraPosition(newPos);
        }
        if (!positionsAreEqual(newTarget, cameraTarget)) {
          setCameraTarget(newTarget);
        }
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
  }, [islandStoreHydrated, cameraReady]);

  useControls("Camera", {
    reset: button(
      () => {
        if (cameraControls.current) {
          cameraControls.current.setPosition(...CAMERA_POSITION);
          cameraControls.current.setTarget(...CAMERA_TARGET);
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
      enabled={!(editMode && (sculpt.active || place.active))}
      makeDefault
      makeDefaultRotation={true}
      onChange={debounce(handleCameraControlsChange, 100)}
      onReady={handleControlsReady}
    />
  );
};

export default CameraController;
