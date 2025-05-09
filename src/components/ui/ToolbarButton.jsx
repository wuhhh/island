import React from "react";

/**
 * Button component for the toolbar
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content of the button
 * @param {string} props.label - ARIA label for the button
 * @param {Function} props.onClick - Click handler
 * @param {boolean} [props.active=false] - Whether the button is active
 * @param {boolean} [props.subtle=false] - Whether to use subtle styling for active state
 */
const ToolbarButton = ({ children, label, onClick, active, subtle }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className={`cursor-pointer w-10 h-10 flex items-center justify-center border rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 ${
      active
        ? subtle
          ? "bg-orange-100 text-orange-600 border-orange-300"
          : "bg-orange-600 text-slate-50 border-orange-600"
        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
    }`}
  >
    {children}
  </button>
);

export default ToolbarButton;
