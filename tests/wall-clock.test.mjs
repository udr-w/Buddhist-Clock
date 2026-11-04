import test from 'node:test';
import assert from 'node:assert/strict';
import {clockFaceSVG,handAngles,faceModel,nextClockMode,CLOCK_MODES,displayTime} from '../web/wall-clock.mjs';

test('three clock faces exist, each with three ornamental analog hands',()=>{
  assert.deepEqual([...CLOCK_MODES],['phase','linear','utc']);
  for(const mode of CLOCK_MODES){
    const markup=clockFaceSVG(mode);
    for(const hand of ['hour','minute','second']){
      assert.match(markup,new RegExp('data-'+hand+'-hand'));
    }
    assert.match(markup,/class="hand-cutout"/);
    assert.match(markup,/data-progress/);
  }
});
test('face labels have 28 days for lunar and 12 hours for UTC',()=>{
  const phase=clockFaceSVG('phase'),utc=clockFaceSVG('utc');
  assert.equal((phase.match(/class="outer-number/g)||[]).length,28);
  assert.equal((utc.match(/class="outer-number/g)||[]).length,12);
  assert.equal((phase.match(/class="inner-number/g)||[]).length,12);
});
test('hand geometry follows fractional hours, minutes, seconds',()=>{
  assert.deepEqual(handAngles(3,0,0),{hour:90,minute:0,second:0});
  const t=handAngles(6,30,15);
  assert.ok(t.hour>195&&t.hour<196);
  assert.equal(t.minute,181.5);
  assert.equal(t.second,90);
  assert.equal(handAngles(12,0,0).hour,0);
  assert.throws(()=>handAngles(24,0,0),RangeError);
  assert.throws(()=>handAngles(10,60,0),RangeError);
});
test('clock views cycle with left/right swipes',()=>{
  assert.equal(nextClockMode('phase',1),'linear');
  assert.equal(nextClockMode('linear',1),'utc');
  assert.equal(nextClockMode('utc',1),'phase');
  assert.equal(nextClockMode('phase',-1),'utc');
  assert.throws(()=>nextClockMode('phase',0),RangeError);
});
test('UTC face uses UTC and never local system hour',()=>{
  const epoch=Date.parse('2026-11-05T15:25:42Z');
  const lunar={hour:9,minute:1,second:59,day:12,progress:0.4};
  const utc=faceModel(epoch,'utc',lunar);
  const phase=faceModel(epoch,'phase',lunar);
  assert.equal(utc.digital,'15:25:42');
  assert.equal(utc.angles.hour,(3+25/60+42/3600)*30);
  assert.equal(utc.period,'UTC DAY');
  assert.equal(phase.digital,'09:01:59');
  assert.equal(phase.dayLabel,'12 / 28');
  assert.match(utc.dayLabel,/5 Nov 2026/);
});
test('zero and near-midnight behavior is stable',()=>{
  const now=Date.parse('2026-11-05T00:00:00Z');
  const lunar={hour:23,minute:59,second:59.99,day:28,progress:0.9999};
  assert.equal(displayTime(0,0,0),'00:00:00');
  assert.equal(faceModel(now,'utc',lunar).digital,'00:00:00');
  assert.equal(faceModel(now,'phase',lunar).digital,'23:59:59');
  assert.ok(faceModel(now,'phase',lunar).angles.second>359);
});
