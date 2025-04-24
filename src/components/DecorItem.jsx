// DecorItem.jsx
import * as THREE from "three/webgpu";
import { forwardRef, useImperativeHandle, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const DecorItem = forwardRef(({ type, model, position, rotation = [0, 0, 0], scale = 1, onSelect, selected = false, ...props }, ref) => {
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
      if (hovered || selected) {
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
      material={model.material}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={e => setHovered(true)}
      onPointerOut={e => setHovered(false)}
      {...props}
    />
  );
});

export default DecorItem;
