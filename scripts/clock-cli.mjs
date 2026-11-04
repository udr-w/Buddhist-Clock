#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import {toLunar,fromLunar,add,startOf,difference,calendarGrid,report} from '../src/calendar.mjs';
function handle(req){
 const mode=req.mode??'phase',opts={mode},utc=req.utc;
 switch(req.action){
  case 'toLunar':return toLunar(utc,opts);
  case 'fromLunar':return fromLunar(req.date??{}).toISOString();
  case 'add':return add(utc,req.amount,req.unit,opts).toISOString();
  case 'startOf':return startOf(utc,req.unit,opts).toISOString();
  case 'difference':return difference(req.left,req.right,req.unit,opts);
  case 'calendarGrid':return calendarGrid(utc,opts);
  case 'report':
   if(!Array.isArray(req.events)||req.events.length>1000)throw RangeError('Maximum 1000 events');
   return report(req.events,utc,opts);
  default:throw RangeError('Unknown action');
 }
}
const lines=createInterface({input:stdin,crlfDelay:Infinity,terminal:false});
for await (const line of lines){
 if(!line.trim())continue;
 try{
  if(line.length>65536)throw RangeError('Input exceeds 64 KiB');
  const req=JSON.parse(line);
  if(!req||typeof req!=='object'||Array.isArray(req))throw TypeError('Expected JSON object');
  stdout.write(JSON.stringify({ok:true,result:handle(req)})+'\n');
 }catch(error){stdout.write(JSON.stringify({ok:false,error:{name:error.name,message:error.message}})+'\n');}
}
