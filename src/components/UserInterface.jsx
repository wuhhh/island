import { Brush, CircleDotDashed, CircleFadingPlus, Download, Eraser, Hand, HelpCircle, Redo, RefreshCw, Undo } from "lucide-react";
import React, { useEffect, useState } from "react";

import { useKeyboardManager } from "../hooks/useKeyboardManager";
import { useResetIsland } from "../hooks/useResetIsland.js";
import { useIslandStore } from "../stores/useIslandStore.js";
import { createSnapshot, loadSnapshotFromPath } from "../utils/islandSnapshot.js";

import MegaPlaceDecorButton from "./MegaPlaceDecorButton.jsx";
import { Toolbar } from "./ui";
import CreditsButton from "./ui/CreditsButton.jsx";
import CreditsModal from "./ui/CreditsModal.jsx";
import DefaultIslandButton from "./ui/DefaultIslandButton.jsx";
import HelpModal from "./ui/HelpModal.jsx";
import IntroNotification from "./ui/IntroNotification.jsx";

// Tool options for the toolbar
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

// All UI components have been moved to their own files in the ui directory

export default function UserInterface() {
  // Set up the keyboard manager for shortcuts
  useKeyboardManager();

  // State from stores
  const editMode = useIslandStore(state => state.editMode);
  const setEditMode = useIslandStore(state => state.actions.setEditMode);
  const sculpt = useIslandStore(state => state.sculpt);
  const setPlaceProp = useIslandStore(state => state.actions.setPlaceProp);
  const setSculptProp = useIslandStore(state => state.actions.setSculptProp);
  const activeTool = useIslandStore(state => state.activeTool);
  const setActiveTool = useIslandStore(state => state.actions.setActiveTool);
  const hasDismissedIntro = useIslandStore(state => state.persisted.hasDismissedIntro);
  const setHasDismissedIntro = useIslandStore(state => state.actions.setHasDismissedIntro);

  // Local state
  const resetIsland = useResetIsland();
  const [openSlider, setOpenSlider] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showIntroNotification, setShowIntroNotification] = useState(false);

  // Toggle edit mode
  const toggleEditMode = () => setEditMode(!editMode);

  // Show intro notification
  useEffect(() => {
    if (!hasDismissedIntro) {
      const timer = setTimeout(() => setShowIntroNotification(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasDismissedIntro]);

  // Handle dismissing the intro
  const handleDismissIntro = () => {
    setShowIntroNotification(false);
    setHasDismissedIntro(true);
  };

  // Handle creating a new island
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
  const handleLoadDefaultIsland = () => {
    loadSnapshotFromPath("/island/snapshots/default.json");
  };

  return (
    <section>
      {/* Main Toolbar */}
      <Toolbar
        editMode={editMode}
        toggleEditMode={toggleEditMode}
        toolOptions={TOOL_OPTIONS}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        setPlaceProp={setPlaceProp}
        setSculptProp={setSculptProp}
        sculpt={sculpt}
        openSlider={openSlider}
        setOpenSlider={setOpenSlider}
        setShowHelpModal={setShowHelpModal}
        handleCreateSnapshot={handleCreateSnapshot}
      />

      {/* Modals */}
      <HelpModal show={showHelpModal} onClose={() => setShowHelpModal(false)} />
      <IntroNotification show={showIntroNotification} onDismiss={handleDismissIntro} onCreateNewIsland={handleCreateNewIsland} />
      <CreditsModal show={showCreditsModal} onClose={() => setShowCreditsModal(false)} />

      {/* Additional UI Elements */}
      <CreditsButton onShowCredits={() => setShowCreditsModal(true)} />
      <DefaultIslandButton onLoadDefaultIsland={handleLoadDefaultIsland} />

      {/* Decorations Button */}
      {editMode && <MegaPlaceDecorButton />}
    </section>
  );
}
