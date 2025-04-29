// DecorPlacementSystem.jsx
import { useFrame } from "@react-three/fiber";
import React, { useState, useRef } from "react";
import * as THREE from "three";

export default function DecorPlacementSystem({ active, terrain, yCompensation = 0, onPlaceItem, children }) {
  const [hoverPoint, setHoverPoint] = useState(null);
  const [hoverNormal, setHoverNormal] = useState(null);
  const itemRef = useRef();

  // Update hover position on mouse move
  useFrame(({ raycaster }) => {
    if (!active || !terrain) return;

    const hits = raycaster.intersectObject(terrain);

    if (hits.length > 0) {
      const { point, face } = hits[0];
      point.add(new THREE.Vector3(0, yCompensation, 0)); // apply Y compensation

      // compute world-space normal
      const localNormal = face.normal.clone();
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(terrain.matrixWorld);
      const worldNormal = localNormal.applyMatrix3(normalMatrix).normalize();
      setHoverPoint(point);
      setHoverNormal(worldNormal);
    } else {
      setHoverPoint(null);
      setHoverNormal(null);
    }
  });

  // Handle placement on click
  const handleClick = e => {
    if (!active || !hoverPoint) return;

    let quaternion;
    if (hoverNormal) {
      // project onto XZ plane and compute yaw around Y
      const proj = new THREE.Vector3(hoverNormal.x, 0, hoverNormal.z).normalize();
      const angle = Math.atan2(proj.x, proj.z);
      quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    } else {
      quaternion = itemRef.current.quaternion.clone();
    }
    console.log("Placing item:", {
      position: hoverPoint.toArray(),
      quaternion: quaternion.toArray(),
      type: itemRef.current.userData.type,
      scale: itemRef.current.scale.toArray(),
    });

    e.stopPropagation();
    onPlaceItem({
      position: hoverPoint.toArray(),
      quaternion: quaternion.toArray(),
      type: itemRef.current.userData.type,
      scale: itemRef.current.scale.toArray(),
    });
  };

  // compute orientation quaternion for preview
  const previewQuat = hoverNormal
    ? (() => {
        const proj = new THREE.Vector3(hoverNormal.x, 0, hoverNormal.z).normalize();
        const angle = Math.atan2(proj.x, proj.z);
        return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      })()
    : null;
  return (
    <group onClick={handleClick}>
      {active &&
        hoverPoint &&
        React.cloneElement(children, {
          ref: itemRef,
          position: hoverPoint,
          quaternion: previewQuat?.toArray(),
          visible: true,
        })}
    </group>
  );
}
