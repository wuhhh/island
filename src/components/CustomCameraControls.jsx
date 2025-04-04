import { CameraControls } from "@react-three/drei";
import { useRef, useEffect, forwardRef } from "react";

const CustomCameraControls = forwardRef(
  (
    {
      // Controls configuration
      makeDefaultRotation = false, // If true, rotation is default and shift+drag rotates
      panSpeed = 1,
      rotateSpeed = 1,

      // Pass through all other CameraControls props
      ...cameraControlsProps
    },
    ref
  ) => {
    // Create local ref if no ref is passed
    const localRef = useRef();
    const controlsRef = ref || localRef;

    useEffect(() => {
      if (!controlsRef.current) return;

      // Set pan and rotate speeds
      controlsRef.current.azimuthRotateSpeed = rotateSpeed;
      controlsRef.current.polarRotateSpeed = rotateSpeed;
      controlsRef.current.truckSpeed = panSpeed;

      // Default action mapping (modified later by event listeners)
      const defaultLeftButton = makeDefaultRotation ? 1 : 2; // 1=pan, 2=rotate
      const shiftLeftButton = makeDefaultRotation ? 2 : 1; // Opposite of default

      // Set initial mode
      controlsRef.current.mouseButtons.left = defaultLeftButton;

      // Disable middle mouse panning if we're using shift+left instead
      if (!makeDefaultRotation) {
        controlsRef.current.mouseButtons.middle = 0;
      }

      // Create event listeners to check for shift key
      const onPointerDown = event => {
        if (!controlsRef.current) return;

        if (event.shiftKey) {
          // When shift is held, use the shift action
          controlsRef.current.mouseButtons.left = shiftLeftButton;
        } else {
          // Without shift, use the default action
          controlsRef.current.mouseButtons.left = defaultLeftButton;
        }
      };

      const onKeyDown = event => {
        if (event.key === "Shift" && controlsRef.current) {
          controlsRef.current.mouseButtons.left = shiftLeftButton;
        }
      };

      const onKeyUp = event => {
        if (event.key === "Shift" && controlsRef.current) {
          controlsRef.current.mouseButtons.left = defaultLeftButton;
        }
      };

      // Add event listeners
      window.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);

      // Cleanup
      return () => {
        window.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
      };
    }, [controlsRef, makeDefaultRotation, panSpeed, rotateSpeed]);

    return <CameraControls ref={controlsRef} {...cameraControlsProps} />;
  }
);

// Set display name for dev tools
CustomCameraControls.displayName = "CustomCameraControls";

export default CustomCameraControls;
