# BurnLab — Training, Fuel & Progress

Science-based workout tracker built with Vite + React + Tailwind. Installable PWA with offline support. All data (profile, workouts, trophies) lives in the browser's localStorage on your device — no backend.

## What's new in v8.0 — "Noir"

A complete visual rebuild on a flat near-black canvas (`#0A0A0B`) — no screen is recognisable from the old app, but every feature and every byte of stored data (storage keys `burnlab-data-v2` / `burnlab-photos-v1` and the data model) is untouched.

- **Design system** — solid tonal surfaces (`#17181B` / `#1F2024`) with **no visible borders** (separation by tone), one electric-lime **Volt** accent (`#D6F25F`) with **black text/icons on accent always**, and dedicated data-viz colours (calorie-ring orange `#F28C33`, water/weight mint `#7BE0C3`). Radius 12/20/28, a 4px grid and a 20px screen gutter.
- **Typography** — retired Barlow/Orbitron for one friendly geometric grotesque, **Plus Jakarta Sans** (self-hosted variable font), everywhere. **Sentence case** across the whole app ("Hi, Alex", "Start workout"); uppercase survives only in tiny letter-spaced labels. Hero metrics use a big value + grey `/denominator` pattern, tabular figures and thin-space thousands. The rest-timer keeps its **Doto** dot-matrix face.
- **Flagship full-screen rest timer** — a takeover with huge Doto digits inside a sweeping progress ring, live "% complete", and accent **Pause / +30s / Skip**. Collapses to a minimised pill (that coexists cleanly with the nav) and reopens on tap; wall-clock accurate through a locked screen as before.
- **Home** — greeting → date strip (accent "Today" pill) → orange hero burn-ring → 2-column metric cards (sets, water, weight, streak with mini bars/sparklines) → up-next card → quiet trophy-points teaser.
- **Water tracking (new)** — a Fuel water card logs real intake in +250 ml taps with an 8-cup tracker, stored additively in the existing data model (auto-included in export/import).
- **Restyled charts** — no gridlines, rounded gradient bar tops, glowing trend lines, mono axes and soft surface-2 tooltips. Settings gains a stat-chips row; onboarding uses accent selection cards and progress dots.
- **New identity** — a lime flame app icon, splash mark and manifest/theme colours.
- **Clip-proof numbers (kept)** — every headline figure is sized with container-query units so it shrinks to its card instead of truncating; verified against `9 → 199,999`, `112.25`, `0:07`/`20:30` at 320 / 375 / 430 px.

## What's new in v7.0 — "Editorial Inversion"

A ground-up visual rebrand: stark **white cards on a near-black canvas**, near-black ink type, one scarce orange accent (glows, the timer, arrows — nothing else).

- **Type system** — self-hosted **Anton** (ultra-heavy condensed, upright) carries every display title and hero number; **Archivo** grotesque for body; and a self-hosted **Doto** dot-matrix LCD face powers the rest-timer countdown. The old italic display face is retired.
- **Clip-proof numbers (hard requirement)** — every headline figure is tabular, upright (no italic overhang), and sized with container-query units (`cqi`) so it auto-shrinks to its card instead of ever truncating. Verified against a rendered test matrix (9 → 199,999, `0:07`, `20:30`) at 320 / 375 / 430 px. Fonts self-hosted so the look survives fully offline.
- **Bento dashboard** — Home is a grid of white cards, each with a tiny title, micro progress bar, one huge number and an "OF X" label, tapping through to detail.
- **Editorial white-card treatment** across Train, the one-exercise workout runner, Fuel, Progress, Trophies, Settings, onboarding and every modal — heavy uppercase titles, obsidian input wells, and the signature **dot-matrix rest timer** on a dark LCD panel.
- Accent themes (Orange default, Blue / Green / Yellow) are preserved and still recolor the app live.

## What's new in v6.2 — Progress analytics

