import * as THREE from 'three';
/** The hero's lids (scripts/build-town-hero.py) are stored open, squashed to the crease at this height. */
export const LID_OPEN=.02;
/** Blinks, each person with their own rhythm: the townspeople through their 'Blink' morph target, the hero
 *  (whose eyes are painted into the texture) by lowering the 'Eyelids' mesh over them. */
export function createBlink(root:THREE.Object3D, seed:number){
 const targets:{mesh:THREE.Mesh;index:number}[]=[], lids:THREE.Object3D[]=[];
 root.traverse(o=>{
  if(o instanceof THREE.Mesh&&o.morphTargetInfluences&&o.morphTargetDictionary?.Blink!==undefined)targets.push({mesh:o,index:o.morphTargetDictionary.Blink});
  if(o.name==='Eyelids'&&o.parent?.name!=='Eyelids'){lids.push(o);o.visible=false;}
 });
 const period=3.4+(seed*1.37)%2.2, offset=(seed*.73)%period;
 return (seconds:number,reducedMotion=false,hold?:number)=>{
  if(!targets.length&&!lids.length)return;
  const phase=(seconds+offset)%period, closed=hold??(reducedMotion?0:phase<.16?Math.sin(phase/.16*Math.PI):0);
  for(const t of targets)t.mesh.morphTargetInfluences![t.index]=closed;
  for(const lid of lids){lid.visible=closed>LID_OPEN;lid.scale.y=Math.max(LID_OPEN,closed);}
 };
}
/** Subtle eyelid motion on the pilot; no rig or material changes to other characters. */
export function characterExpression(root:THREE.Object3D){
 const eyes:THREE.Mesh[]=[];
 root.traverse(o=>{
  if(!(o instanceof THREE.Mesh)||!['EXPORT_Mesh_RIG_AlexHead_CHAR_eye','EXPORT_Mesh_RIG_AlexHead_CHAR_iris'].includes(o.name))return;
  o.geometry=o.geometry.clone();o.geometry.computeBoundingBox();const centre=o.geometry.boundingBox!.getCenter(new THREE.Vector3());
  o.geometry.translate(0,-centre.y,0);o.position.y+=centre.y;eyes.push(o);
 });
 return (seconds:number,reducedMotion=false)=>{
  const phase=seconds%4.6;
  const openness=reducedMotion||phase>.18?1:Math.max(.08,Math.abs(phase-.09)/.09);
  for(const eye of eyes)eye.scale.y=openness;
 };
}
