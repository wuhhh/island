import React from "react";

import KeyBindingItem from "../KeyBindingItem";

import ToolbarButton from "./ToolbarButton";
import ToolTip from "./ToolTip";

/**
 * Toggle tool in the toolbar
 * @param {Object} props
 * @param {Object} props.tool - Tool configuration
 * @param {string} props.activeTool - Currently active tool ID
 * @param {Function} props.setActiveTool - Function to set active tool
 * @param {Function} props.setPlaceProp - Function to set place property
 * @param {Function} props.setSculptProp - Function to set sculpt property
 */
function ToggleTool({ tool, activeTool, setActiveTool, setPlaceProp, setSculptProp }) {
  const isActive = activeTool === tool.id;

  const handleClick = () => {
    setActiveTool(tool.id);
    switch (tool.id) {
      case "move":
        setPlaceProp("active", false);
        setSculptProp("active", false);
        break;
      case "sculpt+":
        setPlaceProp("active", false);
        setSculptProp("active", true);
        break;
      case "sculpt-":
        setPlaceProp("active", false);
        setSculptProp("active", true);
        break;
      case "decor-select":
        setSculptProp("active", false);
        break;
    }
  };

  return (
    <div className='relative group'>
      <ToolbarButton label={tool.label} onClick={handleClick} active={isActive}>
        <tool.icon strokeWidth={1} />
      </ToolbarButton>
      <ToolTip>
        <KeyBindingItem keyCombination={tool.shortcut} action={tool.label} tag='span' flip />
      </ToolTip>
    </div>
  );
}

export default ToggleTool;
