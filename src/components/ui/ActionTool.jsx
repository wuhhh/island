import { useResetIsland } from "../../hooks/useResetIsland.js";
import { useHistoryStore } from "../../stores/useHistoryStore.js";
import KeyBindingItem from "../KeyBindingItem";

import ToolbarButton from "./ToolbarButton";
import ToolTip from "./ToolTip";

/**
 * Action tool in the toolbar
 * @param {Object} props
 * @param {Object} props.tool - Tool configuration
 * @param {Function} props.setShowHelpModal - Function to show help modal
 * @param {Function} props.handleCreateSnapshot - Function to create snapshot
 */
function ActionTool({ tool, setShowHelpModal, handleCreateSnapshot }) {
  const { undo, redo } = useHistoryStore.temporal.getState();
  const resetIsland = useResetIsland();

  const handleClick = () => {
    switch (tool.id) {
      case "download":
        return handleCreateSnapshot();
      case "undo":
        return undo();
      case "redo":
        return redo();
      case "reset":
        return resetIsland();
      case "help":
        return setShowHelpModal(true);
    }
  };

  return (
    <div className='relative group'>
      <ToolbarButton label={tool.label} onClick={handleClick} active={false}>
        <tool.icon strokeWidth={1} />
      </ToolbarButton>
      <ToolTip>
        <KeyBindingItem keyCombination={tool.shortcut} action={tool.label} tag='span' flip />
      </ToolTip>
    </div>
  );
}

export default ActionTool;
