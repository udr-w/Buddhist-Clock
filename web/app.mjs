import { mapInstant } from './buddhist-clock.mjs';
import {
  CLOCK_MODES, faceModel, mountClockFace, paintClockFace, nextClockMode
} from './wall-clock.mjs';

const el = (id) => document.getElementById(id);
const pad = (n) => String(Math.floor(n)).padStart(2, '0');
const fmt = (n, digits=2) => Number(n).toFixed(digits);
const dateFmt = (iso) => new Date(iso).toLocaleString(undefined, {
  day:'numeric', month:'short', year:'numeric', hour:'2-digit',
  minute:'2-digit', timeZoneName:'short'
});
let mode='phase', latitude=6.9271, longitude=79.8612;
let transitioning=false, animationTimer=null, lastError='';
const front=el('faceFront'), back=el('faceBack'), rotor=el('flipRotor');
const surface=el('swipeSurface');
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');

function readingFor(selectedMode, at=Date.now()) {
  const lunarMode = selectedMode === 'utc' ? 'phase' : selectedMode;
  const instant = mapInstant(at, { mode:lunarMode, observer:{ latitude, longitude } });
  return { instant, face:faceModel(at, selectedMode, instant) };
}

function setTabs(){
  document.querySelectorAll('[data-mode]').forEach(button=>{
    const active = button.dataset.mode === mode;
    button.classList.toggle('on',active);
    button.setAttribute('aria-selected',String(active));
    button.tabIndex = active ? 0 : -1;
  });
}

function render() {
  if (transitioning) return;
  try {
    const {instant:c,face:f}=readingFor(mode);
    paintClockFace(front,f);
    el('dayLabel').textContent=f.period;
    el('day').textContent=mode==='utc'?f.dayLabel:pad(c.day);
    el('daySuffix').textContent=mode==='utc'?'':'/ 28';
    el('faceLabel').textContent=f.name.toUpperCase() + ' TIME';
    el('time').textContent=f.digital;
    el('era').textContent=mode==='utc'?'UTC':'BE '+c.era.year+(c.era.verified?'':' *');
    el('era').title=mode==='utc'?'Coordinated Universal Time':c.era.basis;
    el('week').textContent=mode==='utc'?
      'STANDARD COORDINATED UNIVERSAL TIME':
      'WEEK '+c.week+' OF 4 · DAY '+c.dayOfWeek+' OF 7';
    el('modehelp').textContent=mode==='phase'?
      'The hour, minute and second hands track phase-adjusted virtual time. The outer ring spans all 28 lunar days.':
      mode==='linear'?
      'The three hands track evenly stretched virtual seconds. Each month spans exactly one full-moon cycle.':
      'A conventional 12-hour analog face with an exact 24-hour UTC digital readout. Each second is one SI second.';
    el('from').textContent=dateFmt(c.fullMoonStart);
    el('until').textContent=dateFmt(c.nextFullMoon);
    el('secondLabel').textContent=mode==='utc'?'Length of a standard second':'Length of this lunar second';
    el('sec').textContent=mode==='utc'?'1.00000 SI s':fmt(c.siSecondsPerVirtualSecond,5)+' SI s';
    el('lit').textContent=fmt(c.illumination*100,1)+'%';
    el('utc').textContent=new Date(c.utc).toUTCString();
    el('az').textContent='AZ '+fmt(c.sky.azimuthDeg)+'°';
    el('alt').textContent='ALT '+fmt(c.sky.apparentAltitudeDeg)+'°';
    el('above').textContent=c.sky.aboveApparentHorizon?'Above horizon':'Below horizon';
    el('json').textContent=JSON.stringify({
      utc:c.utc, clockFace:mode, lunar:{
        era:c.era.year, mode:c.mode, week:c.week, day:c.day, dayOfWeek:c.dayOfWeek,
        time:[c.hour,c.minute,Math.floor(c.second)].map(pad).join(':')
      }, faceTime:f.digital, cycleId:c.cycleId,
      siSecondsPerVirtualSecond:mode==='utc'?1:c.siSecondsPerVirtualSecond
    },null,2);
    el('status').textContent=c.era.verified?
      'LIVE · ASTRONOMY ENGINE · 2026 ERA LABEL':
      'LIVE · ASTRONOMY ENGINE · ERA LABEL PROVISIONAL';
    lastError='';
  } catch(error) {
    if (error.message !== lastError) {
      lastError=error.message;
      el('status').textContent='Clock error: '+error.message;
    }
  }
}

