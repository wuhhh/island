// DecorPlacementSystem.jsx
import { useFrame } from "@react-three/fiber";
import React, { useState, useRef } from "react";

export default function DecorPlacementSystem({ active, terrain, onPlaceItem, children }) {
  const [hoverPoint, setHoverPoint] = useState(null);
  const itemRef = useRef();

  // Update hover position on mouse move
  useFrame(({ raycaster }) => {
    if (!active || !terrain) return;

    const intersection = raycaster.intersectObject(terrain);

    if (intersection.length > 0) {
      setHoverPoint(intersection[0].point);
    } else {
      setHoverPoint(null);
    }
  });

  // Handle placement on click
  const handleClick = e => {
    if (!active || !hoverPoint) return;

    e.stopPropagation();
    onPlaceItem({
      position: hoverPoint.clone(),
      rotation: itemRef.current.rotation.clone(),
      type: itemRef.current.userData.type,
      scale: itemRef.current.scale.clone(),
    });
  };

  return (
    <group onClick={handleClick}>
      {active &&
        hoverPoint &&
        React.cloneElement(children, {
          ref: itemRef,
          position: hoverPoint,
          visible: true,
        })}
    </group>
  );
}
