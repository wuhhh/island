import { useEffect, useMemo, useState } from "react";
import { useIslandStore, useIslandHydration } from "../stores/useIslandStore";
import { useHistoryStore } from "../stores/useHistoryStore";
import DecorItem from "../components/DecorItem";
import DecorPlacementSystem from "./DecorPlacementSystem";
import decorRegistry from "../config/decorRegistry";

export default function DecorSystem() {
  const editMode = useIslandStore(state => state.editMode);
  const placeActive = useIslandStore(state => state.place.active);
  const placeItem = useIslandStore(state => state.place.item);
  const selectedItems = useIslandStore(state => state.selectedItems);
  const setSelectedItems = useIslandStore(state => state.actions.setSelectedItems);
  const terrainSystem = useIslandStore(state => state.terrainSystem);
  const setPlacedItems = useHistoryStore(state => state.setPlacedItems);
  const placedItems = useHistoryStore(state => state.getPlacedItems());

  const islandStoreHydrated = useIslandHydration();

  // build all models once
  const decorModels = useMemo(() => Object.fromEntries(Object.entries(decorRegistry).map(([type, def]) => [type, def.createModel()])), []);

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
    console.log("Placing item:", itemData);

    const { type, position, rotation, scale } = itemData;
    setPlacedItems([
      ...placedItems,
      {
        id: Date.now(),
        position: position.toArray(),
        rotation: rotation.toArray(),
        scale: scale.toArray(),
        color: decorRegistry[type].defaultProps.color,
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
  }, [selectedItems, placedItems, islandStoreHydrated]);

  return (
    <>
      {/* Placed items */}
      {placedItems.map(item => (
        <DecorItem
          key={item.id}
          id={item.id}
          type={item.type}
          model={decorModels[item.type].clone()}
          color={item.color}
          position={item.position}
          rotation={item.rotation}
          scale={item.scale}
          onClick={e => {
            if (!editMode || placeActive) return;
            e.stopPropagation();

            if (selectedItems.includes(item.id)) {
              setSelectedItems(selectedItems.filter(id => id !== item.id));
            } else {
              setSelectedItems([...selectedItems, item.id]);
            }
          }}
          selected={Array.isArray(selectedItems) && selectedItems.includes(item.id)}
        />
      ))}

      {/* Placement system */}
      {placeActive && (
        <DecorPlacementSystem active={editMode && placeActive} terrain={terrainSystem.mesh} onPlaceItem={handlePlaceItem}>
          <DecorItem
            color={decorRegistry[placeItem].defaultProps.color}
            type={placeItem}
            model={decorModels[placeItem].clone()}
            visible={false}
          />
        </DecorPlacementSystem>
      )}
    </>
  );
}
