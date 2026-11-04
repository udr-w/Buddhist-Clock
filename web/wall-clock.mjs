/**
 * Visual-only wall-clock adapter. The astronomical mapper remains in src/clock.mjs.
 * Pure calculations are exported for testing; no OS clock is patched.
 */
export const CLOCK_MODES = Object.freeze(['phase', 'linear', 'utc']);
const TWO_PI = Math.PI * 2;
const pad = (v) => String(Math.floor(v)).padStart(2, '0');
const whole = (v) => Math.max(0, Math.min(59.999999, Number(v)));
export const displayTime = (hour, minute, second) =>
  [hour, minute, second].map(pad).join(':');

/** All three hands share a 12-hour analog dial, including on the UTC face. */
export function handAngles(hour, minute, second) {
  if (![hour, minute, second].every(Number.isFinite) ||
      hour < 0 || hour >= 24 || minute < 0 || minute >= 60 ||
      second < 0 || second >= 60) {
    throw new RangeError('Invalid 24h time for wall-clock hands');
  }
  return {
    hour: ((hour % 12) + minute / 60 + second / 3600) * 30,
    minute: (minute + second / 60) * 6,
    second: second * 6,
  };
}

export function nextClockMode(current, direction) {
  const index = CLOCK_MODES.indexOf(current);
  if (index < 0 || (direction !== 1 && direction !== -1)) {
    throw new RangeError('Invalid mode or swipe direction');
  }
  return CLOCK_MODES[(index + direction + CLOCK_MODES.length) % CLOCK_MODES.length];
}

