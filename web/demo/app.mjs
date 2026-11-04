import {
 now, fromLunar, calendarGrid, report, formatUTC, add,
 labelsFor, SUPPORTED_UI_LOCALES
} from '../../buddhist-calendar.mjs';
const $=id=>document.getElementById(id);
const initial=Date.now();
let viewInstant=initial, mode='phase', locale='en', selectedDay=1, sequence=1;
let events=[],grid,summary;
const intlNum=n=>new Intl.NumberFormat(locale,{useGrouping:false}).format(n);
const pad=n=>new Intl.NumberFormat(locale,{minimumIntegerDigits:2,useGrouping:false}).format(Math.floor(n));
const message=(m)=>{$('message').textContent=m;};
const labels=()=>labelsFor(locale);
const rangeLabel=(iso)=>new Intl.DateTimeFormat(locale,{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(iso));

function seedDemo(){
 const current=now({mode:'phase'});
 const examples=[
  {day:3,hour:9,title:'Lunar observatory check'},
  {day:5,hour:12,title:'Design review'},
  {day:10,hour:16,title:'Experiment checkpoint'},
  {day:13,hour:11,title:'Readout analysis'},
  {day:16,hour:8,title:'Moonwatch session'},
  {day:21,hour:14,title:'Documentation review'},
  {day:25,hour:18,title:'Release demonstration'}
 ];
 events=examples.map(e=>({id:sequence++,title:e.title,atUTC:fromLunar({cycleId:current.cycleId,day:e.day,hour:e.hour,mode:'phase'}).toISOString(),demo:true}));
}

function drawClock(){
 const c=now({mode});
 $('nowTime').textContent=[c.hour,c.minute,c.second].map(pad).join(':');
 $('nowDay').textContent=labels().day+' '+intlNum(c.day)+' · '+labels().week+' '+intlNum(c.week)+' · BE '+intlNum(c.era.year);
 $('utcNow').textContent=new Date(c.utc).toISOString().replace('T',' ').slice(0,19)+'Z';
}

function selectedInstant(){
 const hour=Number($('hour').value),minute=Number($('minute').value),second=Number($('second').value);
 if(![hour,minute,second].every(Number.isInteger)||hour<0||hour>23||minute<0||minute>59||second<0||second>59)throw new RangeError('Use valid hours 0–23, minutes 0–59, seconds 0–59');
 return fromLunar({cycleId:grid.cycleId,day:selectedDay,hour,minute,second,mode});
}

function conversion(){
 const text=labels().day+' '+intlNum(selectedDay)+' · '+labels().week+' '+intlNum(Math.floor((selectedDay-1)/7)+1);
 $('selectedLabel').textContent=text;
 try{$('converted').textContent=selectedInstant().toISOString();}catch(error){$('converted').textContent=error.message;}
}

function drawCalendar(){
 grid=calendarGrid(viewInstant,{mode});
 summary=report(events,viewInstant,{mode});
 $('cycleLabel').textContent=labels().cycle+' · '+rangeLabel(grid.firstUTC)+' → '+rangeLabel(grid.endExclusiveUTC)+' (UTC)';
 $('weekLabels').replaceChildren();
 const t=labels();
 for(let n=1;n<=7;n++){
  const label=document.createElement('span');label.textContent=t.day+' '+intlNum(n);$('weekLabels').appendChild(label);
 }
 const fragment=document.createDocumentFragment();
 for(const d of grid.days){
  const button=document.createElement('button');
  button.type='button';button.className='calday'+(d.day===selectedDay?' selected':'')+(d.isToday?' today':'')+(summary.byDay[d.day-1]?' hasEvents':'');
  button.setAttribute('aria-label',t.day+' '+intlNum(d.day)+', '+t.week+' '+intlNum(d.week)+', '+intlNum(summary.byDay[d.day-1])+' '+t.events);
  button.setAttribute('aria-pressed',String(d.day===selectedDay));
  const n=document.createElement('span');n.textContent=intlNum(d.day);
  const dot=document.createElement('span');dot.className='dot';dot.setAttribute('aria-hidden','true');
  button.append(n,dot);
  button.addEventListener('click',()=>{selectedDay=d.day;refresh();});
  fragment.appendChild(button);
 }
 $('calendar').replaceChildren(fragment);
}

function drawReport(){
 summary=report(events,viewInstant,{mode});
 $('total').textContent=intlNum(summary.totalEvents);
 $('active').textContent=intlNum(summary.activeDays);
 $('selectedCount').textContent=intlNum(summary.byDay[selectedDay-1]);
 const max=Math.max(1,...summary.byWeek);
 const chart=document.createDocumentFragment();
 for(let i=0;i<4;i++){
  const wrap=document.createElement('div');wrap.className='barwrap';
  const count=document.createElement('span');count.textContent=intlNum(summary.byWeek[i]);
  const bar=document.createElement('div');bar.className='bar';
  bar.style.height=(Math.max(1,summary.byWeek[i]/max*110))+'px';
  const caption=document.createElement('span');caption.textContent=labels().week+' '+intlNum(i+1);
  wrap.append(count,bar,caption);chart.appendChild(wrap);
 }
 $('chart').replaceChildren(chart);
 const body=document.createDocumentFragment();
 for(const e of summary.items){
  const row=document.createElement('tr');
  const name=document.createElement('td');name.textContent=e.title;
  const day=document.createElement('td');day.textContent=labels().day+' '+intlNum(e.lunarDay)+' · '+labels().week+' '+intlNum(e.lunarWeek);
  const utc=document.createElement('td');utc.textContent=formatUTC(e.atUTC,locale,'UTC');
  row.append(name,day,utc);body.appendChild(row);
 }
 if(!summary.items.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=3;td.className='empty';td.textContent='No events in this lunar cycle';tr.appendChild(td);body.appendChild(tr);}
 $('events').replaceChildren(body);
}
function refresh(){drawCalendar();conversion();drawReport();drawClock();}
function setMode(next){mode=next;refresh();}
function navigate(direction){
 viewInstant=direction>0?Date.parse(grid.endExclusiveUTC)+60000:Date.parse(grid.firstUTC)-60000;
 selectedDay=1;refresh();
}
function safeCsvField(v){
 const text=String(v);
 const protectedText=/^[=+\-@\t\r]/.test(text)?'\''+text:text;
 return '"'+protectedText.replaceAll('"','""')+'"';
}
function downloadCSV(){
 const rows=[['Event','Lunar cycle','Day','Week','UTC instant','Mode'],...summary.items.map(e=>[e.title,summary.cycleId,e.lunarDay,e.lunarWeek,e.atUTC,mode])];
 const csv=rows.map(r=>r.map(safeCsvField).join(',')).join('\r\n');
 const blob=new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='lunar-report-'+summary.cycleId.slice(0,10)+'.csv';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),500);
}
$('previous').addEventListener('click',()=>navigate(-1));
$('next').addEventListener('click',()=>navigate(1));
$('jumpToday').addEventListener('click',()=>{viewInstant=Date.now();selectedDay=now({mode}).day;refresh();});
$('mode').addEventListener('change',e=>{setMode(e.target.value);});
$('locale').addEventListener('change',e=>{
 locale=SUPPORTED_UI_LOCALES.includes(e.target.value)?e.target.value:'en';
 document.documentElement.lang=locale;document.documentElement.dir=locale==='ar'?'rtl':'ltr';
 refresh();
});
['hour','minute','second'].forEach(id=>$(id).addEventListener('input',conversion));
$('eventForm').addEventListener('submit',event=>{
 event.preventDefault();
 try{
  const title=$('title').value.trim();if(!title)throw Error('Enter an event name');
  const atUTC=selectedInstant().toISOString();
  events.push({id:sequence++,title,atUTC,demo:false});
  $('title').value='';refresh();message('Added: '+title+' · '+atUTC+' (UTC)');
 }catch(error){message('Could not create event: '+error.message);}
});
$('download').addEventListener('click',downloadCSV);
seedDemo();selectedDay=now({mode}).day;refresh();
setInterval(drawClock,1000);
