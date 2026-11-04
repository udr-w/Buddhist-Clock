export type LunarMode='phase'|'linear';
export type UTCInstant=Date|string|number;
export interface Observer {latitude:number;longitude:number;elevationMeters?:number;}
export interface LunarEra {year:number;verified:boolean;boundaryVerified?:boolean;basis:string;}
export interface SkyPosition {azimuthDeg:number;apparentAltitudeDeg:number;aboveApparentHorizon:boolean;}
export interface LunarInstant {
 utc:string;mode:LunarMode;era:LunarEra;cycleId:string;fullMoonStart:string;nextFullMoon:string;
 monthLengthSISeconds:number;progress:number;day:number;week:number;dayOfWeek:number;
 hour:number;minute:number;second:number;secondOfCycle:number;
 phaseDeg:number;illumination:number;siSecondsPerVirtualSecond:number;
 meanSiSecondsPerVirtualSecond:number;locationIndependentTime:true;sky?:SkyPosition;
}
export const DAYS_PER_MONTH:28;
export const DAYS_PER_WEEK:7;
export const WEEKS_PER_MONTH:4;
export const SECONDS_PER_MONTH:number;
export function fullMoonInterval(when?:UTCInstant):{startMs:number;endMs:number};
export function eraLabel(when?:UTCInstant):LunarEra;
export function moonAt(when:UTCInstant,latitude:number,longitude:number,elevationMeters?:number):SkyPosition;
export function mapInstant(when?:UTCInstant,options?:{mode?:LunarMode;observer?:Observer}):LunarInstant;
export function lunarToUTC(args:{cycleStart:UTCInstant;secondOfCycle:number;mode?:LunarMode}):Date;
export function angularSeparation(az1:number,alt1:number,az2:number,alt2:number):number;
