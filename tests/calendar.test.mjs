import test from 'node:test';
import assert from 'node:assert/strict';
import {mapInstant} from '../src/clock.mjs';
import {now,toLunar,fromLunar,calendarGrid,startOf,endOf,add,subtract,compare,difference,format,report,labelsFor,formatUTC,SUPPORTED_UI_LOCALES} from '../src/calendar.mjs';
const t=Date.parse('2026-11-05T00:00:00Z');
test('calendar SDK exports time primitives',()=>{
 const c=now();assert.equal(typeof c.day,'number');
 assert.equal(toLunar(t).day,mapInstant(t).day);
 assert.ok(SUPPORTED_UI_LOCALES.includes('en'));
});
test('28 days form exactly four rows of seven and contiguous UTC intervals',()=>{
 for(const mode of ['phase','linear']){
  const g=calendarGrid(t,{mode});
  assert.equal(g.days.length,28);assert.equal(g.weeks.length,4);
  assert.ok(g.weeks.every(x=>x.days.length===7));
  assert.equal(g.days[0].startUTC,g.firstUTC);
  assert.equal(g.days[27].endExclusiveUTC,g.endExclusiveUTC);
  assert.ok(g.days.every((d,i)=>d.day===i+1&&d.week===Math.floor(i/7)+1));
  for(let i=0;i<27;i++)assert.equal(g.days[i].endExclusiveUTC,g.days[i+1].startUTC);
  assert.ok(g.days.every(d=>d.durationSISeconds>0));
 }
});
test('strict lunar picker conversion and back within clock precision',()=>{
 for(const mode of ['phase','linear']){
  const c=mapInstant(t,{mode});
  const actual=fromLunar({cycleId:c.cycleId,day:10,hour:3,minute:14,second:25,mode});
  const p=toLunar(actual,{mode});
  assert.equal(p.day,10);assert.equal(p.hour,3);assert.equal(p.minute,14);
  assert.ok(Math.abs(p.second-25)<.1);
 }
});
test('invalid lunar inputs and unsupported calendar year are rejected',()=>{
 const c=mapInstant(t);
 for(const day of [0,29,1.5])assert.throws(()=>fromLunar({cycleId:c.cycleId,day}),RangeError);
 assert.throws(()=>fromLunar({cycleId:c.cycleId,day:1,hour:24}),RangeError);
 assert.throws(()=>fromLunar({cycleId:c.cycleId,day:1,second:60}),RangeError);
 assert.throws(()=>add(t,1,'year'),RangeError);
 assert.throws(()=>add(t,1.5,'week'),RangeError);
});
test('day and week add/subtract preserve virtual coordinates',()=>{
 for(const mode of ['phase','linear']){
  const x=add(t,8,'day',{mode}),y=subtract(x,8,'day',{mode});
  assert.ok(Math.abs(y.getTime()-t)<3000);
  assert.ok(Math.abs(difference(x,t,'day',{mode})-8)<.0001);
  const week=add(t,1,'week',{mode});
  assert.ok(Math.abs(difference(week,t,'day',{mode})-7)<.0001);
 }
});
test('cross-month arithmetic has 28 lunar days and wraps',()=>{
 for(const mode of ['phase','linear']){
  const c=mapInstant(t,{mode});
  const last=fromLunar({cycleId:c.cycleId,day:28,hour:6,mode});
  const next=add(last,1,'day',{mode});
  const d=mapInstant(next,{mode});
  assert.equal(d.day,1);
  assert.ok(Math.abs(d.hour-6)<=1);
  const returned=subtract(next,1,'day',{mode});
  assert.ok(Math.abs(returned.getTime()-last.getTime())<3000);
 }
});
test('start/end of lunar days and weeks bracket instant',()=>{
 for(const unit of ['day','week','month','hour','minute']){
  const start=startOf(t,unit),end=endOf(t,unit);
  assert.ok(start.getTime()<=t&&end.getTime()>=t);
  assert.equal(compare(start,end),-1);
 }
});
test('reports aggregate UTC records into lunar day and week',()=>{
 const c=mapInstant(t,{mode:'linear'});
 const eventAt=day=>fromLunar({cycleId:c.cycleId,day,hour:12,mode:'linear'}).toISOString();
 const records=[{title:'A',atUTC:eventAt(1)},{title:'B',atUTC:eventAt(8)},{title:'C',atUTC:eventAt(8)},{title:'Elsewhere',atUTC:'2020-01-01T00:00:00.000Z'}];
 const r=report(records,t,{mode:'linear'});
 assert.equal(r.totalEvents,3);assert.equal(r.activeDays,2);
 assert.deepEqual(r.byWeek,[1,2,0,0]);assert.equal(r.byDay[7],2);
 assert.ok(r.items.every(x=>x.cycleId===undefined&&Number.isInteger(x.lunarDay)));
});
test('supported locale formatting and fallbacks work',()=>{
 for(const locale of SUPPORTED_UI_LOCALES){
  const s=format(t,{locale});
  assert.equal(typeof s,'string');assert.ok(s.length>10);
  assert.ok(labelsFor(locale).day.length>0);
  assert.ok(formatUTC(t,locale).length>10);
 }
 assert.ok(format(t,{locale:'invalid_locale_name'}).length>10);
});
