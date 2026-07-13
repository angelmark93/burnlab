import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from "recharts";
import {
  Home, Dumbbell, Utensils, Trophy, TrendingUp, BookOpen, Settings,
  Play, Check, X, Plus, Info, Search, Award, Flame, Timer, Camera, ArrowUpRight, Weight, ScanLine,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trash2, Lock, Repeat, HelpCircle, Zap, CalendarDays,
} from "lucide-react";
import { BurnLabLogo } from "./components/ui/BurnLabLogo";

/* ---- device storage (localStorage) ---- */
const store = {
  async get(key) { const value = localStorage.getItem(key); if (value === null) throw new Error("not found"); return { key, value }; },
  async set(key, value) { localStorage.setItem(key, value); return { key, value }; },
  async delete(key) { localStorage.removeItem(key); return { key, deleted: true }; },
};

/* ================= DESIGN TOKENS ================= */
/* OLED Editorial palette — pure-black canvas, zinc cards, one high-voltage orange accent.
   Former semantic hues (blue/green/yellow) collapse to neutral zinc so the accent stands alone;
   yellow is repointed to the accent orange for warm-up/RPE flourishes. */
const C = {
  bg: "#000000", card: "#0C0C0E", card2: "#1C1C1F", line: "rgba(63,63,70,0.45)",
  text: "#FAFAFA", dim: "#A1A1AA", faint: "#52525B",
  red: "#F0603A", blue: "#A1A1AA", yellow: "#FF5722", green: "#A1A1AA",
  plate5: "#E4E4E7", plate25: "#71717A",
};
/* Cinematic Athletic type system: Anton (ultra-heavy condensed) carries every title + hero number;
   Archivo (modern grotesk) replaces Barlow for body/UI; IBM Plex Mono stays for data + metadata. */
/* NIKE custom display face carries titles + hero numbers (falls back to Anton); Archivo body/UI. */
const F = {
  brand: "'Archivo', sans-serif",
  disp: "'NIKE', 'Anton', sans-serif",
  body: "'Archivo', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};
/* Accent themes — orange is the default brand, with blue / green / yellow reinstated as options.
   Legacy saved keys (ember/ice/volt/violet) map onto the current set so old profiles still resolve. */
const ORANGE = { name: "Orange", a: "#FF5722", b: "#FF7A45" };
const ACCENTS = {
  ember:  ORANGE,
  ice:    { name: "Blue",   a: "#2E8BFF", b: "#5CC8FF" },
  volt:   { name: "Green",  a: "#22C55E", b: "#7CE88F" },
  violet: { name: "Yellow", a: "#F2B01E", b: "#FFD34D" },
};
/* soft elevation + accent-glow helpers, layered onto the flat card borders for a sleeker glass feel */
const SHADOW = {
  card: "0 1px 0 0 rgba(255,255,255,0.035) inset, 0 10px 28px -16px rgba(0,0,0,0.6)",
  hero: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 18px 40px -18px rgba(0,0,0,0.65)",
  glow: hex => "0 8px 22px -6px " + hex + "59",
  nav: "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 -10px 30px -12px rgba(0,0,0,0.55)",
  subtle: "0 2px 4px rgba(0,0,0,0.1)",
  lifted: "0 8px 16px rgba(0,0,0,0.3)",
};
/* motion + layout scales — the ad hoc paddings/radii/timings get consolidated onto these
   as each screen is touched (v4.0). Not a big-bang refactor; a shared vocabulary to reach for. */
const EASE = "cubic-bezier(0.22,0.9,0.3,1)";
const DUR = { micro: 150, standard: 350, hero: 700 };
const RADIUS = { sm: 10, md: 16, lg: 22, xl: 28, pill: 9999 };
const SPACE = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 };
/* Monochrome muscle identity — every muscle renders in the accent orange; the heat map now reads
   as intensity only (dormant zinc -> hot orange) rather than per-muscle hue. */
const MUSCLES = {
  Chest: "#FF5722", Back: "#FF5722", Shoulders: "#FF5722", Biceps: "#FF5722",
  Triceps: "#FF5722", Quads: "#FF5722", Hamstrings: "#FF5722", Glutes: "#FF5722",
  Calves: "#FF5722", Abs: "#FF5722",
};
/* Single-accent discipline — unlocked trophies all render in the accent orange (tier still labels
   difficulty in copy, but no competing metallic hues). */
const TIER = { bronze: "#FF5722", silver: "#FF5722", gold: "#FF5722", platinum: "#FF5722" };
const MUSCLE_GROUPS = {
  "Upper Body": ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Abs"],
  "Lower Body": ["Quads", "Hamstrings", "Glutes", "Calves"],
};

/* ================= EXERCISE PICTOGRAMS =================
   Minimal stick-figure line art, 120x120 viewBox.
   body = athlete (drawn in muscle colour), gear = equipment (neutral grey). */
const PICTO = {
  bench: {
    gear: <><line x1="18" y1="88" x2="102" y2="88"/><line x1="44" y1="46" x2="92" y2="46"/><line x1="46" y1="37" x2="46" y2="55"/><line x1="90" y1="37" x2="90" y2="55"/></>,
    body: <><circle cx="88" cy="76" r="8"/><line x1="30" y1="78" x2="76" y2="78"/><line x1="67" y1="76" x2="68" y2="50"/></>,
  },
  incline: {
    gear: <><line x1="24" y1="94" x2="72" y2="62"/><line x1="56" y1="30" x2="100" y2="30"/><line x1="58" y1="22" x2="58" y2="38"/><line x1="98" y1="22" x2="98" y2="38"/></>,
    body: <><circle cx="80" cy="54" r="8"/><line x1="34" y1="88" x2="70" y2="64"/><line x1="66" y1="62" x2="76" y2="34"/></>,
  },
  ohp: {
    gear: <><line x1="32" y1="20" x2="88" y2="20"/><line x1="36" y1="12" x2="36" y2="28"/><line x1="84" y1="12" x2="84" y2="28"/></>,
    body: <><circle cx="60" cy="38" r="8"/><line x1="60" y1="48" x2="60" y2="80"/><line x1="60" y1="52" x2="42" y2="24"/><line x1="60" y1="52" x2="78" y2="24"/><line x1="60" y1="80" x2="48" y2="104"/><line x1="60" y1="80" x2="72" y2="104"/></>,
  },
  latraise: {
    gear: <><line x1="22" y1="36" x2="22" y2="50"/><line x1="98" y1="36" x2="98" y2="50"/></>,
    body: <><circle cx="60" cy="26" r="8"/><line x1="60" y1="36" x2="60" y2="78"/><line x1="60" y1="47" x2="24" y2="43"/><line x1="60" y1="47" x2="96" y2="43"/><line x1="60" y1="78" x2="48" y2="104"/><line x1="60" y1="78" x2="72" y2="104"/></>,
  },
  fly: {
    gear: <><circle cx="26" cy="54" r="4"/><circle cx="94" cy="54" r="4"/></>,
    body: <><circle cx="60" cy="24" r="8"/><line x1="60" y1="34" x2="60" y2="78"/><path d="M60,46 Q38,38 27,51"/><path d="M60,46 Q82,38 93,51"/><line x1="60" y1="78" x2="48" y2="104"/><line x1="60" y1="78" x2="72" y2="104"/></>,
  },
  dip: {
    gear: <><line x1="32" y1="46" x2="32" y2="98"/><line x1="88" y1="46" x2="88" y2="98"/><line x1="22" y1="46" x2="42" y2="46"/><line x1="78" y1="46" x2="98" y2="46"/></>,
    body: <><circle cx="60" cy="30" r="8"/><line x1="60" y1="40" x2="60" y2="70"/><line x1="60" y1="45" x2="34" y2="49"/><line x1="60" y1="45" x2="86" y2="49"/><line x1="60" y1="70" x2="50" y2="90"/></>,
  },
  pushdown: {
    gear: <><line x1="80" y1="10" x2="80" y2="56"/><line x1="70" y1="58" x2="90" y2="58"/></>,
    body: <><circle cx="46" cy="28" r="8"/><line x1="46" y1="38" x2="46" y2="82"/><line x1="46" y1="50" x2="63" y2="53"/><line x1="63" y1="53" x2="79" y2="57"/><line x1="46" y1="82" x2="38" y2="104"/><line x1="46" y1="82" x2="56" y2="104"/></>,
  },
  hinge: {
    gear: <><circle cx="34" cy="84" r="11"/><line x1="45" y1="84" x2="64" y2="84"/></>,
    body: <><circle cx="38" cy="45" r="7"/><line x1="64" y1="74" x2="45" y2="53"/><line x1="64" y1="74" x2="66" y2="102"/><line x1="48" y1="56" x2="37" y2="76"/></>,
  },
  pullup: {
    gear: <><line x1="26" y1="18" x2="94" y2="18"/></>,
    body: <><circle cx="60" cy="33" r="7"/><line x1="44" y1="18" x2="55" y2="42"/><line x1="76" y1="18" x2="65" y2="42"/><line x1="60" y1="42" x2="60" y2="76"/><line x1="60" y1="76" x2="51" y2="98"/></>,
  },
  pulldown: {
    gear: <><line x1="60" y1="8" x2="60" y2="20"/><line x1="32" y1="20" x2="88" y2="20"/></>,
    body: <><circle cx="60" cy="44" r="8"/><line x1="60" y1="52" x2="38" y2="24"/><line x1="60" y1="52" x2="82" y2="24"/><line x1="60" y1="52" x2="60" y2="80"/><line x1="60" y1="80" x2="84" y2="82"/><line x1="84" y1="82" x2="84" y2="102"/></>,
  },
  row: {
    gear: <><circle cx="40" cy="88" r="10"/><line x1="50" y1="88" x2="70" y2="88"/></>,
    body: <><circle cx="40" cy="50" r="7"/><line x1="72" y1="74" x2="47" y2="57"/><line x1="72" y1="74" x2="74" y2="102"/><line x1="52" y1="60" x2="44" y2="80"/></>,
  },
  facepull: {
    gear: <><line x1="102" y1="34" x2="76" y2="42"/><line x1="76" y1="42" x2="66" y2="33"/><line x1="76" y1="42" x2="66" y2="51"/></>,
    body: <><circle cx="38" cy="34" r="8"/><line x1="38" y1="44" x2="38" y2="84"/><line x1="38" y1="52" x2="64" y2="42"/><line x1="38" y1="84" x2="30" y2="104"/><line x1="38" y1="84" x2="48" y2="104"/></>,
  },
  curl: {
    gear: <><line x1="74" y1="46" x2="82" y2="58"/></>,
    body: <><circle cx="54" cy="24" r="8"/><line x1="54" y1="34" x2="54" y2="78"/><line x1="54" y1="46" x2="58" y2="66"/><line x1="58" y1="66" x2="77" y2="52"/><line x1="54" y1="78" x2="44" y2="104"/><line x1="54" y1="78" x2="64" y2="104"/></>,
  },
  squat: {
    gear: <><line x1="26" y1="44" x2="94" y2="44"/><line x1="30" y1="36" x2="30" y2="52"/><line x1="90" y1="36" x2="90" y2="52"/></>,
    body: <><circle cx="60" cy="31" r="8"/><line x1="60" y1="48" x2="60" y2="68"/><line x1="60" y1="68" x2="42" y2="82"/><line x1="60" y1="68" x2="78" y2="82"/><line x1="42" y1="82" x2="42" y2="104"/><line x1="78" y1="82" x2="78" y2="104"/></>,
  },
  goblet: {
    gear: <><circle cx="60" cy="53" r="5"/></>,
    body: <><circle cx="60" cy="30" r="8"/><line x1="60" y1="40" x2="60" y2="68"/><line x1="60" y1="68" x2="42" y2="82"/><line x1="60" y1="68" x2="78" y2="82"/><line x1="42" y1="82" x2="42" y2="104"/><line x1="78" y1="82" x2="78" y2="104"/></>,
  },
  legpress: {
    gear: <><line x1="72" y1="26" x2="100" y2="54"/><line x1="26" y1="96" x2="52" y2="64"/></>,
    body: <><circle cx="54" cy="58" r="7"/><line x1="48" y1="66" x2="32" y2="88"/><line x1="34" y1="86" x2="60" y2="66"/><line x1="60" y1="66" x2="82" y2="46"/></>,
  },
  split: {
    gear: <><line x1="72" y1="76" x2="102" y2="76"/><line x1="78" y1="76" x2="78" y2="94"/><line x1="98" y1="76" x2="98" y2="94"/></>,
    body: <><circle cx="42" cy="30" r="8"/><line x1="42" y1="40" x2="44" y2="68"/><line x1="44" y1="68" x2="62" y2="78"/><line x1="62" y1="78" x2="60" y2="100"/><line x1="44" y1="68" x2="76" y2="74"/></>,
  },
  stepup: {
    gear: <><line x1="60" y1="72" x2="100" y2="72"/><line x1="100" y1="72" x2="100" y2="102"/><line x1="60" y1="72" x2="60" y2="102"/></>,
    body: <><circle cx="40" cy="26" r="8"/><line x1="40" y1="36" x2="40" y2="66"/><line x1="40" y1="66" x2="38" y2="100"/><line x1="40" y1="66" x2="58" y2="60"/><line x1="58" y1="60" x2="64" y2="72"/></>,
  },
  legext: {
    gear: <><line x1="34" y1="38" x2="34" y2="84"/><line x1="34" y1="84" x2="62" y2="84"/><line x1="92" y1="60" x2="98" y2="70"/></>,
    body: <><circle cx="42" cy="32" r="7"/><line x1="42" y1="41" x2="42" y2="82"/><line x1="42" y1="82" x2="68" y2="82"/><line x1="68" y1="82" x2="93" y2="64"/></>,
  },
  legcurl: {
    gear: <><line x1="34" y1="38" x2="34" y2="84"/><line x1="34" y1="84" x2="62" y2="84"/><line x1="80" y1="98" x2="90" y2="102"/></>,
    body: <><circle cx="42" cy="32" r="7"/><line x1="42" y1="41" x2="42" y2="82"/><line x1="42" y1="82" x2="68" y2="82"/><line x1="68" y1="82" x2="82" y2="100"/></>,
  },
  thrust: {
    gear: <><line x1="14" y1="66" x2="40" y2="66"/><circle cx="64" cy="42" r="10"/></>,
    body: <><circle cx="23" cy="55" r="7"/><line x1="34" y1="64" x2="64" y2="52"/><line x1="64" y1="52" x2="84" y2="62"/><line x1="84" y1="62" x2="84" y2="94"/></>,
  },
  calf: {
    gear: <><line x1="36" y1="90" x2="78" y2="90"/><line x1="78" y1="90" x2="78" y2="104"/></>,
    body: <><circle cx="56" cy="20" r="7"/><line x1="56" y1="28" x2="56" y2="62"/><line x1="56" y1="62" x2="62" y2="88"/><line x1="62" y1="88" x2="50" y2="80"/></>,
  },
  crunch: {
    gear: <><line x1="44" y1="10" x2="44" y2="30"/></>,
    body: <><circle cx="40" cy="40" r="7"/><path d="M52,78 Q62,56 46,46"/><line x1="52" y1="78" x2="48" y2="100"/><line x1="48" y1="100" x2="72" y2="102"/></>,
  },
  legraise: {
    gear: <><line x1="28" y1="16" x2="92" y2="16"/></>,
    body: <><circle cx="60" cy="29" r="6"/><line x1="46" y1="16" x2="56" y2="38"/><line x1="74" y1="16" x2="64" y2="38"/><line x1="60" y1="38" x2="60" y2="70"/><line x1="60" y1="70" x2="90" y2="62"/></>,
  },
  pushup: {
    gear: <><line x1="14" y1="98" x2="106" y2="98"/></>,
    body: <><circle cx="28" cy="57" r="7"/><line x1="36" y1="64" x2="94" y2="92"/><line x1="39" y1="66" x2="39" y2="98"/></>,
  },
  invrow: {
    gear: <><line x1="28" y1="56" x2="92" y2="56"/><line x1="28" y1="56" x2="28" y2="98"/><line x1="92" y1="56" x2="92" y2="98"/></>,
    body: <><circle cx="36" cy="69" r="7"/><line x1="44" y1="75" x2="86" y2="94"/><line x1="48" y1="77" x2="50" y2="58"/></>,
  },
  pike: {
    gear: <><line x1="14" y1="100" x2="106" y2="100"/></>,
    body: <><circle cx="30" cy="89" r="6"/><line x1="34" y1="96" x2="60" y2="48"/><line x1="60" y1="48" x2="90" y2="98"/></>,
  },
};

function Picto({ ex, size = 48 }) {
  const p = PICTO[ex.pattern] || PICTO.squat;
  const col = MUSCLES[ex.muscle] || C.dim;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <g stroke="#8A8F99" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none">{p.gear}</g>
      <g stroke={col} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none">{p.body}</g>
    </svg>
  );
}

/* ================= ANATOMY BODY DIAGRAM =================
   Simplified vector silhouette (overlapping rounded shapes, not anatomical
   paths) with flat-shaded, muscle-shaped regions on top - used both as the
   "target muscles" picker in onboarding and the muscle-heat map in Progress.
   Each region is a rough corner-point list smoothed into a closed blob via
   blobPath() (quadratic curves through edge midpoints) rather than hand-
   tuned bezier paths - quick to author, always renders a clean closed shape. */
function blobPath(pts) {
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const fmt = p => p[0].toFixed(1) + "," + p[1].toFixed(1);
  let d = "M" + fmt(mid(pts[n - 1], pts[0]));
  for (let i = 0; i < n; i++) {
    const cur = pts[i], next = pts[(i + 1) % n];
    d += " Q" + fmt(cur) + " " + fmt(mid(cur, next));
  }
  return d + " Z";
}
const mirrorX = pts => pts.map(([x, y]) => [160 - x, y]);
const SHOULDER_L = [[24, 50], [40, 45], [47, 55], [43, 71], [29, 74], [19, 63]];
const CHEST_L = [[44, 58], [77, 55], [77, 90], [57, 96], [42, 86], [38, 70]];
const ABS_PTS = [[65, 96], [95, 96], [93, 148], [80, 156], [67, 148]];
const BICEP_L = [[21, 68], [37, 64], [40, 94], [34, 114], [21, 107]];
const QUAD_L = [[51, 175], [75, 173], [77, 226], [69, 254], [55, 252], [50, 218]];
const BACK_PTS = [[48, 54], [80, 49], [112, 54], [105, 108], [80, 128], [55, 108]];
const TRICEP_L = [[21, 66], [38, 63], [41, 98], [35, 118], [21, 111]];
const GLUTES_PTS = [[53, 147], [80, 141], [107, 147], [109, 177], [80, 185], [51, 177]];
const HAM_L = [[53, 178], [75, 176], [77, 228], [69, 254], [57, 252], [51, 220]];
const CALF_L = [[57, 261], [71, 259], [73, 298], [67, 323], [59, 321], [55, 295]];
const MUSCLE_REGIONS = {
  front: [
    { m: "Shoulders", pts: SHOULDER_L }, { m: "Shoulders", pts: mirrorX(SHOULDER_L) },
    { m: "Chest", pts: CHEST_L }, { m: "Chest", pts: mirrorX(CHEST_L) },
    { m: "Biceps", pts: BICEP_L }, { m: "Biceps", pts: mirrorX(BICEP_L) },
    { m: "Abs", pts: ABS_PTS },
    { m: "Quads", pts: QUAD_L }, { m: "Quads", pts: mirrorX(QUAD_L) },
  ],
  back: [
    { m: "Shoulders", pts: SHOULDER_L }, { m: "Shoulders", pts: mirrorX(SHOULDER_L) },
    { m: "Back", pts: BACK_PTS },
    { m: "Triceps", pts: TRICEP_L }, { m: "Triceps", pts: mirrorX(TRICEP_L) },
    { m: "Glutes", pts: GLUTES_PTS },
    { m: "Hamstrings", pts: HAM_L }, { m: "Hamstrings", pts: mirrorX(HAM_L) },
    { m: "Calves", pts: CALF_L }, { m: "Calves", pts: mirrorX(CALF_L) },
  ],
};
/* Limbs built as stacks of overlapping, decreasing-radius circles rather than
   uniform-width rects - gives a tapered, fleshed-out look instead of a stick
   figure (same flat fill, no seams since the circles blend into one shape). */
/* Each limb = 2 generously-overlapping ellipses (upper + lower segment) plus
   a hand/foot cap - same blending trick as the torso, but with wide overlap
   margins so the taper reads as one continuous limb, not a bead chain. */
function Limb({ upper, lower, foot }) {
  return (
    <>
      <ellipse cx={upper[0]} cy={upper[1]} rx={upper[2]} ry={upper[3]} />
      <ellipse cx={lower[0]} cy={lower[1]} rx={lower[2]} ry={lower[3]} />
      <ellipse cx={foot[0]} cy={foot[1]} rx={foot[2]} ry={foot[3]} />
    </>
  );
}
function BodySilhouette({ fem }) {
  return fem ? (
    <g fill="#262A34">
      <ellipse cx="80" cy="24" rx="16" ry="18" />
      <rect x="71" y="39" width="18" height="12" rx="5" />
      <ellipse cx="80" cy="58" rx="37" ry="14" />
      <ellipse cx="80" cy="80" rx="29" ry="24" />
      <ellipse cx="80" cy="120" rx="18" ry="24" />
      <ellipse cx="80" cy="154" rx="31" ry="25" />
      <Limb upper={[30, 92, 12, 34]} lower={[28, 138, 8.5, 30]} foot={[32, 172, 8, 9]} />
      <Limb upper={[130, 92, 12, 34]} lower={[132, 138, 8.5, 30]} foot={[128, 172, 8, 9]} />
      <Limb upper={[63, 200, 17, 38]} lower={[65, 278, 9.5, 44]} foot={[64, 332, 13, 7]} />
      <Limb upper={[97, 200, 17, 38]} lower={[95, 278, 9.5, 44]} foot={[96, 332, 13, 7]} />
    </g>
  ) : (
    <g fill="#262A34">
      <ellipse cx="80" cy="24" rx="16" ry="18" />
      <rect x="71" y="39" width="18" height="12" rx="5" />
      <ellipse cx="80" cy="58" rx="46" ry="15" />
      <ellipse cx="80" cy="82" rx="37" ry="27" />
      <ellipse cx="80" cy="122" rx="24" ry="25" />
      <ellipse cx="80" cy="155" rx="29" ry="24" />
      <Limb upper={[23, 96, 15, 38]} lower={[20, 148, 10.5, 36]} foot={[25, 180, 10, 11]} />
      <Limb upper={[137, 96, 15, 38]} lower={[140, 148, 10.5, 36]} foot={[135, 180, 10, 11]} />
      <Limb upper={[63, 205, 19, 42]} lower={[65, 290, 11, 50]} foot={[63, 346, 14, 8]} />
      <Limb upper={[97, 205, 19, 42]} lower={[95, 290, 11, 50]} foot={[97, 346, 14, 8]} />
    </g>
  );
}
/* mode="pick": selected muscles glow `accent`, tap toggles via onToggle.
   mode="heat": every region colored by heatMap[muscle] = { ratio, daysSince }. */
function AnatomyBody({ fem, mode, selected = [], onToggle, accent, heatMap, size = 190 }) {
  const [view, setView] = useState("front");
  const [tap, setTap] = useState(null);
  const regions = MUSCLE_REGIONS[view];
  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-1 mb-3 rounded-full p-1" style={{ background: C.card2, border: "1px solid " + C.line }}>
        {["front", "back"].map(v => (
          <button key={v} type="button" onClick={() => { setView(v); setTap(null); }} className="px-4 py-1.5 rounded-full text-xs font-bold transition-colors"
            style={{ background: view === v ? C.text : "transparent", color: view === v ? C.bg : C.dim }}>
            {v === "front" ? "Front" : "Back"}
          </button>
        ))}
      </div>
      <svg width={size} height={Math.round(size * 366 / 160)} viewBox="0 0 160 366" role="img" aria-label={view + " body diagram"}>
        <BodySilhouette fem={fem} />
        {regions.map((r, i) => {
          const picked = mode === "pick" && selected.includes(r.m);
          const hot = mode === "heat" && heatMap && heatMap[r.m] && heatMap[r.m].ratio > 1.1;
          const color = mode === "pick" ? accent : heatColor((heatMap && heatMap[r.m] && heatMap[r.m].ratio) || 0, MUSCLES[r.m]);
          const fillOpacity = mode === "pick" ? (picked ? 0.92 : 0.12) : 0.92;
          return (
            <path key={r.m + i} d={blobPath(r.pts)} fill={color} fillOpacity={fillOpacity}
              stroke={mode === "pick" && !picked ? "none" : "#00000055"} strokeWidth="1" strokeLinejoin="round"
              className={hot ? "bl-pulse" : ""} style={{ cursor: "pointer", filter: hot ? "drop-shadow(0 0 6px " + color + "aa)" : "none" }}
              role="button" aria-label={r.m}
              onClick={() => (mode === "pick" ? onToggle && onToggle(r.m) : setTap(r.m))} />
          );
        })}
      </svg>
      {mode === "heat" && tap && heatMap && heatMap[tap] && (
        <div className="mt-2 text-center bl-fade">
          <span className="text-sm font-bold">{tap}</span>
          <span className="text-xs ml-2" style={{ color: C.dim, fontFamily: F.mono }}>
            {heatMap[tap].daysSince === Infinity ? "never trained" : "trained " + Math.round(heatMap[tap].daysSince) + "d ago"}
          </span>
        </div>
      )}
    </div>
  );
}

