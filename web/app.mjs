import { mapInstant } from './buddhist-clock.mjs';
const el=(id)=>document.getElementById(id),pad=(n)=>String(Math.floor(n)).padStart(2,'0'),fmt=(n,d=2)=>n.toFixed(d);
const dateFmt=(x)=>new Date(x).toLocaleString(undefined,{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'});
let mode='phase',latitude=6.9271,longitude=79.8612,lastError='';
const circumference=2*Math.PI*178;
function ticks(){
 const parent=el('ticks');
 for(let i=0;i<28;i++){
  const angle=Math.PI*2*(i/28-.25),x=Math.cos(angle),y=Math.sin(angle),major=i%7===0;
  const line=document.createElementNS('http://www.w3.org/2000/svg','line');
  for(const [key,val] of Object.entries({x1:250+184*x,y1:250+184*y,x2:250+(major?198:192)*x,y2:250+(major?198:192)*y,class:major?'tickline major':'tickline'}))line.setAttribute(key,String(val));
  parent.appendChild(line);
  const label=document.createElementNS('http://www.w3.org/2000/svg','text');
  for(const [key,val] of Object.entries({x:250+218*x,y:250+218*y,class:'ticktext'}))label.setAttribute(key,String(val));
  label.textContent=pad(i+1);parent.appendChild(label);
 }
}
function render(){
 try{
  const c=mapInstant(Date.now(),{mode,observer:{latitude,longitude}});
  el('day').textContent=pad(c.day);
  el('time').textContent=pad(c.hour)+':'+pad(c.minute)+':'+pad(c.second);
  el('era').textContent='BE '+c.era.year+(c.era.verified?'':' *');
  el('era').title=c.era.basis;
  el('week').textContent='WEEK '+c.week+' OF 4 · DAY '+c.dayOfWeek+' OF 7';
  el('from').textContent=dateFmt(c.fullMoonStart);el('until').textContent=dateFmt(c.nextFullMoon);
  el('sec').textContent=fmt(c.siSecondsPerVirtualSecond,5)+' SI s';
  el('lit').textContent=fmt(c.illumination*100,1)+'%';
  el('utc').textContent=new Date(c.utc).toUTCString();
  el('az').textContent='AZ '+fmt(c.sky.azimuthDeg)+'°';
  el('alt').textContent='ALT '+fmt(c.sky.apparentAltitudeDeg)+'°';
  el('above').textContent=c.sky.aboveApparentHorizon?'Above horizon':'Below horizon';
  el('arc').style.strokeDasharray=(c.progress*circumference)+' '+circumference;
  el('hand').setAttribute('transform','rotate('+(c.progress*360)+' 250 250)');
  el('json').textContent=JSON.stringify({utc:c.utc,lunar:{era:c.era.year,mode:c.mode,week:c.week,day:c.day,dayOfWeek:c.dayOfWeek,time:pad(c.hour)+':'+pad(c.minute)+':'+pad(c.second)},cycleId:c.cycleId,siSecondsPerVirtualSecond:c.siSecondsPerVirtualSecond},null,2);
  el('status').textContent=c.era.verified?'LIVE · ASTRONOMY ENGINE · 2026 ERA VERIFIED':'LIVE · ASTRONOMY ENGINE · ERA LABEL PROVISIONAL';
  lastError='';
 }catch(error){if(lastError!==error.message){el('status').textContent='Clock error: '+error.message;lastError=error.message;}}
}
ticks();
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
 mode=button.dataset.mode;
 document.querySelectorAll('[data-mode]').forEach(b=>{const on=b.dataset.mode===mode;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});
 el('modehelp').textContent=mode==='phase'?'Phase-tracking seconds expand and contract with the Moon–Sun angle.':'Evenly stretched lunar seconds have constant SI duration within one full-moon cycle.';
 render();
}));
el('coords').addEventListener('submit',event=>{event.preventDefault();const a=Number(el('lat').value),b=Number(el('lon').value);if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a)>90||Math.abs(b)>180)return;latitude=a;longitude=b;render();});
el('geolocate').addEventListener('click',()=>{if(!navigator.geolocation){el('status').textContent='Geolocation unavailable';return;}navigator.geolocation.getCurrentPosition(pos=>{latitude=pos.coords.latitude;longitude=pos.coords.longitude;el('lat').value=fmt(latitude,6);el('lon').value=fmt(longitude,6);render();},error=>el('status').textContent='Location unavailable: '+error.message,{timeout:10000,maximumAge:30000});});
render();setInterval(render,250);
