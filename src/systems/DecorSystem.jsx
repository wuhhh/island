import { useMemo } from "react";
import * as THREE from "three/webgpu";
import { useIslandStore } from "../stores/useIslandStore";
import { useHistoryStore } from "../stores/useHistoryStore";
import DecorItem from "../components/DecorItem";
import DecorPlacementSystem from "./DecorPlacementSystem";
import decorRegistry from "../config/decorRegistry";

export default function DecorSystem() {
  const editMode = useIslandStore(state => state.editMode);
  const placeActive = useIslandStore(state => state.place.active);
  const placeItem = useIslandStore(state => state.place.item);
  const terrainSystem = useIslandStore(state => state.terrainSystem);
  const setPlacedItems = useHistoryStore(state => state.setPlacedItems);
  const placedItems = useHistoryStore(state => state.getPlacedItems());

  // build all models once
  const decorModels = useMemo(() => Object.fromEntries(Object.entries(decorRegistry).map(([type, def]) => [type, def.createModel()])), []);

  /**
   * handlePlaceItem
   * @param {Object} itemData - The data of the item to be placed
   * itemData.id - The ID of the item
   * itemData.position - The position of the item
   * itemData.rotation - The rotation of the item
   * itemData.scale - The scale of the item
   * itemData.type - The type of the item
   */
  const handlePlaceItem = itemData => {
    console.log("Placing item:", itemData);

    const { type, position, rotation, scale } = itemData;
    setPlacedItems([
      ...placedItems,
      {
        id: Date.now(),
        type,
        position: position.toArray(),
        rotation: rotation.toArray(),
        scale: scale.toArray(),
        color: decorRegistry[type].defaultProps.color,
      },
    ]);
  };

  return (
    <>
      {/* Placed items */}
      {placedItems.map(item => (
        <DecorItem
          key={item.id}
          type={item.type}
          model={decorModels[item.type].clone()}
          color={item.color}
          position={item.position}
          rotation={item.rotation}
          scale={item.scale}
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
