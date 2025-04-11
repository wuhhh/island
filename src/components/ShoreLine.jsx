import { Plane } from "@react-three/drei";
import { useIslandStore, useIslandHydration } from "../stores/useIslandStore";
import { useHistoryStore, useHistoryHydration } from "../stores/useHistoryStore";
import { useEffect, useRef } from "react";
import * as THREE from "three/webgpu";
import * as t from "three/tsl";

export default function ShoreLine({ ...props }) {
  const planeRef = useRef(null);
  const materialRef = useRef(null);

  const terrainZExtrema = useIslandStore(state => state.terrainZExtrema);
  const getTerrainData = useHistoryStore(state => state.getTerrainData);
  const terrainGeomAttrsPosArr = useHistoryStore(state => state.terrainGeomAttrsPosArr);
  const { undo: useHistoryStoreUndo, redo: useHistoryStoreRedo, clear: useHistoryStoreClear } = useHistoryStore.temporal.getState();

  const islandStoreHydrated = useIslandHydration();
  const historyStoreHydrated = useHistoryHydration();

  useEffect(() => {
    if (islandStoreHydrated && historyStoreHydrated && materialRef.current) {
      const terrainData = getTerrainData();
      const zMin = terrainZExtrema[0];
      const zMax = terrainZExtrema[1];
      const zRange = zMax - zMin;
      const zScale = 1 / zRange; // Scale factor for height data

      // Assuming terrain is a grid of vertices
      const width = 128; // Texture width
      const height = 128; // Texture height

      // Create height data texture - Change to RGBA format (4 channels)
      const heightData = new Float32Array(width * height * 4); // 4 channels for RGBA

      // Calculate vertex counts along each dimension
      const verticesX = Math.sqrt(terrainData.length / 3);
      const verticesY = verticesX;

      /**
       * Sample terrain and create normalized height data
       * r: height > 0 data (1.0 would be the highest point)
       * g: height <= 0 data (1.0 would be the lowest point)
       * b: full range (.5 would be mid way between the highest and lowest point)
       * a: 1.0 (fully opaque)
       */
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Map texture coordinates to terrain vertex grid coordinates
          const tx = Math.floor((x / width) * (verticesX - 1));
          const ty = Math.floor((y / height) * (verticesY - 1));

          // Get the correct index in the terrain data
          const index = (ty * verticesX + tx) * 3;

          // Get height value
          const heightValue = terrainData[index + 2];

          const r = heightValue > 0 ? heightValue / zMax : 0;
          const g = heightValue <= 0 ? heightValue / zMin : 0;
          const b = r + g * 0.5 - 0.001;
          // const b = (heightValue - zMin) * zScale;
          const a = 1.0; // Add alpha channel with full opacity

          // Store in the texture data (correct orientation) with flip y
          const flipY = height - 1 - y;
          const texIndex = (flipY * width + x) * 4; // 4 components per pixel
          heightData[texIndex] = r;
          heightData[texIndex + 1] = g;
          heightData[texIndex + 2] = b;
          heightData[texIndex + 3] = a; // Add alpha
        }
      }

      const heightTexture = new THREE.DataTexture(
        heightData,
        width,
        height,
        THREE.RGBAFormat, // Changed from RGBFormat to RGBAFormat
        THREE.FloatType
      );
      heightTexture.wrapS = THREE.RepeatWrapping;
      heightTexture.wrapT = THREE.RepeatWrapping;
      heightTexture.minFilter = THREE.LinearFilter;
      heightTexture.magFilter = THREE.LinearFilter;
      heightTexture.needsUpdate = true;

      // Hard shoreline
      let shore = t.step(0.02, t.smoothstep(0.01, 0.09, t.texture(heightTexture).r));

      // Inverted hard
      let shoreInvert = t.oneMinus(shore);

      // Soft shoreline
      let softShore = t.step(0.95, t.oneMinus(t.texture(heightTexture).b));

      let output = shore;

      materialRef.current.fragmentNode = t.vec4(t.color("burlywood"), output);

      materialRef.current.needsUpdate = true;
    }
  }, [islandStoreHydrated, historyStoreHydrated, terrainZExtrema, terrainGeomAttrsPosArr]);

  return (
    <Plane ref={planeRef} args={[2, 2]} {...props}>
      <meshBasicNodeMaterial ref={materialRef} transparent />
    </Plane>
  );
}
