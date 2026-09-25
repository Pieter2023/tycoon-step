import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createTownScene, type TownController, type TownView } from '../components/town/createTownScene';
import './cafe-preview.css';

const views: Record<string,TownView> = {
  cart: {x:.0,z:7.4,yaw:-.75,pitch:.40,distance:7.5},
  street: {x:3.5,z:-.8,yaw:.62,pitch:.45,distance:10},
  character: {x:-3,z:7,yaw:-.50,pitch:.28,distance:5},
};
function CafePreview(){
  const host=useRef<HTMLDivElement>(null),control=useRef<TownController>(),saved=useRef<TownView>(views.cart),pendingCafe=useRef(false);
  const [art,setArt]=useState<'atelier'|'original'>('atelier'),[phase,setPhase]=useState(.14),[revision,setRevision]=useState(0);
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[progress,setProgress]=useState(0),[room,setRoom]=useState('city');
  const [message,setMessage]=useState('Your next chapter starts with a small cup.'),[busy,setBusy]=useState(false),[sound,setSound]=useState(false);
  const [quality,setQuality]=useState('high'),[stats,setStats]=useState({fps:0,calls:0,triangles:0});
  const [smooth,setSmooth]=useState(false);
  const requested=useRef<TownView>(),roomRef=useRef('city');
  useEffect(()=>{
    const restoreRoom=requested.current?'city':roomRef.current;
    if(requested.current){saved.current=requested.current;requested.current=undefined;}
    setReady(false);setFailed(false);setProgress(0);setRoom('city');roomRef.current='city';setBusy(false);pendingCafe.current=false;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const controller=createTownScene(host.current!,place=>{if(place==='business'&&pendingCafe.current){pendingCafe.current=false;control.current?.enterCafe();setMessage('Come in. Walk to the counter or explore the room.');}},()=>{},()=>setFailed(true),reduced,()=>setReady(true),{
      art,view:saved.current,review:{phase,season:'summer',room:restoreRoom==='cafe'?'cafe':undefined},quality:smooth?'low':'auto',
      onView:view=>{saved.current=view;},onProgress:setProgress,onRoom:room=>{roomRef.current=room;setRoom(room);},onQuality:q=>setQuality(q),onStats:setStats
    });
    control.current=controller;
    controller.setBusiness(true,true,true);controller.setOwned(['business']);
    controller.setNeighbourhood(7,{openedMonth:1,plan:{price:4,stock:400,helper:false,open:true},seats:true,machine:true});
    controller.setSound(sound);setQuality(controller.getQuality());
    return()=>{controller.dispose();control.current=undefined;};
  },[art,phase,revision]);
  const move=(x:number,z:number)=>control.current?.move(x,z);
  return <main>
    <header className="masthead"><a className="wordmark" href="/cafe-preview.html" aria-label="Little Square preview home"><span className="mark">ls.</span><span>TYCOON <small>FREEDOM SQUARE</small></span></a><span className="preview-label"><i/> LOCAL ART PREVIEW</span><div className="compare" aria-label="Art comparison"><button aria-pressed={art==='original'} onClick={()=>setArt('original')}>Original</button><button aria-pressed={art==='atelier'} onClick={()=>setArt('atelier')}>Updated <span>↗</span></button></div></header>
    <section className="intro"><div><p className="eyebrow">A LITTLE MORE LIFE ON MAIN STREET</p><h1>Little Square<span>.</span></h1></div><p className="intro-note">Small beginnings.<br/><em>A place worth building.</em></p></section>
    <section className="world" aria-label="Playable café neighbourhood">
      <div className="canvas-host" ref={host}/>
      <div className="world-top"><span className="scene-tag"><i/>{room==='city'?'THE NEIGHBOURHOOD':'INSIDE THE CAFÉ'}</span><div className="lighting"><button aria-pressed={phase===.14} onClick={()=>setPhase(.14)}>Day</button><button aria-pressed={phase===.47} onClick={()=>setPhase(.47)}>Golden hour</button><button aria-pressed={phase===.73} onClick={()=>setPhase(.73)}>Night</button></div></div>
      {!ready&&!failed&&<div className="loading" role="status"><span className="loader"/><strong>Opening the square</strong><span>{Math.round(progress*100)}%</span></div>}
      {failed&&<div className="loading" role="alert"><strong>The 3D view couldn’t open.</strong><span>Try reloading, or use another browser with WebGL enabled.</span><button onClick={()=>setRevision(v=>v+1)}>Try again</button></div>}
      <div className="world-bottom"><div className="caption"><span>{art==='atelier'?'01 / THE CAFÉ STUDY':'00 / ORIGINAL ARTWORK'}</span><p role="status">{message}</p></div><div className="view-tools"><button aria-label="Rotate camera left" onClick={()=>control.current?.orbit(-.35)}>↶</button><button aria-label="Rotate camera right" onClick={()=>control.current?.orbit(.35)}>↷</button><button aria-label="Zoom closer" onClick={()=>control.current?.zoom(-1)}>＋</button><button aria-label="Zoom out" onClick={()=>control.current?.zoom(1)}>−</button></div></div>
      <div className="touch-move" aria-label="Movement controls">{[[0,-1,'↑'],[-1,0,'←'],[0,1,'↓'],[1,0,'→']].map(([x,z,label])=><button key={label} aria-label={`Walk ${label}`} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);move(Number(x),Number(z));}} onPointerUp={()=>move(0,0)} onPointerCancel={()=>move(0,0)}>{label}</button>)}</div>
    </section>
    <nav className="actions" aria-label="Explore the preview"><div className="bookmarks"><button onClick={()=>{requested.current=views.cart;setMessage('Your next chapter starts with a small cup.');setRevision(v=>v+1);}}>Coffee cart</button><button onClick={()=>{requested.current=views.street;setMessage('Main Street, with a little more character.');setRevision(v=>v+1);}}>Café frontage</button><button onClick={()=>{requested.current=views.character;setMessage('A familiar face, ready for a fresh start.');setRevision(v=>v+1);}}>Meet your character</button></div><div className="play-actions"><button disabled={!ready||busy} onClick={()=>{if(room!=='city')control.current?.leaveCafe();setBusy(true);setMessage('One fresh coffee, coming up…');control.current?.serveCustomer(()=>{setBusy(false);setMessage('Coffee served. A small moment, a growing business.');});}}>{busy?'Serving…':'Serve a coffee'} <span>↗</span></button><button className="primary" disabled={!ready||busy} onClick={()=>{if(room==='cafe'){control.current?.leaveCafe();setMessage('Back on the square.');}else{pendingCafe.current=true;control.current?.walkTo('business');setMessage('Walking over to Little Square Café…');}}}>{room==='cafe'?'Return to square':'Visit the café'} <span>→</span></button></div></nav>
    <footer><span><a className="full-game-link" href="/">Play the full game →</a> · This art study uses no game money.</span><div><button aria-pressed={sound} onClick={()=>{control.current?.setSound(!sound);setSound(!sound);}}>Sound {sound?'on':'off'}</button><button aria-pressed={smooth} onClick={()=>{control.current?.setQuality(smooth?'auto':'low');setSmooth(!smooth);}}>Graphics: {smooth?'smooth':'auto'}</button><span className="performance">{stats.fps} fps · {quality}</span></div></footer>
    <section className="study-notes"><div><span>THE STUDY</span><p>Crafted details.<br/>Same living world.</p></div><p>Walnut and enamel. Warm stone underfoot. A proper little espresso machine. Switch between the two versions to compare the same scene.</p><p className="fine-print">A separate visual prototype. Exploring here does not change your game balance or saves. Desktop preview tested; physical-phone performance still needs a device check.</p></section>
  </main>;
}
createRoot(document.getElementById('root')!).render(<CafePreview/>);
