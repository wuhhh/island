import React, { useRef, useState, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import * as t from "three/tsl";

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

  /**
   * Create the reflector node
   */
  useEffect(() => {
    // Create the reflector using TSL
    const reflectionEffect = t.reflector({ resolution });

    // Rotate reflector target to match surface normal
    reflectionEffect.target.rotation.set(...rotation);

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

  /**
   * Setup the material with reflection
   */
  useEffect(() => {
    if (!reflectionNode || !meshRef.current) return;

    let materialColor; // colorNode

    // Create material nodes
    const floorUV = t.uv().mul(colorMapRepeat);

    // Setup the material
    const material = new THREE.MeshBasicNodeMaterial();

    material.emissiveNode = t.color("#4eadbc").mul(0.25); // TODO: Do color gradient map instead to get the bluey reflection colour
    material.transparent = true; // <-- Enable transparency
    material.opacity = 0.9; // <-- Set opacity
    // material.wireframe = true;

    if (normalMap) {
      const floorNormal = t.texture(normalMap, floorUV).xy.mul(2).sub(1).mul(normalScale);
      reflectionNode.uvNode = reflectionNode.uvNode.add(floorNormal);
    } else {
      let baseUV = t.uv().mul(200);
      const time = t.time.mul(0.24);
      const frequency = 10;
      const amplitude = normalScale / 12;
      const wobbleOffsetX = t.sin(baseUV.x.add(time).mul(frequency)).mul(amplitude);
      const wobbleOffsetY = t.cos(baseUV.y.add(time).mul(frequency)).mul(amplitude);
      const wobbleOffset = t.vec2(wobbleOffsetX, wobbleOffsetY);
      const computedNormal = wobbleOffset;
      reflectionNode.uvNode = reflectionNode.uvNode.add(computedNormal);
    }

    if (colorMap) {
      materialColor = t.texture(colorMap, floorUV).t.add(reflectionNode);
    } else {
      materialColor = reflectionNode;
    }

    material.colorNode = materialColor;
    meshRef.current.material = material;
  }, [reflectionNode, normalMap, colorMap, colorMapRepeat, normalScale]);

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
