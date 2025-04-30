/**
 * Finds the minimum and maximum Z values in a vertex array.
 * @param {Float32Array} vertexArray - The vertex array from the geometry
 * @returns {Array} - An array containing [minZ, maxZ]
 */
export function findZExtrema(vertexArray) {
  if (vertexArray.length < 3) return [NaN, NaN];

  let minZ = Infinity;
  let maxZ = -Infinity;

  // Z is every 3rd value (indices 2, 5, 8, etc.)
  for (let i = 2; i < vertexArray.length; i += 3) {
    const z = vertexArray[i];
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  return [minZ, maxZ];
}

/**
 * Calculates edge weights for a plane geometry
 * @param {THREE.BufferGeometry} geometry - The terrain geometry
 * @param {number} edgeClampRadius - Radius defining the edge clamping region
 * @returns {Float32Array} - Array of calculated edge weights
 */
export function calculateEdgeWeights(geometry, edgeClampRadius) {
  const positions = geometry.attributes.position.array;
  const uvs = geometry.attributes.uv.array;

  // Store original positions if not already stored
  if (!geometry.userData.originalPositions) {
    geometry.userData.originalPositions = new Float32Array(positions.length);
    for (let i = 0; i < positions.length; i++) {
      geometry.userData.originalPositions[i] = positions[i];
    }
  }

  // Create edge weights array
  const edgeWeights = new Float32Array(positions.length / 3);
  const centerU = 0.5;
  const centerV = 0.5;

  // Calculate edge weights with smooth falloff
  for (let i = 0; i < positions.length / 3; i++) {
    const uvIndex = i * 2;
    const uvX = uvs[uvIndex];
    const uvY = uvs[uvIndex + 1];

    // Calculate distance from center
    const distX = Math.abs(uvX - centerU);
    const distY = Math.abs(uvY - centerV);

    // Blend between max and Euclidean distance
    const maxDist = Math.max(distX, distY);
    const euclideanDist = Math.sqrt(distX * distX + distY * distY);
    const blendFactor = 0.7;
    const distFromCenter = maxDist * blendFactor + euclideanDist * (1 - blendFactor);
    const distFromEdge = 0.5 - distFromCenter;

    // Calculate edge weight with smootherstep function
    let edgeWeight;
    if (distFromEdge <= 0) {
      edgeWeight = 0;
    } else if (distFromEdge >= edgeClampRadius) {
      edgeWeight = 1;
    } else {
      const t = distFromEdge / edgeClampRadius;
      edgeWeight = t * t * t * (t * (t * 6 - 15) + 10); // Smootherstep
    }

    edgeWeights[i] = edgeWeight;
  }

  // Store in geometry for reference
  geometry.userData.edgeWeights = edgeWeights;

  return edgeWeights;
}

/**
 * Creates a spatial index for efficient vertex lookup by UV coordinates
 * @param {THREE.BufferGeometry} geometry - The terrain geometry
 * @param {number} gridSize - Size of the grid for spatial partitioning
 * @returns {Object} - The spatial index
 */
export function createSpatialIndex(geometry, gridSize = 20) {
  const positions = geometry.attributes.position.array;
  const uvs = geometry.attributes.uv.array;

  // Create grid data structure
  const verticesByUV = Array(gridSize)
    .fill()
    .map(() =>
      Array(gridSize)
        .fill()
        .map(() => [])
    );

  // Populate grid with vertex indices
  for (let i = 0; i < positions.length / 3; i++) {
    const uvIndex = i * 2;
    const u = uvs[uvIndex];
    const v = uvs[uvIndex + 1];

    // Calculate grid cell
    const gridU = Math.min(gridSize - 1, Math.floor(u * gridSize));
    const gridV = Math.min(gridSize - 1, Math.floor(v * gridSize));

    // Add vertex to cell
    verticesByUV[gridU][gridV].push(i);
  }

  return { grid: verticesByUV, size: gridSize };
}
