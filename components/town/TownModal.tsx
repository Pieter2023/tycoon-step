import CafeServicePanel from './CafeServicePanel';
import CafeServiceHUD from './CafeServiceHUD';
import { CafeService, ServiceAction, ServicePlan, createCafeService, stepCafeService, serviceTask, atServiceStation } from '../../services/cafeService';
import CafePanel, { CafeLedger } from './CafePanel';
import { CafeAction, cafeWeather } from '../../services/townCafe';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Building2, Footprints, RotateCcw, X } from 'lucide-react';
import Modal from '../Modal';
import { AssetType, GameState, MarketItem } from '../../types';
import { MARKET_ITEMS } from '../../constants';
import { incomeLabel, incomeYield } from '../../services/investmentModel';
import { calculateMonthlyCashFlowEstimate } from '../../services/gameLogic';
import { createTownScene, TownController } from './createTownScene';
import { TOWN_PLACES, TownPlaceId, townPrice } from './townWorld';
import './town.css';
import { coffeeCart, CART_PERMIT, CART_UPGRADE, TownAction } from '../../services/townProgress';
import TellerPanel, { TownLoan } from './TellerPanel';
import CartShiftPanel from './CartShiftPanel';
import type { BankTransfer, CartPlan } from '../../services/townActivities';
import type { TownSpot } from './createTownScene';
import { activeJourney } from '../../services/townJourney';
import ExchangePanel from './ExchangePanel';
import { marketMood, indexChangePct, EXCHANGE_ITEMS, holdingOf } from '../../services/townMarket';
import { nominalPrice } from '../../services/investmentModel';
import type { CameraPreset } from './townControls';
import type { TownView } from './createTownScene';
import { guideLabel, guideNextHop, GuideTarget } from './townGuide';
import { characterSex } from './townResidents';

