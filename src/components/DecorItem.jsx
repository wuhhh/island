// DecorItem.jsx
import * as THREE from "three";
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
      } else {
        meshRef.current.material.emissive = new THREE.Color(0x000000);
      }
    }
  });

  return (
    <primitive
      ref={meshRef}
      object={model}
      position={position}
      rotation={rotation}
      scale={scale}
      // onClick={e => {
      //   e.stopPropagation();
      //   onSelect?.();
      // }}
      // onPointerOver={() => setHovered(true)}
      // onPointerOut={() => setHovered(false)}
      {...props}
    />
  );
});

export default DecorItem;
