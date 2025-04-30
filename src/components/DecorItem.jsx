// DecorItem.jsx
import { useFrame } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react";
import * as THREE from "three/webgpu";

import { useIslandStore } from "../stores/useIslandStore";

const DecorItem = forwardRef(({ id, type, model, color, position, rotation = [0, 0, 0], scale = 1, selected, ...props }, ref) => {
  const editMode = useIslandStore(state => state.editMode);
  const placeActive = useIslandStore(state => state.place.active);
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Expose internal methods to parent
  useImperativeHandle(ref, () => ({
    ...meshRef.current,
    userData: { type },
  }));

  // Handle hover effects
  useFrame(() => {
    if (meshRef.current) {
      if ((hovered || selected) && editMode && !placeActive) {
        // Apply hover/selected effects
        meshRef.current.material.emissive = new THREE.Color(selected ? 0x33aa33 : 0x555555);
        meshRef.current.material.needsUpdate = true;
      } else {
        meshRef.current.material.emissive = new THREE.Color(0x000000);
        meshRef.current.material.needsUpdate = true;
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={model.geometry}
      material={new THREE.MeshStandardMaterial({ color })}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={e => setHovered(true)}
      onPointerOut={e => setHovered(false)}
      onClick={e => {
        if (!editMode || placeActive) return;
        e.stopPropagation();
        setSelected(!selected);
      }}
      {...props}
    />
  );
});

export default DecorItem;