/** One face model, with consistent UTC underpinning and no geolocation dependence. */
export function faceModel(instantMs, mode, mappedLunar) {
  if (!Number.isFinite(instantMs) || !CLOCK_MODES.includes(mode)) {
    throw new RangeError('Invalid wall-clock input');
  }
  const date = new Date(instantMs);
  const utc = mode === 'utc';
  const hour = utc ? date.getUTCHours() : mappedLunar.hour;
  const minute = utc ? date.getUTCMinutes() : mappedLunar.minute;
  const second = utc ? date.getUTCSeconds() + date.getUTCMilliseconds() / 1000 : whole(mappedLunar.second);
  const progress = utc
    ? ((hour * 60 + minute) * 60 + second) / 86400
    : mappedLunar.progress;
  const angles = handAngles(hour, minute, second);
  const lunarDay = mappedLunar.day;
  return {
    mode,
    hour, minute, second, progress, angles,
    digital: displayTime(hour, minute, second),
    day: utc ? date.getUTCDate() : lunarDay,
    period: utc ? 'UTC DAY' : 'LUNAR DAY',
    dayLabel: utc
      ? new Intl.DateTimeFormat('en-GB', { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' }).format(date)
      : pad(lunarDay) + ' / 28',
    name: utc ? 'Standard UTC' : mode === 'phase' ? 'Phase-tracking' : 'Evenly stretched',
    scale: utc ? 'SI SECONDS · UTC' : 'VIRTUAL HOURS · MINUTES · SECONDS',
  };
}

const polar = (radius, cycleFraction) => {
  const angle = TWO_PI * (cycleFraction - 0.25);
  return [250 + radius * Math.cos(angle), 250 + radius * Math.sin(angle)];
};

function svgLine(radius1, radius2, fraction, className) {
  const [x1, y1] = polar(radius1, fraction);
  const [x2, y2] = polar(radius2, fraction);
  return '<line class="' + className + '" x1="' + x1.toFixed(2) +
    '" y1="' + y1.toFixed(2) + '" x2="' + x2.toFixed(2) + '" y2="' + y2.toFixed(2) + '"/>';
}

function svgLabel(radius, fraction, label, className) {
  const [x, y] = polar(radius, fraction);
  return '<text x="' + x.toFixed(2) + '" y="' + y.toFixed(2) +
    '" class="' + className + '" text-anchor="middle" dominant-baseline="central">' +
    label + '</text>';
}

export function clockFaceSVG(mode) {
  if (!CLOCK_MODES.includes(mode)) throw new RangeError('Invalid clock face');
  const utc = mode === 'utc';
  const marks = [];
  if (utc) {
    for (let i = 0; i < 60; i++) {
      marks.push(svgLine(i % 5 === 0 ? 204 : 209, 218, i / 60, 'outer-tick' + (i % 5 === 0 ? ' major' : '')));
    }
    for (let i = 1; i <= 12; i++) {
      marks.push(svgLabel(232, (i % 12) / 12, String(i), 'outer-number'));
    }
  } else {
    for (let i = 0; i < 28; i++) {
      marks.push(svgLine(i % 7 === 0 ? 204 : 210, 218, i / 28, 'outer-tick' + (i % 7 === 0 ? ' major' : '')));
      marks.push(svgLabel(232, i / 28, pad(i + 1), 'outer-number' + (i === 0 ? ' epoch' : '')));
    }
  }
  // Separate 12-hour inner dial ensures hands can always be read like a wall clock.
  const inner = [];
  for (let i = 0; i < 60; i++) inner.push(svgLine(i % 5 === 0 ? 133 : 140, 147, i / 60, 'inner-tick' + (i % 5 === 0 ? ' major' : '')));
  for (let i = 1; i <= 12; i++) inner.push(svgLabel(161, (i % 12) / 12, String(i), 'inner-number'));

  return '<svg class="wall-svg" viewBox="0 0 500 500" role="img" aria-label="' + (utc ? 'UTC analog clock' : 'Lunar analog clock') + '">' +
    '<circle cx="250" cy="250" r="246" class="case-shadow"/>' +
    '<circle cx="250" cy="250" r="240" class="case-rim"/>' +
    '<circle cx="250" cy="250" r="224" class="face-rim"/>' +
    '<circle cx="250" cy="250" r="195" class="progress-track"/>' +
    '<circle cx="250" cy="250" r="195" class="progress-stroke" data-progress transform="rotate(-90 250 250)"/>' +
    marks.join('') +
    '<circle cx="250" cy="250" r="179" class="inner-face"/>' +
    inner.join('') +
    '<g data-hour-hand class="hour-hand">' +
      // Short, pointed hour hand with linked decorative apertures.
      '<path d="M250 253 C240 251 235 242 240 232 L242 223 C235 217 233 209 237 201 L244 189 L244 172 L250 150 L256 172 L256 189 L263 201 C267 209 265 217 258 223 L260 232 C265 242 260 251 250 253 Z" class="hand-metal hour-metal"/>' +
      '<circle cx="250" cy="209" r="10" class="hand-cutout"/>' +
      '<circle cx="250" cy="189" r="5" class="hand-cutout"/>' +
      '<path d="M244 255 L250 277 L256 255 Z" class="hand-metal hour-metal"/>' +
    '</g>' +
    '<g data-minute-hand class="minute-hand">' +
      // Long ornamental minute hand, hollowed circles and sinuous stem.
      '<path d="M250 253 C238 250 236 240 241 226 L244 212 C234 199 237 188 246 176 L241 161 C235 151 239 141 247 133 L250 104 L253 133 C261 141 265 151 259 161 L254 176 C263 188 266 199 256 212 L259 226 C264 240 262 250 250 253 Z" class="hand-metal minute-metal"/>' +
      '<circle cx="250" cy="207" r="9" class="hand-cutout"/>' +
      '<circle cx="250" cy="172" r="7" class="hand-cutout"/>' +
      '<circle cx="250" cy="146" r="4" class="hand-cutout"/>' +
      '<path d="M246 256 L250 293 L254 256 Z" class="hand-metal minute-metal"/>' +
    '</g>' +
    '<g data-second-hand class="second-hand">' +
      '<line x1="250" y1="314" x2="250" y2="83" class="second-line"/>' +
      '<rect x="247.4" y="257" width="5.2" height="57" rx="2.4" class="second-tail"/>' +
      '<circle cx="250" cy="182" r="7.5" class="second-jewel"/>' +
      '<circle cx="250" cy="182" r="3.5" class="second-jewel-core"/>' +
    '</g>' +
    '<circle cx="250" cy="250" r="12" class="pin-rim"/>' +
    '<circle cx="250" cy="250" r="6" class="pin-center"/>' +
    '</svg>';
}

export function mountClockFace(container, mode) {
  container.innerHTML = clockFaceSVG(mode);
}

export function paintClockFace(container, data) {
  const set = (query, angle) =>
    container.querySelector(query)?.setAttribute('transform', 'rotate(' + angle + ' 250 250)');
  set('[data-hour-hand]', data.angles.hour);
  set('[data-minute-hand]', data.angles.minute);
  set('[data-second-hand]', data.angles.second);
  const progress = container.querySelector('[data-progress]');
  if (progress) {
    const length = 2 * Math.PI * 195;
    progress.style.strokeDasharray = (data.progress * length) + ' ' + length;
  }
  const svg = container.querySelector('svg');
  if (svg) svg.setAttribute('aria-label', data.name + ' clock, ' + data.digital);
}