- **Weight trend + insights** (MacroFactor-style) — an EMA-smoothed **trend line** drawn over the raw scale points so day-to-day noise stops lying to you, with an Insights panel: current trend weight, **weekly rate**, an estimated **energy balance** (kcal/day, ~7,700 kcal/kg), a 30-day projection, and trend change over the last 3/7/14/30/90 days. Rate/change colours are goal-aware (green when moving toward a cut/bulk goal, red when against it).
- **Training calendar + streak** (Hevy-style) — a month grid with every trained day lit as a glowing accent pill, month navigation, a **consecutive-week streak** counter, and sessions-this-month.
- **Volume & sets analytics** — a **SETS ↔ TONNAGE** toggle and 1W/1M/3M/6M/1Y/All range pills driving a total/average header and bar chart (auto-buckets by session on short ranges, by week on long ones), plus a **Top Movements** ranking for the selected range and metric.
- **Grouped history** — past sessions grouped under month headers with per-month session and set counts.
- All new aggregates respect the existing warm-up exclusion (warm-up sets never count toward volume, PRs or heat).

## What's new in v6.0 — "Liquid Glass" system

- **Glassmorphism material** — reusable `.liquid-glass` / `.liquid-glass-active` utilities (frosted blur, inset highlight lip, soft shadow) across nav, cards, splits and inputs, on a pure-OLED-black canvas.
- **Floating pill navigation** with a central gradient add-button that breathes a gentle accent glow.
- **Progressive Focus workout** — the active set gets the glass-active treatment with obsidian input wells; other sets dim to 25% and completed sets strike through, auto-advancing the focus. Button hierarchy: Next Exercise is the primary gradient pill, Finish Workout is a quiet text-link.
- **Nutrition** — macro cards on glass with subtle macro-coded under-glows and dual-layer glass progress pipes.
- Springy micro-motion (`cubic-bezier(0.34,1.56,0.64,1)`) with tactile press-scale on interactive elements.

## What's new in v4.0–v5.1 — design overhaul

- **Cinematic Athletic direction** — custom **NIKE** display face for titles + hero numbers (Archivo for body), a signature glowing **HeroArc** gauge on the dashboard, film-grain materiality, and oversized editorial screen headers.
- **v4.0 foundation** — motion/spacing/radius tokens, `HeroNumber` count-up component, one-exercise-at-a-time workout runner with **warm-up sets** (marked `W`, excluded from all volume/PR/heat aggregates), a flagship full-screen **Muscle Map**, and a central-FAB Quick Actions sheet.
- **Custom brand logo** ("The Catalyst" monogram + editorial wordmark) in the header.
- **Accent themes** — Orange (default), Blue, Green and Yellow, switchable in Settings; the whole UI recolors live.

## What's new in v3.1

- **35 trophies** across four categories — training (20), nutrition (5), weigh-ins (5) and progress photos (4), plus the platinum "Burn Legend" for unlocking everything else. A category filter row sits above the tier list in the Trophies tab, and unlocking one now surfaces a toast from wherever it happens (finishing a workout, logging food, weighing in, or adding a photo), not just after a session.
- **Graded haptics** — a small vibration-pattern system (tap/light/medium/success/warning/PR/trophy) replacing the single buzz, baked into every gradient button and toggle plus contextual moments (set complete, PR, trophy unlock, destructive actions).
- **Living background** — a slow, accent-tinted drifting glow now sits behind the whole app (not just the home hero), recoloring instantly when you switch accent theme in Settings.
- **Rest-timer reliability** — the installed app's service worker now gets handed the rest-timer end time directly and fires its own notification as a backstop, alongside a silent keep-alive tone that reduces background-tab throttling. Full lock-screen alarms still aren't possible from the web — see the platform-honesty note below.
- **Visual refresh** — softer elevation/glow shadows on cards, buttons, rings and the bottom nav, glass-edge highlights on hero cards, and consistent press feedback across tappable rows.

## What's new in v2.5

- **Barcode scanning** — tap the scan button in the add-food sheet, point at a product barcode, and it lands on the portion screen with macros filled in. Decoding happens on-device (ZXing, lazy-loaded so it costs nothing until used); the product lookup uses Open Food Facts, so it needs a connection - offline you get a clear message and name-search/create-food fallbacks.
- Requires camera permission (browser prompt on first use). Works in Safari/Chrome and installed PWAs on modern iOS/Android.

## What's new in v2.4

- **Worldwide food search** — the add-food sheet now searches Open Food Facts (~3.5M community-maintained products worldwide) when online, layered below the instant offline results. Anything you log stores its per-100g values locally, so it's searchable in Recents offline forever after.
- Offline behaviour is unchanged: built-in database, custom foods and recents all work with zero signal; worldwide rows simply don't appear.
- Note: OFF is community data under the ODbL licence — values can occasionally be wrong; the UI reminds users to sanity-check against the label.

