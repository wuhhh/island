import React, { forwardRef, useLayoutEffect, useMemo, useRef } from "react";
import { Clone, useGLTF } from "@react-three/drei";
import mergeRefs from "../utils/mergeRefs";
import * as THREE from "three/webgpu";

/** Lazily create a single shared value (geometry/material) */
function useShared(factory) {
  return useMemo(factory, []);
}

export function useDecorRegistry() {
  const { nodes } = useGLTF("/models/island-decor.glb");

  /* ---------- Primitive helpers ---------- */
  const DebugBox = forwardRef(({ color = "red", args = [0.1, 0.1, 0.1], ...rest }, ref) => {
    const geo = useShared(() => new THREE.BoxGeometry(...args));
    const mat = useShared(() => new THREE.MeshStandardMaterial({ color }));
    return <mesh ref={ref} geometry={geo} material={mat} {...rest} />;
  });

  const DebugSphere = forwardRef(({ color = "blue", args = [0.05, 32, 32], ...rest }, ref) => {
    const geo = useShared(() => new THREE.SphereGeometry(...args));
    const mat = useShared(() => new THREE.MeshStandardMaterial({ color }));
    return <mesh ref={ref} geometry={geo} material={mat} {...rest} />;
  });

  /* ---------- GLB-derived helpers ---------- */
  const Tree = forwardRef(({ color = "brown", scale = [1, 1, 1], selected = false, highlightColor = 0xffff00, ...rest }, ref) => (
    <Clone
      ref={ref}
      object={nodes.tree}
      scale={scale}
      selected={selected}
      highlightColor={highlightColor}
      {...rest}
      inject={
        <meshStandardMaterial
          color={color}
          emissive={selected ? highlightColor : 0x000000}
          emissiveIntensity={selected ? 0.2 : 0}
          toneMapped={false}
        />
      }
    />
  ));

  const House = forwardRef(({ scale = [1, 1, 1], selected = false, highlightColor = 0xffff00, ...rest }, ref) => {
    const local = useRef(); // we need to touch the clone later

    /* ───── tweak materials after the clone is on the scene graph ───── */
    useLayoutEffect(() => {
      const root = local.current;
      if (!root) return;

      root.traverse(obj => {
        if (obj.isMesh) {
          // give each mesh its *own* material so highlights don't bleed
          obj.material = obj.material.clone();
          obj.material.emissive.set(selected ? highlightColor : 0x000000);
          obj.material.emissiveIntensity = selected ? 0.25 : 0;
        }
      });
    }, [selected, highlightColor]);

    return (
      <Clone
        /* this ref points at the new root Group created by <Clone> */
        ref={mergeRefs([ref, local])}
        object={nodes.house} // ← ONE call clones the whole sub-tree
        scale={scale}
        {...rest}
      />
    );
  });

  /* ---------- Icon helper returns img---------- */
  const Icon = forwardRef(({ label, src, ...rest }, ref) => {
    return (
      <span className='flex flex-col gap-y-1' {...rest}>
        <span className='relative rounded-full size-16 overflow-hidden'>
          <img
            ref={ref}
            src={src}
            alt={label}
            className='w-full h-full object-cover transition-transform duration-500 group-hover/icon:scale-110'
          />
          <span class='absolute inset-0 rounded-full border-amber-500 border-4 opacity-0 transition-opacity duration-100 group-hover/icon:opacity-100'></span>
        </span>
        <span className='text-xs font-medium text-emerald-800 group-hover/icon:text-emerald-600 transition-colors duration-200'>
          {label}
        </span>
      </span>
    );
  });

  /* ---------- Build and memoise the registry ---------- */
  return useMemo(
    () => ({
      debugBox: {
        defaultProps: { color: "red", args: [0.1, 0.1, 0.1] },
        /* createModel: () => {
          const geom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
          const mat = new THREE.MeshStandardMaterial({ color: "red" });
          return new THREE.Mesh(geom, mat);
        }, */
        Component: DebugBox,
      },

      debugSphere: {
        defaultProps: { color: "blue", args: [0.05, 32, 32] },
        Component: DebugSphere,
      },

      tree: {
        defaultProps: { color: "brown", scale: [1, 1, 1] },
        Component: Tree,
      },

      house: {
        defaultProps: { color: "blue", scale: [1, 1, 1] },
        Component: House,
        Icon: Icon,
        defaultIconProps: { label: "House", src: "/icons/icon--decor-house1.jpg" },
      },
    }),
    [nodes]
  );
}

useGLTF.preload("/models/island-decor.glb");
