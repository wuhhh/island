import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brush, CircleDotDashed, CircleFadingPlus, Eraser, Hand, HelpCircle, Pencil, Redo, RefreshCw, Undo, X } from "lucide-react";
import KeyBindingItem from "./KeyBindingItem";
import { useIslandStore } from "../stores/useIslandStore";
import { useHistoryStore } from "../stores/useHistoryStore";

const TOOL_OPTIONS = [
  { id: "move", icon: Hand, label: "Move", shortcut: ["v"], type: "toggle" },
  { id: "sculpt+", icon: Brush, label: "Raise terrain", shortcut: ["a"], type: "toggle" },
  { id: "sculpt-", icon: Eraser, label: "Lower terrain", shortcut: ["s"], type: "toggle" },
  { id: "size", icon: CircleDotDashed, label: "Brush Size", shortcut: ["[", "]"], type: "slider" },
  { id: "strength", icon: CircleFadingPlus, label: "Brush Strength", shortcut: ["-", "+"], type: "slider" },
  { id: "undo", icon: Undo, label: "Undo", shortcut: ["u"], type: "action" },
  { id: "redo", icon: Redo, label: "Redo", shortcut: ["y"], type: "action" },
  { id: "reset", icon: RefreshCw, label: "Reset", shortcut: ["Shift", "r"], type: "action" },
  { id: "help", icon: HelpCircle, label: "Help", shortcut: ["h"], type: "action" },
];

const ToolTip = ({ children }) => (
  <span className='group absolute left-full top-1/2 transform -translate-y-1/2 ml-4 whitespace-nowrap bg-slate-50 text-black shadow-sm text-sm rounded-sm px-2 py-1 hidden group-hover:block'>
    {children}
  </span>
);

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

const ToolbarToggle = ({ editMode, toggleEditMode }) => (
  <button
    onClick={toggleEditMode}
    aria-label='Toggle edit mode'
    className='relative cursor-pointer w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400'
  >
    <AnimatePresence mode='wait'>
      {editMode ? (
        <motion.div
          key='close'
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 20, opacity: 0 }}
          className='absolute inset-0 flex items-center justify-center'
        >
          <X strokeWidth={1} />
        </motion.div>
      ) : (
        <motion.div
          key='edit'
          initial={{ rotate: 20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: -20, opacity: 0 }}
          className='absolute inset-0 flex items-center justify-center'
        >
          <Pencil strokeWidth={1} />
        </motion.div>
      )}
    </AnimatePresence>
  </button>
);

