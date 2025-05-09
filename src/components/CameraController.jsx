import debounce from "debounce";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";

import { CAMERA_POSITION, CAMERA_TARGET, useIslandStore, useIslandHydration } from "../stores/useIslandStore";

import CustomCameraControls from "./CustomCameraControls";

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

  // Read editMode, place.active and sculpt.active directly from the store
  // This will cause a re-render when these values change, but that's okay
  const editMode = useIslandStore(state => state.editMode);
  const placeActive = useIslandStore(state => state.place.active);
  const sculptActive = useIslandStore(state => state.sculpt.active);

  // Compute enabled state directly from these values
  const controlsEnabled = !(editMode && (placeActive || sculptActive));

  // Get persisted values for initial render only
  const initialCameraPosition = useIslandStore(state => state.persisted.cameraPosition);
  const initialCameraTarget = useIslandStore(state => state.persisted.cameraTarget);

  // Store references - initialize with persisted values from first render
  const storeRef = useRef({
    editMode,
    place: { active: placeActive },
    sculpt: { active: sculptActive },
    cameraPosition: initialCameraPosition || CAMERA_POSITION,
    cameraTarget: initialCameraTarget || CAMERA_TARGET,
  });

  // Store setters - these shouldn't cause re-renders when called
  const setCameraPosition = useIslandStore(state => state.actions.setCameraPosition);
  const setCameraTarget = useIslandStore(state => state.actions.setCameraTarget);
  const islandStoreHydrated = useIslandHydration();

  // Track last values we set
  const lastPositionRef = useRef(initialCameraPosition || CAMERA_POSITION);
  const lastTargetRef = useRef(initialCameraTarget || CAMERA_TARGET);

  // Function to handle camera resets - defined outside useEffect
  const handleCameraReset = useCallback(() => {
    if (!cameraReady || !cameraControls.current) return;

    cameraControls.current.setPosition(...CAMERA_POSITION);
    cameraControls.current.setTarget(...CAMERA_TARGET);

    // Update our tracking refs
    lastPositionRef.current = [...CAMERA_POSITION];
    lastTargetRef.current = [...CAMERA_TARGET];
  }, [cameraReady]);

  // Subscribe to store changes without causing re-renders - SINGLE subscription
  useEffect(() => {
    const unsubscribe = useIslandStore.subscribe(
      state => ({
        cameraPosition: state.persisted.cameraPosition,
        cameraTarget: state.persisted.cameraTarget,
        snapshotLoading: state.snapshotLoading,
      }),
      newState => {
        // Update store ref with camera values
        storeRef.current = {
          ...storeRef.current,
          cameraPosition: newState.cameraPosition,
          cameraTarget: newState.cameraTarget,
          snapshotLoading: newState.snapshotLoading,
        };

        // Check if this is a reset event
        const isReset =
          positionsAreEqual(newState.cameraPosition, CAMERA_POSITION) && positionsAreEqual(newState.cameraTarget, CAMERA_TARGET);

        if (isReset) {
          handleCameraReset();
        }

        // Handle snapshot loading
        if (newState.snapshotLoading) {
          // Apply camera position and target from snapshot
          if (cameraReady && cameraControls.current) {
            const pos = newState.cameraPosition;
            const target = newState.cameraTarget;

            if (Array.isArray(pos) && pos.length === 3) {
              cameraControls.current.setPosition(...pos);
              lastPositionRef.current = [...pos];
            }

            if (Array.isArray(target) && target.length === 3) {
              cameraControls.current.setTarget(...target);
              lastTargetRef.current = [...target];
            }
          }
        }
      }
    );

    return unsubscribe;
  }, [cameraReady, handleCameraReset]);

  /**
   * Handle camera controls change - isolated from react render cycle
   */
  const handleCameraControlsChange = useCallback(
    event => {
      if (!event.target || !event.target.enabled) return;

      const vecPos = event.target.getPosition();
      const vecTarget = event.target.getTarget();

      // normalize to array for consistent storage
      const newPosArr = [vecPos.x, vecPos.y, vecPos.z];
      const newTargetArr = [vecTarget.x, vecTarget.y, vecTarget.z];

      // Only update if values are different
      if (!positionsAreEqual(newPosArr, lastPositionRef.current)) {
        lastPositionRef.current = newPosArr;
        setCameraPosition(newPosArr);
      }

      if (!positionsAreEqual(newTargetArr, lastTargetRef.current)) {
        lastTargetRef.current = newTargetArr;
        setCameraTarget(newTargetArr);
      }
    },
    [setCameraPosition, setCameraTarget]
  ); // No dependencies for stability!

  // Create debounced handler once with no dependencies
  const debouncedChange = useMemo(() => debounce(handleCameraControlsChange, 100), [handleCameraControlsChange]); // Empty dependency array!

  /**
   * Cleanup the debounced function on unmount
   */
  useEffect(() => {
    return () => {
      debouncedChange.clear();
    };
  }, [debouncedChange]); // Empty dependency array

  const handleControlsReady = useCallback(() => {
    setCameraReady(true);
  }, []);

  /**
   * Initial mount sync
   * Only when controls are ready + store is hydrated
   */
  useEffect(() => {
    if (!cameraReady || !islandStoreHydrated || !cameraControls.current) return;

    const { cameraPosition, cameraTarget } = storeRef.current;

    // handle both array and object formats
    const [x, y, z] = Array.isArray(cameraPosition) ? cameraPosition : [cameraPosition.x, cameraPosition.y, cameraPosition.z];
    const [tx, ty, tz] = Array.isArray(cameraTarget) ? cameraTarget : [cameraTarget.x, cameraTarget.y, cameraTarget.z];

    cameraControls.current.setPosition(x, y, z);
    cameraControls.current.setTarget(tx, ty, tz);

    // Update our last known values
    lastPositionRef.current = Array.isArray(cameraPosition) ? cameraPosition : [cameraPosition.x, cameraPosition.y, cameraPosition.z];
    lastTargetRef.current = Array.isArray(cameraTarget) ? cameraTarget : [cameraTarget.x, cameraTarget.y, cameraTarget.z];
  }, [cameraReady, islandStoreHydrated]);

  return (
    <CustomCameraControls
      ref={cameraControls}
      enabled={controlsEnabled} // This now uses the computed value from store state
      makeDefault
      makeDefaultRotation={true}
      onChange={debouncedChange}
      onReady={handleControlsReady}
    />
  );
};

export default CameraController;
