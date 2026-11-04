import * as Astronomy from 'astronomy-engine';
export const DAYS_PER_MONTH=28, DAYS_PER_WEEK=7, WEEKS_PER_MONTH=4;
export const SECONDS_PER_MONTH=28*86400;
const mod=(a,n)=>((a%n)+n)%n;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const toMs=(x)=>{const v=x instanceof Date?x.getTime():typeof x==='string'?Date.parse(x):x;if(!Number.isFinite(v))throw RangeError('Invalid UTC instant');return v;};
const checkMode=(mode)=>{if(mode!=='phase'&&mode!=='linear')throw RangeError('Expected phase or linear mode');};
let cache;
export function fullMoonInterval(when=Date.now()){
 const t=toMs(when);
 if(cache&&t>=cache.startMs&&t<cache.endMs)return {...cache};
 let prev=Astronomy.SearchMoonPhase(180,new Date(t+90000),-40);
 if(!prev)throw RangeError('Previous full moon not found');
 let startMs=prev.date.getTime();
 if(startMs>t){prev=Astronomy.SearchMoonPhase(180,new Date(t-90000),-40);if(!prev)throw RangeError('Previous full moon not found');startMs=prev.date.getTime();}
 const next=Astronomy.SearchMoonPhase(180,new Date(startMs+3600000),40);
 if(!next)throw RangeError('Next full moon not found');
 const endMs=next.date.getTime();
 if(!(startMs<=t&&t<endMs&&endMs-startMs>27*86400000&&endMs-startMs<32*86400000))throw RangeError('Invalid lunation');
 cache={startMs,endMs};return {...cache};
}
export function eraLabel(when=Date.now()){
 const t=toMs(when),y=new Date(t+19800000).getUTCFullYear();
 if(y===2026)return {year:t>=Date.parse('2026-05-29T18:30:00Z')?2570:2569,verified:true,basis:'Sri Lanka State Vesak 2026 convention'};
 return {year:y+543,verified:false,basis:'CE + 543 provisional: other Vesak transitions not curated'};
}
export function moonAt(when,latitude,longitude,elevationMeters=0){
 if(![latitude,longitude,elevationMeters].every(Number.isFinite)||Math.abs(latitude)>90||Math.abs(longitude)>180||elevationMeters< -500||elevationMeters>100000)throw RangeError('Invalid observer location');
 const date=new Date(toMs(when)),observer=new Astronomy.Observer(latitude,longitude,elevationMeters);
 const eq=Astronomy.Equator(Astronomy.Body.Moon,date,observer,true,true);
 const hor=Astronomy.Horizon(date,observer,eq.ra,eq.dec,'normal');
 return {azimuthDeg:hor.azimuth,apparentAltitudeDeg:hor.altitude,aboveApparentHorizon:hor.altitude>0};
}
export function mapInstant(when=Date.now(),options={}){
 const t=toMs(when),mode=options.mode??'phase';checkMode(mode);
 const {startMs,endMs}=fullMoonInterval(t),date=new Date(t);
 const phaseDeg=Astronomy.MoonPhase(date),linearProgress=(t-startMs)/(endMs-startMs);
 let phaseProgress=mod(phaseDeg-180,360)/360;
 if(linearProgress<.00003&&phaseProgress>.999)phaseProgress=0;
 if(linearProgress>.99997&&phaseProgress<.001)phaseProgress=1-1e-12;
 const progress=clamp(mode==='phase'?phaseProgress:linearProgress,0,1-1e-12),elapsed=progress*SECONDS_PER_MONTH;
 const day=Math.floor(elapsed/86400)+1,remainder=elapsed%86400;
 const before=Astronomy.MoonPhase(new Date(t-30000)),after=Astronomy.MoonPhase(new Date(t+30000));
 const secPerSecond=mode==='linear'?(endMs-startMs)/(SECONDS_PER_MONTH*1000):360/(SECONDS_PER_MONTH*(mod(after-before,360)/60));
 const result={utc:date.toISOString(),mode,era:eraLabel(t),cycleId:new Date(startMs).toISOString(),fullMoonStart:new Date(startMs).toISOString(),nextFullMoon:new Date(endMs).toISOString(),monthLengthSISeconds:(endMs-startMs)/1000,progress,day,week:Math.floor((day-1)/7)+1,dayOfWeek:(day-1)%7+1,hour:Math.floor(remainder/3600),minute:Math.floor((remainder%3600)/60),second:remainder%60,secondOfCycle:elapsed,phaseDeg,illumination:Astronomy.Illumination(Astronomy.Body.Moon,date).phase_fraction,siSecondsPerVirtualSecond:secPerSecond,meanSiSecondsPerVirtualSecond:(endMs-startMs)/(SECONDS_PER_MONTH*1000),locationIndependentTime:true};
 if(options.observer){const o=options.observer;result.sky=moonAt(t,o.latitude,o.longitude,o.elevationMeters??0);}
 return result;
}
export function lunarToUTC({cycleStart,secondOfCycle,mode='phase'}){
 checkMode(mode);
 if(!Number.isFinite(secondOfCycle)||secondOfCycle<0||secondOfCycle>=SECONDS_PER_MONTH)throw RangeError('Outside cycle');
 const requested=toMs(cycleStart),{startMs,endMs}=fullMoonInterval(requested+60000);
 if(Math.abs(startMs-requested)>120000)throw RangeError('cycleStart must identify a full moon');
 if(secondOfCycle===0)return new Date(startMs);
 const fraction=secondOfCycle/SECONDS_PER_MONTH;
 if(mode==='linear')return new Date(startMs+fraction*(endMs-startMs));
 let low=startMs+1,high=endMs-1;
 for(let i=0;i<48;i++){const mid=(low+high)/2,p=mod(Astronomy.MoonPhase(new Date(mid))-180,360)/360;if(p<fraction)low=mid;else high=mid;}
 return new Date((low+high)/2);
}
export function angularSeparation(az1,alt1,az2,alt2){
 if(![az1,alt1,az2,alt2].every(Number.isFinite)||Math.abs(alt1)>90||Math.abs(alt2)>90)throw RangeError('Invalid observation');
 const r=Math.PI/180,a=alt1*r,b=alt2*r;
 return Math.acos(clamp(Math.sin(a)*Math.sin(b)+Math.cos(a)*Math.cos(b)*Math.cos((az1-az2)*r),-1,1))/r;
}
