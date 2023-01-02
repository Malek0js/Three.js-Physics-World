import * as THREE from 'three';
import Ammo from './ammo.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import { Clock } from 'three';




class BasicScene {
  constructor(){
    this.Init();
    this.startAmmo();
    this.rigidbodies = [];
  }
  Init(){
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.clock = new THREE.Clock();

    document.body.appendChild(this.renderer.domElement);

    window.addEventListener( 'resize' , () => {
      this.OnWindowResize();
    }, false);

    this.camera = new THREE.PerspectiveCamera(60, 1920 / 1080, 1.0, 1000.0);
    this.camera.position.x = 15;
    this.camera.position.y = 15;
    this.camera.position.z = 15;

    this.scene = new THREE.Scene();

    this.OnWindowResize();

    let light = new THREE.DirectionalLight(0xFFFFFF,1.5);
    light.position.set(10,10,10);
    light.target.position.set(0,0,0);
    light.castShadow = true;
    let light2 = new THREE.DirectionalLight(0xFFFFFF,1.5);
    light.position.set(-10,-10,10);
    light.target.position.set(0,0,0);
    light.castShadow = true;

    this.scene.add(light, light2);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    
    this.scene.background = new THREE.Color(0x3D5C7B);

    this.RAF();
    }

    startAmmo(){
      Ammo().then((Ammo) => {
        Ammo = Ammo;
        this.ammoClone = Ammo;
        this.createAmmo();
      })
    }

    createAmmo(Ammo = this.ammoClone){
      this.tempTransform = new Ammo.btTransform();
      let gpos = {x: 0, y: 0, z: 0 },
      gscale = {x: 30, y:2, z: 30},
      gquat = {x: 0, y: 0, z: 0, w: 1}
      let gmass = 0;

      let bpos = {x: 0, y: 10, z: 0 },
      bradius = 2,
      bquat = {x: 0, y: 0, z: 0, w: 1}
      let bmass = 1;

      let b2pos = {x: 2.5, y: 12, z: 0 },
      b2radius = 2,
      b2quat = {x: 0, y: 0, z: 0, w: 1}
      let b2mass = 1;

      this.setupPhysicsWorld(Ammo);
      this.createPlane(Ammo, gpos, gscale, gquat, gmass);
      this.createBall(Ammo, bpos, bradius, bquat, bmass);
      this.createBall2(Ammo, b2pos, b2radius, b2quat, b2mass);
    }

    setupPhysicsWorld(Ammo = this.ammoClone){
      let CollisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
      let dispatcher = new Ammo.btCollisionDispatcher(CollisionConfiguration);
      let overLappingPairCache = new Ammo.btDbvtBroadphase();
      let solver = new Ammo.btSequentialImpulseConstraintSolver();

      this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overLappingPairCache, solver, CollisionConfiguration);
      this.physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
    }

    createPlane(Ammo = this.ammoClone, pos, scale, quat, mass){

      let plane = new THREE.Mesh(
        new THREE.BoxGeometry(scale.x, scale.y, scale.z),
        new THREE.MeshPhongMaterial({color: 0xffffff})
      )
      plane.position.set(pos.x, pos.y, pos.z);

      plane.castShadow = false;
      plane.receiveShadow = true;

      this.scene.add(plane);

      let transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

      let motionState = new Ammo.btDefaultMotionState(transform);

      let localInertia = new Ammo.btVector3(0, 0, 0);

      let btSize = new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 )
      let shape = new Ammo.btBoxShape(btSize);
      shape.setMargin(0.05);
      
      if(mass > 0){
        shape.calculateLocalInertia(mass, localInertia);
      }
      let rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
      let rBody = new Ammo.btRigidBody(rigidBodyInfo);

      this.physicsWorld.addRigidBody(rBody);

      Ammo.destroy(btSize);
    }

    createBall(Ammo = this.ammoClone, pos, radius, quat, mass){

      let ball = new THREE.Mesh(
        new THREE.SphereGeometry(radius),
        new THREE.MeshPhongMaterial({color: 0xff0000})
      )
      ball.position.set(pos.x, pos.y, pos.z);
      
      ball.castShadow = false;
      ball.receiveShadow = true;

      this.scene.add(ball);

      let transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

      let motionState = new Ammo.btDefaultMotionState(transform);

      let localInertia = new Ammo.btVector3(0, 0, 0);

      let shape = new Ammo.btSphereShape(radius);
      shape.setMargin(0.05);

      if(mass > 0){
        shape.calculateLocalInertia(mass, localInertia);
      }

      let rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
      let rBody = new Ammo.btRigidBody(rigidBodyInfo);

      this.physicsWorld.addRigidBody(rBody);
      ball.userData.physicsBody = rBody;

      this.rigidbodies.push(ball);

    }
    
    createBall2(Ammo = this.ammoClone, pos, radius, quat, mass){

      let ball = new THREE.Mesh(
        new THREE.SphereGeometry(radius),
        new THREE.MeshPhongMaterial({color: 0xff8f00})
      )
      ball.position.set(pos.x, pos.y, pos.z);
      
      ball.castShadow = false;
      ball.receiveShadow = true;

      this.scene.add(ball);

      let transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

      let motionState = new Ammo.btDefaultMotionState(transform);

      let localInertia = new Ammo.btVector3(0, 0, 0);

      let shape = new Ammo.btSphereShape(radius);
      shape.setMargin(0.05);

      if(mass > 0){
        shape.calculateLocalInertia(mass, localInertia);
      }

      let rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
      let rBody = new Ammo.btRigidBody(rigidBodyInfo);

      this.physicsWorld.addRigidBody(rBody);
      ball.userData.physicsBody = rBody;

      this.rigidbodies.push(ball);

    }

  OnWindowResize(){
  this.camera.aspect = window.innerWidth / window.innerHeight;
  this.camera.updateProjectionMatrix();
  this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updatePhysics(){
    this.physicsWorld.stepSimulation(this.delta, 10);

    for(let i = 0; i < this.rigidbodies.length; i++){
      let threeObject = this.rigidbodies[i];
      let ammoObject = threeObject.userData.physicsBody;
      let ms = ammoObject.getMotionState();

      if(ms){
        ms.getWorldTransform(this.tempTransform);
        let pos = this.tempTransform.getOrigin();
        let quat = this.tempTransform.getRotation();
        threeObject.position.set(pos.x(), pos.y(), pos.z());
        threeObject.quaternion.set(quat.x(), quat.y(), quat.z(), quat.w());
      }
    }
  }

  RAF(){
    requestAnimationFrame(() => {

      this.renderer.render(this.scene, this.camera);

      this.controls.update();

      this.delta = this.clock.getDelta();

      if(this.physicsWorld){
        this.updatePhysics(this.delta);
      }

      this.RAF();

    });
  }
}
let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new BasicScene();
});