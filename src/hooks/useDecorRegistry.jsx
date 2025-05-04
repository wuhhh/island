import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { forwardRef, useLayoutEffect, useMemo, useRef } from "react";

import DecorItem from "../components/DecorItem";
import mergeRefs from "../utils/mergeRefs";

// Factory function to create a DecorItem with a ref
const makeDecor = object => forwardRef((props, ref) => <DecorItem ref={ref} object={object} {...props} />);

export function useDecorRegistry() {
  const { nodes } = useGLTF("/island/models/island-decor.glb");

  /**
   * DecorItem components
   */
  const Dock = makeDecor(nodes.dock);
  const House = makeDecor(nodes.house);
  const Lighthouse = makeDecor(nodes.lighthouse);
  const Tent = makeDecor(nodes.tent);
  const Tree = makeDecor(nodes.tree);

  /**
   * Composed WindTurbine component
   * (uses useFrame to spin the blades)
   */
  const WindTurbine = forwardRef(({ scale = [1, 1, 1], selected = false, selectedColor = 0xffff00, spinSpeed = -1.5, ...rest }, ref) => {
    const root = useRef();
    const blades = useRef();

    /* grab blades & clone materials once */
    useLayoutEffect(() => {
      if (!root.current) return;
      blades.current = root.current.getObjectByName("windTurbineBlades");
    }, []);

    /* spin every frame */
    useFrame((_, dt) => {
      if (blades.current) blades.current.rotation.z += dt * spinSpeed;
    });

    return (
      <DecorItem
        ref={mergeRefs([ref, root])}
        object={nodes.windTurbine}
        scale={scale}
        selected={selected}
        selectedColor={selectedColor}
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
      dock: {
        defaultProps: { scale: [1, 1, 1] },
        placementProps: { yCompensation: -0.01, yMax: 0.02 },
        Component: Dock,
        Icon: Icon,
        defaultIconProps: { label: "Dock", src: "/island/icons/icon--decor-dock.jpg" },
      },

      house: {
        defaultProps: { scale: [1, 1, 1] },
        placementProps: { yCompensation: -0.02, yMin: 0.025, scaleVariance: 0.05 },
        Component: House,
        Icon: Icon,
        defaultIconProps: { label: "House", src: "/island/icons/icon--decor-house1.jpg" },
      },

      lighthouse: {
        defaultProps: { scale: [1, 1, 1] },
        placementProps: { yCompensation: -0.03, yMin: 0.025, scaleVariance: 0 },
        Component: Lighthouse,
        Icon: Icon,
        defaultIconProps: { label: "Lighthouse", src: "/island/icons/icon--decor-lighthouse.jpg" },
      },

      tent: {
        defaultProps: { scale: [1, 1, 1] },
        placementProps: { yCompensation: -0.01, yMin: 0.0125, scaleVariance: 0.2 },
        Component: Tent,
        Icon: Icon,
        defaultIconProps: { label: "Tent", src: "/island/icons/icon--decor-tent.jpg" },
      },

      tree: {
        defaultProps: { scale: [1, 1, 1] },
        placementProps: { yCompensation: -0.02, yMin: 0.025, scaleVariance: 0.5 },
        Component: Tree,
        Icon: Icon,
        defaultIconProps: { label: "Tree", src: "/island/icons/icon--decor-tree1.jpg" },
      },

      windTurbine: {
        defaultProps: { scale: [1, 1, 1] },
        placementProps: { yCompensation: -0.01, yMin: 0.025 },
        Component: WindTurbine,
        Icon: Icon,
        defaultIconProps: { label: "Turbine", src: "/island/icons/icon--decor-wind-turbine.jpg" },
      },
    }),
    [Dock, House, Icon, Lighthouse, Tent, Tree, WindTurbine]
  );
}

useGLTF.preload("/island/models/island-decor.glb");