function resetFace(target){
  mode=target;
  mountClockFace(front,target);
  back.replaceChildren();
  rotor.style.transition='none';
  rotor.style.transform='rotateY(0deg)';
  transitioning=false;
  setTabs();
  render();
  // Restore the CSS transition only after the rotor is back at zero.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{rotor.style.transition='';}));
}
function changeFace(target, direction) {
  if(transitioning || !CLOCK_MODES.includes(target) || target===mode) return;
  const side = direction > 0 ? -180 : 180;
  if(reduceMotion.matches){
    resetFace(target);
    return;
  }
  transitioning=true;
  mountClockFace(back,target);
  try{
    const {face}=readingFor(target);
    paintClockFace(back,face);
  }catch(error){
    transitioning=false;
    el('status').textContent='Clock error: '+error.message;
    return;
  }
  rotor.classList.add('rotating');
  rotor.style.transition='';
  // Await a paint with front + back mounted before rotating to reveal the back.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    rotor.style.transform='rotateY('+side+'deg)';
  }));
  const complete=()=>{
    clearTimeout(animationTimer);
    rotor.removeEventListener('transitionend',onEnd);
    rotor.classList.remove('rotating');
    resetFace(target);
  };
  const onEnd=(event)=>{if(event.target===rotor && event.propertyName==='transform')complete();};
  rotor.addEventListener('transitionend',onEnd);
  animationTimer=setTimeout(complete,900);
}
function switchStep(direction){
  if(transitioning) return;
  changeFace(nextClockMode(mode,direction),direction);
}
function switchTo(target){
  if(transitioning || target===mode)return;
  const previous=CLOCK_MODES.indexOf(mode),next=CLOCK_MODES.indexOf(target);
  const distance=next-previous;
  const direction=distance===2?-1:distance===-2?1:Math.sign(distance);
  changeFace(target,direction);
}

const tabs=[...document.querySelectorAll('[data-mode]')];
tabs.forEach((tab)=>{
  tab.addEventListener('click',()=>switchTo(tab.dataset.mode));
  tab.addEventListener('keydown',(event)=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='Home'||event.key==='End'){
      const newMode=event.key==='Home'?CLOCK_MODES[0]:CLOCK_MODES.at(-1);
      switchTo(newMode);
      document.querySelector('[data-mode="'+newMode+'"]').focus();
    }else{
      const direction=event.key==='ArrowRight'?1:-1;
      const newMode=nextClockMode(mode,direction);
      switchStep(direction);
      document.querySelector('[data-mode="'+newMode+'"]').focus();
    }
  });
});

// A horizontal swipe changes the face; vertical gestures still scroll the page.
let gesture=null;
surface.addEventListener('pointerdown',(event)=>{
  if(event.button !== 0 || transitioning)return;
  gesture={id:event.pointerId,x:event.clientX,y:event.clientY};
});
surface.addEventListener('pointerup',(event)=>{
  if(!gesture || event.pointerId!==gesture.id)return;
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
  gesture=null;
  if(Math.abs(dx)>48 && Math.abs(dx)>Math.abs(dy)*1.25) switchStep(dx<0?1:-1);
});
surface.addEventListener('pointercancel',()=>{gesture=null;});
surface.addEventListener('keydown',(event)=>{
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
    event.preventDefault();
    switchStep(event.key==='ArrowRight'?1:-1);
  }
});

el('coords').addEventListener('submit',(event)=>{
  event.preventDefault();
  const lat=Number(el('lat').value),lon=Number(el('lon').value);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return;
  latitude=lat;longitude=lon;render();
});
el('geolocate').addEventListener('click',()=>{
  if(!navigator.geolocation){el('status').textContent='Geolocation unavailable';return;}
  navigator.geolocation.getCurrentPosition((position)=>{
    latitude=position.coords.latitude;longitude=position.coords.longitude;
    el('lat').value=fmt(latitude,6);el('lon').value=fmt(longitude,6);
    render();
  },(error)=>{el('status').textContent='Location unavailable: '+error.message;},
    {timeout:10000,maximumAge:30000});
});

mountClockFace(front,mode);
setTabs();
render();
setInterval(render,250);
