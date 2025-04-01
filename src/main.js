import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import GUI from 'lil-gui'
import { gsap } from "gsap";

// Debug
const gui = new GUI();

gui.hide();

window.addEventListener('keydown', (event) => {
    if (event.key == 'h'){
        gui.show(gui._hidden);
    }
})

const panel = document.querySelector('.panel');
console.log(panel);
gsap.to(panel, { x: 100, duration: 1});

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
const controls = new OrbitControls(camera, canvas)
controls.target.y = 3.5
controls.enableDamping = true

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

// Textures
const rgbeLoader = new RGBELoader();
rgbeLoader.load('textures/environmentMap/2k.hdr',
(environmentMap) => 
    {
        console.log('env');
        environmentMap.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = environmentMap;
        scene.environment = environmentMap;
        scene.backgroundIntensity = 0;
    }
)

// Material
const material = new THREE.MeshStandardMaterial({color: '#999999', wireframe: true});

// Models
const gltfLoader = new GLTFLoader();

const lamp = null;
gltfLoader.load(
    '/models/FloorLamp/FloorLamp.gltf',
    (gltf) =>
    {
    gltf.scene.children[0].castShadow = true;
    gltf.scene.children[0].receiveShadowShadow = true;
    scene.add(gltf.scene);
    }
)

// Meshes
const cubeGeometry = new THREE.BoxGeometry(8, 8, 8);
const cube = new THREE.Mesh(cubeGeometry, material);
cube.position.y = 2;
scene.add(cube);

/**
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({
      color: '#444444',
      metalness: 0,
      roughness: 0.5
  })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

// Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

const lightHelper = new THREE.DirectionalLightHelper(directionalLight);
scene.add(lightHelper);

gui.add(directionalLight, 'intensity').min(0).max(100).step(0.01).name('DirLightIntensity');
const ambientLight = new THREE.AmbientLight('#ffffff', 0.25);


scene.add(directionalLight, ambientLight);

gui.add(scene, 'backgroundIntensity').min(0).max(1).step(0.001);
gui.add(scene, 'environmentIntensity').min(0).max(1).step(0.001);


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
      controls.update();
  
      // Render
      renderer.render(scene, camera);
  
      // Call tick again on the next frame
      window.requestAnimationFrame(tick);
  }
  
  tick();