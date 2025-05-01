import { Clone, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { forwardRef, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three/webgpu";

import mergeRefs from "../utils/mergeRefs";

/** Lazily create a single shared value (geometry/material) */
function useShared(factory) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /**
   * Dock
   */
  const Dock = forwardRef(({ scale = [1, 1, 1], selected = false, highlightColor = 0xffff00, ...rest }, ref) => {
    const local = useRef();
    useLayoutEffect(() => {
      const root = local.current;
      if (!root) return;

      root.traverse(obj => {
        if (obj.isMesh) {
          obj.material = obj.material.clone();
          obj.material.emissive.set(selected ? highlightColor : 0x000000);
          obj.material.emissiveIntensity = selected ? 0.25 : 0;
        }
      });
    }, [selected, highlightColor]);

    return <Clone ref={mergeRefs([ref, local])} object={nodes.dock} scale={scale} {...rest} />;
  });

  /**
   * House
   */
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

  /**
   * Tent
   */
  const Tent = forwardRef(({ scale = [1, 1, 1], selected = false, highlightColor = 0xffff00, ...rest }, ref) => {
    const local = useRef();
    useLayoutEffect(() => {
      const root = local.current;
      if (!root) return;

      root.traverse(obj => {
        if (obj.isMesh) {
          obj.material = obj.material.clone();
          obj.material.emissive.set(selected ? highlightColor : 0x000000);
          obj.material.emissiveIntensity = selected ? 0.25 : 0;
        }
      });
    }, [selected, highlightColor]);

    return <Clone ref={mergeRefs([ref, local])} object={nodes.tent} scale={scale} {...rest} />;
  });

  /**
   * Tree
   */
  const Tree = forwardRef(({ scale = [1, 1, 1], selected = false, highlightColor = 0xffff00, ...rest }, ref) => {
    const local = useRef();
    useLayoutEffect(() => {
      const root = local.current;
      if (!root) return;

      root.traverse(obj => {
        if (obj.isMesh) {
          obj.material = obj.material.clone();
          obj.material.emissive.set(selected ? highlightColor : 0x000000);
          obj.material.emissiveIntensity = selected ? 0.25 : 0;
        }
      });
    }, [selected, highlightColor]);

    return <Clone ref={mergeRefs([ref, local])} object={nodes.tree} scale={scale} {...rest} />;
  });

  /**
   * Wind Turbine
   */
  const WindTurbine = forwardRef(
    (
      {
        scale = [1, 1, 1],
        selected = false,
        highlightColor = 0xffff00,
        spinSpeed = 0.7, // rad per second (feel free to tweak)
        ...rest
      },
      ref
    ) => {
      const rootRef = useRef(); // root of the cloned hierarchy
      const bladesRef = useRef(); // the part we want to spin

      /** Grab the blades mesh once, after the clone mounts */
      useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        // look for the child named “windTurbineBlades”
        bladesRef.current = root.getObjectByName("windTurbineBlades");

        // give every mesh its own material + highlight state
        root.traverse(obj => {
          if (obj.isMesh) {
            obj.material = obj.material.clone();
          }
        });
      }, []);

      /** Toggle emissive highlight when selection changes */
      useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        root.traverse(obj => {
          if (obj.isMesh) {
            obj.material.emissive.set(selected ? highlightColor : 0x000000);
            obj.material.emissiveIntensity = selected ? 0.25 : 0;
          }
        });
      }, [selected, highlightColor]);

      /** Spin the blades a little every frame */
      useFrame((_, delta) => {
        if (bladesRef.current) {
          bladesRef.current.rotation.z += delta * spinSpeed;
        }
      });

      return (
        <Clone
          ref={mergeRefs([ref, rootRef])} // expose both forwarded & local refs
          object={nodes.windTurbine} // deep-clone the whole turbine
          scale={scale}
          {...rest}
        />
      );
    }
  );

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
          <span className='absolute inset-0 rounded-full border-amber-500 border-4 opacity-0 transition-opacity duration-100 group-hover/icon:opacity-100' />
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

      dock: {
        defaultProps: { scale: [1, 1, 1] },
        placementProps: { yCompensation: -0.01, yMax: 0.02 },
        Component: Dock,
        Icon: Icon,
        defaultIconProps: { label: "Dock", src: "/icons/icon--decor-dock.jpg" },
      },

      house: {
        defaultProps: { scale: [1, 1, 1] },
        placementProps: { yCompensation: -0.02, scaleVariance: 0.05 },
        Component: House,
        Icon: Icon,
        defaultIconProps: { label: "House", src: "/icons/icon--decor-house1.jpg" },
      },

      tent: {
        defaultProps: { scale: [1, 1, 1] },
        placementProps: { yCompensation: -0.01, scaleVariance: 0.2 },
        Component: Tent,
        Icon: Icon,
        defaultIconProps: { label: "Tent", src: "/icons/icon--decor-tent.jpg" },
      },

      tree: {
        defaultProps: { scale: [1, 1, 1] },
        placementProps: { yCompensation: -0.02, scaleVariance: 0.5 },
        Component: Tree,
        Icon: Icon,
        defaultIconProps: { label: "Tree", src: "/icons/icon--decor-tree1.jpg" },
      },

      windTurbine: {
        defaultProps: { scale: [1, 1, 1] },
        placementProps: { yCompensation: -0.01 },
        Component: WindTurbine,
        Icon: Icon,
        defaultIconProps: { label: "Turbine", src: "/icons/icon--decor-wind-turbine.jpg" },
      },
    }),
    [DebugBox, DebugSphere, Dock, House, Icon, Tent, Tree, WindTurbine]
  );
}

useGLTF.preload("/models/island-decor.glb");
