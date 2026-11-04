# Architecture

The real CPU, UTC and OS clocks remain authoritative. Buddhist Clock maps UTC instants into an optional astronomical 28-day calendar. The browser is presentation only. Applications may call mapInstant and lunarToUTC, passing a cycle identifier and a mode to reverse the transformation.

A lunation is bounded by two consecutive geocentric full moons F0 and F1, defined by the ecliptic Moon–Sun longitude difference reaching 180 degrees.

For ordinary equal-duration mapping: fraction = (UTC - F0)/(F1 - F0).
For lunar-phase tracking mapping: fraction = ((phaseLongitude - 180) mod 360)/360.

The fraction is multiplied by 28 × 86400 to obtain virtual seconds. Each virtual month contains exactly four 7-day weeks. Moon direction is computed separately based on latitude and longitude. Lunar time never depends on observer location.

Implementation uses MIT Astronomy Engine and esbuild. npm run build bundles the entire mapper for local web hosting with no runtime dependency downloads.

Invariants: 1 ≤ day ≤ 28, 1 ≤ week ≤ 4, 1 ≤ weekday ≤ 7; UTC must remain canonical for timestamps and deadlines; phase and linear coordinates cannot be mixed; observer location must never change lunar date; all external business SLAs and security expiry use SI elapsed time.

Limitations: Device time synchronization, observer elevation, atmospheric refraction, and lunar-model differences matter to astronomical accuracy. The official Buddhist lunisolar calendar and Sri Lankan Poya dates are intentionally not reimplemented. Only 2026 Buddhist Era transition is curated; other years are provisional.

Non-goals: free CPU cycles from virtual time, physical time dilation measurement, replacement of OS timers, cryptocurrency clock, payment-processing clocks, precise certified astronomical observations.
