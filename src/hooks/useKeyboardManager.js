import { useEffect, useRef } from "react";
import { useIslandStore } from "../stores/useIslandStore";
import { useHistoryStore } from "../stores/useHistoryStore";
import { useResetIsland } from "../stores/useResetIsland";

/**
 * Global keyboard manager hook to handle keyboard shortcuts across the UI.
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
  const resetTerrain = useResetIsland();
  const undo = useHistoryStore.temporal.getState().undo;
  const redo = useHistoryStore.temporal.getState().redo;

  const preControlMode = useRef({});

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === "Control" && editMode) {
        preControlMode.current = {
          activeTool,
          place,
        };
        setActiveTool("move");
      }
      switch (e.key) {
        case "e":
          e.preventDefault();
          setEditMode(!editMode);
          break;
        case "w":
        case "W":
          setWireframe(!wireframe);
          break;
        case "Alt":
          if (editMode && sculpt.active) {
            setActiveTool(activeTool === "sculpt+" ? "sculpt-" : "sculpt+");
          }
          break;
        case "u":
        case "U":
          undo();
          break;
        case "y":
        case "Y":
          redo();
          break;
        case "[":
          if (sculpt.brushSize != null) {
            const newSize = Math.max(0.01, sculpt.brushSize - 0.1);
            setSculptProp("brushSize", newSize);
          }
          break;
        case "]":
          if (sculpt.brushSize != null) {
            const newSizeUp = Math.min(1, sculpt.brushSize + 0.1);
            setSculptProp("brushSize", newSizeUp);
          }
          break;
        case "-":
          if (sculpt.brushStrength != null) {
            const newStr = Math.max(0.01, sculpt.brushStrength - 0.1);
            setSculptProp("brushStrength", newStr);
          }
          break;
        case "=":
          if (sculpt.brushStrength != null) {
            const newStrUp = Math.min(1, sculpt.brushStrength + 0.1);
            setSculptProp("brushStrength", newStrUp);
          }
          break;
        case "v":
        case "V":
          if (editMode) {
            setActiveTool("move");
          }
          break;
        case "R":
          if (editMode) {
            resetTerrain();
          }
          break;
        case "a":
        case "A":
          if (editMode) {
            setActiveTool("sculpt+");
          }
          break;
        case "s":
        case "S":
          if (editMode) {
            setActiveTool("sculpt-");
          }
          break;
        case "p":
        case "P":
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
      if (e.key === "Control" && editMode) {
        // Revert to previous tool and place state
        setActiveTool(preControlMode.current?.activeTool);
        setPlaceProp("active", preControlMode.current?.place.active);
        setPlaceProp("item", preControlMode?.current.place.item);
        preControlMode.current = {};
      }
      if (e.key === "Alt" && editMode && sculpt.active) {
        setActiveTool(activeTool === "sculpt+" ? "sculpt-" : "sculpt+");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Momentary toggle: revert mode on Alt key release
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [preControlMode.current, editMode, wireframe, sculpt, setEditMode, setWireframe, setSculptProp, undo, redo]);
}
