import React, {useRef} from 'react';
import {tl} from '../../i18n/town';

export default function CafeCinematic(){
 const video=useRef<HTMLVideoElement>(null);
 return <details className="town-cinematic" onToggle={e=>{if(!e.currentTarget.open)video.current?.pause();}}>
  <summary>{tl('A moment at the café · 5-second film','Un momento en el café · video de 5 segundos')}</summary>
  <video ref={video} controls playsInline preload="none" poster="/media/cafe-cinematic-poster.png" aria-label={tl('Café atmosphere film, no audio','Video del ambiente del café, sin audio')}>
   <source src="/media/cafe-cinematic.mp4" type="video/mp4"/>
  </video>
  <p>{tl('Just for atmosphere. Watching changes no game money, time or points.','Solo para disfrutar del ambiente. Verlo no cambia el dinero, el tiempo ni los puntos del juego.')}</p>
 </details>;
}
