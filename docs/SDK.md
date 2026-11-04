# Lunar Calendar SDK: contracts and example

This SDK maps real UTC instants into a 28-day astronomical calendar. It does not replace JavaScript Date, the operating system clock, UTC, or performance.now().

## Working example

    import {
      now, fromLunar, calendarGrid, add,
      startOf, difference, format, report
    } from './src/calendar.mjs';
    const current = now({mode:'phase'});
    const grid = calendarGrid(Date.now(),{mode:'phase'});
    const utc = fromLunar({cycleId:current.cycleId,day:7,hour:12});
    const following = add(utc,1,'week');
    console.log(format(following,{locale:'si'}));
    console.log(report([{title:'Demo',atUTC:utc.toISOString()}],Date.now()));

Demo site is served from /demo/ relative to the project root once GitHub Pages deploys.

## Typical date-time abstract operations

| Concept | SDK function | Definition |
|---|---|---|
| Current time | now(options) | Map current real UTC to lunar coordinates |
| Construct/parse | fromLunar({cycleId,day,hour,minute,second,mode}) | Strict structured lunar date to real UTC Date |
| UTC to lunar | toLunar(utc,options) | Reverse of previous mapping |
| Format | format(utc,{locale,mode}) | Localized lunar fields, era and cycle |
| Format underlying civil time | formatUTC(utc,locale,timeZone) | Audit/interoperability |
| Add / subtract | add / subtract(utc,count,unit,options) | Lunar arithmetic |
| Period boundaries | startOf / endOf(utc,unit,options) | Returns ordinary UTC Date |
| Compare | compare(a,b) | -1, 0, or 1 in real-time order |
| Difference | difference(a,b,unit,options) | Signed fractional virtual units |
| 28-day UI calendar | calendarGrid(utc,options) | Four weeks, 28 days, each with real UTC boundaries |
| Weekly/daily reporting | report(events,utc,options) | Groups ordinary UTC records by lunar period |
| Labels | labelsFor(locale) | Eight core translated sets |

Supported virtual units: second, minute, hour, day, week, month. A month means a full-moon-to-full-moon lunation. There is NO unique numbered lunar month within a Buddhist year here, so year operations and natural-language date parsing are not implemented.

This is intentionally NOT a drop-in implementation of Java Date/Time, Python datetime, date-fns, ICU, or Temporal. Applications must opt in. Existing system migrations are a different project.

## Data contract

An event's canonical timestamp stays in ISO UTC, optionally with a lunar context:

    {"title":"Design review","atUTC":"2026-11-05T10:00:00.000Z","lunarContext":{"mode":"phase","cycleId":"<from SDK>"}}

A lunar date requires a cycle identifier (the start full moon UTC), day 1-28, optional 24:60:60 virtual time, and a mapping mode. Buddhist Era year + day is not sufficient to reconstruct a unique UTC instant.

The phase mode's virtual seconds accelerate and decelerate according to lunar phase advancement. The linear mode's virtual seconds are constant within one lunation. Neither is an SI duration.

## Localization

Core lunar terminology is bundled for en, si, ta, hi, es, fr, ar, zh. Number and civil-reference date formatting use Intl APIs for a broader set of browser-supported locales. The demo's surrounding prose remains English; production localization also needs complete message bundles, keyboard testing, RTL layout checks and proper screen-reader evaluation.

## Safety boundaries

Use UTC and monotonic clocks for security, money, distributed logs, deadlines and real elapsed-time measurement. Convert a lunar reminder to a real UTC instant before scheduling it. Latitude and longitude affect sky position, never lunar clock time.

See docs/COMPONENTS.md, docs/VESAK_2026.md and docs/PORTABILITY.md.
