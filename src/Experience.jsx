import * as THREE from "three/webgpu";
import { useState } from "react";
import { Canvas, extend } from "@react-three/fiber";
import DecorItem from "./components/DecorItem";
import DecorPlacementSystem from "./systems/DecorPlacementSystem";
import Ocean from "./components/Ocean";
import Grid from "./components/Grid";
import CameraController from "./components/CameraController";
import Terrain from "./components/Terrain";
// import ShoreLine from "./components/ShoreLine";
import UI from "./components/UI";
import { CAMERA_POSITION, CAMERA_TARGET, useIslandStore } from "./stores/useIslandStore";
import { Leva } from "leva";
import { useKeyboardManager } from "./hooks/useKeyboardManager";

extend(THREE);

const Scene = () => {
  const editMode = useIslandStore(state => state.editMode);
  const placeActive = useIslandStore(state => state.place.active);
  const placeItem = useIslandStore(state => state.place.item);
  const terrainSystem = useIslandStore(state => state.terrainSystem);
  const [placedItems, setPlacedItems] = useState([]);

  const debugBoxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const debugBoxMaterial = new THREE.MeshStandardMaterial({ color: "red" });
  const debugBoxModel = new THREE.Mesh(debugBoxGeometry, debugBoxMaterial);

  // Map of available decor items
  const decorModels = {
    debugBox: debugBoxModel,
    // Add more decor items here
  };

  // Handle placing a new item
  const handlePlaceItem = itemData => {
    console.log("Placing item:", itemData);

    setPlacedItems([
      ...placedItems,
      {
        id: Date.now(),
        ...itemData,
      },
    ]);
  };

  return (
    <>
      <Grid
        visible={editMode}
        args={[2, 2]}
        position={[0, 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        gridSize={20}
        lineWidth={2}
        gridAlpha={0.1}
        lineColor='cyan'
      />
      <Terrain renderOrder={1} position={[0, 0, 0]} />
      {/* <ShoreLine position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} /> */}
      {/* Placed items */}
      {placedItems.map(item => (
        <DecorItem
          key={item.id}
          type={item.type}
          model={decorModels[item.type].clone()}
          position={item.position}
          rotation={item.rotation}
          scale={item.scale}
        />
      ))}

      {/* Placement system */}
      {placeActive && (
        <DecorPlacementSystem active={placeActive} terrain={terrainSystem.mesh} onPlaceItem={handlePlaceItem}>
          <DecorItem type={placeItem} model={decorModels[placeItem].clone()} visible={false} />
        </DecorPlacementSystem>
      )}
      <Ocean args={[30, 0, 30]} position={[0, -0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} resolution={1} />
      <directionalLight position={[1, 1, 1]} intensity={2} color='red' />
      <directionalLight position={[1, 1, -1]} intensity={2} color='pink' />
      <directionalLight position={[-1, 1, -1]} intensity={2} color='orange' />
      <directionalLight position={[-1, 1, 1]} intensity={2} color='yellow' />
      <ambientLight intensity={1.5} />
      <CameraController />
    </>
  );
};

const Experience = () => {
  useKeyboardManager();

  const { setPointerDown } = useIslandStore(state => state.actions);

  return (
    <>
      <Canvas
        gl={async props => {
          const renderer = new THREE.WebGPURenderer(props);
          await renderer.init();
          return renderer;
        }}
        camera={{ fov: 35, position: CAMERA_POSITION, target: CAMERA_TARGET }}
        onPointerDown={() => setPointerDown(true)}
        onPointerUp={() => setPointerDown(false)}
      >
        <Scene />
      </Canvas>
      <UI />
      <Leva hidden />
    </>
  );
};

export default Experience;
