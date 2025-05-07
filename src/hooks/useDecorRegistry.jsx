import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { forwardRef, useLayoutEffect, useMemo, useRef } from "react";
import { MathUtils } from "three/webgpu";

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
  yIntersectMin: null, // Renamed from yMin
  yIntersectMax: null, // Renamed from yMax
  // New airborne object properties for flexible height adjustment
  yFloatBase: null, // Base height for floating objects
  yFloatMin: null, // Minimum height above terrain for floating objects
  yFloatMax: null, // Maximum absolute height for floating objects
  yFloatRatio: null, // How much the object's height should follow terrain (0-1)
};

/**
 * @typedef {Object} PlacementProps
 * @property {boolean} [mustIntersect=true]
 * @property {boolean} [mustNotIntersect=false]
 * @property {number} [scaleVariance=0]
 * @property {number} [yCompensation=0]
 * @property {number|null} [yIntersectMin=null] - Minimum Y value for valid intersection with terrain
 * @property {number|null} [yIntersectMax=null] - Maximum Y value for valid intersection with terrain
 * @property {number|null} [yFloatBase=null] - Base height for floating objects
 * @property {number|null} [yFloatMin=null] - Minimum height above terrain for floating objects
 * @property {number|null} [yFloatMax=null] - Maximum absolute height for floating objects
 * @property {number|null} [yFloatRatio=null] - How much the object's height should follow terrain (0-1)
 */

// Utility to merge overrides with the default shape
const normalizePlacementProps = overrides => ({
  ...DEFAULT_PLACEMENT_PROPS,
  ...overrides,
});

// Factory for simple DecorItem components
const makeDecor = (node, userData) => forwardRef((props, ref) => <DecorItem ref={ref} object={node} userData={userData} {...props} />);

/**
 * Turbine
 */
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

/**
 * Cloud
 */
const createCloud = cloudNode =>
  forwardRef(({ scale = [1, 1, 1], selected = false, selectedColor = 0xffff00, ...rest }, ref) => {
    const root = useRef();
    const cloud = useRef();
    const loose = useRef();

    // We'll use this to determine if we're in placement mode vs. a placed item
    const isPlacedItem = useMemo(() => {
      // If it has an ID, it's a placed item (IDs are only assigned after placement)
      return Boolean(rest.userData?.id);
    }, [rest.userData?.id]);

    // Only used for placed items
    const originalPosition = useMemo(() => {
      return rest.userData?.position || rest.position;
    }, [rest.userData?.position, rest.position]);

    const [factor, speed] = useMemo(() => {
      return [0.05, MathUtils.randFloat(-0.125, 0.125)];
    }, []);

    useLayoutEffect(() => {
      if (root.current) {
        cloud.current = root.current.getObjectByName("cloud");
        loose.current = root.current.getObjectByName("cloudLoose");
      }
    }, []);

    useFrame(({ clock }, dt) => {
      if (cloud.current) {
        // Only animate if it's a placed item
        if (isPlacedItem && originalPosition) {
          const offset = Math.sin(clock.getElapsedTime() * speed) * factor;
          cloud.current.position.y = originalPosition[1] + offset;
        }

        // We can still rotate during placement for visual interest
        cloud.current.rotation.y += dt * 0.1;
      }

      if (loose.current) {
        const offset = Math.sin(clock.getElapsedTime() * speed * 4) * factor * 0.25;
        loose.current.position.y = offset;
        loose.current.rotation.y -= dt * 0.1;
      }
    });

    return (
      <DecorItem
        ref={mergeRefs([ref, root])}
        object={cloudNode}
        scale={scale}
        selected={selected}
        selectedColor={selectedColor}
        {...rest}
        castShadow={false}
      />
    );
  });

// Centralized item definitions with optional custom factories
const DECOR_ITEMS = [
  {
    key: "cloud",
    nodeName: "cloud",
    label: "Cloud",
    icon: "icon--decor-cloud.jpg",
    placementProps: {
      mustIntersect: false,
      scaleVariance: 0.5,
      yFloatBase: 0.5, // Base height for clouds regardless of terrain
      yFloatMin: 0.2, // Minimum height above terrain
      yFloatMax: 0.8, // Maximum absolute height
      yFloatRatio: 0.3, // Cloud height follows terrain at 30% ratio
    },
    factory: createCloud,
  },
  {
    key: "dock",
    nodeName: "dock",
    label: "Dock",
    icon: "icon--decor-dock.jpg",
    placementProps: {
      yCompensation: -0.01,
      yIntersectMax: 0.02,
    },
  },
  {
    key: "house",
    nodeName: "house",
    label: "House",
    icon: "icon--decor-house1.jpg",
    placementProps: {
      yCompensation: -0.02,
      yIntersectMin: 0.025,
      scaleVariance: 0.05,
    },
  },
  {
    key: "lighthouse",
    nodeName: "lighthouse",
    label: "Lighthouse",
    icon: "icon--decor-lighthouse.jpg",
    placementProps: {
      yCompensation: -0.03,
      yIntersectMin: 0.025,
    },
  },
  {
    key: "tent",
    nodeName: "tent",
    label: "Tent",
    icon: "icon--decor-tent.jpg",
    placementProps: {
      yCompensation: -0.01,
      yIntersectMin: 0.0125,
      scaleVariance: 0.2,
    },
  },
  {
    key: "tree",
    nodeName: "tree",
    label: "Tree",
    icon: "icon--decor-tree1.jpg",
    placementProps: {
      yCompensation: -0.02,
      yIntersectMin: 0.025,
      scaleVariance: 0.5,
    },
  },
  {
    key: "windTurbine",
    nodeName: "windTurbine",
    label: "Turbine",
    icon: "icon--decor-wind-turbine.jpg",
    placementProps: {
      yCompensation: -0.01,
      yIntersectMin: 0.025,
    },
    factory: createWindTurbine,
  },
];

export function useDecorRegistry() {
  const { nodes } = useGLTF("/island/models/island-decor.glb");

  return useMemo(
    () =>
      Object.fromEntries(
        DECOR_ITEMS.map(({ key, nodeName, label, icon, placementProps, factory }) => {
          const node = nodes[nodeName];
          const Component = (factory || makeDecor)(node);

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
