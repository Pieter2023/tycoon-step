import { CafeService, ServiceStation, SERVICE_STATIONS } from '../../services/cafeService';
import { createCafeRoom, clampCafePoint, cafeSpot } from './townCafeRoom';
import { createTownWeather, createTownAmbience } from './townAtmosphere';
import { CafeState, cafeWeather } from '../../services/townCafe';
import * as THREE from 'three';
import { findTownPath, slideMovement, isWalkable } from './townNavigation';
import { createTownBank, clampBankPoint, bankSpot } from './townBank';
import { createCoffeeCart } from './townBusiness';
export type TownView = { x:number; z:number; yaw:number; pitch:number; distance:number; mode?:CameraPreset };
export type TownSpot = 'teller' | 'exit' | 'cart' | 'cafe-counter' | null;
export type TownSceneOptions = { view?:TownView; onView?:(view:TownView)=>void; onRoom?:(room:'city'|'bank'|'cafe')=>void; onPlayerPoint?:(point:TownPoint)=>void; onSpot?:(spot:TownSpot)=>void; onManual?:()=>void };
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { clampTownPoint, nearbyPlace, routeToPlace, TOWN_PLACES, TownPlaceId, TownPoint } from './townWorld';
import { cameraRelativeMovement, normalizeStick, cameraPreset, CameraPreset, turnTowards, isWalkTap, routeSpeed, WALK_SPEED, JOG_SPEED } from './townControls';

