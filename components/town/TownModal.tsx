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
import PropertyPanel from './PropertyPanel';
import NoticeBoardPanel from './NoticeBoardPanel';
import HomePanel from './HomePanel';
import WorkPanel from './WorkPanel';
import { workBoard } from '../../services/townWork';
import type { CareerPath, MonthlyActionId } from '../../types';
import type { MonthlyActionsSummary } from '../../services/monthlyActions';
import AdvisorPanel from './AdvisorPanel';
import { adviceHeadline, type Advice } from '../../services/townAdvisor';
import { seasonFor, SEASON_LABEL } from './townSeasons';
import type { Lifestyle } from '../../types';
import { monthlyChallenges, challengeProgress, currentSnapshot } from '../../services/townChallenges';
import { PROPERTY_LISTINGS, landlordMonth, mortgageQuote } from '../../services/townProperty';
import { MORTGAGE_OPTIONS } from '../../constants';
import { marketMood, indexChangePct, EXCHANGE_ITEMS, holdingOf } from '../../services/townMarket';
import { nominalPrice } from '../../services/investmentModel';
import type { CameraPreset } from './townControls';
import { readQualityMode, saveQualityMode, QUALITY_SETTINGS, QUALITY_MODES, QualityMode, QualityLevel } from './townQuality';
import type { TownView } from './createTownScene';
import { cityCaption } from './townGuide';
import { tl, seasonName, timeOfDayName, qualityName, qualityDetail, placeName, placeQuestion, placeLesson } from '../../i18n/town';
import { useI18n } from '../../i18n';
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
  onMortgage?: (item: MarketItem) => void;
  onChangeLifestyle?: (lifestyle: Lifestyle) => void;
  onPromote?: () => void;
  onOpenLife?: (tab: 'career' | 'education') => void;
  onAskRaise?: (ask: 8 | 15) => void;
  onSwitchCareer?: (path: CareerPath) => void;
  onJobSearch?: () => void;
  onAcceptPlan?: () => void;
  workActions?: MonthlyActionsSummary;
  onMonthlyAction?: (id: MonthlyActionId) => void;
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
export default function TownModal({ state, disabled, reduceMotion, onBuy, onSell, onMortgage, onChangeLifestyle, onPromote, onOpenLife, onAskRaise, onSwitchCareer, onJobSearch, onAcceptPlan, workActions, onMonthlyAction, onClose, onOpenMoney, onNextMonth, saveError, onBackup, onAction, onRememberView, onTransfer, onRunShift, loans=[], onFinishJourney, onCafeAction, onCafeServiceAction }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const details = useRef<HTMLDivElement>(null);
  const controller = useRef<TownController | null>(null);
  const [near, setNear] = useState<TownPlaceId | null>(null);
  const [destination, setDestination] = useState<TownPlaceId | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  useI18n(); // subscribe so a language change re-renders the city copy (tl reads the live locale)
  const [showDetails, setShowDetails] = useState(false);
  const [journal,setJournal]=useState(false);
  const [sound,setSound]=useState(false);
  const [cameraTools,setCameraTools]=useState(false);
  const [cameraMode,setCameraMode]=useState<CameraPreset>(state.townView?.mode??'follow');
  const [qualityMode,setQualityMode]=useState<QualityMode>(()=>readQualityMode());
  const [qualityLevel,setQualityLevel]=useState<QualityLevel|null>(null);
  const [qualityNote,setQualityNote]=useState<string|null>(null);
  // Keyboard and screen-reader support: the side panel and camera menu take focus when they open and
  // hand it back when they close; Escape closes the innermost overlay before the whole city.
  const cameraButton=useRef<HTMLButtonElement>(null), menuBox=useRef<HTMLDivElement>(null), lastFocus=useRef<HTMLElement|null>(null), menuWasOpen=useRef(false);
  useEffect(()=>{
    if(showDetails){lastFocus.current=document.activeElement as HTMLElement|null;const t=setTimeout(()=>details.current?.focus(),0);return()=>clearTimeout(t);}
    if(lastFocus.current&&document.contains(lastFocus.current)&&!details.current?.contains(lastFocus.current))lastFocus.current.focus();lastFocus.current=null;
  },[showDetails]);
  useEffect(()=>{
    if(cameraTools){menuWasOpen.current=true;const t=setTimeout(()=>menuBox.current?.querySelector('button')?.focus(),0);return()=>clearTimeout(t);}
    if(menuWasOpen.current){menuWasOpen.current=false;cameraButton.current?.focus();}
  },[cameraTools]);
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{if(e.key!=='Escape')return;if(cameraTools){e.stopPropagation();e.preventDefault();setCameraTools(false);}else if(showDetails){e.stopPropagation();e.preventDefault();setShowDetails(false);}};
    window.addEventListener('keydown',onKey,true);return()=>window.removeEventListener('keydown',onKey,true);
  },[cameraTools,showDetails]);
  useEffect(()=>{if(!qualityNote)return;const t=setTimeout(()=>setQualityNote(null),7000);return()=>clearTimeout(t);},[qualityNote]);
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
  const [room,setRoom]=useState<'city'|'bank'|'cafe'|'exchange'|'property'|'home'|'work'>('city');
  const [rosa,setRosa]=useState(false);
  const [timeOfDay,setTimeOfDay]=useState<string>('');
  const [board,setBoard]=useState(false);
  const openBoard=()=>{setJournal(false);setRosa(false);setBoard(true);setShowDetails(true);};
  const openRosa=()=>{setJournal(false);setBoard(false);setRosa(true);setShowDetails(true);};
  const goTo=(place:NonNullable<Advice['place']>)=>{setShowDetails(false);setRosa(false);setBoard(false);if(place==='board'){openBoard();return;}if(place==='home'){if(room==='home'){setShowDetails(true);return;}cancelGuide();controller.current?.walkHome?.();return;}if(place==='cafe'){visitCafe();return;}if(place==='work'){if(room==='work'){cancelGuide();controller.current?.walkToManager?.();return;}cancelGuide();controller.current?.walkToWork?.();return;}move(place);};
  const challengesDone=monthlyChallenges(state).map(c=>challengeProgress(c,currentSnapshot(state),state)).filter(p=>p.done).length;
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
    if(room==='city'&&spot==='board'){openBoard();return;}
    if(room==='city'&&spot==='rosa'){openRosa();return;}
    if(room==='city'&&spot==='work'&&!unavailable){controller.current?.enterWork?.();return;}
    if(room==='work'&&spot==='exit'){controller.current?.leaveWork?.();return;}
    if(room==='city'&&spot==='home'&&!unavailable){controller.current?.enterHome?.();return;}
    if(room==='home'&&spot==='exit'){controller.current?.leaveHome?.();return;}
    if(room==='bank'&&spot==='exit'){controller.current?.leaveBank?.();return;}
    if(room==='exchange'&&spot==='exit'){controller.current?.leaveExchange?.();return;}
    if(room==='property'&&spot==='exit'){controller.current?.leaveProperty?.();return;}
    if(room==='city'&&near==='property'&&!unavailable){controller.current?.enterProperty?.();return;}
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
    try { controller.current = createTownScene(host.current, id => { setNear(id); if(!id)setShowDetails(false); }, () => inspectRef.current(), () => { setUnavailable(true); setLoading(false); setShowDetails(true); }, reduceMotion, () => setLoading(false), {view:state.townView,onView:onRememberView,onRoom:value=>{setRoom(value);setDestination(null);setShowDetails(false);setJournal(false);},onSpot:setSpot,onPlayerPoint:setPlayerPoint,onManual:cancelGuide,playerSex:characterSex(state.character),quality:readQualityMode(),onProgress:setProgress,onQuality:(level,automatic)=>{setQualityLevel(level);if(automatic)setQualityNote(`${tl('Graphics switched to','Gráficos cambiados a')} ${qualityName(level)} ${tl('for a steadier frame rate. Change it under Camera.','para una tasa de cuadros más estable. Cámbialo en Cámara.')}`);},onTimeOfDay:setTimeOfDay}); }
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
    else if(hop==='enterWork')controller.current?.enterWork?.();
    else if(hop==='walkToManager')controller.current?.walkToManager?.();
    else if(hop==='enterHome')controller.current?.enterHome?.();
    else if(hop==='walkToDesk')controller.current?.walkToDesk?.();
    else if(hop==='arrived'){guided.current=null;setJournal(false);if(target==='rosa'){openRosa();return;}if(target==='board'){openBoard();return;}if(target==='cafe')setCafePlay(!state.cafe);setShowDetails(true);}
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
  useEffect(()=>{controller.current?.setNeighbourhood?.(state.month,state.cafe,state.hasWon);},[state.month,state.cafe,state.hasWon,reduceMotion]);
  useEffect(()=>{controller.current?.setPayroll?.(workBoard(state));},[state,reduceMotion]);
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
  // The office's listings wall and rate board mirror today's prices, rents and mortgage options.
  useEffect(()=>{
    const rate=state.economy.interestRate;
    controller.current?.setListings?.({headline:rate>=.07?tl('Rates are high','Tasas altas'):rate<=.045?tl('Rates are low','Tasas bajas'):tl('Steady rates','Tasas estables'),rateLine:MORTGAGE_OPTIONS.slice(0,3).map(o=>`${o.name}: ${((rate+o.interestRateSpread)*100).toFixed(2)}%`).join('\n'),
      listings:PROPERTY_LISTINGS.map((id,i)=>{const item=MARKET_ITEMS.find(m=>m.id===id)!;const price=nominalPrice(item,state.month,state.economy.inflationRate);const month=landlordMonth(item,price);const best=(item.mortgageOptions??[]).map(o=>mortgageQuote(price,o,rate)!).find(Boolean);return {name:item.name,price:'$'+price.toLocaleString('en-US'),rent:'Rent ≈ $'+month.grossRent.toLocaleString('en-US')+'/mo',tag:best?best.downPercent+'% down · $'+best.payment.toLocaleString('en-US')+'/mo':tl('Cash purchase','Compra en efectivo'),colour:['#efd9a7','#cfe2d5','#dcc8e6'][i%3]};})});
  },[state.month,state.economy.interestRate,state.economy.inflationRate,loading]);
  useEffect(()=>{if(state.townProgress?.challengeSnapshot?.month!==state.month&&!disabled)onAction?.('challenge-snapshot');},[state.month,disabled]);
  useEffect(()=>{if(!showDetails){setBoard(false);setRosa(false);}},[showDetails]);
  useEffect(()=>{controller.current?.setLifestyle?.(state.lifestyle);},[state.lifestyle,loading]);
  useEffect(()=>{controller.current?.setAdvice?.(adviceHeadline(state));},[state,loading]);
  // Reaching the broker counts as visiting the Exchange for the investor journey.
  useEffect(()=>{if(room==='exchange'&&spot==='broker'&&showDetails&&state.townProgress?.exchangeVisitedMonth===undefined)onAction?.('visit-exchange');},[room,spot,showDetails]);
  useEffect(()=>{if(room==='work'&&spot==='manager'&&showDetails&&state.townProgress?.workVisitedMonth===undefined)onAction?.('visit-work');},[room,spot,showDetails]);
  useEffect(()=>{if(room==='home'&&spot==='desk'&&showDetails&&state.townProgress?.homeVisitedMonth===undefined)onAction?.('visit-home');},[room,spot,showDetails]);
  useEffect(()=>{if(rosa&&showDetails&&state.townProgress?.rosaVisitedMonth===undefined)onAction?.('visit-rosa');},[rosa,showDetails]);
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
      setLastPurchase(MARKET_ITEMS.find(item => item.id === pending.itemId)?.name ?? tl('Investment','Inversión')); pendingPurchase.current = null;
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
    if(journey.completed&&journey.stage===3&&board&&showDetails){onNextMonth();return;}
    if(journey.completed&&journey.stage===3){openBoard();return;}
    if(journey.action==='work'){
      if(room==='work'){if(spot==='manager'){if(!showDetails)inspect();}else guide('manager',()=>{setShowDetails(false);controller.current?.walkToManager?.();});}
      else if(room==='city'&&spot==='work'&&!unavailable)guide('manager',()=>controller.current?.enterWork?.());else guide('manager',()=>{setShowDetails(false);controller.current?.walkToWork?.();});
      return;
    }
    if(journey.action==='home'){
      if(room==='home'){if(spot==='desk'){if(!showDetails)inspect();}else guide('desk',()=>{setShowDetails(false);controller.current?.walkToDesk?.();});}
      else if(room==='city'&&spot==='home'&&!unavailable)guide('desk',()=>controller.current?.enterHome?.());else guide('desk',()=>{setShowDetails(false);controller.current?.walkHome?.();});
      return;
    }
    if(journey.action==='rosa'){if(unavailable||(room==='city'&&spot==='rosa')){if(!(rosa&&showDetails))openRosa();}else guide('rosa',()=>{setShowDetails(false);controller.current?.walkToRosa?.();});return;}
    if(journey.action==='board'){if(board&&showDetails){onNextMonth();return;}if(unavailable||(room==='city'&&spot==='board')){openBoard();return;}guide('board',()=>{setShowDetails(false);controller.current?.walkToBoard?.();});return;}
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
  const guideText=journey.completed&&journey.stage===3?(board&&showDetails?tl('Close the month & judge','Cerrar el mes y evaluar'):tl('Check the notice board','Revisar el tablón')):guideLabel({journey,room,near,spot,showDetails,journal,serviceActive,hasCafe:!!state.cafe});
  const guideDisabled=serving||(disabled&&(journey.action==='review'||journey.action==='finish'))||(guideText===tl('Confirm my cash reserve','Confirmar mi reserva de efectivo')&&(disabled||state.cash<expenses))||(guideText===tl('Pay the $60 permit','Pagar el permiso de $60')&&(disabled||state.cash<CART_PERMIT));
  const chooseQuality=(mode:QualityMode)=>{setQualityMode(mode);saveQualityMode(mode);controller.current?.setQuality?.(mode);};
  const roomTitle=room==='bank'?tl('Community Bank','Banco Comunitario'):room==='cafe'?tl('Little Square Café','Café de la Plazuela'):room==='exchange'?tl('The Exchange','La Bolsa'):room==='property'?tl('Property & Co.','Propiedades & Cía.'):room==='home'?tl('Your place','Tu casa'):room==='work'?tl('Main Street Offices','Oficinas de Main Street'):tl('Freedom Square','Plaza de la Libertad');
  const chooseCamera=(mode:CameraPreset)=>{setCameraMode(mode);controller.current?.setCamera?.(mode);setCameraTools(false);};
  return <Modal isOpen onClose={onClose} ariaLabel="Freedom Square 3D neighbourhood" showCloseButton={false} overlayStyle={{ padding: 0 }} contentStyle={{ maxWidth: 1500, width: '100%' }} contentClassName={`town-modal${serviceActive&&room==='cafe'?' town-in-service':''}`}>
    <header className="town-header">
      <div><p className="town-eyebrow">{tl(tl('Your city · playable preview','Tu ciudad · versión jugable'),'Tu ciudad · versión jugable')}</p><h2>{roomTitle}</h2><p className="sr-only" role="status">{room==='city'?tl('On Freedom Square','En la Plaza de la Libertad'):`${tl('Inside','Dentro de')} ${roomTitle}`}</p></div>
      <div className="town-balance"><span>{tl(tl('Cash available','Efectivo disponible'),'Efectivo disponible')}</span><strong>{money(state.cash)}</strong></div>
      <button className="town-icon-button" onClick={onClose} aria-label={tl(tl('Back to dashboard','Volver al panel'),'Volver al panel')}><X size={22} /></button>
    </header>
    {state.pendingScenario && <div className="px-4 py-3 text-xs leading-5 text-amber-100 bg-amber-950" role="status">You can explore while your event waits. Finish that decision before buying. <button className="underline font-bold" onClick={onClose}>{tl(tl('Return to event','Volver al evento'),'Volver al evento')}</button></div>}
    {saveError && <div className="town-save-error" role="alert">{tl(tl('Progress could not be saved. ','No se pudo guardar el progreso. '),'No se pudo guardar el progreso. ')}<button onClick={onBackup}>{tl(tl('Download current progress','Descargar el progreso actual'),'Descargar el progreso actual')}</button></div>}
    <nav className="town-destinations" aria-label={tl(tl('Walk to a destination','Caminar a un destino'),'Caminar a un destino')}>
      {TOWN_PLACES.map(p => <button key={p.id} aria-label={`${tl('Walk to','Ir a')} ${placeName(p.id,p.name)}`} aria-pressed={destination === p.id} disabled={serving} onClick={() => move(p.id)} style={{ '--place-color': p.color } as React.CSSProperties}><span className="town-dot" />{p.sign === 'BUSINESSES' ? tl('Businesses','Negocios') : p.sign === 'PROPERTY' ? tl('Property','Propiedades') : p.sign === 'EXCHANGE' ? tl('Stocks','Bolsa') : tl('Bank','Banco')}{owned.includes(p.id) && <span aria-label={tl(tl('Has holdings','Tienes inversiones aquí'),'Tienes inversiones aquí')}> ✓</span>}</button>)}
      <button disabled={serving} onClick={visitCafe} aria-label={room==='city'&&near==='business'&&spot!=='cart'?tl('Enter café','Entrar al café'):tl('Visit café','Visitar el café')}>{room==='city'&&near==='business'&&spot!=='cart'?tl('Enter café →','Entrar al café →'):state.cafe?tl('Your café','Tu café'):tl('Café','Café')}</button>
      {cart&&!unavailable&&<button aria-label={tl(tl('Walk to your coffee cart','Ir a tu carrito de café'),'Ir a tu carrito de café')} disabled={serving} onClick={visitCart} style={{'--place-color':'#eac778'} as React.CSSProperties}><span className="town-dot"/>{tl(tl('Your cart','Tu carrito'),'Tu carrito')}</button>}
      {!unavailable&&<button aria-label={tl(tl('Walk home','Ir a casa'),'Ir a casa')} disabled={serving} onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkHome?.();}} style={{'--place-color':'#8fb3a0'} as React.CSSProperties}><span className="town-dot"/>{tl(tl('Home','Casa'),'Casa')}</button>}
      {!unavailable&&<button aria-label={tl(tl('Walk to work','Ir al trabajo'),'Ir al trabajo')} disabled={serving} onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToWork?.();}} style={{'--place-color':'#9fb6d8'} as React.CSSProperties}><span className="town-dot"/>{tl(tl('Work','Trabajo'),'Trabajo')}</button>}
      {!unavailable&&<button aria-label={tl(tl('Talk to Rosa on the bench','Hablar con Rosa en el banco'),'Hablar con Rosa en el banco')} disabled={serving} onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToRosa?.();}} style={{'--place-color':'#c99ab8'} as React.CSSProperties}><span className="town-dot"/>{tl(tl('Rosa','Rosa'),tl('Rosa','Rosa'))}</button>}
      <button aria-label={tl('Notice board: this month\'s challenges','Tablón de anuncios: los retos de este mes')} disabled={serving} onClick={()=>{cancelGuide();if(!unavailable&&room==='city')controller.current?.walkToBoard?.();openBoard();}} style={{'--place-color':'#c9b898'} as React.CSSProperties}><span className="town-dot"/>{tl('Board','Tablón')} {challengesDone}/3</button>
    </nav>
    {room==='bank'&&<div className="town-interior-nav"><span>{tl(tl('Inside the bank','Dentro del banco'),'Dentro del banco')}</span><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToTeller?.();}}>{tl(tl('Walk to teller','Ir al cajero'),'Ir al cajero')}</button><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToExit?.();}}>{tl(tl('Walk to exit','Ir a la salida'),'Ir a la salida')}</button><button onClick={()=>{cancelGuide();controller.current?.leaveBank?.();}}>{tl(tl('Return to square ↗','Volver a la plaza ↗'),'Volver a la plaza ↗')}</button></div>}
    {room==='work'&&<div className="town-interior-nav"><span>{tl(tl('Your office','Tu oficina'),'Tu oficina')}</span><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToManager?.();}}>{tl(tl('Walk to your manager','Ir con tu jefe'),'Ir con tu jefe')}</button><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToExit?.();}}>{tl(tl('Walk to exit','Ir a la salida'),'Ir a la salida')}</button><button onClick={()=>{cancelGuide();controller.current?.leaveWork?.();}}>{tl(tl('Back to the square','Volver a la plaza'),'Volver a la plaza')}</button></div>}
    {room==='home'&&<div className="town-interior-nav"><span>{tl(tl('Your place','Tu casa'),'Tu casa')}</span><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToDesk?.();}}>{tl(tl('Walk to desk','Ir al escritorio'),'Ir al escritorio')}</button><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToExit?.();}}>{tl(tl('Walk to exit','Ir a la salida'),'Ir a la salida')}</button><button onClick={()=>{cancelGuide();controller.current?.leaveHome?.();}}>{tl(tl('Back to the square ↗','Volver a la plaza ↗'),'Volver a la plaza ↗')}</button></div>}
    {room==='property'&&<div className="town-interior-nav"><span>{tl(tl('Estate office','Inmobiliaria'),'Inmobiliaria')}</span><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToAgent?.();}}>{tl(tl('Walk to agent','Ir con el agente'),'Ir con el agente')}</button><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToExit?.();}}>{tl(tl('Walk to exit','Ir a la salida'),'Ir a la salida')}</button><button onClick={()=>{cancelGuide();controller.current?.leaveProperty?.();}}>{tl(tl('Return to square ↗','Volver a la plaza ↗'),'Volver a la plaza ↗')}</button></div>}
    {room==='exchange'&&<div className="town-interior-nav"><span>{tl(tl('Trading floor','Parqué'),'Parqué')}</span><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToBroker?.();}}>{tl(tl('Walk to broker','Ir con el corredor'),'Ir con el corredor')}</button><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToExit?.();}}>{tl(tl('Walk to exit','Ir a la salida'),'Ir a la salida')}</button><button onClick={()=>{cancelGuide();controller.current?.leaveExchange?.();}}>{tl(tl('Return to square ↗','Volver a la plaza ↗'),'Volver a la plaza ↗')}</button></div>}
    {room==='cafe'&&<div className="town-interior-nav"><span>{state.cafe?tl('Your café','Tu café'):tl('Café viewing','Visita al café')}</span><button onClick={()=>{cancelGuide();setShowDetails(false);controller.current?.walkToCafeCounter?.();}}>{tl(tl('Walk to counter','Ir al mostrador'),'Ir al mostrador')}</button><button onClick={()=>{setCafePlay(true);setJournal(false);setShowDetails(true);}}>{tl(tl('Play a shift','Jugar un turno'),'Jugar un turno')}</button><button onClick={()=>{setCafePlay(false);setJournal(false);setShowDetails(true);}}>{tl(tl('Manage café','Administrar el café'),'Administrar el café')}</button><button onClick={()=>{cancelGuide();if(unavailable){setRoom('city');setShowDetails(false);}else controller.current?.leaveCafe?.();}}>{tl(tl('Return to square ↗','Volver a la plaza ↗'),'Volver a la plaza ↗')}</button></div>}
    <div className="town-journey-strip">
      <button className="town-journey-summary" disabled={serving} onClick={()=>{setJournal(true);setShowDetails(true);}}><span>{journey.completed&&journey.stage===3?tl('THIS MONTH','ESTE MES')+' · '+challengesDone+'/3 '+tl('CHALLENGES','RETOS'):journey.completed?tl('BADGES EARNED','INSIGNIAS GANADAS'):journey.stage===3?tl('NEIGHBOURHOOD TOUR','RECORRIDO DEL BARRIO')+' · '+(journey.step+1)+'/5':journey.stage===2?tl('INVESTOR JOURNEY','RECORRIDO DEL INVERSOR')+' · '+(journey.step+1)+'/4':tl('YOUR FIRST BUSINESS','TU PRIMER NEGOCIO')+' · '+(journey.step+1)+'/5'}</span><strong>{journey.completed&&journey.stage===3?monthlyChallenges(state).map(c=>c.title).join(' · '):journey.title}</strong><small>{journey.completed?tl('Journey & monthly recap →','Recorrido y resumen mensual →'):tl('Steps & monthly recap →','Pasos y resumen mensual →')}</small></button>
      <button className="town-guide-next" disabled={guideDisabled} onClick={followJourney}>{guideText} →</button>
      <button className="town-sound" aria-pressed={sound} onClick={()=>{const enabled=!sound;controller.current?.setSound?.(enabled);setSound(enabled);}}>{tl('Sound','Sonido')} {sound?tl('on','sí'):tl('off','no')}</button>
    </div>
    <div className={`town-body${showDetails ? ' town-details-open' : ''}${serving?' town-serving-active':''}`}>
      <section className="town-viewport" aria-label={tl(tl('Neighbourhood','Vecindario'),'Vecindario')}>
        <div className="town-canvas" ref={host} />
        {serviceActive&&service&&room==='cafe'&&!showDetails&&!unavailable&&<CafeServiceHUD shift={service} practice={!!practice} point={playerPoint} paused={servicePaused||(!practice&&disabled)} onAct={actInShift} onPause={()=>setServicePaused(p=>!p)} onFinish={()=>dispatchService({type:'finish'})}/>}
        {loading && <div className="town-loading" role="status"><span className="town-loading-orbit" /><strong>{tl(tl('Welcome to your neighbourhood','Bienvenido a tu vecindario'),'Bienvenido a tu vecindario')}</strong><span>{progress>0&&progress<1?`${tl('Downloading the city…','Descargando la ciudad…')} ${Math.round(progress*100)}%`:progress>=1?tl('Building the square…','Construyendo la plaza…'):tl('Opening the city…','Abriendo la ciudad…')}</span></div>}
        {unavailable ? <div className="town-fallback"><Building2 size={36} /><h3>{tl(tl('Explore with the destination buttons','Explora con los botones de destino'),'Explora con los botones de destino')}</h3><p>{tl(tl('This browser cannot display the 3D view. Your purchases and progress still work.','Este navegador no puede mostrar la vista 3D. Tus compras y tu progreso siguen funcionando.'),'Este navegador no puede mostrar la vista 3D. Tus compras y tu progreso siguen funcionando.')}</p></div> : <>
          <div className="town-world-caption"><span className="town-live-dot" /> {tl('MONTH','MES')} {state.month} · {seasonName(seasonFor(state.month))} · {cityCaption(state,room).day}{timeOfDay&&room==='city'?` · ${timeOfDayName(timeOfDay)}`:''}<span>{cityCaption(state,room).note}</span></div>
          <button ref={cameraButton} className="town-camera-menu-button" aria-expanded={cameraTools} aria-haspopup="true" onClick={()=>setCameraTools(!cameraTools)}>{tl(tl('Camera','Cámara'),'Cámara')}</button>
          <button className="town-reset-camera" aria-label={tl(tl('Reset camera','Reiniciar cámara'),'Reiniciar cámara')} title={tl(tl('Reset camera (R)','Reiniciar cámara (R)'),'Reiniciar cámara (R)')} onClick={() => controller.current?.resetView()}><RotateCcw size={18} /></button>
          {cameraTools&&<div ref={menuBox} className="town-camera-menu" role="group" aria-label={tl(tl('Camera controls','Controles de cámara'),'Controles de cámara')}><strong>{tl(tl('Choose your view','Elige tu vista'),'Elige tu vista')}</strong><button aria-pressed={cameraMode==='follow'} onClick={()=>chooseCamera('follow')}>{tl(tl('Follow character','Seguir al personaje'),'Seguir al personaje')}</button><button aria-pressed={cameraMode==='overview'} onClick={()=>chooseCamera('overview')}>{tl(tl('See neighbourhood','Ver el vecindario'),'Ver el vecindario')}</button><div><button aria-label={tl(tl('Turn camera left','Girar cámara a la izquierda'),'Girar cámara a la izquierda')} onClick={()=>controller.current?.orbit?.(-.3)}>{tl(tl('↶ Left','↶ Izquierda'),'↶ Izquierda')}</button><button aria-label={tl(tl('Turn camera right','Girar cámara a la derecha'),'Girar cámara a la derecha')} onClick={()=>controller.current?.orbit?.(.3)}>{tl(tl('Right ↷','Derecha ↷'),'Derecha ↷')}</button></div><div><button onClick={()=>controller.current?.zoom?.(-1)}>{tl(tl('Zoom in','Acercar'),'Acercar')}</button><button onClick={()=>controller.current?.zoom?.(1)}>{tl(tl('Zoom out','Alejar'),'Alejar')}</button></div><p>{tl(tl('Tap the ground to walk. Drag to adjust the view. Reset restores this preset.','Toca el suelo para caminar. Arrastra para ajustar la vista. Reiniciar restaura esta vista.'),'Toca el suelo para caminar. Arrastra para ajustar la vista. Reiniciar restaura esta vista.')}</p><strong>{tl(tl('Graphics','Gráficos'),'Gráficos')}</strong><div className="town-quality-row" role="group" aria-label={tl(tl('Graphics quality','Calidad gráfica'),'Calidad gráfica')}>{QUALITY_MODES.map(mode=><button key={mode} aria-pressed={qualityMode===mode} onClick={()=>chooseQuality(mode)}>{mode==='auto'?'Auto':qualityName(mode)}</button>)}</div><p>{qualityMode==='auto'?`${tl('Auto follows your frame rate','Auto sigue tu tasa de cuadros')}${qualityLevel?` · ${tl('now','ahora')} ${qualityName(qualityLevel)}`:''}.`:qualityDetail(qualityMode)}</p><button onClick={()=>setCameraTools(false)}>{tl(tl('Done','Listo'),'Listo')}</button></div>}
          {qualityNote&&<div className="town-quality-note" role="status">{qualityNote}</div>}
          {celebrating&&<div className="town-earned" role="status"><span>✦</span><strong>{celebrating}</strong><p>{celebrating==='Patient investor'?tl('You owned a slice of the market and held it through the noise.','Fuiste dueño de una parte del mercado y la mantuviste a pesar del ruido.'):tl('You opened a business and learned what it earned.','Abriste un negocio y aprendiste lo que ganó.')}</p></div>}
          {serving&&<div className="town-serving" role="status">{tl(tl('Serving your customers…','Atendiendo a tus clientes…'),'Atendiendo a tus clientes…')}<span>{tl(tl('Your shift receipt is ready in a moment.','El recibo de tu turno estará listo en un momento.'),'El recibo de tu turno estará listo en un momento.')}</span></div>}
          <div className="town-location" role="status">{room==='work'?<button onClick={inspect}><strong>{spot==='exit'?tl('Back to the square','Volver a la plaza'):spot==='manager'?tl('Your manager','Tu jefe'):tl('Main Street Offices','Oficinas de Main Street')}</strong><span>{spot==='exit'?tl('Leave →','Salir →'):spot==='manager'?tl('Pay, promotion & job security →','Sueldo, ascenso y seguridad laboral →'):tl('Walk to your manager.','Camina hasta tu jefe.')}</span></button>:room==='city'&&spot==='work'?<button onClick={inspect}><strong>{tl(tl('Main Street Offices','Oficinas de Main Street'),'Oficinas de Main Street')}</strong><span>{tl(tl('Go to work →','Ir a trabajar →'),'Ir a trabajar →')}</span></button>:room==='home'?<button onClick={inspect}><strong>{spot==='exit'?tl('Back to the square','Volver a la plaza'):spot==='desk'?tl('Your desk','Tu escritorio'):tl('Home sweet home','Hogar, dulce hogar')}</strong><span>{spot==='exit'?tl('Leave →','Salir →'):tl('Mail, bills & your place →','Correo, facturas y tu casa →')}</span></button>:room==='city'&&spot==='home'?<button onClick={inspect}><strong>12 Square St</strong><span>{tl(tl('Enter your place →','Entrar a tu casa →'),'Entrar a tu casa →')}</span></button>:room==='city'&&spot==='rosa'?<button onClick={inspect}><strong>{tl(tl('Rosa, on the bench','Rosa, en el banco'),'Rosa, en el banco')}</strong><span>{tl(tl('Talk about your month →','Hablar de tu mes →'),'Hablar de tu mes →')}</span></button>:room==='city'&&spot==='board'?<button onClick={inspect}><strong>{tl(tl('Community notice board','Tablón de anuncios del barrio'),'Tablón de anuncios del barrio')}</strong><span>{tl('This month\'s challenges →','Los retos de este mes →')}</span></button>:room==='cafe'?<button onClick={inspect}><strong>{spot==='exit'?tl('Back to the square','Volver a la plaza'):spot==='cafe-counter'?tl('Your café counter','El mostrador de tu café'):tl('Welcome to Little Square Café','Bienvenido al Café de la Plazuela')}</strong><span>{spot==='exit'?tl('Leave café →','Salir del café →'):tl('Plan, furnish & review →','Planear, amueblar y revisar →')}</span></button>:(room==='bank'||room==='exchange'||room==='property')&&spot==='exit'?<button onClick={inspect}><strong>{tl(tl('Back to the square','Volver a la plaza'),'Volver a la plaza')}</strong><span>{tl('Leave','Salir de')} {room==='bank'?tl('bank','el banco'):room==='property'?tl('the office','la oficina'):tl('the Exchange','la Bolsa')} →</span></button>:room==='property'?(spot==='agent'?<button onClick={inspect}><strong>{tl(tl('Your agent','Tu agente'),'Tu agente')}</strong><span>{tl(tl('Listings, rents and mortgages →','Ofertas, rentas e hipotecas →'),'Ofertas, rentas e hipotecas →')}</span></button>:<><strong>{tl(tl('Welcome to Property & Co.','Bienvenido a Propiedades & Cía.'),'Bienvenido a Propiedades & Cía.')}</strong><span>{tl('Walk to the agent\'s desk.','Camina hasta el escritorio del agente.')}</span></>):room==='exchange'?(spot==='broker'?<button onClick={inspect}><strong>{tl(tl('Your broker','Tu corredor'),'Tu corredor')}</strong><span>{tl(tl('Talk about the market →','Hablar del mercado →'),'Hablar del mercado →')}</span></button>:<><strong>{tl(tl('Welcome to the trading floor.','Bienvenido al parqué.'),'Bienvenido al parqué.')}</strong><span>{tl(tl('Walk to the broker to talk.','Camina hasta el corredor para hablar.'),'Camina hasta el corredor para hablar.')}</span></>):room==='bank'&&!place?<><strong>{tl(tl('Welcome inside.','Bienvenido.'),'Bienvenido.')}</strong><span>{tl(tl('Walk to the teller to talk.','Camina hasta el cajero para hablar.'),'Camina hasta el cajero para hablar.')}</span></>:place ? <button onClick={inspect}><strong>{spot==='cart'?tl('Your coffee cart','Tu carrito de café'):room==='bank'?tl('Your bank teller','Tu cajero del banco'):placeName(place.id,place.name)}</strong><span>{room==='bank'?tl('Talk to teller →','Hablar con el cajero →'):place.id==='bank'?tl('Enter bank →','Entrar al banco →'):place.id==='exchange'&&!unavailable?tl('Enter the Exchange →','Entrar a la Bolsa →'):place.id==='property'&&!unavailable?tl('Enter the office →','Entrar a la oficina →'):spot==='cart'?tl('Run a shift & manage cart →','Trabajar un turno y administrar el carrito →'):tl('View opportunities →','Ver oportunidades →')}</span></button> : <><strong>{destination ? `${tl('Next stop','Siguiente parada')}: ${placeName(destination, TOWN_PLACES.find(p => p.id === destination)?.name ?? '')}` : tl('Make yourself at home.','Siéntete como en casa.')}</strong><span>{tl(tl('Tap a destination or the pavement to walk. Your next step is above.','Toca un destino o la acera para caminar. Tu siguiente paso está arriba.'),'Toca un destino o la acera para caminar. Tu siguiente paso está arriba.')}</span></>}</div>
          <div className="town-joystick" role="group" aria-label={tl(tl('Movement joystick. Drag to walk, or use W A S D or arrow keys.','Joystick de movimiento. Arrastra para caminar o usa W A S D o las flechas.'),'Joystick de movimiento. Arrastra para caminar o usa W A S D o las flechas.')} tabIndex={0}
            onPointerDown={event=>{event.preventDefault();cancelGuide();stickPointer.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);updateStick(event);}}
            onPointerMove={updateStick} onPointerUp={releaseStick} onPointerCancel={releaseStick} onLostPointerCapture={releaseStick} onBlur={releaseStick}>
            <div className="town-joystick-cross"/><span className="town-joystick-thumb" style={{transform:`translate(${stick.x*30}px, ${stick.z*30}px)`}}/><span className="town-joystick-label">{tl(tl('MOVE','MOVER'),'MOVER')}</span>
          </div>
          <div className="town-camera-help"><span>{tl(tl('Drag to look','Arrastra para mirar'),'Arrastra para mirar')}</span><span>{tl(tl('Tap to walk','Toca para caminar'),'Toca para caminar')}</span><span>{tl(tl('WASD · Shift to jog','WASD · Shift para trotar'),'WASD · Shift para trotar')}</span></div>
        </>}
      </section>
      <aside className="town-details" ref={details} tabIndex={-1} aria-label={tl(tl('Location opportunities','Oportunidades del lugar'),'Oportunidades del lugar')} style={{display:showDetails?'block':'none'}}>
        <button className="town-close-details" aria-label={tl(tl('Close opportunities','Cerrar oportunidades'),'Cerrar oportunidades')} onClick={()=>setShowDetails(false)}><X size={18}/></button>
        {board&&room==='city' ? <NoticeBoardPanel state={state} disabled={disabled} onNextMonth={onNextMonth}/> : rosa&&room==='city' ? <AdvisorPanel state={state} onGo={goTo}/> : room==='work' ? <WorkPanel state={state} disabled={disabled} onPromote={onPromote} onOpenLife={onOpenLife} onAskRaise={onAskRaise} onSwitchCareer={onSwitchCareer} onJobSearch={onJobSearch} onAcceptPlan={onAcceptPlan} workActions={workActions} onMonthlyAction={onMonthlyAction}/> : room==='home' ? <HomePanel state={state} disabled={disabled} onChangeLifestyle={onChangeLifestyle} onGo={goTo}/> : journal ? <>
          <p className="town-eyebrow">{journey.stage===3?tl('NEIGHBOURHOOD TOUR','RECORRIDO DEL BARRIO'):journey.stage===2?tl('INVESTOR JOURNEY','RECORRIDO DEL INVERSOR'):tl('YOUR FIRST BUSINESS','TU PRIMER NEGOCIO')}</p><h3>{journey.title}</h3><p className="town-intro">{journey.detail}</p>
          <ol className="town-journey-steps">{journey.milestones.map((step,index)=><li key={step.title} aria-current={!journey.completed&&index===journey.step?'step':undefined}><span>{step.done?'✓':index+1}</span><strong>{step.title}</strong></li>)}</ol>
          {journey.completed?<><div className="town-badge"><span>✦</span><strong>Neighbourhood entrepreneur</strong><p>Earned in month {state.townProgress?.journeyCompletedMonth}. A milestone you earned through decisions—no cash bonus.</p></div><div className="town-badge"><span>✦</span><strong>Patient investor</strong><p>Earned in month {state.townProgress?.investorCompletedMonth}. You held through the noise.</p></div><div className="town-badge"><span>✦</span><strong>Settled in</strong><p>Earned in month {state.townProgress?.tourCompletedMonth}. You know where the money comes from, where it goes and who to ask.</p></div></>:journey.action==='finish'?<button className="town-primary" disabled={disabled||!onFinishJourney} onClick={onFinishJourney}>{journey.stage===3?tl('Complete my neighbourhood tour ✦','Completar mi recorrido del barrio ✦'):journey.stage===2?tl('Complete my investor journey ✦','Completar mi recorrido del inversor ✦'):tl('Complete my opening journey ✦','Completar mi recorrido inicial ✦')}</button>:<>{journey.stage>=2&&<div className="town-badge"><span>✦</span><strong>Neighbourhood entrepreneur</strong><p>Earned in month {state.townProgress?.journeyCompletedMonth}.</p></div>}{journey.stage===3&&<div className="town-badge"><span>✦</span><strong>Patient investor</strong><p>Earned in month {state.townProgress?.investorCompletedMonth}.</p></div>}<button className="town-primary" disabled={guideDisabled} onClick={followJourney}>{guideText} →</button></>}
          {report?.month ? <section className="town-recap"><h4>{tl('Month','Mes')} {report.month}: {tl('what changed','qué cambió')}</h4>
            <dl><div><dt>{tl(tl('Cash at month start','Efectivo al inicio del mes'),'Efectivo al inicio del mes')}</dt><dd>{money(report.cashBefore??0)}</dd></div><div><dt>{tl(tl('Income received','Ingresos recibidos'),'Ingresos recibidos')}</dt><dd>+{money(report.income)}</dd></div><div><dt>{tl(tl('Of that: investments & passive work','De eso: inversiones e ingresos pasivos'),'De eso: inversiones e ingresos pasivos')}</dt><dd>{money(report.investmentIncome??0)}</dd></div>{report.assetPayments?.map((payment,index)=><div key={index}><dt>↳ {payment.name}</dt><dd>{money(payment.amount)}</dd></div>)}<div><dt>{tl(tl('Living costs & repayments','Gastos de vida y pagos de deuda'),'Gastos de vida y pagos de deuda')}</dt><dd>−{money(report.expenses-(report.businessMaintenance??0))}</dd></div><div><dt>{tl(tl('Extra business repairs','Reparaciones extra del negocio'),'Reparaciones extra del negocio')}</dt><dd>−{money(report.businessMaintenance??0)}</dd></div><div><dt>{tl(tl('Other cash movements*','Otros movimientos de efectivo*'),'Otros movimientos de efectivo*')}</dt><dd>{money((report.cashAfter??0)-(report.cashBefore??0)-report.income+report.expenses)}</dd></div><div><dt>{tl(tl('Later choices this month','Decisiones posteriores este mes'),'Decisiones posteriores este mes')}</dt><dd>{money(state.cash-(report.cashAfter??state.cash))}</dd></div><div><dt>{tl(tl('Cash now','Efectivo ahora'),'Efectivo ahora')}</dt><dd>{money(state.cash)}</dd></div><div><dt>{tl(tl('Investment price changes','Cambios de precio de inversiones'),'Cambios de precio de inversiones')}</dt><dd>{money(report.marketChange??0)}</dd></div></dl>
            <p>{tl(tl('Individual lines are rounded; totals may differ by $1. Price changes affect wealth, not cash received. *Other cash movements include automatic purchases, taxes and debt adjustments.','Las líneas se redondean; los totales pueden variar $1. Los cambios de precio afectan el patrimonio, no el efectivo recibido. *Otros movimientos incluyen compras automáticas, impuestos y ajustes de deuda.'),'Las líneas se redondean; los totales pueden variar $1. Los cambios de precio afectan el patrimonio, no el efectivo recibido. *Otros movimientos incluyen compras automáticas, impuestos y ajustes de deuda.')}</p>
            {report.cafe&&<CafeLedger receipt={report.cafe}/>}
            <h4>{tl(tl('Your recent choices','Tus decisiones recientes'),'Tus decisiones recientes')}</h4>{state.events.filter(e=>e.type==='DECISION').slice(0,3).map(e=><p key={e.id}><strong>{e.title}</strong><br/>{e.description}</p>)}
          </section> : <div className="town-lesson"><strong>{tl(tl('See cause and effect.','Ve causa y efecto.'),'Ve causa y efecto.')}</strong><p>{tl(tl('After advancing a month, this page separates income, expenses and changes in investment prices.','Después de avanzar un mes, esta página separa ingresos, gastos y cambios de precio de las inversiones.'),'Después de avanzar un mes, esta página separa ingresos, gastos y cambios de precio de las inversiones.')}</p></div>}
        </> : room==='cafe'?<>
          <div className="town-tabs"><button aria-pressed={cafePlay} onClick={()=>setCafePlay(true)}>{tl(tl('Play a shift','Jugar un turno'),'Jugar un turno')}</button><button aria-pressed={!cafePlay} disabled={serviceActive} onClick={()=>setCafePlay(false)}>{tl(tl('Manage café','Administrar el café'),'Administrar el café')}</button></div>
          {cafePlay||serviceActive?<CafeServicePanel state={state} shift={service} practice={!!practice} disabled={disabled||unavailable||loading} unavailable={unavailable||loading} onPractice={plan=>beginShift(plan,true)} onStart={plan=>beginShift(plan,false)} onResume={()=>{setServicePaused(false);setShowDetails(false);}} onExitPractice={()=>setPractice(undefined)}/>:<CafePanel state={state} disabled={disabled} onAction={onCafeAction} onNextMonth={onNextMonth}/>}
        </> : room==='property'&&spot==='agent'?<PropertyPanel state={state} disabled={disabled} onBuy={(item,quantity)=>{pendingPurchase.current={itemId:item.id,quantity:quantityOf(item.id)};setLastPurchase(null);onBuy(item,quantity);}} onMortgage={onMortgage} onOpenMoney={()=>onOpenMoney('invest','property')}/> : room==='exchange'&&spot==='broker'?<ExchangePanel state={state} disabled={disabled} onBuy={(item,quantity)=>{pendingPurchase.current={itemId:item.id,quantity:quantityOf(item.id)};setLastPurchase(null);onBuy(item,quantity);}} onSell={onSell} onOpenMoney={()=>onOpenMoney('invest','exchange')}/> : room==='bank'&&spot==='teller'?<TellerPanel state={state} disabled={disabled} onTransfer={onTransfer} loans={loans} onLoans={()=>onOpenMoney('bank','bank')} onReserve={()=>onAction?.('reserve')} onBusiness={()=>{setShowDetails(false);if(cart)visitCart();else move('business');}}/> : place ? <>
          {spot==='cart'&&state.townProgress?.permitMonth!==undefined&&<CartShiftPanel state={state} disabled={disabled||serving} onRun={onRunShift?plan=>{shiftRequested.current=true;onRunShift(plan);}:undefined}/>}
          <p className="town-eyebrow">{tl('YOU ARE AT','ESTÁS EN')} · {place.sign}</p><h3>{placeName(place.id,place.name)}</h3>
          <div className="town-lesson"><strong>{placeQuestion(place.id,place.question)}</strong><p>{placeLesson(place.id,place.lesson)}</p></div>
          {lastPurchase && <p className="town-receipt" role="status">✓ {lastPurchase} added to your portfolio. Your cash balance has updated.</p>}
          {place.id==='bank'&&!state.townProgress?.reserveConfirmed&&<div className="town-lesson"><strong>{tl('Protect','Protege')} {money(expenses)} {tl('for one month of expenses','para un mes de gastos')}</strong><p>{tl('You have','Tienes')} {money(state.cash)} {tl('in cash. Confirming this plan moves no money.','en efectivo. Confirmar este plan no mueve dinero.')}</p><button className="town-primary" disabled={disabled||state.cash<expenses} onClick={()=>onAction?.('reserve')}>{tl(tl('Confirm my cash reserve','Confirmar mi reserva de efectivo'),'Confirmar mi reserva de efectivo')}</button></div>}
          {place.id==='business'&&spot!=='cart'&&(journey.completed||journey.step>=3)&&<button className="town-primary" onClick={visitCafe}>{state.cafe?tl('Enter your café','Entrar a tu café'):tl('View the café space','Ver el local del café')} →</button>}
          {place.id==='business'&&cart&&!unavailable&&spot!=='cart'&&<button className="town-primary" onClick={visitCart}>{tl(tl('Visit your cart in the square →','Visitar tu carrito en la plaza →'),'Visitar tu carrito en la plaza →')}</button>}
          {place.id==='business'&&cart&&<div className="town-lesson"><strong>{state.townProgress?.permitMonth===undefined?tl('Your cart needs its trading permit','Tu carrito necesita su permiso comercial'):cart.opsUpgrade?tl('Your covered cart is open','Tu carrito con toldo está abierto'):tl('Your coffee cart is open','Tu carrito de café está abierto')}</strong><p>{state.townProgress?.permitMonth===undefined?tl('Pay the one-time $60 permit to start earning. Until then, the cart earns $0.','Paga el permiso único de $60 para empezar a ganar. Hasta entonces, el carrito gana $0.'):cart.opsUpgrade?tl('Weather cover reduces income swings and maintenance odds. Profits can still fall.','El toldo reduce los vaivenes de ingresos y la probabilidad de reparaciones. Las ganancias aún pueden bajar.'):tl('Weather cover and storage cost $350. They reduce income swings and maintenance odds, rather than promising extra income.','El toldo y el almacenamiento cuestan $350. Reducen los vaivenes y las reparaciones, sin prometer ingresos extra.')}</p>{state.townProgress?.permitMonth===undefined?<button className="town-primary" disabled={disabled||state.cash<CART_PERMIT} onClick={()=>onAction?.('permit')}>{tl(tl('Pay permit $60','Pagar permiso $60'),'Pagar permiso $60')}</button>:!cart.opsUpgrade&&<button className="town-primary" disabled={disabled||state.cash<CART_UPGRADE} onClick={()=>onAction?.('upgrade')}>{tl(tl('Add weather cover $350','Agregar toldo $350'),'Agregar toldo $350')}</button>}</div>}
          <div className="town-offers">
            {(spot==='cart'?[]:place.items).map(id => {
              const item = MARKET_ITEMS.find(i => i.id === id)!;
              const price = townPrice(item, state); const monthly=price*incomeYield(item)/12; const upkeep=item.type===AssetType.REAL_ESTATE?price*.01/12:0; const after = state.cash - price; const quantity = quantityOf(id);
              return <article key={id} className="town-offer">
                <div className="town-offer-heading"><h4>{item.name}</h4>{quantity > 0 && <span>{quantity} {tl('held','en cartera')}</span>}</div>
                <p><strong>{tl('Price','Precio')} {money(price)}</strong> · {tl('Risk','Riesgo')}: {item.risk.replace(/_/g,' ').toLowerCase()}</p>
                <p>{incomeLabel(item.type, id)} assumption: <strong>{(incomeYield(item) * 100).toFixed(1)}%/yr</strong>. Price changes are separate.</p>
                <p>Typical monthly {incomeLabel(item.type,id).toLowerCase()}: <strong>{money(monthly)}</strong>{item.type===AssetType.REAL_ESTATE?` − ${money(upkeep)} routine upkeep = ${money(monthly-upkeep)} before loans, vacancies and tax.`:item.type===AssetType.BUSINESS?' after routine operating costs; repairs and tax are extra.':' before tax. Prices and payments can change.'}</p>
                {id==='coffee_cart'&&<p>{tl(tl('First cart needs a $60 permit. No income until licensed. Routine staffing and supplies are included; a quiet month can reduce profit.','El primer carrito necesita un permiso de $60. Sin ingresos hasta tener licencia. Personal y suministros de rutina incluidos; un mes flojo puede reducir la ganancia.'),'El primer carrito necesita un permiso de $60. Sin ingresos hasta tener licencia. Personal y suministros de rutina incluidos; un mes flojo puede reducir la ganancia.')}</p>}
                {item.type===AssetType.BUSINESS&&<p>A 30% quieter month would mean about {money(monthly*.7)} before extra repairs and tax. This is an example, not a worst-case limit.</p>}
                <p className="town-after">{tl('Cash after','Efectivo después')}: <strong>{money(after)}</strong>{after >= 0 && after < expenses && <span>{tl(tl('Below one month of expenses.','Por debajo de un mes de gastos.'),'Por debajo de un mes de gastos.')}</span>}</p>
                <button disabled={disabled || after < 0} onClick={() => { pendingPurchase.current = { itemId: id, quantity }; setLastPurchase(null); onBuy(item); }}>
                  {after < 0 ? `${tl('Need','Faltan')} ${money(-after)} ${tl('more','más')}` : `${item.type === AssetType.SAVINGS ? tl('Deposit','Depositar') : tl('Buy','Comprar')} ${money(price)}`}
                </button>
              </article>;
            })}
          </div>
          <button className="town-text-button" onClick={() => onOpenMoney(place.id === 'bank' ? 'bank' : 'invest',place.id)}>{place.id === 'bank' ? tl('Manage loans and repayments','Administrar préstamos y pagos') : place.id === 'property' ? tl('Compare properties and mortgages','Comparar propiedades e hipotecas') : tl('Explore all investments','Explorar todas las inversiones')} →</button>
        </> : <>
          <div className="town-welcome-icon"><Footprints size={30} /></div><p className="town-eyebrow">{tl(tl('A NEW WAY TO BUILD','UNA NUEVA FORMA DE CONSTRUIR'),'UNA NUEVA FORMA DE CONSTRUIR')}</p><h3>Your decisions.<br />A place to live them.</h3>
          <p className="town-intro">{tl(tl('Walk to a building to discover what you can own, what it can earn, and what could go wrong.','Camina hasta un edificio para descubrir qué puedes poseer, cuánto puede ganar y qué podría salir mal.'),'Camina hasta un edificio para descubrir qué puedes poseer, cuánto puede ganar y qué podría salir mal.')}</p>
          <div className="town-lesson"><strong>{tl(tl('Start with your safety net.','Empieza con tu red de seguridad.'),'Empieza con tu red de seguridad.')}</strong><p>{tl(tl('The bank is a good first stop. Decide how much to keep accessible before buying riskier assets.','El banco es una buena primera parada. Decide cuánto mantener a mano antes de comprar activos más riesgosos.'),'El banco es una buena primera parada. Decide cuánto mantener a mano antes de comprar activos más riesgosos.')}</p></div>
          <button className="town-primary" onClick={() => move('bank')}>Walk to the bank <ArrowRight size={17} /></button>
          <p className="town-controls-help">{tl(tl('W A S D or arrows to walk, Shift to jog. Drag the scene to look around, scroll or pinch to zoom. On touch screens, use the joystick or tap the pavement.','W A S D o flechas para caminar, Shift para trotar. Arrastra la escena para mirar, desplaza o pellizca para acercar. En pantallas táctiles, usa el joystick o toca la acera.'),'W A S D o flechas para caminar, Shift para trotar. Arrastra la escena para mirar, desplaza o pellizca para acercar. En pantallas táctiles, usa el joystick o toca la acera.')}</p>
        </>}
        <footer className="town-detail-footer">{lastPurchase&&(room==='exchange'||room==='property')&&<p className="town-receipt" role="status">✓ {lastPurchase} added to your portfolio. Your cash balance has updated.</p>}<button className="town-text-button" onClick={() => onOpenMoney('portfolio')}>{tl(tl('View my portfolio →','Ver mi cartera →'),'Ver mi cartera →')}</button>{room!=='cafe'&&<button className="town-text-button" onClick={onNextMonth} disabled={disabled}>{tl(tl('Review next month →','Revisar el próximo mes →'),'Revisar el próximo mes →')}</button>}<p>{tl(tl('Same game, same balance. Fictional prices and rates for learning. Enter the bank or café. Your café’s net profit already includes rent, wages and supplies.','Mismo juego, mismo saldo. Precios y tasas ficticios para aprender. Entra al banco o al café. La ganancia neta de tu café ya incluye renta, sueldos y suministros.'),'Mismo juego, mismo saldo. Precios y tasas ficticios para aprender. Entra al banco o al café. La ganancia neta de tu café ya incluye renta, sueldos y suministros.')}</p></footer>
      </aside>
    </div>
  </Modal>;
}
