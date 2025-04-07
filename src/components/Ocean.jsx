import React, { useRef, useState, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { color, reflector, texture, uv } from "three/tsl";

// Create a component for the reflective surface
export default function Ocean({
  resolution = 0.5,
  position = [0, 0, 0],
  rotation = [-Math.PI / 2, 0, 0],
  args = [50, 0.001, 50],
  normalMap,
  colorMap,
  normalScale = 0.02,
  colorMapRepeat = 15,
  ...props
}) {
  const meshRef = useRef();
  const [reflectionNode, setReflectionNode] = useState(null);
  const { scene } = useThree();

  // Create the reflector once on component mount
  useEffect(() => {
    // Create the reflector using TSL
    const reflectionEffect = reflector({ resolution });

    // Important: The reflector target needs to be rotated to match the surface normal
    // This is separate from the mesh rotation
    reflectionEffect.target.rotateX(rotation[0]);
    reflectionEffect.target.rotateY(rotation[1]);
    reflectionEffect.target.rotateZ(rotation[2]);

    // Add to scene
    scene.add(reflectionEffect.target);

    // Save for use in the material
    setReflectionNode(reflectionEffect);

    // Cleanup when component unmounts
    return () => {
      scene.remove(reflectionEffect.target);
      reflectionEffect.dispose && reflectionEffect.dispose();
    };
  }, [scene, resolution, rotation]);

  // Setup the material with reflection
  useEffect(() => {
    if (!reflectionNode || !meshRef.current) return;

    // Create material nodes
    const floorUV = uv().mul(colorMapRepeat);

    // Setup the material
    const material = new THREE.MeshBasicNodeMaterial();

    material.emissiveNode = color("#4eadbc").mul(0.25); // TODO: Do color gradient map instead to get the bluey reflection colour
    material.transparent = true; // <-- Enable transparency Oh My Looooooord
    material.opacity = 0.9; // <-- Set opacity

    // If we have a normal map, apply it to distort the reflection
    if (normalMap) {
      const floorNormal = texture(normalMap, floorUV).xy.mul(2).sub(1).mul(normalScale);
      reflectionNode.uvNode = reflectionNode.uvNode.add(floorNormal);
    }

    // Apply base color and/or texture with the reflection
    if (colorMap) {
      // If we have a color map, apply it with the reflection
      material.colorNode = texture(colorMap, floorUV).add(reflectionNode);
    } else {
      // Just use the reflection
      material.colorNode = reflectionNode;
    }

    // Apply the material to our mesh
    meshRef.current.material = material;
  }, [reflectionNode, normalMap, colorMap, colorMapRepeat, normalScale, color]);

  return (
    <mesh ref={meshRef} position={position} receiveShadow {...props}>
      <boxGeometry args={args} />
    </mesh>
  );
}

// A wrapper component that also handles loading textures
export const OceanSurface = ({
  normalMapUrl,
  colorMapUrl,
  color, // Add color property
  ...props
}) => {
  const [normalMap, setNormalMap] = useState(null);
  const [colorMap, setColorMap] = useState(null);

  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();

    if (normalMapUrl) {
      textureLoader.load(normalMapUrl, texture => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        setNormalMap(texture);
      });
    }

    if (colorMapUrl) {
      textureLoader.load(colorMapUrl, texture => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        setColorMap(texture);
      });
    }
  }, [normalMapUrl, colorMapUrl]);

  return <Ocean normalMap={normalMap} colorMap={colorMap} color={color} {...props} />;
};
