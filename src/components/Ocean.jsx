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
    const material = new THREE.MeshStandardNodeMaterial();

    // Replace simple emissive with depth-based gradient
    const shadeReflection = t.Fn(({ shallowColor, deepColor }) => {
      const depthFactor = t.positionView.z.oneMinus().saturate();
      return t.mix(t.color(shallowColor), t.color(deepColor), depthFactor).mul(0.5);
    });

    const waterBaseColor = shadeReflection({ shallowColor: "#6dcbdb", deepColor: "#2a7d8c" });

    material.emissiveNode = waterBaseColor;
    material.transparent = true; // <-- Enable transparency
    // material.opacity = 0.9; // <-- Set opacity
    // material.wireframe = true;

    if (normalMap) {
      const floorNormal = t.texture(normalMap, floorUV).xy.mul(2).sub(1).mul(normalScale);
      reflectionNode.uvNode = reflectionNode.uvNode.add(floorNormal);
    } else {
      let baseUV = t.uv().mul(200);
      const time = t.time.mul(0.24);

      // Use multiple wave frequencies with different directions
      const frequency1 = 8;
      const frequency2 = 12;
      const amplitude = normalScale / 12;

      // First wave set
      const wobble1X = t.sin(baseUV.x.add(time).mul(frequency1)).mul(amplitude);
      const wobble1Y = t.cos(baseUV.y.add(time.mul(0.8)).mul(frequency1)).mul(amplitude);

      // Second wave set with different direction and speed
      const wobble2X = t
        .sin(baseUV.y.add(time.mul(0.5)).mul(frequency2))
        .mul(amplitude)
        .mul(0.7);
      const wobble2Y = t
        .cos(baseUV.x.add(time.mul(0.6)).mul(frequency2))
        .mul(amplitude)
        .mul(0.7);

      // Combine the waves
      const wobbleOffsetX = wobble1X.add(wobble2X);
      const wobbleOffsetY = wobble1Y.add(wobble2Y);
      const wobbleOffset = t.vec2(wobbleOffsetX, wobbleOffsetY);
      reflectionNode.uvNode = reflectionNode.uvNode.add(wobbleOffset);
    }

    // Add a subtle fresnel effect for better water edge rendering
    // const viewDir = t.positionView.normalize();
    // const normalDir = t.normalView;
    // const fresnelTerm = viewDir.dot(normalDir).oneMinus().pow(96);
    // const reflectionStrength = fresnelTerm.mul(0.2).add(0.2);

    if (colorMap) {
      materialColor = t.texture(colorMap, floorUV);
      // Blend with reflection based on fresnel
      // materialColor = materialColor.mix(reflectionNode, reflectionStrength);
    } else {
      // materialColor = waterBaseColor.mix(reflectionNode, reflectionStrength);
    }

    material.colorNode = t.mul(reflectionNode, 0.33);
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
