import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
const bytes=readFileSync('public/models/town/alex-atelier.glb');
const data=new Uint8Array(bytes).buffer;
const load=()=>new GLTFLoader().parseAsync(data,'');
describe('Alex character pilot',()=>{
 it('has six usable clips, a hand grip, adult scale and a mobile geometry budget',async()=>{
  const g=await load();expect(g.animations.map(c=>c.name).sort()).toEqual(['Celebrate','Idle','Run','Serve','Walk','Wave']);
  expect(g.scene.getObjectByName('EXPORT_Grip1')).toBeTruthy();
  const mixer=new THREE.AnimationMixer(g.scene);mixer.clipAction(g.animations.find(c=>c.name==='Idle')!).play();mixer.update(0);g.scene.updateMatrixWorld(true);
  const size=new THREE.Box3().setFromObject(g.scene).getSize(new THREE.Vector3());expect(size.y).toBeGreaterThan(1.7);expect(size.y).toBeLessThan(2.0);
  let tris=0,draws=0;g.scene.traverse(o=>{if(o instanceof THREE.Mesh){tris+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;draws++;}});
  expect(tris).toBeLessThan(30000);expect(draws).toBeLessThanOrEqual(35);expect(bytes.length).toBeLessThan(600000);
 });
 it('plants the stance foot while the character travels, and closes the walking loop',async()=>{
  const g=await load(),mixer=new THREE.AnimationMixer(g.scene),walk=g.animations.find(c=>c.name==='Walk')!;
  mixer.clipAction(walk).play();let foot:THREE.Object3D|undefined;g.scene.traverse(o=>{if(o.name.includes('Ankle-1_CHAR_sole'))foot=o;});expect(foot).toBeTruthy();
  const points:number[]=[];
  for(const t of [.04,.12,.20,.28,.36,.44]){
   mixer.setTime(t);g.scene.position.z=t*(.72/.55);g.scene.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(foot!);expect(Math.abs(bounds.min.y)).toBeLessThan(.005);points.push(bounds.getCenter(new THREE.Vector3()).z);
  }
  expect(Math.max(...points)-Math.min(...points)).toBeLessThan(.008);
  g.scene.position.z=0;mixer.setTime(0);g.scene.updateMatrixWorld(true);const start=foot!.getWorldPosition(new THREE.Vector3());
  mixer.setTime(walk.duration);g.scene.updateMatrixWorld(true);expect(foot!.getWorldPosition(new THREE.Vector3()).distanceTo(start)).toBeLessThan(.001);
 });
});