/* ================= EXERCISE LIBRARY ================= */
const EXERCISES = [
  // ---- PUSH ----
  { id: "bench", name: "Barbell Bench Press", muscle: "Chest", secondary: ["Triceps", "Shoulders"], equipment: "Barbell", barbell: true, pattern: "bench", alts: ["db-bench", "pushup"],
    cues: ["Retract and pin your shoulder blades to the bench, slight arch, feet planted.", "Lower the bar to the lower chest over ~2s, elbows ~45-70 degrees from torso.", "Touch, then press up and slightly back toward the rack without bouncing."],
    tip: "Treat it like a skill: same grip width, same touch point, every rep. Consistency drives long-term strength progression." },
  { id: "db-bench", name: "Flat Dumbbell Press", muscle: "Chest", secondary: ["Triceps", "Shoulders"], equipment: "Dumbbells", pattern: "bench", alts: ["bench", "pushup"],
    cues: ["Kick the dumbbells up as you lie back, stacked over the shoulders.", "Lower deep and controlled until you feel a stretch across the chest.", "Press up and slightly inward without clanking the bells together."],
    tip: "Dumbbells allow a deeper stretch than a bar - use that extra range, it's where the growth is." },
  { id: "pushup", name: "Push-Up", muscle: "Chest", secondary: ["Triceps", "Shoulders"], equipment: "Bodyweight", pattern: "pushup", alts: ["db-bench", "bench"],
    cues: ["Hands just outside shoulder width, body one straight line, glutes braced.", "Lower until the chest nearly touches the floor, elbows ~45 degrees.", "Press the floor away hard without the hips sagging or piking."],
    tip: "Past 15 easy reps, elevate your feet or add load (band or backpack) to stay in a growth-effective rep range." },
  { id: "incline-db", name: "Incline Dumbbell Press", muscle: "Chest", secondary: ["Shoulders", "Triceps"], equipment: "Dumbbells", pattern: "incline", alts: ["db-bench", "pushup"],
    cues: ["Set the bench to 30-45 degrees. Start with dumbbells stacked over the shoulders.", "Lower deep until you feel a stretch across the upper chest.", "Press up and slightly inward without letting the dumbbells clank."],
    tip: "The stretched bottom position is where most of the growth stimulus lives - don't cut the range short as you fatigue." },
  { id: "ohp", name: "Overhead Press", muscle: "Shoulders", secondary: ["Triceps"], equipment: "Barbell", barbell: true, pattern: "ohp", alts: ["db-shoulder", "pike-pushup"],
    cues: ["Grip just outside the shoulders, elbows slightly in front of the bar.", "Squeeze glutes and brace to keep the ribcage down - no back-bend.", "Press up, pull your head 'through the window', and lock out overhead."],
    tip: "If reps grind early, cut the set - technique decay on overhead work costs more than one extra rep gains." },
  { id: "db-shoulder", name: "Seated DB Shoulder Press", muscle: "Shoulders", secondary: ["Triceps"], equipment: "Dumbbells", pattern: "ohp", alts: ["pike-pushup", "ohp"],
    cues: ["Sit tall with back supported, dumbbells at ear height, palms forward.", "Press up until arms are straight but not slammed into lockout.", "Lower with control back to ear level - full range every rep."],
    tip: "A deeper bottom position (hands near ears) beats a shallow pump range for delt growth." },
  { id: "pike-pushup", name: "Pike Push-Up", muscle: "Shoulders", secondary: ["Triceps"], equipment: "Bodyweight", pattern: "pike", alts: ["db-shoulder", "ohp"],
    cues: ["Start in a push-up, walk feet in until hips are high - an inverted V.", "Bend the elbows and lower the crown of your head toward the floor.", "Press back up until the arms are straight. Elevate feet to progress."],
    tip: "The closest bodyweight analogue to an overhead press - the higher your hips, the more shoulder it becomes." },
  { id: "lat-raise", name: "Dumbbell Lateral Raise", muscle: "Shoulders", secondary: [], equipment: "Dumbbells", pattern: "latraise", alts: ["pike-pushup"],
    cues: ["Lean slightly forward, tiny bend in the elbows.", "Lead with the elbows, raising out to the side to just above parallel.", "Lower over 2-3 seconds - resist the drop."],
    tip: "Go light enough to avoid shrugging or swinging. Side delts respond well to high reps taken close to failure." },
  { id: "cable-fly", name: "Cable Fly", muscle: "Chest", secondary: [], equipment: "Cable", pattern: "fly", alts: ["incline-db", "pushup"],
    cues: ["Set cables just below shoulder height, split stance, slight forward lean.", "Open wide until you feel a deep pec stretch - elbows softly bent.", "Sweep the hands together in a hugging arc, squeeze for a beat."],
    tip: "Cables keep tension in the stretched position where flat dumbbell flyes lose it - a smart pairing with pressing." },
  { id: "dips", name: "Dips", muscle: "Chest", secondary: ["Triceps", "Shoulders"], equipment: "Bodyweight", pattern: "dip", alts: ["pushup", "db-bench"],
    cues: ["Lean the torso forward slightly to bias the chest.", "Lower until the shoulders are just below the elbows - feel the stretch.", "Press up without locking out violently; add weight when 10+ reps is easy."],
    tip: "Train depth gradually. Stop where you feel a strong stretch without shoulder pinching, then expand over weeks." },
  { id: "pushdown", name: "Cable Triceps Pushdown", muscle: "Triceps", secondary: [], equipment: "Cable", pattern: "pushdown", alts: ["dips", "skull"],
    cues: ["Elbows pinned to your sides, slight forward lean.", "Push down to full elbow lockout - the last 15 degrees matters most.", "Let the cable pull your hands up to full flexion under control."],
    tip: "Full lockout with a 1-second squeeze recruits the triceps' lateral head hard. Don't let the elbows drift forward." },
  { id: "oh-ext", name: "Overhead Cable Extension", muscle: "Triceps", secondary: [], equipment: "Cable", pattern: "pushdown", alts: ["skull", "dips"],
    cues: ["Face away from the stack, arms overhead, elbows close to the head.", "Lower the handle behind you until you feel a big triceps stretch.", "Extend to lockout without flaring the elbows out."],
    tip: "Overhead work trains the long head at long muscle lengths - evidence favours stretch-focused triceps training for growth." },
  { id: "skull", name: "EZ-Bar Skull Crusher", muscle: "Triceps", secondary: [], equipment: "EZ Bar", pattern: "pushdown", alts: ["oh-ext", "dips"],
    cues: ["Lower the bar behind the top of your head, not to the forehead.", "Keep upper arms angled slightly back and locked in place.", "Extend without letting the elbows flare or drift."],
    tip: "Lowering behind the head keeps tension on the long head through a bigger stretch - easier on the elbows too." },

  // ---- PULL ----
  { id: "deadlift", name: "Conventional Deadlift", muscle: "Back", secondary: ["Hamstrings", "Glutes"], equipment: "Barbell", barbell: true, pattern: "hinge", alts: ["db-rdl", "rdl"],
    cues: ["Bar over mid-foot, shins to the bar, lats locked ('protect your armpits').", "Big brace, then push the floor away - bar drags up the legs.", "Finish tall with glutes, no lean-back. Reset each rep from a dead stop."],
    tip: "Keep deadlifts at RPE 7-8 in hypertrophy blocks. Grinding max singles adds fatigue faster than it adds muscle." },
  { id: "pullup", name: "Pull-Up", muscle: "Back", secondary: ["Biceps"], equipment: "Bodyweight", pattern: "pullup", alts: ["lat-pulldown", "inverted-row"],
    cues: ["Start from a dead hang, grip just outside the shoulders.", "Drive the elbows down toward your hips, chest to the bar.", "Lower all the way to a full stretch - no half hangs."],
    tip: "Once you clear ~10 clean reps, add weight with a belt and keep working in the 6-10 range instead of chasing endurance." },
  { id: "chin-up", name: "Chin-Up", muscle: "Biceps", secondary: ["Back"], equipment: "Bodyweight", pattern: "pullup", alts: ["curl", "db-curl"],
    cues: ["Underhand grip at shoulder width, start from a dead hang.", "Pull the chin over the bar, leading with the elbows.", "Lower slowly to a full stretch at the bottom of every rep."],
    tip: "The closest bodyweight move to a curl - the biceps work through a huge stretch under heavy load." },
  { id: "lat-pulldown", name: "Lat Pulldown", muscle: "Back", secondary: ["Biceps"], equipment: "Cable", pattern: "pulldown", alts: ["pullup", "db-row"],
    cues: ["Slight lean back, chest up, grip just outside shoulders.", "Pull the bar to the upper chest, elbows driving down and in.", "Control the way up until arms are fully stretched overhead."],
    tip: "Think about pulling with your elbows, not your hands - it shifts work from the arms into the lats." },
  { id: "row", name: "Barbell Row", muscle: "Back", secondary: ["Biceps"], equipment: "Barbell", barbell: true, pattern: "row", alts: ["db-row", "inverted-row"],
    cues: ["Hinge to ~30-45 degrees torso angle, bar hanging under the shoulders.", "Pull the bar to the lower ribs, squeezing the shoulder blades.", "Lower under control - no torso heaving to move the weight."],
    tip: "A little body English on the last rep or two is fine; a lot on every rep means the weight is doing the rowing, not your back." },
  { id: "db-row", name: "One-Arm Dumbbell Row", muscle: "Back", secondary: ["Biceps"], equipment: "Dumbbells", pattern: "row", alts: ["row", "cable-row"],
    cues: ["One hand and knee on a bench, flat back, dumbbell hanging under the shoulder.", "Pull the elbow up and back toward your hip - not straight up.", "Lower to a full stretch, letting the shoulder blade reach at the bottom."],
    tip: "The supported position lets you push rows close to failure safely - a home-gym staple for good reason." },
  { id: "inverted-row", name: "Inverted Row", muscle: "Back", secondary: ["Biceps"], equipment: "Bodyweight", pattern: "invrow", alts: ["cable-row", "db-row"],
    cues: ["Hang under a bar or sturdy table edge, body straight, heels on the floor.", "Pull your chest to the bar, squeezing the shoulder blades together.", "Lower under control. Walk feet further forward to make it harder."],
    tip: "Adjust difficulty instantly by changing body angle - more horizontal is harder. Full-range strict reps beat kipping half reps." },
  { id: "cable-row", name: "Seated Cable Row", muscle: "Back", secondary: ["Biceps"], equipment: "Cable", pattern: "row", alts: ["db-row", "inverted-row"],
    cues: ["Sit tall, slight forward reach at the start for a lat stretch.", "Drive the elbows back, handle to the belly button.", "Pause, then let the weight pull you into a controlled stretch."],
    tip: "Letting the shoulder blades protract at the start loads the lats through a longer range - stretch is stimulus." },
  { id: "face-pull", name: "Face Pull", muscle: "Shoulders", secondary: ["Back"], equipment: "Cable", pattern: "facepull", alts: ["inverted-row"],
    cues: ["Set the rope at upper-chest to face height.", "Pull toward your eyes while pulling the rope ends apart.", "Finish in a 'double biceps' position, thumbs pointing back."],
    tip: "Rear delts and external rotators get neglected by pressing-heavy programs - face pulls are cheap insurance for shoulder health." },
  { id: "curl", name: "EZ-Bar Curl", muscle: "Biceps", secondary: [], equipment: "EZ Bar", pattern: "curl", alts: ["db-curl", "chin-up"],
    cues: ["Elbows at your sides - they stay there for the whole set.", "Curl to full flexion, squeeze at the top.", "Lower over 2-3 seconds until arms are fully straight."],
    tip: "The lowering phase is half the rep. Rushing the eccentric quietly deletes most of a curl's stimulus." },
  { id: "db-curl", name: "Incline Dumbbell Curl", muscle: "Biceps", secondary: [], equipment: "Dumbbells", pattern: "curl", alts: ["curl", "hammer"],
    cues: ["Lie back on a 45-60 degree bench, arms hanging straight down.", "Curl without letting the elbows drift forward.", "Lower all the way to a deep stretch at the bottom."],
    tip: "The incline puts the biceps' long head under stretch at the bottom - a stretched position most curls never reach." },
  { id: "hammer", name: "Hammer Curl", muscle: "Biceps", secondary: [], equipment: "Dumbbells", pattern: "curl", alts: ["db-curl", "chin-up"],
    cues: ["Neutral grip, palms facing each other throughout.", "Curl across slightly toward the opposite shoulder or straight up.", "Control down - no swinging at the hips."],
    tip: "Neutral-grip work hits the brachialis and forearms, adding visible arm thickness that supinated curls miss." },

  // ---- LEGS & CORE ----
  { id: "squat", name: "Barbell Back Squat", muscle: "Quads", secondary: ["Glutes"], equipment: "Barbell", barbell: true, pattern: "squat", alts: ["goblet", "split-squat"],
    cues: ["Bar locked on the traps, big breath and brace before every rep.", "Sit down between the hips, knees tracking over the toes.", "Hit depth (hip crease below knee if mobility allows), drive up hard."],
    tip: "Deep squats out-build partial squats rep for rep. If depth is the limit, reduce load and own the full range first." },
  { id: "goblet", name: "Goblet Squat", muscle: "Quads", secondary: ["Glutes"], equipment: "Dumbbells", pattern: "goblet", alts: ["squat", "split-squat"],
    cues: ["Hold one dumbbell vertically against your chest, elbows tucked.", "Squat deep between the knees, torso tall - the weight counterbalances you.", "Drive up through the whole foot, chest proud the whole way."],
    tip: "The front-loaded weight makes deep, upright squatting easier - one of the best-teaching squat variations there is." },
  { id: "rdl", name: "Romanian Deadlift", muscle: "Hamstrings", secondary: ["Glutes", "Back"], equipment: "Barbell", barbell: true, pattern: "hinge", alts: ["db-rdl", "glute-bridge"],
    cues: ["Soft knees, push the hips straight back - the bar stays on the thighs.", "Lower until you feel a strong hamstring stretch (usually mid-shin).", "Drive the hips forward to stand, squeezing glutes at the top."],
    tip: "It's a hinge, not a squat: if your knees travel forward, you've turned it into a different exercise." },
  { id: "db-rdl", name: "Dumbbell RDL", muscle: "Hamstrings", secondary: ["Glutes", "Back"], equipment: "Dumbbells", pattern: "hinge", alts: ["rdl", "glute-bridge"],
    cues: ["Dumbbells resting on the front of the thighs, soft knees.", "Hips straight back, bells sliding down the legs until the hamstrings bite.", "Stand tall by driving the hips through - no yanking with the back."],
    tip: "Slow 3-second lowers make moderate dumbbells feel brutal - perfect when you can't load a bar heavy." },
  { id: "legpress", name: "Leg Press", muscle: "Quads", secondary: ["Glutes"], equipment: "Machine", pattern: "legpress", alts: ["goblet", "step-up"],
    cues: ["Feet mid-platform, shoulder width.", "Lower deep - knees toward the chest - without the hips rolling off the pad.", "Press through the whole foot, stopping just short of a hard knee lockout."],
    tip: "Because balance isn't a limit, leg press is ideal for pushing close to failure safely late in a session." },
  { id: "split-squat", name: "Bulgarian Split Squat", muscle: "Quads", secondary: ["Glutes"], equipment: "Bodyweight", pattern: "split", alts: ["goblet", "step-up"],
    cues: ["Rear foot on a bench or chair, front foot far enough forward to stay balanced.", "Drop the back knee straight down until the rear hip stretches.", "Drive up through the front heel. All reps one side, then switch. Hold dumbbells to progress."],
    tip: "Brutal but efficient: unilateral work exposes and fixes side-to-side imbalances that barbells hide." },
  { id: "step-up", name: "Dumbbell Step-Up", muscle: "Quads", secondary: ["Glutes"], equipment: "Dumbbells", pattern: "stepup", alts: ["split-squat", "legpress"],
    cues: ["Use a knee-height box or bench, dumbbells at your sides.", "Drive through the top foot's heel - don't push off the bottom leg.", "Lower under control over 2 seconds. All reps one side, then switch."],
    tip: "Kill the bounce off the back leg and step-ups become one of the most honest single-leg quad builders around." },
  { id: "leg-ext", name: "Leg Extension", muscle: "Quads", secondary: [], equipment: "Machine", pattern: "legext", alts: ["step-up", "split-squat"],
    cues: ["Pad on the shins, knees lined up with the machine's pivot.", "Extend to a full squeeze at the top - pause a beat.", "Lower deep and slow into the stretched position."],
    tip: "The rectus femoris barely works in squats - extensions are one of the only ways to fully train it." },
  { id: "leg-curl", name: "Seated Leg Curl", muscle: "Hamstrings", secondary: [], equipment: "Machine", pattern: "legcurl", alts: ["db-rdl", "glute-bridge"],
    cues: ["Thigh pad snug, sit tall against the back rest.", "Curl the heels under you to full flexion.", "Return slowly, letting the hamstrings stretch fully at the top."],
    tip: "Seated beats lying curls for growth in research - the bent-hip position trains the hamstrings at longer lengths." },
  { id: "hip-thrust", name: "Barbell Hip Thrust", muscle: "Glutes", secondary: ["Hamstrings"], equipment: "Barbell", barbell: true, pattern: "thrust", alts: ["glute-bridge"],
    cues: ["Upper back on a bench, bar padded over the hips.", "Drive through the heels to a flat tabletop - ribs down, chin tucked.", "Squeeze the glutes hard for a full second at the top."],
    tip: "Posterior pelvic tilt at lockout (tuck the tailbone) is what separates a glute exercise from a lower-back one." },
  { id: "glute-bridge", name: "Glute Bridge", muscle: "Glutes", secondary: ["Hamstrings"], equipment: "Bodyweight", pattern: "thrust", alts: ["hip-thrust"],
    cues: ["Lie on your back, heels close to the glutes.", "Drive the hips up to a straight line from knees to shoulders.", "Squeeze hard at the top for a second; add a dumbbell on the hips to progress."],
    tip: "Slow it down and pause every rep - momentum is the main reason bridges 'stop working'." },
  { id: "calf", name: "Standing Calf Raise", muscle: "Calves", secondary: [], equipment: "Machine", pattern: "calf", alts: ["sl-calf"],
    cues: ["Balls of the feet on the edge, heels hanging free.", "Sink into a deep 2-second stretch at the bottom.", "Drive up to full tip-toe height, pause, lower slow."],
    tip: "Calves grow from the deep stretched position, not from bouncing. Pause at the bottom of every rep." },
  { id: "sl-calf", name: "Single-Leg Calf Raise", muscle: "Calves", secondary: [], equipment: "Bodyweight", pattern: "calf", alts: ["calf"],
    cues: ["Stand on one foot on a step edge, heel hanging free, fingertips on a wall for balance.", "Deep 2-second stretch at the bottom of every rep.", "Drive to full height and pause. Hold a dumbbell to progress."],
    tip: "One leg at a time doubles the load without any equipment - most people find these harder than the machine." },
  { id: "cable-crunch", name: "Cable Crunch", muscle: "Abs", secondary: [], equipment: "Cable", pattern: "crunch", alts: ["leg-raise"],
    cues: ["Kneel below the cable, rope beside your head.", "Crunch the ribs toward the pelvis - flex the spine, don't hinge the hips.", "Return under control to a tall stretch."],
    tip: "Abs are muscles like any other: load them, progress the weight, and train them in the 8-15 range." },
  { id: "leg-raise", name: "Hanging Leg Raise", muscle: "Abs", secondary: [], equipment: "Bodyweight", pattern: "legraise", alts: ["cable-crunch"],
    cues: ["Dead hang, then curl the pelvis up as the legs rise.", "Bring the feet (or knees) toward the bar without swinging.", "Lower over 2-3 seconds to kill momentum."],
    tip: "The pelvis tucking upward is the ab work - leg lifting with a fixed pelvis is mostly hip flexor." },
];
const EX = Object.fromEntries(EXERCISES.map(e => [e.id, e]));

/* ================= PROGRAMS ================= */
const P = (ex, sets, lo, hi, rpe, rest) => ({ ex, sets, lo, hi, rpe, rest });
const PROGRAMS = {
  ppl: {
    name: "Push / Pull / Legs", short: "PPL", freq: "3-6 days / week",
    blurb: "The classic hypertrophy split. Run it 6 days for maximum volume, or 3 days rotating.",
    days: [
      { id: "push", name: "Push", items: [
        P("bench", 4, 5, 8, 8, 180), P("incline-db", 3, 8, 12, 8, 120), P("lat-raise", 3, 12, 20, 9, 75),
        P("cable-fly", 3, 10, 15, 9, 90), P("pushdown", 3, 10, 15, 9, 90), P("oh-ext", 2, 10, 15, 9, 90),
      ]},
      { id: "pull", name: "Pull", items: [
        P("deadlift", 3, 4, 6, 7, 240), P("pullup", 3, 6, 10, 8, 150), P("cable-row", 3, 8, 12, 8, 120),
        P("face-pull", 3, 12, 20, 9, 75), P("curl", 3, 8, 12, 9, 90), P("hammer", 2, 10, 15, 9, 75),
      ]},
      { id: "legs", name: "Legs", items: [
        P("squat", 4, 5, 8, 8, 210), P("rdl", 3, 8, 10, 8, 150), P("legpress", 3, 10, 12, 9, 120),
        P("leg-curl", 3, 10, 15, 9, 90), P("calf", 4, 10, 15, 9, 75), P("cable-crunch", 3, 10, 15, 9, 60),
      ]},
    ],
  },
  ul: {
    name: "Upper / Lower", short: "U/L", freq: "4 days / week",
    blurb: "Every muscle twice a week with big rest days - the evidence-based sweet spot for most lifters.",
    days: [
      { id: "upper", name: "Upper", items: [
        P("bench", 4, 5, 8, 8, 180), P("row", 4, 6, 10, 8, 150), P("ohp", 3, 6, 10, 8, 150),
        P("lat-pulldown", 3, 8, 12, 8, 120), P("lat-raise", 3, 12, 20, 9, 75), P("curl", 3, 8, 12, 9, 75), P("pushdown", 3, 10, 15, 9, 75),
      ]},
      { id: "lower", name: "Lower", items: [
        P("squat", 4, 5, 8, 8, 210), P("rdl", 3, 8, 10, 8, 150), P("split-squat", 3, 8, 12, 8, 120),
        P("leg-ext", 3, 10, 15, 9, 90), P("leg-curl", 3, 10, 15, 9, 90), P("calf", 4, 10, 15, 9, 75),
      ]},
    ],
  },
  fb: {
    name: "Full Body", short: "FB", freq: "3 days / week",
    blurb: "High frequency, minimal time. Every session hits everything - perfect around a busy schedule.",
    days: [
      { id: "fb1", name: "Full Body A", items: [
        P("squat", 3, 5, 8, 8, 210), P("bench", 3, 5, 8, 8, 180), P("cable-row", 3, 8, 12, 8, 120),
        P("lat-raise", 3, 12, 20, 9, 75), P("curl", 2, 10, 15, 9, 75),
      ]},
      { id: "fb2", name: "Full Body B", items: [
        P("deadlift", 3, 4, 6, 7, 240), P("ohp", 3, 6, 10, 8, 150), P("pullup", 3, 6, 10, 8, 150),
        P("leg-ext", 3, 12, 15, 9, 90), P("pushdown", 2, 10, 15, 9, 75),
      ]},
      { id: "fb3", name: "Full Body C", items: [
        P("legpress", 3, 10, 12, 9, 120), P("incline-db", 3, 8, 12, 8, 120), P("lat-pulldown", 3, 8, 12, 8, 120),
        P("leg-curl", 3, 10, 15, 9, 90), P("hammer", 2, 10, 15, 9, 75),
      ]},
    ],
  },
};

const SCIENCE = [
  "Take most sets 1-3 reps from failure (RPE 7-9). Save true failure for the last set of isolation work.",
  "Aim for 10-20 hard sets per muscle per week. Past that, fatigue grows faster than muscle.",
  "Control the lowering phase - 2-3 seconds down is worth more than 5 extra kilos moved badly.",
  "Hit the top of the rep range at target RPE? Add weight next session and start the range again.",
  "Full range of motion - especially the deep stretch - beats heavy partials for growth.",
  "Rest 2-3 min on big compounds, 60-90s on isolation. Recover enough to actually push the next set.",
  "Progressive overload is the whole game: beat the logbook by a rep or a plate, week after week.",
  "Protein target: roughly 1.6-2.2 g per kg of bodyweight per day, spread over 3-5 meals.",
];

/* ================= NUTRITION ================= */
const MEALS = {
  cut: { label: "Fat Loss", note: "High protein, high volume - built to keep you full in a deficit.",
    meals: [
      { t: "Breakfast", n: "Greek Yoghurt Power Bowl", d: "300g 0% Greek yoghurt, mixed berries, 30g granola, honey drizzle", kcal: 430, p: 42 },
      { t: "Lunch", n: "Chicken Burrito Bowl", d: "180g chicken breast, 150g cooked rice, black beans, salsa, lettuce", kcal: 560, p: 52 },
      { t: "Snack", n: "Shake & Fruit", d: "1 scoop whey in water, 1 apple or banana", kcal: 220, p: 26 },
      { t: "Dinner", n: "Salmon, Potatoes & Greens", d: "160g salmon fillet, 250g baby potatoes, broccoli or green beans", kcal: 590, p: 40 },
    ]},
  maintain: { label: "Recomp / Maintain", note: "Balanced fuel - enough carbs to train hard, enough protein to rebuild.",
    meals: [
      { t: "Breakfast", n: "Protein Oats", d: "80g oats cooked, 1 scoop whey stirred in, banana, cinnamon", kcal: 520, p: 38 },
      { t: "Lunch", n: "Turkey & Avocado Wraps", d: "2 wraps: 150g turkey, avocado, spinach, light mayo", kcal: 620, p: 45 },
      { t: "Snack", n: "Cottage Cheese & Rice Cakes", d: "200g cottage cheese, 3 rice cakes, sliced tomato", kcal: 280, p: 28 },
      { t: "Dinner", n: "Beef Stir-Fry & Noodles", d: "180g lean beef strips, mixed veg, egg noodles, soy & ginger", kcal: 680, p: 46 },
    ]},
  bulk: { label: "Muscle Gain", note: "A modest surplus - eat like you train: consistently, not chaotically.",
    meals: [
      { t: "Breakfast", n: "Big Protein Oats", d: "100g oats, 1 scoop whey, banana, 25g peanut butter", kcal: 700, p: 42 },
      { t: "Lunch", n: "Chicken Pesto Pasta", d: "200g chicken breast, 120g dry pasta, pesto, parmesan", kcal: 780, p: 58 },
      { t: "Snack", n: "Mass Shake", d: "1 scoop whey, 50g oats, whole milk, frozen berries - blended", kcal: 480, p: 36 },
      { t: "Dinner", n: "Beef Burrito Bowl", d: "200g lean beef mince, 200g rice, black beans, cheese, guac", kcal: 820, p: 52 },
      { t: "Evening", n: "Yoghurt & Granola", d: "200g Greek yoghurt, 30g granola, honey", kcal: 300, p: 20 },
    ]},
};
const GOAL_MEAL = { cut: "cut", build: "bulk", recomp: "maintain", strength: "maintain" };
const GOAL_LABEL = { cut: "Lose fat", build: "Build muscle", recomp: "Recomposition", strength: "Get stronger" };

/* ================= FOOD DATABASE =================
   Typical per-100g values (cooked unless stated). Labels vary - users should
   trust their packaging over these numbers for branded items. */
const FD = (i, n, k, p, c, f, sl, sg) => ({ i, n, k, p, c, f, sl, sg });
const FOODS = [
  // proteins
  FD("chicken-breast","Chicken Breast",165,31,0,3.6,"1 fillet",150), FD("chicken-thigh","Chicken Thigh",209,26,0,11,"1 thigh",100),
  FD("turkey-breast","Turkey Breast",147,30,0,2,"1 serving",125), FD("beef-mince-5","Beef Mince 5%",137,21,0,5,"1 serving",125),
  FD("beef-mince-20","Beef Mince 20%",254,17,0,20,"1 serving",125), FD("beef-steak","Beef Steak (sirloin)",201,29,0,9,"1 steak",200),
  FD("pork-loin","Pork Loin",173,27,0,7,"1 chop",150), FD("bacon","Bacon (back, grilled)",214,26,0,12,"2 rashers",50),
  FD("salmon","Salmon Fillet",208,20,0,13,"1 fillet",130), FD("cod","Cod Fillet",90,20,0,0.7,"1 fillet",140),
  FD("tuna-tin","Tuna (tinned in water)",109,25,0,0.5,"1 tin drained",112), FD("prawns","Prawns",85,20,0,0.6,"1 serving",100),
  FD("egg","Eggs",143,13,0.7,10,"1 large egg",56), FD("egg-white","Egg Whites",52,11,0.7,0.2,"1 white",33),
  FD("tofu","Tofu (firm)",117,12,2,7,"half block",150), FD("quorn","Quorn Pieces",92,14,4,2,"1 serving",100),
  FD("ham","Ham Slices",107,19,1,3,"2 slices",50),
  // carbs
  FD("rice-white","White Rice",130,2.7,28,0.3,"1 serving cooked",180), FD("rice-brown","Brown Rice",112,2.6,24,0.9,"1 serving cooked",180),
  FD("pasta","Pasta",158,5.8,31,0.9,"1 serving cooked",180), FD("oats","Oats (dry)",379,13,68,7,"1 serving",50),
  FD("bread-white","White Bread",265,9,49,3.2,"1 slice",40), FD("bread-whole","Wholemeal Bread",247,11,41,3.5,"1 slice",40),
  FD("bagel","Bagel",275,11,53,1.5,"1 bagel",85), FD("wrap","Tortilla Wrap",310,8,52,7,"1 wrap",64),
  FD("potato","Potato (boiled)",87,1.9,20,0.1,"1 medium",180), FD("sweet-potato","Sweet Potato",90,2,21,0.2,"1 medium",180),
  FD("chips-oven","Oven Chips",162,2.5,27,4.5,"1 serving",150), FD("rice-cakes","Rice Cakes",387,8,81,3,"1 cake",8),
  FD("couscous","Couscous",112,3.8,23,0.2,"1 serving cooked",150), FD("noodles","Egg Noodles",138,4.5,25,2,"1 nest cooked",150),
  FD("quinoa","Quinoa",120,4.4,21,1.9,"1 serving cooked",150), FD("cereal","Cornflakes",357,7,84,0.9,"1 bowl",30),
  FD("granola","Granola",471,10,60,20,"1 serving",45), FD("crumpet","Crumpet",180,6,38,0.8,"1 crumpet",55),
  // dairy
  FD("milk-semi","Semi-Skimmed Milk",47,3.6,4.8,1.8,"1 glass",250), FD("milk-whole","Whole Milk",64,3.3,4.7,3.6,"1 glass",250),
  FD("yog-greek0","Greek Yoghurt 0%",57,10,4,0.2,"1 pot",170), FD("yog-greek","Greek Yoghurt (full fat)",97,9,3.8,5,"1 pot",170),
  FD("skyr","Skyr",63,11,4,0.2,"1 pot",150), FD("cottage","Cottage Cheese",98,11,3.4,4.3,"half tub",150),
  FD("cheddar","Cheddar Cheese",416,25,0.1,35,"matchbox piece",30), FD("mozzarella","Mozzarella",280,18,2,22,"half ball",62),
  FD("feta","Feta",264,14,4,21,"quarter block",50), FD("butter","Butter",744,0.6,0.6,82,"thin spread",7),
  // fruit & veg
  FD("banana","Banana",89,1.1,23,0.3,"1 medium",118), FD("apple","Apple",52,0.3,14,0.2,"1 medium",180),
  FD("orange","Orange",47,0.9,12,0.1,"1 medium",130), FD("berries","Mixed Berries",43,1,10,0.3,"1 handful",80),
  FD("grapes","Grapes",69,0.7,18,0.2,"1 handful",80), FD("avocado","Avocado",160,2,9,15,"half",70),
  FD("broccoli","Broccoli",35,2.8,7,0.4,"1 serving",90), FD("spinach","Spinach",23,2.9,3.6,0.4,"1 serving",80),
  FD("mixed-veg","Mixed Vegetables",42,2.5,7,0.5,"1 serving",120), FD("salad","Side Salad (no dressing)",17,1.2,3,0.2,"1 bowl",100),
  FD("tomato","Tomato",18,0.9,3.9,0.2,"1 medium",120), FD("carrot","Carrot",41,0.9,10,0.2,"1 medium",60),
  FD("peas","Garden Peas",81,5.4,14,0.4,"1 serving",80), FD("sweetcorn","Sweetcorn",86,3.3,19,1.4,"1 serving",80),
  FD("beans-baked","Baked Beans",78,4.7,13,0.4,"half tin",210), FD("beans-black","Black Beans",132,8.9,24,0.5,"half tin",120),
  FD("chickpeas","Chickpeas",139,7.2,22,2.6,"half tin",120), FD("lentils","Lentils",116,9,20,0.4,"1 serving",120),
  FD("hummus","Hummus",237,7.4,14,17,"2 tbsp",50),
  // fats, nuts, condiments
  FD("olive-oil","Olive Oil",884,0,0,100,"1 tbsp",14), FD("pb","Peanut Butter",588,25,20,50,"1 tbsp",16),
  FD("almonds","Almonds",579,21,22,50,"1 handful",28), FD("cashews","Cashews",553,18,30,44,"1 handful",28),
  FD("walnuts","Walnuts",654,15,14,65,"1 handful",28), FD("mayo","Mayonnaise",680,1,1.5,75,"1 tbsp",15),
  FD("mayo-light","Light Mayonnaise",260,0.8,8,24,"1 tbsp",15), FD("ketchup","Ketchup",112,1.2,26,0.1,"1 tbsp",17),
  FD("honey","Honey",304,0.3,82,0,"1 tsp",7), FD("jam","Jam",265,0.4,65,0.1,"1 tsp",15),
  FD("pesto","Pesto",435,5,6,42,"1 tbsp",15), FD("salsa","Salsa",36,1.5,7,0.2,"2 tbsp",30),
  FD("choc-dark","Dark Chocolate 70%",579,7.8,46,43,"2 squares",20), FD("choc-milk","Milk Chocolate",535,7.7,59,30,"2 squares",20),
  // supplements & drinks
  FD("whey","Whey Protein",380,78,7,6,"1 scoop",30), FD("protein-bar","Protein Bar",360,32,32,11,"1 bar",60),
  FD("creatine","Creatine",0,0,0,0,"1 scoop",5), FD("oj","Orange Juice",45,0.7,10,0.2,"1 glass",250),
  FD("coke","Cola",42,0,10.6,0,"1 can",330), FD("coke-zero","Diet Cola",0.4,0,0,0,"1 can",330),
  FD("beer","Beer (lager)",43,0.5,3.6,0,"1 pint",568), FD("wine","Wine",83,0.1,2.6,0,"1 glass",175),
  FD("latte","Latte (semi-skimmed)",42,3.3,4.5,1.5,"1 medium",350), FD("coffee-black","Black Coffee",1,0.1,0,0,"1 cup",250),
  // meals & snacks
  FD("pizza","Pizza (margherita)",266,11,33,10,"1 slice",107), FD("burger","Cheeseburger",295,17,24,15,"1 burger",220),
  FD("fish-fingers","Fish Fingers",214,13,19,9.5,"1 finger",28), FD("sausage","Pork Sausage",301,14,3,26,"1 sausage",57),
  FD("chicken-nuggets","Chicken Nuggets",296,15,15,20,"1 nugget",18), FD("sandwich-chick","Chicken Salad Sandwich",210,12,25,7,"1 sandwich",180),
  FD("soup-tomato","Tomato Soup",55,0.9,8,2,"half tin",200), FD("sushi","Sushi (mixed)",150,6,28,2,"1 piece",30),
  FD("crisps","Crisps",530,6,53,31,"1 bag",25), FD("popcorn","Popcorn (sweet & salty)",480,7,60,22,"1 serving",30),
  FD("biscuit","Digestive Biscuit",478,6.5,66,21,"1 biscuit",15), FD("croissant","Croissant",406,8,45,21,"1 croissant",60),
  FD("flapjack","Flapjack",457,6,58,22,"1 bar",70), FD("ice-cream","Vanilla Ice Cream",207,3.5,24,11,"1 scoop",70),
];
const MEAL_SLOTS = [["b", "Breakfast"], ["l", "Lunch"], ["d", "Dinner"], ["s", "Snacks"]];
const dayKey = d => { const x = new Date(d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
const macrosFor = (food, grams) => ({
  kcal: Math.round(food.k * grams / 100), p: Math.round(food.p * grams / 10) / 10,
  c: Math.round(food.c * grams / 10) / 10, f: Math.round(food.f * grams / 10) / 10,
});

/* ================= TROPHIES ================= */
const CATEGORY_LABEL = { training: "Training", nutrition: "Nutrition", weighin: "Weigh-Ins", photo: "Photos" };
const TROPHIES = [
  // ---- training ----
  { id: "first", name: "First Burn", desc: "Complete your first session", tier: "bronze", category: "training", calc: s => [Math.min(s.count, 1), 1] },
  { id: "w10", name: "Regular", desc: "Complete 10 workouts", tier: "bronze", category: "training", calc: s => [s.count, 10] },
  { id: "w25", name: "Committed", desc: "Complete 25 workouts", tier: "silver", category: "training", calc: s => [s.count, 25] },
  { id: "w50", name: "The Machine", desc: "Complete 50 workouts", tier: "gold", category: "training", calc: s => [s.count, 50] },
  { id: "w100", name: "Century Club", desc: "Complete 100 workouts", tier: "gold", category: "training", calc: s => [s.count, 100] },
  { id: "streak4", name: "Habit Formed", desc: "3+ sessions a week, 4 weeks in a row", tier: "gold", category: "training", calc: s => [s.bestRun, 4] },
  { id: "streak8", name: "Iron Habit", desc: "3+ sessions a week, 8 weeks in a row", tier: "gold", category: "training", calc: s => [s.bestRun, 8] },
  { id: "t10k", name: "Ten Tonnes", desc: "Lift 10,000 kg of total volume", tier: "bronze", category: "training", calc: s => [Math.round(s.tonnage), 10000] },
  { id: "t100k", name: "Hundred Tonnes", desc: "Lift 100,000 kg of total volume", tier: "silver", category: "training", calc: s => [Math.round(s.tonnage), 100000] },
  { id: "t1m", name: "The Millionaire", desc: "Lift 1,000,000 kg of total volume", tier: "gold", category: "training", calc: s => [Math.round(s.tonnage), 1000000] },
  { id: "sets1000", name: "Set Collector", desc: "Log 1,000 total sets", tier: "silver", category: "training", calc: s => [s.sets, 1000] },
  { id: "pr1", name: "Record Breaker", desc: "Set your first PR", tier: "bronze", category: "training", calc: s => [s.prs, 1] },
  { id: "pr10", name: "PR Machine", desc: "Set 10 PRs", tier: "silver", category: "training", calc: s => [s.prs, 10] },
  { id: "pr25", name: "Unstoppable", desc: "Set 25 PRs", tier: "gold", category: "training", calc: s => [s.prs, 25] },
  { id: "bench100", name: "The Big Bench", desc: "Reach a 100 kg bench press e1RM", tier: "gold", category: "training", calc: s => [Math.round(s.bench), 100] },
  { id: "squat140", name: "Squat Royalty", desc: "Reach a 140 kg squat e1RM", tier: "gold", category: "training", calc: s => [Math.round(s.squat), 140] },
  { id: "dead180", name: "Diesel", desc: "Reach a 180 kg deadlift e1RM", tier: "gold", category: "training", calc: s => [Math.round(s.dead), 180] },
  { id: "dawn", name: "Dawn Patrol", desc: "Train before 7am", tier: "bronze", category: "training", calc: s => [s.dawn ? 1 : 0, 1] },
  { id: "night", name: "Night Shift", desc: "Train after 9pm", tier: "bronze", category: "training", calc: s => [s.night ? 1 : 0, 1] },
  { id: "full", name: "Full House", desc: "Complete every prescribed set in a session", tier: "bronze", category: "training", calc: s => [s.full ? 1 : 0, 1] },
  // ---- nutrition ----
  { id: "food1", name: "First Fuel", desc: "Log your first food entry", tier: "bronze", category: "nutrition", calc: s => [Math.min(s.foodEntries, 1), 1] },
  { id: "food7", name: "Week of Fuel", desc: "Log food on 7 different days", tier: "bronze", category: "nutrition", calc: s => [s.foodDays, 7] },
  { id: "food30", name: "Diary Keeper", desc: "Log food on 30 different days", tier: "silver", category: "nutrition", calc: s => [s.foodDays, 30] },
  { id: "protein25", name: "On Target", desc: "Hit your protein target on 25 days", tier: "gold", category: "nutrition", calc: s => [s.proteinHitDays, 25] },
  { id: "food250", name: "Macro Master", desc: "Log 250 food entries", tier: "gold", category: "nutrition", calc: s => [s.foodEntries, 250] },
  // ---- weigh-ins ----
  { id: "weigh1", name: "On The Scale", desc: "Log your first weigh-in", tier: "bronze", category: "weighin", calc: s => [Math.min(s.weighCount, 1), 1] },
  { id: "weighstreak7", name: "Steady Hand", desc: "Log a 7-day weigh-in streak", tier: "bronze", category: "weighin", calc: s => [s.bestWeighStreak, 7] },
  { id: "weighstreak30", name: "Consistency", desc: "Log a 30-day weigh-in streak", tier: "silver", category: "weighin", calc: s => [s.bestWeighStreak, 30] },
  { id: "weigh100", name: "The Long Haul", desc: "Log 100 weigh-ins", tier: "gold", category: "weighin", calc: s => [s.weighCount, 100] },
  { id: "weigh200", name: "Dedication", desc: "Log 200 weigh-ins", tier: "gold", category: "weighin", calc: s => [s.weighCount, 200] },
  // ---- photos ----
  { id: "photo1", name: "Say Cheese", desc: "Add your first progress photo", tier: "bronze", category: "photo", calc: s => [Math.min(s.photoCount, 1), 1] },
  { id: "photo2", name: "Then & Now", desc: "Add 2 progress photos", tier: "bronze", category: "photo", calc: s => [s.photoCount, 2] },
  { id: "photo10", name: "Visual Proof", desc: "Add 10 progress photos", tier: "silver", category: "photo", calc: s => [s.photoCount, 10] },
  { id: "photo25", name: "Time Capsule", desc: "Add 25 progress photos", tier: "gold", category: "photo", calc: s => [s.photoCount, 25] },
  // ---- meta ----
  { id: "plat", name: "Burn Legend", desc: "Unlock every other trophy", tier: "platinum", category: "training", calc: null },
];

/* ================= HELPERS ================= */
const e1rm = (w, r) => (r > 0 ? w * (1 + r / 30) : 0);
const round1 = n => Math.round(n * 10) / 10;
const fmtKg = n => (n % 1 === 0 ? n.toString() : n.toFixed(1));
const fmtNum = n => n.toLocaleString("en-GB");
const todayISO = () => new Date().toISOString();
const dayLabel = iso => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const PLATES = [
  { kg: 25, color: C.red, h: 46 }, { kg: 20, color: C.blue, h: 46 }, { kg: 15, color: C.yellow, h: 40 },
  { kg: 10, color: C.green, h: 34 }, { kg: 5, color: C.plate5, h: 26 }, { kg: 2.5, color: C.plate25, h: 20 },
  { kg: 1.25, color: "#C4C9D4", h: 16 },
];
function plateBreakdown(total) {
  if (!total || total < 20) return null;
  let side = (total - 20) / 2, out = [];
  for (const p of PLATES) { while (side >= p.kg - 1e-9) { out.push(p); side = round1(side - p.kg); } }
  return { plates: out, remainder: side };
}

function lastPerf(history, exId) {
  for (let i = history.length - 1; i >= 0; i--) {
    const found = history[i].exercises.find(e => e.id === exId);
    if (found && found.sets.length) return { date: history[i].date, sets: found.sets };
  }
  return null;
}
function bestE1RM(history, exId) {
  let best = 0;
  for (const w of history) for (const e of w.exercises) if (e.id === exId)
    for (const s of e.sets) best = Math.max(best, e1rm(s.w, s.r));
  return best;
}
function suggest(history, item) {
  const last = lastPerf(history, item.ex);
  if (!last) return null;
  const topW = Math.max(...last.sets.map(s => s.w));
  const topSets = last.sets.filter(s => s.w === topW);
  const allAtTop = topSets.every(s => s.r >= item.hi);
  const lower = ["squat", "deadlift", "rdl", "legpress", "hip-thrust"].includes(item.ex);
  if (allAtTop) return { w: round1(topW + (lower ? 5 : 2.5)), r: item.lo, mode: "load" };
  const maxR = Math.max(...topSets.map(s => s.r));
  return { w: topW, r: Math.min(maxR + 1, item.hi), mode: "rep" };
}
function weeklySets(history) {
  const cutoff = Date.now() - 7 * 864e5;
  const tally = {};
  for (const w of history) {
    if (new Date(w.date).getTime() < cutoff) continue;
    for (const e of w.exercises) {
      const ex = EX[e.id]; if (!ex) continue;
      tally[ex.muscle] = (tally[ex.muscle] || 0) + e.sets.length;
      for (const s of ex.secondary) tally[s] = (tally[s] || 0) + e.sets.length * 0.5;
    }
  }
  return tally;
}

/* ---- muscle heat: recency-weighted training load per muscle group ---- */
function muscleHeat(history, muscle, weeklyTarget) {
  const now = Date.now();
  const HALF_LIFE_DAYS = 5;
  let weighted = 0, lastMs = -Infinity;
  for (const w of history) {
    const t = new Date(w.date).getTime();
    const daysAgo = (now - t) / 864e5;
    if (daysAgo < 0) continue;
    let touched = false;
    for (const e of w.exercises) {
      const ex = EX[e.id]; if (!ex) continue;
      const isPrimary = ex.muscle === muscle;
      const isSecondary = !isPrimary && ex.secondary.includes(muscle);
      if (!isPrimary && !isSecondary) continue;
      touched = true;
      weighted += e.sets.length * (isPrimary ? 1 : 0.5) * Math.pow(0.5, daysAgo / HALF_LIFE_DAYS);
    }
    if (touched && t > lastMs) lastMs = t;
  }
  const daysSince = lastMs === -Infinity ? Infinity : (now - lastMs) / 864e5;
  return { ratio: weighted / (weeklyTarget || 15), daysSince };
}
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerpColor(a, b, t) {
  const [ar, ag, ab] = hexToRgb(a), [br, bg, bb] = hexToRgb(b);
  return "rgb(" + Math.round(ar + (br - ar) * t) + "," + Math.round(ag + (bg - ag) * t) + "," + Math.round(ab + (bb - ab) * t) + ")";
}
function heatColor(ratio, baseHex) {
  const COLD = "#3A4050", HOT = "#FF3B30", WHITEHOT = "#FFE38A";
  const r = Math.max(0, ratio);
  if (r <= 1) return lerpColor(COLD, baseHex, r);
  if (r <= 2) return lerpColor(baseHex, HOT, r - 1);
  return lerpColor(HOT, WHITEHOT, Math.min(1, r - 2));
}

/* ---- equipment / substitutions ---- */
const GYM_EQ = { full: null, home: ["Dumbbells", "Bodyweight"], bw: ["Bodyweight"] };
const GYM_LABEL = { full: "Full gym", home: "Dumbbells & bench", bw: "Bodyweight only" };
function eqAllowed(exId, gym) {
  const eq = GYM_EQ[gym || "full"];
  return !eq || (EX[exId] && eq.includes(EX[exId].equipment));
}
function resolveEx(id, subs, gym) {
  if (subs && subs[id] && EX[subs[id]]) return subs[id];
  if (eqAllowed(id, gym)) return id;
  const ex = EX[id];
  for (const a of (ex.alts || [])) if (eqAllowed(a, gym)) return a;
  const fb = EXERCISES.find(e => e.muscle === ex.muscle && e.id !== id && eqAllowed(e.id, gym));
  return fb ? fb.id : id;
}

/* ---- trophies ---- */
function bestConsecutiveDayStreak(dates) {
  const days = [...new Set(dates.map(d => Math.floor(new Date(d).setHours(0, 0, 0, 0) / 864e5)))].sort((a, b) => a - b);
  let run = 0, best = 0;
  for (let i = 0; i < days.length; i++) {
    run = (i > 0 && days[i] - days[i - 1] === 1) ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}
function trophyStats(history) {
  let tonnage = 0, prs = 0, dawn = false, night = false, full = false, sets = 0;
  const best = {};
  for (const w of history) {
    const h = new Date(w.date).getHours();
    if (h < 7) dawn = true;
    if (h >= 21) night = true;
    if (w.full) full = true;
    const wBest = {};
    for (const e of w.exercises) {
      sets += e.sets.length;
      for (const s of e.sets) {
        tonnage += s.w * s.r;
        const v = e1rm(s.w, s.r);
        if (!wBest[e.id] || v > wBest[e.id]) wBest[e.id] = v;
      }
    }
    for (const id in wBest) {
      if (best[id] !== undefined && wBest[id] > best[id]) prs++;
      if (best[id] === undefined || wBest[id] > best[id]) best[id] = wBest[id];
    }
  }
  const weeks = {};
  for (const w of history) {
    const d = new Date(w.date); const m = new Date(d);
    m.setDate(d.getDate() - ((d.getDay() + 6) % 7)); m.setHours(0, 0, 0, 0);
    weeks[m.getTime()] = (weeks[m.getTime()] || 0) + 1;
  }
  const keys = Object.keys(weeks).map(Number).sort((a, b) => a - b);
  let run = 0, bestRun = 0;
  for (let i = 0; i < keys.length; i++) {
    if (weeks[keys[i]] >= 3) {
      run = (i > 0 && keys[i] - keys[i - 1] === 7 * 864e5 && weeks[keys[i - 1]] >= 3) ? run + 1 : 1;
      bestRun = Math.max(bestRun, run);
    }
  }
  return { count: history.length, tonnage, prs, dawn, night, full, sets, bestRun, bench: best["bench"] || 0, squat: best["squat"] || 0, dead: best["deadlift"] || 0 };
}
function fullStats(data, photos) {
  const st = trophyStats(data.history || []);
  const foodLog = data.foodLog || [];
  const weights = data.weights || [];
  const foodDaySet = new Set(foodLog.map(e => e.d));
  let proteinHitDays = 0;
  const proteinTarget = data.profile && data.profile.targets ? data.profile.targets.proteinG : null;
  if (proteinTarget) {
    const perDay = {};
    for (const e of foodLog) perDay[e.d] = (perDay[e.d] || 0) + e.p;
    proteinHitDays = Object.values(perDay).filter(p => p >= proteinTarget).length;
  }
  return {
    ...st,
    foodEntries: foodLog.length,
    foodDays: foodDaySet.size,
    proteinHitDays,
    weighCount: weights.length,
    bestWeighStreak: bestConsecutiveDayStreak(weights.map(w => w.date)),
    photoCount: (photos || []).length,
  };
}
function achievements(data, photos) {
  const st = fullStats(data, photos);
  const list = TROPHIES.map(t => {
    if (!t.calc) return { ...t, v: 0, tg: 1, done: false };
    const [v, tg] = t.calc(st);
    return { ...t, v, tg, done: v >= tg };
  });
  const others = list.filter(t => t.id !== "plat");
  const plat = list.find(t => t.id === "plat");
  plat.v = others.filter(o => o.done).length; plat.tg = others.length; plat.done = plat.v >= plat.tg;
  return list;
}

/* ---- nutrition maths (Mifflin-St Jeor) ---- */
function calcTargets(p) {
  const w = +p.weightKg || 75, h = +p.heightCm || 175, a = +p.age || 30;
  const bmrM = 10 * w + 6.25 * h - 5 * a + 5;
  const bmrF = 10 * w + 6.25 * h - 5 * a - 161;
  const bmr = p.sex === "m" ? bmrM : p.sex === "f" ? bmrF : (bmrM + bmrF) / 2;
  const mult = { sed: 1.2, light: 1.375, mod: 1.55, high: 1.725 }[p.activity] || 1.4;
  const maintain = Math.round(bmr * mult / 50) * 50;
  let goal = maintain;
  if (p.goal === "cut") goal = Math.max(Math.round(maintain * 0.8 / 50) * 50, 1400);
  if (p.goal === "build") goal = Math.round(maintain * 1.1 / 50) * 50;
  if (p.goal === "strength") goal = Math.round(maintain * 1.05 / 50) * 50;
  const proteinG = Math.round(w * (p.goal === "cut" ? 2.0 : 1.8));
  const fatG = Math.round(goal * 0.25 / 9);
  const carbG = Math.max(0, Math.round((goal - proteinG * 4 - fatG * 9) / 4));
  return { maintain, goal, proteinG, fatG, carbG };
}
function recommendProgram(p) {
  if (p.gym === "bw") return "fb";
  if (p.exp === "adv") return "ppl";
  if (p.exp === "mid") return "ul";
  return "fb";
}

/* ================= SMALL COMPONENTS ================= */
const Chip = ({ children, color, style }) => (
  <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: (color || C.dim) + "22", color: color || C.dim, fontFamily: F.mono, fontSize: 11, ...style }}>{children}</span>
);
const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-3 mb-3 mt-1">
    <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 3, color: C.faint, textTransform: "uppercase" }}>{children}</span>
    <div className="flex-1 h-px" style={{ background: C.line }} />
  </div>
);
/* ScreenHead — the big editorial screen title (Nike/Apple Fitness): oversized condensed uppercase,
   tight tracking, with a small mono eyebrow + optional right-aligned figure. */
const ScreenHead = ({ eyebrow, title, right }) => (
  <div className="flex items-end justify-between mb-5 mt-1">
    <div>
      {eyebrow && <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 3, color: "#FF5722", textTransform: "uppercase", marginBottom: 2 }}>{eyebrow}</div>}
      <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 44, lineHeight: 1.02, letterSpacing: -1.5, textTransform: "uppercase" }}>{title}</div>
    </div>
    {right != null && <div className="shrink-0 pb-1">{right}</div>}
  </div>
);
/* Apple-Activity-style concentric rings: nested thick bands, glossy gradient,
   animated fill-in on mount, a glowing "cap" dot chasing the arc tip. */
/* useCountUp — tick a number from its previous value up to `value` on mount/update.
   rAF-driven, cleaned up on unmount; respects prefers-reduced-motion (snaps to target). */
function useCountUp(value, duration = DUR.hero) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(null);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const to = value, from = fromRef.current;
    if (reduce || from === to || typeof to !== "number" || typeof from !== "number") {
      setDisplay(to); fromRef.current = to; return;
    }
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); fromRef.current = to; };
  }, [value, duration]);
  return display;
}

/* HeroNumber — the Dribbble "LED numeral" treatment: large tracked-out tabular mono digits with a
   gradient fill + soft glow, counting up on mount. One reusable home for the app's headline figures.
   Numeric values animate; pre-formatted strings (e.g. "12,340") render statically. */
function HeroNumber({ value, decimals = 0, prefix, suffix, size = 56, accent, glow = true, className = "", style = {} }) {
  const A = accent || ACCENTS.ember;
  const animated = useCountUp(value);
  const shown = typeof value === "number" ? animated.toFixed(decimals) : value;
  const grad = "linear-gradient(175deg,#FFFFFF 8%," + A.b + " 55%," + A.a + ")";
  return (
    <span className={"inline-flex items-baseline " + className} style={style}>
      {prefix != null && <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: size * 0.3, color: C.dim, marginRight: 3 }}>{prefix}</span>}
      <span style={{ fontFamily: F.disp, fontSize: size, lineHeight: 1.12, paddingTop: "0.06em", letterSpacing: -1, fontVariantNumeric: "tabular-nums", backgroundImage: grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: glow ? "drop-shadow(0 0 22px " + A.a + "55)" : "none" }}>{shown}</span>
      {suffix != null && <span style={{ fontFamily: F.disp, fontSize: size * 0.42, color: A.a, marginLeft: 4, paddingBottom: size * 0.06 }}>{suffix}</span>}
    </span>
  );
}

/* HeroArc — the signature moment: a 270° gauge with a glowing accent sweep, animated fill, a huge
   Anton numeral centered, and a soft breathing edge-glow. One per screen, max. */
function HeroArc({ value, max = 100, size = 236, label, sublabel, accent, unit }) {
  const A = accent || ACCENTS.ember;
  const [anim, setAnim] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnim(true), 140); return () => clearTimeout(t); }, []);
  const shown = useCountUp(typeof value === "number" ? value : 0);
  const stroke = Math.round(size * 0.05);
  const r = (size - stroke) / 2 - 6;
  const cx = size / 2, cy = size / 2;
  const START = 135, SWEEP = 270;
  const circ = 2 * Math.PI * r;
  const arcLen = circ * (SWEEP / 360);
  const pct = Math.max(0, Math.min(1, (anim ? value : 0) / (max || 1)));
  const polar = (deg) => { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const [sx, sy] = polar(START), [ex, ey] = polar(START + SWEEP);
  const trackPath = "M " + sx + " " + sy + " A " + r + " " + r + " 0 " + (SWEEP > 180 ? 1 : 0) + " 1 " + ex + " " + ey;
  return (
    <div className="relative flex items-center justify-center mx-auto" style={{ width: size, height: size }}>
      <div className="bl-heroglow absolute rounded-full" style={{ width: size * 0.72, height: size * 0.72, background: A.a, filter: "blur(56px)" }} aria-hidden="true" />
      <svg width={size} height={size} className="relative" style={{ overflow: "visible" }} aria-hidden="true">
        <defs>
          <linearGradient id="heroarc" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={A.b} /><stop offset="100%" stopColor={A.a} /></linearGradient>
        </defs>
        <path d={trackPath} fill="none" stroke={C.card2} strokeWidth={stroke} strokeLinecap="round" />
        <path d={trackPath} fill="none" stroke="url(#heroarc)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={(arcLen * pct) + " " + (arcLen * 2)} style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.22,0.9,0.3,1)", filter: "drop-shadow(0 0 12px " + A.a + "cc)" }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <div className="flex items-start">
          <span style={{ fontFamily: F.disp, fontSize: size * 0.36, lineHeight: 1.05, letterSpacing: -1, color: C.text }}>{typeof value === "number" ? Math.round(shown) : value}</span>
          {unit && <span style={{ fontFamily: F.disp, fontSize: size * 0.14, color: A.a, marginTop: 4, marginLeft: 3 }}>{unit}</span>}
        </div>
        {label && <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 3, color: C.faint, marginTop: 8 }}>{label}</span>}
        {sublabel && <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 1, color: A.a, marginTop: 3 }}>{sublabel}</span>}
      </div>
    </div>
  );
}

function ActivityRings({ rings, size = 176 }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimate(true), 100); return () => clearTimeout(t); }, []);
  const cx = size / 2, cy = size / 2, strokeW = size * 0.1, gap = size * 0.024;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} role="img" aria-label="Weekly activity rings">
        <defs>
          {rings.map((r, i) => (
            <linearGradient key={i} id={"blring" + i} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={r.color} stopOpacity="0.7" />
              <stop offset="100%" stopColor={r.color} stopOpacity="1" />
            </linearGradient>
          ))}
        </defs>
        {rings.map((r, i) => {
          const radius = cx - strokeW / 2 - i * (strokeW + gap);
          const circ = 2 * Math.PI * radius;
          const pct = r.target ? r.value / r.target : 0;
          const shown = animate ? Math.min(1, pct) : 0;
          const filled = shown * circ;
          const complete = pct >= 1;
          const dotAngle = shown * 360;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke={C.card2} strokeWidth={strokeW} />
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke={"url(#blring" + i + ")"} strokeWidth={strokeW} strokeLinecap="round"
                className={complete ? "bl-ring-pulse" : ""}
                style={{ transition: "stroke-dasharray 1.1s cubic-bezier(0.22,0.9,0.3,1)" }}
                strokeDasharray={filled + " " + (circ - filled)} transform={"rotate(-90 " + cx + " " + cy + ")"} />
              {shown > 0.02 && (
                <g style={{ transform: "rotate(" + dotAngle + "deg)", transformOrigin: cx + "px " + cy + "px", transition: "transform 1.1s cubic-bezier(0.22,0.9,0.3,1)" }}>
                  <circle cx={cx} cy={cy - radius} r={strokeW * 0.46} fill={r.color} style={{ filter: "drop-shadow(0 0 4px " + r.color + "cc)" }} />
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 mt-3 flex-wrap justify-center">
        {rings.map((r, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color, boxShadow: "0 0 5px " + r.color + "aa" }} />
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: C.text }}>{r.value}<span style={{ color: C.faint }}>/{r.target}</span></div>
              <div style={{ fontFamily: F.mono, fontSize: 8, color: C.faint, letterSpacing: 1 }}>{r.label.toUpperCase()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function MuscleBar({ label, color, value, target, focus }) {
  const pct = Math.min(1, target ? value / target : 0);
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
          {label}{focus && <span aria-label="Focus muscle">🎯</span>}
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: C.dim }}>{value}<span style={{ color: C.faint }}>/{target}</span></span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: C.card2 }}>
        <div className="h-full rounded-full transition-all" style={{ width: (pct * 100) + "%", background: color, boxShadow: pct > 0 ? "0 0 8px " + color + "99" : "none" }} />
      </div>
    </div>
  );
}
/* Minimalist "plates on bar" — a 1px scale line, a thin collar, and plates stacked outward in the
   accent orange (opacity scales with plate weight). Monochrome, editorial. */
function PlateBar({ weight }) {
  const bd = plateBreakdown(weight);
  if (!bd) return null;
  const shown = bd.plates.slice(0, 8);
  return (
    <div className="mt-3 rounded-2xl px-4 py-3" style={{ background: C.card2, border: "1px solid " + C.line }}>
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontFamily: F.mono, fontSize: 9, color: C.faint, letterSpacing: 2 }}>PER SIDE</span>
        <span style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 20, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums" }}>{fmtKg(weight)}<span style={{ fontSize: 11, color: C.dim }}> KG</span></span>
      </div>
      <svg width="100%" height="52" viewBox="0 0 200 52" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <line x1="6" y1="26" x2="98" y2="26" stroke={C.faint} strokeWidth="1" />
        <line x1="96" y1="15" x2="96" y2="37" stroke={C.dim} strokeWidth="1.5" />
        {shown.map((p, i) => {
          const x = 100 + i * 11;
          const h = 10 + (p.kg / 25) * 34;
          return <rect key={i} x={x} y={26 - h / 2} width="8" height={h} rx="1.5" fill={ORANGE.a} fillOpacity={0.35 + (p.kg / 25) * 0.65} />;
        })}
      </svg>
      <div style={{ fontFamily: F.mono, fontSize: 10, color: C.dim }}>
        {shown.length ? shown.map(p => fmtKg(p.kg)).join(" · ") : "empty bar"}
        {bd.remainder > 0.01 && <span style={{ color: ORANGE.a }}> · +{fmtKg(bd.remainder)} short</span>}
      </div>
    </div>
  );
}
function Toggle({ on, onChange, label }) {
  return (
    <button onClick={() => { if (vibrateEnabled) haptic("tap"); onChange(!on); }} role="switch" aria-checked={on} aria-label={label}
      className="relative rounded-full transition-all active:scale-95 shrink-0"
      style={{ width: 46, height: 26, background: on ? ORANGE.a : C.card2, border: "1px solid " + (on ? ORANGE.a : C.line), boxShadow: on ? SHADOW.glow(ORANGE.a) : "none" }}>
      <span className="absolute rounded-full transition-transform" style={{ top: 2, left: 2, width: 20, height: 20, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.4)", transform: on ? "translateX(20px)" : "translateX(0)" }} />
    </button>
  );
}
const GradBtn = ({ A, onClick, children, className = "", style = {} }) => (
  <button onClick={e => { if (vibrateEnabled) haptic("light"); if (onClick) onClick(e); }} className={"font-bold transition-all active:scale-95 active:brightness-90 " + className}
    style={{ background: "linear-gradient(90deg," + A.a + "," + A.b + ")", color: "#0D0E11", boxShadow: SHADOW.glow(A.a), ...style }}>{children}</button>
);

/* ================= ONBOARDING ================= */
function Onboarding({ A, onDone }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState({ name: "", age: "", sex: "", heightCm: "", weightKg: "", activity: "", gym: "", exp: "", goal: "", focusMuscles: [] });
  const set = (k, v) => setP(prev => ({ ...prev, [k]: v }));
  const toggleFocus = m => setP(prev => {
    const has = prev.focusMuscles.includes(m);
    if (has) return { ...prev, focusMuscles: prev.focusMuscles.filter(x => x !== m) };
    if (prev.focusMuscles.length >= 2) return prev;
    return { ...prev, focusMuscles: [...prev.focusMuscles, m] };
  });
  const targets = useMemo(() => calcTargets(p), [p]);
  const AG = "linear-gradient(90deg," + A.a + "," + A.b + ")";

  const inputStyle = { background: C.card, border: "1px solid " + C.line, color: C.text, fontSize: 16, fontFamily: F.body };
  const Opt = ({ k, v, title, sub }) => (
    <button onClick={() => set(k, v)} className="w-full text-left rounded-xl px-4 py-3.5 mb-2 transition-colors"
      style={{ background: p[k] === v ? A.a + "1F" : C.card, border: "1px solid " + (p[k] === v ? A.a : C.line) }}>
      <div className="font-semibold" style={{ fontSize: 15 }}>{title}</div>
      {sub && <div className="text-sm mt-0.5" style={{ color: C.dim }}>{sub}</div>}
    </button>
  );
  const H = ({ kicker, title, sub }) => (
    <div className="mb-5">
      <div style={{ fontFamily: F.mono, fontSize: 10, color: A.a, letterSpacing: 2.5 }}>{kicker}</div>
      <div style={{ fontFamily: F.brand, fontWeight: 800, fontSize: 24, lineHeight: 1.25, marginTop: 4 }}>{title}</div>
      {sub && <p className="text-sm mt-2" style={{ color: C.dim }}>{sub}</p>}
    </div>
  );

  const valid = [
    true,
    p.age && p.heightCm && p.weightKg && p.sex,
    !!p.activity, !!p.gym, !!p.exp, !!p.goal, true, true,
  ][step];

  const finish = () => {
    const profile = { ...p, age: +p.age, heightCm: +p.heightCm, weightKg: +p.weightKg, name: p.name.trim() || "Athlete", targets, done: true };
    onDone(profile, recommendProgram(p));
  };

  return (
    <div className="flex-1 flex flex-col px-6 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top) + 24px)" }}>
      {/* progress dots + back */}
      <div className="flex items-center gap-3 mb-6">
        {step > 0 && <button onClick={() => setStep(step - 1)} aria-label="Back" className="p-1.5 rounded-lg" style={{ background: C.card, border: "1px solid " + C.line }}><ChevronLeft size={16} color={C.dim} /></button>}
        <div className="flex gap-1.5 flex-1">
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ background: i <= step ? A.a : C.line }} />
          ))}
        </div>
      </div>

      <div className="flex-1">
        {step === 0 && (<div className="bl-fade">
          <div style={{ fontFamily: F.brand, fontWeight: 800, fontSize: 36, letterSpacing: 2, marginTop: 24 }}>
            BURN<span className="bl-shimmer" style={{ backgroundImage: "linear-gradient(90deg," + A.a + "," + A.b + ",#F2F0EA," + A.a + ")" }}>LAB</span>
          </div>
          <p className="mt-3 text-base" style={{ color: C.dim }}>Science-based training, fuel and progress - built around you. Two minutes of questions and we'll tailor everything.</p>
          <div className="mt-8">
            <label className="block mb-2" style={{ fontFamily: F.mono, fontSize: 11, color: C.faint, letterSpacing: 1.5 }}>WHAT SHOULD WE CALL YOU?</label>
            <input value={p.name} onChange={e => set("name", e.target.value)} placeholder="Your name"
              className="w-full rounded-xl px-4 py-3.5" style={inputStyle} />
          </div>
        </div>)}

        {step === 1 && (<div className="bl-fade">
          <H kicker="STEP 1 OF 7" title="About you" sub="Used only to calculate your calorie and protein targets. Stored on this device, nowhere else." />
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div><label className="block mb-1.5" style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>AGE</label>
              <input type="number" inputMode="numeric" value={p.age} onChange={e => set("age", e.target.value)} placeholder="30" className="w-full rounded-xl px-3 py-3 text-center" style={inputStyle} /></div>
            <div><label className="block mb-1.5" style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>HEIGHT CM</label>
              <input type="number" inputMode="numeric" value={p.heightCm} onChange={e => set("heightCm", e.target.value)} placeholder="178" className="w-full rounded-xl px-3 py-3 text-center" style={inputStyle} /></div>
            <div><label className="block mb-1.5" style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>WEIGHT KG</label>
              <input type="number" inputMode="decimal" value={p.weightKg} onChange={e => set("weightKg", e.target.value)} placeholder="78" className="w-full rounded-xl px-3 py-3 text-center" style={inputStyle} /></div>
          </div>
          <label className="block mb-1.5 mt-3" style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>BIOLOGICAL SEX (FOR THE CALORIE FORMULA)</label>
          <Opt k="sex" v="m" title="Male" />
          <Opt k="sex" v="f" title="Female" />
          <Opt k="sex" v="x" title="Prefer not to say" sub="We'll use an averaged formula" />
        </div>)}

        {step === 2 && (<div className="bl-fade">
          <H kicker="STEP 2 OF 7" title="How active is your day-to-day?" sub="Outside the gym - job, steps, general movement." />
          <Opt k="activity" v="sed" title="Mostly sitting" sub="Desk job, under ~5k steps" />
          <Opt k="activity" v="light" title="Lightly active" sub="Some walking, ~5-8k steps" />
          <Opt k="activity" v="mod" title="Active" sub="On your feet a lot, ~8-12k steps" />
          <Opt k="activity" v="high" title="Very active" sub="Physical job or 12k+ steps" />
        </div>)}

        {step === 3 && (<div className="bl-fade">
          <H kicker="STEP 3 OF 7" title="What kit do you have?" sub="Every exercise adapts to your setup - and you can swap any movement later." />
          <Opt k="gym" v="full" title="Full gym" sub="Barbells, machines, cables - the lot" />
          <Opt k="gym" v="home" title="Dumbbells & a bench" sub="Home setup or hotel gym" />
          <Opt k="gym" v="bw" title="Bodyweight only" sub="A pull-up bar helps but we'll work with anything" />
        </div>)}

        {step === 4 && (<div className="bl-fade">
          <H kicker="STEP 4 OF 7" title="Training experience?" sub="This sets how often each muscle gets trained." />
          <Opt k="exp" v="new" title="New to lifting" sub="Under a year of consistent training" />
          <Opt k="exp" v="mid" title="1-2 years" sub="Comfortable with the main lifts" />
          <Opt k="exp" v="adv" title="3+ years" sub="Ready for higher volume" />
        </div>)}

        {step === 5 && (<div className="bl-fade">
          <H kicker="STEP 5 OF 7" title="What's the goal?" sub="This drives your calories, your split and your meal templates." />
          <Opt k="goal" v="build" title="Build muscle" sub="Modest surplus, hypertrophy focus" />
          <Opt k="goal" v="cut" title="Lose fat" sub="Sensible deficit, keep the muscle" />
          <Opt k="goal" v="recomp" title="Recomposition" sub="Maintenance calories, slow and steady" />
          <Opt k="goal" v="strength" title="Get stronger" sub="Slight surplus, heavier rep ranges" />
        </div>)}

        {step === 6 && (<div className="bl-fade">
          <H kicker="STEP 6 OF 7" title="Any muscles need extra attention?" sub="Pick up to 2 - we'll add bonus volume and raise the weekly target for them. Totally optional." />
          <AnatomyBody fem={p.sex === "f"} mode="pick" selected={p.focusMuscles} onToggle={toggleFocus} accent={A.a} size={170} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {Object.keys(MUSCLES).map(m => {
              const picked = p.focusMuscles.includes(m);
              const disabled = !picked && p.focusMuscles.length >= 2;
              return (
                <button key={m} type="button" onClick={() => toggleFocus(m)} disabled={disabled}
                  className="rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors"
                  style={{ background: picked ? A.a + "1F" : C.card, border: "1px solid " + (picked ? A.a : C.line), color: disabled ? C.faint : C.text, opacity: disabled ? 0.5 : 1 }}>
                  {m}
                </button>
              );
            })}
          </div>
          <p className="text-xs mt-3" style={{ color: C.faint }}>{p.focusMuscles.length}/2 selected - you can change this anytime in Settings.</p>
        </div>)}

        {step === 7 && (<div className="bl-fade">
          <H kicker="YOUR NUMBERS" title={"Locked in, " + (p.name.trim() || "Athlete")} sub="Calculated with the Mifflin-St Jeor equation from what you told us. Fine-tune any of this later in Settings." />
          <div className="rounded-2xl p-4 mb-3 text-center" style={{ background: C.card, border: "1px solid " + C.line, borderTop: "1px solid " + A.a + "44", boxShadow: SHADOW.card }}>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: C.faint, letterSpacing: 2 }}>DAILY TARGET - {(GOAL_LABEL[p.goal] || "").toUpperCase()}</div>
            <div className="flex justify-center my-0.5"><HeroNumber value={targets.goal} size={48} accent={A} /></div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: C.dim }}>kcal / day &nbsp;·&nbsp; maintenance {fmtNum(targets.maintain)} kcal</div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[["PROTEIN", targets.proteinG + "g", C.text], ["FAT", targets.fatG + "g", C.text], ["CARBS", targets.carbG + "g", C.text]].map((m, i) => (
              <div key={i} className="rounded-xl py-3 text-center" style={{ background: C.card, border: "1px solid " + C.line }}>
                <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 22, color: m[2] }}>{m[1]}</div>
                <div style={{ fontFamily: F.mono, fontSize: 9, color: C.faint, letterSpacing: 1 }}>{m[0]}</div>
              </div>
            ))}
          </div>
          {(() => { const b = bmiOf(+p.weightKg, +p.heightCm); const band = bmiBand(b); return b ? (
            <div className="rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between" style={{ background: C.card, border: "1px solid " + C.line }}>
              <span style={{ fontFamily: F.mono, fontSize: 10, color: C.faint, letterSpacing: 1.5 }}>BMI</span>
              <span style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 18 }}>{b} <span style={{ fontSize: 11, color: band.color, fontFamily: F.mono, fontWeight: 600 }}>{band.label.toUpperCase()}</span></span>
            </div>
          ) : null; })()}
          <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: A.a + "14", border: "1px solid " + A.a + "44" }}>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: A.a, letterSpacing: 1.5 }}>YOUR PLAN</div>
              <div className="font-bold" style={{ fontFamily: F.disp, fontSize: 20 }}>{PROGRAMS[recommendProgram(p)].name.toUpperCase()}</div>
            </div>
            <Chip color={A.a}>{GYM_LABEL[p.gym]}</Chip>
          </div>
          {p.focusMuscles.length > 0 && (
            <div className="rounded-xl px-4 py-3 mt-3 flex items-center justify-between" style={{ background: C.card, border: "1px solid " + C.line }}>
              <span style={{ fontFamily: F.mono, fontSize: 10, color: C.faint, letterSpacing: 1.5 }}>FOCUS</span>
              <div className="flex gap-1.5">{p.focusMuscles.map(m => <Chip key={m} color={MUSCLES[m]}>{m.toUpperCase()}</Chip>)}</div>
            </div>
          )}
          <p className="text-xs mt-3" style={{ color: C.faint }}>Estimates for healthy adults - adjust based on real-world results, and speak to a professional for personalised dietary advice.</p>
        </div>)}
      </div>

      <div className="pt-4">
        {step < 7 ? (
          <button onClick={() => valid && setStep(step + 1)} disabled={!valid}
            className="w-full py-3.5 rounded-2xl font-bold transition-transform active:scale-95"
            style={{ background: valid ? AG : C.card2, color: valid ? "#0D0E11" : C.faint, fontFamily: F.disp, fontSize: 19, letterSpacing: 1 }}>
            {step === 0 ? "LET'S GO" : "CONTINUE"}
          </button>
        ) : (
          <button onClick={finish} className="w-full py-3.5 rounded-2xl font-bold transition-transform active:scale-95"
            style={{ background: AG, color: "#0D0E11", fontFamily: F.disp, fontSize: 19, letterSpacing: 1 }}>
            ENTER BURNLAB
          </button>
        )}
        {step === 0 && <button onClick={() => onDone(null)} className="w-full text-center mt-3 text-sm" style={{ color: C.faint }}>Skip for now</button>}
      </div>
    </div>
  );
}