function ToggleTool({ tool, activeTool, setActiveTool, setSculptProp }) {
  const isActive = activeTool === tool.id;
  const handleClick = () => {
    setActiveTool(tool.id);
    switch (tool.id) {
      case "move":
        setSculptProp("active", false);
        break;
      case "sculpt+":
        setSculptProp("mode", "add");
        setSculptProp("active", true);
        break;
      case "sculpt-":
        setSculptProp("mode", "subtract");
        setSculptProp("active", true);
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

function ActionTool({ tool, setShowHelpModal, setShowResetConfirm }) {
  const { undo, redo } = useHistoryStore.temporal.getState();
  const handleClick = () => {
    if (tool.id === "undo") return undo();
    if (tool.id === "redo") return redo();
    if (tool.id === "reset") return setShowResetConfirm(true);
    if (tool.id === "help") return setShowHelpModal(true);
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

export default function IslandEditorUI() {
  const editMode = useIslandStore(state => state.editMode);
  const setEditMode = useIslandStore(state => state.actions.setEditMode);
  const sculpt = useIslandStore(state => state.sculpt);
  const setSculptProp = useIslandStore(state => state.actions.setSculptProp);
  const [activeTool, setActiveTool] = useState(null);
  const [openSlider, setOpenSlider] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const toggleEditMode = () => setEditMode(!editMode);

  useEffect(() => {
    if (!editMode) return;
    if (sculpt.active) {
      setActiveTool(sculpt.mode === "add" ? "sculpt+" : "sculpt-");
    } else {
      setActiveTool("move");
    }
  }, [editMode, sculpt.active, sculpt.mode]);

  return (
    <motion.div className='cursor-default fixed top-4 left-4 z-40 flex flex-col items-center space-y-2 bg-white p-2 rounded-4xl shadow-md h-auto'>
      <ToolbarToggle editMode={editMode} toggleEditMode={toggleEditMode} />

      {editMode &&
        TOOL_OPTIONS.map(tool => {
          switch (tool.type) {
            case "toggle":
              return (
                <ToggleTool key={tool.id} tool={tool} activeTool={activeTool} setActiveTool={setActiveTool} setSculptProp={setSculptProp} />
              );
            case "action":
              return <ActionTool key={tool.id} tool={tool} setShowHelpModal={setShowHelpModal} setShowResetConfirm={setShowResetConfirm} />;
            case "slider":
              return (
                <SliderTool
                  key={tool.id}
                  tool={tool}
                  openSlider={openSlider}
                  setOpenSlider={setOpenSlider}
                  sculpt={sculpt}
                  setSculptProp={setSculptProp}
                />
              );
            default:
              return null;
          }
        })}

      {showHelpModal && (
        <div role='dialog' aria-modal='true' className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
          <div className='bg-white rounded-lg max-w-2xl w-full p-6'>
            <h2 className='text-xl font-semibold mb-4'>Tips & Shortcuts</h2>
            <div className='mb-4'>
              <h3 className='font-medium mb-4'>Keyboard Shortcuts:</h3>
              <ul className='list-outside list-none ml-0 space-y-1'>
                <li>
                  <KeyBindingItem keyCombination={["a"]} action='Sculpt + (Hold Alt to switch to subtract)' />
                </li>
                <li>
                  <KeyBindingItem keyCombination={["s"]} action='Sculpt - (Hold Alt to switch to add)' />
                </li>
                <li>
                  <KeyBindingItem keyCombination={["]"]} action='Increase brush size' />
                </li>
                <li>
                  <KeyBindingItem keyCombination={["["]} action='Decrease brush size' />
                </li>
                <li>
                  <KeyBindingItem keyCombination={["+"]} action='Increase brush strength' />
                </li>
                <li>
                  <KeyBindingItem keyCombination={["-"]} action='Decrease brush strength' />
                </li>
                <li>
                  <KeyBindingItem keyCombination={["u"]} action='Undo' />
                </li>
                <li>
                  <KeyBindingItem keyCombination={["y"]} action='Redo' />
                </li>
                <li>
                  <KeyBindingItem keyCombination={["Shift", "r"]} action='Reset' />
                </li>
                <li>
                  <KeyBindingItem keyCombination={["e"]} action='Toggle edit mode' />
                </li>
                <li>
                  <KeyBindingItem keyCombination={["m"]} action='Move tool (Camera control)' />
                </li>
              </ul>
            </div>
            <div className='mb-4'>
              <h3 className='font-medium mb-4'>Tips & Tricks:</h3>
              <ul className='list-disc list-outside ml-4 space-y-1'>
                <li>Use Sculpt + / Sculpt - to raise or lower terrain.</li>
                <li>Adjust brush size/strength via toolbar sliders or keyboard shortcuts.</li>
                <li>Undo/redo frequently to refine your edits.</li>
                <li>Hit Reset to start fresh (irreversible).</li>
                <li>Hold Alt while sculpting to quickly switch between add/subtract modes.</li>
              </ul>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className='cursor-pointer mt-2 px-4 py-2 bg-blue-600 text-white rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400'
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showResetConfirm && (
        <div role='dialog' aria-modal='true' className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
          <div className='bg-white rounded-lg max-w-sm w-full p-6'>
            <h2 className='text-lg font-semibold mb-4'>Confirm Reset</h2>
            <p className='mb-4'>Are you sure you want to reset all changes? This action cannot be undone.</p>
            <div className='flex justify-end space-x-2'>
              <button
                onClick={() => setShowResetConfirm(false)}
                className='px-4 py-2 bg-gray-300 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  // TODO: your reset logic here
                }}
                className='px-4 py-2 bg-red-600 text-white rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400'
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
