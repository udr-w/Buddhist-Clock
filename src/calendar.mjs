/**
 * Framework-neutral lunar calendar facade.
 * The global reference remains UTC. A "month" here means one lunation, not
 * a Gregorian month. A 28-day lunar month contains exactly four lunar weeks.
 */
import {
  mapInstant, lunarToUTC, fullMoonInterval, SECONDS_PER_MONTH,
  DAYS_PER_MONTH, DAYS_PER_WEEK
} from './clock.mjs';

const PER_DAY=86400;
const UNITS=Object.freeze({second:1,minute:60,hour:3600,day:PER_DAY,week:7*PER_DAY,month:SECONDS_PER_MONTH});
const labels=Object.freeze({
 en:{day:'Day',week:'Week',cycle:'Cycle',time:'Time',events:'Events',today:'Today',add:'Add event'},
 si:{day:'දිනය',week:'සතිය',cycle:'චක්‍රය',time:'වේලාව',events:'සිදුවීම්',today:'අද',add:'එකතු කරන්න'},
 ta:{day:'நாள்',week:'வாரம்',cycle:'சுழற்சி',time:'நேரம்',events:'நிகழ்வுகள்',today:'இன்று',add:'சேர்'},
 hi:{day:'दिन',week:'सप्ताह',cycle:'चक्र',time:'समय',events:'घटनाएँ',today:'आज',add:'जोड़ें'},
 es:{day:'Día',week:'Semana',cycle:'Ciclo',time:'Hora',events:'Eventos',today:'Hoy',add:'Añadir'},
 fr:{day:'Jour',week:'Semaine',cycle:'Cycle',time:'Heure',events:'Événements',today:"Aujourd’hui",add:'Ajouter'},
 ar:{day:'يوم',week:'أسبوع',cycle:'دورة',time:'وقت',events:'أحداث',today:'اليوم',add:'إضافة'},
 zh:{day:'日',week:'周',cycle:'周期',time:'时间',events:'事件',today:'今天',add:'添加'}
});
export const SUPPORTED_UI_LOCALES=Object.freeze(Object.keys(labels));
const num=(value,locale,minimumIntegerDigits=1)=>new Intl.NumberFormat(locale,{useGrouping:false,minimumIntegerDigits}).format(value);
const timestamp=(instant)=>{
 const ms=instant instanceof Date?instant.getTime():typeof instant==='string'?Date.parse(instant):instant;
 if(!Number.isFinite(ms)||Math.abs(ms)>8.64e15)throw new RangeError('Valid UTC Date, ISO string, or timestamp required');
 return ms;
};
const checkUnit=(unit)=>{if(!Object.hasOwn(UNITS,unit))throw new RangeError('Supported lunar units: second, minute, hour, day, week, month');};
const checkMode=(mode)=>{if(mode!=='phase'&&mode!=='linear')throw new RangeError('Mode must be phase or linear');};
const validInteger=(v,min,max,name)=>{if(!Number.isInteger(v)||v<min||v>max)throw new RangeError(name+' must be an integer in '+min+'..'+max);};
const numPart=(v,min,max,name)=>{if(!Number.isFinite(v)||v<min||v>=max)throw new RangeError('Invalid lunar '+name);};
const safeLocale=(locale)=>{try{new Intl.NumberFormat(locale);return locale;}catch{return 'en';}};
const messages=(locale)=>labels[locale.split('-')[0]]??labels.en;
const nextCycle=(t)=>fullMoonInterval(t+60000);
const previousCycle=(t)=>fullMoonInterval(t-60000);

export function now(options={}) { return mapInstant(Date.now(),options); }
export function toLunar(utc,options={}) { return mapInstant(utc,options); }

/** Converts day+time in a uniquely identified lunation to UTC. */
export function fromLunar({cycleId,day,hour=0,minute=0,second=0,mode='phase'}) {
 checkMode(mode);validInteger(day,1,28,'day');validInteger(hour,0,23,'hour');validInteger(minute,0,59,'minute');numPart(second,0,60,'second');
 const secondOfCycle=(day-1)*PER_DAY+hour*3600+minute*60+second;
 return lunarToUTC({cycleStart:cycleId,secondOfCycle,mode});
}

/** All four weeks and 28 independently mapped UTC day intervals. */
export function calendarGrid(when=Date.now(),{mode='phase'}={}) {
 checkMode(mode);
 const current=mapInstant(when,{mode});
 const cycleId=current.cycleId,endMs=Date.parse(current.nextFullMoon);
 const edges=[];
 for(let i=1;i<=28;i++)edges.push(fromLunar({cycleId,day:i,mode}).getTime());
 edges.push(endMs);
 const weeks=[];
 for(let week=1;week<=4;week++){
  const days=[];
  for(let dayOfWeek=1;dayOfWeek<=7;dayOfWeek++){
   const day=(week-1)*7+dayOfWeek;
   days.push({cycleId,day,week,dayOfWeek,startUTC:new Date(edges[day-1]).toISOString(),endExclusiveUTC:new Date(edges[day]).toISOString(),midpointUTC:new Date((edges[day-1]+edges[day])/2).toISOString(),durationSISeconds:(edges[day]-edges[day-1])/1000,isToday:day===current.day});
  }
  weeks.push({week,days});
 }
 return {cycleId,mode,firstUTC:current.fullMoonStart,endExclusiveUTC:current.nextFullMoon,era:current.era,weeks,days:weeks.flatMap(w=>w.days)};
}

