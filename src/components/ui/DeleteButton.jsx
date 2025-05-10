import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

import { useHistoryStore } from "../../stores/useHistoryStore.js";
import { useIslandStore } from "../../stores/useIslandStore.js";
import KeyBindingItem from "../KeyBindingItem";

import ToolbarButton from "./ToolbarButton";
import ToolTip from "./ToolTip";

export default function DeleteButton() {
  const selectedItems = useIslandStore(state => state.selectedItems);
  const setSelectedItems = useIslandStore(state => state.actions.setSelectedItems);
  const placedItems = useHistoryStore(state => state.placedItems);
  const setPlacedItems = useHistoryStore(state => state.setPlacedItems);

  const handleClick = () => {
    setPlacedItems(placedItems.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  };

  return (
    // Framer motion animate presence in up when selected items is not empty
    <motion.div
      className='absolute bottom-8 left-1/2 translate-x-12 group'
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: selectedItems.length > 0 ? 1 : 0, y: selectedItems.length > 0 ? 0 : 8 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: "spring", stiffness: 500, damping: 20, bounce: 0.5 }}
    >
      <ToolbarButton label='Delete Selected' onClick={handleClick} active={false}>
        <Trash2 strokeWidth={1} />
      </ToolbarButton>
      <ToolTip position='right' offset={16}>
        <KeyBindingItem keyCombination={["Backspace"]} action='Delete' tag='span' flip />
      </ToolTip>
    </motion.div>
  );
}
