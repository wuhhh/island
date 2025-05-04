import { Clone } from "@react-three/drei";
import { forwardRef, useLayoutEffect, useRef } from "react";

import mergeRefs from "../utils/mergeRefs";

const DecorItem = forwardRef(
  (
    {
      object, // THREE.Object3D – required
      cloneMaterial = true, // let special cases skip this step
      scale = [1, 1, 1], // everything else is optional / overridable
      hovered = false,
      hoveredColor = 0xff33dd,
      selected = false,
      selectedColor = 0xffff00,
      ...rest
    },
    ref
  ) => {
    const local = useRef();

    /* ─── give each mesh its own material (run once) ─── */
    useLayoutEffect(() => {
      if (!cloneMaterial || !local.current) return;
      local.current.traverse(o => {
        if (o.isMesh) o.material = o.material.clone();
      });
    }, [cloneMaterial]);

    /* ─── toggle highlight whenever it changes ─── */
    useLayoutEffect(() => {
      if (!local.current) return;
      local.current.traverse(o => {
        if (o.isMesh) {
          if (selected) {
            o.material.emissive.set(selectedColor);
          } else if (hovered) {
            o.material.emissive.set(hoveredColor);
          } else {
            o.material.emissive.set(0x000000);
          }
          o.material.emissiveIntensity = selected || hovered ? 0.25 : 0;
        }
      });
    }, [selectedColor, hovered, selected, hoveredColor]);

    return <Clone ref={mergeRefs([ref, local])} object={object} scale={scale} {...rest} />;
  }
);

export default DecorItem;
