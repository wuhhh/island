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
    const material = new THREE.MeshBasicNodeMaterial();

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
      let baseUV = t.uv().mul(20);
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

    const finalReflection = t.mul(reflectionNode, 0.15);
    // const waterFx = t.step(0.8, t.distance(t.mod(t.mul(t.uv(), 200), 1), t.vec2(0.5, 0.5)));
    // Define constants
    const sinSawTime = t.mul(t.time, 0.02);
    const saw = t.oneMinus(t.fract(t.mod(sinSawTime, 100)));
    // const sinSaw = t.select(t.lessThan(t.sin(sinSawTime), 0.0), t.oneMinus(t.abs(t.sin(sinSawTime))), t.sin(sinSawTime)).toVar();
    const insideRadius = t.add(1.37, t.mul(saw, 0.3));
    const outsideRadius = t.add(1.38, t.mul(saw, 0.3));
    const wobbleAmount = 0.05;
    const wobbleSpeed = 0.1;
    let centerPoint = t.vec3(0, 0, 0);

    // Get the time for animation
    const time = t.mul(t.time, 0.02);

    // Calculate the angle from the center to the current position
    const positionXZ = t.vec2(t.positionWorld.x, t.positionWorld.z);
    const angle = t.atan(positionXZ.y, positionXZ.x);

    // Base wobble using sine:
    const baseWobble = t.mul(t.sin(t.add(t.mul(angle, 2.0), t.mul(time, wobbleSpeed))), wobbleAmount);

    // Optional: Add extra complexity with another sine wave:
    const additionalWobble = t.mul(t.sin(t.add(t.mul(angle, 12.0), t.mul(time, t.mul(wobbleSpeed, 1.5)))), 0.02);

    // Sample noise for added variance (assuming noise returns a TSL-compatible value):
    const noiseScale = 1.5;
    const noiseValue = t.mx_noise_float(t.add(t.mul(t.positionWorld.xz, noiseScale), time));
    const noiseBasedWobble = t.mul(noiseValue, 0.2);

    // Combine all wobble modifications:
    const combinedWobble = t.add(t.add(baseWobble, additionalWobble), noiseBasedWobble);

    // Apply wobble to inside and outside radii:
    const wobblyInsideRadius = t.add(insideRadius, combinedWobble);
    const wobblyOutsideRadius = t.add(outsideRadius, combinedWobble);

    // Compute the distance from the center:
    const distanceFromCenter = t.distance(t.positionWorld, centerPoint);

    // Create the ring effect:
    const waterFxInsideRing = t.step(wobblyInsideRadius, distanceFromCenter);
    const waterFxOutsideRing = t.step(wobblyOutsideRadius, distanceFromCenter);
    const waterFx = t.sub(waterFxInsideRing, waterFxOutsideRing);

    // material.colorNode = reflectionNode.add(t.vec4(waterFx));
    // material.colorNode = t.add(finalReflection, t.vec4(waterFx));
    material.colorNode = finalReflection;
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
