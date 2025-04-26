import * as THREE from "three/webgpu";

const decorRegistry = {
  debugBox: {
    // any defaults you need
    defaultProps: {
      color: "red",
      args: [0.1, 0.1, 0.1],
    },
    // factory for a fresh Three.js Mesh
    createModel: () => {
      const geom = new THREE.BoxGeometry(...decorRegistry.debugBox.defaultProps.args);
      const mat = new THREE.MeshStandardMaterial({ color: decorRegistry.debugBox.defaultProps.color });
      return new THREE.Mesh(geom, mat);
    },
  },

  debugSphere: {
    defaultProps: {
      color: "blue",
      args: [0.05, 32, 32],
    },
    createModel: () => {
      const geom = new THREE.SphereGeometry(...decorRegistry.debugSphere.defaultProps.args);
      const mat = new THREE.MeshStandardMaterial({ color: decorRegistry.debugSphere.defaultProps.color });
      return new THREE.Mesh(geom, mat);
    },
  },

  // tree: {
  //   defaultProps: { color: 'green', scale: [2,2,2] },
  //   createModel: () => loadYourGltf('/models/tree.glb'),
  // },
};

export default decorRegistry;