export type TownController = {
  setCafeService:(service?:CafeService)=>void; walkToServiceStation:(station:ServiceStation)=>void; getPlayerPoint:()=>TownPoint;
  enterCafe:()=>void; leaveCafe:()=>void; walkToCafeCounter:()=>void; setNeighbourhood:(month:number,cafe?:CafeState)=>void;
  enterBank:()=>void; leaveBank:()=>void; walkToTeller:()=>void; walkToExit:()=>void; serveCustomer:(onDone?:()=>void)=>void; celebrate:()=>void; setCamera:(mode:CameraPreset)=>void; orbit:(delta:number)=>void; zoom:(delta:number)=>void;
  walkTo: (id: TownPlaceId) => void; direction: (key: string, down: boolean) => void;
  move: (x: number, z: number) => void; resetView: () => void;
  setOwned: (ids: TownPlaceId[]) => void; setBusiness: (owned:boolean, licensed:boolean, upgraded:boolean)=>void; setSound:(enabled:boolean)=>void; visitCart:()=>void; pause:(paused:boolean)=>void; dispose: () => void;
};
type Actor = { root: THREE.Object3D; mixer: THREE.AnimationMixer; actions: Record<string, THREE.AnimationAction>; current: string };
const disposeTree = (root: THREE.Object3D) => {
  const geometry = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  root.traverse(o => { if (o instanceof THREE.Mesh || o instanceof THREE.Points || o instanceof THREE.Sprite || o instanceof THREE.Line) {
    if ('geometry' in o) geometry.add(o.geometry);
    for (const mat of Array.isArray(o.material) ? o.material : [o.material]) { materials.add(mat); for (const value of Object.values(mat)) if (value instanceof THREE.Texture) textures.add(value); }
  } });
  geometry.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
};
export function createTownScene(host: HTMLDivElement, onNear: (id: TownPlaceId | null) => void, onInteract: () => void, onFailure: () => void, reducedMotion: boolean, onReady?: () => void, options:TownSceneOptions = {}): TownController {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#bdd7e4'); scene.fog = new THREE.Fog('#bdd7e4', 34, 90);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  const canvas = renderer.domElement; canvas.tabIndex = 0; canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none';
  canvas.setAttribute('aria-label', '3D city. Click pavement to walk, drag to look around, scroll to zoom. W A S D or arrows move relative to the camera.'); host.appendChild(canvas);
  const camera = new THREE.PerspectiveCamera(48, 1, .15, 160);
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment(), environment = pmrem.fromScene(room, .04); room.dispose(); pmrem.dispose();
  scene.environment = environment.texture; scene.environmentIntensity = .32;
  scene.add(new THREE.HemisphereLight('#fff4df', '#687b85', 1.7));
  const sun = new THREE.DirectionalLight('#fff0d4', 3.3); sun.position.set(-16, 25, 15); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -27, right: 27, top: 25, bottom: -25, far: 75 }); sun.shadow.normalBias = .025; sun.shadow.bias = -.0002; sun.shadow.radius = 3; scene.add(sun);
  const outdoors = new THREE.Group(); scene.add(outdoors);
  const bank = createTownBank(); scene.add(bank.root);
  const cafeRoom = createCafeRoom(); scene.add(cafeRoom.root);
  const shopLabel=document.createElement('canvas');shopLabel.width=1024;shopLabel.height=120;
  const shopInk=shopLabel.getContext('2d')!;shopInk.fillStyle='#365d54';shopInk.fillRect(0,0,1024,120);shopInk.fillStyle='#fff0cd';shopInk.font='600 66px sans-serif';shopInk.textAlign='center';shopInk.fillText('LITTLE SQUARE CAFÉ',512,84);
  const shopTexture=new THREE.CanvasTexture(shopLabel);shopTexture.colorSpace=THREE.SRGBColorSpace;
  const shopSign=new THREE.Mesh(new THREE.PlaneGeometry(5.7,.64),new THREE.MeshBasicMaterial({map:shopTexture}));shopSign.position.set(3.5,3.02,-2.03);shopSign.visible=false;outdoors.add(shopSign);
  const weather = createTownWeather(); outdoors.add(weather.root);
  let cafeState:CafeState|undefined, rainy=false, cafeInside=false;
  let inside = false, spot:TownSpot = null, cityView:TownView | undefined;
  const player = new THREE.Group(); const saved=options.view; const spawn=saved&&isWalkable(saved)?saved:{x:0,z:7}; player.position.set(spawn.x, .22, spawn.z); scene.add(player);
  const destinationRing = new THREE.Mesh(new THREE.RingGeometry(.24, .31, 40), new THREE.MeshBasicMaterial({ color: '#fff0a4', side: THREE.DoubleSide, transparent: true, opacity: .85 }));
  destinationRing.rotation.x = -Math.PI / 2; destinationRing.position.y = .235; destinationRing.visible = false; scene.add(destinationRing);
  const ownedMarkers = new Map<TownPlaceId, THREE.Object3D>();
  for (const place of TOWN_PLACES) {
    const marker = new THREE.Mesh(new THREE.OctahedronGeometry(.24), new THREE.MeshStandardMaterial({ color: place.color, emissive: place.color, emissiveIntensity: .18, roughness: .3 }));
    marker.position.set(place.x, .82, -1.1); marker.castShadow = true; outdoors.add(marker);
    const owned = new THREE.Mesh(new THREE.TorusGeometry(.38, .065, 6, 28), new THREE.MeshStandardMaterial({ color: '#f7cd6f', metalness: .55, roughness: .32 })); owned.position.set(place.x, .85, -1.1); owned.visible = false; outdoors.add(owned); ownedMarkers.set(place.id, owned);
  }
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshStandardMaterial({ color: '#61bfd0', metalness: .3, roughness: .17, transparent: true, opacity: .8 })); water.rotation.x = -Math.PI / 2; water.position.set(0,.79,12); outdoors.add(water);
  const droplets = new THREE.BufferGeometry(), dropPositions = new Float32Array(150 * 3); droplets.setAttribute('position', new THREE.BufferAttribute(dropPositions, 3));
  const fountain = new THREE.Points(droplets, new THREE.PointsMaterial({ color: '#c3f1ed', size: .047, transparent: true, opacity: .8 })); fountain.position.set(0,1.55,12); fountain.visible = !reducedMotion; outdoors.add(fountain);
  let alive = true, ready = false, contextAvailable = true, frame = 0, previousTime = performance.now(), elapsed = 0;
  let path: TownPoint[] = [], near: TownPlaceId | null = null, yaw = .12, pitch = .40, distance = 9, zoomDistance = 9;
  const keys = new Set<string>(); let stick = { x: 0, z: 0 }; const velocity = new THREE.Vector2(), cameraTarget = new THREE.Vector3(0,1.65,7), desiredCamera = new THREE.Vector3();
  camera.position.set(1,5.4,15); camera.lookAt(cameraTarget);
  if(saved){yaw=Number.isFinite(saved.yaw)?saved.yaw:.12;pitch=Number.isFinite(saved.pitch)?THREE.MathUtils.clamp(saved.pitch,.16,1.05):.4;zoomDistance=Number.isFinite(saved.distance)?THREE.MathUtils.clamp(saved.distance,4,20):9;distance=zoomDistance;cameraTarget.set(spawn.x,1.65,spawn.z);}
  const cart=createCoffeeCart();outdoors.add(cart.root);let cartLicensed=false,paused=false;
  let ambience:ReturnType<typeof createTownAmbience>|undefined;
  let audioContext:AudioContext|undefined, soundEnabled=false,lastStep=0;
  const stepSound=()=>{if(!soundEnabled||!audioContext||audioContext.state!=='running')return;const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.type='triangle';oscillator.frequency.setValueAtTime(95,audioContext.currentTime);gain.gain.setValueAtTime(.025,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.055);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start();oscillator.stop(audioContext.currentTime+.06);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};};
  let teller:Actor | undefined, serviceUntil=0, serviceStage:'approach'|'serve'|'return'|null=null, serviceDone:(()=>void)|undefined, celebrationUntil=0;
  let serviceReturn:TownPoint={x:2.2,z:9.8},serviceView:{yaw:number;pitch:number;distance:number}|undefined;
  let cameraMode:CameraPreset=saved?.mode==='overview'?'overview':'follow';
  const cafeActors:Actor[]=[];
  let cafeService:CafeService|undefined, lastPointAt=0;
  const guestPaths=new Map<number,{key:string;path:TownPoint[];seated:boolean}>();
  const guestLabels:{sprite:THREE.Sprite;canvas:HTMLCanvasElement;texture:THREE.CanvasTexture;text:string}[]=[];
  const heldCup=new THREE.Mesh(new THREE.CylinderGeometry(.09,.07,.2,16),new THREE.MeshStandardMaterial({color:'#fff1d4'}));heldCup.visible=false;cafeRoom.root.add(heldCup);
  const steam=new THREE.Group();cafeRoom.root.add(steam);
  for(let i=0;i<4;i++){const puff=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:'#fff4de',transparent:true,opacity:.35}));puff.position.set(-.6,1.7+i*.16,-.5);steam.add(puff);}steam.visible=false;
  let playerActor: Actor | undefined; const pedestrians: (Actor & { offset: number; lane: number })[] = [];
  const addActor = (root: THREE.Object3D, clips: THREE.AnimationClip[]): Actor => {
    const mixer = new THREE.AnimationMixer(root), actions: Record<string, THREE.AnimationAction> = {};
    for (const clip of clips){const action=mixer.clipAction(clip);if(['Serve','Wave','Celebrate'].includes(clip.name)){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;}actions[clip.name]=action;}
    return { root, mixer, actions, current: '' };
  };
  const animateActor = (actor: Actor, name: string, dt: number, speed = 1) => {
    if (actor.current !== name) { actor.actions[actor.current]?.fadeOut(.2); actor.actions[name]?.reset().fadeIn(.24).play(); actor.current = name; }
    if (actor.actions[name]) actor.actions[name].timeScale = Math.max(.08,speed);
    actor.mixer.update(dt);
  };
  const draco = new DRACOLoader(); draco.setDecoderPath('/decoders/draco/'); draco.setWorkerLimit(2);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  // Each successful load is released even if the other request fails or the view closes.
  const loaded: THREE.Object3D[] = [];
  const load = async (url: string) => { const gltf = await loader.loadAsync(url); if (!alive) disposeTree(gltf.scene); else loaded.push(gltf.scene); return gltf; };
  Promise.all([load('/models/town/freedom-square.glb'), load('/models/town/town-character.glb')]).then(([town, character]) => {
    if (!alive) return;
    for (const root of [town.scene, character.scene]) root.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
    outdoors.add(town.scene); player.add(character.scene); playerActor = addActor(character.scene, character.animations);
    for (let i = 0; i < 8; i++) {
      const root = character.scene.clone(true); root.scale.setScalar(.86 + (i % 3) * .07);
      root.traverse(o => { if (o instanceof THREE.Mesh && !Array.isArray(o.material) && ['shirt','skin','trousers','hair'].includes(o.material.name)) { o.material = o.material.clone(); const palettes:Record<string,string[]>={shirt:['#779fab','#aa716a','#7d9873','#c7b58c','#967caf'],skin:['#bb805b','#f0cba5','#865d44','#d4a57d','#e2b78c'],trousers:['#354955','#4a5465','#596555','#687684','#414f67'],hair:['#322d2b','#71503a','#252a2e','#b48e61','#44302b']};(o.material as THREE.MeshStandardMaterial).color.set(palettes[o.material.name][i%5]); } });
      outdoors.add(root); pedestrians.push({ ...addActor(root, character.animations), offset: i * 5.9, lane: i % 2 ? 4.9 : 2.1 });
    }
    const tellerRoot = character.scene.clone(true);
    tellerRoot.traverse(o=>{if(o instanceof THREE.Mesh&&!Array.isArray(o.material)&&o.material.name==='shirt'){o.material=o.material.clone();(o.material as THREE.MeshStandardMaterial).color.set('#487b74');}});
    tellerRoot.position.set(0,.22,-1.5); bank.root.add(tellerRoot);
    teller = addActor(tellerRoot,character.animations);
    for(let i=0;i<5;i++) {
      const root=character.scene.clone(true); root.scale.setScalar(i>1?.9:1);
      root.traverse(o=>{if(o instanceof THREE.Mesh&&!Array.isArray(o.material)&&o.material.name==='shirt'){o.material=o.material.clone();(o.material as THREE.MeshStandardMaterial).color.set(i<2?'#477b64':['#bf896a','#7e88ac','#d0ad65'][i-2]);}});
      root.position.set(i<2?(i===0?.8:-1.5):2.6,.22,i<2?-1.5:.8+(i-2)*1.2); root.rotation.y=i<2?0:Math.PI;
      cafeRoom.root.add(root); cafeActors.push(addActor(root,character.animations));
    }
    for(let i=0;i<3;i++) {
      const label=document.createElement('canvas');label.width=512;label.height=100;
      const texture=new THREE.CanvasTexture(label);texture.colorSpace=THREE.SRGBColorSpace;
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(1.8,.35,1);sprite.visible=false;cafeRoom.root.add(sprite);guestLabels.push({sprite,canvas:label,texture,text:''});
    }
    ready = true; onReady?.();
  }).catch(() => { if (alive) onFailure(); });
  const walls = TOWN_PLACES.map(p => new THREE.Box3(new THREE.Vector3(p.x - 3.45, 0, -8.6), new THREE.Vector3(p.x + 3.45, 11, -2.2)));
  // Include tree crowns so foreground foliage cannot swallow the camera.
  for(const [x,z,scale] of [[-16,-1,1.35],[16,-1,1.4],[-12,8,1.5],[12,8,1.5],[-9,13,1.25],[9,13,1.3],[-18,12,1.4],[18,12,1.5]])walls.push(new THREE.Box3(new THREE.Vector3(x-1.85*scale,1.6*scale,z-1.65*scale),new THREE.Vector3(x+1.85*scale,4.5*scale,z+1.65*scale)));
  const cameraRay = new THREE.Ray(), hitPoint = new THREE.Vector3(), cameraDirection = new THREE.Vector3();
  const resize = () => { if (!host.clientWidth || !host.clientHeight) return; camera.aspect = host.clientWidth / host.clientHeight; camera.fov = camera.aspect < .8 ? 58 : 48; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight, false); };
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const clearMovement = () => { keys.clear(); stick = { x: 0, z: 0 }; velocity.set(0,0); };
  const stopPath = () => { path = []; destinationRing.visible = false; };
  const direction = (key: string, down: boolean) => { if (down) { keys.add(key); stopPath(); options.onManual?.(); } else keys.delete(key); };
  const keyboard = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.altKey || event.metaKey || paused || !!serviceStage) return;
    const key = event.key.toLowerCase();
    if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(key)) { event.preventDefault(); direction(key,true); }
    if (key === 'e' && !event.repeat && (near || spot || (cafeInside&&cafeService?.status==='active'))) { event.preventDefault(); onInteract(); }
    if (key === 'r') { yaw=.12;const preset=cameraPreset(cameraMode,inside);pitch=preset.pitch;zoomDistance=preset.distance; }
  };
  const keyup = (event: KeyboardEvent) => direction(event.key.toLowerCase(),false);
  const pointer = new THREE.Vector2(), raycaster = new THREE.Raycaster(), floor = new THREE.Plane(new THREE.Vector3(0,1,0),-.22), point = new THREE.Vector3();
  const pointers = new Map<number,{x:number;y:number}>(); let dragStart = {x:0,y:0}, dragged = false, lastPinch = 0, hadPinch=false;
  const down = (event: PointerEvent) => { if(serviceStage||paused)return;canvas.focus(); canvas.setPointerCapture(event.pointerId); pointers.set(event.pointerId,{x:event.clientX,y:event.clientY}); if(pointers.size===1){dragStart={x:event.clientX,y:event.clientY};dragged=false;hadPinch=false;}else hadPinch=true;lastPinch=0; };
  const pointerMove = (event: PointerEvent) => {
    const previous = pointers.get(event.pointerId); if (!previous) return; pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if (pointers.size > 1) { const [a,b] = Array.from(pointers.values()); const pinch=Math.hypot(a.x-b.x,a.y-b.y); if(lastPinch && pinch>1) zoomDistance=THREE.MathUtils.clamp(zoomDistance*lastPinch/pinch,4,20); lastPinch=pinch; dragged=true; return; }
    if (Math.hypot(event.clientX-dragStart.x,event.clientY-dragStart.y)>8) dragged=true;
    if(dragged) { yaw-=(event.clientX-previous.x)*.0035; pitch=THREE.MathUtils.clamp(pitch+(event.clientY-previous.y)*.0025,.30,.95); }
  };
  const up = (event: PointerEvent) => {
    if (!pointers.has(event.pointerId)) return; pointers.delete(event.pointerId);
    if (isWalkTap(Math.hypot(event.clientX-dragStart.x,event.clientY-dragStart.y),hadPinch,dragged) && event.button === 0 && ready && !paused) {
      const rect=canvas.getBoundingClientRect(); pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1); raycaster.setFromCamera(pointer,camera);
      if (raycaster.ray.intersectPlane(floor,point)) { const target=inside?(cafeInside?clampCafePoint(point):clampBankPoint(point)):clampTownPoint(point); path=inside?[target]:findTownPath(player.position,target); const end=path.at(-1);if(end){destinationRing.position.set(end.x,.235,end.z);destinationRing.visible=true;} options.onManual?.(); }
    }
  };
  const cancel = () => { pointers.clear(); hadPinch=true;dragged=true; lastPinch=0; };
  const wheel = (event: WheelEvent) => { event.preventDefault(); zoomDistance=THREE.MathUtils.clamp(zoomDistance+event.deltaY*.008,4,20); };
  const contextMenu = (event: Event) => event.preventDefault();
  const blur = () => { clearMovement(); stopPath(); cancel(); };
  const visibility = () => { ambience?.update(rainy,inside,document.hidden); blur(); previousTime=performance.now(); };
  const lost = (event: Event) => { event.preventDefault(); ready=false; contextAvailable=false; clearMovement();serviceStage=null;serviceDone?.();serviceDone=undefined;onFailure(); };
  window.addEventListener('keydown',keyboard); window.addEventListener('keyup',keyup); window.addEventListener('blur',blur); document.addEventListener('visibilitychange',visibility);
  canvas.addEventListener('pointerdown',down); canvas.addEventListener('pointermove',pointerMove); canvas.addEventListener('pointerup',up); canvas.addEventListener('pointercancel',cancel); canvas.addEventListener('wheel',wheel,{passive:false}); canvas.addEventListener('contextmenu',contextMenu); canvas.addEventListener('webglcontextlost',lost);
  const tick = (now:number) => {
    if (!alive) return; frame=requestAnimationFrame(tick); const dt=Math.min((now-previousTime)/1000,.04); previousTime=now; if(document.hidden || !contextAvailable) return; elapsed+=dt;
    if(ready && !paused) {
      const input=normalizeStick(stick.x+Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),stick.z+Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup')));
      let movement=cameraRelativeMovement(input.x,input.z,yaw), speed=keys.has('shift')?JOG_SPEED:WALK_SPEED;
      if (!input.x && !input.z && path.length) {
        const dx=path[0].x-player.position.x,dz=path[0].z-player.position.z,len=Math.hypot(dx,dz);
        if (len<.035) { path.shift(); movement={x:0,z:0}; velocity.set(0,0); }
        else {
          let remaining=len; for(let i=1;i<path.length;i++)remaining+=Math.hypot(path[i].x-path[i-1].x,path[i].z-path[i-1].z);
          movement={x:dx/len,z:dz/len}; speed=Math.min(routeSpeed(remaining,keys.has('shift')||!!serviceStage),Math.sqrt(2*4.5*len),len*7);
        }
      }
      velocity.lerp(new THREE.Vector2(movement.x*speed,movement.z*speed),1-Math.exp(-dt*(movement.x||movement.z?10:18))); if(velocity.length()<.025) velocity.set(0,0);
      const proposed={x:player.position.x+velocity.x*dt,z:player.position.z+velocity.y*dt};
      const next=inside?(cafeInside?clampCafePoint(proposed):clampBankPoint(proposed)):slideMovement(player.position,proposed);
      const actualSpeed=Math.hypot(next.x-player.position.x,next.z-player.position.z)/Math.max(dt,.001); player.position.x=next.x;player.position.z=next.z;
      if(actualSpeed>.08)player.rotation.y=turnTowards(player.rotation.y,Math.atan2(velocity.x,velocity.y),dt);
      else if(inside&&(spot==='teller'||spot==='cafe-counter'||!!cafeService?.brewing))player.rotation.y=turnTowards(player.rotation.y,Math.PI,dt);
      if(serviceStage==='approach'&&!path.length){serviceStage='serve';serviceUntil=elapsed+4;yaw=.95;pitch=.65;zoomDistance=7.5;}
      if(serviceStage==='serve'){player.rotation.y=turnTowards(player.rotation.y,0,dt);if(elapsed>=serviceUntil){serviceStage='return';path=findTownPath(player.position,serviceReturn);}}
      if(serviceStage==='return'&&!path.length){serviceStage=null;if(serviceView){yaw=serviceView.yaw;pitch=serviceView.pitch;zoomDistance=serviceView.distance;}serviceDone?.();serviceDone=undefined;}
      if(actualSpeed>.3 && elapsed-lastStep>(actualSpeed>3.3?.27:.40)){stepSound();lastStep=elapsed;}
      if(playerActor){const moving=actualSpeed>.08;const clip=serviceStage==='serve'||(cafeInside&&cafeService?.brewing)?'Serve':elapsed<celebrationUntil?'Celebrate':moving?(actualSpeed>2.8?'Run':'Walk'):'Idle';animateActor(playerActor,clip,reducedMotion&& !moving?0:dt,moving?actualSpeed/(actualSpeed>2.8?1.6875:1.3125):1);}
      if(!inside) for(const [index,npc] of pedestrians.entries()) {
        const t=((reducedMotion?0:elapsed*.8)+npc.offset)%56,forward=t<28;
        // One customer browses at the licensed cart, away from the walking lanes.
        const visiting=cartLicensed&&index===0;
        const queued=cartLicensed&&index>0&&index<(rainy?2:3);
        const cafeVisitor=!!cafeState?.plan.open&&index>=5;
        npc.root.visible=!(rainy&&cafeVisitor&&index===7);
        const serving=visiting&&serviceStage==='serve';
        const approach=serving?Math.min(1,(4-(serviceUntil-elapsed))/.7,(serviceUntil-elapsed)/.7):0;
        const previous=npc.root.position.clone();
        npc.root.position.set(visiting?1.1+approach*1.1:queued?1.1-index*.9:cafeVisitor?3.8+(index-5)*.65:forward?-14+t:42-t,.22,visiting?9.5+approach*.15:queued?9.5:cafeVisitor?-.4:npc.lane);
        npc.root.rotation.y=visiting||queued||cafeVisitor?Math.PI:forward?Math.PI/2:-Math.PI/2;
        if(!reducedMotion){const v=npc.root.position.distanceTo(previous)/Math.max(.001,dt);animateActor(npc,serving&&approach>=1?'Serve':v>.08?'Walk':'Idle',dt,serving&&approach>=1?1:Math.min(2,v/1.3125));}
      }
      const nextSpot:TownSpot=inside?(cafeInside?cafeSpot(player.position):bankSpot(player.position)):cart.root.visible&&Math.hypot(player.position.x-2.2,player.position.z-8.7)<2?'cart':null;
      if(nextSpot!==spot){spot=nextSpot;options.onSpot?.(spot);}
      const current=inside?(cafeInside?(spot==='cafe-counter'?'business':null):(spot==='teller'?'bank':null)):spot==='cart'?'business':nearbyPlace(player.position);
      if(current!==near){near=current;onNear(current);}if(!path.length)destinationRing.visible=false;
      if(cafeInside&&elapsed-lastPointAt>.12){lastPointAt=elapsed;options.onPlayerPoint?.({x:player.position.x,z:player.position.z});}
    }
    if(inside){yaw=THREE.MathUtils.clamp(yaw,-.65,.65);pitch=THREE.MathUtils.clamp(pitch,.5,.95);zoomDistance=THREE.MathUtils.clamp(zoomDistance,7,12);}
    weather.update(elapsed,rainy,reducedMotion);
    const playing=cafeInside&&cafeService?.status==='active';
    heldCup.visible=false;steam.visible=!!(playing&&cafeService?.brewing);
    if(steam.visible&&!reducedMotion)steam.children.forEach((p,i)=>{p.position.y=1.65+(elapsed*.3+i*.16)%.7;p.position.x=-.6+Math.sin(elapsed*2+i)*.06;});
    guestLabels.forEach(label=>label.sprite.visible=false);
    if(cafeInside) for(const [i,actor] of cafeActors.entries()) {
      if(!playing){
        actor.root.visible=!!cafeState?.plan.open&&(i!==1||!!cafeState.plan.helper)&&(i<3||(!rainy||i<4));
        actor.root.position.set(i<2?(i===0?.8:-1.5):2.6,.22,i<2?-1.5:.8+(i-2)*1.2);actor.root.rotation.y=i<2?0:Math.PI;
        animateActor(actor,elapsed%10<4&&(i===0||i===2)?'Serve':'Idle',reducedMotion?0:dt);
        continue;
      }
      if(i<2){actor.root.visible=i===0&&!!cafeService!.plan.helper;animateActor(actor,'Idle',reducedMotion?0:dt);continue;}
      const guest=cafeService!.guests[i-2];
      if(!guest||guest.status==='coming'){actor.root.visible=false;continue;}
      const departing=guest.status==='left'||(guest.status==='served'&&cafeService!.elapsed-guest.changedAt>=6);
      const sitting=guest.table!=='counter'&&(guest.status==='ordered'||guest.status==='served')&&!departing;
      const key=guest.status+(departing?'-exit':'');
      let motion=guestPaths.get(guest.id);
      if(!motion||motion.key!==key){
        const row=guest.table==='table2'?3.48:.58;
        const targets:TownPoint[]=departing?(actor.root.position.x<0?[{x:-2.35,z:actor.root.position.z},{x:0,z:5.7},{x:2.6,z:6.6}]:[{x:2.6,z:6.6}]):sitting?[{x:0,z:row},{x:-2.35,z:row},{x:-3.5,z:row}]:[{x:2.6,z:.8+guest.id*.95}];
        // Serving a seated guest changes their reaction, not their seat.
        if(motion&&guest.status==='served'&&!departing)targets.splice(0,targets.length);
        motion={key,path:targets,seated:sitting};guestPaths.set(guest.id,motion);
      }
      actor.root.visible=!(departing&&!motion.path.length);
      const target=motion.path[0];let moving=false;
      if(target&&!paused){const dx=target.x-actor.root.position.x,dz=target.z-actor.root.position.z,d=Math.hypot(dx,dz),step=Math.min(d,dt*2.2);if(d<.04)motion.path.shift();else{actor.root.position.x+=dx/d*step;actor.root.position.z+=dz/d*step;actor.root.rotation.y=turnTowards(actor.root.rotation.y,Math.atan2(dx,dz),dt);moving=true;}}
      const seated=motion.seated&&!motion.path.length&&!departing;
      actor.root.position.y=THREE.MathUtils.lerp(actor.root.position.y,seated?-.03:.22,1-Math.exp(-dt*10));
      if(!moving)actor.root.rotation.y=turnTowards(actor.root.rotation.y,seated?0:Math.PI,dt);
      animateActor(actor,moving?'Walk':guest.status==='served'&&!seated?'Wave':'Idle',paused||reducedMotion?0:dt,moving?2.2/1.3125:1);
      if(seated){for(const side of ['-1','1']){const leg=actor.root.getObjectByName('Thigh'+side),knee=actor.root.getObjectByName('Knee'+side),ankle=actor.root.getObjectByName('Ankle'+side);if(leg)leg.rotation.x=-Math.PI/2;if(knee)knee.rotation.x=Math.PI/2;if(ankle)ankle.rotation.x=0;}}
      const label=guestLabels[guest.id];
      if(label){const text=guest.status==='served'?'Thanks!':guest.status==='left'?'Too slow…':guest.status==='ordered'?guest.name+' · '+guest.drink:guest.name+' · Order please';if(label.text!==text){label.text=text;const ctx=label.canvas.getContext('2d')!;ctx.clearRect(0,0,512,100);ctx.fillStyle=guest.status==='left'?'#a45c50':guest.status==='served'?'#4c8265':'#294d43';ctx.fillRect(0,0,512,100);ctx.fillStyle='#fff1cc';ctx.font='600 39px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,64);label.texture.needsUpdate=true;}label.sprite.visible=actor.root.visible;label.sprite.position.set(actor.root.position.x,actor.root.position.y+2.15,actor.root.position.z);}
    }
    if(playing&&cafeService?.cupFor!==undefined&&playerActor){
      const shoulder=playerActor.root.getObjectByName('Shoulder1'),elbow=playerActor.root.getObjectByName('Elbow1');if(shoulder)shoulder.rotation.x=-.85;if(elbow)elbow.rotation.x=-.7;
      const grip=playerActor.root.getObjectByName('Grip1');if(grip){scene.updateMatrixWorld(true);heldCup.visible=true;heldCup.position.copy(cafeRoom.root.worldToLocal(grip.getWorldPosition(new THREE.Vector3())));heldCup.position.y+=.04;}
    }
    if(teller&&inside&&!cafeInside)animateActor(teller,spot==='teller'&&!reducedMotion?'Wave':'Idle',reducedMotion?0:dt);
    const cafePortrait=cafeInside&&camera.aspect<.8;
    const framedDistance=zoomDistance*(cafePortrait?Math.min(1.65,.9/camera.aspect):1);
    distance=THREE.MathUtils.lerp(distance,framedDistance,1-Math.exp(-dt*9));
    cameraTarget.lerp(new THREE.Vector3(serviceStage==='serve'?2.2:cafePortrait?player.position.x*.25:player.position.x,1.65,serviceStage==='serve'?8.7:inside?(cafeInside?player.position.z*.25+1.5:player.position.z*.6+1):player.position.z),reducedMotion?1:1-Math.exp(-dt*10));
    desiredCamera.set(cameraTarget.x+Math.sin(yaw)*Math.cos(pitch)*distance,cameraTarget.y+Math.sin(pitch)*distance,cameraTarget.z+Math.cos(yaw)*Math.cos(pitch)*distance);
    cameraDirection.copy(desiredCamera).sub(cameraTarget).normalize();cameraRay.set(cameraTarget,cameraDirection);
    let obstructed=false;
    if(!inside) for(const wall of walls)if(cameraRay.intersectBox(wall,hitPoint)){const length=cameraTarget.distanceTo(hitPoint)-.45;if(length<cameraTarget.distanceTo(desiredCamera)){obstructed=true;desiredCamera.copy(cameraTarget).addScaledVector(cameraDirection,Math.max(.7,length));}}
    camera.position.lerp(desiredCamera,(reducedMotion||obstructed)?1:1-Math.exp(-dt*12));camera.lookAt(cameraTarget);
    if(!reducedMotion){for(let i=0;i<150;i++){const t=(elapsed*.65+i/150)%1,a=i*2.399;dropPositions[i*3]=Math.sin(a)*t*.8;dropPositions[i*3+1]=Math.sin(t*Math.PI)*1.2;dropPositions[i*3+2]=Math.cos(a)*t*.8;}droplets.attributes.position.needsUpdate=true;water.rotation.z=elapsed*.04;}
    let cupPosition:THREE.Vector3|null=null;
    if(serviceStage==='serve'&&!reducedMotion&&playerActor&&pedestrians[0]){
      const t=(4-(serviceUntil-elapsed))/4;
      const giver=playerActor.root.getObjectByName('Grip1'),receiver=pedestrians[0].root.getObjectByName('Grip1');
      if(giver&&receiver&&t>.12&&t<.87){scene.updateMatrixWorld(true);cupPosition=giver.getWorldPosition(new THREE.Vector3());const target=receiver.getWorldPosition(new THREE.Vector3());const f=THREE.MathUtils.smoothstep(t,.42,.65);cupPosition.lerp(target,f);cupPosition.y+=.04;}
    }
    cart.presentCup(cupPosition);
    renderer.render(scene,camera);
  };
  const transition = (enter:boolean, cafe=false) => {
    if(!ready||enter===inside)return;
    clearMovement();stopPath();cancel();paused=false;
    if(enter){cityView={x:player.position.x,z:player.position.z,yaw,pitch,distance:zoomDistance,mode:cameraMode};player.position.set(0,.22,5);yaw=.12;const preset=cameraPreset(cameraMode,true);pitch=preset.pitch;zoomDistance=preset.distance;}
    else {const view=cityView??{x:-10.5,z:-1.1,yaw:.12,pitch:.4,distance:9};player.position.set(view.x,.22,view.z);yaw=view.yaw;pitch=view.pitch;zoomDistance=view.distance;}
    inside=enter;cafeInside=enter&&cafe;scene.background=new THREE.Color(enter?'#ccd7cd':rainy?'#adbec7':'#bdd7e4');scene.fog=new THREE.Fog(enter?'#ccd7cd':rainy?'#adbec7':'#bdd7e4',34,90);bank.root.visible=enter&&!cafe;cafeRoom.root.visible=enter&&cafe;ambience?.update(rainy,inside,document.hidden);outdoors.visible=!enter;near=null;spot=null;onNear(null);options.onSpot?.(null);options.onRoom?.(enter?(cafe?'cafe':'bank'):'city');
    player.rotation.y=Math.PI;cameraTarget.set(player.position.x,1.65,player.position.z);distance=zoomDistance;
    camera.position.set(cameraTarget.x+Math.sin(yaw)*Math.cos(pitch)*distance,cameraTarget.y+Math.sin(pitch)*distance,cameraTarget.z+Math.cos(yaw)*Math.cos(pitch)*distance);
    canvas.setAttribute('aria-label',enter?(cafe?'3D café. Walk to the counter to manage your business.':'3D bank lobby. Walk to the teller or the city exit.'):'3D city. Tap pavement to walk.');
  };
  frame=requestAnimationFrame(tick);
  return {
    setCafeService(value){
      const fresh=value?.status==='active'&&(!cafeService||cafeService.status!=='active'||value.month!==cafeService.month||(value.elapsed===0&&cafeService.elapsed>0));
      cafeService=value;
      if(fresh){guestPaths.clear();cafeActors.slice(2).forEach((actor,i)=>actor.root.position.set(2.6,.22,6.4+i*.3));}
      cafeRoom.setState(value?.status==='active'?{seats:value.seats,machine:value.machine}:cafeState);
    },
    getPlayerPoint(){return {x:player.position.x,z:player.position.z};},
    walkToServiceStation(station){if(!cafeInside)return;clearMovement();path=[{x:SERVICE_STATIONS[station].x,z:SERVICE_STATIONS[station].z}];destinationRing.position.set(path[0].x,.235,path[0].z);destinationRing.visible=true;},
    enterCafe(){if(near==='business'&&!inside)transition(true,true);},leaveCafe(){transition(false);},
    walkToCafeCounter(){if(cafeInside){clearMovement();path=[{x:0,z:.8}];}},
    setNeighbourhood(month,cafe){cafeState=cafe;shopSign.visible=!!cafe;rainy=cafeWeather(month);cafeRoom.setState(cafeService?.status==='active'?{seats:cafeService.seats,machine:cafeService.machine}:cafe);if(!inside){scene.background=new THREE.Color(rainy?'#adbec7':'#bdd7e4');if(scene.fog instanceof THREE.Fog)scene.fog.color.set(rainy?'#adbec7':'#bdd7e4');}sun.intensity=rainy?1.6:3.3;sun.color.set(rainy?'#d6e5ee':'#fff0d4');ambience?.update(rainy,inside,document.hidden);},
    enterBank(){if(near==='bank'&&!inside)transition(true);},leaveBank(){transition(false);},
    walkToTeller(){if(inside){clearMovement();path=[{x:0,z:.75}];}},
    walkToExit(){if(inside){clearMovement();path=[{x:0,z:6.1}];}},
    serveCustomer(onDone){if(inside||!ready||reducedMotion){onDone?.();return;}clearMovement();stopPath();serviceReturn={x:player.position.x,z:player.position.z};serviceView={yaw,pitch,distance:zoomDistance};serviceDone=onDone;serviceStage='approach';path=findTownPath(player.position,{x:2.2,z:7.4});},
    celebrate(){if(!reducedMotion){celebrationUntil=elapsed+3;clearMovement();stopPath();}},
    setCamera(mode){cameraMode=mode;const preset=cameraPreset(mode,inside);yaw=.12;pitch=preset.pitch;zoomDistance=preset.distance;},
    orbit(delta){yaw+=delta;},zoom(delta){zoomDistance=THREE.MathUtils.clamp(zoomDistance+delta,inside?7:5,inside?12:18);},
    walkTo(id){if(inside)transition(false);clearMovement();path=findTownPath(player.position,{x:TOWN_PLACES.find(p=>p.id===id)!.x,z:-1.1});const end=path[path.length-1];if(end){destinationRing.position.set(end.x,.235,end.z);destinationRing.visible=true;}},
    visitCart(){if(inside)transition(false);clearMovement();path=findTownPath(player.position,{x:2.2,z:9.8});},
    setBusiness(owned,licensed,upgraded){cart.setState(owned,upgraded);cartLicensed=owned&&licensed;},
    setSound(enabled){soundEnabled=enabled;if(enabled){audioContext??=new AudioContext();ambience??=createTownAmbience(audioContext);ambience.update(rainy,inside,document.hidden);void audioContext.resume().catch(()=>{});}else void audioContext?.suspend();},
    pause(value){paused=value;if(value){clearMovement();stopPath();if(playerActor)animateActor(playerActor,'Idle',.1);}},
    direction,
    move(x,z){if(serviceStage)return;stick=normalizeStick(x,z);if(stick.x||stick.z){stopPath();options.onManual?.();}},
    resetView(){yaw=.12;const preset=cameraPreset(cameraMode,inside);pitch=preset.pitch;zoomDistance=preset.distance;},
    setOwned(ids){for(const [id,object]of ownedMarkers)object.visible=ids.includes(id);},
    dispose(){options.onView?.(inside&&cityView?cityView:{x:player.position.x,z:player.position.z,yaw,pitch,distance:zoomDistance,mode:cameraMode});ambience?.dispose();void audioContext?.close();alive=false;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',keyboard);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('contextmenu',contextMenu);canvas.removeEventListener('webglcontextlost',lost);playerActor?.mixer.stopAllAction();teller?.mixer.stopAllAction();cafeActors.forEach(a=>a.mixer.stopAllAction());pedestrians.forEach(p=>p.mixer.stopAllAction());for(const root of loaded)if(!root.parent)disposeTree(root);disposeTree(scene);draco.dispose();environment.dispose();sun.shadow.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();}
  };
}
