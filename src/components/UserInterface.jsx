import { motion, AnimatePresence } from "framer-motion";
import {
  Brush,
  CircleDotDashed,
  CircleFadingPlus,
  Download,
  Eraser,
  Hand,
  HelpCircle,
  Pencil,
  Redo,
  RefreshCw,
  Undo,
  Undo2,
  X,
} from "lucide-react";
import React, { useEffect, useState, useRef } from "react";

import { useKeyboardManager } from "../hooks/useKeyboardManager";
import { useResetIsland } from "../hooks/useResetIsland.js";
import { useHistoryStore } from "../stores/useHistoryStore.js";
import { useIslandStore } from "../stores/useIslandStore.js";
import { createSnapshot, loadSnapshotFromPath } from "../utils/islandSnapshot.js";

import MegaPlaceDecorButton from "./MegaPlaceDecorButton.jsx";

import Kbd from "./Kbd.jsx";
import KeyBindingItem from "./KeyBindingItem.jsx";
// import LogoMark from "./LogoMark.jsx";

const TOOL_OPTIONS = [
  { id: "move", icon: Hand, label: "Move", shortcut: ["v"], type: "toggle" },
  { id: "sculpt+", icon: Brush, label: "Raise Terrain", shortcut: ["a"], type: "toggle" },
  { id: "sculpt-", icon: Eraser, label: "Lower Terrain", shortcut: ["s"], type: "toggle" },
  { id: "size", icon: CircleDotDashed, label: "Brush Size", shortcut: ["[", "]"], type: "slider" },
  { id: "strength", icon: CircleFadingPlus, label: "Brush Strength", shortcut: ["-", "+"], type: "slider" },
  // { id: "decor-select", icon: WandSparkles, label: "Place Items", shortcut: ["p"], type: "decor-select" },
  { id: "undo", icon: Undo, label: "Undo", shortcut: ["u"], type: "action" },
  { id: "redo", icon: Redo, label: "Redo", shortcut: ["y"], type: "action" },
  { id: "download", icon: Download, label: "Download JSON", type: "action" },
  { id: "reset", icon: RefreshCw, label: "Reset", shortcut: ["Shift", "r"], type: "action" },
  { id: "help", icon: HelpCircle, label: "Help", shortcut: ["h"], type: "action" },
];

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
        <div className='group'>
          <motion.div
            key='close'
            initial={{ rotate: -20, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 20, opacity: 0 }}
            className='absolute inset-0 flex items-center justify-center'
          >
            <X strokeWidth={1} />
          </motion.div>
          <ToolTip>
            <KeyBindingItem keyCombination={["e"]} action='Exit Edit Mode' tag='span' flip />
          </ToolTip>
        </div>
      ) : (
        <div className='group'>
          <motion.div
            key='edit'
            initial={{ rotate: 20, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -20, opacity: 0 }}
            className='absolute inset-0 flex items-center justify-center'
          >
            <Pencil strokeWidth={1} />
          </motion.div>
          <ToolTip>
            <KeyBindingItem keyCombination={["e"]} action='Edit Mode' tag='span' flip />
          </ToolTip>
        </div>
      )}
    </AnimatePresence>
  </button>
);

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

// DecorSelectTool component has been moved to MegaPlaceDecorButton.jsx

