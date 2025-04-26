import * as THREE from "three/webgpu";
import { useIslandStore } from "../stores/useIslandStore";
import { useHistoryStore } from "../stores/useHistoryStore";
import DecorItem from "../components/DecorItem";
import DecorPlacementSystem from "./DecorPlacementSystem";

export default function DecorSystem() {
  const editMode = useIslandStore(state => state.editMode);
  const placeActive = useIslandStore(state => state.place.active);
  const placeItem = useIslandStore(state => state.place.item);
  const terrainSystem = useIslandStore(state => state.terrainSystem);
  const setPlacedItems = useHistoryStore(state => state.setPlacedItems);
  const placedItems = useHistoryStore(state => state.getPlacedItems());

  const debugBoxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const debugBoxMaterial = new THREE.MeshStandardMaterial({ color: "red" });
  const debugBoxModel = new THREE.Mesh(debugBoxGeometry, debugBoxMaterial);

  // Map of available decor items
  const decorModels = {
    debugBox: debugBoxModel,
    // Add more decor items here
  };

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

    const id = Date.now();
    const position = itemData.position.toArray();
    const rotation = itemData.rotation.toArray();
    const scale = itemData.scale.toArray();
    const type = itemData.type;

    setPlacedItems([
      ...placedItems,
      {
        id,
        color: "red",
        position,
        rotation,
        scale,
        type,
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
          <DecorItem type={placeItem} model={decorModels[placeItem].clone()} visible={false} />
        </DecorPlacementSystem>
      )}
    </>
  );
}
