import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'

// Debug
const gui = new GUI();

gui.hide();

window.addEventListener('keydown', (event) => {
    if (event.key == 'h'){
        gui.show(gui._hidden);
    }
})

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () =>
  {
      // Update sizes
      sizes.width = window.innerWidth
      sizes.height = window.innerHeight
  
      // Update camera
      camera.aspect = sizes.width / sizes.height
      camera.updateProjectionMatrix()
  
      // Update renderer
      renderer.setSize(sizes.width, sizes.height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  });

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(4, 5, 4)
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.target.y = 3.5
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));



/**
 * Objects
 */

// Material
const material = new THREE.MeshStandardMaterial({color: '#999999', wireframe: true});

// Meshes
const cubeGeometry = new THREE.BoxGeometry(8, 8, 8);
const cube = new THREE.Mesh(cubeGeometry, material);
cube.position.y = 2;
scene.add(cube);

// Lights
const directionalLight = new THREE.DirectionalLight('#ffffff', 3);
directionalLight.target = cube;
directionalLight.position.x = 5;
directionalLight.position.y = 10;
const ambientLight = new THREE.AmbientLight('#ffffff', 0.25);


scene.add(directionalLight, ambientLight);

/**
 * Animate
 */

const clock = new THREE.Clock();
let currentTime = clock.getElapsedTime();

const tick = () =>
  {

      const deltaTime = clock.getElapsedTime() - currentTime;
      currentTime = clock.getElapsedTime();

      // console.log(deltaTime);

      // Object Animation
      cube.rotation.y += 0.07 * deltaTime;

      // Update controls
      // controls.update();
  
      // Render
      renderer.render(scene, camera);
  
      // Call tick again on the next frame
      window.requestAnimationFrame(tick);
  }
  
  tick();