import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { forwardRef, useLayoutEffect, useMemo, useRef } from "react";

import DecorItem from "../components/DecorItem";
import mergeRefs from "../utils/mergeRefs";

// Icon component (pure, static)
const Icon = forwardRef(({ label, src, ...rest }, ref) => (
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
    <span className='text-xs font-medium text-emerald-800 group-hover/icon:text-emerald-600 transition-colors duration-200'>{label}</span>
  </span>
));

// Default placement props shape (lists all possible keys)
const DEFAULT_PLACEMENT_PROPS = {
  mustIntersect: true,
  mustNotIntersect: false,
  scaleVariance: 0,
  yCompensation: 0,
  yMin: null,
  yMax: null,
};

/**
 * @typedef {Object} PlacementProps
 * @property {boolean} [mustIntersect=true]
 * @property {boolean} [mustNotIntersect=false]
 * @property {number} [scaleVariance=0]
 * @property {number} [yCompensation=0]
 * @property {number|null} [yMin=null]
 * @property {number|null} [yMax=null]
 */

// Utility to merge overrides with the default shape
const normalizePlacementProps = overrides => ({
  ...DEFAULT_PLACEMENT_PROPS,
  ...overrides,
});

// Specialized WindTurbine factory
const createWindTurbine = windNode =>
  forwardRef(({ scale = [1, 1, 1], selected = false, selectedColor = 0xffff00, spinSpeed = -1.5, ...rest }, ref) => {
    const root = useRef();
    const blades = useRef();

    useLayoutEffect(() => {
      if (root.current) {
        blades.current = root.current.getObjectByName("windTurbineBlades");
      }
    }, []);

    useFrame((_, dt) => {
      if (blades.current) blades.current.rotation.z += dt * spinSpeed;
    });

    return (
      <DecorItem ref={mergeRefs([ref, root])} object={windNode} scale={scale} selected={selected} selectedColor={selectedColor} {...rest} />
    );
  });

// Centralized item definitions
const DECOR_ITEMS = [
  {
    key: "dock",
    nodeName: "dock",
    label: "Dock",
    icon: "icon--decor-dock.jpg",
    placementProps: { yCompensation: -0.01, yMax: 0.02 },
  },
  {
    key: "house",
    nodeName: "house",
    label: "House",
    icon: "icon--decor-house1.jpg",
    placementProps: { yCompensation: -0.02, yMin: 0.025, scaleVariance: 0.05 },
  },
  {
    key: "lighthouse",
    nodeName: "lighthouse",
    label: "Lighthouse",
    icon: "icon--decor-lighthouse.jpg",
    placementProps: { yCompensation: -0.03, yMin: 0.025 },
  },
  {
    key: "tent",
    nodeName: "tent",
    label: "Tent",
    icon: "icon--decor-tent.jpg",
    placementProps: { yCompensation: -0.01, yMin: 0.0125, scaleVariance: 0.2 },
  },
  {
    key: "tree",
    nodeName: "tree",
    label: "Tree",
    icon: "icon--decor-tree1.jpg",
    placementProps: { yCompensation: -0.02, yMin: 0.025, scaleVariance: 0.5 },
  },
  {
    key: "windTurbine",
    nodeName: "windTurbine",
    label: "Turbine",
    icon: "icon--decor-wind-turbine.jpg",
    placementProps: { yCompensation: -0.01, yMin: 0.025 },
  },
];

export function useDecorRegistry() {
  const { nodes } = useGLTF("/island/models/island-decor.glb");

  return useMemo(
    () =>
      Object.fromEntries(
        DECOR_ITEMS.map(({ key, nodeName, label, icon, placementProps }) => {
          const Component =
            key === "windTurbine"
              ? createWindTurbine(nodes.windTurbine)
              : forwardRef((props, ref) => <DecorItem ref={ref} object={nodes[nodeName]} {...props} />);

          return [
            key,
            {
              Component,
              Icon,
              defaultProps: { scale: [1, 1, 1] },
              defaultIconProps: { label, src: `/island/icons/${icon}` },
              placementProps: normalizePlacementProps(placementProps),
            },
          ];
        })
      ),
    [nodes]
  );
}

useGLTF.preload("/island/models/island-decor.glb");
