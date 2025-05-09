import React, { useRef, useEffect } from "react";

import KeyBindingItem from "../KeyBindingItem";

import ToolbarButton from "./ToolbarButton";
import ToolTip from "./ToolTip";

/**
 * Slider tool in the toolbar
 * @param {Object} props
 * @param {Object} props.tool - Tool configuration
 * @param {string|null} props.openSlider - Currently open slider ID
 * @param {Function} props.setOpenSlider - Function to set open slider
 * @param {Object} props.sculpt - Sculpt state
 * @param {Function} props.setSculptProp - Function to set sculpt property
 */
function SliderTool({ tool, openSlider, setOpenSlider, sculpt, setSculptProp }) {
  const isActive = openSlider === tool.id;
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = e => {
      if (isActive && ref.current && !ref.current.contains(e.target)) {
        setOpenSlider(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isActive, setOpenSlider]);

  const handleClick = () => setOpenSlider(isActive ? null : tool.id);
  const value = tool.id === "strength" ? sculpt.brushStrength : sculpt.brushSize;
  const setValue = val => (tool.id === "strength" ? setSculptProp("brushStrength", val) : setSculptProp("brushSize", val));

  return (
    <div ref={ref} className='relative group'>
      <ToolbarButton label={tool.label} onClick={handleClick} active={isActive} subtle>
        <tool.icon strokeWidth={1} />
      </ToolbarButton>
      {!isActive && (
        <ToolTip>
          <KeyBindingItem keyCombination={tool.shortcut} action={tool.label} tag='span' flip />
        </ToolTip>
      )}
      {isActive && (
        <div className='absolute left-full top-1/2 transform -translate-y-1/2 ml-[20px] w-48 p-2 bg-slate-50 shadow-sm text-sm rounded-sm'>
          <label htmlFor={`${tool.id}-slider`} className='block text-slate-500 text-xs uppercase tracking-wide mb-1'>
            {tool.label.split(" ")[1]}
          </label>
          <input
            id={`${tool.id}-slider`}
            type='range'
            min='0.01'
            max='1'
            step='0.01'
            value={value}
            onChange={e => setValue(+e.target.value)}
            className='w-full'
          />
        </div>
      )}
    </div>
  );
}

export default SliderTool;
