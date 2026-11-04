# Support for common programming languages

Current SDK: JavaScript ESM, with TypeScript declaration files (src/*.d.mts). Both browser and Node.js supported.

For Python, Java, Go and C#, a bounded, JSON-lines CLI can be used to prototype opt-in access from ordinary subprocesses, without modifying system clocks. This is an interoperability proof of concept rather than a native production SDK for those languages.

Install Node dependencies then run:

    printf '%s\n' '{"action":"toLunar","utc":"2026-11-05T00:00:00Z","mode":"phase"}' | node scripts/clock-cli.mjs

Other actions:
- fromLunar, with date: {cycleId,day,hour,minute,second,mode}
- add with utc, amount, unit, mode
- startOf with utc, unit, mode
- difference with left, right, unit, mode
- calendarGrid with utc, mode
- report with utc, mode, events: [{title, atUTC}]

Each line yields {"ok":true,"result":...} or {"ok":false,"error":{"name":...,"message":...}}. Bound the input size and report record count. Always store canonical real UTC in the host program.

Native language packages and existing-application migration are separate future tasks.