/* ================= MAIN APP ================= */
const DEFAULTS = { program: null, history: [], profile: null, weights: [], foodLog: [], customFoods: [], settings: { accent: "ember", autoRest: true, plates: true, weeklyTarget: 15, sound: true, vibrate: true, restOverride: null, photoCadence: "weekly" }, subs: {} };
const PER_WEEK = { ppl: 4, ul: 4, fb: 3 };

/* ---- timer finish alerts ---- */
let _actx = null;
function unlockAudio() { // must be called from a user gesture (iOS)
  try {
    _actx = _actx || new (window.AudioContext || window.webkitAudioContext)();
    if (_actx.state === "suspended") _actx.resume();
  } catch (e) {}
}
function playDing() {
  try {
    if (!_actx) return;
    const t0 = _actx.currentTime;
    [[880, 0], [1174.7, 0.16], [1568, 0.32]].forEach(([f, dt]) => {
      const o = _actx.createOscillator(), g = _actx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + dt);
      g.gain.exponentialRampToValueAtTime(0.28, t0 + dt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.5);
      o.connect(g); g.connect(_actx.destination);
      o.start(t0 + dt); o.stop(t0 + dt + 0.55);
    });
  } catch (e) {}
}
/* ---- graded haptics ----
   vibrateEnabled is a module-level flag (mirrors the _actx pattern above) so
   shared components like GradBtn/Toggle can fire tactile feedback without
   needing data.settings threaded through props. */
let vibrateEnabled = true;
const HAPTIC = {
  tap: [8],
  light: [10],
  medium: [16, 30, 16],
  success: [14, 40, 14],
  warning: [30, 60, 30],
  pr: [16, 50, 16, 50, 30],
  trophy: [20, 40, 20, 40, 40],
  timerDone: [180, 90, 180],
};
function haptic(kind) { try { if (navigator.vibrate) navigator.vibrate(HAPTIC[kind] || HAPTIC.tap); } catch (e) {} }
function notifyDone() {
  try {
    if (document.visibilityState === "visible") return;
    if ("Notification" in window && Notification.permission === "granted")
      new Notification("Rest complete — GO! \uD83D\uDD25", { body: "Next set is waiting.", tag: "burnlab-rest", icon: "/icons/icon-192.png" });
  } catch (e) {}
}

/* ---- BMI ---- */
function bmiOf(weightKg, heightCm) {
  const m = heightCm / 100;
  if (!weightKg || !m) return null;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}
function bmiBand(b) {
  if (b == null) return null;
  if (b < 18.5) return { label: "Underweight", color: C.dim };
  if (b < 25) return { label: "Healthy range", color: C.dim };
  if (b < 30) return { label: "Overweight", color: C.dim };
  return { label: "Obese range", color: C.red };
}

/* ---- progress photo compression ---- */
function fileToDataUrl(file, maxEdge = 760, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
    img.src = url;
  });
}
const CADENCE_MS = { daily: 864e5, weekly: 7 * 864e5 };
function photoDue(photos, cadence) {
  if (cadence === "off") return false;
  if (!photos.length) return true;
  return Date.now() - new Date(photos[photos.length - 1].date).getTime() >= (CADENCE_MS[cadence] || CADENCE_MS.weekly);
}

/* ---- bodyweight tracking ---- */
const W_RANGES = { "1W": 7, "1M": 30, "3M": 91, "6M": 182, "1Y": 365, "ALL": 1e6 };
function weighStreak(weights) {
  const days = new Set(weights.map(w => new Date(w.date).toDateString()));
  let streak = 0; const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1); // a streak survives until a full day is missed
  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

/* ---- weight trend smoothing (EMA) + MacroFactor-style insights ---- */
function trendSeries(weights) {
  const sorted = [...weights].sort((a, b) => new Date(a.date) - new Date(b.date));
  const alpha = 0.25; let ema = null;
  return sorted.map(w => { ema = ema == null ? w.kg : ema + alpha * (w.kg - ema); return { date: w.date, kg: w.kg, trend: Math.round(ema * 100) / 100 }; });
}
function weightInsights(weights) {
  const s = trendSeries(weights);
  if (s.length < 2) return null;
  const now = s[s.length - 1];
  const trendAt = (daysAgo) => { const cut = Date.now() - daysAgo * 864e5; const before = s.filter(p => new Date(p.date).getTime() <= cut); return before.length ? before[before.length - 1].trend : null; };
  const change = (daysAgo) => { const past = trendAt(daysAgo); return past == null ? null : Math.round((now.trend - past) * 10) / 10; };
  const spanDays = (new Date(now.date) - new Date(s[0].date)) / 864e5 || 1;
  const totalChange = now.trend - s[0].trend;
  const weeklyRate = Math.round((totalChange / spanDays) * 7 * 100) / 100;
  const energy = Math.round((weeklyRate * 7700) / 7); // kcal/day surplus/deficit (~7700 kcal/kg)
  return {
    current: now.trend, weeklyRate, energy,
    projection30: Math.round((now.trend + weeklyRate * (30 / 7)) * 10) / 10,
    changes: [3, 7, 14, 30, 90].map(d => ({ d, v: change(d) })),
  };
}
/* consecutive-week workout streak (weeks, current week counts if trained) */
function weekStreak(history) {
  const trained = new Set(history.map(h => { const d = new Date(h.date); const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return m.toISOString().slice(0, 10); }));
  let streak = 0; const cur = new Date(); cur.setHours(0, 0, 0, 0); cur.setDate(cur.getDate() - ((cur.getDay() + 6) % 7));
  while (trained.has(cur.toISOString().slice(0, 10))) { streak++; cur.setDate(cur.getDate() - 7); }
  return streak;
}

/* ---- 30-day habit heatmap card ---- */
function Heat30({ dates, color, label, foot, sub }) {
  const cells = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i)); return dates.has(d.toDateString());
  });
  return (
    <div className="flex-1 rounded-2xl p-3.5" style={{ background: C.card, border: "1px solid " + C.line }}>
      <div style={{ fontFamily: F.mono, fontSize: 9, color: C.faint, letterSpacing: 1.5 }}>{label}</div>
      <div style={{ fontFamily: F.mono, fontSize: 8, color: C.faint }}>LAST 30 DAYS</div>
      <div className="grid grid-cols-10 gap-1 mt-2 mb-2.5" aria-hidden="true">
        {cells.map((on, i) => <span key={i} className="rounded-sm" style={{ height: 11, background: on ? color : "#ffffff10" }} />)}
      </div>
      <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 19, lineHeight: 1 }}>{foot} <span style={{ fontSize: 11, color: C.dim, fontWeight: 600 }}>{sub}</span></div>
    </div>
  );
}

/* ---- app-wide living background: slow drifting accent-tinted glows ---- */
function LivingBackground({ A }) {
  return (
    <div className="bl-livebg" aria-hidden="true">
      <div className="bl-orb" style={{ width: 380, height: 380, background: A.a, top: -150, left: -110, opacity: 0.22, filter: "blur(76px)" }} />
      <div className="bl-orb bl-orb2" style={{ width: 340, height: 340, background: A.b, top: "34%", right: -170, opacity: 0.18, filter: "blur(80px)" }} />
      <div className="bl-orb bl-orb3" style={{ width: 300, height: 300, background: A.a, bottom: -130, left: "16%", opacity: 0.14, filter: "blur(70px)" }} />
      <div className="bl-orb bl-orb2" style={{ width: 200, height: 200, background: A.b, top: "62%", left: -90, opacity: 0.10, filter: "blur(60px)" }} />
    </div>
  );
}

