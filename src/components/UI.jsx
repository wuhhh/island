import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, X, Plus, Minus, SlidersHorizontal, Circle, RotateCcw, RotateCw, RefreshCw, HelpCircle, Grab } from "lucide-react";
import Kbd from "./Kbd";
import KeyBindingItem from "./KeyBindingItem";
import { useIslandStore } from "../stores/useIslandStore";
import { useHistoryStore } from "../stores/useHistoryStore";

const TOOL_OPTIONS = [
  { id: "move", icon: Grab, label: "Move" },
  { id: "sculpt+", icon: Plus, label: "Sculpt +" },
  { id: "sculpt-", icon: Minus, label: "Sculpt -" },
  { id: "strength", icon: SlidersHorizontal, label: "Brush Strength" },
  { id: "size", icon: Circle, label: "Brush Size" },
];

const ToolTip = ({ label }) => (
  <span className='absolute left-full top-1/2 transform -translate-y-1/2 ml-2 whitespace-nowrap bg-black text-white text-sm rounded px-2 py-1 hidden group-hover:block'>
    {label}
  </span>
);

export default function IslandEditorUI() {
  const editMode = useIslandStore(state => state.editMode);
  const setEditMode = useIslandStore(state => state.actions.setEditMode);
  const sculpt = useIslandStore(state => state.sculpt);
  const setSculptProp = useIslandStore(state => state.actions.setSculptProp);
  const { undo: useHistoryStoreUndo, redo: useHistoryStoreRedo } = useHistoryStore.temporal.getState();
  const [activeTool, setActiveTool] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleToolClick = toolId => {
    setActiveTool(toolId);

    switch (toolId) {
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
      case "strength":
      case "size":
        setActiveTool(activeTool === toolId ? null : toolId);
        break;
      default:
        break;
    }
  };

  const pullerWidth = "2.5rem"; // button width (p-2 → 2.5rem)
  const toolbarWidth = "4rem"; // panel width (w-16 → 4rem)

  // Sync activeTool with current editMode and sculpt state
  useEffect(() => {
    if (!editMode) return;
    if (sculpt.active) {
      setActiveTool(sculpt.mode === "add" ? "sculpt+" : "sculpt-");
    } else {
      setActiveTool("move");
    }
  }, [editMode, sculpt.active, sculpt.mode]);

  return (
    <>
      {/* Unified Drawer: toolbar + puller */}
      <motion.div
        initial={{ x: `calc(-${toolbarWidth} + ${pullerWidth})` }}
        animate={{ x: editMode ? 0 : `calc(-${toolbarWidth} + ${pullerWidth})` }}
        transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
        className='cursor-default fixed top-4 left-4 z-40 flex flex-col items-center space-y-2 bg-white p-2 rounded-xl shadow-md h-auto'
      >
        {/* Puller (toggle) */}
        <button
          onClick={toggleEditMode}
          aria-label={editMode ? "Close toolbar" : "Open toolbar"}
          className='cursor-pointer w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 relative'
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
                <X />
              </motion.div>
            ) : (
              <motion.div
                key='edit'
                initial={{ rotate: 20, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -20, opacity: 0 }}
                className='absolute inset-0 flex items-center justify-center'
              >
                <Edit2 />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Toolbar buttons (only when open) */}
        {editMode && (
          <>
            {TOOL_OPTIONS.map(opt => {
              const isSlider = activeTool === opt.id && ["strength", "size"].includes(opt.id);
              return (
                <div key={opt.id} className='relative group'>
                  <button
                    onClick={() => handleToolClick(opt.id)}
                    aria-label={opt.label}
                    className={`cursor-pointer w-10 h-10 flex items-center justify-center text-white rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 ${
                      activeTool === opt.id ? "bg-blue-500" : "bg-gray-700"
                    }`}
                  >
                    <opt.icon />
                  </button>
                  {!isSlider && <ToolTip label={opt.label} />}
                  {isSlider && (
                    <div className='absolute left-full top-1/2 transform -translate-y-1/2 ml-[20px] w-48 p-2 bg-gray-700 rounded'>
                      <label htmlFor={`${opt.id}-slider`} className='block text-white text-sm mb-1'>
                        {opt.label.split(" ")[1]}
                      </label>
                      <input
                        id={`${opt.id}-slider`}
                        type='range'
                        min='0.01'
                        max='1'
                        step='0.01'
                        value={opt.id === "strength" ? sculpt.brushStrength : sculpt.brushSize}
                        onChange={e =>
                          opt.id === "strength"
                            ? setSculptProp("brushStrength", +e.target.value)
                            : setSculptProp("brushSize", +e.target.value)
                        }
                        className='w-full'
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Reset & Help at bottom */}
            <div className='flex flex-col items-center space-y-4'>
              <div className='relative group'>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  aria-label='Reset all changes'
                  className='cursor-pointer w-10 h-10 flex items-center justify-center bg-red-600 text-white rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400'
                >
                  <RefreshCw />
                </button>
                <ToolTip label='Reset' />
              </div>
              <div className='relative group'>
                <button
                  onClick={() => setShowHelpModal(true)}
                  aria-label='Show help and shortcuts'
                  className='cursor-pointer w-10 h-10 flex items-center justify-center bg-gray-700 text-white rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400'
                >
                  <HelpCircle />
                </button>
                <ToolTip label='Help' />
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Undo/Redo controls */}
      {editMode && (
        <div className='fixed bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-50'>
          <button
            onClick={() => useHistoryStoreUndo()}
            aria-label='Undo'
            className='cursor-pointer w-10 h-10 flex items-center justify-center transition-colors duration-100 bg-gray-700 hover:bg-gray-600 text-white rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400'
          >
            <RotateCcw />
          </button>
          <button
            onClick={() => useHistoryStoreRedo()}
            aria-label='Redo'
            className='cursor-pointer w-10 h-10 flex items-center justify-center transition-colors duration-100 bg-gray-700 hover:bg-gray-600 text-white rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400'
          >
            <RotateCw />
          </button>
        </div>
      )}

      {/* Help Modal */}
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

      {/* Reset Confirmation Modal */}
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
    </>
  );
}