type Props = {
  state: GameState;
  disabled: boolean;
  reduceMotion: boolean;
  onCafeServiceAction?: (action:ServiceAction)=>void;
  onCafeAction?: (action:CafeAction)=>void;
  onTransfer?: (transfer:BankTransfer)=>void;
  onRunShift?: (plan:CartPlan)=>void;
  loans?: TownLoan[];
  onBuy: (item: MarketItem, quantity?: number) => void;
  onSell?: (assetId: string) => void;
  onClose: () => void;
  onOpenMoney: (tab: 'invest' | 'bank' | 'portfolio', place?:TownPlaceId) => void;
  onAction?: (action:TownAction)=>void;
  onRememberView?: (view:TownView)=>void;
  onFinishJourney?:()=>void;
  onNextMonth: () => void;
  saveError?: string | null;
  onBackup: () => void;
};
const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
export default function TownModal({ state, disabled, reduceMotion, onBuy, onSell, onClose, onOpenMoney, onNextMonth, saveError, onBackup, onAction, onRememberView, onTransfer, onRunShift, loans=[], onFinishJourney, onCafeAction, onCafeServiceAction }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const details = useRef<HTMLDivElement>(null);
  const controller = useRef<TownController | null>(null);
  const [near, setNear] = useState<TownPlaceId | null>(null);
  const [destination, setDestination] = useState<TownPlaceId | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [journal,setJournal]=useState(false);
  const [sound,setSound]=useState(false);
  const [cameraTools,setCameraTools]=useState(false);
  const [cameraMode,setCameraMode]=useState<CameraPreset>(state.townView?.mode??'follow');
  const [celebrating,setCelebrating]=useState<string|null>(null);
  const completedBefore=useRef(state.townProgress?.journeyCompletedMonth);
  const investorBefore=useRef(state.townProgress?.investorCompletedMonth);
  const journey=activeJourney(state);
  const [cafePlay,setCafePlay]=useState(true);
  const [practice,setPractice]=useState<CafeService|undefined>();
  const service=practice??state.cafe?.service;
  const serviceActive=service?.status==='active';
  const [servicePaused,setServicePaused]=useState(state.cafe?.service?.status==='active');
  const [playerPoint,setPlayerPoint]=useState({x:0,z:5});
  const previousServiceStatus=useRef(service?.status);
  const [room,setRoom]=useState<'city'|'bank'|'cafe'|'exchange'>('city');
  const [spot,setSpot]=useState<TownSpot>(null);
  const [serving,setServing]=useState(false);
  const shiftRequested=useRef(false);
  const inspectRef=useRef<()=>void>(()=>{});
  // Set by the guide button. While a target is pending, arriving somewhere takes the next hop
  // (door, teller, café) without another tap. Any manual input (tap, joystick, keys, nav) clears it.
  const guided=useRef<GuideTarget|null>(null);
  const cancelGuide=()=>{guided.current=null;setDestination(null);};
  const cart=coffeeCart(state);
  const report=state.lastMonthlyReport;
  const [stick, setStick] = useState({ x: 0, z: 0 });
  const stickPointer = useRef<number | null>(null);
  const [lastPurchase, setLastPurchase] = useState<string | null>(null);
  const pendingPurchase = useRef<{ itemId: string; quantity: number } | null>(null);
  const inspect = () => {
    if(serviceActive&&room==='cafe'){actInShift();return;}
    if(room==='cafe'&&spot==='exit'){controller.current?.leaveCafe?.();return;}
    if(room==='bank'&&spot==='exit'){controller.current?.leaveBank?.();return;}
    if(room==='exchange'&&spot==='exit'){controller.current?.leaveExchange?.();return;}
    if(room==='city'&&near==='bank'&&!unavailable){controller.current?.enterBank?.();return;}
    if(room==='city'&&near==='exchange'&&!unavailable){controller.current?.enterExchange?.();return;}
    if(room==='cafe')setCafePlay(false);
    setJournal(false);setShowDetails(true);
  };
  inspectRef.current=inspect;
  const releaseStick = () => { stickPointer.current = null; setStick({x:0,z:0}); controller.current?.move(0,0); };
  const updateStick = (event: React.PointerEvent<HTMLDivElement>) => {
    if (stickPointer.current !== event.pointerId) return;
    const rect=event.currentTarget.getBoundingClientRect(); let x=(event.clientX-rect.left-rect.width/2)/36, z=(event.clientY-rect.top-rect.height/2)/36;
    const divisor=Math.max(1,Math.hypot(x,z)); x/=divisor;z/=divisor;setStick({x,z});controller.current?.move(x,z);
  };
  useEffect(() => {
    if (!host.current) return;
    setLoading(true);
    try { controller.current = createTownScene(host.current, id => { setNear(id); if(!id)setShowDetails(false); }, () => inspectRef.current(), () => { setUnavailable(true); setLoading(false); setShowDetails(true); }, reduceMotion, () => setLoading(false), {view:state.townView,onView:onRememberView,onRoom:value=>{setRoom(value);setDestination(null);setShowDetails(false);setJournal(false);},onSpot:setSpot,onPlayerPoint:setPlayerPoint,onManual:cancelGuide,playerSex:characterSex(state.character)}); }
    catch { setUnavailable(true); setLoading(false); setShowDetails(true); }
    return () => { controller.current?.dispose(); controller.current = null; };
  }, [reduceMotion]);
  useEffect(()=>{controller.current?.pause?.(showDetails||(room==='cafe'&&serviceActive&&(servicePaused||(!practice&&disabled))));if(showDetails&&details.current)details.current.scrollTop=0;},[showDetails,journal,room,servicePaused,serviceActive,practice,disabled]);
  // When the mission advances (cart bought, permit paid, shift run) the panel content changes under the
  // player's finger; jump back to the top so the new step is the first thing they see, not the last button's neighbour.
  useEffect(()=>{if(details.current)details.current.scrollTop=0;},[journey.step,journey.completed,spot]);
  useEffect(()=>{
    const target=guided.current;if(!target||unavailable||loading)return;
    const hop=guideNextHop(target,{room,near,spot});
    if(hop==='enterBank')controller.current?.enterBank?.();
    else if(hop==='walkToTeller')controller.current?.walkToTeller?.();
    else if(hop==='enterCafe')controller.current?.enterCafe?.();
    else if(hop==='enterExchange')controller.current?.enterExchange?.();
    else if(hop==='walkToBroker')controller.current?.walkToBroker?.();
    else if(hop==='arrived'){guided.current=null;setJournal(false);if(target==='cafe')setCafePlay(!state.cafe);setShowDetails(true);}
  },[near,room,spot,unavailable,loading]);
  useEffect(()=>{controller.current?.setCafeService?.(service);},[service,reduceMotion]);
  useEffect(()=>{
    if(previousServiceStatus.current==='active'&&service?.status==='complete'){setCafePlay(true);setShowDetails(true);setServicePaused(false);}
    previousServiceStatus.current=service?.status;
  },[service?.status]);
  useEffect(()=>{
    if(!serviceActive||servicePaused||showDetails||room!=='cafe'||loading||unavailable||(!practice&&disabled))return;
    const timer=setInterval(()=>{if(!document.hidden)dispatchService({type:'tick'});},1000);
    return ()=>clearInterval(timer);
  },[serviceActive,servicePaused,showDetails,room,loading,unavailable,!!practice,disabled,onCafeServiceAction]);
  useEffect(()=>{controller.current?.setNeighbourhood?.(state.month,state.cafe);},[state.month,state.cafe,reduceMotion]);
  useEffect(()=>{controller.current?.setBusiness?.(!!cart,state.townProgress?.permitMonth!==undefined,!!cart?.opsUpgrade);},[cart,state.townProgress?.permitMonth,reduceMotion]);
  useEffect(()=>{
    if(!shiftRequested.current||state.townProgress?.lastShift?.month!==state.month)return;
    shiftRequested.current=false;const skip=reduceMotion||unavailable||!controller.current?.serveCustomer;setServing(!skip);setShowDetails(skip);
    if(skip)return;
    controller.current?.serveCustomer?.(()=>{setServing(false);setShowDetails(true);});
  },[state.townProgress?.lastShift]);
  useEffect(()=>{
    const completed=state.townProgress?.journeyCompletedMonth, investor=state.townProgress?.investorCompletedMonth;
    const earned=completed!==undefined&&completedBefore.current!==completed?'Neighbourhood entrepreneur':investor!==undefined&&investorBefore.current!==investor?'Patient investor':null;
    completedBefore.current=completed;investorBefore.current=investor;
    if(!earned)return;
    setShowDetails(false);setCelebrating(earned);controller.current?.celebrate?.();
    const timer=setTimeout(()=>setCelebrating(null),4000);return ()=>clearTimeout(timer);
  },[state.townProgress?.journeyCompletedMonth,state.townProgress?.investorCompletedMonth]);
  // The trading floor's ticker mirrors the game's teaching index, prices and holdings.
  useEffect(()=>{
    const mood=marketMood(state.marketCycle.phase,state.economy.recession);
    controller.current?.setBoard?.({rows:EXCHANGE_ITEMS.map(id=>{const item=MARKET_ITEMS.find(i=>i.id===id)!;const held=holdingOf(state,id);const history=held?.priceHistory??[];const before=history.length>1?history[Math.max(0,history.length-13)].value:null;const price=nominalPrice(item,state.month,state.economy.inflationRate);return {name:item.name,price,changePct:before?Math.round(((held?.value??price)/before-1)*1000)/10:indexChangePct(state.marketIndex),held:held?.quantity??0};}),index:(state.marketIndex??[]).map(p=>p.value),mood:mood.label,headline:mood.headline,changePct:indexChangePct(state.marketIndex)});
  },[state.marketIndex,state.month,state.assets,state.marketCycle.phase,state.economy.recession,loading]);
  // Reaching the broker counts as visiting the Exchange for the investor journey.
  useEffect(()=>{if(room==='exchange'&&spot==='broker'&&showDetails&&state.townProgress?.exchangeVisitedMonth===undefined)onAction?.('visit-exchange');},[room,spot,showDetails]);
  const dispatchService=(action:ServiceAction)=>{
    if(practice){if(action.type!=='start')setPractice(previous=>previous?stepCafeService(previous,action):previous);}
    else onCafeServiceAction?.(action);
  };
  const actInShift=()=>{
    if(!service||servicePaused||(!practice&&disabled))return;
    const task=serviceTask(service);if(!task)return;
    const point=controller.current?.getPlayerPoint?.()??playerPoint;
    if(!atServiceStation(point,task.station))controller.current?.walkToServiceStation?.(task.station);
    else dispatchService({type:'interact',point});
  };
  const beginShift=(plan:ServicePlan,isPractice:boolean)=>{
    if(isPractice)setPractice(createCafeService(state.month,plan,{seats:true,machine:true}));
    else {setPractice(undefined);onCafeServiceAction?.({type:'start',plan});}
    setServicePaused(false);setShowDetails(false);setJournal(false);setCafePlay(true);setCameraTools(false);controller.current?.setCamera?.('follow');setCameraMode('follow');
  };
  const owned = TOWN_PLACES.filter(place => place.items.some(id => state.assets.some(asset => asset.marketItemId === id && asset.quantity > 0))).map(place => place.id);
  const ownedKey = owned.join(',');
  useEffect(() => { controller.current?.setOwned(owned); }, [ownedKey, reduceMotion]);
  const quantityOf = (id: string) => state.assets.filter(asset => asset.marketItemId === id).reduce((sum, asset) => sum + asset.quantity, 0);
  useEffect(() => {
    const pending = pendingPurchase.current;
    if (pending && quantityOf(pending.itemId) > pending.quantity) {
      setLastPurchase(MARKET_ITEMS.find(item => item.id === pending.itemId)?.name ?? 'Investment'); pendingPurchase.current = null;
    }
  }, [state.assets]);
  const place = TOWN_PLACES.find(p => p.id === near);
  const expenses = calculateMonthlyCashFlowEstimate(state).expenses;
  const move = (id: TownPlaceId) => { cancelGuide(); setDestination(id); setLastPurchase(null); setJournal(false);setShowDetails(unavailable); if (unavailable) setNear(id); else controller.current?.walkTo(id); setDestination(id); };
  const visitCart=()=>{cancelGuide();setShowDetails(false);setJournal(false);controller.current?.visitCart?.();setDestination('business');};
  const visitCafe=()=>{cancelGuide();setJournal(false);if(room==='cafe')setCafePlay(false);if(unavailable){setRoom('cafe');setShowDetails(true);}else if(room==='cafe'){setShowDetails(true);}else if(room==='city'&&near==='business'&&spot!=='cart'){controller.current?.enterCafe?.();}else move('business');};
  const scrollDetailsTo=(selector:string)=>{details.current?.querySelector(selector)?.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'});};
  const guide=(target:GuideTarget,walk:()=>void)=>{walk();if(!unavailable)guided.current=target;};
  const followJourney=()=>{
    setCameraTools(false);
    if(journey.action==='event'){onClose();return;}
    if(journey.completed){
      if(room==='cafe'){if(serviceActive){setServicePaused(false);setShowDetails(false);}else if(!state.cafe&&showDetails&&cafePlay&&!unavailable&&!loading){beginShift({price:4,stock:6,helper:false,pace:'relaxed'},true);}else{setCafePlay(!state.cafe);setJournal(false);setShowDetails(true);}return;}
      if(room==='city'&&near==='business'&&spot!=='cart'&&!unavailable){guide('cafe',()=>controller.current?.enterCafe?.());return;}
      guide('cafe',visitCafe);return;
    }
    if(journey.action==='exchange'||journey.action==='invest'){
      if(room==='exchange'){if(spot==='broker'){if(!showDetails)inspect();else if(journey.action==='invest')scrollDetailsTo('.town-offers');}else guide('broker',()=>{setShowDetails(false);controller.current?.walkToBroker?.();});}
      else if(near==='exchange'&&!unavailable)guide('broker',()=>controller.current?.enterExchange?.());else guide('broker',()=>move('exchange'));
      return;
    }
    if(journey.action==='bank'){
      if(room==='bank'){if(spot==='teller'){if(showDetails)onAction?.('reserve');else inspect();}else guide('teller',()=>{setShowDetails(false);controller.current?.walkToTeller?.();});}
      else if(near==='bank'&&!unavailable)guide('teller',()=>controller.current?.enterBank?.());else guide('teller',()=>move('bank'));
    }else if(journey.action==='business'){if(near==='business'&&spot!=='cart'){if(showDetails)scrollDetailsTo('.town-offers');else inspect();}else guide('business',()=>move('business'));}
    else if(journey.action==='cart'){if(spot==='cart'){if(!showDetails)inspect();else if(journey.step===2)onAction?.('permit');else scrollDetailsTo('.town-shift');}else if(unavailable)move('business');else guide('cart',visitCart);}
    else if(journey.action==='review'){onNextMonth();}
    else if(journey.action==='finish'&&journal&&showDetails){onFinishJourney?.();}
    else {setJournal(true);setShowDetails(true);}
  };
  const guideText=guideLabel({journey,room,near,spot,showDetails,journal,serviceActive,hasCafe:!!state.cafe});
  const guideDisabled=serving||(disabled&&(journey.action==='review'||journey.action==='finish'))||(guideText==='Confirm my cash reserve'&&(disabled||state.cash<expenses))||(guideText==='Pay the $60 permit'&&(disabled||state.cash<CART_PERMIT));
  const chooseCamera=(mode:CameraPreset)=>{setCameraMode(mode);controller.current?.setCamera?.(mode);setCameraTools(false);};
  return <Modal isOpen onClose={onClose} ariaLabel="Freedom Square 3D neighbourhood" showCloseButton={false} overlayStyle={{ padding: 0 }} contentStyle={{ maxWidth: 1500, width: '100%' }} contentClassName={`town-modal${serviceActive&&room==='cafe'?' town-in-service':''}`}>
    <header className="town-header">
      <div><p className="town-eyebrow">Your city · playable preview</p><h2>{room==='bank'?'Community Bank':room==='cafe'?'Little Square Café':room==='exchange'?'The Exchange':'Freedom Square'}</h2></div>
      <div className="town-balance"><span>Cash available</span><strong>{money(state.cash)}</strong></div>
      <button className="town-icon-button" onClick={onClose} aria-label="Back to dashboard"><X size={22} /></button>
    </header>
    {state.pendingScenario && <div className="px-4 py-3 text-xs leading-5 text-amber-100 bg-amber-950" role="status">You can explore while your event waits. Finish that decision before buying. <button className="underline font-bold" onClick={onClose}>Return to event</button></div>}
    {saveError && <div className="town-save-error" role="alert">Progress could not be saved. <button onClick={onBackup}>Download current progress</button></div>}
    <nav className="town-destinations" aria-label="Walk to a destination">
      {TOWN_PLACES.map(p => <button key={p.id} aria-label={`Walk to ${p.name}`} aria-pressed={destination === p.id} disabled={serving} onClick={() => move(p.id)} style={{ '--place-color': p.color } as React.CSSProperties}><span className="town-dot" />{p.sign === 'BUSINESSES' ? 'Businesses' : p.sign === 'PROPERTY' ? 'Property' : p.sign === 'EXCHANGE' ? 'Stocks' : 'Bank'}{owned.includes(p.id) && <span aria-label="Has holdings"> ✓</span>}</button>)}
      <button disabled={serving} onClick={visitCafe} aria-label={room==='city'&&near==='business'&&spot!=='cart'?'Enter café':'Visit café'}>{room==='city'&&near==='business'&&spot!=='cart'?'Enter café →':state.cafe?'Your café':'Café'}</button>
      {cart&&!unavailable&&<button aria-label="Walk to your coffee cart" disabled={serving} onClick={visitCart} style={{'--place-color':'#eac778'} as React.CSSProperties}><span className="town-dot"/>Your cart</button>}
    </nav>
    {room==='bank'&&<div className="town-interior-nav"><span>Inside the bank</span><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToTeller?.();}}>Walk to teller</button><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToExit?.();}}>Walk to exit</button><button onClick={()=>{cancelGuide();controller.current?.leaveBank?.();}}>Return to square ↗</button></div>}
    {room==='exchange'&&<div className="town-interior-nav"><span>Trading floor</span><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToBroker?.();}}>Walk to broker</button><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToExit?.();}}>Walk to exit</button><button onClick={()=>{cancelGuide();controller.current?.leaveExchange?.();}}>Return to square ↗</button></div>}
    {room==='cafe'&&<div className="town-interior-nav"><span>{state.cafe?'Your café':'Café viewing'}</span><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToCafeCounter?.();}}>Walk to counter</button><button onClick={()=>{setCafePlay(true);setJournal(false);setShowDetails(true);}}>Play a shift</button><button onClick={()=>{setCafePlay(false);setJournal(false);setShowDetails(true);}}>Manage café</button><button onClick={()=>{cancelGuide();if(unavailable){setRoom('city');setShowDetails(false);}else controller.current?.leaveCafe?.();}}>Return to square ↗</button></div>}
    <div className="town-journey-strip">
      <button className="town-journey-summary" disabled={serving} onClick={()=>{setJournal(true);setShowDetails(true);}}><span>{journey.completed?'BADGES EARNED':journey.stage===2?'INVESTOR JOURNEY · '+(journey.step+1)+'/4':'YOUR FIRST BUSINESS · '+(journey.step+1)+'/5'}</span><strong>{journey.title}</strong><small>{journey.completed?'Journey & monthly recap →':'Steps & monthly recap →'}</small></button>
      <button className="town-guide-next" disabled={guideDisabled} onClick={followJourney}>{guideText} →</button>
      <button className="town-sound" aria-pressed={sound} onClick={()=>{const enabled=!sound;controller.current?.setSound?.(enabled);setSound(enabled);}}>Sound {sound?'on':'off'}</button>
    </div>
    <div className={`town-body${showDetails ? ' town-details-open' : ''}${serving?' town-serving-active':''}`}>
      <section className="town-viewport" aria-label="Neighbourhood">
        <div className="town-canvas" ref={host} />
        {serviceActive&&service&&room==='cafe'&&!showDetails&&!unavailable&&<CafeServiceHUD shift={service} practice={!!practice} point={playerPoint} paused={servicePaused||(!practice&&disabled)} onAct={actInShift} onPause={()=>setServicePaused(p=>!p)} onFinish={()=>dispatchService({type:'finish'})}/>}
        {loading && <div className="town-loading" role="status"><span className="town-loading-orbit" /><strong>Welcome to your neighbourhood</strong><span>Opening the city…</span></div>}
        {unavailable ? <div className="town-fallback"><Building2 size={36} /><h3>Explore with the destination buttons</h3><p>This browser cannot display the 3D view. Your purchases and progress still work.</p></div> : <>
          <div className="town-world-caption"><span className="town-live-dot" /> MONTH {state.month} · {cafeWeather(state.month)?'RAIN':'MARKET DAY'}<span>{room==='cafe'?(state.cafe?.plan.open?'Trading plan saved · staff at work':'Your next chapter'):cafeWeather(state.month)?'Rainy afternoon · quieter streets':'Market day · neighbours out and about'}</span></div>
          <button className="town-camera-menu-button" aria-expanded={cameraTools} onClick={()=>setCameraTools(!cameraTools)}>Camera</button>
          <button className="town-reset-camera" aria-label="Reset camera" title="Reset camera (R)" onClick={() => controller.current?.resetView()}><RotateCcw size={18} /></button>
          {cameraTools&&<div className="town-camera-menu" aria-label="Camera controls"><strong>Choose your view</strong><button aria-pressed={cameraMode==='follow'} onClick={()=>chooseCamera('follow')}>Follow character</button><button aria-pressed={cameraMode==='overview'} onClick={()=>chooseCamera('overview')}>See neighbourhood</button><div><button aria-label="Turn camera left" onClick={()=>controller.current?.orbit?.(-.3)}>↶ Left</button><button aria-label="Turn camera right" onClick={()=>controller.current?.orbit?.(.3)}>Right ↷</button></div><div><button onClick={()=>controller.current?.zoom?.(-1)}>Zoom in</button><button onClick={()=>controller.current?.zoom?.(1)}>Zoom out</button></div><p>Tap the ground to walk. Drag to adjust the view. Reset restores this preset.</p><button onClick={()=>setCameraTools(false)}>Done</button></div>}
          {celebrating&&<div className="town-earned" role="status"><span>✦</span><strong>{celebrating}</strong><p>{celebrating==='Patient investor'?'You owned a slice of the market and held it through the noise.':'You opened a business and learned what it earned.'}</p></div>}
          {serving&&<div className="town-serving" role="status">Serving your customers…<span>Your shift receipt is ready in a moment.</span></div>}
          <div className="town-location" role="status">{room==='cafe'?<button onClick={inspect}><strong>{spot==='exit'?'Back to the square':spot==='cafe-counter'?'Your café counter':'Welcome to Little Square Café'}</strong><span>{spot==='exit'?'Leave café →':'Plan, furnish & review →'}</span></button>:(room==='bank'||room==='exchange')&&spot==='exit'?<button onClick={inspect}><strong>Back to the square</strong><span>Leave {room==='bank'?'bank':'the Exchange'} →</span></button>:room==='exchange'?(spot==='broker'?<button onClick={inspect}><strong>Your broker</strong><span>Talk about the market →</span></button>:<><strong>Welcome to the trading floor.</strong><span>Walk to the broker to talk.</span></>):room==='bank'&&!place?<><strong>Welcome inside.</strong><span>Walk to the teller to talk.</span></>:place ? <button onClick={inspect}><strong>{spot==='cart'?'Your coffee cart':room==='bank'?'Your bank teller':place.name}</strong><span>{room==='bank'?'Talk to teller →':place.id==='bank'?'Enter bank →':place.id==='exchange'&&!unavailable?'Enter the Exchange →':spot==='cart'?'Run a shift & manage cart →':'View opportunities →'}</span></button> : <><strong>{destination ? `Next stop: ${TOWN_PLACES.find(p => p.id === destination)?.name}` : 'Make yourself at home.'}</strong><span>Tap a destination or the pavement to walk. Your next step is above.</span></>}</div>
          <div className="town-joystick" role="group" aria-label="Movement joystick. Drag to walk, or use W A S D or arrow keys." tabIndex={0}
            onPointerDown={event=>{event.preventDefault();cancelGuide();stickPointer.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);updateStick(event);}}
            onPointerMove={updateStick} onPointerUp={releaseStick} onPointerCancel={releaseStick} onLostPointerCapture={releaseStick} onBlur={releaseStick}>
            <div className="town-joystick-cross"/><span className="town-joystick-thumb" style={{transform:`translate(${stick.x*30}px, ${stick.z*30}px)`}}/><span className="town-joystick-label">MOVE</span>
          </div>
          <div className="town-camera-help"><span>Drag to look</span><span>Tap to walk</span><span>WASD · Shift to jog</span></div>
        </>}
      </section>
      <aside className="town-details" ref={details} aria-label="Location opportunities" style={{display:showDetails?'block':'none'}}>
        <button className="town-close-details" aria-label="Close opportunities" onClick={()=>setShowDetails(false)}><X size={18}/></button>
        {journal ? <>
          <p className="town-eyebrow">{journey.stage===2?'INVESTOR JOURNEY':'YOUR FIRST BUSINESS'}</p><h3>{journey.title}</h3><p className="town-intro">{journey.detail}</p>
          <ol className="town-journey-steps">{journey.milestones.map((step,index)=><li key={step.title} aria-current={!journey.completed&&index===journey.step?'step':undefined}><span>{step.done?'✓':index+1}</span><strong>{step.title}</strong></li>)}</ol>
          {journey.completed?<><div className="town-badge"><span>✦</span><strong>Neighbourhood entrepreneur</strong><p>Earned in month {state.townProgress?.journeyCompletedMonth}. A milestone you earned through decisions—no cash bonus.</p></div><div className="town-badge"><span>✦</span><strong>Patient investor</strong><p>Earned in month {state.townProgress?.investorCompletedMonth}. You held through the noise.</p></div></>:journey.action==='finish'?<button className="town-primary" disabled={disabled||!onFinishJourney} onClick={onFinishJourney}>{journey.stage===2?'Complete my investor journey ✦':'Complete my opening journey ✦'}</button>:<>{journey.stage===2&&<div className="town-badge"><span>✦</span><strong>Neighbourhood entrepreneur</strong><p>Earned in month {state.townProgress?.journeyCompletedMonth}.</p></div>}<button className="town-primary" disabled={guideDisabled} onClick={followJourney}>{guideText} →</button></>}
          {report?.month ? <section className="town-recap"><h4>Month {report.month}: what changed</h4>
            <dl><div><dt>Cash at month start</dt><dd>{money(report.cashBefore??0)}</dd></div><div><dt>Income received</dt><dd>+{money(report.income)}</dd></div><div><dt>Of that: investments & passive work</dt><dd>{money(report.investmentIncome??0)}</dd></div>{report.assetPayments?.map((payment,index)=><div key={index}><dt>↳ {payment.name}</dt><dd>{money(payment.amount)}</dd></div>)}<div><dt>Living costs & repayments</dt><dd>−{money(report.expenses-(report.businessMaintenance??0))}</dd></div><div><dt>Extra business repairs</dt><dd>−{money(report.businessMaintenance??0)}</dd></div><div><dt>Other cash movements*</dt><dd>{money((report.cashAfter??0)-(report.cashBefore??0)-report.income+report.expenses)}</dd></div><div><dt>Later choices this month</dt><dd>{money(state.cash-(report.cashAfter??state.cash))}</dd></div><div><dt>Cash now</dt><dd>{money(state.cash)}</dd></div><div><dt>Investment price changes</dt><dd>{money(report.marketChange??0)}</dd></div></dl>
            <p>Individual lines are rounded; totals may differ by $1. Price changes affect wealth, not cash received. *Other cash movements include automatic purchases, taxes and debt adjustments.</p>
            {report.cafe&&<CafeLedger receipt={report.cafe}/>}
            <h4>Your recent choices</h4>{state.events.filter(e=>e.type==='DECISION').slice(0,3).map(e=><p key={e.id}><strong>{e.title}</strong><br/>{e.description}</p>)}
          </section> : <div className="town-lesson"><strong>See cause and effect.</strong><p>After advancing a month, this page separates income, expenses and changes in investment prices.</p></div>}
        </> : room==='cafe'?<>
          <div className="town-tabs"><button aria-pressed={cafePlay} onClick={()=>setCafePlay(true)}>Play a shift</button><button aria-pressed={!cafePlay} disabled={serviceActive} onClick={()=>setCafePlay(false)}>Manage café</button></div>
          {cafePlay||serviceActive?<CafeServicePanel state={state} shift={service} practice={!!practice} disabled={disabled||unavailable||loading} unavailable={unavailable||loading} onPractice={plan=>beginShift(plan,true)} onStart={plan=>beginShift(plan,false)} onResume={()=>{setServicePaused(false);setShowDetails(false);}} onExitPractice={()=>setPractice(undefined)}/>:<CafePanel state={state} disabled={disabled} onAction={onCafeAction} onNextMonth={onNextMonth}/>}
        </> : room==='exchange'&&spot==='broker'?<ExchangePanel state={state} disabled={disabled} onBuy={(item,quantity)=>{pendingPurchase.current={itemId:item.id,quantity:quantityOf(item.id)};setLastPurchase(null);onBuy(item,quantity);}} onSell={onSell} onOpenMoney={()=>onOpenMoney('invest','exchange')}/> : room==='bank'&&spot==='teller'?<TellerPanel state={state} disabled={disabled} onTransfer={onTransfer} loans={loans} onLoans={()=>onOpenMoney('bank','bank')} onReserve={()=>onAction?.('reserve')} onBusiness={()=>{setShowDetails(false);if(cart)visitCart();else move('business');}}/> : place ? <>
          {spot==='cart'&&state.townProgress?.permitMonth!==undefined&&<CartShiftPanel state={state} disabled={disabled||serving} onRun={onRunShift?plan=>{shiftRequested.current=true;onRunShift(plan);}:undefined}/>}
          <p className="town-eyebrow">YOU ARE AT · {place.sign}</p><h3>{place.name}</h3>
          <div className="town-lesson"><strong>{place.question}</strong><p>{place.lesson}</p></div>
          {lastPurchase && <p className="town-receipt" role="status">✓ {lastPurchase} added to your portfolio. Your cash balance has updated.</p>}
          {place.id==='bank'&&!state.townProgress?.reserveConfirmed&&<div className="town-lesson"><strong>Protect {money(expenses)} for one month of expenses</strong><p>You have {money(state.cash)} in cash. Confirming this plan moves no money.</p><button className="town-primary" disabled={disabled||state.cash<expenses} onClick={()=>onAction?.('reserve')}>Confirm my cash reserve</button></div>}
          {place.id==='business'&&spot!=='cart'&&(journey.completed||journey.step>=3)&&<button className="town-primary" onClick={visitCafe}>{state.cafe?'Enter your café':'View the café space'} →</button>}
          {place.id==='business'&&cart&&!unavailable&&spot!=='cart'&&<button className="town-primary" onClick={visitCart}>Visit your cart in the square →</button>}
          {place.id==='business'&&cart&&<div className="town-lesson"><strong>{state.townProgress?.permitMonth===undefined?'Your cart needs its trading permit':cart.opsUpgrade?'Your covered cart is open':'Your coffee cart is open'}</strong><p>{state.townProgress?.permitMonth===undefined?'Pay the one-time $60 permit to start earning. Until then, the cart earns $0.':cart.opsUpgrade?'Weather cover reduces income swings and maintenance odds. Profits can still fall.':'Weather cover and storage cost $350. They reduce income swings and maintenance odds, rather than promising extra income.'}</p>{state.townProgress?.permitMonth===undefined?<button className="town-primary" disabled={disabled||state.cash<CART_PERMIT} onClick={()=>onAction?.('permit')}>Pay permit $60</button>:!cart.opsUpgrade&&<button className="town-primary" disabled={disabled||state.cash<CART_UPGRADE} onClick={()=>onAction?.('upgrade')}>Add weather cover $350</button>}</div>}
          <div className="town-offers">
            {(spot==='cart'?[]:place.items).map(id => {
              const item = MARKET_ITEMS.find(i => i.id === id)!;
              const price = townPrice(item, state); const monthly=price*incomeYield(item)/12; const upkeep=item.type===AssetType.REAL_ESTATE?price*.01/12:0; const after = state.cash - price; const quantity = quantityOf(id);
              return <article key={id} className="town-offer">
                <div className="town-offer-heading"><h4>{item.name}</h4>{quantity > 0 && <span>{quantity} held</span>}</div>
                <p><strong>Price {money(price)}</strong> · Risk: {item.risk.replace(/_/g,' ').toLowerCase()}</p>
                <p>{incomeLabel(item.type, id)} assumption: <strong>{(incomeYield(item) * 100).toFixed(1)}%/yr</strong>. Price changes are separate.</p>
                <p>Typical monthly {incomeLabel(item.type,id).toLowerCase()}: <strong>{money(monthly)}</strong>{item.type===AssetType.REAL_ESTATE?` − ${money(upkeep)} routine upkeep = ${money(monthly-upkeep)} before loans, vacancies and tax.`:item.type===AssetType.BUSINESS?' after routine operating costs; repairs and tax are extra.':' before tax. Prices and payments can change.'}</p>
                {id==='coffee_cart'&&<p>First cart needs a $60 permit. No income until licensed. Routine staffing and supplies are included; a quiet month can reduce profit.</p>}
                {item.type===AssetType.BUSINESS&&<p>A 30% quieter month would mean about {money(monthly*.7)} before extra repairs and tax. This is an example, not a worst-case limit.</p>}
                <p className="town-after">Cash after: <strong>{money(after)}</strong>{after >= 0 && after < expenses && <span>Below one month of expenses.</span>}</p>
                <button disabled={disabled || after < 0} onClick={() => { pendingPurchase.current = { itemId: id, quantity }; setLastPurchase(null); onBuy(item); }}>
                  {after < 0 ? `Need ${money(-after)} more` : `${item.type === AssetType.SAVINGS ? 'Deposit' : 'Buy'} ${money(price)}`}
                </button>
              </article>;
            })}
          </div>
          <button className="town-text-button" onClick={() => onOpenMoney(place.id === 'bank' ? 'bank' : 'invest',place.id)}>{place.id === 'bank' ? 'Manage loans and repayments' : place.id === 'property' ? 'Compare properties and mortgages' : 'Explore all investments'} →</button>
        </> : <>
          <div className="town-welcome-icon"><Footprints size={30} /></div><p className="town-eyebrow">A NEW WAY TO BUILD</p><h3>Your decisions.<br />A place to live them.</h3>
          <p className="town-intro">Walk to a building to discover what you can own, what it can earn, and what could go wrong.</p>
          <div className="town-lesson"><strong>Start with your safety net.</strong><p>The bank is a good first stop. Decide how much to keep accessible before buying riskier assets.</p></div>
          <button className="town-primary" onClick={() => move('bank')}>Walk to the bank <ArrowRight size={17} /></button>
          <p className="town-controls-help">W A S D or arrows to walk, Shift to jog. Drag the scene to look around, scroll or pinch to zoom. On touch screens, use the joystick or tap the pavement.</p>
        </>}
        <footer className="town-detail-footer">{lastPurchase&&room==='exchange'&&<p className="town-receipt" role="status">✓ {lastPurchase} added to your portfolio. Your cash balance has updated.</p>}<button className="town-text-button" onClick={() => onOpenMoney('portfolio')}>View my portfolio →</button>{room!=='cafe'&&<button className="town-text-button" onClick={onNextMonth} disabled={disabled}>Review next month →</button>}<p>Same game, same balance. Fictional prices and rates for learning. Enter the bank or café. Your café’s net profit already includes rent, wages and supplies.</p></footer>
      </aside>
    </div>
  </Modal>;
}