/** Boundary at lunar instant. 'year' not supported until a formal year model exists. */
export function startOf(when,unit,{mode='phase'}={}) {
 checkUnit(unit);checkMode(mode);
 const p=mapInstant(when,{mode});
 if(unit==='month')return new Date(p.fullMoonStart);
 const b=unit==='week'?(p.week-1)*7*PER_DAY:
         unit==='day'?(p.day-1)*PER_DAY:
         Math.floor(p.secondOfCycle/UNITS[unit])*UNITS[unit];
 return lunarToUTC({cycleStart:p.cycleId,secondOfCycle:b,mode});
}

export function add(when,amount,unit,{mode='phase'}={}) {
 checkMode(mode);checkUnit(unit);
 if(!Number.isFinite(amount)||!Number.isInteger(amount)||Math.abs(amount)>1000000)throw RangeError('amount must be a bounded integer');
 const p=mapInstant(when,{mode});
 let {startMs,endMs}=fullMoonInterval(when),seconds=p.secondOfCycle;
 if(unit==='month'){
  if(Math.abs(amount)>2400)throw RangeError('Maximum 2400 lunar months per operation');
  for(let i=0;i<Math.abs(amount);i++){
   ({startMs,endMs}=amount>0?nextCycle(endMs):previousCycle(startMs));
  }
 }else{
  seconds+=amount*UNITS[unit];
  if(Math.abs(amount*UNITS[unit])>2400*SECONDS_PER_MONTH)throw RangeError('Operation exceeds 2400 lunar months');
  while(seconds<0){({startMs,endMs}=previousCycle(startMs));seconds+=SECONDS_PER_MONTH;}
  while(seconds>=SECONDS_PER_MONTH){seconds-=SECONDS_PER_MONTH;({startMs,endMs}=nextCycle(endMs));}
 }
 // Avoid e.g. floating round-off driving a value up to the following moon.
 seconds=Math.min(seconds,SECONDS_PER_MONTH-0.00001);
 return lunarToUTC({cycleStart:new Date(startMs),secondOfCycle:seconds,mode});
}

export function subtract(when,amount,unit,options={}) {return add(when,-amount,unit,options);}

export function endOf(when,unit,options={}) {
 const a=startOf(when,unit,options);
 return new Date(add(a,1,unit,options).getTime()-1);
}
export function compare(left,right){return Math.sign(timestamp(left)-timestamp(right));}

/** Signed difference in virtual units; may include a fractional unit. */
export function difference(left,right,unit,{mode='phase'}={}) {
 checkUnit(unit);checkMode(mode);
 const leftMs=timestamp(left),rightMs=timestamp(right);
 if(leftMs===rightMs)return 0;
 if(leftMs<rightMs)return -difference(right,left,unit,{mode});
 const a=mapInstant(leftMs,{mode}),b=mapInstant(rightMs,{mode});
 let months=0,earlier=Date.parse(b.fullMoonStart),later=Date.parse(a.fullMoonStart);
 while(earlier<later){
  if(++months>2400)throw RangeError('Maximum 2400 lunar months difference');
  earlier=nextCycle(fullMoonInterval(earlier+60000).endMs).startMs;
 }
 return ((months*SECONDS_PER_MONTH)+a.secondOfCycle-b.secondOfCycle)/UNITS[unit];
}

export function format(when,{mode='phase',locale='en',includeTime=true}={}) {
 const l=safeLocale(locale),tr=messages(l),p=mapInstant(when,{mode});
 const prefix='BE '+num(p.era.year,l)+' · '+tr.cycle+' '+new Intl.DateTimeFormat(l,{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(p.cycleId));
 let text=prefix+' · '+tr.week+' '+num(p.week,l)+' · '+tr.day+' '+num(p.day,l);
 if(includeTime)text+=' · '+[p.hour,p.minute,Math.floor(p.second)].map(n=>num(n,l,2)).join(':');
 return text;
}

/** Aggregates real UTC event records over one lunar calendar month. */
export function report(events,when=Date.now(),{mode='phase'}={}) {
 if(!Array.isArray(events))throw TypeError('events must be an array');
 const grid=calendarGrid(when,{mode}),begin=Date.parse(grid.firstUTC),end=Date.parse(grid.endExclusiveUTC);
 const inCycle=[];
 for(const item of events){
  if(!item||typeof item.title!=='string')throw TypeError('event requires a title');
  const at=timestamp(item.atUTC);
  if(at>=begin&&at<end){const p=mapInstant(at,{mode});inCycle.push({...item,atUTC:new Date(at).toISOString(),lunarDay:p.day,lunarWeek:p.week});}
 }
 inCycle.sort((a,b)=>Date.parse(a.atUTC)-Date.parse(b.atUTC));
 const counts=grid.days.map(d=>inCycle.filter(e=>e.lunarDay===d.day).length);
 return {cycleId:grid.cycleId,mode,items:inCycle,totalEvents:inCycle.length,activeDays:counts.filter(c=>c>0).length,byDay:counts,byWeek:[0,1,2,3].map(w=>counts.slice(w*7,w*7+7).reduce((a,b)=>a+b,0))};
}

export function labelsFor(locale='en'){return {...messages(safeLocale(locale))};}
export function formatUTC(when,locale='en',timeZone='UTC'){
 return new Intl.DateTimeFormat(safeLocale(locale),{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone,timeZoneName:'short'}).format(new Date(timestamp(when)));
}