## What's new in v2.3

- **Macro tracker (Fuel tab)** — a MyFitnessPal-style food diary that works fully offline. Log to Breakfast/Lunch/Dinner/Snacks from a built-in ~100-food database (typical UK per-100g values), your own custom foods, quick-add macros, and recent foods. Live eaten/remaining calories and protein/carb/fat bars against your calculated targets, browsable by day.
- **Backup & restore** — Settings → Data now exports everything (workouts, food log, weigh-ins, photos, settings) to a JSON file and imports it back — for switching phones or hosting URLs without losing progress.
- Home hero now shows kcal remaining today alongside sets and tonnage.
- No barcode scanning by design: that requires an online food database, and BurnLab is offline-first.

## What's new in v2.2

- **Bodyweight tracking** — one-tap daily weigh-ins with a streak counter; each entry auto-updates your calorie targets and BMI. Trend chart in Progress with 1W/1M/3M/6M/1Y/All ranges, average and net change.
- **Habit heatmaps** — Weigh-In and Workouts over the last 30 days, with this-week counts.
- **Recent Records** — your last ~8 exercises as ranked bars, toggleable between Volume, Reps and estimated 1-RM.
- **Weekly target rings** — Muscles / Sets / Exercises completed this week vs your program's weekly targets.
- Progress photos now stamp the latest weigh-in weight automatically; Reset now clears photos too.

## What's new in v2.1

- **Rest timer rebuilt on wall-clock time** — locking the screen no longer freezes or skips seconds; the countdown re-syncs the instant the app is visible again
- **Finish alerts** — a chime (Web Audio), vibration on Android, and a browser notification when the app is backgrounded (where supported)
- **Customisable timer** — sound/vibration toggles and a global rest-length override (or keep per-exercise programmed rests) in Settings → Rest Timer
- **Progress photos** — daily or weekly photo check-ins with reminders, a Day One vs Latest comparison, full-screen viewer, and on-device compressed storage
- **BMI** — calculated and shown in onboarding, Fuel and Settings (with the usual caveat that it can't tell muscle from fat)
- **More dynamic UI** — weekly-burn hero with big percentage and segmented progress bar, tappable week calendar strip, floating pill navigation, arrow-chip start button

> Platform honesty: web apps can't ring an alarm from a fully locked phone the way native apps can. BurnLab keeps perfect time regardless and alerts the moment it can — notifications cover the backgrounded case on Android/desktop; iOS plays the chime when you return to the app.

## What's new in v2 (from OVERLOAD)

- Rebranded to **BurnLab** with animated splash screen and dynamic home hero
- **Onboarding questionnaire** (age, height, weight, activity, equipment, experience, goal) → calculates maintenance calories, goal calories and macros (Mifflin-St Jeor)
- **Fuel tab**: calorie/macro targets + goal-based meal plan templates
- **Trophies tab**: PlayStation-style bronze/silver/gold/platinum achievement system with progress bars and unlock toasts
- **Exercise swapping**: every movement has equipment-aware alternatives; swaps are remembered
- Equipment-aware programs (full gym / dumbbells & bench / bodyweight only)
- **Settings**: profile editing with target recalculation, 4 accent themes, rest-timer and plate-graphic toggles, weekly volume target
- Minimal pictogram illustration for every exercise
- RPE explainer modal
- Fixed: iOS input zoom, status-bar overlap in installed mode, navigation lock during workouts
- Existing OVERLOAD data migrates automatically on first load

## Deploy (GitHub → Netlify, recommended)

1. Push this folder to your GitHub repo — **make sure the `src/` and `public/` folders upload too** (that's what broke the last build)
2. Netlify → Add new site → Import from Git → pick the repo — `netlify.toml` handles the rest
3. Every push redeploys

Local dev: `npm install`, then `npm run dev`.

## Updating after changes

Bump `CACHE` in `public/sw.js` (currently `burnlab-v16`) so phones with the installed app fetch the new version promptly. Keep this README updated with each release.

## Notes

- Calorie/macro numbers are standard estimates for healthy adults — general guidance, not medical advice.
- Data is per device/browser; Reset lives in Settings → Data.
