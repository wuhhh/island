import { useEffect, useState } from "react";

import { useDecorRegistry } from "../hooks/useDecorRegistry.jsx";
import { useHistoryStore } from "../stores/useHistoryStore";
import { useIslandStore, useIslandHydration } from "../stores/useIslandStore";

import DecorPlacementSystem from "./DecorPlacementSystem";

export default function DecorSystem() {
  const decorRegistry = useDecorRegistry();
  const editMode = useIslandStore(state => state.editMode);
  const activeTool = useIslandStore(state => state.activeTool);
  const placeActive = useIslandStore(state => state.place.active);
  const placeItem = useIslandStore(state => state.place.item);
  const selectedItems = useIslandStore(state => state.selectedItems);
  const setSelectedItems = useIslandStore(state => state.actions.setSelectedItems);
  const terrainSystem = useIslandStore(state => state.terrainSystem);
  const setPlacedItems = useHistoryStore(state => state.setPlacedItems);
  const placedItems = useHistoryStore(state => state.placedItems);
  const islandStoreHydrated = useIslandHydration();

  const [hoveredId, setHoveredId] = useState(null);

  /**
   * handlePlaceItem
   * @param {Object} itemData - The data of the item to be placed
   * itemData.id - The ID of the item
   * itemData.position - The position of the item
   * itemData.quaternion - The orientation quaternion of the item
   * itemData.scale - The scale of the item
   * itemData.color - The color of the item
   * itemData.type - The type of the item
   */
  const handlePlaceItem = itemData => {
    const { type, position, quaternion, scale, color = decorRegistry[type].defaultProps.color } = itemData;

    setPlacedItems([
      ...placedItems,
      {
        id: Date.now(),
        position,
        quaternion,
        scale,
        color,
        type,
      },
    ]);
  };

  // Backspace key down deletes selected item
  useEffect(() => {
    if (!islandStoreHydrated) return;

    const handleKeyDown = e => {
      if (e.key === "Backspace" && selectedItems.length > 0) {
        setPlacedItems(placedItems.filter(item => !selectedItems.includes(item.id)));
        setSelectedItems([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedItems, placedItems, islandStoreHydrated, setPlacedItems, setSelectedItems]);

  return (
    <>
      {/* Placed items */}
      {placedItems.map(item => {
        const Item = decorRegistry[item.type].Component;
        const isSelected = selectedItems.includes(item.id);

        return (
          <Item
            castShadow
            receiveShadow
            key={item.id}
            color={item.color}
            position={item.position?.toArray ? item.position.toArray() : item.position}
            quaternion={item.quaternion?.toArray ? item.quaternion.toArray() : item.quaternion}
            scale={item.scale?.toArray ? item.scale.toArray() : item.scale}
            onClick={e => {
              if (activeTool !== "move" || !editMode) return;

              e.stopPropagation();
              const isSelected = selectedItems.includes(item.id);
              const newSelected = isSelected ? selectedItems.filter(id => id !== item.id) : [...selectedItems, item.id];
              setSelectedItems(newSelected);
            }}
            onPointerOver={e => {
              e.stopPropagation(); // <‑‑ cut the loop here
              setHoveredId(item.id);
            }}
            onPointerOut={() => setHoveredId(null)}
            hovered={editMode && activeTool === "move" && hoveredId === item.id}
            hoveredColor={0xffff00}
            selected={isSelected && editMode}
            selectedColor='#ffff00'
          />
        );
      })}

      {/* Placement system */}
      {placeActive && (
        <DecorPlacementSystem
          active={editMode && placeActive}
          terrain={terrainSystem.mesh}
          placementProps={decorRegistry[placeItem].placementProps}
          onPlaceItem={handlePlaceItem}
        >
          {(() => {
            // Get the component
            const Preview = decorRegistry[placeItem].Component;
            // Get the default props
            const { color, scale } = decorRegistry[placeItem].defaultProps;
            return <Preview visible={false} color={color} scale={scale} userData={{ type: placeItem }} />;
          })()}
        </DecorPlacementSystem>
      )}
    </>
  );
}
