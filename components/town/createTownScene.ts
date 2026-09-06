import { CafeService, ServiceStation, SERVICE_STATIONS } from '../../services/cafeService';
import { createCafeRoom, clampCafePoint, cafeSpot } from './townCafeRoom';
import { createTownWeather, createTownAmbience } from './townAtmosphere';
import { CafeState, cafeWeather } from '../../services/townCafe';
import * as THREE from 'three';
import { findTownPath, slideMovement, isWalkable } from './townNavigation';
import { createTownBank, clampBankPoint, bankSpot } from './townBank';
import { createTownExchange, clampExchangePoint, exchangeSpot, ExchangeBoard } from './townExchange';
import { createTownProperty, clampPropertyPoint, propertySpot, PropertyBoard } from './townProperty';
import { daylight, dayPhase, createStreetLamps, Daylight } from './townDaylight';
import { createTownHome, createHomeFacade, clampHomePoint, homeSpot } from './townHome';
import { createSeasonPalette, createSeasonFall, seasonFor, Season } from './townSeasons';
import type { Lifestyle } from '../../types';
import { createCoffeeCart } from './townBusiness';
import { createTownTraffic } from './townTraffic';
import { createTownLife, createCyclist, createDogWalker } from './townLife';
import { residentStyle, seatActor, styleCharacter, Sex } from './townResidents';
import { createQualityGovernor, initialQuality, QUALITY_SETTINGS, QualityLevel, QualityMode } from './townQuality';
export type TownView = { x:number; z:number; yaw:number; pitch:number; distance:number; mode?:CameraPreset };
export type TownSpot = 'teller' | 'exit' | 'cart' | 'cafe-counter' | 'broker' | 'agent' | 'board' | 'home' | 'desk' | 'rosa' | null;
export type TownSceneOptions = { view?:TownView; onView?:(view:TownView)=>void; onRoom?:(room:'city'|'bank'|'cafe'|'exchange'|'property'|'home')=>void; onPlayerPoint?:(point:TownPoint)=>void; onSpot?:(spot:TownSpot)=>void; onManual?:()=>void; playerSex?:Sex; quality?:QualityMode; onQuality?:(level:QualityLevel, automatic:boolean)=>void; onTimeOfDay?:(label:Daylight['label'])=>void };
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { clampTownPoint, nearbyPlace, routeToPlace, TOWN_PLACES, TownPlaceId, TownPoint } from './townWorld';
import { cameraRelativeMovement, normalizeStick, cameraPreset, CameraPreset, turnTowards, isWalkTap, routeSpeed, WALK_SPEED, JOG_SPEED } from './townControls';