export default function UserInterface() {
  useKeyboardManager();

  const editMode = useIslandStore(state => state.editMode);
  const setEditMode = useIslandStore(state => state.actions.setEditMode);
  const sculpt = useIslandStore(state => state.sculpt);
  const setPlaceProp = useIslandStore(state => state.actions.setPlaceProp);
  const setSculptProp = useIslandStore(state => state.actions.setSculptProp);
  const activeTool = useIslandStore(state => state.activeTool);
  const setActiveTool = useIslandStore(state => state.actions.setActiveTool);
  const resetIsland = useResetIsland();
  const [openSlider, setOpenSlider] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showIntroNotification, setShowIntroNotification] = useState(false);
  const hasDismissedIntro = useIslandStore(state => state.persisted.hasDismissedIntro);
  const setHasDismissedIntro = useIslandStore(state => state.actions.setHasDismissedIntro);

  const toggleEditMode = () => setEditMode(!editMode);

  useEffect(() => {
    if (!hasDismissedIntro) {
      const timer = setTimeout(() => setShowIntroNotification(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasDismissedIntro]);

  const handleDismissIntro = () => {
    setShowIntroNotification(false);
    setHasDismissedIntro(true);
  };

  const handleCreateNewIsland = () => {
    setEditMode(true);
    setShowIntroNotification(false);
    setHasDismissedIntro(true);
    resetIsland();
  };

  // Manage mutually exclusive state for sculpt and place tools
  useEffect(() => {
    const tool = activeTool;
    setActiveTool(null);
    setActiveTool(tool);

    if (tool === "sculpt+" || tool === "sculpt-") {
      setSculptProp("active", true);
      setPlaceProp("decorSelect", false);
      setPlaceProp("active", false);
    }
    if (tool === "move") {
      setPlaceProp("active", false);
      setPlaceProp("item", null);
      setPlaceProp("decorSelect", false);
      setSculptProp("active", false);
    }
    if (tool === "decor-select") {
      setSculptProp("active", false);
    }
  }, [activeTool, setActiveTool, setPlaceProp, setSculptProp]);

  // Create snapshot
  const handleCreateSnapshot = () => {
    const snapshot = createSnapshot();
    const blob = new Blob([snapshot], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "island_snapshot.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load default island
  // const handleLoadDefaultIsland = () => {
  //   const defaultIslandPath = "/island/snapshots/default.json"; // Replace with your actual path
  //   loadSnapshotFromPath(defaultIslandPath).catch(error => {
  //     new Error("Error loading default island:", error);
  //   });
  // };

  return (
    <section>
      <motion.div className='cursor-default fixed top-4 left-4 z-40 flex flex-col items-center space-y-2 bg-white p-2 rounded-4xl shadow-md h-auto'>
        <ToolbarToggle editMode={editMode} toggleEditMode={toggleEditMode} />

        {editMode &&
          TOOL_OPTIONS.map(tool => {
            switch (tool.type) {
              case "toggle":
                return (
                  <ToggleTool
                    key={tool.id}
                    tool={tool}
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    setPlaceProp={setPlaceProp}
                    setSculptProp={setSculptProp}
                  />
                );
              case "action":
                return (
                  <ActionTool key={tool.id} tool={tool} setShowHelpModal={setShowHelpModal} handleCreateSnapshot={handleCreateSnapshot} />
                );
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
              // decor-select case removed as it's now handled by MegaPlaceDecorButton
              default:
                return null;
            }
          })}

        {showHelpModal && (
          <div role='dialog' aria-modal='true' className='fixed inset-0 bg-ocean/50 backdrop-blur-md flex justify-center items-center z-50'>
            <div className='bg-white rounded-lg shadow max-w-2xl w-full p-6'>
              <h2 className='text-xl font-semibold mb-4'>Tips & Shortcuts</h2>
              <div className='mb-4'>
                <h3 className='font-medium mb-4'>Keyboard Shortcuts:</h3>
                <ul className='list-outside list-none ml-0 space-y-1'>
                  <li>
                    <KeyBindingItem keyCombination={["e"]} action='Toggle edit mode' />
                  </li>
                  <li>
                    <KeyBindingItem keyCombination={["v"]} action='Move tool (Camera control)' />
                  </li>
                  <li className='flex items-center gap-x-3'>
                    <KeyBindingItem keyCombination={["a", "s"]} action='Raise / Lower terrain mode' separator=' ' />
                  </li>
                  <li className='pt-2 pb-3 text-sm'>
                    <strong className='text-blue-600'>Tip!</strong> In either terrain mode, hold <Kbd>Alt</Kbd> to quickly switch between
                    modes.
                    <br />
                    Hold <Kbd>Ctrl</Kbd> to access the move tool and adjust the camera.
                  </li>
                  <li>
                    <KeyBindingItem keyCombination={["[", "]"]} action='Make brush size smaller / bigger' separator=' ' />
                  </li>
                  <li>
                    <KeyBindingItem keyCombination={["-", "+"]} action='Make brush strength smaller / bigger' separator=' ' />
                  </li>
                  <li>
                    <KeyBindingItem keyCombination={["u", "y"]} action='Undo / Redo' />
                  </li>
                  <li>
                    <KeyBindingItem keyCombination={["Shift + R"]} action='Reset' />
                  </li>
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
      </motion.div>
      {showIntroNotification && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className='fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-md rounded-lg p-8 w-11/12 max-w-xl z-50 cursor-default'
        >
          <div className='text-left space-y-2 mb-3'>
            <p className='font-medium text-base'>🏝️ Model Island - Sculpt and decorate your own paradise 🏝️</p>
          </div>
          <p className='text-sm text-gray-700 mb-3'>
            Click the pencil button in the top left to try editing this one! If you're feeling brave you can create a new island from
            scratch by clicking the button below!
          </p>
          <div className='flex justify-between items-center'>
            <button onClick={handleCreateNewIsland} className='btn'>
              Create New Island
            </button>
            <button onClick={handleDismissIntro} className='btn-dotted !text-sm text-slate-600'>
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* Logo */}
      {/* <LogoMark /> */}

      {/* Credits button */}
      <div className='absolute bottom-[26px] right-12 w-[26px] h-[26px] flex items-center'>
        <button onClick={() => setShowCreditsModal(true)} className='btn-dotted text-white'>
          Credits
        </button>
      </div>

      {/* Reset to default island button */}
      <div className='absolute top-4 right-4 h-14 group'>
        <ToolTip position='left' offset={20}>
          <span className='text-sm'>Load Starter Island</span>
        </ToolTip>
        <button onClick={() => loadSnapshotFromPath("/island/snapshots/default.json")} className=' group/btn'>
          <span className='size-14 rounded-full bg-white shadow-md flex items-center justify-center relative'>
            <span className='size-[50px] rounded-full overflow-hidden'>
              <img
                src='/island/images/island-preview@2x.jpg'
                alt='Revert to Starter Island'
                className='w-full h-full object-cover transition-transform duration-500 group-hover/btn:scale-110'
              />
            </span>
            <span className='size-5 absolute top-1/2 -translate-y-1/2 left-0 -translate-x-3 bg-gradient-to-b from-[#2D5CF2] to-[#2A50C7] rounded-full flex items-center justify-center'>
              <Undo2 className='-scale-x-100' size={12} stroke='white' strokeWidth={2} />
            </span>
          </span>
        </button>
      </div>

      {/* Mega place decor button */}
      {editMode && <MegaPlaceDecorButton />}

      {/* Credits modal */}
      {showCreditsModal && (
        <div
          role='dialog'
          aria-modal='true'
          className='fixed inset-0 bg-ocean/50 backdrop-blur-md flex justify-center items-center z-50 prose'
        >
          <div className='bg-white rounded-lg shadow max-w-xl w-full p-6'>
            <h2 className='text-xl font-semibold mb-4'>Credits</h2>
            <div className='mb-4'>
              <p>
                Model Island is work in progress by Huw Roberts. You can find more of my creations at{" "}
                <a href='https://huwroberts.net' target='_blank'>
                  huwroberts.net
                </a>{" "}
                or follow me on{" "}
                <a href='https://bsky.app/profile/huwroberts.net' target='_blank' rel='noopener noreferrer'>
                  Bluesky
                </a>
                .
              </p>
            </div>
            <div className='mb-4'>
              <h3 className='font-medium mb-4'>Models:</h3>
              <p>
                <ul className='list-disc list-inside'>
                  <li>
                    <a href='https://poly.pizza/m/XMvD3AilGv' target='_blank' rel='noopener noreferrer'>
                      Tree Fall - Kenney
                    </a>
                    <li>
                      <a href='https://poly.pizza/m/bN9Oz3niNm' target='_blank' rel='noopener noreferrer'>
                        Dock Long - Quaternius
                      </a>
                    </li>
                    <li>
                      <a href='https://poly.pizza/m/6I2DF2AZDgB' target='_blank' rel='noopener noreferrer'>
                        Wind Turbine - Poly by Google
                      </a>
                    </li>
                    <li>
                      <a href='https://poly.pizza/m/LrTs3hVGXv' target='_blank' rel='noopener noreferrer'>
                        Tent - Kenney
                      </a>
                    </li>
                  </li>
                </ul>
              </p>
            </div>
            <div className='mb-4'>
              <h3 className='font-medium mb-4'>Icons:</h3>
              <p>
                <a href='https://lucide.dev/' target='_blank'>
                  Lucide Icons
                </a>
              </p>
            </div>
            <button
              onClick={() => setShowCreditsModal(false)}
              className='cursor-pointer mt-2 px-4 py-2 bg-blue-600 text-white rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400'
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
