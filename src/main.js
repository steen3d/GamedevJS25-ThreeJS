import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import GUI from 'lil-gui'
import { gsap } from "gsap";
import * as CANNON from 'cannon-es'
import { threeToCannon, ShapeType } from 'three-to-cannon';

// Debug
const gui = new GUI();
const debugObject = {};

debugObject.createSphere = () => 
{
    createSphere(
        Math.random() * 0.5, 
        {
            x: (Math.random() - 0.5) * 3, 
            y: 5, 
            z: (Math.random() - 0.5) * 3
        }
    )
}

debugObject.reset = () =>
  {
      for(const object of objectsToUpdate)
      {
          // Remove body
          object.body.removeEventListener('collide', playHitSound);
          world.removeBody(object.body);
  
          // Remove Mesh
          scene.remove(object.mesh);
      }
  
      objectsToUpdate.splice(0, objectsToUpdate.length);
  }

gui.add(debugObject, 'createSphere');
gui.add(debugObject, 'reset');

// gui.hide();

window.addEventListener('keydown', (event) => {
    if (event.key == 'h'){
        gui.show(gui._hidden);
    }
})


// Toggle Panel
const panel = document.querySelector('.panel');
panel.active = true;
panel.addEventListener('click', () => {
  if (panel.active){
    gsap.to(panel, { y: (-panel.offsetHeight + 15), duration: 1});
    panel.active = false;
  } else {
    gsap.to(panel, { y: 0, duration: 1});
    panel.active = true;
  }
})

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

// Three Scene
const scene = new THREE.Scene();

// Canvas
const canvas = document.querySelector('canvas.webgl');



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
 * Physics World
 */
const world = new CANNON.World();
world.gravity.set(0, - 9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
const defaultMaterial = new CANNON.Material('default')

const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.1,
        restitution: 0.7
    }
)

world.addContactMaterial(defaultContactMaterial);
world.defaultContactMaterial = defaultContactMaterial;

// Sphere
const sphereShape = new CANNON.Sphere(0.5);
const sphereBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 3, 0),
    shape: sphereShape
})
// sphereBody.applyLocalForce(new CANNON.Vec3(150, 0, 0), new CANNON.Vec3(0, 0, 0));
world.addBody(sphereBody);

// Floor
const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body()
floorBody.mass = 0; 
floorBody.addShape(floorShape);
floorBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(-1, 0, 0),
    Math.PI * 0.5
)
world.addBody(floorBody);


/**
 * Sound
 */

const hitSound = new Audio('sounds/hit.mp3');

const playHitSound = (collision) =>
{
    const impactStrength = collision.contact.getImpactVelocityAlongNormal();

    if(impactStrength > 1.5)
    {
        hitSound.volume = Math.random();
        hitSound.currentTime = 0;
        hitSound.play();
    }

}


/**
 * Utils
 */

const objectsToUpdate = [];

const generateCollision = (mesh, body) => {
  const collisionMesh = threeToCannon(mesh, {type: ShapeType.HULL});
  console.log('Collision Mesh ' + collisionMesh);
  console.log(mesh, body);
  body.addShape(collisionMesh.shape);
}


// const cannonDebugRenderer = new THREE.Cann

/**
 * Objects
 */

const sphereGeometry = new THREE.SphereGeometry(1, 20, 20);
const sphereMaterial = new THREE.MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.4
})

// Sphere
const createSphere = (radius, position) =>
  {
      // Three.js mesh
      const mesh = new THREE.Mesh( sphereGeometry, sphereMaterial );
      mesh.castShadow = true;
      mesh.scale.set( radius, radius, radius );
      mesh.position.copy(position)
      scene.add(mesh);
  
      // Cannon.js body
      const shape = new CANNON.Sphere(radius);
      const body = new CANNON.Body({
          mass: 1,
          position: new CANNON.Vec3(0, 3, 0),
          shape,
          material: defaultMaterial
      })
      body.position.copy(position);
      body.addEventListener('collide', playHitSound);
      world.addBody(body);
  
      // Save in objects to update
      objectsToUpdate.push({
          mesh,
          body
      }) 
  
  }

// Textures
const rgbeLoader = new RGBELoader();
rgbeLoader.load('textures/environmentMap/2k.hdr',
(environmentMap) => 
    {
        environmentMap.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = environmentMap;
        scene.environment = environmentMap;
        scene.backgroundIntensity = 0;
    }
)

// Materials
const material = new THREE.MeshStandardMaterial({color: '#999999', wireframe: true});
const materialMetal = new THREE.MeshStandardMaterial({color: '#444444', metalness: 1, roughness: 0.3});

// Models
const gltfLoader = new GLTFLoader();

const importedMeshes = new THREE.Group();
const lamp = null;
gltfLoader.load(
    'models/FloorLamp/FloorLamp.gltf',
    (gltf) =>
    {
    gltf.scene.children[0].castShadow = true;
    gltf.scene.children[0].receiveShadowShadow = true;
    gltf.scene.children[0].position.y = 0.532;

    importedMeshes.add(gltf.scene);
    }
)

const hexTilesBody = new CANNON.Body();
gltfLoader.load(
    'models/HexTiles.glb',
    (gltf) =>
    {
    console.log(gltf)

    gltf.scene.children.forEach((mesh) => {
      mesh.material = materialMetal;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      generateCollision(mesh, hexTilesBody);
    })
    scene.add(gltf.scene);
    }
)
world.addBody(hexTilesBody);
scene.add(importedMeshes);
gui.add(importedMeshes.position, 'y').min(-10).max(10).step(0.001).name('Mesh Group Y Pos');


console.log(scene);

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
// scene.add(floor)

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

// const lightHelper = new THREE.DirectionalLightHelper(directionalLight);
// scene.add(lightHelper);

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


      // Update Physics World
      world.step(1/60, deltaTime, 3 );
      for(const object of objectsToUpdate)
      {
          object.mesh.position.copy(object.body.position);
          object.mesh.quaternion.copy(object.body.quaternion);
      }


      // Update controls
      controls.update();
  
      // Render
      renderer.render(scene, camera);
  
      // Call tick again on the next frame
      window.requestAnimationFrame(tick);
  }
  
  tick();