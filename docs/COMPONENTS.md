# Date picker, calendar and reporting component research

Checked November 2026. This experimental moon-anchored 28-day calendar is not equivalent to any built-in Thai Buddhist Era, Islamic, or Gregorian calendar. Merely changing a locale or date format does not transform the underlying date model.

| Option | Existing capability | Fit for lunar clock |
|---|---|---|
| HTML input type=date | Civil/Gregorian calendar | No custom astronomical month model |
| React DayPicker | International calendars, including Thai Buddhist | Can reuse UI conventions, but requires a custom 28-day model |
| React Spectrum / React Aria | Custom calendar systems via createCalendar and @internationalized/date | BEST candidate for production accessible lunar calendar, requires a dedicated custom calendar implementation |
| MUI X Date Pickers | AdapterDayjsBuddhist changes Era label of Gregorian calendar | Not the experimental 28-day moon-anchored calendar |
| FullCalendar | Custom date-range views and event handling | Reuse event infrastructure; custom 28-virtual-day view needed |
| Intl.DateTimeFormat | Civil calendar locale/timezone/number systems | Useful for UTC reference and localized numbers, does not encode this new clock |
| Standard chart libraries | Charts and tables | Can render lunar SDK's already grouped report data |

Proof-of-concept decision: render a native, mobile responsive grid with 28 focusable buttons, native input fields, a semantic table, and CSS charts. All day boundaries, counts and conversions come from the framework-neutral SDK, not from Gregorian getDate().

For a production React interface, React Spectrum custom calendars are worth implementing after we specify lunar year/month identities, intercalation and virtual-time field semantics. Its existing built-in Buddhist calendar is not the same system.

The sample's day buttons support tab navigation and active/selected feedback; full keyboard grid navigation, screen reader tests, complete language translation, and RTL QA remain future work. A UI library cannot remove the need to design this new calendar domain first.

References:
- https://react-spectrum.adobe.com/Calendar
- https://react-spectrum.adobe.com/v3/releases/2025-04-11.html
- https://daypicker.dev/
- https://mui.com/x/react-date-pickers/calendar-systems/
- https://fullcalendar.io/docs/custom-views
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal
