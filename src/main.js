import './style.css';
import GUI from 'lil-gui';
import Stats from 'stats.js';
import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { EffectComposer, GlitchPass, OrbitControls, RenderPass, SMAAPass, TAARenderPass } from 'three/examples/jsm/Addons.js';
import { update } from 'three/examples/jsm/libs/tween.module.js';




const gui = new GUI()
const stats = new Stats();
stats.showPanel(0)
document.body.appendChild(stats.dom)





// +++++++++++++++++++++++++++++++++++++++++++++++++++++

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
  camera.position.y = 15;

  scene.add(camera)


  const renderer = new THREE.WebGLRenderer({canvas:canvasElement , antialias:true});
  renderer.render(scene , camera);
  renderer.setSize(canvasSize.width(), canvasSize.height());
  // renderer.shadowMap.enabled = true;
  // renderer.shadowMap.type = THREE.VSMShadowMap;



  // postprocessing ++++++++++++++++++++

  const postprocessingFoder = gui.addFolder('postprocessing');

  const rendererTarget = new THREE.WebGLRenderTarget(800,600,
    {
      samples:15
    }
  )

  postprocessingFoder.add(rendererTarget,'samples',0,50,1).name('samples')
  const effectComposser = new EffectComposer(renderer,rendererTarget);


  const renderPass= new RenderPass(scene,camera);
  effectComposser.addPass(renderPass)

  // // const ray = new GodRay

  const glitchPass = new GlitchPass()
  effectComposser.addPass(glitchPass);

  postprocessingFoder.add(glitchPass,'enabled').name('glitch enable');

  // const smaaPass = new SMAAPass();
  // // smaaPass.setSize(canvasSize.width(),canvasSize.height())
  // effectComposser.addPass(smaaPass);
  // console.log(smaaPass)
  // postprocessingFoder.add(smaaPass,'enabled').name('enable smaa')
 

  // const taaPass = new TAARenderPass(scene,camera);
  // effectComposser.addPass(taaPass)

  // postprocessingFoder.add(taaPass,'enabled').name('taa Pass enable')
  // console.log(taaPass)







  // -------------------------------------------------------------------------end of renderer



  // objects +++++++++++++++++++++++++++++++

  const cubesProperties ={
    count:5,
  }

  // const box = new THREE.Mesh(
  //   new THREE.BoxGeometry(1,1,1),
  //   new THREE.MeshPhongMaterial({color:0xff00ff})
  // )
  // box.castShadow  =true
  // const boxWire = new THREE.Mesh(
  //   new THREE.BoxGeometry(1,1,1),
  //   new THREE.MeshBasicMaterial({color:0x00000f ,wireframe:true})
  // )
  //  box.add(boxWire)
  // scene.add(box);

  // const boxBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,5,0));
  // const boxCollider = RAPIER.ColliderDesc.cuboid(0.5,0.5,0.5);
  // boxCollider.restitution = 0.8

  // world.createCollider(boxCollider,boxBody)


 
  let randomCubes = createBoxes();
  scene.add(...randomCubes.map(ele=>ele.mesh));


   const cubesControls = gui.addFolder('cubes Properties');
   cubesControls.add(cubesProperties,'count',1,2000,5).name('number of cubes').onChange( value=>reCreateCubes(value))
   cubesControls.add({restart:false},'restart').onChange(()=>reCreateCubes(cubesProperties.count));


  //  pushing cubes

  const moverMat = new THREE.MeshPhysicalMaterial({color:0x999999});
  const moverMatWire = new THREE.MeshPhongMaterial({color:0xff0022,emissive:0xffffff,wireframe:true});

  const moverGeo = new THREE.BoxGeometry(3,3,3,6,6,6);

  const mover = new THREE.Mesh(moverGeo,moverMat);
  const moverWire = new THREE.Mesh(moverGeo,moverMatWire);

  mover.add(moverWire)
 

  scene.add(mover);

  const moverBody = world.createRigidBody( RAPIER.RigidBodyDesc.dynamic().setTranslation(1.5,1.55,1.5));
  world.createCollider(RAPIER.ColliderDesc.cuboid(1.5,1.5,1.5).setFriction(0.5).setMass(40),moverBody);

