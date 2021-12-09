export type Notation = {
  regex: RegExp;
  parse: (match: RegExpExecArray) => any;
  format: (r: number, g: number, b: number, a: number) => string;
};

function rgb2hsl(_r: number, _g: number, _b: number) {
  let r = _r / 255,
    g = _g / 255,
    b = _b / 255,
    min = Math.min(r, g, b),
    max = Math.max(r, g, b),
    delta = max - min,
    h: number,
    s: number,
    l: number;

  if (max == min) h = 0;
  else if (r == max) h = (g - b) / delta;
  else if (g == max) h = 2 + (b - r) / delta;
  else if (b == max) h = 4 + (r - g) / delta;

  h = Math.min(h * 60, 360);

  if (h < 0) h += 360;

  l = (min + max) / 2;

  if (max == min) s = 0;
  else if (l <= 0.5) s = delta / (max + min);
  else s = delta / (2 - max - min);

  return [h, s * 100, l * 100];
}

function hsl2rgb(_h: number, _s: number, _l: number) {
  var h = _h / 360,
    s = _s / 100,
    l = _l / 100;

  let val: number;
  if (s == 0) {
    val = l * 255;
    return [val, val, val];
  }

  let t1: number, t2: number, t3: number;

  if (l < 0.5) t2 = l * (1 + s);
  else t2 = l + s - l * s;
  t1 = 2 * l - t2;

  let rgb = [0, 0, 0];
  for (var i = 0; i < 3; i++) {
    t3 = h + (1 / 3) * -(i - 1);
    t3 < 0 && t3++;
    t3 > 1 && t3--;

    if (6 * t3 < 1) val = t1 + (t2 - t1) * 6 * t3;
    else if (2 * t3 < 1) val = t2;
    else if (3 * t3 < 2) val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    else val = t1;

    rgb[i] = val * 255;
  }

  return rgb.map(Math.round);
}

const HSL = {
  // hsl(128, 128, 128)
  regex: /hsl\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*\)/gi,
  parse: (match: RegExpExecArray) => {
    const [h, s, l] = match.slice(1).map((n) => parseInt(n, 10));
    return hsl2rgb(h, s, l);
  },
  format: (r: number, g: number, b: number) => {
    return "hsl(" + rgb2hsl(r, g, b).join(", ") + ")";
  },
};

const RGB = {
  // rgb(255, 0, 0)
  regex: /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi,
  parse: (match: RegExpExecArray) => {
    return match.slice(1).map((n) => parseInt(n, 10));
  },
  format: (r: number, g: number, b: number) => {
    return "rgb(" + [r, g, b].join(", ") + ")";
  },
};

const RGBA = {
  // rgba(255, 0, 0, 0.5)
  regex: /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*\)/gi,
  parse: (match: RegExpExecArray) => {
    const [r, g, b, a] = match.slice(1).map((n) => parseInt(n, 10));
    return [r, g, b, a * 255];
  },
  format: (r: number, g: number, b: number, a: number) => {
    return "rgba(" + [r, g, b, (a / 255).toFixed(1)].join(", ") + ")";
  },
};
const HEX_RGB_SHORTHAND = {
  // #f00
  regex: /#([a-f0-9]{1})([a-f0-9]{1})([a-f0-9]{1})\b/gi,
  parse: (match: RegExpExecArray) => {
    return match.slice(1).map((n) => parseInt(n.repeat(2), 16));
  },
  format: (r: number, g: number, b: number) => {
    const formatted = [r, g, b].map((n) => n.toString(16).padStart(2, "0"));
    if (formatted.every((n) => n[0] === n[1])) {
      return "#" + formatted.map((n) => n[0]).join("");
    }
    return "#" + formatted.join("");
  },
};

const HEX_RGB = {
  // #ff0000
  regex: /#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})\b/gi,
  parse: (match: RegExpExecArray) => {
    return match.slice(1).map((n) => parseInt(n, 16));
  },
  format: (r: number, g: number, b: number) => {
    return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
  },
};

const HEX_RGBA = {
  // #ff000080
  regex: /#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})\b/gi,
  parse: (match: RegExpExecArray) => {
    return match.slice(1).map((n) => parseInt(n, 16));
  },
  format: (r: number, g: number, b: number, a: number) => {
    return (
      "#" + [r, g, b, a].map((n) => n.toString(16).padStart(2, "0")).join("")
    );
  },
};

export type Match = {
  notation: Notation;
  match: RegExpExecArray;
  range: [number, number];
};

function matchNotation(notation: Notation, text: string): Match[] {
  let results: Match[] = [];
  let match = notation.regex.exec(text);
  while (match !== null) {
    results.push({
      notation,
      match,
      range: [match.index, notation.regex.lastIndex],
    });
    match = notation.regex.exec(text);
  }
  return results;
}

export function matchColors(text: string): Match[] {
  return NOTATIONS.map((notation) =>
    matchNotation(notation, text)
  ).flatMap((x) => x).sort((a, b) => a.range[0] - b.range[0]);
}

export const NOTATIONS: Notation[] = [
  HSL,
  RGB,
  RGBA,
  HEX_RGB_SHORTHAND,
  HEX_RGB,
  HEX_RGBA,
];
