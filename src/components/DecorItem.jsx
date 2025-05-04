import { Clone } from "@react-three/drei";
import { forwardRef, useLayoutEffect, useRef } from "react";

import mergeRefs from "../utils/mergeRefs";

const DecorItem = forwardRef(
  (
    {
      object, // THREE.Object3D – required
      scale = [1, 1, 1], // everything else is optional / overridable
      selected = false,
      highlightColor = 0xffff00,
      cloneMaterial = true, // let special cases skip this step
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
          o.material.emissive.set(selected ? highlightColor : 0x000000);
          o.material.emissiveIntensity = selected ? 0.25 : 0;
        }
      });
    }, [selected, highlightColor]);

    return <Clone ref={mergeRefs([ref, local])} object={object} scale={scale} {...rest} />;
  }
);

export default DecorItem;
