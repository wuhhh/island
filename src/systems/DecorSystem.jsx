import { useEffect } from "react";
import { useIslandStore, useIslandHydration } from "../stores/useIslandStore";
import { useHistoryStore } from "../stores/useHistoryStore";
import { useDecorRegistry } from "../hooks/useDecorRegistry.jsx";
import DecorPlacementSystem from "./DecorPlacementSystem";

export default function DecorSystem() {
  const decorRegistry = useDecorRegistry();
  const editMode = useIslandStore(state => state.editMode);
  const placeActive = useIslandStore(state => state.place.active);
  const placeItem = useIslandStore(state => state.place.item);
  const selectedItems = useIslandStore(state => state.selectedItems);
  const setSelectedItems = useIslandStore(state => state.actions.setSelectedItems);
  const terrainSystem = useIslandStore(state => state.terrainSystem);
  const setPlacedItems = useHistoryStore(state => state.setPlacedItems);
  const placedItems = useHistoryStore(state => state.getPlacedItems());
  const islandStoreHydrated = useIslandHydration();

  /**
   * handlePlaceItem
   * @param {Object} itemData - The data of the item to be placed
   * itemData.id - The ID of the item
   * itemData.position - The position of the item
   * itemData.rotation - The rotation of the item
   * itemData.scale - The scale of the item
   * itemData.color - The color of the item
   * itemData.type - The type of the item
   */
  const handlePlaceItem = itemData => {
    const { type, position, rotation, scale, color = decorRegistry[type].defaultProps.color } = itemData;

    setPlacedItems([
      ...placedItems,
      {
        id: Date.now(),
        position: position.toArray(),
        rotation: rotation.toArray(),
        scale: scale.toArray(),
        color,
        type,
      },
    ]);

    console.log(placedItems);
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
  }, [selectedItems, placedItems, islandStoreHydrated]);

  return (
    <>
      {/* Placed items */}
      {islandStoreHydrated &&
        placedItems.map(item => {
          const Item = decorRegistry[item.type].Component;
          const isSelected = selectedItems.includes(item.id);

          return (
            <Item
              key={item.id}
              // type={item.type}
              color={item.color}
              position={item.position}
              rotation={item.rotation}
              scale={item.scale}
              onClick={e => {
                // console.log("clicked", item);

                if (!editMode || placeActive) return;
                e.stopPropagation();
                const isSelected = selectedItems.includes(item.id);
                const newSelected = isSelected ? selectedItems.filter(id => id !== item.id) : [...selectedItems, item.id];
                setSelectedItems(newSelected);
              }}
              selected={isSelected}
              highlightColor='#ffff00'
            />
          );
        })}

      {/* Placement system */}
      {placeActive && (
        <DecorPlacementSystem active={editMode && placeActive} terrain={terrainSystem.mesh} onPlaceItem={handlePlaceItem}>
          {(() => {
            const Preview = decorRegistry[placeItem].Component;
            const { color, scale } = decorRegistry[placeItem].defaultProps;
            return <Preview visible={false} color={color} scale={scale} userData={{ type: placeItem }} />;
          })()}
        </DecorPlacementSystem>
      )}
    </>
  );
}
