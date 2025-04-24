import { useEffect, useRef } from "react";
import { useIslandStore } from "../stores/useIslandStore";
import { useHistoryStore } from "../stores/useHistoryStore";

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
  const setTerrainGeomAttrsPosArr = useHistoryStore(state => state.setTerrainGeomAttrsPosArr);
  const terrainSystem = useIslandStore(state => state.terrainSystem);
  const wireframe = useIslandStore(state => state.wireframe);
  const setWireframe = useIslandStore(state => state.actions.setWireframe);
  const undo = useHistoryStore.temporal.getState().undo;
  const redo = useHistoryStore.temporal.getState().redo;

  const preControlMode = useRef(null);

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === "Control" && editMode) {
        if (sculpt.active) {
          setSculptProp("active", false);
          preControlMode.current = "sculpt";
        } else if (place.active) {
          setPlaceProp("active", false);
          preControlMode.current = "place";
        }
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
          // Switch to move tool (disable sculpt)
          setSculptProp("active", false);
          setActiveTool("move");
          break;
        case "R":
          terrainSystem.resetTerrain();
          setTerrainGeomAttrsPosArr(terrainSystem.positions);
          break;
        case "a":
        case "A":
          if (editMode) {
            setSculptProp("mode", "add");
            setSculptProp("active", true);
          }
          break;
        case "s":
        case "S":
          if (editMode) {
            setSculptProp("mode", "subtract");
            setSculptProp("active", true);
          }
          break;
        default:
          break;
      }
    };

    const handleKeyUp = e => {
      if (e.key === "Control" && editMode) {
        console.log("PreControlMode", preControlMode.current);
        if (preControlMode.current === "sculpt") {
          setSculptProp("active", true);
        } else if (preControlMode.current === "place") {
          setPlaceProp("active", true);
        }
        preControlMode.current = null;
      }
      if (e.key === "Alt" && editMode && sculpt.active) {
        const newMode = sculpt.mode === "add" ? "subtract" : "add";
        setSculptProp("mode", newMode);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Momentary toggle: revert mode on Alt key release
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [editMode, wireframe, sculpt, setEditMode, setWireframe, setSculptProp, undo, redo]);
}