export type TownController = {
  setCafeService:(service?:CafeService)=>void; walkToServiceStation:(station:ServiceStation)=>void; getPlayerPoint:()=>TownPoint;
  enterCafe:()=>void; leaveCafe:()=>void; walkToCafeCounter:()=>void; setNeighbourhood:(month:number,cafe?:CafeState)=>void;
  enterBank:()=>void; leaveBank:()=>void; walkToTeller:()=>void; walkToExit:()=>void; enterExchange:()=>void; leaveExchange:()=>void; walkToBroker:()=>void; setBoard:(board:ExchangeBoard)=>void; enterProperty:()=>void; leaveProperty:()=>void; walkToAgent:()=>void; setListings:(board:PropertyBoard)=>void; enterHome:()=>void; leaveHome:()=>void; walkToDesk:()=>void; walkHome:()=>void; walkToRosa:()=>void; setLifestyle:(lifestyle:Lifestyle)=>void; setAdvice:(headline:string)=>void; serveCustomer:(onDone?:()=>void)=>void; celebrate:()=>void; setCamera:(mode:CameraPreset)=>void; orbit:(delta:number)=>void; zoom:(delta:number)=>void; setQuality:(mode:QualityMode)=>void; getQuality:()=>QualityLevel;
  walkTo: (id: TownPlaceId) => void; walkToBoard: () => void; direction: (key: string, down: boolean) => void;
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
  const hemi = new THREE.HemisphereLight('#fff4df', '#687b85', 1.7); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0d4', 3.3); sun.position.set(-16, 25, 15); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -27, right: 27, top: 25, bottom: -25, far: 75 }); sun.shadow.normalBias = .025; sun.shadow.bias = -.0002; sun.shadow.radius = 3; scene.add(sun);
  // Graphics tier: resolution cap + shadows. Auto starts from the device hints and follows real frame times.
  const deviceHints = () => ({ pixelRatio: devicePixelRatio, cores: navigator.hardwareConcurrency, coarsePointer: typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches });
  let quality: QualityLevel = initialQuality(options.quality ?? 'auto', deviceHints());
  const governor = createQualityGovernor(quality, (options.quality ?? 'auto') === 'auto');
  const applyQuality = (level: QualityLevel) => {
    const settings = QUALITY_SETTINGS[level], shadowsChanged = renderer.shadowMap.enabled !== settings.shadows; quality = level;
    renderer.setPixelRatio(Math.min(devicePixelRatio, settings.pixelRatioCap)); renderer.shadowMap.enabled = settings.shadows; sun.castShadow = settings.shadows;
    if (sun.shadow.mapSize.x !== settings.shadowMap) { sun.shadow.mapSize.set(settings.shadowMap, settings.shadowMap); sun.shadow.map?.dispose(); sun.shadow.map = null; }
    if (shadowsChanged) scene.traverse(o => { if (o instanceof THREE.Mesh) for (const material of Array.isArray(o.material) ? o.material : [o.material]) material.needsUpdate = true; });
    renderer.shadowMap.needsUpdate = true;
  };
  applyQuality(quality);
  const outdoors = new THREE.Group(); scene.add(outdoors);
  const bank = createTownBank(); scene.add(bank.root);
  const cafeRoom = createCafeRoom(); scene.add(cafeRoom.root);
  const exchange = createTownExchange(); scene.add(exchange.root);
  const office = createTownProperty(); scene.add(office.root);
  const home = createTownHome(); scene.add(home.root);
  const shopLabel=document.createElement('canvas');shopLabel.width=1024;shopLabel.height=120;
  const shopInk=shopLabel.getContext('2d')!;shopInk.fillStyle='#365d54';shopInk.fillRect(0,0,1024,120);shopInk.fillStyle='#fff0cd';shopInk.font='600 66px sans-serif';shopInk.textAlign='center';shopInk.fillText('LITTLE SQUARE CAFÉ',512,84);
  const shopTexture=new THREE.CanvasTexture(shopLabel);shopTexture.colorSpace=THREE.SRGBColorSpace;
  const shopSign=new THREE.Mesh(new THREE.PlaneGeometry(5.7,.64),new THREE.MeshBasicMaterial({map:shopTexture}));shopSign.position.set(3.5,3.02,-2.03);shopSign.visible=false;outdoors.add(shopSign);
  const weather = createTownWeather(); outdoors.add(weather.root);
  let cafeState:CafeState|undefined, rainy=false, cafeInside=false, exchangeInside=false, officeInside=false, homeInside=false, adviceHeadline='';
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
  // Day-night cycle: street lamps and window glow come on at dusk; the sun swings across the square.
  const lamps=createStreetLamps([-14,-7,7,14].map(x=>({x,z:5.9})));outdoors.add(lamps.root);
  // Your place: an apartment door at the west end of the promenade.
  const HOME={x:-15.7,z:7.4};
  const facade=createHomeFacade(HOME);outdoors.add(facade.root);
  {const frame=new THREE.Mesh(new THREE.BoxGeometry(.35,2.6,1.7),new THREE.MeshStandardMaterial({color:'#e9dcc4'}));frame.position.set(-16.55,1.5,HOME.z);frame.castShadow=true;outdoors.add(frame);
   const door=new THREE.Mesh(new THREE.BoxGeometry(.08,2.1,1.0),new THREE.MeshStandardMaterial({color:'#5b7d70'}));door.position.set(-16.36,1.27,HOME.z);outdoors.add(door);
   const knob=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshStandardMaterial({color:'#d9b25a',metalness:.6,roughness:.3}));knob.position.set(-16.3,1.2,HOME.z+.35);outdoors.add(knob);
   const step=new THREE.Mesh(new THREE.BoxGeometry(.6,.12,1.4),new THREE.MeshStandardMaterial({color:'#cfc3ad'}));step.position.set(-16.1,.26,HOME.z);outdoors.add(step);
   const post=new THREE.Mesh(new THREE.BoxGeometry(.08,1.1,.08),new THREE.MeshStandardMaterial({color:'#4a3b2c'}));post.position.set(-15.9,.75,HOME.z+1.1);outdoors.add(post);
   const mailbox=new THREE.Mesh(new THREE.BoxGeometry(.3,.25,.4),new THREE.MeshStandardMaterial({color:'#b04a3c'}));mailbox.position.set(-15.9,1.4,HOME.z+1.1);outdoors.add(mailbox);
   const sign=document.createElement('canvas');sign.width=512;sign.height=128;const ink=sign.getContext('2d')!;ink.fillStyle='#233b33';ink.fillRect(0,0,512,128);ink.fillStyle='#fff0cd';ink.font='600 56px sans-serif';ink.textAlign='center';ink.fillText('12 SQUARE ST · HOME',256,84);
   const texture=new THREE.CanvasTexture(sign);texture.colorSpace=THREE.SRGBColorSpace;const plate=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.375),new THREE.MeshBasicMaterial({map:texture}));plate.position.set(-16.33,2.95,HOME.z);plate.rotation.y=Math.PI/2;outdoors.add(plate);}
  const ROSA={x:-6,z:7.4};
  // Community notice board on the square: this month's challenges live here.
  const BOARD={x:-6.2,z:9.6};
  {const post=new THREE.Mesh(new THREE.BoxGeometry(.12,1.9,.12),new THREE.MeshStandardMaterial({color:'#4a3b2c'}));post.position.set(BOARD.x,1.15,BOARD.z);post.castShadow=true;outdoors.add(post);
   const panel=new THREE.Mesh(new THREE.BoxGeometry(1.7,1.1,.08),new THREE.MeshStandardMaterial({color:'#5f4a36'}));panel.position.set(BOARD.x,1.75,BOARD.z);panel.castShadow=true;outdoors.add(panel);
   const paper=document.createElement('canvas');paper.width=768;paper.height=480;const ink=paper.getContext('2d')!;ink.fillStyle='#f6ecd6';ink.fillRect(0,0,768,480);ink.fillStyle='#3a5a4a';ink.font='600 58px sans-serif';ink.textAlign='center';ink.fillText('NOTICE BOARD',384,90);ink.fillStyle='#6b5a44';ink.font='40px sans-serif';ink.fillText("This month's challenges",384,160);for(const y of [230,300,370]){ink.fillStyle='#fff8ea';ink.fillRect(80,y-40,608,58);ink.fillStyle='#c9b898';ink.fillRect(100,y-24,26,26);ink.fillStyle='#8a7a62';ink.fillRect(150,y-18,300,14);}
   const texture=new THREE.CanvasTexture(paper);texture.colorSpace=THREE.SRGBColorSpace;const sheet=new THREE.Mesh(new THREE.PlaneGeometry(1.55,.97),new THREE.MeshBasicMaterial({map:texture}));sheet.position.set(BOARD.x,1.75,BOARD.z+.05);outdoors.add(sheet);
   const roofBoard=new THREE.Mesh(new THREE.BoxGeometry(1.9,.08,.5),new THREE.MeshStandardMaterial({color:'#7a4a3c'}));roofBoard.position.set(BOARD.x,2.36,BOARD.z);outdoors.add(roofBoard);}
  let glassMaterial:THREE.MeshStandardMaterial|undefined, townMonth=1, phaseOverride:number|undefined, timeLabel:Daylight['label']|undefined;
  // Seasons recolour the merged city materials and drop snow or leaves.
  const seasonFall=createSeasonFall();outdoors.add(seasonFall.root);let palette:ReturnType<typeof createSeasonPalette>|undefined, season:Season='summer', seasonOverride:Season|undefined;
  const life=createTownLife(reducedMotion);outdoors.add(life.root);
  let traffic:ReturnType<typeof createTownTraffic>|undefined, cyclist:ReturnType<typeof createCyclist>|undefined, dogWalker:ReturnType<typeof createDogWalker>|undefined;
  let ambience:ReturnType<typeof createTownAmbience>|undefined;
  let audioContext:AudioContext|undefined, soundEnabled=false,lastStep=0;
  const stepSound=(speed:number)=>{if(!soundEnabled||!audioContext||audioContext.state!=='running')return;ambience?.step(inside,speed);};
  let brewingBefore=false,saleChimed=false,readyBefore=false,serviceCounts={ordered:0,served:0,left:0,tips:0};
  const countGuests=(service?:CafeService)=>({ordered:service?.guests.filter(g=>g.status!=='coming'&&g.status!=='queued').length??0,served:service?.guests.filter(g=>g.status==='served').length??0,left:service?.guests.filter(g=>g.status==='left').length??0,tips:service?.guests.reduce((sum,g)=>sum+(g.tip??0),0)??0});
  let teller:Actor | undefined, broker:Actor | undefined, agent:Actor | undefined, brokerHeadline='', agentHeadline='', serviceUntil=0, serviceStage:'approach'|'serve'|'return'|null=null, serviceDone:(()=>void)|undefined, celebrationUntil=0;
  let serviceReturn:TownPoint={x:2.2,z:9.8},serviceView:{yaw:number;pitch:number;distance:number}|undefined;
  let cameraMode:CameraPreset=saved?.mode==='overview'?'overview':'follow';
  const cafeActors:Actor[]=[];
  const makeSpeech=(parent:THREE.Object3D)=>{const canvas=document.createElement('canvas');canvas.width=768;canvas.height=110;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(3.1,.44,1);sprite.visible=false;parent.add(sprite);let current='';return {sprite,say(text:string,x:number,y:number,z:number){if(text!==current){current=text;const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,768,110);ctx.fillStyle='#fff6e2';ctx.beginPath();ctx.roundRect(4,4,760,102,28);ctx.fill();ctx.fillStyle='#233b33';ctx.font='600 40px sans-serif';ctx.textAlign='center';ctx.fillText(text,384,68);texture.needsUpdate=true;}sprite.position.set(x,y,z);sprite.visible=true;},hide(){sprite.visible=false;}};};
  const tellerSpeech=makeSpeech(bank.root),brokerSpeech=makeSpeech(exchange.root),agentSpeech=makeSpeech(office.root),rosaSpeech=makeSpeech(outdoors);
  const TELLER_LINES=['Morning, neighbour. Moving some money?','One month of bills in cash. That is the rule.','Savings sit still; investments move.'];
  let cafeService:CafeService|undefined, lastPointAt=0;
  const guestPaths=new Map<number,{key:string;path:TownPoint[];seated:boolean}>();
  const guestLabels:{sprite:THREE.Sprite;canvas:HTMLCanvasElement;texture:THREE.CanvasTexture;text:string}[]=[];
  const heldCup=new THREE.Mesh(new THREE.CylinderGeometry(.09,.07,.2,16),new THREE.MeshStandardMaterial({color:'#fff1d4'}));heldCup.visible=false;cafeRoom.root.add(heldCup);
  const steam=new THREE.Group();cafeRoom.root.add(steam);
  const readyCup=new THREE.Mesh(new THREE.CylinderGeometry(.09,.07,.2,16),new THREE.MeshStandardMaterial({color:'#fff1d4'}));readyCup.position.set(-1.05,1.47,-.42);readyCup.visible=false;cafeRoom.root.add(readyCup);
  for(let i=0;i<4;i++){const puff=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:'#fff4de',transparent:true,opacity:.35}));puff.position.set(-.6,1.7+i*.16,-.5);steam.add(puff);}steam.visible=false;
  let playerActor: Actor | undefined; const pedestrians: (Actor & { offset: number; lane: number; seat?: number })[] = [];
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
  // Vehicles are optional: the square still opens if only their file fails.
  // Bump when any model in public/models/town changes: the files keep their names, so browsers would otherwise reuse a cached copy.
  const MODEL_VERSION = '20260906a';
  Promise.all([load(`/models/town/freedom-square.glb?v=${MODEL_VERSION}`), load(`/models/town/town-character.glb?v=${MODEL_VERSION}`), load(`/models/town/town-vehicles.glb?v=${MODEL_VERSION}`).catch(() => null)]).then(([town, character, vehicles]) => {
    if (!alive) return;
    for (const root of [town.scene, character.scene]) root.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
    outdoors.add(town.scene); player.add(character.scene); playerActor = addActor(character.scene, character.animations);
    palette = createSeasonPalette(town.scene); palette.apply(seasonOverride ?? season);
    town.scene.traverse(o => { if (o instanceof THREE.Mesh && !Array.isArray(o.material) && o.material.name === 'glass' && o.material instanceof THREE.MeshStandardMaterial) { glassMaterial = o.material; glassMaterial.emissive.set('#ffc985'); glassMaterial.emissiveIntensity = 0; } });
    const playerSex = options.playerSex ?? 'm';
    styleCharacter(character.scene, { sex: playerSex, hair: playerSex === 'f' ? 'long' : 'short' });
    if (vehicles) {
      traffic = createTownTraffic(vehicles.scene, reducedMotion); outdoors.add(traffic.root);
      const bike = vehicles.scene.getObjectByName('Bike'), dog = vehicles.scene.getObjectByName('Dog');
      if (bike) { const rider = character.scene.clone(true); styleCharacter(rider, residentStyle(12)); cyclist = createCyclist(bike, rider, reducedMotion); outdoors.add(cyclist.root); }
      if (dog) { dogWalker = createDogWalker(dog, reducedMotion); outdoors.add(dogWalker.root, dogWalker.leash); }
    }
    // Dev-only QA handle for inspecting traffic and pigeons from the console; stripped from production builds.
    if (import.meta.env.DEV) (window as unknown as { __town?: unknown }).__town = { traffic, life, cyclist, dogWalker, player: () => ({ x: player.position.x, z: player.position.z }), setPhase: (p?: number) => { phaseOverride = p; }, quality: () => quality, setQuality: (mode: QualityMode) => { governor.set(initialQuality(mode, deviceHints()), mode === 'auto'); applyQuality(governor.level); }, governor, setSeason: (s?: Season) => { seasonOverride = s; palette?.apply(s ?? season); } };
    // Twelve neighbours: walkers on both pavements plus two resting on the promenade benches.
    for (let i = 0; i < 12; i++) {
      const root = character.scene.clone(true); root.scale.setScalar(.86 + (i % 3) * .07);
      styleCharacter(root, residentStyle(i));
      if (i === 8) styleCharacter(root, { sex: 'f', hair: 'long', colors: { shirt: '#8c5a7e', skin: '#d4a57d', hair: '#cfc8c0', trousers: '#4a5465', skirt: '#5d4a6b' } }); // Rosa
      outdoors.add(root); pedestrians.push({ ...addActor(root, character.animations), offset: i * 5.3, lane: i % 2 ? 6.35 : -.2, seat: i === 8 ? -6 : i === 9 ? 6 : undefined });
    }
    const tellerRoot = character.scene.clone(true);
    styleCharacter(tellerRoot, { sex: 'f', hair: 'long', colors: { shirt: '#487b74', hair: '#3a2a24', skin: '#d4a57d', trousers: '#354955' } });
    tellerRoot.position.set(0,.22,-1.5); bank.root.add(tellerRoot);
    teller = addActor(tellerRoot,character.animations);
    const brokerRoot = character.scene.clone(true);
    styleCharacter(brokerRoot, { sex: 'm', hair: 'short', colors: { shirt: '#2f4a6d', hair: '#322d2b', skin: '#bb805b', trousers: '#1f2c3a' } });
    brokerRoot.position.set(0,.22,-1.5); exchange.root.add(brokerRoot); broker = addActor(brokerRoot,character.animations);
    const agentRoot = character.scene.clone(true);
    styleCharacter(agentRoot, { sex: 'f', hair: 'tail', colors: { shirt: '#8a5c8a', hair: '#71503a', skin: '#e2b78c', trousers: '#354955', skirt: '#5d4a6b' } });
    agentRoot.position.set(0,.22,-1.5); office.root.add(agentRoot); agent = addActor(agentRoot,character.animations);
    for (const [i, [x, z]] of [[-2.9, 2.0], [2.9, 4.4]].entries()) {
      const trader = character.scene.clone(true); styleCharacter(trader, residentStyle(14 + i));
      trader.position.set(x, .22, z); trader.rotation.y = x < 0 ? -Math.PI / 2 : Math.PI / 2; exchange.root.add(trader); cafeActors.push({ ...addActor(trader, character.animations), root: trader } as Actor & { root: THREE.Object3D });
    }
    const cafeStyles = [
      { sex: 'm' as const, hair: 'short' as const, beard: true, colors: { shirt: '#477b64', skin: '#865d44', hair: '#252a2e' } },
      { sex: 'f' as const, hair: 'tail' as const, colors: { shirt: '#477b64', skin: '#f0cba5', hair: '#b48e61', trousers: '#4a5465' } },
      { sex: 'f' as const, hair: 'long' as const, colors: { shirt: '#bf896a', skin: '#d4a57d', hair: '#71503a', skirt: '#4f6f86' } },
      { sex: 'm' as const, hair: 'short' as const, cap: true, colors: { shirt: '#7e88ac', skin: '#bb805b', hair: '#322d2b', cap: '#5a3f3a' } },
      { sex: 'm' as const, hair: 'short' as const, beard: true, colors: { shirt: '#d0ad65', skin: '#e2b78c', hair: '#44302b' } },
      { sex: 'f' as const, hair: 'tail' as const, colors: { shirt: '#a0687e', skin: '#f0cba5', hair: '#8a7f78', skirt: '#5d7a55' } },
    ];
    for(let i=0;i<6;i++) {
      const root=character.scene.clone(true); root.scale.setScalar(i>1?.9:1);
      styleCharacter(root, cafeStyles[i]);
      root.position.set(i<2?(i===0?.8:-1.5):2.6,.22,i<2?-1.5:.8+(i-2)*1.2); root.rotation.y=i<2?0:Math.PI;
      cafeRoom.root.add(root); cafeActors.push(addActor(root,character.animations));
    }
    for(let i=0;i<4;i++) {
      const label=document.createElement('canvas');label.width=512;label.height=100;
      const texture=new THREE.CanvasTexture(label);texture.colorSpace=THREE.SRGBColorSpace;
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(1.8,.35,1);sprite.visible=false;cafeRoom.root.add(sprite);guestLabels.push({sprite,canvas:label,texture,text:''});
    }
    ready = true; onReady?.();
  }).catch(() => { if (alive) onFailure(); });
  const walls = TOWN_PLACES.map(p => new THREE.Box3(new THREE.Vector3(p.x - 3.45, 0, -8.6), new THREE.Vector3(p.x + 3.45, 11, -2.2)));
  walls.push(facade.bounds);
  // Tree crowns only matter when the camera itself would sit inside one; a ray merely passing
  // through a canopy on its way up must not drag the camera onto the player's shoulders.
  const crowns=[[-16,-1,1.35],[16,-1,1.4],[-12,8,1.5],[12,8,1.5],[-9,13,1.25],[9,13,1.3],[-18,12,1.4],[18,12,1.5]].map(([x,z,scale])=>new THREE.Box3(new THREE.Vector3(x-1.85*scale,1.6*scale,z-1.65*scale),new THREE.Vector3(x+1.85*scale,4.5*scale,z+1.65*scale)));
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
      if (raycaster.ray.intersectPlane(floor,point)) { const target=inside?(cafeInside?clampCafePoint(point):exchangeInside?clampExchangePoint(point):officeInside?clampPropertyPoint(point):homeInside?clampHomePoint(point):clampBankPoint(point)):clampTownPoint(point); path=inside?[target]:findTownPath(player.position,target); const end=path.at(-1);if(end){destinationRing.position.set(end.x,.235,end.z);destinationRing.visible=true;} options.onManual?.(); }
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
  const dayPhaseDark=()=>daylight(phaseOverride??dayPhase(townMonth,elapsed,reducedMotion),rainy).lamps>.4;
  const tick = (now:number) => {
    if (!alive) return; frame=requestAnimationFrame(tick); const frameMs=now-previousTime, dt=Math.min(frameMs/1000,.04); previousTime=now; if(document.hidden || !contextAvailable) return; elapsed+=dt;
    if(ready){const tier=governor.sample(frameMs);if(tier){applyQuality(tier);options.onQuality?.(tier,true);}}
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
      const next=inside?(cafeInside?clampCafePoint(proposed):exchangeInside?clampExchangePoint(proposed):officeInside?clampPropertyPoint(proposed):homeInside?clampHomePoint(proposed):clampBankPoint(proposed)):slideMovement(player.position,proposed);
      const actualSpeed=Math.hypot(next.x-player.position.x,next.z-player.position.z)/Math.max(dt,.001); player.position.x=next.x;player.position.z=next.z;
      if(actualSpeed>.08)player.rotation.y=turnTowards(player.rotation.y,Math.atan2(velocity.x,velocity.y),dt);
      else if(inside&&(spot==='teller'||spot==='cafe-counter'||spot==='broker'||spot==='agent'||spot==='desk'||!!cafeService?.brewing))player.rotation.y=turnTowards(player.rotation.y,Math.PI,dt);
      if(serviceStage==='approach'&&!path.length){serviceStage='serve';serviceUntil=elapsed+4;yaw=.95;pitch=.65;zoomDistance=7.5;}
      if(serviceStage==='serve'){player.rotation.y=turnTowards(player.rotation.y,0,dt);if(elapsed>=serviceUntil){serviceStage='return';path=findTownPath(player.position,serviceReturn);}}
      if(serviceStage==='return'&&!path.length){serviceStage=null;if(serviceView){yaw=serviceView.yaw;pitch=serviceView.pitch;zoomDistance=serviceView.distance;}serviceDone?.();serviceDone=undefined;}
      if(actualSpeed>.3 && elapsed-lastStep>(actualSpeed>3.3?.27:.40)){stepSound(actualSpeed);lastStep=elapsed;}
      if(playerActor){const moving=actualSpeed>.08;const clip=serviceStage==='serve'||(cafeInside&&cafeService?.brewing)?'Serve':elapsed<celebrationUntil?'Celebrate':moving?(actualSpeed>2.8?'Run':'Walk'):'Idle';animateActor(playerActor,clip,reducedMotion&& !moving?0:dt,moving?actualSpeed/(actualSpeed>2.8?1.6875:1.3125):1);}
      if(!inside) for(const [index,npc] of pedestrians.entries()) {
        if(npc.seat!==undefined){
          // Resting on a promenade bench, facing the fountain; feet reach the pavement.
          npc.root.visible=true;npc.root.position.set(npc.seat+.15,-.09,7.22);npc.root.rotation.y=0;
          animateActor(npc,'Idle',reducedMotion?0:dt);seatActor(npc.root);continue;
        }
        const t=((reducedMotion?0:elapsed*.8)+npc.offset)%64,forward=t<32;
        // One customer browses at the licensed cart, away from the walking lanes.
        const visiting=cartLicensed&&index===0;
        const queued=cartLicensed&&index>0&&index<(rainy?2:3);
        const cafeVisitor=!!cafeState?.plan.open&&index>=5&&index<8;
        npc.root.visible=!(rainy&&cafeVisitor&&index===7);
        const serving=visiting&&serviceStage==='serve';
        const approach=serving?Math.min(1,(4-(serviceUntil-elapsed))/.7,(serviceUntil-elapsed)/.7):0;
        const previous=npc.root.position.clone();
        npc.root.position.set(visiting?1.1+approach*1.1:queued?1.1-index*.9:cafeVisitor?3.8+(index-5)*.65:forward?-16+t:48-t,.22,visiting?9.5+approach*.15:queued?9.5:cafeVisitor?-.9:npc.lane);
        npc.root.rotation.y=visiting||queued||cafeVisitor?Math.PI:forward?Math.PI/2:-Math.PI/2;
        if(!reducedMotion){const v=npc.root.position.distanceTo(previous)/Math.max(.001,dt);animateActor(npc,serving&&approach>=1?'Serve':v>.08?'Walk':'Idle',dt,serving&&approach>=1?1:Math.min(2,v/1.3125));}
      }
      if(!inside){
        const here={x:player.position.x,z:player.position.z};
        for(const pass of traffic?.update(dt,here,rainy||dayPhaseDark(),true)??[])ambience?.carPass(pass.pan,pass.closeness);
        life.update(dt,elapsed,here,true);cyclist?.update(dt,elapsed);
        if(dogWalker&&pedestrians[10])dogWalker.update(dt,elapsed,pedestrians[10].root,pedestrians[10].root.visible);
        ambience?.tick(Math.hypot(here.x,here.z-12));
      }
      const nextSpot:TownSpot=inside?(cafeInside?cafeSpot(player.position):exchangeInside?exchangeSpot(player.position):officeInside?propertySpot(player.position):homeInside?homeSpot(player.position):bankSpot(player.position)):cart.root.visible&&Math.hypot(player.position.x-2.2,player.position.z-8.7)<2?'cart':Math.hypot(player.position.x-BOARD.x,player.position.z-BOARD.z)<1.7?'board':Math.hypot(player.position.x-HOME.x,player.position.z-HOME.z)<1.5?'home':Math.hypot(player.position.x-ROSA.x,player.position.z-ROSA.z)<1.8?'rosa':null;
      if(nextSpot!==spot){spot=nextSpot;options.onSpot?.(spot);}
      const current=inside?(cafeInside?(spot==='cafe-counter'?'business':null):exchangeInside?(spot==='broker'?'exchange':null):officeInside?(spot==='agent'?'property':null):homeInside?null:(spot==='teller'?'bank':null)):spot==='cart'?'business':nearbyPlace(player.position);
      if(current!==near){near=current;onNear(current);}if(!path.length)destinationRing.visible=false;
      if(cafeInside&&elapsed-lastPointAt>.12){lastPointAt=elapsed;options.onPlayerPoint?.({x:player.position.x,z:player.position.z});}
    }
    if(inside){yaw=THREE.MathUtils.clamp(yaw,-.65,.65);pitch=THREE.MathUtils.clamp(pitch,.5,.95);zoomDistance=THREE.MathUtils.clamp(zoomDistance,7,12);}
    weather.update(elapsed,rainy,reducedMotion);seasonFall.update(elapsed,seasonOverride??season,reducedMotion||inside);
    const light=inside?daylight(.22,false):daylight(phaseOverride??dayPhase(townMonth,elapsed,reducedMotion),rainy);
    if(!inside&&(seasonOverride??season)==='winter'){light.sunIntensity*=.8;light.sunColor='#e8f0ff';}
    sun.position.copy(light.sun);sun.intensity=light.sunIntensity;sun.color.set(light.sunColor);hemi.color.set(light.sky);hemi.groundColor.set(light.ground);hemi.intensity=light.skyIntensity;scene.environmentIntensity=light.ambient;
    renderer.toneMappingExposure=Number(light.exposure);lamps.set(inside?0:light.lamps);if(glassMaterial)glassMaterial.emissiveIntensity=light.windows*.9;facade.glass.emissiveIntensity=light.windows*.9;
    if(!inside){(scene.background as THREE.Color).set(light.background);if(scene.fog instanceof THREE.Fog)scene.fog.color.set(light.background);ambience?.night(light.night?1:light.lamps*.6);}
    if(!inside&&light.label!==timeLabel){timeLabel=light.label;options.onTimeOfDay?.(light.label);}
    const playing=cafeInside&&cafeService?.status==='active';
    heldCup.visible=false;steam.visible=!!(playing&&cafeService?.brewing);readyCup.visible=!!(playing&&cafeService?.ready!==undefined);
    const brewingNow=!!(playing&&cafeService?.brewing&&!paused);
    if(brewingNow!==brewingBefore){brewingBefore=brewingNow;ambience?.machine(brewingNow);}
    if(playing){const counts=countGuests(cafeService);if(counts.tips>serviceCounts.tips)ambience?.chime('sale');else if(counts.served>serviceCounts.served)ambience?.chime('serve');else if(counts.left>serviceCounts.left)ambience?.chime('left');else if(counts.ordered>serviceCounts.ordered)ambience?.chime('order');serviceCounts=counts;}
    const readyNow=!!(playing&&cafeService?.ready!==undefined);if(readyNow&&!readyBefore)ambience?.chime('ready');readyBefore=readyNow;
    if(steam.visible&&!reducedMotion)steam.children.forEach((p,i)=>{p.position.y=1.65+(elapsed*.3+i*.16)%.7;p.position.x=-.6+Math.sin(elapsed*2+i)*.06;});
    guestLabels.forEach(label=>label.sprite.visible=false);
    if(cafeInside) for(const [i,actor] of cafeActors.entries()) {
      if(!playing){
        actor.root.visible=!!cafeState?.plan.open&&(i!==1||!!cafeState.plan.helper)&&(i<3||(!rainy||i<4));
        actor.root.position.set(i<2?(i===0?.8:-1.5):2.6,.22,i<2?-1.5:.8+(i-2)*1.2);actor.root.rotation.y=i<2?0:Math.PI;
        animateActor(actor,elapsed%10<4&&(i===0||i===2)?'Serve':'Idle',reducedMotion?0:dt);
        continue;
      }
      if(i<2){actor.root.visible=i===0&&!!cafeService!.plan.helper;const busy=cafeService!.guests.some(g=>g.helperTook&&g.status==='ordered'&&cafeService!.elapsed-g.changedAt<2);animateActor(actor,busy?'Serve':'Idle',reducedMotion?0:dt);continue;}
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
      if(label){const text=guest.status==='served'?(guest.tip?'Thanks! +$'+guest.tip+' tip':'Thanks!'):guest.status==='left'?'Too slow…':guest.status==='ordered'?guest.name+' · '+guest.drink:guest.name+' · Order please';if(label.text!==text){label.text=text;const ctx=label.canvas.getContext('2d')!;ctx.clearRect(0,0,512,100);ctx.fillStyle=guest.status==='left'?'#a45c50':guest.status==='served'?'#4c8265':'#294d43';ctx.fillRect(0,0,512,100);ctx.fillStyle='#fff1cc';ctx.font='600 39px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,64);label.texture.needsUpdate=true;}label.sprite.visible=actor.root.visible;label.sprite.position.set(actor.root.position.x,actor.root.position.y+2.15,actor.root.position.z);}
    }
    if(playing&&cafeService?.cupFor!==undefined&&playerActor){
      const shoulder=playerActor.root.getObjectByName('Shoulder1'),elbow=playerActor.root.getObjectByName('Elbow1');if(shoulder)shoulder.rotation.x=-.85;if(elbow)elbow.rotation.x=-.7;
      const grip=playerActor.root.getObjectByName('Grip1');if(grip){scene.updateMatrixWorld(true);heldCup.visible=true;heldCup.position.copy(cafeRoom.root.worldToLocal(grip.getWorldPosition(new THREE.Vector3())));heldCup.position.y+=.04;}
    }
    if(!inside&&pedestrians[8]){if(spot==='rosa'&&adviceHeadline)rosaSpeech.say(adviceHeadline,ROSA.x+.15,2.55,ROSA.z);else rosaSpeech.hide();}
    if(agent&&officeInside){animateActor(agent,spot==='agent'&&!reducedMotion?'Wave':'Idle',reducedMotion?0:dt);if(spot==='agent'&&agentHeadline)agentSpeech.say(agentHeadline,0,2.45,-1.5);else agentSpeech.hide();}
    if(teller&&inside&&!cafeInside&&!exchangeInside&&!officeInside&&!homeInside){animateActor(teller,spot==='teller'&&!reducedMotion?'Wave':'Idle',reducedMotion?0:dt);if(spot==='teller')tellerSpeech.say(TELLER_LINES[Math.floor(elapsed/6)%TELLER_LINES.length],0,2.45,-1.5);else tellerSpeech.hide();}
    if(broker&&exchangeInside){animateActor(broker,spot==='broker'&&!reducedMotion?'Wave':'Idle',reducedMotion?0:dt);if(spot==='broker'&&brokerHeadline)brokerSpeech.say(brokerHeadline,0,2.45,-1.5);else brokerSpeech.hide();}
    if(exchangeInside)for(const actor of cafeActors.slice(6))animateActor(actor,'Idle',reducedMotion?0:dt);
    const cafePortrait=cafeInside&&camera.aspect<.8;
    const framedDistance=zoomDistance*(cafePortrait?Math.min(1.65,.9/camera.aspect):1);
    distance=THREE.MathUtils.lerp(distance,framedDistance,1-Math.exp(-dt*9));
    cameraTarget.lerp(new THREE.Vector3(serviceStage==='serve'?2.2:cafePortrait?player.position.x*.25:player.position.x,1.65,serviceStage==='serve'?8.7:inside?(cafeInside?player.position.z*.25+1.5:player.position.z*.6+1):player.position.z),reducedMotion?1:1-Math.exp(-dt*10));
    desiredCamera.set(cameraTarget.x+Math.sin(yaw)*Math.cos(pitch)*distance,cameraTarget.y+Math.sin(pitch)*distance,cameraTarget.z+Math.cos(yaw)*Math.cos(pitch)*distance);
    cameraDirection.copy(desiredCamera).sub(cameraTarget).normalize();cameraRay.set(cameraTarget,cameraDirection);
    let obstructed=false;
    if(!inside){
      for(const wall of walls)if(cameraRay.intersectBox(wall,hitPoint)){const length=cameraTarget.distanceTo(hitPoint)-.45;if(length<cameraTarget.distanceTo(desiredCamera)){obstructed=true;desiredCamera.copy(cameraTarget).addScaledVector(cameraDirection,Math.max(.7,length));}}
      for(const crown of crowns)if(crown.containsPoint(desiredCamera)&&cameraRay.intersectBox(crown,hitPoint)){const length=cameraTarget.distanceTo(hitPoint)-.45;obstructed=true;desiredCamera.copy(cameraTarget).addScaledVector(cameraDirection,Math.max(.7,length));}
    }
    camera.position.lerp(desiredCamera,(reducedMotion||obstructed)?1:1-Math.exp(-dt*12));camera.lookAt(cameraTarget);
    if(!reducedMotion){for(let i=0;i<150;i++){const t=(elapsed*.65+i/150)%1,a=i*2.399;dropPositions[i*3]=Math.sin(a)*t*.8;dropPositions[i*3+1]=Math.sin(t*Math.PI)*1.2;dropPositions[i*3+2]=Math.cos(a)*t*.8;}droplets.attributes.position.needsUpdate=true;water.rotation.z=elapsed*.04;}
    let cupPosition:THREE.Vector3|null=null;
    if(serviceStage==='serve'&&!reducedMotion&&playerActor&&pedestrians[0]){
      const t=(4-(serviceUntil-elapsed))/4;
      if(t>.62&&!saleChimed){saleChimed=true;ambience?.chime('sale');}
      const giver=playerActor.root.getObjectByName('Grip1'),receiver=pedestrians[0].root.getObjectByName('Grip1');
      if(giver&&receiver&&t>.12&&t<.87){scene.updateMatrixWorld(true);cupPosition=giver.getWorldPosition(new THREE.Vector3());const target=receiver.getWorldPosition(new THREE.Vector3());const f=THREE.MathUtils.smoothstep(t,.42,.65);cupPosition.lerp(target,f);cupPosition.y+=.04;}
    }
    cart.presentCup(cupPosition);
    renderer.render(scene,camera);
  };
  const transition = (enter:boolean, room:'bank'|'cafe'|'exchange'|'property'|'home'='bank') => {
    if(!ready||enter===inside)return;
    const cafe=room==='cafe', trading=room==='exchange', estate=room==='property', flat=room==='home';
    clearMovement();stopPath();cancel();paused=false;
    if(enter){cityView={x:player.position.x,z:player.position.z,yaw,pitch,distance:zoomDistance,mode:cameraMode};player.position.set(0,.22,5);yaw=.12;const preset=cameraPreset(cameraMode,true);pitch=preset.pitch;zoomDistance=preset.distance;}
    else {const view=cityView??{x:-10.5,z:-1.1,yaw:.12,pitch:.4,distance:9};player.position.set(view.x,.22,view.z);yaw=view.yaw;pitch=view.pitch;zoomDistance=view.distance;}
    inside=enter;cafeInside=enter&&cafe;exchangeInside=enter&&trading;officeInside=enter&&estate;homeInside=enter&&flat;const backdrop=enter?(trading?'#1e2a33':estate?'#d8cfc4':flat?'#d4cbbd':'#ccd7cd'):rainy?'#adbec7':'#bdd7e4';scene.background=new THREE.Color(backdrop);scene.fog=new THREE.Fog(backdrop,34,90);bank.root.visible=enter&&!cafe&&!trading&&!estate&&!flat;cafeRoom.root.visible=enter&&cafe;exchange.root.visible=enter&&trading;office.root.visible=enter&&estate;home.root.visible=enter&&flat;ambience?.update(rainy,inside,document.hidden);outdoors.visible=!enter;near=null;spot=null;onNear(null);options.onSpot?.(null);options.onRoom?.(enter?room:'city');
    player.rotation.y=Math.PI;cameraTarget.set(player.position.x,1.65,player.position.z);distance=zoomDistance;
    camera.position.set(cameraTarget.x+Math.sin(yaw)*Math.cos(pitch)*distance,cameraTarget.y+Math.sin(pitch)*distance,cameraTarget.z+Math.cos(yaw)*Math.cos(pitch)*distance);
    canvas.setAttribute('aria-label',enter?(cafe?'3D café. Walk to the counter to manage your business.':trading?'3D trading floor. Walk to the broker or the city exit.':estate?'3D property office. Walk to the agent or the city exit.':flat?'3D apartment. Walk to the desk or the square exit.':'3D bank lobby. Walk to the teller or the city exit.'):'3D city. Tap pavement to walk.');
  };
  frame=requestAnimationFrame(tick);
  return {
    setCafeService(value){
      const fresh=value?.status==='active'&&(!cafeService||cafeService.status!=='active'||value.month!==cafeService.month||(value.elapsed===0&&cafeService.elapsed>0));
      cafeService=value;serviceCounts=countGuests(value);
      if(fresh){guestPaths.clear();cafeActors.slice(2).forEach((actor,i)=>actor.root.position.set(2.6,.22,6.4+i*.3));}
      cafeRoom.setState(value?.status==='active'?{seats:value.seats,machine:value.machine}:cafeState);
    },
    getPlayerPoint(){return {x:player.position.x,z:player.position.z};},
    walkToServiceStation(station){if(!cafeInside)return;clearMovement();path=[{x:SERVICE_STATIONS[station].x,z:SERVICE_STATIONS[station].z}];destinationRing.position.set(path[0].x,.235,path[0].z);destinationRing.visible=true;},
    enterCafe(){if(near==='business'&&!inside)transition(true,'cafe');},leaveCafe(){transition(false);},
    enterExchange(){if(near==='exchange'&&!inside)transition(true,'exchange');},leaveExchange(){transition(false);},
    walkToBroker(){if(exchangeInside){clearMovement();path=[{x:0,z:.75}];}},
    setBoard(board){exchange.setBoard(board);brokerHeadline=board.headline;},
    enterProperty(){if(near==='property'&&!inside)transition(true,'property');},leaveProperty(){transition(false);},
    walkToAgent(){if(officeInside){clearMovement();path=[{x:0,z:.75}];}},
    setListings(board){office.setBoard(board);agentHeadline=board.headline;},
    enterHome(){if(spot==='home'&&!inside)transition(true,'home');},leaveHome(){transition(false);},
    walkToDesk(){if(homeInside){clearMovement();path=[{x:0,z:.75}];}},
    walkHome(){if(inside)transition(false);clearMovement();path=findTownPath(player.position,{x:HOME.x,z:HOME.z});const end=path.at(-1);if(end){destinationRing.position.set(end.x,.235,end.z);destinationRing.visible=true;}},
    walkToRosa(){if(inside)transition(false);clearMovement();path=findTownPath(player.position,{x:ROSA.x+1.3,z:ROSA.z+.4});const end=path.at(-1);if(end){destinationRing.position.set(end.x,.235,end.z);destinationRing.visible=true;}},
    setLifestyle(lifestyle){home.setLifestyle(lifestyle);},
    setAdvice(headline){adviceHeadline=headline;},
    walkToCafeCounter(){if(cafeInside){clearMovement();path=[{x:0,z:.8}];}},
    setNeighbourhood(month,cafe){cafeState=cafe;townMonth=month;season=seasonFor(month);palette?.apply(seasonOverride??season);shopSign.visible=!!cafe;rainy=cafeWeather(month);cafeRoom.setState(cafeService?.status==='active'?{seats:cafeService.seats,machine:cafeService.machine}:cafe);if(!(scene.background instanceof THREE.Color))scene.background=new THREE.Color('#bdd7e4');ambience?.update(rainy,inside,document.hidden);},
    enterBank(){if(near==='bank'&&!inside)transition(true,'bank');},leaveBank(){transition(false);},
    walkToTeller(){if(inside&&!cafeInside&&!exchangeInside&&!officeInside&&!homeInside){clearMovement();path=[{x:0,z:.75}];}},
    walkToExit(){if(inside){clearMovement();path=[{x:0,z:6.1}];}},
    serveCustomer(onDone){if(inside||!ready||reducedMotion){onDone?.();return;}clearMovement();stopPath();saleChimed=false;serviceReturn={x:player.position.x,z:player.position.z};serviceView={yaw,pitch,distance:zoomDistance};serviceDone=onDone;serviceStage='approach';path=findTownPath(player.position,{x:2.2,z:7.4});},
    celebrate(){ambience?.chime('celebrate');if(!reducedMotion){celebrationUntil=elapsed+3;clearMovement();stopPath();}},
    setCamera(mode){cameraMode=mode;const preset=cameraPreset(mode,inside);yaw=.12;pitch=preset.pitch;zoomDistance=preset.distance;},
    setQuality(mode){const level=initialQuality(mode,deviceHints());governor.set(level,mode==='auto');applyQuality(level);options.onQuality?.(level,false);},getQuality(){return quality;},
    orbit(delta){yaw+=delta;},zoom(delta){zoomDistance=THREE.MathUtils.clamp(zoomDistance+delta,inside?7:5,inside?12:18);},
    walkTo(id){if(inside)transition(false);clearMovement();path=findTownPath(player.position,{x:TOWN_PLACES.find(p=>p.id===id)!.x,z:-1.1});const end=path[path.length-1];if(end){destinationRing.position.set(end.x,.235,end.z);destinationRing.visible=true;}},
    visitCart(){if(inside)transition(false);clearMovement();path=findTownPath(player.position,{x:2.2,z:9.8});},
    walkToBoard(){if(inside)transition(false);clearMovement();path=findTownPath(player.position,{x:BOARD.x+1.2,z:BOARD.z});const end=path.at(-1);if(end){destinationRing.position.set(end.x,.235,end.z);destinationRing.visible=true;}},
    setBusiness(owned,licensed,upgraded){cart.setState(owned,upgraded);cartLicensed=owned&&licensed;},
    setSound(enabled){soundEnabled=enabled;if(enabled){audioContext??=new AudioContext();ambience??=createTownAmbience(audioContext);ambience.update(rainy,inside,document.hidden);void audioContext.resume().catch(()=>{});}else void audioContext?.suspend();},
    pause(value){paused=value;if(value){clearMovement();stopPath();if(playerActor)animateActor(playerActor,'Idle',.1);}},
    direction,
    move(x,z){if(serviceStage)return;stick=normalizeStick(x,z);if(stick.x||stick.z){stopPath();options.onManual?.();}},
    resetView(){yaw=.12;const preset=cameraPreset(cameraMode,inside);pitch=preset.pitch;zoomDistance=preset.distance;},
    setOwned(ids){for(const [id,object]of ownedMarkers)object.visible=ids.includes(id);},
    dispose(){options.onView?.(inside&&cityView?cityView:{x:player.position.x,z:player.position.z,yaw,pitch,distance:zoomDistance,mode:cameraMode});ambience?.dispose();void audioContext?.close();alive=false;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',keyboard);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('contextmenu',contextMenu);canvas.removeEventListener('webglcontextlost',lost);playerActor?.mixer.stopAllAction();teller?.mixer.stopAllAction();cafeActors.forEach(a=>a.mixer.stopAllAction());pedestrians.forEach(p=>p.mixer.stopAllAction());if(traffic)disposeTree(traffic.root);if(cyclist)disposeTree(cyclist.root);if(dogWalker){disposeTree(dogWalker.root);dogWalker.leash.geometry.dispose();}disposeTree(life.root);for(const root of loaded)if(!root.parent)disposeTree(root);disposeTree(scene);draco.dispose();environment.dispose();sun.shadow.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();}
  };
}
