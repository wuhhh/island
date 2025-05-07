import { useEffect, useRef } from "react";

import { useResetIsland } from "../hooks/useResetIsland";
import { useHistoryStore } from "../stores/useHistoryStore";
import { useIslandStore } from "../stores/useIslandStore";

/**
 * Global keyboard manager hook to handle keyboard shortcuts across the UI.
 * Uses KeyboardEvent.code for keyboard layout compatibility (QWERTY, AZERTY, etc.)
 */
export function useKeyboardManager() {
  const activeTool = useIslandStore(state => state.activeTool);
  const setActiveTool = useIslandStore(state => state.actions.setActiveTool);
  const editMode = useIslandStore(state => state.editMode);
  const setEditMode = useIslandStore(state => state.actions.setEditMode);
  const place = useIslandStore(state => state.place);
  const setPlaceProp = useIslandStore(state => state.actions.setPlaceProp);
  const sculpt = useIslandStore(state => state.sculpt);
  const setSculptProp = useIslandStore(state => state.actions.setSculptProp);
  const wireframe = useIslandStore(state => state.wireframe);
  const setWireframe = useIslandStore(state => state.actions.setWireframe);
  const resetIsland = useResetIsland();
  const undo = useHistoryStore.temporal.getState().undo;
  const redo = useHistoryStore.temporal.getState().redo;

  const preControlMode = useRef({});

  useEffect(() => {
    const handleKeyDown = e => {
      if ((e.code === "ControlLeft" || e.code === "ControlRight") && editMode) {
        preControlMode.current = {
          activeTool,
          place,
        };
        setActiveTool("move");
      }
      switch (e.code) {
        case "KeyE":
          e.preventDefault();
          setEditMode(!editMode);
          break;
        case "KeyW":
          setWireframe(!wireframe);
          break;
        case "AltLeft":
        case "AltRight":
          if (editMode && sculpt.active) {
            setActiveTool(activeTool === "sculpt+" ? "sculpt-" : "sculpt+");
          }
          break;
        case "KeyU":
          undo();
          break;
        case "KeyY":
          redo();
          break;
        case "BracketLeft":
          if (sculpt.brushSize != null) {
            const newSize = Math.max(0.01, sculpt.brushSize - 0.1);
            setSculptProp("brushSize", newSize);
          }
          break;
        case "BracketRight":
          if (sculpt.brushSize != null) {
            const newSizeUp = Math.min(1, sculpt.brushSize + 0.1);
            setSculptProp("brushSize", newSizeUp);
          }
          break;
        case "Minus":
          if (sculpt.brushStrength != null) {
            const newStr = Math.max(0.01, sculpt.brushStrength - 0.1);
            setSculptProp("brushStrength", newStr);
          }
          break;
        case "Equal":
          if (sculpt.brushStrength != null) {
            const newStrUp = Math.min(1, sculpt.brushStrength + 0.1);
            setSculptProp("brushStrength", newStrUp);
          }
          break;
        case "KeyV":
          if (editMode) {
            setActiveTool("move");
          }
          break;
        case "KeyR":
          if (editMode) {
            resetIsland();
          }
          break;
        case "KeyA":
          if (editMode) {
            setActiveTool("sculpt+");
          }
          break;
        case "KeyS":
          if (editMode) {
            setActiveTool("sculpt-");
          }
          break;
        case "KeyP":
          if (editMode) {
            setActiveTool("decor-select");
            setPlaceProp("decorSelect", true);
          }
          break;
        default:
          break;
      }
    };

    const handleKeyUp = e => {
      if ((e.code === "ControlLeft" || e.code === "ControlRight") && editMode) {
        setActiveTool(preControlMode.current?.activeTool);
        setPlaceProp("active", preControlMode.current?.place.active);
        setPlaceProp("item", preControlMode?.current.place.item);
        preControlMode.current = {};
      }
      if ((e.code === "AltLeft" || e.code === "AltRight") && editMode && sculpt.active) {
        setActiveTool(activeTool === "sculpt+" ? "sculpt-" : "sculpt+");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    editMode,
    wireframe,
    sculpt,
    setEditMode,
    setWireframe,
    setSculptProp,
    undo,
    redo,
    activeTool,
    place,
    setActiveTool,
    resetIsland,
    setPlaceProp,
  ]);
}
