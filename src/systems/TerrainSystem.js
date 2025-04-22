import { MathUtils } from "three";
import { findZExtrema } from "../utils/terrainUtils";

const MAX_RADIUS = 0.15;
const MIN_RADIUS = 0.04;
const MAX_STRENGTH = 0.025;
const MIN_STRENGTH = 0.00125;

/**
 * TerrainSystem class
 * Handles terrain modification and management
 */
export class TerrainSystem {
  constructor(mesh, spatialIndex) {
    this.mesh = mesh;
    this.geometry = mesh.geometry;
    this.spatialIndex = spatialIndex;
    this.positions = mesh.geometry.attributes.position.array;
    this.uvs = mesh.geometry.attributes.uv.array;
  }

  /**
   * Apply brush to modify terrain
   */
  applyBrush(x, y, brushSettings) {
    const { brushSize, brushStrength, mode } = brushSettings;
    const { grid, size } = this.spatialIndex;

    const radius = MathUtils.mapLinear(brushSize, 0, 1, MIN_RADIUS, MAX_RADIUS);
    let strength = MathUtils.mapLinear(brushStrength, 0, 1, MIN_STRENGTH, MAX_STRENGTH);

    // Calculate which grid cells the brush overlaps
    const brushRadiusInGrid = Math.ceil(radius * size);
    const centerU = Math.floor(x * size);
    const centerV = Math.floor(y * size);

    // Determine grid cells to check
    const startU = Math.max(0, centerU - brushRadiusInGrid);
    const endU = Math.min(size - 1, centerU + brushRadiusInGrid);
    const startV = Math.max(0, centerV - brushRadiusInGrid);
    const endV = Math.min(size - 1, centerV + brushRadiusInGrid);

    // Check vertices in overlapped cells
    for (let gridU = startU; gridU <= endU; gridU++) {
      for (let gridV = startV; gridV <= endV; gridV++) {
        const verticesInCell = grid[gridU][gridV];

        // Process each vertex in cell
        for (let i = 0; i < verticesInCell.length; i++) {
          const vertexIndex = verticesInCell[i];
          const uvIndex = vertexIndex * 2;

          // Get UV coordinates
          const uvX = this.uvs[uvIndex];
          const uvY = this.uvs[uvIndex + 1];

          // Calculate distance from brush center
          const dx = uvX - x;
          const dy = uvY - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Apply brush with falloff if within radius
          if (dist <= radius) {
            // Get edge weight (0 = fully clamped, 1 = fully modifiable)
            const edgeWeight = this.geometry.userData.edgeWeights[vertexIndex];

            // Skip if completely clamped
            if (edgeWeight <= 0) continue;

            // Apply falloff for natural brush shape
            const falloff = Math.pow(1.0 - dist / radius, 2);

            // Calculate height change
            const minHeight = -0.1; // Minimum height
            const maxHeight = 1; // Maximum height
            const posIndex = vertexIndex * 3 + 2; // z component
            const _mode = mode === "add" ? 1 : -1;
            const newPos = this.positions[posIndex] + strength * 0.5 * falloff * _mode * edgeWeight;

            if (newPos >= minHeight && newPos <= maxHeight) {
              this.positions[posIndex] = newPos;
            }
            // this.positions[posIndex] = newPos < minHeight ? minHeight : newPos;
          }
        }
      }
    }

    // Update geometry
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  /**
   * Reset terrain to original state
   */
  resetTerrain() {
    if (!this.geometry.userData.originalPositions) return;

    // Restore original positions
    for (let i = 0; i < this.positions.length; i++) {
      this.positions[i] = this.geometry.userData.originalPositions[i];
    }

    // Update geometry
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  /**
   * Get current z-axis extrema
   */
  getZExtrema() {
    return findZExtrema(this.positions);
  }
}
