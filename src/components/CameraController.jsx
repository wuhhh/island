import React, { useEffect, useRef, useState, useCallback } from "react";
import { useControls, button } from "leva";
import debounce from "debounce";
import CustomCameraControls from "./CustomCameraControls";
import { CAMERA_POSITION, CAMERA_TARGET, useIslandStore, useIslandHydration } from "../stores/useIslandStore";

// Helper to compare positions/targets (arrays or objects) without lodash
const positionsAreEqual = (a, b) => {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }
  if (a && b && a.x !== undefined && b.x !== undefined) {
    return a.x === b.x && a.y === b.y && a.z === b.z;
  }
  return false;
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
      if (!event.target.enabled) return;
      const vecPos = event.target.getPosition();
      const vecTarget = event.target.getTarget();
      // normalize to array for consistent storage
      const newPosArr = [vecPos.x, vecPos.y, vecPos.z];
      const newTargetArr = [vecTarget.x, vecTarget.y, vecTarget.z];
      if (!positionsAreEqual(newPosArr, cameraPosition)) {
        setCameraPosition(newPosArr);
      }
      if (!positionsAreEqual(newTargetArr, cameraTarget)) {
        setCameraTarget(newTargetArr);
      }
    },
    [setCameraPosition, setCameraTarget, cameraPosition, cameraTarget]
  );

  const handleControlsReady = useCallback(() => {
    setCameraReady(true);
  }, []);

  useEffect(() => {
    if (cameraControls.current && islandStoreHydrated && cameraPosition && cameraTarget) {
      // handle both array and object formats
      const [x, y, z] = Array.isArray(cameraPosition) ? cameraPosition : [cameraPosition.x, cameraPosition.y, cameraPosition.z];
      const [tx, ty, tz] = Array.isArray(cameraTarget) ? cameraTarget : [cameraTarget.x, cameraTarget.y, cameraTarget.z];
      cameraControls.current.setPosition(x, y, z);
      cameraControls.current.setTarget(tx, ty, tz);
    }
  }, [islandStoreHydrated, cameraReady, cameraPosition, cameraTarget]);

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
