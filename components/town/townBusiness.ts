import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
export function createCoffeeCart(){
  const root=new THREE.Group();root.position.set(2.2,.22,8.7);root.visible=false;
  const add=(w:number,h:number,d:number,x:number,y:number,z:number,color:string)=>{const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,.055),new THREE.MeshStandardMaterial({color,roughness:.55}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;};
  add(1.65,.85,.9,0,.64,0,'#428d84');add(1.85,.12,1.05,0,1.1,0,'#eed8b0');
  for(const x of [-.65,.65]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.12,16),new THREE.MeshStandardMaterial({color:'#34434b'}));wheel.rotation.x=Math.PI/2;wheel.position.set(x,.21,.43);root.add(wheel);}
  add(.52,.44,.36,.38,1.38,0,'#d9b769');add(.25,.13,.29,.38,1.2,-.24,'#263e45');
  for(const x of [-.5,-.25]){const cup=new THREE.Mesh(new THREE.CylinderGeometry(.075,.055,.16,12),new THREE.MeshStandardMaterial({color:'#fff3d7'}));cup.position.set(x,1.25,0);root.add(cup);}
  const servedCup=new THREE.Mesh(new THREE.CylinderGeometry(.08,.06,.17,16),new THREE.MeshStandardMaterial({color:'#fff5da'}));servedCup.visible=false;root.add(servedCup);
  const label=document.createElement('canvas');label.width=512;label.height=128;const ctx=label.getContext('2d')!;ctx.fillStyle='#164840';ctx.fillRect(0,0,512,128);ctx.fillStyle='#fff0bd';ctx.font='bold 48px sans-serif';ctx.textAlign='center';ctx.fillText('YOUR COFFEE CART',256,78);
  const texture=new THREE.CanvasTexture(label);texture.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.55,.38),new THREE.MeshBasicMaterial({map:texture}));sign.position.set(0,.72,-.46);sign.rotation.y=Math.PI;root.add(sign);const back=sign.clone();back.position.z=.46;back.rotation.y=0;root.add(back);
  const cover=new THREE.Group();root.add(cover);
  for(const x of [-.8,.8]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1.3,8),new THREE.MeshStandardMaterial({color:'#3e5b5b'}));pole.position.set(x,1.77,.25);cover.add(pole);}
  for(let i=0;i<8;i++){const panel=new THREE.Mesh(new RoundedBoxGeometry(.25,.1,1.3,2,.02),new THREE.MeshStandardMaterial({color:i%2?'#f3ce86':'#edeee1'}));panel.position.set(-.875+i*.25,2.43,0);panel.castShadow=true;cover.add(panel);}
  const crates=add(.5,.38,.45,1.12,.2,0,'#bd864f');cover.visible=false;crates.visible=false;
  return {root,presentCup(position:THREE.Vector3|null){servedCup.visible=!!position;if(position)servedCup.position.copy(root.worldToLocal(position.clone()));},setState(owned:boolean,upgraded:boolean){root.visible=owned;cover.visible=upgraded;crates.visible=upgraded;}};
}
