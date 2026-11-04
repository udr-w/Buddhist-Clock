import type {LunarMode,UTCInstant,LunarInstant,LunarEra} from './clock.mjs';
export type LunarUnit='second'|'minute'|'hour'|'day'|'week'|'month';
export interface LunarDateInput {cycleId:UTCInstant;day:number;hour?:number;minute?:number;second?:number;mode?:LunarMode;}
export interface CalendarDay {cycleId:string;day:number;week:number;dayOfWeek:number;startUTC:string;endExclusiveUTC:string;midpointUTC:string;durationSISeconds:number;isToday:boolean;}
export interface LunarGrid {cycleId:string;mode:LunarMode;firstUTC:string;endExclusiveUTC:string;era:LunarEra;weeks:Array<{week:number;days:CalendarDay[]}>;days:CalendarDay[];}
export interface EventRecord {title:string;atUTC:UTCInstant;[key:string]:unknown;}
export interface ReportItem extends EventRecord {atUTC:string;lunarDay:number;lunarWeek:number;}
export interface LunarReport {cycleId:string;mode:LunarMode;items:ReportItem[];totalEvents:number;activeDays:number;byDay:number[];byWeek:number[];}
export const SUPPORTED_UI_LOCALES:readonly string[];
export function now(options?:{mode?:LunarMode}):LunarInstant;
export function toLunar(utc:UTCInstant,options?:{mode?:LunarMode}):LunarInstant;
export function fromLunar(input:LunarDateInput):Date;
export function calendarGrid(when?:UTCInstant,options?:{mode?:LunarMode}):LunarGrid;
export function startOf(when:UTCInstant,unit:LunarUnit,options?:{mode?:LunarMode}):Date;
export function endOf(when:UTCInstant,unit:LunarUnit,options?:{mode?:LunarMode}):Date;
export function add(when:UTCInstant,amount:number,unit:LunarUnit,options?:{mode?:LunarMode}):Date;
export function subtract(when:UTCInstant,amount:number,unit:LunarUnit,options?:{mode?:LunarMode}):Date;
export function compare(a:UTCInstant,b:UTCInstant):number;
export function difference(a:UTCInstant,b:UTCInstant,unit:LunarUnit,options?:{mode?:LunarMode}):number;
export function format(when:UTCInstant,options?:{mode?:LunarMode;locale?:string;includeTime?:boolean}):string;
export function report(events:EventRecord[],when?:UTCInstant,options?:{mode?:LunarMode}):LunarReport;
export function labelsFor(locale?:string):Record<string,string>;
export function formatUTC(when:UTCInstant,locale?:string,timeZone?:string):string;
