import { useEffect } from "react";
import { useIslandStore } from "../stores/useIslandStore";
import { useHistoryStore } from "../stores/useHistoryStore";

/**
 * Global keyboard manager hook to handle keyboard shortcuts across the UI.
 */
export function useKeyboardManager() {
  const editMode = useIslandStore(state => state.editMode);
  const setEditMode = useIslandStore(state => state.actions.setEditMode);
  const sculpt = useIslandStore(state => state.sculpt);
  const setSculptProp = useIslandStore(state => state.actions.setSculptProp);
  const wireframe = useIslandStore(state => state.wireframe);
  const setWireframe = useIslandStore(state => state.actions.setWireframe);
  const undo = useHistoryStore.temporal.getState().undo;
  const redo = useHistoryStore.temporal.getState().redo;
  // const resetTerrain = useHistoryStore(state => state.actions.clear); // assuming clear resets

  useEffect(() => {
    const handleKeyDown = e => {
      switch (e.key) {
        case "Tab":
          e.preventDefault();
          setEditMode(!editMode);
          break;
        case "w":
        case "W":
          setWireframe(!wireframe);
          break;
        case "Alt":
          if (editMode && sculpt.active) {
            const newMode = sculpt.mode === "add" ? "subtract" : "add";
            setSculptProp("mode", newMode);
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
            const newSize = Math.max(0.02, sculpt.brushSize - 0.02);
            setSculptProp("brushSize", newSize);
          }
          break;
        case "]":
          if (sculpt.brushSize != null) {
            const newSizeUp = Math.min(0.5, sculpt.brushSize + 0.02);
            setSculptProp("brushSize", newSizeUp);
          }
          break;
        case "-":
          if (sculpt.brushStrength != null) {
            const newStr = Math.max(0.01, sculpt.brushStrength - 0.01);
            setSculptProp("brushStrength", newStr);
          }
          break;
        case "=":
          if (sculpt.brushStrength != null) {
            const newStrUp = Math.min(0.2, sculpt.brushStrength + 0.01);
            setSculptProp("brushStrength", newStrUp);
          }
          break;
        case "v":
        case "V":
          // Switch to move tool (disable sculpt)
          setSculptProp("active", false);
          break;
        case "R":
          // resetTerrain();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Momentary toggle: revert mode on Alt key release
    const handleKeyUp = e => {
      if (e.key === "Alt" && editMode && sculpt.active) {
        const newMode = sculpt.mode === "add" ? "subtract" : "add";
        setSculptProp("mode", newMode);
      }
    };
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [editMode, wireframe, sculpt, setEditMode, setWireframe, setSculptProp, undo, redo]);
}