window.addEventListener('click',ev=>{
  moverBody.setAngvel({x:0,y:10+moverBody.angvel().y,z:0})

})


  // ground ++++++++++
  const length = 200;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(length,length),
    new THREE.MeshPhongMaterial({color:0xffffff ,side:THREE.DoubleSide})
  )
  ground.receiveShadow =true;
  ground.rotation.x = Math.PI * 0.5

  scene.add(ground);

  const groundBody =  world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,0,0));
  console.log(groundBody)
  world.createCollider(RAPIER.ColliderDesc.cuboid(length*0.5,0.1,length*0.5).setFriction(0.5),groundBody)




  // controls +++++++++++++++
  const control = new OrbitControls(camera,canvasElement)
  control.update()

//  console.log(camera)
  // animation ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  const clock = new THREE.Clock()
  let time = 0

  function animate(){


    stats.begin();

    time = clock.getElapsedTime()






    // renderer.render(scene,camera);
    effectComposser.render(clock.getDelta())
    world.step()
    // console.log(boxBody.translation())
    mover.position.copy(moverBody.translation());
    mover.quaternion.copy(moverBody.rotation());
    // moverBody.setRotation.y =mover.quaternion.y

    randomCubes.forEach(ele=>ele.update())


    // move the camera on a circle path manually
    // camera.position.x = 15 * Math.cos(time * 0.4);
    // camera.position.z = 15 * Math.sin(time * 0.4);
    // camera.lookAt(mover.position)

   





    stats.end()
    requestAnimationFrame( animate );
  }

  animate()


// lights+++++++++++++++++++++++++++++++++++++++++++

const pointLight = new THREE.PointLight(0xffeaa3 , 4,30,0.1);
pointLight.position.set(5,15,0);
pointLight.castShadow = true;
// pointLight.shadow.mapSize.set(512,512);
// pointLight.shadow.bias = 0.005;
// pointLight.shadow.normalBias = 0.05;
// pointLight.shadow.radius = 100

const amLight = new THREE.AmbientLight(0x555555,0.2)



// scene.add(pointLight,amLight);
//  --------------------------------------------------------------lights




// functions +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function reCreateCubes(count){
  randomCubes.forEach(ele=>{

        // remove from scene
        scene.remove(ele.mesh)
        ele.mesh.geometry.dispose();
        // remove from the world
        world.removeRigidBody(ele.rigidBody);

        
      })
      
      // / create new cubes

        randomCubes = createBoxes(count);
        scene.add(...randomCubes.map(ele=>ele.mesh))
}

function createBoxes(count = 5){

  const boxMat = new THREE.MeshPhongMaterial({color:0xff00ff});
  
  
  const boxGeo =  new THREE.BoxGeometry(1,1,1);
  const Cubes = []

  for(let i = 0 ; i< count ; i++){

    const wireMat =  new THREE.MeshStandardMaterial({color:0x22eeff,wireframe:true,roughness:0.2,metalness:0.1,emissive:0xff00ff,emissiveIntensity:3});
    wireMat.emissive = new THREE.Color(Math.random()*4, Math.random()*0.5,Math.random()*0.7)
 
   const box = new THREE.Mesh(boxGeo,boxMat);
  box.castShadow  =true
  const boxWire =new THREE.Mesh(boxGeo,wireMat);
  boxWire.material.wireframe =true
   box.add(boxWire)
  

  const boxBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(10*(Math.random()-0.5),15+50*Math.random() + 5,10*(Math.random()-0.5)));
  const boxCollider = RAPIER.ColliderDesc.cuboid(0.5,0.5,0.5);
  boxCollider.restitution = 0.4

  world.createCollider(boxCollider,boxBody);
  
  Cubes.push({mesh:box , rigidBody:boxBody,update:connectMeshToRigid})
  }

  return Cubes

 
}

function connectMeshToRigid(){
  this.mesh.position.copy(this.rigidBody.translation());
  this.mesh.quaternion.copy(this.rigidBody.rotation());
}




// control the mover
window.addEventListener('keydown',eve=>{
  console.log(eve.key)
  if(eve.key =='ArrowUp'){
  
    moverBody.applyImpulse({x:0,y:0,z:20})
  }
  if(eve.key =='ArrowDown'){
    
    moverBody.applyImpulse({x:0,y:0,z:-20})
  }
   if(eve.key =='ArrowRight'){
     moverBody.applyImpulse({x:20,y:0,z:0})

  }
   if(eve.key =='ArrowLeft'){
   
    moverBody.applyImpulse({x:-20,y:0,z:0})
  }

  
})

}

init();




  

