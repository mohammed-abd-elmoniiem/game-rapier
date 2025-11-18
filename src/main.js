import './style.css';

import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/Addons.js';

  const canvasElement = document.querySelector('canvas');
  console.log(THREE);
  const canvasSize ={
    width:function(){return canvasElement.getBoundingClientRect().width},
    height:function(){return canvasElement.getBoundingClientRect().height},
    aspect:function(){return this.width()/this.height()},
  };

async function init(){


  // physics 
  await RAPIER.init();
  const gravity = new RAPIER.Vector3(0,-9.82,0);
  const world = new RAPIER.World(gravity);




  // scene , camera and renderer  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  const scene = new THREE.Scene();


  const camera = new THREE.PerspectiveCamera(75,canvasSize.aspect(),0.1,1000);
  camera.position.z = 5;
  camera.position.y = 5;

  scene.add(camera)


  const renderer = new THREE.WebGLRenderer({canvas:canvasElement , antialias:true});
  renderer.render(scene , camera);
  renderer.setSize(canvasSize.width(), canvasSize.height());
  // -------------------------------------------------------------------------end of renderer



  // objects +++++++++++++++++++++++++++++++
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshBasicMaterial({color:0xff00ff})
  )

  scene.add(box);

  const boxBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,5,0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(0.5,0.5,0.5),boxBody)


  // ground ++++++++++
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30,30),
    new THREE.MeshBasicMaterial({color:0xffffff ,side:THREE.DoubleSide})
  )
  ground.rotation.x = Math.PI * 0.5

  scene.add(ground);

  const groundBody =  world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,0,0));
  console.log(groundBody)
  world.createCollider(RAPIER.ColliderDesc.cuboid(15,0.1,15),groundBody)




  // controls +++++++++++++++
  const control = new OrbitControls(camera,canvasElement)
  control.update()


  // animation ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  function animate(){

    renderer.render(scene,camera);
    world.step()
    // console.log(boxBody.translation())
    box.position.copy(boxBody.translation())
    requestAnimationFrame( animate );
  }

  animate()





  console.log(canvasElement,canvasSize.aspect())

  console.log(RAPIER)



}

init()