export default function BurnLabApp() {
  const [tab, setTab] = useState("home");
  const [overlay, setOverlay] = useState(null);       // 'library' | 'settings'
  const [data, setData] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [splash, setSplash] = useState("in");         // 'in' | 'out' | null
  const [session, setSession] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);      // central-FAB shortcuts sheet
  const [openIdx, setOpenIdx] = useState(null);
  const [detail, setDetail] = useState(null);
  const [rest, setRest] = useState(null);          // { end: ms timestamp, total: seconds } | null
  const [now, setNow] = useState(Date.now());
  const restFired = useRef(false);
  const [photos, setPhotos] = useState([]);
  const [photoView, setPhotoView] = useState(null); // index into photos
  const [photoErr, setPhotoErr] = useState("");
  const fileRef = useRef(null);
  const [weighOpen, setWeighOpen] = useState(false);
  const [fuelDate, setFuelDate] = useState(dayKey(new Date()));
  const [addFor, setAddFor] = useState(null);        // meal slot being added to, or null
  const [addStage, setAddStage] = useState("search"); // 'search' | 'portion' | 'quick' | 'create'
  const [foodQuery, setFoodQuery] = useState("");
  const [portionFood, setPortionFood] = useState(null);
  const [portionG, setPortionG] = useState("");
  const [quick, setQuick] = useState({ name: "", kcal: "", p: "", c: "", f: "" });
  const [customF, setCustomF] = useState({ n: "", k: "", p: "", c: "", f: "", sg: "" });
  const [entryEdit, setEntryEdit] = useState(null);   // entry object being edited
  const [showIdeas, setShowIdeas] = useState(false);
  const importRef = useRef(null);
  const [importMsg, setImportMsg] = useState("");
  const [offResults, setOffResults] = useState([]);
  const [offState, setOffState] = useState("idle"); // idle | loading | done | error | offline
  const [scanOpen, setScanOpen] = useState(false);
  const [scanNonce, setScanNonce] = useState(0);   // bump to restart the camera
  const [scanMsg, setScanMsg] = useState("");
  const [scanDead, setScanDead] = useState(false); // camera stopped, showing a result message
  const videoRef = useRef(null);
  const scanCtl = useRef(null);
  const [weighVal, setWeighVal] = useState("");
  const [weightRange, setWeightRange] = useState("1M");
  const [progRange, setProgRange] = useState("1M");     // volume/sets analytics range
  const [progMetric, setProgMetric] = useState("sets"); // 'sets' | 'volume'
  const [calOffset, setCalOffset] = useState(0);        // months back from current for workout calendar
  const [summary, setSummary] = useState(null);
  const [trophyToast, setTrophyToast] = useState(null);
  const [swapFor, setSwapFor] = useState(null);       // item index
  const [rpeHelp, setRpeHelp] = useState(false);
  const [discardArm, setDiscardArm] = useState(false);
  const [query, setQuery] = useState("");
  const [libFilter, setLibFilter] = useState("All");
  const [trophyCat, setTrophyCat] = useState("All");
  const [showAllMuscles, setShowAllMuscles] = useState(false);
  const [chartEx, setChartEx] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const tick = useRef(null);

  /* load + migrate */
  useEffect(() => {
    (async () => {
      try {
        const r = await store.get("burnlab-data-v2");
        if (r && r.value) {
          const parsed = JSON.parse(r.value);
          setData({ ...DEFAULTS, ...parsed, settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) }, subs: parsed.subs || {} });
        }
      } catch (e1) {
        try { // migrate from the OVERLOAD beta
          const old = await store.get("overload-data-v1");
          if (old && old.value) {
            const parsed = JSON.parse(old.value);
            setData({ ...DEFAULTS, program: parsed.program || null, history: parsed.history || [] });
          }
        } catch (e2) { /* fresh install */ }
      }
      try { // progress photos live under their own key (they're big)
        const ph = await store.get("burnlab-photos-v1");
        if (ph && ph.value) setPhotos(JSON.parse(ph.value));
      } catch (e3) { /* none yet */ }
      setLoaded(true);
    })();
  }, []);

  /* splash animation */
  useEffect(() => {
    const t1 = setTimeout(() => setSplash("out"), 1300);
    const t2 = setTimeout(() => setSplash(null), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const save = async (next) => {
    setData(next);
    try { await store.set("burnlab-data-v2", JSON.stringify(next)); } catch (e) { console.error("save failed", e); }
  };

  /* ---------- progress photos ---------- */
  const savePhotos = async (list) => {
    const prev = photos;
    setPhotos(list);
    try { await store.set("burnlab-photos-v1", JSON.stringify(list)); setPhotoErr(""); }
    catch (e) { setPhotos(prev); setPhotoErr("Device storage is full — delete an older photo and try again."); }
  };
  const onPickPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const img = await fileToDataUrl(file);
      const nextPhotos = [...photos, { id: Date.now(), date: todayISO(), img, weightKg: (data.weights && data.weights.length ? data.weights[data.weights.length - 1].kg : (data.profile && data.profile.weightKg) || null) }];
      const beforeIds = troph.filter(t => t.done).map(t => t.id);
      await savePhotos(nextPhotos);
      setTab("progress");
      notifyTrophyUnlocks(beforeIds, data, nextPhotos);
    } catch (err) { setPhotoErr("Couldn't read that image — try a different photo."); }
  };
  const deletePhoto = (id) => { if (data.settings.vibrate) haptic("warning"); savePhotos(photos.filter(p => p.id !== id)); setPhotoView(null); };
  const photoIsDue = photoDue(photos, data.settings.photoCadence);

  /* ---------- bodyweight ---------- */
  const weights = data.weights || [];
  const weighedToday = weights.some(w => new Date(w.date).toDateString() === new Date().toDateString());
  const latestWeight = weights.length ? weights[weights.length - 1].kg : (data.profile && data.profile.weightKg) || null;
  const logWeight = () => {
    const kg = parseFloat(weighVal);
    if (!kg || kg < 20 || kg > 400) return;
    const today = new Date().toDateString();
    const rest_ = weights.filter(w => new Date(w.date).toDateString() !== today);
    const list = [...rest_, { date: todayISO(), kg: round1(kg) }].sort((a, b) => new Date(a.date) - new Date(b.date));
    let next = { ...data, weights: list };
    if (data.profile) { // keep calorie targets and BMI in step with real bodyweight
      const p = { ...data.profile, weightKg: round1(kg) };
      if (p.targets) p.targets = calcTargets(p);
      next.profile = p;
    }
    const beforeIds = troph.filter(t => t.done).map(t => t.id);
    save(next); setWeighOpen(false); setWeighVal("");
    notifyTrophyUnlocks(beforeIds, next, photos);
  };

  /* ---------- food tracker ---------- */
  const foodLog = data.foodLog || [];
  const customFoods = data.customFoods || [];
  const dayEntries = foodLog.filter(e => e.d === fuelDate);
  const dayTotals = dayEntries.reduce((a, e) => ({ kcal: a.kcal + e.kcal, p: a.p + e.p, c: a.c + e.c, f: a.f + e.f }), { kcal: 0, p: 0, c: 0, f: 0 });
  const eatenToday = foodLog.filter(e => e.d === dayKey(new Date())).reduce((a, e) => a + e.kcal, 0);
  const recentFoods = useMemo(() => {
    const seen = new Map();
    for (let i = foodLog.length - 1; i >= 0 && seen.size < 12; i--) {
      const e = foodLog[i];
      if (e.per100 && !seen.has(e.name)) seen.set(e.name, { i: "recent-" + i, n: e.name, k: e.per100.k, p: e.per100.p, c: e.per100.c, f: e.per100.f, sl: null, sg: e.g });
    }
    return [...seen.values()];
  }, [foodLog]);
  const closeAdd = () => { setAddFor(null); setAddStage("search"); setFoodQuery(""); setPortionFood(null); setPortionG(""); setQuick({ name: "", kcal: "", p: "", c: "", f: "" }); setCustomF({ n: "", k: "", p: "", c: "", f: "", sg: "" }); };
  const addEntry = (entry) => {
    const next = { ...data, foodLog: [...foodLog, { id: Date.now() + Math.random(), d: fuelDate, ...entry }] };
    const beforeIds = troph.filter(t => t.done).map(t => t.id);
    save(next); closeAdd();
    notifyTrophyUnlocks(beforeIds, next, photos);
  };

  /* worldwide food search — Open Food Facts (online only; logged foods become
     available offline via Recents since their per-100g values are stored) */
  useEffect(() => {
    if (addFor === null || addStage !== "search") return;
    const q = foodQuery.trim();
    if (q.length < 3) { setOffResults([]); setOffState("idle"); return; }
    if (typeof navigator !== "undefined" && navigator.onLine === false) { setOffResults([]); setOffState("offline"); return; }
    setOffState("loading");
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const url = "https://world.openfoodfacts.org/cgi/search.pl?action=process&search_simple=1&json=1&page_size=15&fields=code,product_name,brands,nutriments&search_terms=" + encodeURIComponent(q);
        const res = await fetch(url, { signal: ctrl.signal });
        const js = await res.json();
        const items = (js.products || []).map(pr => {
          const nu = pr.nutriments || {};
          const k = nu["energy-kcal_100g"];
          if (!pr.product_name || k == null || k <= 0) return null;
          return {
            i: "off-" + (pr.code || Math.random()),
            n: pr.product_name + (pr.brands ? " · " + pr.brands.split(",")[0].trim() : ""),
            k: Math.round(k),
            p: Math.round((nu.proteins_100g || 0) * 10) / 10,
            c: Math.round((nu.carbohydrates_100g || 0) * 10) / 10,
            f: Math.round((nu.fat_100g || 0) * 10) / 10,
            sl: null, sg: null,
          };
        }).filter(Boolean).slice(0, 12);
        setOffResults(items); setOffState("done");
      } catch (e) {
        if (e.name !== "AbortError") { setOffResults([]); setOffState("error"); }
      }
    }, 500);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [foodQuery, addFor, addStage]);
  const addPortion = () => {
    const g = parseFloat(portionG); if (!portionFood || !g || g <= 0) return;
    const m = macrosFor(portionFood, g);
    addEntry({ meal: addFor, name: portionFood.n, g, ...m, per100: { k: portionFood.k, p: portionFood.p, c: portionFood.c, f: portionFood.f } });
  };
  const addQuick = () => {
    const kcal = Math.round(parseFloat(quick.kcal) || 0); if (!kcal) return;
    addEntry({ meal: addFor, name: quick.name.trim() || "Quick add", g: null, kcal, p: Math.round(parseFloat(quick.p) || 0), c: Math.round(parseFloat(quick.c) || 0), f: Math.round(parseFloat(quick.f) || 0), per100: null });
  };
  const createCustom = () => {
    const k = parseFloat(customF.k); if (!customF.n.trim() || !k) return;
    const food = { i: "cf-" + Date.now(), n: customF.n.trim(), k, p: parseFloat(customF.p) || 0, c: parseFloat(customF.c) || 0, f: parseFloat(customF.f) || 0, sl: customF.sg ? "1 serving" : null, sg: parseFloat(customF.sg) || null };
    save({ ...data, customFoods: [...customFoods, food] });
    setPortionFood(food); setPortionG(food.sg ? String(food.sg) : "100"); setAddStage("portion");
  };
  const deleteEntry = (id) => { if (data.settings.vibrate) haptic("warning"); save({ ...data, foodLog: foodLog.filter(e => e.id !== id) }); setEntryEdit(null); };
  const updateEntry = (id, g) => {
    const grams = parseFloat(g); const e = foodLog.find(x => x.id === id);
    if (!e || !e.per100 || !grams || grams <= 0) return;
    const m = macrosFor({ k: e.per100.k, p: e.per100.p, c: e.per100.c, f: e.per100.f }, grams);
    save({ ...data, foodLog: foodLog.map(x => x.id === id ? { ...x, g: grams, ...m } : x) });
    setEntryEdit(null);
  };
  const shiftFuelDate = (days) => { const d = new Date(fuelDate + "T12:00:00"); d.setDate(d.getDate() + days); setFuelDate(dayKey(d)); };

  /* ---------- backup: export / import ---------- */
  const exportData = () => {
    try {
      const payload = { app: "burnlab", version: 3, exported: todayISO(), data, photos };
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "burnlab-backup-" + dayKey(new Date()) + ".json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) { setImportMsg("Export failed - try again."); }
  };
  const onImportFile = async (ev) => {
    const file = ev.target.files && ev.target.files[0]; ev.target.value = "";
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (!payload || payload.app !== "burnlab" || !payload.data) throw new Error("bad file");
      const d = payload.data;
      await save({ ...DEFAULTS, ...d, settings: { ...DEFAULTS.settings, ...(d.settings || {}) }, subs: d.subs || {}, weights: d.weights || [], foodLog: d.foodLog || [], customFoods: d.customFoods || [] });
      if (Array.isArray(payload.photos)) await savePhotos(payload.photos);
      setImportMsg("Backup restored - " + (d.history || []).length + " workouts, " + (d.foodLog || []).length + " food entries.");
    } catch (e) { setImportMsg("That doesn't look like a BurnLab backup file."); }
  };

  /* ---------- barcode scanning (camera decodes on-device via ZXing;
       the product lookup itself needs a connection, like worldwide search) ---------- */
  const stopScan = () => {
    try { if (scanCtl.current) scanCtl.current.stop(); } catch (e) {}
    scanCtl.current = null;
    setScanOpen(false); setScanMsg(""); setScanDead(false);
  };
  const lookupBarcode = async (code) => {
    setScanDead(true);
    if (typeof navigator !== "undefined" && navigator.onLine === false) { setScanMsg("Scanned " + code + ", but the product lookup needs a connection. Search by name or Create a food instead."); return; }
    setScanMsg("Scanned " + code + " - looking it up...");
    try {
      const res = await fetch("https://world.openfoodfacts.org/api/v2/product/" + encodeURIComponent(code) + ".json?fields=product_name,brands,nutriments");
      const js = await res.json();
      const pr = js && js.product;
      const nu = (pr && pr.nutriments) || {};
      const k = nu["energy-kcal_100g"];
      if (js && js.status === 1 && pr && pr.product_name && k != null && k > 0) {
        const food = {
          i: "off-" + code,
          n: pr.product_name + (pr.brands ? " · " + pr.brands.split(",")[0].trim() : ""),
          k: Math.round(k), p: Math.round((nu.proteins_100g || 0) * 10) / 10,
          c: Math.round((nu.carbohydrates_100g || 0) * 10) / 10, f: Math.round((nu.fat_100g || 0) * 10) / 10,
          sl: null, sg: null,
        };
        stopScan();
        setPortionFood(food); setPortionG("100"); setAddStage("portion");
      } else {
        setScanMsg("Scanned " + code + ", but it's not in the database (or has no calorie data). Try name search, or Create a food from the label.");
      }
    } catch (e) { setScanMsg("Scanned " + code + ", but the lookup failed - check your connection and try again."); }
  };
  useEffect(() => {
    if (!scanOpen) return;
    let cancelled = false;
    setScanDead(false);
    (async () => {
      try {
        setScanMsg("Starting camera...");
        const mod = await import("@zxing/browser");
        const reader = new mod.BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } }, videoRef.current,
          (result, err, ctl) => {
            if (result && !cancelled) { try { ctl.stop(); } catch (e) {} scanCtl.current = null; lookupBarcode(result.getText()); }
          }
        );
        if (cancelled) { try { controls.stop(); } catch (e) {} return; }
        scanCtl.current = controls;
        setScanMsg("Point the frame at the barcode");
      } catch (e) {
        if (!cancelled) {
          setScanDead(true);
          setScanMsg(e && (e.name === "NotAllowedError" || e.name === "SecurityError")
            ? "Camera permission was denied. Allow camera access for this site in your browser settings, then try again."
            : "Couldn't start the camera on this device - name search still works.");
        }
      }
    })();
    return () => { cancelled = true; try { if (scanCtl.current) scanCtl.current.stop(); } catch (e) {} scanCtl.current = null; };
  }, [scanOpen, scanNonce]);

  /* ---------- recent records (last ~8 exercises trained) ---------- */
  const recentRecords = useMemo(() => {
    const seen = new Map();
    for (let i = data.history.length - 1; i >= 0 && seen.size < 8; i--)
      for (const e of data.history[i].exercises)
        if (!seen.has(e.id) && e.sets.length) { seen.set(e.id, e); if (seen.size >= 8) break; }
    return [...seen.values()].map(e => ({
      id: e.id,
      vol: e.sets.reduce((a, s) => a + s.w * s.r, 0),
      reps: Math.max(...e.sets.map(s => s.r)),
      rm: Math.round(Math.max(...e.sets.map(s => e1rm(s.w, s.r))) * 10) / 10,
    }));
  }, [data.history]);


  /* photo reminder notification — fires when the app opens and one is due */
  useEffect(() => {
    if (!loaded || !photoIsDue || data.settings.photoCadence === "off") return;
    try {
      if ("Notification" in window && Notification.permission === "granted")
        new Notification("Progress photo time \uD83D\uDCF8", { body: "Same spot, same light — snap this " + (data.settings.photoCadence === "daily" ? "day's" : "week's") + " photo.", tag: "burnlab-photo", icon: "/icons/icon-192.png" });
    } catch (e) {}
  }, [loaded]);

  /* rest timer — wall-clock based, so a locked screen can't freeze or skip it.
     Remaining time is always derived from Date.now() vs the stored end timestamp;
     when the tab is throttled/suspended, the visibilitychange re-sync snaps it
     straight to the correct value the moment the screen unlocks. */
  const restLeft = rest ? Math.max(0, Math.ceil((rest.end - now) / 1000)) : null;
  useEffect(() => {
    if (rest === null) return;
    tick.current = setInterval(() => setNow(Date.now()), 250);
    const resync = () => setNow(Date.now());
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("focus", resync);
    return () => { clearInterval(tick.current); document.removeEventListener("visibilitychange", resync); window.removeEventListener("focus", resync); };
  }, [rest !== null]);
  /* silent keep-alive: an inaudible looping oscillator that keeps the audio
     context active while resting — reduces background tab timer throttling
     on Android/Chrome, no extra asset needed. */
  useEffect(() => {
    if (rest === null || !_actx) return;
    try {
      const gain = _actx.createGain();
      gain.gain.value = 0.00001;
      const osc = _actx.createOscillator();
      osc.frequency.value = 20;
      osc.connect(gain); gain.connect(_actx.destination);
      osc.start();
      return () => { try { osc.stop(); osc.disconnect(); gain.disconnect(); } catch (e) {} };
    } catch (e) {}
  }, [rest !== null]);
  useEffect(() => {
    if (rest === null) { restFired.current = false; return; }
    if (restLeft === 0 && !restFired.current) {
      restFired.current = true;
      if (data.settings.sound) playDing();
      if (data.settings.vibrate) haptic("timerDone");
      notifyDone();
    }
    if (restLeft > 0) restFired.current = false;
  }, [restLeft, rest === null]);

  useEffect(() => { vibrateEnabled = !!data.settings.vibrate; }, [data.settings.vibrate]);

  const A = ACCENTS[data.settings.accent] || ACCENTS.ember;
  const AG = "linear-gradient(90deg," + A.a + "," + A.b + ")";
  const AGV = "linear-gradient(to bottom," + A.b + "," + A.a + ")"; // vertical accent (buttons/FAB/pills)
  const SHIMMER = "linear-gradient(90deg," + A.a + "," + A.b + ",#FAFAFA," + A.a + ")";
  const gym = (data.profile && data.profile.gym) || "full";
  const focusMuscles = (data.profile && data.profile.focusMuscles) || [];
  const muscleTarget = m => data.settings.weeklyTarget + (focusMuscles.includes(m) ? 4 : 0);
  const program = data.program ? PROGRAMS[data.program] : null;

  const nextDayIdx = useMemo(() => {
    if (!program) return 0;
    const relevant = data.history.filter(h => h.program === data.program);
    if (!relevant.length) return 0;
    const lastIdx = program.days.findIndex(d => d.id === relevant[relevant.length - 1].dayId);
    return lastIdx === -1 ? 0 : (lastIdx + 1) % program.days.length;
  }, [data, program]);

  /* ---------- this week vs program targets ---------- */
  const weekAgg = useMemo(() => {
    const cutoff = Date.now() - 7 * 864e5;
    const ms = new Set(), exs = new Set(); let sets = 0;
    for (const h of data.history) if (new Date(h.date).getTime() > cutoff)
      for (const e of h.exercises) { sets += e.sets.length; exs.add(e.id); if (EX[e.id]) ms.add(EX[e.id].muscle); }
    let setsT = 60, exsT = 20;
    if (program) {
      const per = PER_WEEK[data.program] || 3;
      setsT = Math.round(program.days.reduce((a, d) => a + d.items.reduce((b, i) => b + i.sets, 0), 0) / program.days.length * per);
      exsT = Math.round(program.days.reduce((a, d) => a + d.items.length, 0) / program.days.length * per);
    }
    return { muscles: ms.size, musclesT: 8, sets, setsT, exs: exs.size, exsT };
  }, [data.history, program, data.program]);

  const week = useMemo(() => weeklySets(data.history), [data.history]);
  const heatMap = useMemo(() => Object.fromEntries(Object.keys(MUSCLES).map(m => [m, muscleHeat(data.history, m, muscleTarget(m))])), [data.history, data.settings.weeklyTarget, focusMuscles]);
  const workoutsThisWeek = data.history.filter(h => new Date(h.date).getTime() > Date.now() - 7 * 864e5).length;
  const scienceTip = SCIENCE[new Date().getDate() % SCIENCE.length];
  const troph = useMemo(() => achievements(data, photos), [data, photos]);
  const notifyTrophyUnlocks = (beforeIds, nextData, nextPhotos) => {
    const unlocked = achievements(nextData, nextPhotos).filter(t => t.done && !beforeIds.includes(t.id));
    if (unlocked.length) { setTrophyToast(unlocked); if (data.settings.vibrate) haptic("trophy"); }
  };
  const hour = new Date().getHours();
  const greet = hour < 12 ? "MORNING" : hour < 18 ? "AFTERNOON" : "EVENING";
  const firstName = data.profile && data.profile.name ? data.profile.name.split(" ")[0] : "";

  /* ---------- session actions ---------- */
  const startSession = (progKey, day) => {
    const items = day.items.map(it => {
      const ex = resolveEx(it.ex, data.subs, gym);
      const focus = EX[ex] && focusMuscles.includes(EX[ex].muscle);
      return { ...it, origEx: it.ex, ex, sets: focus ? Math.min(it.sets + 1, 6) : it.sets, focus };
    });
    const entries = items.map(it => {
      const prev = lastPerf(data.history, it.ex);
      const sug = suggest(data.history, it);
      return Array.from({ length: it.sets }, (_, i) => {
        const ps = prev ? prev.sets[i] : null;
        return { w: sug ? sug.w : (ps ? ps.w : ""), r: sug ? sug.r : (ps ? ps.r : ""), rpe: it.rpe, done: false };
      });
    });
    setSession({ program: progKey, dayId: day.id, dayName: day.name, startedAt: Date.now(), items, entries });
    setOpenIdx(0); setDiscardArm(false); setTab("train");
  };

  const updateSet = (idx, i, field, val) => setSession(s => ({
    ...s, entries: s.entries.map((arr, j) => j === idx ? arr.map((st, k) => k === i ? { ...st, [field]: val } : st) : arr),
  }));

  /* ---------- rest-timer / service-worker handoff ---------- */
  const postToSW = (msg) => { try { navigator.serviceWorker && navigator.serviceWorker.controller && navigator.serviceWorker.controller.postMessage(msg); } catch (e) {} };
  const scheduleRest = (end, total) => { setRest({ end, total }); postToSW({ type: "rest-schedule", end, total }); };
  const clearRest = () => { setRest(null); postToSW({ type: "rest-cancel" }); };

  const toggleDone = (idx, i, restSec) => {
    const st = session.entries[idx][i];
    const done = !st.done;
    if (done && (!st.w || !st.r)) return;
    unlockAudio(); // user gesture: primes the audio context so the finish chime can play
    if (done && data.settings.vibrate) haptic("tap");
    if (done && data.settings.autoRest) {
      const secs = data.settings.restOverride || restSec;
      restFired.current = false;
      scheduleRest(Date.now() + secs * 1000, secs);
      setNow(Date.now());
    }
    setSession({ ...session, entries: session.entries.map((arr, j) => j === idx ? arr.map((x, k) => k === i ? { ...x, done } : x) : arr) });
  };

  const addSet = idx => setSession(s => ({
    ...s, entries: s.entries.map((arr, j) => j === idx ? [...arr, { ...(arr[arr.length - 1] || { rpe: 7 }), done: false, warmup: false }] : arr),
  }));
  /* warm-up sets sit at the top of an exercise, are marked W in the table, and are dropped at
     finishSession so they never enter history — every volume/PR/heat aggregate reads history, so
     this single exclusion keeps warm-ups out of all of them. */
  const addWarmup = idx => setSession(s => ({
    ...s, entries: s.entries.map((arr, j) => j === idx ? [{ w: "", r: "", rpe: (arr[0] && arr[0].rpe) || 6, done: false, warmup: true }, ...arr] : arr),
  }));
  const removeSet = (idx, i) => setSession(s => ({
    ...s, entries: s.entries.map((arr, j) => j === idx ? (arr.length > 1 ? arr.filter((_, k) => k !== i) : arr) : arr),
  }));

  const swapExercise = (idx, newId) => {
    const it = session.items[idx];
    const items = session.items.map((x, i) => i === idx ? { ...x, ex: newId } : x);
    const prev = lastPerf(data.history, newId);
    const sug = suggest(data.history, { ...it, ex: newId });
    const entries = session.entries.map((arr, i) => i === idx
      ? Array.from({ length: it.sets }, (_, j) => { const ps = prev ? prev.sets[j] : null; return { w: sug ? sug.w : (ps ? ps.w : ""), r: sug ? sug.r : (ps ? ps.r : ""), rpe: it.rpe, done: false }; })
      : arr);
    setSession({ ...session, items, entries });
    save({ ...data, subs: { ...data.subs, [it.origEx]: newId } });
    setSwapFor(null);
  };

  const finishSession = () => {
    const exercises = session.items.map((it, i) => ({
      id: it.ex,
      sets: session.entries[i].filter(s => s.done && !s.warmup).map(s => ({ w: parseFloat(s.w) || 0, r: parseInt(s.r) || 0, rpe: s.rpe })),
    })).filter(e => e.sets.length);
    if (!exercises.length) { setSession(null); clearRest(); return; }
    const before = troph.filter(t => t.done).map(t => t.id);
    const prsList = [];
    for (const e of exercises) {
      const prevBest = bestE1RM(data.history, e.id);
      const nowBest = Math.max(...e.sets.map(s => e1rm(s.w, s.r)));
      if (nowBest > prevBest && prevBest > 0) prsList.push({ id: e.id, e1: nowBest });
    }
    const full = session.entries.every(arr => arr.length > 0 && arr.every(s => s.done));
    const entry = {
      date: todayISO(), program: session.program, dayId: session.dayId, dayName: session.dayName,
      durationMin: Math.max(1, Math.round((Date.now() - session.startedAt) / 60000)), full, exercises,
    };
    const newHistory = [...data.history, entry];
    const after = achievements({ ...data, history: newHistory }, photos).filter(t => t.done).map(t => t.id);
    const newTrophies = after.filter(id => !before.includes(id)).map(id => TROPHIES.find(t => t.id === id));
    const tonnage = exercises.reduce((t, e) => t + e.sets.reduce((a, s) => a + s.w * s.r, 0), 0);
    const setCount = exercises.reduce((t, e) => t + e.sets.length, 0);
    save({ ...data, history: newHistory });
    if (data.settings.vibrate) haptic(prsList.length ? "pr" : newTrophies.length ? "trophy" : "success");
    setSummary({ entry, tonnage, setCount, prs: prsList, trophies: newTrophies });
    setSession(null); clearRest();
  };

  const onOnboardDone = (profile, prog) => {
    if (!profile) { save({ ...data, profile: { done: true, skipped: true } }); return; }
    save({ ...data, profile, program: prog || data.program });
    setTab("home");
  };

  /* ---------- guards ---------- */
  if (!loaded) return <div className="min-h-screen" style={{ background: "#000000" }} />;

  const showOnboarding = !data.profile;

  const photoSection = (
    <>
      <SectionLabel>PROGRESS PHOTOS</SectionLabel>
      <div className="rounded-2xl p-4 mb-5" style={{ background: C.card, border: "1px solid " + C.line }}>
        {photos.length >= 2 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[photos[0], photos[photos.length - 1]].map((p, i) => (
              <button key={p.id} onClick={() => setPhotoView(i === 0 ? 0 : photos.length - 1)} className="relative rounded-xl overflow-hidden" style={{ border: "1px solid " + C.line }}>
                <img src={p.img} alt={(i === 0 ? "First" : "Latest") + " progress photo"} className="w-full object-cover" style={{ height: 170 }} />
                <span className="absolute top-1.5 left-1.5 text-xs font-bold px-2 py-0.5 rounded" style={{ background: "#0D0E11CC", color: i === 0 ? C.dim : A.a, fontFamily: F.mono, fontSize: 9 }}>{i === 0 ? "DAY ONE" : "LATEST"}</span>
                <span className="absolute bottom-1.5 left-1.5 text-xs px-2 py-0.5 rounded" style={{ background: "#0D0E11CC", color: C.text, fontFamily: F.mono, fontSize: 9 }}>{dayLabel(p.date)}{p.weightKg ? " · " + fmtKg(p.weightKg) + "kg" : ""}</span>
              </button>
            ))}
          </div>
        )}
        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {[...photos].reverse().slice(0, 8).map(p => {
              const idx = photos.findIndex(x => x.id === p.id);
              return (
                <button key={p.id} onClick={() => setPhotoView(idx)} className="rounded-lg overflow-hidden" style={{ border: "1px solid " + C.line }} aria-label={"Photo " + dayLabel(p.date)}>
                  <img src={p.img} alt={"Progress " + dayLabel(p.date)} className="w-full object-cover" style={{ height: 74 }} />
                </button>
              );
            })}
          </div>
        )}
        {photos.length === 0 && <p className="text-sm mb-3" style={{ color: C.dim }}>Track the change the scales can't show. Photos are compressed and stored only on this device - same spot, same light, same pose works best.</p>}
        <div className="flex items-center justify-between">
          <button onClick={() => fileRef.current && fileRef.current.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm" style={{ background: AG, color: "#0D0E11" }}>
            <Camera size={15} /> Add photo
          </button>
          <span style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>{photos.length} STORED · {data.settings.photoCadence.toUpperCase()} REMINDERS</span>
        </div>
        {photoErr && <p className="text-xs mt-2" style={{ color: C.red }}>{photoErr}</p>}
      </div>
    </>
  );

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: "#000000", fontFamily: F.body, color: C.text }}>
      <div className="w-full relative flex flex-col bl-grain" style={{ maxWidth: 480, background: C.bg, minHeight: "100vh", borderLeft: "1px solid " + C.line, borderRight: "1px solid " + C.line, isolation: "isolate" }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} style={{ display: "none" }} aria-hidden="true" />
        <input ref={importRef} type="file" accept="application/json,.json" onChange={onImportFile} style={{ display: "none" }} aria-hidden="true" />

        {/* ======= SPLASH ======= */}
        {splash && (
          <div className={"fixed inset-0 z-50 flex flex-col items-center justify-center " + (splash === "out" ? "bl-gone" : "")} style={{ background: "#000000" }}>
            <div className="bl-splash-in" style={{ fontFamily: F.brand, fontWeight: 800, fontSize: 36, letterSpacing: 4 }}>
              BURN<span className="bl-shimmer" style={{ backgroundImage: SHIMMER }}>LAB</span>
            </div>
            <div className="bl-splash-sub" style={{ fontFamily: F.mono, fontSize: 10, color: C.faint, letterSpacing: 4, marginTop: 10 }}>TRAIN · FUEL · PROGRESS</div>
          </div>
        )}

        {showOnboarding ? (
          <Onboarding A={A} onDone={onOnboardDone} />
        ) : (
          <>
            {/* ======= HEADER — minimal, chrome pared back; the screen title carries identity ======= */}
            <header className="flex items-center justify-between px-6 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}>
              <BurnLabLogo className="h-7" />
              <div className="flex items-center gap-2.5">
                <button onClick={() => setOverlay("library")} aria-label="Exercise library" className="transition-transform active:scale-90"><BookOpen size={19} color={C.faint} /></button>
                <button onClick={() => setOverlay("settings")} aria-label="Your profile" className="rounded-full flex items-center justify-center transition-transform active:scale-90" style={{ width: 30, height: 30, background: "transparent", border: "1.5px solid " + A.a, fontFamily: F.brand, fontWeight: 800, fontSize: 12, color: A.a }}>
                  {(firstName || "A").slice(0, 1).toUpperCase()}
                </button>
              </div>
            </header>

            <main className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: 150 }}>

              {/* ================= HOME ================= */}
              {tab === "home" && (
                <div className="bl-fade">
                  {/* greeting — big editorial */}
                  <div className="mb-1">
                    <div style={{ fontFamily: F.mono, fontSize: 10, color: C.faint, letterSpacing: 3 }}>GOOD {greet} · {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).toUpperCase()}</div>
                    <div style={{ fontFamily: F.disp, fontSize: 40, lineHeight: 1.04, letterSpacing: -1, textTransform: "uppercase", marginTop: 4 }}>{firstName || "Athlete"}</div>
                  </div>

                  {/* weekly burn — signature HeroArc moment, full-bleed on black */}
                  {(() => {
                    const goalSessions = PER_WEEK[data.program] || 3;
                    const pct = Math.min(100, Math.round((workoutsThisWeek / goalSessions) * 100));
                    const weekTonnage = data.history.filter(h => new Date(h.date).getTime() > Date.now() - 7 * 864e5)
                      .reduce((t, h) => t + h.exercises.reduce((a, e) => a + e.sets.reduce((x, s) => x + s.w * s.r, 0), 0), 0);
                    const weekSets = data.history.filter(h => new Date(h.date).getTime() > Date.now() - 7 * 864e5)
                      .reduce((t, h) => t + h.exercises.reduce((a, e) => a + e.sets.length, 0), 0);
                    const heroStats = [
                      { label: "SETS", val: weekSets },
                      { label: "KG LIFTED", val: fmtNum(Math.round(weekTonnage)) },
                      ...(data.profile && data.profile.targets ? [{ label: "KCAL LEFT", val: fmtNum(Math.max(0, data.profile.targets.goal - eatenToday)) }] : []),
                    ];
                    return (
                      <div className="mb-8 mt-2">
                        <div className="bl-rise">
                          <HeroArc value={pct} max={100} size={244} unit="%" label="WEEKLY BURN" sublabel={workoutsThisWeek + " / " + goalSessions + " SESSIONS"} accent={A} />
                        </div>
                        <div className="grid mt-6" style={{ gridTemplateColumns: "repeat(" + heroStats.length + ",1fr)" }}>
                          {heroStats.map((s, i) => (
                            <div key={s.label} className="text-center px-2" style={{ borderLeft: i > 0 ? "1px solid " + C.line : "none" }}>
                              <div style={{ fontFamily: F.disp, fontSize: 30, letterSpacing: -0.5, color: C.text, lineHeight: 1.06, fontVariantNumeric: "tabular-nums" }}>{s.val}</div>
                              <div style={{ fontFamily: F.mono, fontSize: 8.5, color: C.faint, letterSpacing: 2, marginTop: 5 }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* week strip */}
                  {(() => {
                    const monday = new Date(); monday.setHours(0, 0, 0, 0); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
                    const trained = new Set(data.history.map(h => new Date(h.date).toDateString()));
                    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
                    return (
                      <div className="grid grid-cols-7 gap-1.5 mb-6">
                        {days.map((d, i) => {
                          const isToday = d.toDateString() === new Date().toDateString();
                          const did = trained.has(d.toDateString());
                          return (
                            <div key={i} className="bl-spring rounded-2xl py-2.5 text-center hover:-translate-y-1"
                              style={did
                                ? { background: AGV, border: "1px solid transparent", boxShadow: "0 6px 18px -6px " + A.a + "88" }
                                : { background: "rgba(24,24,27,0.20)", border: "1px solid " + (isToday ? A.a : "transparent") }}>
                              <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: 1, color: did ? "#000" : C.faint }}>{"MTWTFSS"[i]}</div>
                              <div style={{ fontFamily: F.disp, fontSize: 16, color: did ? "#000" : isToday ? C.text : C.dim }}>{d.getDate()}</div>
                              {did && <Check size={10} color="#000" className="mx-auto" strokeWidth={3} />}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* photo reminder */}
                  {photoIsDue && data.settings.photoCadence !== "off" && (
                    <button onClick={() => fileRef.current && fileRef.current.click()} className="w-full rounded-2xl p-4 mb-4 flex items-center gap-3 text-left" style={{ background: C.blue + "14", border: "1px solid " + C.blue + "44" }}>
                      <Camera size={19} color={C.blue} className="shrink-0" />
                      <div className="flex-1">
                        <div className="font-bold text-sm">{photos.length ? "Progress photo due" : "Take your first progress photo"}</div>
                        <div className="text-xs" style={{ color: C.dim }}>Same spot, same light, same pose - future you will thank you.</div>
                      </div>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0" style={{ background: C.blue, color: "#fff" }}>Snap</span>
                    </button>
                  )}

                  {/* weigh-in prompt */}
                  {!weighedToday && data.profile && (
                    <button onClick={() => { setWeighVal(latestWeight ? String(latestWeight) : ""); setWeighOpen(true); }} className="w-full rounded-2xl p-4 mb-4 flex items-center gap-3 text-left" style={{ background: C.green + "12", border: "1px solid " + C.green + "3D" }}>
                      <Weight size={19} color={C.green} className="shrink-0" />
                      <div className="flex-1">
                        <div className="font-bold text-sm">Log today's weigh-in</div>
                        <div className="text-xs" style={{ color: C.dim }}>{weighStreak(weights) > 0 ? weighStreak(weights) + "-day streak going - keep it alive" : "Morning, post-bathroom, before food = most consistent"}</div>
                      </div>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0" style={{ background: C.green, color: "#fff" }}>Log</span>
                    </button>
                  )}

                  {/* next session - the app's one clear action, sized and lit up to feel like it */}
                  {program ? (
                    <div className="relative overflow-hidden rounded-3xl p-6 mb-5" style={{ background: C.card, border: "1px solid " + C.line }}>
                      <div className="relative">
                        <div style={{ fontFamily: F.mono, fontSize: 10, color: A.a, letterSpacing: 3 }}>UP NEXT</div>
                        <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 46, lineHeight: 1, letterSpacing: -1, textTransform: "uppercase", marginTop: 2 }}>{program.days[nextDayIdx].name}</div>
                        <div className="text-sm mt-1" style={{ color: C.dim }}>{program.days[nextDayIdx].items.length} exercises · {program.days[nextDayIdx].items.reduce((a, i) => a + i.sets, 0)} working sets</div>
                        {session ? (
                          <button onClick={() => setTab("train")} className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-sm" style={{ background: C.card, border: "1px solid " + A.a, color: A.a }}>
                            <Play size={15} /> Resume in progress
                          </button>
                        ) : (
                          <GradBtn A={A} onClick={() => startSession(data.program, program.days[nextDayIdx])} className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-base" style={{ boxShadow: "0 10px 32px -6px " + A.a + "88" }}>
                            <Play size={18} fill="#0D0E11" /> Start Workout
                          </GradBtn>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl p-5 mb-4" style={{ background: C.card, border: "1px solid " + C.line }}>
                      <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 28 }}>PICK YOUR SPLIT</div>
                      <p className="text-sm mt-1" style={{ color: C.dim }}>Choose a training program to unlock your first session.</p>
                      <GradBtn A={A} onClick={() => setTab("train")} className="mt-4 px-5 py-2.5 rounded-full text-sm">Choose a program</GradBtn>
                    </div>
                  )}

                  {/* dashboard card grid — tappable destinations (Nippard-style), each driving into detail.
                      Trophies lives here now that it's off the 5-slot nav. */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { key: "tro", label: "TROPHIES", val: troph.filter(t => t.done).length, sub: "of " + troph.length + " unlocked", icon: Trophy, go: () => setTab("trophies") },
                      { key: "rec", label: "RECORDS", val: recentRecords.length, sub: recentRecords.length ? "new this month" : "none this month", icon: Award, go: () => setTab("progress") },
                      { key: "fuel", label: "NUTRITION", val: (data.profile && data.profile.targets) ? Math.max(0, data.profile.targets.goal - eatenToday) : "—", sub: (data.profile && data.profile.targets) ? "kcal left today" : "set up in fuel", icon: Utensils, go: () => setTab("fuel") },
                      { key: "hist", label: "HISTORY", val: data.history.length, sub: "workouts logged", icon: Dumbbell, go: () => setTab("progress") },
                    ].map((c, i) => {
                      const Icon = c.icon;
                      return (
                        <button key={c.key} onClick={() => { if (data.settings.vibrate) haptic("tap"); c.go(); }}
                          className="liquid-glass bl-spring bl-stagger relative overflow-hidden text-left active:scale-[0.97] hover:scale-[1.01] hover:border-white/20"
                          style={{ "--i": i, borderRadius: 26, padding: SPACE[6] }}>
                          <div className="flex items-start justify-between mb-3">
                            <span className="flex items-center justify-center rounded-full" style={{ width: 36, height: 36, background: A.a + "1A", border: "1px solid " + A.a + "33" }}><Icon size={16} color={A.a} /></span>
                            <ArrowUpRight size={9} color={C.text} style={{ opacity: 0.2 }} />
                          </div>
                          <div style={{ fontFamily: F.disp, fontSize: 36, lineHeight: 1.06, letterSpacing: -0.5 }}>{typeof c.val === "number" ? fmtNum(c.val) : c.val}</div>
                          <div style={{ fontFamily: F.mono, fontSize: 9, color: C.faint, letterSpacing: 2, marginTop: 6 }}>{c.label}</div>
                          <div className="text-xs truncate" style={{ color: C.dim, marginTop: 1 }}>{c.sub}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* muscle-map banner — opens the flagship full-screen body diagram */}
                  {(() => {
                    const hot = Object.entries(heatMap).filter(([, v]) => v.ratio > 1.1).length;
                    const dormant = Object.entries(heatMap).filter(([, v]) => v.daysSince === Infinity || v.daysSince > 10).length;
                    return (
                      <button onClick={() => { if (data.settings.vibrate) haptic("tap"); setTab("muscles"); }}
                        className="w-full relative overflow-hidden text-left transition-transform active:scale-[0.98] mb-4"
                        style={{ background: C.card, border: "1px solid " + C.line, borderRadius: 24, padding: SPACE[6] }}>
                        <div className="relative flex items-center justify-between gap-3">
                          <div>
                            <div style={{ fontFamily: F.mono, fontSize: 10, color: A.a, letterSpacing: 2 }}>MUSCLE MAP</div>
                            <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 26, textTransform: "uppercase", lineHeight: 1.05 }}>What's fired up</div>
                            <div className="text-xs mt-1" style={{ color: C.dim }}>{hot} firing hot · {dormant} dormant · tap to inspect</div>
                          </div>
                          <div className="shrink-0 flex items-center justify-center rounded-full" style={{ width: 46, height: 46, background: A.a + "1F", border: "1px solid " + A.a + "44" }}><ArrowUpRight size={20} color={A.a} /></div>
                        </div>
                      </button>
                    );
                  })()}

                  {/* weekly targets trio - Apple Activity-style concentric rings */}
                  <SectionLabel>THIS WEEK VS TARGET</SectionLabel>
                  <div className="rounded-3xl px-3 py-5 mb-4" style={{ background: C.card, border: "1px solid " + C.line, boxShadow: SHADOW.card }}>
                    <ActivityRings rings={[
                      { label: "Sets", color: A.a, value: weekAgg.sets, target: weekAgg.setsT },
                      { label: "Muscles", color: C.blue, value: weekAgg.muscles, target: weekAgg.musclesT },
                      { label: "Exercises", color: "#71717A", value: weekAgg.exs, target: weekAgg.exsT },
                    ]} />
                  </div>

                  {/* muscle grid: top-3 "in focus" by default, full Upper/Lower grouping on Show All */}
                  {(() => {
                    const rows = Object.keys(MUSCLES).map(m => ({
                      m, value: Math.round(week[m] || 0), target: muscleTarget(m),
                      pct: (week[m] || 0) / muscleTarget(m), focus: focusMuscles.includes(m),
                    }));
                    const top3 = [...rows].sort((a, b) => b.pct - a.pct).slice(0, 3);
                    return (
                      <>
                        <SectionLabel>{showAllMuscles ? "MUSCLES THIS WEEK" : "TOP 3 IN FOCUS"}</SectionLabel>
                        <div className="rounded-2xl px-4 py-1 mb-4" style={{ background: C.card, border: "1px solid " + C.line }}>
                          {!showAllMuscles ? (
                            top3.map(r => <MuscleBar key={r.m} label={r.m} color={MUSCLES[r.m]} value={r.value} target={r.target} focus={r.focus} />)
                          ) : (
                            Object.entries(MUSCLE_GROUPS).map(([group, muscles]) => (
                              <div key={group}>
                                <div className="pt-3 pb-1" style={{ fontFamily: F.mono, fontSize: 9, color: C.faint, letterSpacing: 1.5 }}>{group.toUpperCase()}</div>
                                {muscles.map(m => {
                                  const r = rows.find(x => x.m === m);
                                  return <MuscleBar key={m} label={m} color={MUSCLES[m]} value={r.value} target={r.target} focus={r.focus} />;
                                })}
                              </div>
                            ))
                          )}
                          <button onClick={() => setShowAllMuscles(v => !v)} className="w-full text-center py-2.5 text-xs font-bold mt-1" style={{ color: A.a, borderTop: "1px solid " + C.line }}>
                            {showAllMuscles ? "Show less" : "Show all " + Object.keys(MUSCLES).length}
                          </button>
                        </div>
                      </>
                    );
                  })()}

                  {/* lab note */}
                  <div className="rounded-2xl p-4 mb-2 flex gap-3" style={{ background: A.a + "12", border: "1px solid " + A.a + "3D" }}>
                    <Info size={18} color={A.a} className="shrink-0 mt-0.5" />
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 10, color: A.a, letterSpacing: 1.5 }}>LAB NOTE</div>
                      <p className="text-sm mt-1">{scienceTip}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= MUSCLE MAP (flagship) ================= */}
              {tab === "muscles" && (
                <div className="bl-fade">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => setTab("home")} aria-label="Back to home" className="p-2 rounded-full" style={{ background: C.card, border: "1px solid " + C.line }}><ChevronLeft size={18} color={C.dim} /></button>
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 10, color: A.a, letterSpacing: 2 }}>RECOVERY & LOAD</div>
                      <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 30, textTransform: "uppercase", lineHeight: 1 }}>Muscle Map</div>
                    </div>
                  </div>

                  <div className="rounded-3xl p-6 mt-5 mb-5 relative overflow-hidden" style={{ background: C.card, border: "1px solid " + C.line }}>
                    <div className="relative">
                      <AnatomyBody fem={data.profile && data.profile.sex === "f"} mode="heat" heatMap={heatMap} size={260} />
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <span style={{ fontFamily: F.mono, fontSize: 9, color: C.faint, letterSpacing: 1 }}>DORMANT</span>
                        <div className="h-2 rounded-full" style={{ width: 160, background: "linear-gradient(90deg,#3A4050,#FF3B30,#FFE38A)" }} />
                        <span style={{ fontFamily: F.mono, fontSize: 9, color: C.faint, letterSpacing: 1 }}>FIRED UP</span>
                      </div>
                      <p className="text-xs text-center mt-2" style={{ color: C.faint }}>Tap a muscle - colour blends cold to hot from recent training load vs your weekly target.</p>
                    </div>
                  </div>

                  {/* ranked breakdown — Nippard "set levels" style list */}
                  <SectionLabel>THIS WEEK BY MUSCLE</SectionLabel>
                  <div className="rounded-2xl overflow-hidden mb-4" style={{ background: C.card, border: "1px solid " + C.line }}>
                    {Object.keys(MUSCLES)
                      .map(m => ({ m, ...heatMap[m], sets: Math.round(week[m] || 0), target: muscleTarget(m) }))
                      .sort((a, b) => b.ratio - a.ratio)
                      .map((r, i, arr) => {
                        const col = heatColor(r.ratio || 0, MUSCLES[r.m]);
                        const state = r.daysSince === Infinity ? "Never trained" : r.ratio > 1.1 ? "Fired up" : r.ratio > 0.5 ? "Working" : r.daysSince > 10 ? "Dormant" : "Recovering";
                        return (
                          <div key={r.m} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i ? "1px solid " + C.line : "none" }}>
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col, boxShadow: "0 0 8px " + col + "aa" }} />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm">{r.m}{focusMuscles.includes(r.m) && <span className="ml-1" aria-label="Focus muscle">🎯</span>}</div>
                              <div style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>{state}{r.daysSince !== Infinity ? " · " + Math.round(r.daysSince) + "d ago" : ""}</div>
                            </div>
                            <span style={{ fontFamily: F.mono, fontSize: 12, color: C.dim }}>{r.sets}<span style={{ color: C.faint }}>/{r.target}</span></span>
                          </div>
                        );
                      })}
                  </div>

                  <button onClick={() => setOverlay("settings")} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold mb-2" style={{ background: C.card, border: "1px solid " + C.line, color: C.dim }}>
                    <Info size={14} /> Set your focus muscles in Settings
                  </button>
                </div>
              )}

              {/* ================= TRAIN: PICKER ================= */}
              {tab === "train" && !session && (
                <div className="bl-fade">
                  <ScreenHead eyebrow="Your program" title="Train" />
                  <div className="grid grid-cols-3 gap-2.5 mb-6">
                    {Object.entries(PROGRAMS).map(([k, pr]) => {
                      const on = data.program === k;
                      return (
                        <button key={k} onClick={() => { if (data.settings.vibrate) haptic("tap"); save({ ...data, program: k }); }}
                          className={"bl-spring rounded-2xl px-2 py-4 text-center active:scale-[0.97] " + (on ? "liquid-glass-active" : "")}
                          style={on
                            ? { transform: "scale(1.03)", borderColor: A.a + "cc", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.22), 0 0 20px -2px " + A.a + "55" }
                            : { background: "rgba(24,24,27,0.30)", border: "1px solid transparent" }}>
                          <div style={{ fontFamily: F.disp, fontSize: 17, lineHeight: 1, letterSpacing: -0.5, color: on ? C.text : C.faint }}>{pr.name.toUpperCase()}</div>
                          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: 1, marginTop: 4, color: on ? A.a : C.faint }}>{pr.freq}</div>
                        </button>
                      );
                    })}
                  </div>

                  {program ? (
                    <div key={data.program} className="bl-fade">
                      <p className="text-sm mb-4" style={{ color: C.dim }}>{program.blurb}{gym !== "full" && " Exercises auto-adapt to your " + GYM_LABEL[gym].toLowerCase() + " setup."}</p>
                      {program.days.map((day, di) => (
                        <div key={day.id} className={"bl-spring rounded-3xl mb-4 overflow-hidden " + (di === nextDayIdx ? "liquid-glass-active" : "liquid-glass")} style={di === nextDayIdx ? { borderColor: A.a + "66" } : {}}>
                          <div className="flex items-center justify-between px-4 pt-3.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 24, textTransform: "uppercase" }}>{day.name}</span>
                                {di === nextDayIdx && <Chip color={A.a}>UP NEXT</Chip>}
                              </div>
                              <div style={{ fontFamily: F.mono, fontSize: 10, color: C.dim }}>{day.items.length} exercises · {day.items.reduce((a, i) => {
                                const rid = resolveEx(i.ex, data.subs, gym);
                                return a + (focusMuscles.includes(EX[rid].muscle) ? Math.min(i.sets + 1, 6) : i.sets);
                              }, 0)} sets</div>
                            </div>
                            {di === nextDayIdx ? (
                              <GradBtn A={A} onClick={() => startSession(data.program, day)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm"><Play size={14} /> Start</GradBtn>
                            ) : (
                              <button onClick={() => startSession(data.program, day)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm" style={{ background: C.card2, color: C.text, border: "1px solid " + C.line }}><Play size={14} /> Start</button>
                            )}
                          </div>
                          <div className="px-4 py-3 mt-2" style={{ borderTop: "1px solid " + C.line }}>
                            {day.items.map((it, i) => {
                              const rid = resolveEx(it.ex, data.subs, gym);
                              const focus = focusMuscles.includes(EX[rid].muscle);
                              const sets = focus ? Math.min(it.sets + 1, 6) : it.sets;
                              return (
                                <div key={i} className="flex items-center justify-between py-1.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: MUSCLES[EX[rid].muscle] }} />
                                    <span className="text-sm truncate">{EX[rid].name}</span>
                                    {rid !== it.ex && <Repeat size={11} color={C.faint} className="shrink-0" />}
                                    {focus && <Chip color={A.a}>🎯 FOCUS</Chip>}
                                  </div>
                                  <span style={{ fontFamily: F.mono, fontSize: 11, color: C.dim }}>{sets}×{it.lo}-{it.hi} @{it.rpe}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: C.dim }}>Select a split above - you can switch any time without losing history.</p>
                  )}
                </div>
              )}

              {/* ================= TRAIN: LIVE SESSION ================= */}
              {tab === "train" && session && (
                <div className="bl-fade">
                  {(() => {
                    const totalSets = session.entries.reduce((a, arr) => a + arr.filter(s => !s.warmup).length, 0);
                    const doneSets = session.entries.reduce((a, arr) => a + arr.filter(s => !s.warmup && s.done).length, 0);
                    return (
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div style={{ fontFamily: F.mono, fontSize: 10, color: A.a, letterSpacing: 2 }}>● LIVE SESSION</div>
                            <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 30, textTransform: "uppercase", lineHeight: 1.1 }}>{session.dayName}</div>
                          </div>
                          {discardArm ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setSession(null); clearRest(); setDiscardArm(false); }} className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: C.red, color: "#fff" }}>Discard</button>
                              <button onClick={() => setDiscardArm(false)} className="text-xs px-3 py-2 rounded-lg" style={{ background: C.card, color: C.dim, border: "1px solid " + C.line }}>Keep</button>
                            </div>
                          ) : (
                            <button onClick={() => setDiscardArm(true)} className="p-2 rounded-lg" style={{ background: C.card, border: "1px solid " + C.line }} aria-label="Discard session"><X size={16} color={C.dim} /></button>
                          )}
                        </div>
                        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: C.card2 }}>
                          <div className="h-full rounded-full transition-all" style={{ width: (totalSets ? (doneSets / totalSets) * 100 : 0) + "%", background: AG }} />
                        </div>
                        <div className="mt-1" style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>{doneSets} / {totalSets} SETS</div>
                      </div>
                    );
                  })()}

                  {/* one-exercise-at-a-time runner. openIdx is the current exercise pointer (0-based). */}
                  {(() => {
                    const cur = Math.min(Math.max(0, openIdx || 0), session.items.length - 1);
                    const it = session.items[cur];
                    const ex = EX[it.ex];
                    const sets = session.entries[cur];
                    const working = sets.filter(s => !s.warmup);
                    const workDone = working.filter(s => s.done).length;
                    const sug = suggest(data.history, it);
                    const prev = lastPerf(data.history, it.ex);
                    const heaviest = Math.max(0, ...working.map(s => parseFloat(s.w) || 0));
                    const goPrev = () => { if (data.settings.vibrate) haptic("tap"); setOpenIdx(Math.max(0, cur - 1)); };
                    const goNext = () => { if (data.settings.vibrate) haptic("tap"); setOpenIdx(Math.min(session.items.length - 1, cur + 1)); };
                    /* Progressive Focus: the current set = first not-yet-logged set. Marking it done
                       shifts this forward automatically, so the highlight auto-advances with no extra state. */
                    const focusIdx = sets.findIndex(s => !s.done);
                    let workingNo = 0;
                    return (
                      <>
                        {/* exercise overview strip — tap any dot to jump back/forward */}
                        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
                          {session.items.map((x, xi) => {
                            const done = session.entries[xi].filter(s => !s.warmup).every(s => s.done) && session.entries[xi].some(s => !s.warmup);
                            const active = xi === cur;
                            return (
                              <button key={xi} onClick={() => setOpenIdx(xi)} aria-label={"Go to exercise " + (xi + 1) + ": " + EX[x.ex].name} aria-current={active ? "true" : undefined}
                                className="shrink-0 flex items-center justify-center transition-all"
                                style={{ minWidth: active ? 34 : 26, height: 26, borderRadius: RADIUS.pill, padding: active ? "0 10px" : 0,
                                  background: active ? AG : done ? C.green + "22" : C.card2, border: "1px solid " + (active ? "transparent" : done ? C.green + "55" : C.line) }}>
                                {done && !active ? <Check size={12} color={C.green} /> : <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: active ? "#0D0E11" : C.dim }}>{xi + 1}</span>}
                              </button>
                            );
                          })}
                        </div>

                        <div className="rounded-3xl overflow-hidden mb-4 bl-fade" style={{ background: C.card, border: "1px solid " + C.line, boxShadow: SHADOW.card }}>
                          {/* exercise header */}
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div style={{ fontFamily: F.mono, fontSize: 10, color: A.a, letterSpacing: 2 }}>EXERCISE {cur + 1} / {session.items.length}{it.focus ? " · 🎯 FOCUS" : ""}</div>
                                <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 30, lineHeight: 1.05, textTransform: "uppercase" }}>{ex.name}</div>
                                <div style={{ fontFamily: F.mono, fontSize: 11, color: C.dim, marginTop: 2 }}>{it.sets} × {it.lo}-{it.hi} @ RPE {it.rpe} · rest {Math.round(it.rest / 60)}m</div>
                              </div>
                              <Picto ex={ex} size={52} />
                            </div>
                            {/* action chips */}
                            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
                              <button onClick={() => setDetail(ex)} className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold" style={{ background: C.card2, border: "1px solid " + C.line, color: C.text }}><Info size={13} color={C.dim} /> Info</button>
                              <button onClick={() => { if (data.settings.vibrate) haptic("tap"); addWarmup(cur); }} className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold" style={{ background: C.yellow + "18", border: "1px solid " + C.yellow + "44", color: C.yellow }}><Flame size={13} /> Warm-up</button>
                              <button onClick={() => setSwapFor(cur)} className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold" style={{ background: C.card2, border: "1px solid " + C.line, color: C.text }}><Repeat size={13} color={C.dim} /> Swap</button>
                            </div>
                            {sug && (
                              <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: C.yellow + "12", border: "1px solid " + C.yellow + "30" }}>
                                <TrendingUp size={13} color={C.yellow} className="shrink-0" />
                                <span style={{ fontFamily: F.mono, fontSize: 11, color: C.yellow }}>
                                  {sug.mode === "load" ? "Target: load up to " + fmtKg(sug.w) + " kg × " + sug.r : "Target: beat last time - " + fmtKg(sug.w) + " kg × " + sug.r}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* set table */}
                          <div className="px-4 pb-4" style={{ borderTop: "1px solid " + C.line }}>
                            <div className="grid gap-1.5 items-center mt-3 mb-1" style={{ gridTemplateColumns: "26px 46px 1fr 1fr 52px 32px", fontFamily: F.mono, fontSize: 9, color: C.faint, letterSpacing: 1 }}>
                              <span>SET</span><span>PREV</span><span className="text-center">KG</span><span className="text-center">REPS</span>
                              <button onClick={() => setRpeHelp(true)} className="flex items-center justify-center gap-0.5" aria-label="What is RPE?" style={{ color: C.faint }}>RPE<HelpCircle size={10} /></button><span />
                            </div>
                            {sets.map((s, i) => {
                              const isW = !!s.warmup;
                              if (!isW) workingNo++;
                              const labelNo = isW ? "W" : workingNo;
                              const prevSet = !isW && prev ? prev.sets[workingNo - 1] : null;
                              const isFocus = i === focusIdx;
                              const well = { fontSize: 16, height: 44, background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, color: s.done ? C.dim : C.text, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" };
                              return (
                                <div key={i} className={"bl-spring grid gap-1.5 items-center px-2 py-2 my-1 " + (isFocus ? "liquid-glass-active " : "") + (s.done ? "bl-setdone" : "")}
                                  style={{ gridTemplateColumns: "26px 42px 1fr 1fr 50px 42px", borderRadius: 16, opacity: (isFocus || focusIdx === -1) ? 1 : 0.25 }}>
                                  <span className="flex items-center justify-center rounded-full" style={{ fontFamily: isW ? F.mono : F.disp, fontSize: isW ? 11 : 17, width: isW ? 22 : "auto", height: isW ? 22 : "auto", color: isW ? A.a : isFocus ? A.a : C.dim, background: isW ? A.a + "1A" : "transparent", border: isW ? "1px solid " + A.a + "40" : "none" }}>{labelNo}</span>
                                  <span style={{ fontFamily: F.mono, fontSize: 10, color: C.faint, fontVariantNumeric: "tabular-nums" }}>{prevSet ? fmtKg(prevSet.w) + "×" + prevSet.r : "-"}</span>
                                  <input type="number" inputMode="decimal" value={s.w} placeholder="kg" aria-label={"Set " + labelNo + " weight"}
                                    onChange={e => updateSet(cur, i, "w", e.target.value)}
                                    className={"w-full text-center font-semibold " + (s.done ? "bl-struck" : "")} style={well} />
                                  <input type="number" inputMode="numeric" value={s.r} placeholder={isW ? "reps" : it.lo + "-" + it.hi} aria-label={"Set " + labelNo + " reps"}
                                    onChange={e => updateSet(cur, i, "r", e.target.value)}
                                    className={"w-full text-center font-semibold " + (s.done ? "bl-struck" : "")} style={well} />
                                  {isW ? (
                                    <span className="text-center" style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>—</span>
                                  ) : (
                                    <select value={s.rpe} onChange={e => updateSet(cur, i, "rpe", parseFloat(e.target.value))} aria-label={"Set " + labelNo + " RPE"}
                                      className="text-center" style={{ fontSize: 15, height: 44, background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, color: C.dim, fontFamily: F.mono }}>
                                      {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                  )}
                                  <button onClick={() => toggleDone(cur, i, it.rest)} aria-label={"Mark set " + labelNo + (s.done ? " not done" : " done")}
                                    className="bl-spring flex items-center justify-center active:scale-90"
                                    style={{ height: 44, width: 42, borderRadius: 12, background: s.done ? AGV : "rgba(0,0,0,0.8)", border: s.done ? "none" : "1px solid rgba(255,255,255,0.10)", boxShadow: s.done ? "0 0 14px " + A.a + "77, inset 0 1px 1px rgba(255,255,255,0.3)" : "none" }}>
                                    <Check size={17} color={s.done ? "#000" : C.faint} strokeWidth={s.done ? 3 : 2} />
                                  </button>
                                </div>
                              );
                            })}
                            <div className="flex items-center gap-4 mt-2">
                              <button onClick={() => addSet(cur)} className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.dim }}><Plus size={13} /> Add set</button>
                              {sets.length > 1 && <button onClick={() => removeSet(cur, sets.length - 1)} className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.faint }}><Trash2 size={12} /> Remove last</button>}
                            </div>
                            {ex.barbell && data.settings.plates && heaviest >= 20 && <PlateBar weight={heaviest} />}
                          </div>
                        </div>

                        {/* button hierarchy: Next Exercise = primary gradient pill w/ highlight lip; Finish = quiet text-link */}
                        <div className="flex items-center gap-2 mb-1">
                          <button onClick={goPrev} disabled={cur === 0} aria-label="Previous exercise"
                            className="liquid-glass bl-spring flex items-center justify-center py-3.5 rounded-2xl active:scale-95"
                            style={{ width: 54, color: C.text, opacity: cur === 0 ? 0.35 : 1 }}><ChevronLeft size={18} color={C.text} /></button>
                          {cur < session.items.length - 1 ? (
                            <button onClick={goNext} className="bl-spring relative overflow-hidden flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl active:scale-[0.98]"
                              style={{ background: AGV, boxShadow: "0 10px 30px -8px " + A.a + "aa" }}>
                              <span className="absolute left-4 right-4 top-0 pointer-events-none" style={{ height: 1.5, background: "rgba(255,255,255,0.55)", borderRadius: 2 }} aria-hidden="true" />
                              <span style={{ fontFamily: F.disp, fontSize: 19, letterSpacing: -0.3, color: "#000" }}>NEXT EXERCISE</span>
                              <ChevronLeft size={18} color="#000" strokeWidth={2.6} style={{ transform: "rotate(180deg)" }} />
                            </button>
                          ) : (
                            <button onClick={finishSession} className="bl-spring relative overflow-hidden flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl active:scale-[0.98]"
                              style={{ background: AGV, boxShadow: "0 10px 30px -8px " + A.a + "aa" }}>
                              <span className="absolute left-4 right-4 top-0 pointer-events-none" style={{ height: 1.5, background: "rgba(255,255,255,0.55)", borderRadius: 2 }} aria-hidden="true" />
                              <span style={{ fontFamily: F.disp, fontSize: 19, letterSpacing: -0.3, color: "#000" }}>FINISH WORKOUT</span>
                            </button>
                          )}
                        </div>
                        {cur < session.items.length - 1 && (
                          <button onClick={finishSession} className="w-full text-center py-4 uppercase transition-colors"
                            style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, letterSpacing: 3, color: C.faint }}>
                            Finish workout
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* ================= FUEL ================= */}
              {tab === "fuel" && (
                <div className="bl-fade">
                  <ScreenHead eyebrow="Today's intake" title="Fuel" />
                  {!data.profile || data.profile.skipped || !data.profile.targets ? (
                    <div className="rounded-2xl p-6 text-center" style={{ background: C.card, border: "1px solid " + C.line }}>
                      <Utensils size={26} color={C.faint} className="mx-auto mb-2" />
                      <div style={{ fontFamily: F.disp, fontWeight: 700, fontSize: 22 }}>SET UP YOUR FUEL</div>
                      <p className="text-sm mt-1 mb-4" style={{ color: C.dim }}>Answer a two-minute questionnaire and BurnLab calculates your calories, macros and meal plan.</p>
                      <GradBtn A={A} onClick={() => save({ ...data, profile: null })} className="px-5 py-2.5 rounded-xl text-sm">Start questionnaire</GradBtn>
                    </div>
                  ) : (() => {
                    const t = data.profile.targets;
                    const mp = MEALS[GOAL_MEAL[data.profile.goal] || "maintain"];
                    const tot = mp.meals.reduce((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p }), { kcal: 0, p: 0 });
                    return (
                      <>
                        <div className="rounded-2xl p-4 mb-3 text-center" style={{ background: C.card, border: "1px solid " + C.line, borderTop: "1px solid " + A.a + "44", boxShadow: SHADOW.card }}>
                          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.faint, letterSpacing: 2 }}>DAILY TARGET · {(GOAL_LABEL[data.profile.goal] || "").toUpperCase()}</div>
                          <div className="flex justify-center my-0.5"><HeroNumber value={t.goal} size={46} accent={A} /></div>
                          <div style={{ fontFamily: F.mono, fontSize: 11, color: C.dim }}>kcal / day · maintenance {fmtNum(t.maintain)} kcal</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5 mb-4">
                          {[["PROTEIN", t.proteinG + "g", "#F0603A"], ["FAT", t.fatG + "g", "#F2B928"], ["CARBS", t.carbG + "g", "#3D9BFF"]].map((m, i) => (
                            <div key={i} className="liquid-glass bl-spring relative overflow-hidden rounded-2xl py-4 text-center active:scale-[0.97]">
                              <div style={{ fontFamily: F.disp, fontSize: 24, color: C.text, lineHeight: 1.06, letterSpacing: -0.5 }}>{m[1]}</div>
                              <div style={{ fontFamily: F.mono, fontSize: 8.5, color: C.faint, letterSpacing: 2, marginTop: 5 }}>{m[0]}</div>
                              {/* ultra-subtle macro-coded under-glow on the bottom edge */}
                              <div className="absolute left-0 right-0 bottom-0 pointer-events-none" style={{ height: 22, background: "radial-gradient(60% 100% at 50% 130%," + m[2] + "55, transparent)" }} aria-hidden="true" />
                            </div>
                          ))}
                        </div>

                        {(() => {
                          const b = bmiOf(data.profile.weightKg, data.profile.heightCm);
                          const band = bmiBand(b);
                          return b ? (
                            <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between" style={{ background: C.card, border: "1px solid " + C.line }}>
                              <div>
                                <div style={{ fontFamily: F.mono, fontSize: 9.5, color: C.faint, letterSpacing: 1.5 }}>BODY MASS INDEX</div>
                                <div className="text-xs mt-0.5" style={{ color: C.faint }}>A blunt tool - it can't tell muscle from fat, so lifters often read "high".</div>
                              </div>
                              <div className="text-right shrink-0 pl-3">
                                <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 24, lineHeight: 1 }}>{b}</div>
                                <div style={{ fontFamily: F.mono, fontSize: 9, color: band.color }}>{band.label.toUpperCase()}</div>
                              </div>
                            </div>
                          ) : null;
                        })()}

                        {/* ---------- FOOD DIARY ---------- */}
                        <div className="flex items-center justify-between mb-3">
                          <SectionLabel>FOOD DIARY</SectionLabel>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl px-2 py-2 mb-3" style={{ background: C.card, border: "1px solid " + C.line }}>
                          <button onClick={() => shiftFuelDate(-1)} className="p-2 rounded-xl" style={{ background: C.card2 }} aria-label="Previous day"><ChevronLeft size={15} color={C.dim} /></button>
                          <div className="text-center">
                            <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{fuelDate === dayKey(new Date()) ? "TODAY" : new Date(fuelDate + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).toUpperCase()}</div>
                            {fuelDate !== dayKey(new Date()) && <button onClick={() => setFuelDate(dayKey(new Date()))} className="text-xs" style={{ color: A.a }}>back to today</button>}
                          </div>
                          <button onClick={() => shiftFuelDate(1)} disabled={fuelDate >= dayKey(new Date())} className="p-2 rounded-xl" style={{ background: C.card2, opacity: fuelDate >= dayKey(new Date()) ? 0.35 : 1 }} aria-label="Next day"><ChevronLeft size={15} color={C.dim} style={{ transform: "rotate(180deg)" }} /></button>
                        </div>

                        {/* day summary */}
                        <div className="liquid-glass rounded-3xl p-5 mb-3">
                          <div className="flex items-end justify-between">
                            <div>
                              <div style={{ fontFamily: F.mono, fontSize: 9.5, color: C.faint, letterSpacing: 2 }}>EATEN</div>
                              <div style={{ fontFamily: F.disp, fontSize: 32, lineHeight: 1.06, letterSpacing: -0.5 }}>{fmtNum(Math.round(dayTotals.kcal))}<span style={{ fontSize: 13, color: C.dim }}> kcal</span></div>
                            </div>
                            <div className="text-right">
                              <div style={{ fontFamily: F.mono, fontSize: 9.5, color: C.faint, letterSpacing: 2 }}>REMAINING</div>
                              <HeroNumber value={Math.max(0, t.goal - Math.round(dayTotals.kcal))} size={36} glow={true} accent={A} />
                            </div>
                          </div>
                          {/* dual-layer glass pipe: translucent track + glowing orange liquid fill */}
                          <div className="mt-4 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)" }}>
                            <div className="bl-spring h-full rounded-full" style={{ width: Math.min(100, (dayTotals.kcal / t.goal) * 100) + "%", background: AG, boxShadow: "0 0 12px " + A.a + "cc, inset 0 1px 1px rgba(255,255,255,0.4)" }} />
                          </div>
                          <div className="grid grid-cols-3 gap-3 mt-4">
                            {[["PROTEIN", dayTotals.p, t.proteinG, "#F0603A"], ["CARBS", dayTotals.c, t.carbG, "#3D9BFF"], ["FAT", dayTotals.f, t.fatG, "#F2B928"]].map(([l, v, tg, col]) => (
                              <div key={l}>
                                <div className="flex items-baseline justify-between">
                                  <span style={{ fontFamily: F.mono, fontSize: 8.5, color: C.faint, letterSpacing: 1 }}>{l}</span>
                                  <span style={{ fontFamily: F.mono, fontSize: 10, fontVariantNumeric: "tabular-nums" }}>{Math.round(v)}<span style={{ color: C.faint }}>/{tg}g</span></span>
                                </div>
                                <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", boxShadow: "inset 0 1px 1px rgba(0,0,0,0.6)" }}>
                                  <div className="bl-spring h-full rounded-full" style={{ width: Math.min(100, (v / tg) * 100) + "%", background: A.a, boxShadow: "0 0 8px " + col + "88" }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* meals */}
                        {MEAL_SLOTS.map(([slot, label]) => {
                          const items = dayEntries.filter(e => e.meal === slot);
                          const kc = items.reduce((a, e) => a + e.kcal, 0);
                          return (
                            <div key={slot} className="rounded-2xl mb-2.5 overflow-hidden" style={{ background: C.card, border: "1px solid " + C.line }}>
                              <div className="flex items-center justify-between px-4 py-3">
                                <div>
                                  <span className="font-bold text-sm">{label}</span>
                                  {kc > 0 && <span className="ml-2" style={{ fontFamily: F.mono, fontSize: 10, color: C.dim }}>{fmtNum(Math.round(kc))} kcal</span>}
                                </div>
                                <button onClick={() => { setAddFor(slot); setAddStage("search"); }} aria-label={"Add food to " + label} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90" style={{ background: AG }}><Plus size={16} color="#0D0E11" strokeWidth={2.6} /></button>
                              </div>
                              {items.length > 0 && (
                                <div className="px-4 pb-2" style={{ borderTop: "1px solid " + C.line }}>
                                  {items.map(e2 => (
                                    <button key={e2.id} onClick={() => setEntryEdit(e2)} className="w-full flex items-center justify-between py-2 text-left transition-transform active:scale-[0.98]" style={{ borderBottom: "1px solid " + C.line + "88" }}>
                                      <div className="min-w-0">
                                        <div className="text-sm truncate">{e2.name}</div>
                                        <div style={{ fontFamily: F.mono, fontSize: 9.5, color: C.faint }}>{e2.g ? e2.g + "g · " : ""}P{Math.round(e2.p)} C{Math.round(e2.c)} F{Math.round(e2.f)}</div>
                                      </div>
                                      <span className="shrink-0 pl-2" style={{ fontFamily: F.mono, fontSize: 12 }}>{fmtNum(e2.kcal)}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <p className="text-xs mt-1 mb-4" style={{ color: C.faint }}>Built-in foods use typical values; worldwide search is powered by Open Food Facts (community data - double-check odd-looking numbers against the label). Logging works fully offline; anything you've logged stays searchable in Recents without signal.</p>

                        {/* meal ideas (collapsible) */}
                        <button onClick={() => setShowIdeas(!showIdeas)} className="w-full flex items-center justify-between rounded-2xl px-4 py-3 mb-3" style={{ background: C.card, border: "1px solid " + C.line }}>
                          <span className="font-bold text-sm">Meal ideas · {mp.label}</span>
                          {showIdeas ? <ChevronUp size={16} color={C.dim} /> : <ChevronDown size={16} color={C.dim} />}
                        </button>
                        {showIdeas && (
                          <div className="bl-fade">
                            <p className="text-sm mb-3" style={{ color: C.dim }}>{mp.note}</p>
                            {mp.meals.map((m, i) => (
                              <div key={i} className="rounded-xl px-4 py-3 mb-2" style={{ background: C.card, border: "1px solid " + C.line }}>
                                <div className="flex items-center justify-between">
                                  <span style={{ fontFamily: F.mono, fontSize: 9.5, color: A.a, letterSpacing: 1.5 }}>{m.t.toUpperCase()}</span>
                                  <div className="flex gap-1.5"><Chip>{m.kcal} KCAL</Chip><Chip color={MUSCLES.Chest}>{m.p}g P</Chip></div>
                                </div>
                                <div className="font-semibold text-sm mt-1">{m.n}</div>
                                <div className="text-sm mt-0.5" style={{ color: C.dim }}>{m.d}</div>
                              </div>
                            ))}
                            <div className="rounded-2xl p-4 flex gap-3" style={{ background: A.a + "12", border: "1px solid " + A.a + "3D" }}>
                              <Info size={17} color={A.a} className="shrink-0 mt-0.5" />
                              <p className="text-sm">Templates are a starting point - swap like-for-like foods and scale portions to hit your numbers. Drink 2-3L of water and aim for 25g+ of fibre daily. General guidance, not medical or dietetic advice.</p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* ================= TROPHIES ================= */}
              {tab === "trophies" && (
                <div className="bl-fade">
                  <ScreenHead eyebrow={troph.filter(t => t.done).length + " of " + troph.length + " unlocked"} title="Trophies"
                    right={<HeroNumber value={troph.filter(t => t.done).length} size={40} accent={A} />} />
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                    {["All", ...Object.keys(CATEGORY_LABEL)].map(cat => {
                      const on = trophyCat === cat;
                      return (
                        <button key={cat} onClick={() => setTrophyCat(cat)} className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors"
                          style={{ background: on ? A.a : C.card, color: on ? "#000" : C.dim, border: "1px solid " + (on ? A.a : C.line) }}>
                          {cat === "All" ? "All" : CATEGORY_LABEL[cat]}
                        </button>
                      );
                    })}
                  </div>
                  {["platinum", "gold", "silver", "bronze"].map(tier => (
                    <div key={tier}>
                      {troph.some(t => t.tier === tier && (trophyCat === "All" || t.category === trophyCat)) && <SectionLabel>{tier.toUpperCase()}</SectionLabel>}
                      {troph.filter(t => t.tier === tier && (trophyCat === "All" || t.category === trophyCat)).map((t, i) => (
                        <div key={t.id} className="rounded-xl px-4 py-3 mb-2 flex items-center gap-3 bl-stagger-slide" style={{ background: C.card, border: "1px solid " + (t.done ? TIER[t.tier] + "66" : C.line), opacity: t.done ? 1 : 0.75, boxShadow: t.done ? "0 6px 20px -8px " + TIER[t.tier] + "77" : "none", "--i": i }}>
                          <div className="shrink-0 rounded-full flex items-center justify-center" style={{ width: 42, height: 42, background: t.done ? TIER[t.tier] + "22" : C.card2, border: "2px solid " + (t.done ? TIER[t.tier] : C.line) }}>
                            {t.done ? <Trophy size={18} color={TIER[t.tier]} /> : <Lock size={15} color={C.faint} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm" style={{ color: t.done ? C.text : C.dim }}>{t.name}</span>
                              {t.done && <Check size={14} color={TIER[t.tier]} />}
                            </div>
                            <div className="text-xs" style={{ color: C.faint }}>{t.desc}</div>
                            {!t.done && (
                              <div className="mt-1.5 flex items-center gap-2">
                                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: C.card2 }}>
                                  <div className="h-full rounded-full" style={{ width: Math.min(100, (t.v / t.tg) * 100) + "%", background: TIER[t.tier] }} />
                                </div>
                                <span style={{ fontFamily: F.mono, fontSize: 9, color: C.faint }}>{fmtNum(Math.min(t.v, t.tg))}/{fmtNum(t.tg)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* ================= PROGRESS ================= */}
              {tab === "progress" && (
                <div className="bl-fade">
                  <ScreenHead eyebrow="Your trajectory" title="Progress" />
                  <SectionLabel>WEIGHT TREND</SectionLabel>
                  <div className="liquid-glass rounded-3xl p-5 mb-4">
                    {(() => {
                      const cutoff = Date.now() - W_RANGES[weightRange] * 864e5;
                      const inRange = trendSeries(weights).filter(w => new Date(w.date).getTime() >= cutoff);
                      const avg = inRange.length ? Math.round(inRange.reduce((a, w) => a + w.kg, 0) / inRange.length * 10) / 10 : null;
                      const diff = inRange.length >= 2 ? Math.round((inRange[inRange.length - 1].trend - inRange[0].trend) * 10) / 10 : 0;
                      const pts = inRange.map(w => ({ d: dayLabel(w.date), scale: w.kg, trend: w.trend }));
                      return (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <div style={{ fontFamily: F.mono, fontSize: 9.5, color: C.faint, letterSpacing: 1.5 }}>AVERAGE</div>
                              <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 30, lineHeight: 1 }}>{avg != null ? fmtKg(avg) : "--"} <span style={{ fontSize: 14, color: C.dim }}>kg</span></div>
                            </div>
                            <div className="text-right">
                              <div style={{ fontFamily: F.mono, fontSize: 9.5, color: C.faint, letterSpacing: 1.5 }}>CHANGE</div>
                              <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 30, lineHeight: 1, color: C.text }}>{diff > 0 ? "+" : ""}{fmtKg(diff)} <span style={{ fontSize: 14, color: C.dim }}>kg</span></div>
                            </div>
                          </div>
                          {/* scale vs smoothed trend */}
                          <div className="flex items-center gap-4 mt-3 mb-1">
                            <span className="flex items-center gap-1.5" style={{ fontFamily: F.mono, fontSize: 9, color: C.dim, letterSpacing: 1 }}><span style={{ width: 14, height: 2, background: C.faint, borderRadius: 2 }} /> SCALE</span>
                            <span className="flex items-center gap-1.5" style={{ fontFamily: F.mono, fontSize: 9, color: C.dim, letterSpacing: 1 }}><span style={{ width: 14, height: 3, background: A.a, borderRadius: 2, boxShadow: "0 0 6px " + A.a }} /> TREND</span>
                          </div>
                          {pts.length >= 2 ? (
                            <div className="mt-1 -mx-1">
                              <ResponsiveContainer width="100%" height={160}>
                                <LineChart data={pts} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
                                  <CartesianGrid stroke={C.line} strokeDasharray="3 6" vertical={false} />
                                  <XAxis dataKey="d" tick={{ fontSize: 9.5, fill: C.dim, fontFamily: F.mono }} axisLine={{ stroke: C.line }} tickLine={false} minTickGap={22} />
                                  <YAxis tick={{ fontSize: 9.5, fill: C.dim, fontFamily: F.mono }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                                  <Tooltip contentStyle={{ background: C.card2, border: "1px solid " + C.line, borderRadius: 10, fontFamily: F.mono, fontSize: 12 }} labelStyle={{ color: C.dim }} formatter={(v, n) => [v + " kg", n === "trend" ? "trend" : "scale"]} />
                                  <Line type="linear" dataKey="scale" stroke={C.faint} strokeWidth={1.5} dot={{ fill: C.faint, r: 2.5, strokeWidth: 0 }} activeDot={{ r: 4 }} />
                                  <Line type="monotone" dataKey="trend" stroke={A.a} strokeWidth={3} dot={false} activeDot={{ r: 5 }} style={{ filter: "drop-shadow(0 0 5px " + A.a + "aa)" }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <p className="text-sm my-4" style={{ color: C.dim }}>{weights.length === 0 ? "Log your first weigh-in and your trend line starts here. Consistency beats precision - same time of day, same conditions." : "One more weigh-in and the trend line appears."}</p>
                          )}
                          <div className="flex gap-1 mt-1 mb-3">
                            {Object.keys(W_RANGES).map(r => (
                              <button key={r} onClick={() => setWeightRange(r)} className="flex-1 py-1.5 rounded-full text-xs font-bold transition-colors"
                                style={{ background: weightRange === r ? C.text : C.card2, color: weightRange === r ? C.bg : C.dim, border: "1px solid " + (weightRange === r ? C.text : C.line) }}>{r}</button>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <GradBtn A={A} onClick={() => { setWeighVal(latestWeight ? String(latestWeight) : ""); setWeighOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm"><Weight size={15} /> {weighedToday ? "Update today" : "Log weigh-in"}</GradBtn>
                            <span style={{ fontFamily: F.mono, fontSize: 10, color: weighStreak(weights) > 0 ? C.green : C.faint }}>{weighStreak(weights)}-DAY STREAK</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {(() => {
                    const ins = weightInsights(weights);
                    if (!ins) return null;
                    const goal = data.profile && data.profile.goal;
                    // desired direction of trend: cut => down good, bulk => up good, else neutral
                    const dir = goal === "cut" ? -1 : goal === "bulk" ? 1 : 0;
                    const rateColor = ins.weeklyRate === 0 ? C.dim : (dir === 0 ? C.text : (Math.sign(ins.weeklyRate) === dir ? C.green : C.red));
                    const fmtRate = (v) => (v > 0 ? "+" : "") + fmtKg(Math.round(v * 100) / 100);
                    return (
                      <>
                        <SectionLabel>INSIGHTS</SectionLabel>
                        <div className="liquid-glass rounded-3xl p-5 mb-4">
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="rounded-2xl p-3" style={{ background: C.card2, border: "1px solid " + C.line }}>
                              <div style={{ fontFamily: F.mono, fontSize: 8.5, color: C.faint, letterSpacing: 1.5 }}>CURRENT TREND</div>
                              <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 24, lineHeight: 1.06 }}>{fmtKg(ins.current)}<span style={{ fontSize: 12, color: C.dim }}> kg</span></div>
                            </div>
                            <div className="rounded-2xl p-3" style={{ background: C.card2, border: "1px solid " + C.line }}>
                              <div style={{ fontFamily: F.mono, fontSize: 8.5, color: C.faint, letterSpacing: 1.5 }}>WEEKLY RATE</div>
                              <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 24, lineHeight: 1.06, color: rateColor }}>{fmtRate(ins.weeklyRate)}<span style={{ fontSize: 12, color: C.dim }}> kg/wk</span></div>
                            </div>
                            <div className="rounded-2xl p-3" style={{ background: C.card2, border: "1px solid " + C.line }}>
                              <div style={{ fontFamily: F.mono, fontSize: 8.5, color: C.faint, letterSpacing: 1.5 }}>EST. ENERGY BALANCE</div>
                              <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 24, lineHeight: 1.06, color: rateColor }}>{ins.energy > 0 ? "+" : ""}{fmtNum(ins.energy)}<span style={{ fontSize: 12, color: C.dim }}> kcal/d</span></div>
                            </div>
                            <div className="rounded-2xl p-3" style={{ background: C.card2, border: "1px solid " + C.line }}>
                              <div style={{ fontFamily: F.mono, fontSize: 8.5, color: C.faint, letterSpacing: 1.5 }}>30-DAY PROJECTION</div>
                              <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 24, lineHeight: 1.06 }}>{fmtKg(ins.projection30)}<span style={{ fontSize: 12, color: C.dim }}> kg</span></div>
                            </div>
                          </div>
                          <div style={{ fontFamily: F.mono, fontSize: 8.5, color: C.faint, letterSpacing: 1.5, marginBottom: 8 }}>TREND CHANGE OVER TIME</div>
                          <div className="rounded-2xl overflow-hidden" style={{ background: C.card2, border: "1px solid " + C.line }}>
                            {ins.changes.map((c, i, arr) => (
                              <div key={c.d} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid " + C.line : "none" }}>
                                <span className="text-sm font-semibold" style={{ color: C.dim }}>Last {c.d} {c.d === 1 ? "day" : "days"}</span>
                                {c.v == null ? (
                                  <span style={{ fontFamily: F.mono, fontSize: 11, color: C.faint }}>—</span>
                                ) : (
                                  <span style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 17, color: c.v === 0 ? C.dim : (dir === 0 ? C.text : (Math.sign(c.v) === dir ? C.green : C.red)) }}>{c.v > 0 ? "+" : ""}{fmtKg(c.v)} <span style={{ fontSize: 11, color: C.dim, fontWeight: 600 }}>kg</span></span>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs mt-3" style={{ color: C.faint }}>Rate &amp; energy come from the smoothed trend, not day-to-day scale noise. Energy balance is an estimate (~7,700 kcal/kg).</p>
                        </div>
                      </>
                    );
                  })()}

                  {data.history.length > 0 && (() => {
                    // ---- workout calendar (month grid) + streak ----
                    const trainedDays = new Set(data.history.map(h => new Date(h.date).toDateString()));
                    const streak = weekStreak(data.history);
                    const base = new Date(); base.setDate(1); base.setHours(0, 0, 0, 0); base.setMonth(base.getMonth() - calOffset);
                    const year = base.getFullYear(), month = base.getMonth();
                    const monthName = base.toLocaleString(undefined, { month: "long", year: "numeric" });
                    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const cells = [];
                    for (let i = 0; i < firstDow; i++) cells.push(null);
                    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                    const trainedThisMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(d => trainedDays.has(new Date(year, month, d).toDateString())).length;
                    const todayStr = new Date().toDateString();
                    return (
                      <>
                        <SectionLabel>TRAINING CALENDAR</SectionLabel>
                        <div className="liquid-glass rounded-3xl p-5 mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="rounded-full p-2" style={{ background: A.a + "22" }}><Flame size={16} color={A.a} /></div>
                              <div>
                                <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 22, lineHeight: 1.04 }}>{streak} <span style={{ fontSize: 13, color: C.dim }}>wk streak</span></div>
                                <div style={{ fontFamily: F.mono, fontSize: 9, color: C.faint, letterSpacing: 1 }}>{trainedThisMonth} SESSIONS THIS MONTH</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setCalOffset(o => o + 1)} aria-label="Previous month" className="rounded-full p-1.5 bl-spring" style={{ background: C.card2, border: "1px solid " + C.line }}><ChevronLeft size={16} color={C.dim} /></button>
                              <button onClick={() => setCalOffset(o => Math.max(0, o - 1))} disabled={calOffset === 0} aria-label="Next month" className="rounded-full p-1.5 bl-spring" style={{ background: C.card2, border: "1px solid " + C.line, opacity: calOffset === 0 ? 0.35 : 1 }}><ChevronRight size={16} color={C.dim} /></button>
                            </div>
                          </div>
                          <div className="text-center mb-2" style={{ fontFamily: F.mono, fontSize: 10, color: C.dim, letterSpacing: 1.5 }}>{monthName.toUpperCase()}</div>
                          <div className="grid grid-cols-7 gap-1.5">
                            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                              <div key={i} className="text-center" style={{ fontFamily: F.mono, fontSize: 8.5, color: C.faint }}>{d}</div>
                            ))}
                            {cells.map((d, i) => {
                              if (d == null) return <div key={i} />;
                              const ds = new Date(year, month, d).toDateString();
                              const trained = trainedDays.has(ds);
                              const isToday = ds === todayStr;
                              return (
                                <div key={i} className="aspect-square flex items-center justify-center rounded-full"
                                  style={{
                                    fontFamily: F.mono, fontSize: 11, fontWeight: trained ? 700 : 500,
                                    color: trained ? "#fff" : C.dim,
                                    background: trained ? AGV : "transparent",
                                    border: isToday && !trained ? "1px solid " + A.a : (trained ? "none" : "1px solid transparent"),
                                    boxShadow: trained ? "0 0 8px " + A.a + "66" : "none",
                                  }}>{d}</div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  <SectionLabel>HABITS</SectionLabel>
                  <div className="flex gap-3 mb-4">
                    <Heat30 label="WEIGH-IN" color={C.green} dates={new Set(weights.map(w => new Date(w.date).toDateString()))}
                      foot={weights.filter(w => new Date(w.date).getTime() > Date.now() - 7 * 864e5).length + "/7"} sub="this week" />
                    <Heat30 label="WORKOUTS" color={A.a} dates={new Set(data.history.map(h => new Date(h.date).toDateString()))}
                      foot={String(workoutsThisWeek)} sub="this week" />
                  </div>

                  <SectionLabel>MUSCLE HEAT</SectionLabel>
                  <div className="rounded-3xl p-4 mb-4" style={{ background: C.card, border: "1px solid " + C.line, borderTop: "1px solid #ffffff14", boxShadow: SHADOW.hero }}>
                    <AnatomyBody fem={data.profile && data.profile.sex === "f"} mode="heat" heatMap={heatMap} size={190} />
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <span style={{ fontFamily: F.mono, fontSize: 8.5, color: C.faint, letterSpacing: 1 }}>DORMANT</span>
                      <div className="h-2 rounded-full" style={{ width: 140, background: "linear-gradient(90deg,#3A4050,#FF3B30,#FFE38A)" }} />
                      <span style={{ fontFamily: F.mono, fontSize: 8.5, color: C.faint, letterSpacing: 1 }}>FIRED UP</span>
                    </div>
                    <p className="text-xs text-center mt-2" style={{ color: C.faint }}>Tap a muscle - color blends cold to hot based on recent training load vs your weekly target.</p>
                  </div>

                  {data.history.length === 0 ? (
                    <>
                      <div className="rounded-2xl p-6 text-center mb-4" style={{ background: C.card, border: "1px solid " + C.line }}>
                        <TrendingUp size={28} color={C.faint} className="mx-auto mb-2" />
                        <div style={{ fontFamily: F.disp, fontWeight: 700, fontSize: 22 }}>NO DATA YET</div>
                        <p className="text-sm mt-1" style={{ color: C.dim }}>Finish your first workout and your strength curves start here.</p>
                      </div>
                      <SectionLabel>PROGRESS PHOTOS</SectionLabel>
                      {photoSection}
                    </>
                  ) : (
                    <>
                      <SectionLabel>ESTIMATED 1RM PROGRESSION</SectionLabel>
                      <select value={chartEx || [...new Set(data.history.flatMap(h => h.exercises.map(e => e.id)))][0]}
                        onChange={e => setChartEx(e.target.value)} aria-label="Choose exercise"
                        className="w-full rounded-xl px-3 py-2.5 mb-3 font-semibold"
                        style={{ fontSize: 16, background: C.card, border: "1px solid " + C.line, color: C.text }}>
                        {[...new Set(data.history.flatMap(h => h.exercises.map(e => e.id)))].map(id => <option key={id} value={id}>{EX[id] ? EX[id].name : id}</option>)}
                      </select>
                      {(() => {
                        const id = chartEx || [...new Set(data.history.flatMap(h => h.exercises.map(e => e.id)))][0];
                        const pts = data.history.filter(h => h.exercises.some(e => e.id === id)).map(h => {
                          const e = h.exercises.find(x => x.id === id);
                          return { d: dayLabel(h.date), v: Math.round(Math.max(...e.sets.map(s => e1rm(s.w, s.r))) * 10) / 10 };
                        });
                        return (
                          <div className="rounded-2xl p-3 mb-5" style={{ background: C.card, border: "1px solid " + C.line }}>
                            <ResponsiveContainer width="100%" height={190}>
                              <LineChart data={pts} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                                <CartesianGrid stroke={C.line} strokeDasharray="3 6" vertical={false} />
                                <XAxis dataKey="d" tick={{ fontSize: 10, fill: C.dim, fontFamily: F.mono }} axisLine={{ stroke: C.line }} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: C.dim, fontFamily: F.mono }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                                <Tooltip contentStyle={{ background: C.card2, border: "1px solid " + C.line, borderRadius: 10, fontFamily: F.mono, fontSize: 12 }} labelStyle={{ color: C.dim }} formatter={v => [v + " kg", "e1RM"]} />
                                <Line type="monotone" dataKey="v" stroke={A.a} strokeWidth={2.5} dot={{ fill: A.a, r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })()}

                      <SectionLabel>TRAINING VOLUME</SectionLabel>
                      {(() => {
                        const days = W_RANGES[progRange];
                        const cutoff = Date.now() - days * 864e5;
                        const hist = data.history.filter(h => new Date(h.date).getTime() >= cutoff);
                        const isVol = progMetric === "volume";
                        const valOf = (h) => isVol
                          ? h.exercises.reduce((t, e) => t + e.sets.reduce((a, s) => a + s.w * s.r, 0), 0)
                          : h.exercises.reduce((a, e) => a + e.sets.length, 0);
                        // bucket by week for longer ranges, by session for short
                        const byWeek = days > 45;
                        const buckets = {};
                        for (const h of hist) {
                          const d = new Date(h.date);
                          let key;
                          if (byWeek) { const m = new Date(d); m.setDate(d.getDate() - ((d.getDay() + 6) % 7)); key = m.toISOString().slice(0, 10); }
                          else key = new Date(h.date).toISOString().slice(0, 10);
                          buckets[key] = (buckets[key] || 0) + valOf(h);
                        }
                        const entries = Object.entries(buckets).sort();
                        const pts = entries.map(([k, v]) => ({ d: dayLabel(k), v: Math.round(v) }));
                        const total = hist.reduce((a, h) => a + valOf(h), 0);
                        const avg = pts.length ? Math.round(total / pts.length) : 0;
                        const unit = isVol ? "kg" : "sets";
                        return (
                          <div className="liquid-glass rounded-3xl p-5 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                              {["sets", "volume"].map(m => (
                                <button key={m} onClick={() => setProgMetric(m)} className="px-3 py-1.5 rounded-full text-xs font-bold bl-spring"
                                  style={{ background: progMetric === m ? A.a : C.card2, color: progMetric === m ? "#fff" : C.dim, border: "1px solid " + (progMetric === m ? A.a : C.line) }}>{m === "sets" ? "SETS" : "TONNAGE"}</button>
                              ))}
                            </div>
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <div style={{ fontFamily: F.mono, fontSize: 9.5, color: C.faint, letterSpacing: 1.5 }}>TOTAL</div>
                                <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 28, lineHeight: 1.04 }}>{fmtNum(total)} <span style={{ fontSize: 13, color: C.dim }}>{unit}</span></div>
                              </div>
                              <div className="text-right">
                                <div style={{ fontFamily: F.mono, fontSize: 9.5, color: C.faint, letterSpacing: 1.5 }}>AVG / {byWeek ? "WK" : "SESSION"}</div>
                                <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 28, lineHeight: 1.04 }}>{fmtNum(avg)} <span style={{ fontSize: 13, color: C.dim }}>{unit}</span></div>
                              </div>
                            </div>
                            {pts.length >= 1 ? (
                              <div className="mt-2 -mx-1">
                                <ResponsiveContainer width="100%" height={150}>
                                  <BarChart data={pts} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                                    <CartesianGrid stroke={C.line} strokeDasharray="3 6" vertical={false} />
                                    <XAxis dataKey="d" tick={{ fontSize: 9.5, fill: C.dim, fontFamily: F.mono }} axisLine={{ stroke: C.line }} tickLine={false} minTickGap={16} />
                                    <YAxis tick={{ fontSize: 9.5, fill: C.dim, fontFamily: F.mono }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: C.line + "55" }} contentStyle={{ background: C.card2, border: "1px solid " + C.line, borderRadius: 10, fontFamily: F.mono, fontSize: 12 }} formatter={v => [fmtNum(v) + " " + unit, byWeek ? "week" : "session"]} />
                                    <Bar dataKey="v" fill={A.b} radius={[4, 4, 0, 0]} maxBarSize={26} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            ) : (
                              <p className="text-sm my-4" style={{ color: C.dim }}>No sessions in this range.</p>
                            )}
                            <div className="flex gap-1 mt-2">
                              {Object.keys(W_RANGES).map(r => (
                                <button key={r} onClick={() => setProgRange(r)} className="flex-1 py-1.5 rounded-full text-xs font-bold transition-colors"
                                  style={{ background: progRange === r ? C.text : C.card2, color: progRange === r ? C.bg : C.dim, border: "1px solid " + (progRange === r ? C.text : C.line) }}>{r}</button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      <SectionLabel>TOP MOVEMENTS · {progRange}</SectionLabel>
                      {(() => {
                        const days = W_RANGES[progRange];
                        const cutoff = Date.now() - days * 864e5;
                        const hist = data.history.filter(h => new Date(h.date).getTime() >= cutoff);
                        const isVol = progMetric === "volume";
                        const agg = {};
                        for (const h of hist) for (const e of h.exercises) {
                          const v = isVol ? e.sets.reduce((a, s) => a + s.w * s.r, 0) : e.sets.length;
                          agg[e.id] = (agg[e.id] || 0) + v;
                        }
                        const rows = Object.entries(agg).map(([id, v]) => ({ id, v: Math.round(v) })).sort((a, b) => b.v - a.v).slice(0, 5);
                        const max = rows.length ? rows[0].v : 1;
                        const unit = isVol ? "kg" : "sets";
                        if (!rows.length) return <div className="rounded-2xl p-5 mb-5 text-center text-sm" style={{ background: C.card, border: "1px solid " + C.line, color: C.dim }}>No movements logged in this range.</div>;
                        return (
                          <div className="rounded-2xl p-4 mb-5" style={{ background: C.card, border: "1px solid " + C.line }}>
                            {rows.map((r, i) => (
                              <div key={r.id} className={i < rows.length - 1 ? "mb-3" : ""}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-semibold truncate" style={{ maxWidth: "62%" }}>{EX[r.id] ? EX[r.id].name : r.id}</span>
                                  <span style={{ fontFamily: F.mono, fontSize: 11, color: C.dim }}>{fmtNum(r.v)} {unit}</span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden" style={{ background: C.card2 }}>
                                  <div className="h-full rounded-full" style={{ width: (r.v / max) * 100 + "%", background: AG }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      <SectionLabel>PERSONAL RECORDS · e1RM</SectionLabel>
                      <div className="rounded-2xl mb-5 overflow-hidden" style={{ background: C.card, border: "1px solid " + C.line }}>
                        {[...new Set(data.history.flatMap(h => h.exercises.map(e => e.id)))]
                          .map(id => ({ id, best: bestE1RM(data.history, id) }))
                          .sort((a, b) => b.best - a.best).slice(0, 6)
                          .map((p, i, arr) => (
                            <div key={p.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i < arr.length - 1 ? "1px solid " + C.line : "none" }}>
                              <div className="flex items-center gap-3">
                                <Award size={15} color={i === 0 ? C.yellow : C.faint} />
                                <span className="text-sm font-semibold">{EX[p.id] ? EX[p.id].name : p.id}</span>
                              </div>
                              <span style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 20 }}>{Math.round(p.best)} <span style={{ fontSize: 12, color: C.dim, fontWeight: 600 }}>kg</span></span>
                            </div>
                          ))}
                      </div>

                      {photoSection}
                      <SectionLabel>HISTORY</SectionLabel>
                      {(() => {
                        const groups = [];
                        for (const h of [...data.history].reverse()) {
                          const d = new Date(h.date);
                          const key = d.getFullYear() + "-" + d.getMonth();
                          const label = d.toLocaleString(undefined, { month: "long", year: "numeric" });
                          let g = groups.find(x => x.key === key);
                          if (!g) { g = { key, label, items: [] }; groups.push(g); }
                          g.items.push(h);
                        }
                        return groups.map(g => {
                          const sets = g.items.reduce((a, h) => a + h.exercises.reduce((x, e) => x + e.sets.length, 0), 0);
                          return (
                            <div key={g.key} className="mb-4">
                              <div className="flex items-center justify-between px-1 mb-2">
                                <span style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>{g.label.toUpperCase()}</span>
                                <span style={{ fontFamily: F.mono, fontSize: 9.5, color: C.faint, letterSpacing: 1 }}>{g.items.length} {g.items.length === 1 ? "SESSION" : "SESSIONS"} · {sets} SETS</span>
                              </div>
                              {g.items.map((h, i) => (
                                <div key={i} className="rounded-xl px-4 py-3 mb-2 flex items-center justify-between" style={{ background: C.card, border: "1px solid " + C.line }}>
                                  <div>
                                    <div className="font-semibold text-sm">{h.dayName}</div>
                                    <div style={{ fontFamily: F.mono, fontSize: 10, color: C.dim }}>{dayLabel(h.date)} · {h.durationMin} min · {h.exercises.reduce((a, e) => a + e.sets.length, 0)} sets</div>
                                  </div>
                                  <span style={{ fontFamily: F.mono, fontSize: 11, color: C.faint }}>{fmtNum(Math.round(h.exercises.reduce((t, e) => t + e.sets.reduce((a, s) => a + s.w * s.r, 0), 0)))} kg</span>
                                </div>
                              ))}
                            </div>
                          );
                        });
                      })()}
                    </>
                  )}
                </div>
              )}
            </main>

            {/* ======= RESUME PILL (session active, other tab) ======= */}
            {session && tab !== "train" && (
              <button onClick={() => setTab("train")} className="fixed left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs shadow-lg"
                style={{ bottom: "calc(env(safe-area-inset-bottom) + 86px)", background: AG, color: "#0D0E11", fontFamily: F.mono, letterSpacing: 1 }}>
                <Play size={13} fill="#0D0E11" /> WORKOUT IN PROGRESS - RESUME
              </button>
            )}

            {/* ======= REST TIMER ======= */}
            {rest !== null && (
              <div className="fixed left-1/2 -translate-x-1/2 w-full px-5 z-20" style={{ maxWidth: 480, bottom: "calc(env(safe-area-inset-bottom) + " + (session && tab !== "train" ? 148 : 92) + "px)" }}>
                <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: restLeft === 0 ? C.green : C.card2, border: "1px solid " + (restLeft === 0 ? C.green : C.line) }}>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Timer size={18} color={restLeft === 0 ? "#fff" : C.yellow} />
                      <div>
                        <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: 1.5, color: restLeft === 0 ? "#ffffffcc" : C.dim }}>{restLeft === 0 ? "REST COMPLETE" : "RESTING"}</div>
                        <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 26, lineHeight: 1, color: restLeft === 0 ? "#fff" : C.text }}>
                          {restLeft === 0 ? "GO!" : Math.floor(restLeft / 60) + ":" + String(restLeft % 60).padStart(2, "0")}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {restLeft > 0 && <button onClick={() => scheduleRest(rest.end + 30000, rest.total + 30)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: C.card, border: "1px solid " + C.line, color: C.text }}>+30s</button>}
                      <button onClick={clearRest} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: restLeft === 0 ? "#ffffff22" : C.card, border: "1px solid " + (restLeft === 0 ? "#ffffff44" : C.line), color: restLeft === 0 ? "#fff" : C.dim }}>
                        {restLeft === 0 ? "Dismiss" : "Skip"}
                      </button>
                    </div>
                  </div>
                  {restLeft > 0 && (
                    <div className="h-1" style={{ background: C.card }}>
                      <div className="h-full" style={{ width: (restLeft / rest.total) * 100 + "%", background: AG, transition: "width 0.25s linear" }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======= LIBRARY OVERLAY ======= */}
            {overlay === "library" && (
              <div className="fixed inset-0 z-30 flex justify-center" style={{ background: "#000000" }}>
                <div className="w-full flex flex-col" style={{ maxWidth: 480, background: C.bg }}>
                  <div className="flex items-center gap-3 px-5 pb-3" style={{ paddingTop: "calc(env(safe-area-inset-top) + 14px)" }}>
                    <button onClick={() => setOverlay(null)} aria-label="Back" className="p-2 rounded-xl" style={{ background: C.card, border: "1px solid " + C.line }}><ChevronLeft size={16} color={C.dim} /></button>
                    <span style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 24 }}>EXERCISE LIBRARY</span>
                  </div>
                  <div className="flex-1 px-5 overflow-y-auto" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}>
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3" style={{ background: C.card, border: "1px solid " + C.line }}>
                      <Search size={15} color={C.faint} />
                      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search exercises..." aria-label="Search exercises"
                        className="flex-1 bg-transparent" style={{ fontSize: 16, color: C.text, border: "none", outline: "none" }} />
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
                      {["All", ...Object.keys(MUSCLES)].map(m => (
                        <button key={m} onClick={() => setLibFilter(m)} className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                          style={{ background: libFilter === m ? (m === "All" ? C.text : MUSCLES[m]) : C.card, color: libFilter === m ? C.bg : C.dim, border: "1px solid " + (libFilter === m ? "transparent" : C.line) }}>
                          {m}
                        </button>
                      ))}
                    </div>
                    {EXERCISES
                      .filter(e => (libFilter === "All" || e.muscle === libFilter || e.secondary.includes(libFilter)) && e.name.toLowerCase().includes(query.toLowerCase()))
                      .map(e => {
                        const best = bestE1RM(data.history, e.id);
                        return (
                          <button key={e.id} onClick={() => setDetail(e)} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 mb-2 text-left"
                            style={{ background: C.card, border: "1px solid " + C.line }}>
                            <div className="flex items-center gap-3 min-w-0">
                              <Picto ex={e} size={44} />
                              <div className="min-w-0">
                                <div className="font-semibold text-sm truncate">{e.name}</div>
                                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.dim }}>{e.muscle}{e.secondary.length ? " · " + e.secondary.join(", ") : ""} · {e.equipment}</div>
                              </div>
                            </div>
                            {best > 0 && <div className="text-right shrink-0 pl-2">
                              <div style={{ fontFamily: F.disp, fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{Math.round(best)}</div>
                              <div style={{ fontFamily: F.mono, fontSize: 8.5, color: C.faint }}>e1RM KG</div>
                            </div>}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* ======= SETTINGS OVERLAY ======= */}
            {overlay === "settings" && (
              <SettingsPanel data={data} save={save} A={A} troph={troph}
                onExport={exportData} onImportClick={() => importRef.current && importRef.current.click()} importMsg={importMsg}
                onClose={() => setOverlay(null)}
                onRedo={() => { setOverlay(null); save({ ...data, profile: null }); }}
                confirmReset={confirmReset} setConfirmReset={setConfirmReset}
                onReset={async () => { if (data.settings.vibrate) haptic("warning"); try { await store.delete("burnlab-data-v2"); } catch (e) {} try { await store.delete("burnlab-photos-v1"); } catch (e) {} setData(DEFAULTS); setPhotos([]); setConfirmReset(false); setOverlay(null); setSession(null); }} />
            )}

            {/* ======= EXERCISE DETAIL MODAL ======= */}
            {detail && (
              <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: "#000000aa" }} onClick={() => setDetail(null)}>
                <div className="w-full rounded-t-3xl p-5 bl-fade overflow-y-auto" style={{ maxWidth: 480, maxHeight: "85vh", background: C.card2, border: "1px solid " + C.line }} onClick={e => e.stopPropagation()}>
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl p-1.5 shrink-0" style={{ background: C.card, border: "1px solid " + C.line }}><Picto ex={detail} size={72} /></div>
                      <div>
                        <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 24, lineHeight: 1.1, textTransform: "uppercase" }}>{detail.name}</div>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          <Chip color={MUSCLES[detail.muscle]}>{detail.muscle.toUpperCase()}</Chip>
                          {detail.secondary.map(s => <Chip key={s} color={MUSCLES[s]}>{s.toUpperCase()}</Chip>)}
                          <Chip>{detail.equipment.toUpperCase()}</Chip>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setDetail(null)} className="p-2 rounded-lg shrink-0" style={{ background: C.card, border: "1px solid " + C.line }} aria-label="Close"><X size={16} color={C.dim} /></button>
                  </div>
                  <div className="mt-4">
                    <div style={{ fontFamily: F.mono, fontSize: 10, color: C.faint, letterSpacing: 2 }}>HOW TO PERFORM</div>
                    {detail.cues.map((c, i) => (
                      <div key={i} className="flex gap-3 mt-3">
                        <span className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center" style={{ background: MUSCLES[detail.muscle] + "22", color: MUSCLES[detail.muscle], fontFamily: F.disp, fontWeight: 800, fontSize: 14 }}>{i + 1}</span>
                        <p className="text-sm">{c}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl p-3.5 flex gap-2.5" style={{ background: C.blue + "14", border: "1px solid " + C.blue + "44" }}>
                    <Info size={15} color={C.blue} className="shrink-0 mt-0.5" />
                    <p className="text-sm">{detail.tip}</p>
                  </div>
                  {bestE1RM(data.history, detail.id) > 0 && (
                    <div className="mt-4 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: C.card, border: "1px solid " + C.line }}>
                      <span className="text-sm font-semibold flex items-center gap-2"><Award size={15} color={C.yellow} /> Your best e1RM</span>
                      <span style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 22 }}>{Math.round(bestE1RM(data.history, detail.id))} <span style={{ fontSize: 13, color: C.dim }}>kg</span></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======= PHOTO VIEWER ======= */}
            {photoView !== null && photos[photoView] && (
              <div className="fixed inset-0 z-40 flex flex-col items-center justify-center px-5" style={{ background: "#000000E6" }} onClick={() => setPhotoView(null)}>
                <div className="w-full bl-fade" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                  <img src={photos[photoView].img} alt={"Progress photo " + dayLabel(photos[photoView].date)} className="w-full rounded-2xl" style={{ maxHeight: "68vh", objectFit: "contain", border: "1px solid " + C.line }} />
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 20 }}>{new Date(photos[photoView].date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 10, color: C.dim }}>PHOTO {photoView + 1} OF {photos.length}{photos[photoView].weightKg ? " · " + fmtKg(photos[photoView].weightKg) + " KG" : ""}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => deletePhoto(photos[photoView].id)} className="p-2.5 rounded-xl" style={{ background: C.red + "22", border: "1px solid " + C.red + "66" }} aria-label="Delete photo"><Trash2 size={16} color={C.red} /></button>
                      <button onClick={() => setPhotoView(null)} className="p-2.5 rounded-xl" style={{ background: C.card, border: "1px solid " + C.line }} aria-label="Close"><X size={16} color={C.dim} /></button>
                    </div>
                  </div>
                  {photos.length > 1 && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setPhotoView(Math.max(0, photoView - 1))} disabled={photoView === 0} className="flex-1 py-2.5 rounded-xl font-bold text-sm" style={{ background: C.card, border: "1px solid " + C.line, color: photoView === 0 ? C.faint : C.text }}>← Older</button>
                      <button onClick={() => setPhotoView(Math.min(photos.length - 1, photoView + 1))} disabled={photoView === photos.length - 1} className="flex-1 py-2.5 rounded-xl font-bold text-sm" style={{ background: C.card, border: "1px solid " + C.line, color: photoView === photos.length - 1 ? C.faint : C.text }}>Newer →</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======= ADD FOOD SHEET ======= */}
            {addFor !== null && (
              <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: "#000000aa" }} onClick={closeAdd}>
                <div className="w-full rounded-t-3xl p-5 bl-fade flex flex-col" style={{ maxWidth: 480, height: "82vh", background: C.card2, border: "1px solid " + C.line }} onClick={e => e.stopPropagation()}>

                  {addStage === "search" && (<>
                    <div className="flex items-center justify-between mb-3">
                      <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 22 }}>ADD TO {(MEAL_SLOTS.find(m => m[0] === addFor) || ["", ""])[1].toUpperCase()}</div>
                      <button onClick={closeAdd} className="p-2 rounded-lg" style={{ background: C.card, border: "1px solid " + C.line }} aria-label="Close"><X size={15} color={C.dim} /></button>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: C.card, border: "1px solid " + C.line }}>
                        <Search size={15} color={C.faint} />
                        <input autoFocus value={foodQuery} onChange={e => setFoodQuery(e.target.value)} placeholder="Search foods..." aria-label="Search foods"
                          className="flex-1 bg-transparent" style={{ fontSize: 16, color: C.text, border: "none", outline: "none", minWidth: 0 }} />
                      </div>
                      <button onClick={() => { setScanNonce(n => n + 1); setScanOpen(true); }} aria-label="Scan a barcode" className="shrink-0 rounded-xl flex items-center justify-center" style={{ width: 46, background: AG }}>
                        <ScanLine size={19} color="#0D0E11" strokeWidth={2.4} />
                      </button>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <button onClick={() => setAddStage("quick")} className="flex-1 py-2.5 rounded-xl font-bold text-xs" style={{ background: C.card, border: "1px solid " + C.line, color: C.text }}>+ Quick add macros</button>
                      <button onClick={() => setAddStage("create")} className="flex-1 py-2.5 rounded-xl font-bold text-xs" style={{ background: C.card, border: "1px solid " + C.line, color: C.text }}>+ Create a food</button>
                    </div>
                    <div className="flex-1 overflow-y-auto -mx-1 px-1">
                      {foodQuery.trim() === "" && recentFoods.length > 0 && (<>
                        <div style={{ fontFamily: F.mono, fontSize: 9, color: C.faint, letterSpacing: 1.5, marginBottom: 6 }}>RECENT</div>
                        {recentFoods.map(fo => (
                          <button key={fo.i} onClick={() => { setPortionFood(fo); setPortionG(String(fo.sg || 100)); setAddStage("portion"); }} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 mb-1.5 text-left transition-transform active:scale-[0.98]" style={{ background: C.card, border: "1px solid " + C.line }}>
                            <span className="text-sm truncate">{fo.n}</span>
                            <span className="shrink-0 pl-2" style={{ fontFamily: F.mono, fontSize: 10.5, color: C.dim }}>{Math.round(fo.k * (fo.sg || 100) / 100)} kcal · {fo.sg || 100}g</span>
                          </button>
                        ))}
                        <div style={{ fontFamily: F.mono, fontSize: 9, color: C.faint, letterSpacing: 1.5, margin: "8px 0 6px" }}>ALL FOODS</div>
                      </>)}
                      {[...customFoods, ...FOODS]
                        .filter(fo => fo.n.toLowerCase().includes(foodQuery.trim().toLowerCase()))
                        .slice(0, 40)
                        .map(fo => (
                          <button key={fo.i} onClick={() => { setPortionFood(fo); setPortionG(String(fo.sg || 100)); setAddStage("portion"); }} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 mb-1.5 text-left transition-transform active:scale-[0.98]" style={{ background: C.card, border: "1px solid " + C.line }}>
                            <div className="min-w-0">
                              <div className="text-sm truncate">{fo.n}{String(fo.i).startsWith("cf-") && <span style={{ fontFamily: F.mono, fontSize: 8.5, color: A.a }}> · YOURS</span>}</div>
                              <div style={{ fontFamily: F.mono, fontSize: 9.5, color: C.faint }}>{fo.k} kcal · P{fo.p} C{fo.c} F{fo.f} per 100g</div>
                            </div>
                            {fo.sl && <span className="shrink-0 pl-2" style={{ fontFamily: F.mono, fontSize: 9.5, color: C.dim }}>{fo.sl}</span>}
                          </button>
                        ))}
                      {foodQuery.trim().length >= 3 && (
                        <>
                          <div className="flex items-center gap-2 mt-2 mb-1.5">
                            <span style={{ fontFamily: F.mono, fontSize: 9, color: C.faint, letterSpacing: 1.5 }}>WORLDWIDE</span>
                            <span style={{ fontFamily: F.mono, fontSize: 8, color: C.faint }}>OPEN FOOD FACTS</span>
                            {offState === "loading" && <span className="bl-shimmer" style={{ fontFamily: F.mono, fontSize: 8.5, backgroundImage: SHIMMER }}>SEARCHING...</span>}
                          </div>
                          {offState === "offline" && <p className="text-xs mb-2" style={{ color: C.faint }}>You're offline - built-in foods, your foods and recents still work. Worldwide search resumes when you're connected.</p>}
                          {offState === "error" && <p className="text-xs mb-2" style={{ color: C.faint }}>Couldn't reach the worldwide database just now - built-in foods still work.</p>}
                          {offState === "done" && offResults.length === 0 && <p className="text-xs mb-2" style={{ color: C.faint }}>No worldwide matches for "{foodQuery}".</p>}
                          {offResults.map(fo => (
                            <button key={fo.i} onClick={() => { setPortionFood(fo); setPortionG("100"); setAddStage("portion"); }} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 mb-1.5 text-left transition-transform active:scale-[0.98]" style={{ background: C.card, border: "1px solid " + C.blue + "33" }}>
                              <div className="min-w-0">
                                <div className="text-sm truncate">{fo.n}</div>
                                <div style={{ fontFamily: F.mono, fontSize: 9.5, color: C.faint }}>{fo.k} kcal · P{fo.p} C{fo.c} F{fo.f} per 100g</div>
                              </div>
                              <span className="shrink-0 pl-2" style={{ fontFamily: F.mono, fontSize: 8, color: C.blue }}>WEB</span>
                            </button>
                          ))}
                        </>
                      )}
                      {[...customFoods, ...FOODS].filter(fo => fo.n.toLowerCase().includes(foodQuery.trim().toLowerCase())).length === 0 && foodQuery.trim().length > 0 && foodQuery.trim().length < 3 && (
                        <p className="text-sm text-center mt-6" style={{ color: C.dim }}>Keep typing - worldwide search kicks in at 3 letters, or use "Create a food".</p>
                      )}
                    </div>
                  </>)}

                  {addStage === "portion" && portionFood && (<>
                    <div className="flex items-center gap-3 mb-3">
                      <button onClick={() => setAddStage("search")} className="p-2 rounded-lg" style={{ background: C.card, border: "1px solid " + C.line }} aria-label="Back"><ChevronLeft size={15} color={C.dim} /></button>
                      <div className="min-w-0">
                        <div className="font-bold truncate" style={{ fontSize: 17 }}>{portionFood.n}</div>
                        <div style={{ fontFamily: F.mono, fontSize: 9.5, color: C.faint }}>{portionFood.k} kcal per 100g</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 my-4">
                      <input type="number" inputMode="decimal" autoFocus value={portionG} onChange={e => setPortionG(e.target.value)} aria-label="Amount in grams"
                        className="rounded-2xl px-4 py-3 text-center font-bold" style={{ width: 140, fontSize: 30, fontFamily: F.disp, background: C.card, border: "1px solid " + C.line, color: C.text }} />
                      <span style={{ fontFamily: F.mono, fontSize: 14, color: C.dim }}>g</span>
                    </div>
                    <div className="flex gap-2 justify-center mb-4 flex-wrap">
                      {portionFood.sg && <button onClick={() => setPortionG(String(portionFood.sg))} className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: C.card, border: "1px solid " + C.line, color: C.text }}>{portionFood.sl || "1 serving"} · {portionFood.sg}g</button>}
                      {[50, 100, 150, 200].map(g => <button key={g} onClick={() => setPortionG(String(g))} className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: C.card, border: "1px solid " + C.line, color: C.dim }}>{g}g</button>)}
                      <button onClick={() => setPortionG(String(Math.round((parseFloat(portionG) || 0) * 2)))} className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: C.card, border: "1px solid " + C.line, color: C.dim }}>×2</button>
                    </div>
                    {(() => { const g = parseFloat(portionG) || 0; const m = macrosFor(portionFood, g); return (
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {[["KCAL", fmtNum(m.kcal), C.text], ["PROTEIN", m.p + "g", C.text], ["CARBS", m.c + "g", C.text], ["FAT", m.f + "g", C.text]].map(([l, v, col]) => (
                          <div key={l} className="rounded-xl py-2.5 text-center" style={{ background: C.card, border: "1px solid " + C.line }}>
                            <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 17, color: col }}>{v}</div>
                            <div style={{ fontFamily: F.mono, fontSize: 8, color: C.faint, letterSpacing: 1 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    ); })()}
                    <GradBtn A={A} onClick={addPortion} className="w-full py-3 rounded-2xl" style={{ fontFamily: F.disp, fontSize: 18, letterSpacing: 1 }}>ADD TO {(MEAL_SLOTS.find(m => m[0] === addFor) || ["", ""])[1].toUpperCase()}</GradBtn>
                  </>)}

                  {addStage === "quick" && (<>
                    <div className="flex items-center gap-3 mb-3">
                      <button onClick={() => setAddStage("search")} className="p-2 rounded-lg" style={{ background: C.card, border: "1px solid " + C.line }} aria-label="Back"><ChevronLeft size={15} color={C.dim} /></button>
                      <div className="font-bold" style={{ fontSize: 17 }}>Quick add</div>
                    </div>
                    <input value={quick.name} onChange={e => setQuick({ ...quick, name: e.target.value })} placeholder="Name (optional)" className="w-full rounded-xl px-4 py-3 mb-2" style={{ fontSize: 16, background: C.card, border: "1px solid " + C.line, color: C.text }} />
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[["kcal", "KCAL"], ["p", "PROTEIN G"], ["c", "CARBS G"], ["f", "FAT G"]].map(([k, l]) => (
                        <div key={k}>
                          <label className="block mb-1" style={{ fontFamily: F.mono, fontSize: 8, color: C.faint }}>{l}</label>
                          <input type="number" inputMode="decimal" value={quick[k]} onChange={e => setQuick({ ...quick, [k]: e.target.value })} className="w-full rounded-xl px-1 py-2.5 text-center" style={{ fontSize: 16, background: C.card, border: "1px solid " + C.line, color: C.text, fontFamily: F.mono }} />
                        </div>
                      ))}
                    </div>
                    <GradBtn A={A} onClick={addQuick} className="w-full py-3 rounded-2xl" style={{ fontFamily: F.disp, fontSize: 18, letterSpacing: 1 }}>ADD</GradBtn>
                  </>)}

                  {addStage === "create" && (<>
                    <div className="flex items-center gap-3 mb-3">
                      <button onClick={() => setAddStage("search")} className="p-2 rounded-lg" style={{ background: C.card, border: "1px solid " + C.line }} aria-label="Back"><ChevronLeft size={15} color={C.dim} /></button>
                      <div>
                        <div className="font-bold" style={{ fontSize: 17 }}>Create a food</div>
                        <div style={{ fontFamily: F.mono, fontSize: 9, color: C.faint }}>PER 100G, STRAIGHT OFF THE LABEL</div>
                      </div>
                    </div>
                    <input value={customF.n} onChange={e => setCustomF({ ...customF, n: e.target.value })} placeholder="Food name" className="w-full rounded-xl px-4 py-3 mb-2" style={{ fontSize: 16, background: C.card, border: "1px solid " + C.line, color: C.text }} />
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {[["k", "KCAL"], ["p", "PROTEIN"], ["c", "CARBS"], ["f", "FAT"]].map(([k, l]) => (
                        <div key={k}>
                          <label className="block mb-1" style={{ fontFamily: F.mono, fontSize: 8, color: C.faint }}>{l}/100G</label>
                          <input type="number" inputMode="decimal" value={customF[k]} onChange={e => setCustomF({ ...customF, [k]: e.target.value })} className="w-full rounded-xl px-1 py-2.5 text-center" style={{ fontSize: 16, background: C.card, border: "1px solid " + C.line, color: C.text, fontFamily: F.mono }} />
                        </div>
                      ))}
                    </div>
                    <input type="number" inputMode="decimal" value={customF.sg} onChange={e => setCustomF({ ...customF, sg: e.target.value })} placeholder="Typical serving in grams (optional)" className="w-full rounded-xl px-4 py-3 mb-4" style={{ fontSize: 16, background: C.card, border: "1px solid " + C.line, color: C.text }} />
                    <GradBtn A={A} onClick={createCustom} className="w-full py-3 rounded-2xl" style={{ fontFamily: F.disp, fontSize: 18, letterSpacing: 1 }}>SAVE & PICK PORTION</GradBtn>
                  </>)}
                </div>
              </div>
            )}

            {/* ======= FOOD ENTRY EDIT ======= */}
            {entryEdit && (
              <div className="fixed inset-0 z-40 flex items-center justify-center px-6" style={{ background: "#000000aa" }} onClick={() => setEntryEdit(null)}>
                <div className="w-full rounded-3xl p-5 bl-fade" style={{ maxWidth: 360, background: C.card2, border: "1px solid " + C.line }} onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold truncate pr-2" style={{ fontSize: 17 }}>{entryEdit.name}</div>
                    <button onClick={() => setEntryEdit(null)} className="p-2 rounded-lg shrink-0" style={{ background: C.card, border: "1px solid " + C.line }} aria-label="Close"><X size={15} color={C.dim} /></button>
                  </div>
                  <p className="text-sm mb-3" style={{ color: C.dim }}>{entryEdit.kcal} kcal · P{Math.round(entryEdit.p)} C{Math.round(entryEdit.c)} F{Math.round(entryEdit.f)}</p>
                  {entryEdit.per100 && (
                    <div className="flex items-center gap-2 mb-4">
                      <input type="number" inputMode="decimal" defaultValue={entryEdit.g} id="bl-edit-g" aria-label="Amount in grams"
                        className="flex-1 rounded-xl px-3 py-2.5 text-center font-bold" style={{ fontSize: 20, fontFamily: F.disp, background: C.card, border: "1px solid " + C.line, color: C.text }} />
                      <span style={{ fontFamily: F.mono, fontSize: 12, color: C.dim }}>g</span>
                      <GradBtn A={A} onClick={() => updateEntry(entryEdit.id, document.getElementById("bl-edit-g").value)} className="px-4 py-2.5 rounded-xl text-sm">Update</GradBtn>
                    </div>
                  )}
                  <button onClick={() => deleteEntry(entryEdit.id)} className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2" style={{ background: C.red + "1A", border: "1px solid " + C.red + "55", color: C.red }}><Trash2 size={14} /> Remove from diary</button>
                </div>
              </div>
            )}

            {/* ======= BARCODE SCANNER ======= */}
            {scanOpen && (
              <div className="fixed inset-0 flex flex-col" style={{ zIndex: 45, background: "#000" }}>
                <div className="flex items-center justify-between px-5" style={{ paddingTop: "calc(env(safe-area-inset-top) + 14px)" }}>
                  <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 20, color: "#fff" }}>SCAN BARCODE</div>
                  <button onClick={stopScan} className="p-2 rounded-xl" style={{ background: "#ffffff1A", border: "1px solid #ffffff33" }} aria-label="Close scanner"><X size={16} color="#fff" /></button>
                </div>
                <div className="flex-1 relative mt-3 mx-4 rounded-3xl overflow-hidden" style={{ border: "1px solid #ffffff22", maxHeight: "62vh" }}>
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full" style={{ objectFit: "cover" }} />
                  {!scanDead && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                      <div className="rounded-2xl" style={{ width: "78%", height: 130, border: "2.5px solid " + A.a, boxShadow: "0 0 0 4000px rgba(0,0,0,0.35)" }} />
                    </div>
                  )}
                </div>
                <div className="px-6 py-5 text-center" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)" }}>
                  <p className="text-sm" style={{ color: "#E8E6E1" }}>{scanMsg}</p>
                  {scanDead && (
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => { setScanDead(false); setScanNonce(n => n + 1); }} className="flex-1 py-3 rounded-2xl font-bold text-sm" style={{ background: AG, color: "#0D0E11" }}>Scan again</button>
                      <button onClick={stopScan} className="flex-1 py-3 rounded-2xl font-bold text-sm" style={{ background: "#ffffff14", border: "1px solid #ffffff33", color: "#fff" }}>Search by name</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======= WEIGH-IN MODAL ======= */}
            {weighOpen && (
              <div className="fixed inset-0 z-40 flex items-center justify-center px-6" style={{ background: "#000000aa" }} onClick={() => setWeighOpen(false)}>
                <div className="w-full rounded-3xl p-5 bl-fade" style={{ maxWidth: 360, background: C.card2, border: "1px solid " + C.line }} onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-1">
                    <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 24 }}>WEIGH-IN</div>
                    <button onClick={() => setWeighOpen(false)} className="p-2 rounded-lg" style={{ background: C.card, border: "1px solid " + C.line }} aria-label="Close"><X size={15} color={C.dim} /></button>
                  </div>
                  <p className="text-sm mb-4" style={{ color: C.dim }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}{weighedToday ? " - this replaces today's entry" : ""}</p>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <input type="number" inputMode="decimal" autoFocus value={weighVal} onChange={e => setWeighVal(e.target.value)} placeholder={latestWeight ? String(latestWeight) : "75.0"} aria-label="Bodyweight in kilograms"
                      className="rounded-2xl px-4 py-3 text-center font-bold" style={{ width: 150, fontSize: 32, fontFamily: F.disp, background: C.card, border: "1px solid " + C.line, color: C.text }} />
                    <span style={{ fontFamily: F.mono, fontSize: 14, color: C.dim }}>kg</span>
                  </div>
                  <GradBtn A={A} onClick={logWeight} className="w-full py-3 rounded-2xl" style={{ fontFamily: F.disp, fontSize: 18, letterSpacing: 1 }}>SAVE</GradBtn>
                  <p className="text-xs mt-3 text-center" style={{ color: C.faint }}>Updates your calorie targets and BMI automatically.</p>
                </div>
              </div>
            )}

            {/* ======= RPE HELP MODAL ======= */}
            {rpeHelp && (
              <div className="fixed inset-0 z-40 flex items-center justify-center px-6" style={{ background: "#000000aa" }} onClick={() => setRpeHelp(false)}>
                <div className="w-full rounded-3xl p-5 bl-fade" style={{ maxWidth: 400, background: C.card2, border: "1px solid " + C.line }} onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-1">
                    <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 24 }}>WHAT IS RPE?</div>
                    <button onClick={() => setRpeHelp(false)} className="p-2 rounded-lg" style={{ background: C.card, border: "1px solid " + C.line }} aria-label="Close"><X size={15} color={C.dim} /></button>
                  </div>
                  <p className="text-sm mb-3" style={{ color: C.dim }}>Rating of Perceived Exertion - how hard a set felt, measured by how many reps you had left in the tank.</p>
                  {[["10", "Max effort - nothing left"], ["9", "Could have done 1 more rep"], ["8", "Could have done 2 more reps"], ["7", "Could have done 3 more reps"], ["6", "4+ reps left - warm-up territory"]].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < 4 ? "1px solid " + C.line : "none" }}>
                      <span className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: A.a + "1A", color: A.a, fontFamily: F.disp, fontWeight: 800, fontSize: 17 }}>{r[0]}</span>
                      <span className="text-sm">{r[1]}</span>
                    </div>
                  ))}
                  <p className="text-xs mt-3" style={{ color: C.faint }}>Most working sets should land at RPE 7-9. It keeps you close enough to failure to grow, without burying your recovery.</p>
                </div>
              </div>
            )}

            {/* ======= SWAP SHEET ======= */}
            {swapFor !== null && session && (
              <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: "#000000aa" }} onClick={() => setSwapFor(null)}>
                <div className="w-full rounded-t-3xl p-5 bl-fade overflow-y-auto" style={{ maxWidth: 480, maxHeight: "80vh", background: C.card2, border: "1px solid " + C.line }} onClick={e => e.stopPropagation()}>
                  {(() => {
                    const cur = EX[session.items[swapFor].ex];
                    const cands = EXERCISES.filter(e => e.muscle === cur.muscle && e.id !== cur.id && eqAllowed(e.id, gym))
                      .sort((a, b) => ((cur.alts || []).includes(b.id) ? 1 : 0) - ((cur.alts || []).includes(a.id) ? 1 : 0));
                    return (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 24 }}>SWAP EXERCISE</div>
                            <div className="text-sm" style={{ color: C.dim }}>Replacing <b style={{ color: C.text }}>{cur.name}</b> - same muscle, your equipment.</div>
                          </div>
                          <button onClick={() => setSwapFor(null)} className="p-2 rounded-lg shrink-0" style={{ background: C.card, border: "1px solid " + C.line }} aria-label="Close"><X size={15} color={C.dim} /></button>
                        </div>
                        <div className="mt-3">
                          {cands.length === 0 && <p className="text-sm" style={{ color: C.dim }}>No alternatives available for this muscle with your current equipment.</p>}
                          {cands.map(e => (
                            <button key={e.id} onClick={() => swapExercise(swapFor, e.id)} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 mb-2 text-left" style={{ background: C.card, border: "1px solid " + C.line }}>
                              <Picto ex={e} size={40} />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate">{e.name}</div>
                                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.dim }}>{e.equipment}</div>
                              </div>
                              {(cur.alts || []).includes(e.id) && <Chip color={A.a}>RECOMMENDED</Chip>}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs mt-1" style={{ color: C.faint }}>Swaps are remembered - future sessions will use your choice. Change it any time.</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ======= WORKOUT SUMMARY ======= */}
            {summary && (
              <div className="fixed inset-0 z-40 flex items-center justify-center px-6" style={{ background: "#000000cc" }}>
                <div className="w-full rounded-3xl p-6 text-center bl-fade overflow-y-auto" style={{ maxWidth: 400, maxHeight: "88vh", background: C.card2, border: "1px solid " + C.line }}>
                  <div style={{ fontFamily: F.mono, fontSize: 10, color: C.green, letterSpacing: 3 }}>WORKOUT SAVED</div>
                  <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 36, textTransform: "uppercase", lineHeight: 1.1 }}>{summary.entry.dayName} DONE</div>
                  <div className="grid grid-cols-3 gap-3 mt-5">
                    {[["DURATION", summary.entry.durationMin, "min"], ["SETS", summary.setCount, "logged"], ["TONNAGE", fmtNum(Math.round(summary.tonnage)), "kg"]].map((s, i) => (
                      <div key={i} className="rounded-xl py-3" style={{ background: C.card, border: "1px solid " + C.line }}>
                        <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 22, lineHeight: 1.1 }}>{s[1]}</div>
                        <div style={{ fontFamily: F.mono, fontSize: 8.5, color: C.faint, letterSpacing: 1 }}>{s[0]}</div>
                      </div>
                    ))}
                  </div>
                  {summary.prs.length > 0 && (
                    <div className="mt-4 rounded-xl p-3" style={{ background: C.yellow + "14", border: "1px solid " + C.yellow + "55" }}>
                      <div className="flex items-center justify-center gap-1.5" style={{ fontFamily: F.mono, fontSize: 10, color: C.yellow, letterSpacing: 2 }}><Award size={13} /> NEW PERSONAL RECORDS</div>
                      {summary.prs.map(p => (
                        <div key={p.id} className="text-sm mt-1.5">{EX[p.id] ? EX[p.id].name : p.id} - <b style={{ fontFamily: F.mono }}>{Math.round(p.e1)} kg e1RM</b></div>
                      ))}
                    </div>
                  )}
                  {summary.trophies && summary.trophies.length > 0 && (
                    <div className="mt-4 rounded-xl p-3" style={{ background: TIER.gold + "14", border: "1px solid " + TIER.gold + "55" }}>
                      <div className="flex items-center justify-center gap-1.5" style={{ fontFamily: F.mono, fontSize: 10, color: TIER.gold, letterSpacing: 2 }}><Trophy size={13} /> TROPHY UNLOCKED</div>
                      {summary.trophies.map(t => (
                        <div key={t.id} className="flex items-center justify-center gap-2 mt-2">
                          <Trophy size={15} color={TIER[t.tier]} />
                          <span className="text-sm font-bold">{t.name}</span>
                          <span className="text-xs" style={{ color: C.faint }}>{t.tier.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <GradBtn A={A} onClick={() => { setSummary(null); setTab("home"); }} className="w-full mt-5 py-3 rounded-2xl" style={{ fontFamily: F.disp, fontSize: 18, letterSpacing: 1 }}>DONE</GradBtn>
                </div>
              </div>
            )}

            {/* ======= TROPHY UNLOCK TOAST (outside a workout — food/weigh-in/photo) ======= */}
            {trophyToast && trophyToast.length > 0 && (
              <div className="fixed inset-0 z-40 flex items-center justify-center px-6" style={{ background: "#000000cc" }} onClick={() => setTrophyToast(null)}>
                <div className="w-full rounded-3xl p-6 text-center bl-fade" style={{ maxWidth: 360, background: C.card2, border: "1px solid " + TIER.gold + "55" }} onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1.5" style={{ fontFamily: F.mono, fontSize: 10, color: TIER.gold, letterSpacing: 3 }}><Trophy size={13} /> {trophyToast.length > 1 ? "TROPHIES UNLOCKED" : "TROPHY UNLOCKED"}</div>
                  <div className="mt-3 rounded-xl p-3" style={{ background: TIER.gold + "14", border: "1px solid " + TIER.gold + "55" }}>
                    {trophyToast.map(t => (
                      <div key={t.id} className="flex items-center justify-center gap-2 py-1.5">
                        <Trophy size={16} color={TIER[t.tier]} />
                        <span className="text-sm font-bold">{t.name}</span>
                        <span className="text-xs" style={{ color: C.faint }}>{t.tier.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                  <GradBtn A={A} onClick={() => setTrophyToast(null)} className="w-full mt-4 py-3 rounded-2xl" style={{ fontFamily: F.disp, fontSize: 18, letterSpacing: 1 }}>NICE</GradBtn>
                </div>
              </div>
            )}

            {/* ======= QUICK-ACTIONS SHEET (central FAB) ======= */}
            {fabOpen && (() => {
              const h = new Date().getHours();
              const meal = h < 11 ? "b" : h < 15 ? "l" : h < 21 ? "d" : "s";
              const openFood = () => { setTab("fuel"); setOverlay(null); setAddFor(meal); setAddStage("search"); setFoodQuery(""); };
              const acts = [
                { icon: Play, label: "Start workout", sub: program ? "Jump into " + program.days[nextDayIdx].name : "Pick a split", run: () => { setTab("train"); setOverlay(null); } },
                { icon: Utensils, label: "Log food", sub: "Search or quick-add macros", run: openFood },
                { icon: ScanLine, label: "Scan barcode", sub: "Look up a packaged food", run: () => { openFood(); setScanNonce(n => n + 1); setScanOpen(true); } },
                { icon: Weight, label: "Weigh in", sub: weighedToday ? "Update today's weight" : "Log today's weight", run: () => { setWeighVal(latestWeight ? String(latestWeight) : ""); setWeighOpen(true); } },
                { icon: Camera, label: "Add progress photo", sub: photos.length + " stored", run: () => { fileRef.current && fileRef.current.click(); } },
              ];
              return (
                <div className="fixed inset-0 z-30 flex items-end justify-center" onClick={() => setFabOpen(false)} style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}>
                  <div className="w-full bl-fade" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, background: C.card, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, border: "1px solid " + C.line, boxShadow: SHADOW.hero, padding: SPACE[5], paddingBottom: "calc(env(safe-area-inset-bottom) + " + SPACE[5] + "px)" }}>
                    <div className="mx-auto mb-4 rounded-full" style={{ width: 40, height: 4, background: C.line }} />
                    <div className="flex items-center justify-between mb-4">
                      <div style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 24, letterSpacing: 0.5, textTransform: "uppercase" }}>Quick Actions</div>
                      <button onClick={() => setFabOpen(false)} aria-label="Close" className="p-2 rounded-full" style={{ background: C.card2, border: "1px solid " + C.line }}><X size={16} color={C.dim} /></button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {acts.map((a, i) => {
                        const Icon = a.icon;
                        return (
                          <button key={a.label} onClick={() => { if (data.settings.vibrate) haptic("tap"); setFabOpen(false); a.run(); }}
                            className="bl-stagger w-full flex items-center gap-3 text-left transition-transform active:scale-[0.98]"
                            style={{ "--i": i, background: C.card2, border: "1px solid " + C.line, borderRadius: RADIUS.md, padding: SPACE[3] }}>
                            <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: 42, height: 42, background: A.a + "1F", border: "1px solid " + A.a + "3A" }}><Icon size={19} color={A.a} /></span>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-[15px]">{a.label}</div>
                              <div className="text-xs truncate" style={{ color: C.dim }}>{a.sub}</div>
                            </div>
                            <ArrowUpRight size={16} color={C.faint} className="shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ======= BOTTOM NAV — floating liquid-glass island ======= */}
            <nav className="fixed left-1/2 -translate-x-1/2 w-full z-10 px-4" style={{ maxWidth: 448, bottom: "calc(env(safe-area-inset-bottom) + 24px)" }}>
              <div className="liquid-glass flex items-center justify-between px-3 py-2 rounded-full" style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
                {[
                  { id: "home", label: "Home", icon: Home },
                  { id: "train", label: "Train", icon: Dumbbell },
                  { fab: true },
                  { id: "fuel", label: "Fuel", icon: Utensils },
                  { id: "progress", label: "Progress", icon: TrendingUp },
                ].map((t, ti) => {
                  if (t.fab) return (
                    <button key="fab" onClick={() => { if (data.settings.vibrate) haptic("tap"); setFabOpen(true); }} aria-label="Quick actions" aria-expanded={fabOpen}
                      className="bl-fabglow bl-spring flex items-center justify-center rounded-full active:scale-[0.92]"
                      style={{ width: 58, height: 58, marginTop: -26, background: AGV, border: "3px solid rgba(0,0,0,0.6)", "--fab-glow-weak": A.a + "60", "--fab-glow-strong": A.a + "a6" }}>
                      <Plus size={27} color="#000" strokeWidth={2.8} />
                    </button>
                  );
                  const active = tab === t.id;
                  const Icon = t.icon;
                  return (
                    <button key={t.id} onClick={() => { if (data.settings.vibrate) haptic("tap"); setTab(t.id); setOverlay(null); }} aria-label={t.label} aria-current={active ? "page" : undefined}
                      className="bl-spring flex flex-col items-center justify-center rounded-full active:scale-90"
                      style={{ width: 46, height: 46, background: active ? AGV : "transparent", boxShadow: active ? "0 0 16px " + A.a + "66" : "none", opacity: active ? 1 : 0.45 }}>
                      <Icon size={20} color={active ? "#000" : C.dim} strokeWidth={active ? 2.6 : 2} />
                      {!active && <span style={{ fontFamily: F.mono, fontSize: 7, letterSpacing: 0.5, color: C.faint, marginTop: 1 }}>{t.label.toUpperCase()}</span>}
                    </button>
                  );
                })}
              </div>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= NOTIFICATION PERMISSION BUTTON ================= */
function NotifButton() {
  const supported = typeof window !== "undefined" && "Notification" in window;
  const [perm, setPerm] = useState(supported ? Notification.permission : "unsupported");
  if (!supported) return <span style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>NOT SUPPORTED HERE</span>;
  if (perm === "granted") return <span className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: C.green + "22", color: C.green, border: "1px solid " + C.green + "55" }}>Enabled ✓</span>;
  if (perm === "denied") return <span style={{ fontFamily: F.mono, fontSize: 9.5, color: C.faint, textAlign: "right", maxWidth: 130 }}>Blocked - allow in browser site settings</span>;
  return (
    <button onClick={async () => { try { setPerm(await Notification.requestPermission()); } catch (e) {} }}
      className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: C.card, border: "1px solid " + C.line, color: C.text }}>
      Enable
    </button>
  );
}

/* ================= SETTINGS PANEL ================= */
function SettingsPanel({ data, save, A, troph, onClose, onRedo, confirmReset, setConfirmReset, onReset, onExport, onImportClick, importMsg }) {
  const pf = data.profile || {};
  const [form, setForm] = useState({
    name: pf.name || "", age: pf.age || "", heightCm: pf.heightCm || "", weightKg: pf.weightKg || "",
    sex: pf.sex || "x", activity: pf.activity || "mod", gym: pf.gym || "full", goal: pf.goal || "build",
    focusMuscles: pf.focusMuscles || [],
  });
  const [saved, setSaved] = useState(false);
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); };
  const toggleFocus = m => setForm(f => {
    const has = f.focusMuscles.includes(m);
    const focusMuscles = has ? f.focusMuscles.filter(x => x !== m) : f.focusMuscles.length >= 2 ? f.focusMuscles : [...f.focusMuscles, m];
    setSaved(false);
    return { ...f, focusMuscles };
  });
  const inputStyle = { background: C.card, border: "1px solid " + C.line, color: C.text, fontSize: 16, fontFamily: F.body };
  const selStyle = { ...inputStyle, width: "100%", borderRadius: 12, padding: "10px 12px" };

  const applyProfile = () => {
    const p = { ...pf, ...form, age: +form.age || pf.age || 30, heightCm: +form.heightCm || pf.heightCm || 175, weightKg: +form.weightKg || pf.weightKg || 75, name: form.name.trim() || "Athlete", done: true, skipped: false };
    p.targets = calcTargets(p);
    save({ ...data, profile: p });
    setSaved(true);
  };
  const setSetting = (k, v) => save({ ...data, settings: { ...data.settings, [k]: v } });

  const Row = ({ label, children }) => (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid " + C.line }}>
      <span className="text-sm font-semibold">{label}</span>{children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-30 flex justify-center" style={{ background: "#000000" }}>
      <div className="w-full flex flex-col" style={{ maxWidth: 480, background: C.bg }}>
        <div className="flex items-center gap-3 px-5 pb-3" style={{ paddingTop: "calc(env(safe-area-inset-top) + 14px)" }}>
          <button onClick={onClose} aria-label="Back" className="p-2 rounded-xl" style={{ background: C.card, border: "1px solid " + C.line }}><ChevronLeft size={16} color={C.dim} /></button>
          <span style={{ fontFamily: F.disp, fontWeight: 800, fontSize: 24 }}>SETTINGS</span>
        </div>
        <div className="flex-1 px-5 overflow-y-auto" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 30px)" }}>

          <SectionLabel>ATHLETE PROFILE</SectionLabel>
          <div className="rounded-2xl p-4 mb-5" style={{ background: C.card2, border: "1px solid " + C.line }}>
            <label className="block mb-1.5" style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>NAME</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your name" className="w-full rounded-xl px-4 py-3 mb-3" style={inputStyle} />
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[["age", "AGE"], ["heightCm", "HEIGHT CM"], ["weightKg", "WEIGHT KG"]].map(([k, l]) => (
                <div key={k}>
                  <label className="block mb-1.5" style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>{l}</label>
                  <input type="number" inputMode="decimal" value={form[k]} onChange={e => set(k, e.target.value)} className="w-full rounded-xl px-2 py-3 text-center" style={inputStyle} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block mb-1.5" style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>GOAL</label>
                <select value={form.goal} onChange={e => set("goal", e.target.value)} style={selStyle}>
                  {Object.entries(GOAL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1.5" style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>EQUIPMENT</label>
                <select value={form.gym} onChange={e => set("gym", e.target.value)} style={selStyle}>
                  {Object.entries(GYM_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="block mb-1.5" style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>ACTIVITY</label>
                <select value={form.activity} onChange={e => set("activity", e.target.value)} style={selStyle}>
                  <option value="sed">Mostly sitting</option><option value="light">Lightly active</option>
                  <option value="mod">Active</option><option value="high">Very active</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5" style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>SEX (CALORIE FORMULA)</label>
                <select value={form.sex} onChange={e => set("sex", e.target.value)} style={selStyle}>
                  <option value="m">Male</option><option value="f">Female</option><option value="x">Prefer not to say</option>
                </select>
              </div>
            </div>
            <label className="block mb-1.5" style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>FOCUS MUSCLES (UP TO 2)</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.keys(MUSCLES).map(m => {
                const picked = form.focusMuscles.includes(m);
                const disabled = !picked && form.focusMuscles.length >= 2;
                return (
                  <button key={m} type="button" onClick={() => toggleFocus(m)} disabled={disabled}
                    className="rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors"
                    style={{ background: picked ? A.a + "1F" : C.card, border: "1px solid " + (picked ? A.a : C.line), color: disabled ? C.faint : C.text, opacity: disabled ? 0.5 : 1 }}>
                    {m}
                  </button>
                );
              })}
            </div>
            <GradBtn A={A} onClick={applyProfile} className="w-full py-3 rounded-xl text-sm">{saved ? "Saved - targets recalculated ✓" : "Save & recalculate targets"}</GradBtn>
          </div>

          <SectionLabel>APPEARANCE</SectionLabel>
          <div className="liquid-glass rounded-2xl p-5 mb-5">
            <div className="text-sm font-semibold mb-3">Accent theme</div>
            <div className="flex gap-4">
              {Object.entries(ACCENTS).map(([k, ac]) => {
                const on = data.settings.accent === k;
                return (
                  <button key={k} onClick={() => setSetting("accent", k)} aria-label={ac.name} aria-pressed={on} className="bl-spring flex flex-col items-center gap-1.5 active:scale-90">
                    <span className="rounded-full" style={{ width: 42, height: 42, background: "linear-gradient(135deg," + ac.b + "," + ac.a + ")", border: on ? "2.5px solid #FAFAFA" : "2.5px solid transparent", boxShadow: on ? "0 0 16px " + ac.a + "88" : "none" }} />
                    <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: on ? C.text : C.faint }}>{ac.name.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <SectionLabel>REST TIMER</SectionLabel>
          <div className="rounded-2xl px-4 py-1 mb-5" style={{ background: C.card2, border: "1px solid " + C.line }}>
            <Row label="Start automatically after a set"><Toggle on={data.settings.autoRest} onChange={v => setSetting("autoRest", v)} label="Auto rest timer" /></Row>
            <Row label="Finish sound"><Toggle on={data.settings.sound} onChange={v => { unlockAudio(); setSetting("sound", v); if (v) playDing(); }} label="Timer finish sound" /></Row>
            <Row label="Vibration (Android)"><Toggle on={data.settings.vibrate} onChange={v => { setSetting("vibrate", v); if (v) haptic("timerDone"); }} label="Timer vibration" /></Row>
            <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid " + C.line }}>
              <div>
                <div className="text-sm font-semibold">Rest length</div>
                <div className="text-xs" style={{ color: C.faint }}>{data.settings.restOverride ? "Same for every exercise" : "Programmed per exercise (recommended)"}</div>
              </div>
              <select value={data.settings.restOverride || 0} onChange={e => setSetting("restOverride", +e.target.value || null)} style={{ ...selStyle, width: 128 }} aria-label="Rest length">
                <option value={0}>Per exercise</option>
                {[30, 45, 60, 90, 120, 150, 180, 240].map(v => <option key={v} value={v}>{v >= 60 ? (v / 60) + " min" + (v % 60 ? " " + (v % 60) + "s" : "") : v + "s"}</option>)}
              </select>
            </div>
            <p className="text-xs py-3" style={{ color: C.faint }}>The timer runs on the clock, not the screen - lock your phone and it stays accurate. The chime plays when the app is open; where your browser supports it, a notification fires if you're elsewhere. Installed as an app, a background service worker backs this up so alerts land more reliably while the app is minimised - full lock-screen alarms still aren't possible from the web.</p>
          </div>

          <SectionLabel>PROGRESS PHOTOS</SectionLabel>
          <div className="rounded-2xl px-4 py-1 mb-5" style={{ background: C.card2, border: "1px solid " + C.line }}>
            <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid " + C.line }}>
              <span className="text-sm font-semibold">Reminder cadence</span>
              <select value={data.settings.photoCadence} onChange={e => setSetting("photoCadence", e.target.value)} style={{ ...selStyle, width: 110 }} aria-label="Photo reminder cadence">
                <option value="weekly">Weekly</option><option value="daily">Daily</option><option value="off">Off</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-semibold">Reminder notifications</div>
                <div className="text-xs" style={{ color: C.faint }}>A home-screen prompt always appears when due</div>
              </div>
              <NotifButton />
            </div>
          </div>

          <SectionLabel>TRAINING</SectionLabel>
          <div className="rounded-2xl px-4 py-1 mb-5" style={{ background: C.card2, border: "1px solid " + C.line }}>
            <Row label="Plate-loading graphics"><Toggle on={data.settings.plates} onChange={v => setSetting("plates", v)} label="Plate graphics" /></Row>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-semibold">Weekly sets target / muscle</span>
              <select value={data.settings.weeklyTarget} onChange={e => setSetting("weeklyTarget", +e.target.value)} style={{ ...selStyle, width: 84 }}>
                {[10, 12, 14, 15, 16, 18, 20].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          {pf.targets && (
            <>
              <SectionLabel>YOUR NUMBERS</SectionLabel>
              <div className="rounded-2xl px-4 py-1 mb-5" style={{ background: C.card2, border: "1px solid " + C.line }}>
                <Row label="Maintenance"><span style={{ fontFamily: F.mono, fontSize: 13 }}>{fmtNum(pf.targets.maintain)} kcal</span></Row>
                <Row label={"Target (" + (GOAL_LABEL[pf.goal] || "") + ")"}><span style={{ fontFamily: F.mono, fontSize: 13, color: A.a }}>{fmtNum(pf.targets.goal)} kcal</span></Row>
                <Row label="Macros"><span style={{ fontFamily: F.mono, fontSize: 12, color: C.dim }}>{pf.targets.proteinG}P · {pf.targets.fatG}F · {pf.targets.carbG}C</span></Row>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-semibold">BMI</span>
                  {(() => { const b = bmiOf(pf.weightKg, pf.heightCm); const band = bmiBand(b); return b
                    ? <span style={{ fontFamily: F.mono, fontSize: 12 }}>{b} <span style={{ color: band.color }}>· {band.label}</span></span>
                    : <span style={{ fontFamily: F.mono, fontSize: 12, color: C.faint }}>—</span>; })()}
                </div>
              </div>
            </>
          )}

          <SectionLabel>DATA</SectionLabel>
          <div className="rounded-2xl px-4 py-1 mb-5" style={{ background: C.card2, border: "1px solid " + C.line }}>
            <div className="py-3" style={{ borderBottom: "1px solid " + C.line }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Backup & restore</div>
                  <div className="text-xs" style={{ color: C.faint }}>Export everything to a file - workouts, food log, weigh-ins, photos. Restore it on any device or new URL.</div>
                </div>
              </div>
              <div className="flex gap-2 mt-2.5">
                <button onClick={onExport} className="flex-1 py-2.5 rounded-xl font-bold text-xs" style={{ background: C.card, border: "1px solid " + C.line, color: C.text }}>Export backup</button>
                <button onClick={onImportClick} className="flex-1 py-2.5 rounded-xl font-bold text-xs" style={{ background: C.card, border: "1px solid " + C.line, color: C.text }}>Import backup</button>
              </div>
              {importMsg && <p className="text-xs mt-2" style={{ color: importMsg.startsWith("Backup restored") ? C.green : C.yellow }}>{importMsg}</p>}
            </div>
            <Row label="Redo questionnaire"><button onClick={onRedo} className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: C.card, border: "1px solid " + C.line, color: C.text }}>Restart</button></Row>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-semibold" style={{ color: C.red }}>Reset all data</span>
              {confirmReset ? (
                <div className="flex gap-2">
                  <button onClick={onReset} className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: C.red, color: "#fff" }}>Delete</button>
                  <button onClick={() => setConfirmReset(false)} className="text-xs px-3 py-2 rounded-lg" style={{ background: C.card, color: C.dim, border: "1px solid " + C.line }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmReset(true)} className="p-2 rounded-lg" style={{ background: C.card, border: "1px solid " + C.line }} aria-label="Reset all data"><Trash2 size={14} color={C.red} /></button>
              )}
            </div>
          </div>

          <div className="text-center mt-2" style={{ fontFamily: F.mono, fontSize: 10, color: C.faint }}>
            BURNLAB v6.2 · {troph.filter(t => t.done).length}/{troph.length} trophies · data lives on this device only
          </div>
        </div>
      </div>
    </div>
  );
}
