import { motion } from "framer-motion";
import React from "react";

import { ToolbarToggle, ToggleTool, ActionTool, SliderTool } from "./index";

/**
 * Main toolbar component
 * @param {Object} props
 * @param {boolean} props.editMode - Whether edit mode is active
 * @param {Function} props.toggleEditMode - Function to toggle edit mode
 * @param {Array} props.toolOptions - Array of tool options
 * @param {string} props.activeTool - Currently active tool ID
 * @param {Function} props.setActiveTool - Function to set active tool
 * @param {Function} props.setPlaceProp - Function to set place property
 * @param {Function} props.setSculptProp - Function to set sculpt property
 * @param {Object} props.sculpt - Sculpt state
 * @param {string|null} props.openSlider - Currently open slider ID
 * @param {Function} props.setOpenSlider - Function to set open slider
 * @param {Function} props.setShowHelpModal - Function to show help modal
 * @param {Function} props.handleCreateSnapshot - Function to create snapshot
 */
function Toolbar({
  editMode,
  toggleEditMode,
  toolOptions,
  activeTool,
  setActiveTool,
  setPlaceProp,
  setSculptProp,
  sculpt,
  openSlider,
  setOpenSlider,
  setShowHelpModal,
  handleCreateSnapshot,
}) {
  return (
    <motion.div className='cursor-default fixed top-4 left-4 z-40 flex flex-col items-center space-y-2 bg-white p-2 rounded-4xl shadow-md h-auto'>
      <ToolbarToggle editMode={editMode} toggleEditMode={toggleEditMode} />

      {editMode &&
        toolOptions.map(tool => {
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
    </motion.div>
  );
}

export default Toolbar;
