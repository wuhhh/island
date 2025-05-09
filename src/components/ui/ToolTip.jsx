import React from "react";

/**
 * Tooltip component to show key bindings
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content of the tooltip
 * @param {string} [props.position="right"] - Position of the tooltip (right, left, top, bottom)
 * @param {number} [props.offset=4] - Offset in pixels from the target element
 */
const ToolTip = ({ children, position = "right", offset = 16 }) => {
  // Convert pixel value to rem (assuming 4px = 0.25rem in your Tailwind config)
  const offsetRem = offset * 0.0625;

  // Calculate positioning classes and styles
  const positionConfig = {
    right: {
      classes: "left-full top-1/2 transform -translate-y-1/2",
      styles: { marginLeft: `${offsetRem}rem` },
    },
    left: {
      classes: "right-full top-1/2 transform -translate-y-1/2",
      styles: { marginRight: `${offsetRem}rem` },
    },
    top: {
      classes: "bottom-full left-1/2 transform -translate-x-1/2",
      styles: { marginBottom: `${offsetRem}rem` },
    },
    bottom: {
      classes: "top-full left-1/2 transform -translate-x-1/2",
      styles: { marginTop: `${offsetRem}rem` },
    },
  };

  const config = positionConfig[position];

  return (
    <span
      className={`group absolute ${config.classes} whitespace-nowrap bg-slate-50 text-black shadow-sm text-sm rounded-xs px-2 py-1 pointer-events-none opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
      style={config.styles}
    >
      {children}
    </span>
  );
};

export default ToolTip;
