import { useFrame, useThree } from "@react-three/fiber";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Placement indicator helpers
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function defaultIndicator() {
  return {}; // visual feedback handled globally by ghost‑tint
}

export function highlightIndicator(isValid) {
  return isValid
    ? {}
    : {
        selected: true,
        selectedColor: 0xff0000,
      };
}

function validateYRange(point, placementProps) {
  const { yMin, yMax } = placementProps;
  const validMin = yMin != null ? point.y >= yMin : true;
  const validMax = yMax != null ? point.y <= yMax : true;
  return validMin && validMax;
}

/** Helper to swap / restore materials live (handles late‑loaded meshes too) */
function applyGhostTint(root, invalid, ghostMat) {
  if (!root) return;
  root.traverse(node => {
    if (!node.isMesh) return;
    if (node.name && node.name.endsWith("Hit")) return;
    if (invalid) {
      if (!node.userData._origMat) node.userData._origMat = node.material;
      node.material = ghostMat;
    } else if (node.userData._origMat) {
      node.material = node.userData._origMat;
      delete node.userData._origMat;
    }
  });
}

/**
 * DecorPlacementSystem with *live* ghost‑tint: the tint update now runs every
 * frame, so newly‑loaded meshes receive the red overlay the moment they appear.
 */
export default function DecorPlacementSystem({
  active,
  terrain,
  placementProps = {},
  indicator = defaultIndicator,
  onPlaceItem,
  children,
}) {
  const { gl, events } = useThree();

  const [hoverPoint, setHoverPoint] = useState(null);
  const [hoverNormal, setHoverNormal] = useState(null);
  const [isValid, setIsValid] = useState(false);

  const itemRef = useRef();

  /** Shared translucent red material */
  const ghostMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xff0000,
        opacity: 0.5,
        transparent: true,
        depthTest: false,
      }),
    []
  );

  /** Cleanup – restore any materials we hijacked */
  useEffect(() => () => applyGhostTint(itemRef.current, false, ghostMat), [ghostMat]);

  /** Placement commit */
  const commitPlacement = useCallback(() => {
    if (!hoverPoint || !isValid || !itemRef.current) return;

    const quat = (() => {
      if (!hoverNormal) return itemRef.current.quaternion.clone();
      const flat = new THREE.Vector3(hoverNormal.x, 0, hoverNormal.z).normalize();
      return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(flat.x, flat.z));
    })();

    if (placementProps.scaleVariance) {
      const f = 1 + (Math.random() - 0.5) * placementProps.scaleVariance;
      itemRef.current.scale.set(f, f, f);
    }

    onPlaceItem({
      position: hoverPoint.toArray(),
      quaternion: quat.toArray(),
      scale: itemRef.current.scale.toArray(),
      type: itemRef.current.userData.type,
    });
  }, [hoverPoint, hoverNormal, isValid, placementProps.scaleVariance, onPlaceItem]);

  /**
   * Global pointer handler
   **/
  useEffect(() => {
    if (!active) return;
    const el = events?.connected ?? gl.domElement;
    const down = e => {
      if (!active || !isValid || !hoverPoint) return;
      e.stopPropagation();
      commitPlacement();
    };
    el.addEventListener("pointerdown", down);
    return () => el.removeEventListener("pointerdown", down);
  }, [active, isValid, hoverPoint, commitPlacement, gl.domElement, events]);

  /** Hover + ghost‑tint update loop */
  useFrame(({ raycaster }) => {
    if (!active || !terrain) return;

    const hits = raycaster.intersectObject(terrain);
    if (placementProps.mustInterset && hits.length === 0) {
      setHoverPoint(null);
      setHoverNormal(null);
      setIsValid(false);
      applyGhostTint(itemRef.current, true, ghostMat); // keep red while off‑terrain
      return;
    }

    const { point, face } = hits[0];
    if (placementProps.yCompensation) point.y += placementProps.yCompensation;

    const worldNormal = face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(terrain.matrixWorld)).normalize();

    const valid = validateYRange(point, placementProps);

    setHoverPoint(point);
    setHoverNormal(worldNormal);
    setIsValid(valid);

    applyGhostTint(itemRef.current, !valid, ghostMat);
  });

  const previewQuat = hoverNormal
    ? (() => {
        const flat = new THREE.Vector3(hoverNormal.x, 0, hoverNormal.z).normalize();
        return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(flat.x, flat.z));
      })()
    : null;

  const indicatorProps = indicator(isValid);

  return (
    <group>
      {active &&
        hoverPoint &&
        React.cloneElement(children, {
          ref: itemRef,
          position: hoverPoint,
          quaternion: previewQuat?.toArray(),
          visible: true,
          ...indicatorProps,
        })}
    </group>
  );
}
