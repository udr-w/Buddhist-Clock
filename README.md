# Buddhist Clock 🌕

An **open-source, experimental time system**. A virtual month spans two successive astronomical full moons, contains exactly 28 virtual days and four seven-day virtual weeks, and is mapped reversibly to UTC.

Once Pages is enabled: https://udr-w.github.io/Buddhist-Clock/

The CPU/OS clocks continue measuring real time; this mapper is an opt-in time coordinate for applications. A longer virtual second **does not increase computation capacity**. The Moon drives the phase coordinate and is involved in terrestrial tides, but lunar phase does not alter the length of a physical SI second.

## Develop

Node.js 20+:
1. npm install
2. npm test
3. npm run build
4. python -m http.server 8000 --directory site
5. Open http://localhost:8000

## Analog wall clock interface

The homepage includes three clock faces: lunar phase-tracking, lunar evenly stretched, and conventional UTC. Both lunar modes reuse `mapInstant` from the existing astronomy engine. All faces display three independently rotating ornamental hands (hour, minute, second) plus numeric time. On phones, swipe left/right across the dial to flip; the three accessible tabs and keyboard arrow controls are also supported. The outer 28-day ring on lunar faces is separate from the conventional 12-hour inner dial. The UTC face uses true UTC fields, not device-local time.

The analog component in `web/wall-clock.mjs` exports pure `handAngles`, `faceModel`, `nextClockMode` and SVG presentation helpers for other clients, with unit and browser tests. Reduced-motion settings disable the 3D flip without disabling navigation.

## Interactive SDK example

[**Lunar Planner demo**](https://udr-w.github.io/Buddhist-Clock/demo/) · [Source](web/demo/)

A complete minimal browser application that uses the same clock SDK for a **28-day calendar, lunar date/time picker, event data in canonical UTC, downloadable CSV reports, virtual-time arithmetic, and eight sample UI locales** (English, Sinhala, Tamil, Hindi, Spanish, French, Arabic, Chinese). Native language support for the surrounding explanatory copy is still incomplete; the SDK provides reusable Intl number/date formatting and translatable core calendar terms.

Try:
1. Pick a lunar day in the four-week calendar.
2. Set lunar time (hour, minute, second), enter an event title, and add it.
3. Watch the real UTC instant and lunar weekly report.
4. Switch Phase ↔ Linear to see the exact same UTC events grouped differently.
5. Move between lunations, choose a language, download a report.

**Build:** npm run build and serve site/; the demo lives in `site/demo/`.

See [SDK integration guide](docs/SDK.md), [component library investigation](docs/COMPONENTS.md), and [2026 Vesak source notes](docs/VESAK_2026.md).

## API

Import from src/clock.mjs (Node), or site/buddhist-clock.mjs (built browser bundle).

    import { mapInstant, lunarToUTC } from './src/clock.mjs';
    const now = mapInstant(Date.now(), {mode:'phase'});
    const originalUTC = lunarToUTC({
      cycleStart: now.cycleId,
      secondOfCycle: now.secondOfCycle,
      mode: now.mode
    });

Available modes:
- phase: lunar seconds change duration as geocentric Moon–Sun longitude separation progresses.
- linear: equal-length virtual days within each full-moon interval; their SI length changes between cycles.

Calendar facade exported from `src/calendar.mjs` or `site/buddhist-calendar.mjs`:
`now`, `toLunar`, `fromLunar`, `calendarGrid`, `startOf`, `endOf`, `add`, `subtract`, `compare`, `difference`, `format`, `report`, `formatUTC`, `labelsFor`, and `SUPPORTED_UI_LOCALES`.

These are the intentionally supported abstract operations, not a drop-in implementation of every native Date, Temporal, date-fns, Java, Python or .NET API. Calendar **year** operations require a formally defined Buddhist lunisolar year model, which is not yet implemented.

Other exports: fullMoonInterval, eraLabel, moonAt, angularSeparation, DAYS_PER_MONTH, WEEKS_PER_MONTH, SECONDS_PER_MONTH.

Store real UTC as canonical truth and optionally store the (cycle ID, mode, virtual coordinate) alongside it. **Never** use virtual seconds for CPU timers, security token expiry, rate-limiting, payment settlement, timeouts, performance benchmarks or externally enforced deadlines.

## Astronomy and cultural accuracy

The average full-moon cycle takes about 29.53059 civil days. So a 28-day design requires virtual seconds longer than SI seconds. The Moon contributes to Earth's tides, but the length of this virtual second is a software mapping, not gravitational time dilation.

This project does **not** reproduce the official Buddhist lunisolar calendar or Sri Lankan Poya dates. A 2026 Sri Lankan State Vesak BE year transition is coded; other years are clearly marked provisional. A geocentric full moon is a global astronomical instant; the observer's location only affects sky position.

## Publication

The workflow at .github/workflows/pages.yml tests, builds, then publishes the static site automatically on main. Enable Settings → Pages → Source: GitHub Actions once.

## License

MIT for original source, see LICENSE. Astronomy Engine dependency is MIT-licensed (Don Cross and contributors). Anyone can clone, fork and reuse the project.

Sources: https://eclipse.gsfc.nasa.gov/phase/phasecat.html ; https://github.com/cosinekitty/astronomy ; https://dba.gov.lk/2026/04/23/sri-buddha-varsha-2570-state-vesak-festival-vesak-week-2026/

Design details: docs/ARCHITECTURE.md.
