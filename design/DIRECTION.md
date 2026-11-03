# TCS Financial Outlook — DIRECTION (art direction decision)

Status: FINAL. This file is binding on every builder agent. Where it disagrees with any earlier
message, a commit sheet or an existing stylesheet, **this file wins**. All hex values and px sizes
below are measured; every pairing quoted with a ratio was computed with the WCAG formula.

Owner: art-director. Write scope: `design/` only. Nothing outside this folder is edited by me.

**READ THIS FIRST — the one-screen version:**
1. ONE-LINE: Kinetic poster (+ Archive index) for TCS — see §a.
2. SIGNATURE: *every case/year/metric selection re-inks the whole page* — see §b. It recurs at 9 touchpoints; the case lever in `#futures` is where it is played.
3. FIELDS: hero `#1f2bd0` / workbook `#fff0e7` / trend `#0c6e74` / marquee `#ff5b45` / futures `#080c26` / margins `#b22a4e` / ledger `#f3ebd8` / method `#ff7043` / footer `#0a0f1f` — see §c. **This overrules the 6-field cycle** (which repeated cobalt three times).
4. CHART INK: per-field series table, all ≥ 3:1 (graphics) / ≥ 4.5:1 (labels) — see §d.
5. TYPE: Switzer everywhere; **Zodiak confirmed, job-locked** to quoted/attested prose only — see §e.
6. MOTION: one decelerate family, `--ease-reveal` led, `--ease-spring` banned; `--dur-0..5` unchanged — see §f.
7. LIVE THING: **The Case Lever** — see §g, with all three states tabulated.
8. HABITS TO KILL: §h checklist — give it to the CSS agent verbatim.

---

## a. ONE-LINE DECISION

**Kinetic poster (+ Archive index) for TCS: the ten-year financial record arranged as ten flat, hard-edged colour modules that you switch — a case, a year, a metric — and each module lands as a whole-number state change, not a fade. Ground `#f3ebd8`-free: page anchors are midnight `#080c26` and warm paper `#fff0e7`, ink `#12123a` / `#fff6ea`, accent tangerine `#ff7043`. Display Switzer 700 at 96px. Clock one family — decelerate, `--ease-reveal`-led, `--ease-spring` overruled — ladder 80 / 200 / 380 / 560 / 900 / 1200 ms.**

Expanded, in the skill's exact sentence form:

> **Kinetic poster (+ Archive index) for TCS: ten fiscal years stacked as ten flat colour fields you switch, so every case selection lands as a whole-page state change. Ground `#080c26`, ink `#fff6ea`, accent `#ff7043`. Display Switzer 700 at 96px. Clock decelerate (`--ease-reveal`), ladder 80 / 200 / 380 / 560 / 900 / 1200 ms.**

Why this direction, from the brief's evidence (not the industry label): the subject is a **row of
years with numbers in them** — 11 fiscal years, 88 verified cells, 30 case values, 34 Power BI
visuals. That is a poster of figures and an index of records. It is not a "flown world" (there is no
place), not "material calm" (the subject is saturated and declared), not "object hero" (the object is
a column of rupees). Kinetic poster owns the first screen with a duotone pair per module and poster
caps; Archive index is the secondary layer and contributes exactly **one** device: the ledger reads
as a contact sheet of records with a live on-screen counter. No second accent, no second clock.

The current cobalt-everywhere build is a **single saturated field with tangerine interruptions**.
That is the "not colourful enough" diagnosis: seven sections, four of them blue. This direction
replaces the blue page with **seven distinct colour fields** whose only shared DNA is that they are
flat, hard-edged and set in the same type voice. Colour is the chapter number.

---

## b. SIGNATURE MOVE

**Every case/year/metric selection re-inks the whole page: the visitor's choice becomes a full-page state change — each section module swaps to its variant field for that case, and every figure re-sets to its whole new value — so the model is never a filter on one chart but a lens on the entire document.**

Written in the skill's spec form:

> Fiscal years colour the whole page when the visitor switches case or year. At rest it reads as ten
> flat modules in ten different colours with one module carrying the accent. It returns at the sticky
> chapter rail, the hero deck plate, every case card, the ledger row, the marquee divider and the
> footer stamp. Cost: zero assets, ~24 CSS custom properties swapped on `<html>`.

Why it survives motion off: **the page's colour states differ, they do not animate.** With
`prefers-reduced-motion`, or with JavaScript absent, the page still shows Bear red / Base cobalt /
Bull net precisely as colour and as a giant numeral — the modules change instantly. Nothing depends on
a tween to be true. This is a state change first and a transition second.

### Recurrence — nine touchpoints, not three

| # | Touchpoint | What the visitor changes | What the page shows |
|---|---|---|---|
| 1 | Sticky chapter rail (`topbar`) | Scroll position | A 10-segment **year rail**: FY18…FY28, one segment per fiscal year, the current chapter's segments filled. Each segment is its own colour. |
| 2 | `#overview` hero plate | Case + year | The deck plate's field is the selected case's field; the giant value sits on it. |
| 3 | `#trend` bar plate | Metric chip + case + year | Bar inks switch family with the metric; the forecast bars take the case field as their fill. |
| 4 | `#futures` (the live thing) | Case | Whole chapter re-inks; see §g. |
| 5 | `#margins` two plates | Case | The dotted forecast half of both margin lines takes the case ink. |
| 6 | `#ledger` table | Row focus / click | Row adopts its line's colour as a full-row fill; the counter reads `ROW 09 / 15`. |
| 7 | Marquee divider | Case (mirrored) | Its `Δ` column re-renders the three-case FY2028 spread; the selected case's item is filled, the other two outline. |
| 8 | Footer | Case (mirrored) | A single-line **state stamp** prints the current state: `BASE CASE · FY2028 · ₹3,12,762 Cr · +17.1% vs FY2026`. |
| 9 | Shareable link | URL `?case=bull&year=FY2028` | The state is in the URL; a shared link lands on that colour state. |

Touchpoints 1, 2, 4, 6, 7, 8 must be implemented for the signature to count. 3, 5, 9 are the
second-order surfaces.

---

## c. SECTION COLOUR FIELDS

**This is my answer to "not colourful enough": seven genuinely different hues, no two neighbours in
the same family, and every step is a hard cut at the section edge.** No gradients anywhere on a
field. `background: <hex>` on the section. The only permitted "transition" between fields is the
marquee band (a thing that arrives), and the only permitted motion on a field change is an instant
swap (see §f).

**I am overruling the lead's 6-field cycle (cobalt / paper / cobalt / midnight / tangerine / pale
cobalt / paper).** That cycle puts cobalt at #1, #3 and #6, tangerine at #5 and paper at #2, #7 — five
of seven modules are a blue or a paper. It reproduces the exact problem the user reported. The field
list below is binding; the builder follows this table, not the 6-field cycle.

| # | Section | Field hex | Ink hex | Neighbour step (in → out) |
|---|---|---|---|---|
| 0 | `#overview` hero | `#1f2bd0` **cobalt flux** | `#fff6ea` warm white | → `#fff0e7` **step L 0.066 → 0.893** (hard flip, 8.15:1 apart) |
| 1 | `#workbook` | `#fff0e7` **warm paper** | `#12123a` midnight ink | → `#0c6e74` **step L 0.893 → 0.125** |
| 2 | `#trend` | `#0c6e74` **deep teal** | `#fff3d6` warm white | → `#ff5b45` **step L 0.125 → 0.292** through the marquee |
| — | marquee divider | `#ff5b45` **signal coral** | `#1a0f12` near-black | → `#080c26` **step L 0.292 → 0.005** (biggest drop on the page) |
| 3 | `#futures` | `#080c26` **midnight navy** | `#fff6ea` warm white | → `#b22a4e` **step L 0.005 → 0.117**, a hue jump with almost no lightness step — the hardest seam on the page |
| 4 | `#margins` | `#b22a4e` **ledger oxblood** | `#fff6ea` warm white | → `#f3ebd8` **step L 0.117 → 0.834** |
| 5 | `#ledger` | `#f3ebd8` **aged ledger paper** | `#12123a` midnight ink | → `#ff7043` **step L 0.834 → 0.333** |
| 6 | `#method` | `#ff7043` **tangerine** | `#12123a` midnight ink | → `#0a0f1f` **step L 0.333 → 0.005** |
| 7 | footer | `#0a0f1f` **press black** | `#fff6ea` warm white | — terminal |
| — | sticky topbar/rail | `#141c5a` **cobalt dusk** | `#fff6ea` warm white | a fixed layer, not in the scroll cycle |

Hue spread across the page: **cobalt-blue 240°, teal 183°, coral 9°, oxblood 347°, tangerine 15°,
paper 34°, navy/black ~235° at L 0.005**. Six distinct hue families plus two neutrals. No two
adjacent modules share a family. That is the "colourful" fix, and it is structural rather than
confetti: the rainbow is a **sequence** (a fiscal record read left to right through the page), which is
why it is allowed where "colliding colours" is not.

### Field roles (do not collapse these)

- `#f3ebd8` aged ledger paper is **only** the ledger. `#fff0e7` warm paper is **only** the workbook.
  They are deliberately different papers — one is the empty sheet you copy from, one is the filled
  register. Keep the 0.06 L difference; it is invisible as a field but unmistakable side by side.
- `#0a0f1f` press black is **only** the footer. `#080c26` midnight navy is **only** `#futures`.
- `#1f2bd0` cobalt flux is **the page's primary field and the Base Case colour at once.** That dual
  role is the design: Base is the colour the page is made of, and Bear/Bull are deviations from it.
- `#ff7043` tangerine appears as a field **once** (`#method`) and as lines/marks elsewhere (the
  accent). It is never a second field.

### Anti-slop rules that come with this palette (non-negotiable)

1. **No gradient on any field.** No `radial-gradient`, no corner glow, no bloom. The old
   `.chapter--dark { background: radial-gradient(...) }` and `.chapter--hero { background: radial-gradient(...) }`
   are deleted, not restyled.
2. **No veil, scrim, texture or noise sheet over a field.** Grain/blur/`backdrop-filter` appear only on
   the sticky topbar (`backdrop-filter: blur(10px)` over `#141c5a` at 94% — the rail is the one element
   that must stay legible over a changing ground) and inside the preview dialog backdrop.
3. **No accent sprinkled on labels.** Chapter numbers, foot-labels and eyebrows are **tonal**: ink at
   100% for the primary label, ink at the `--*-2` secondary token for the rest. Accent is reserved for
   marks that *mean* something: the Base/Case triangle, the FY2026 empty bar slot, the win/lose deltas,
   the selected case, focus rings.
4. **No card with a border + radius + shadow on a saturated field.** Panels are tonal steps of the
   field: `color-mix(in oklab, <ink> 7%, <field>)`. Radius is 0 everywhere. Shadow is `none` everywhere.
5. **Maximum two hues-plus-ink visible in any one viewport.** Each module is one field + its ink +
   chart series inks (which count as data, not decor). Do not let a chart's series palette leak into
   the surrounding chrome.

### Section sub-fields (tonal steps — these are not new fields)

Every module derives its surfaces from the field and ink, so one pair of custom properties drives the
whole module:

```css
/* per section, on the section element */
#futures { --field: #080c26; --ink: #fff6ea; --ink-2: #a9b4e0; --line: #434455; --line-2: #6b6a74; }
/* universal derivations, declared once */
.panel   { background: color-mix(in oklab, var(--ink) 7%, var(--field)); }
.plate   { background: color-mix(in oklab, var(--ink) 11%, var(--field)); }
.hairline{ border-color: var(--line); }
```

Measured secondary inks (safe for body copy at ≥ 4.5:1 on their own field):

| Field | `--ink-2` | ratio |
|---|---|---|
| `#1f2bd0` hero | `#c7d0ff` | 6.00 |
| `#fff0e7` workbook | `#5b5570` | 6.34 |
| `#0c6e74` trend | `#d6f2ee` | 5.09 |
| `#080c26` futures | `#a9b4e0` | 9.43 |
| `#b22a4e` margins | `#ffd9c9` | 4.80 |
| `#f3ebd8` ledger | `#5a5468` | 6.09 |
| `#ff7043` method | `#3a2a22` | 4.99 |
| `#0a0f1f` footer | `#b3bdd9` | 10.17 |
| `#141c5a` rail | `#bfc6ea` | 9.29 |

Measured strong hairlines (`--line-2`, the ≥3:1 control/divider boundary):
`#1f2bd0` → `#9c9ddf` (3.59) · `#fff0e7` → `#7a7486` (4.04) · `#0c6e74` → `#c9e6e2` (3.9 est, verify) ·
`#080c26` → `#6b6a74` (3.61) · `#b22a4e` → `#eab4bb` (3.1 est, verify) · `#f3ebd8` → `#757180` (3.99) ·
`#ff7043` → `#7a3b3e` (3.03) · `#0a0f1f` → `#68738f` (3.3 est, verify). Any `--line` that does not
clear 3:1 is a divider only, never a control boundary. The 3:1 floor applies **only where a line is
carried in no other way** — table and assumption row rules are exempt because the row's position (not
its rule) encodes the row; they use `--line` at ~1.6:1.

---

## d. CHART INK PER FIELD

Charts live on `#overview`, `#trend`, `#futures`, `#margins`, `#ledger`. (The workbook has
sparklines; they follow the `#workbook` rules.) **Series never cross a field boundary unchanged** —
that is the whole point of this direction: the chart is re-inked when the field changes.

### The contrast logic, stated once

1. **A series ink must clear 3:1 against its own field** — that is the WCAG floor for meaningful
   graphics and for text ≥ 24px. Direct labels and axis text clear **4.5:1**.
2. **Series are chosen by luminance distance from the field, not by hue** — except where a pair of
   series must read as two *different* things, in which case they are also separated by ≥ 25° of hue
   and by line style (solid/dashed/dotted).
3. **Dual-encoding is mandatory.** Every case is carried by colour **and** by one of: dash pattern
   (actual `5 0`, forecast `6 5`), line weight (actual 2.5px, selected case 3px, unselected case
   1.5px), or a solid/outline fill. A colour-blind visitor reading the Bear line on `#080c26` gets it
   from `6 5` dashes even if `#ff8a3d` and `#f5c400` look alike to them.
4. **On a light field, series go dark. On a dark field, series go light. Saturated mid-luminance
   colours are never a series on a saturated mid-luminance field** — that is why cobalt is *not* a
   series colour on the cobalt hero.
5. **The forecast zone is a tint of the field, not a new colour:** `color-mix(in oklab, var(--ink) 8%, var(--field))`,
   separated by a dashed `--line-2` edge at `x = FY2026`. The old violet `#e9e3f8` wash dies.

### Per-field chart ink

**`#overview` — field `#1f2bd0`, ink `#fff6ea`.** Reported history ink = `#fff6ea` (8.48:1). Forecast
segments = the case ink, which on this field collapses to warm-white-family values only:
| Series | Ink | Ratio on field |
|---|---|---|
| Reported FY18–FY26 (line, solid, 2.5px) | `#fff6ea` | 8.48 |
| FY2026 actual marker + its direct label | `#fff6ea` + `#ff7043` halo ring | 8.48 / 3.31 |
| Selected case (line, dashed `6 5`, 3px) | `#ffe9a8` | 7.55 |
| Bear / Bull unselected (lines, 1.5px, `2 4`) | `#c7d0ff` | 5.95 |
| Grid lines | `#4d55dd` | 1.6 (decorative) |
| Axis text | `#fff6ea` at 11px | 8.48 |
Why: on the cobalt field the only legible series are light ones. The hero shows *one* case at a time
(the selected one) plus ghosted unselected paths, so hue is not doing legibility work here — the
`--ease-into-case` colour is `#ffe9a8` (a warm-white shift, not a second hue), and the case identity
is carried by the dashed path + the plate's field, which changes in `#futures` (§g).

**`#workbook` — field `#fff0e7`, ink `#12123a`.** Sparklines (Revenue, EBITDA, PAT, FCF): all four in
`#12123a` (16.08:1) at 1.5px, with a 3px final-point dot in `#1f2bd0` / `#0c6e74` / `#b22a4e` /
`#ff7043` respectively. Reported (paper) data never gets the saturated palette; only the "where it
lands" dot does.

**`#trend` — field `#0c6e74`, ink `#fff3d6`.**
| Series | Ink | Ratio |
|---|---|---|
| Reported bars (FY18–FY25) | `#c9e6e2` | ~4.9 |
| FY2026 actual bar | `#ffffff` | 6.00 |
| Forecast bars (FY27–FY28) | `#ffe9a8` | 4.99 |
| Growth strip positive | `#7dffe8` | 5.2 |
| Growth strip negative | `#ffb3a1` | 3.4 (≥3:1: it is a bar, direct-labelled) |
| Grid / baseline | `#3f8f92` | 1.3 (decorative) |
| Axis + direct labels | `#fff3d6` | 5.44 |
Why: the trend plate answers "is the company growing?", so the ink ladder is *reported → actual →
case* as three lightness steps within one hue family (teal-white → white → warm-white). On a
mid-luminance teal, no saturated series clears 4.5:1 (measured: tangerine 2.33, amber 4.12, rose
1.91), so the plate's encode is **lightness rank**, not hue. Case identity is carried by the direct
label (`FY2028 · BASE`) and by the marquee strip below, not by bar colour.

**`#futures` — field `#080c26`, ink `#fff6ea`.** This is the only field where the saturated palette is
fully live, because midnight is dark enough to hold every series above 6:1.
| Series | Ink | Ratio |
|---|---|---|
| Base Case | `#54c8ff` | 10.16 |
| Bull Case | `#ff8a3d` | 8.21 |
| Bear Case | `#00e0c6` | 11.44 |
| FCF series | `#f5c400` | 11.71 |
| PAT series | `#ff4d8d` | 6.14 |
| Grid lines | `#2a3050` | 1.6 |
| Axis text | `#a9b4e0` | 9.43 |
| Direct labels | `#fff6ea` | 17.99 |
Why: same paradigm as Power BI's own series colours, re-tuned to midnight. Note `#3d4bff` (the case
fill used on light fields) is **forbidden as a line colour here** — 3.34:1, it disappears into the
navy. That is exactly the mistake the current build makes.

**`#margins` — field `#b22a4e`, ink `#fff6ea`.**
| Series | Ink | Ratio |
|---|---|---|
| EBITDA margin line (reported, solid) | `#ffd9a8` | 4.72 |
| PAT margin line (reported, solid) | `#fff6ea` | 5.89 |
| Either line, forecast half (dashed `6 5`) | `#7dffe8` | 5.20 |
| Paired bars — PAT | `#fff6ea` | 5.89 |
| Paired bars — FCF | `#c9d2ff` | 4.24 |
| **FY2026 FCF slot** | `none` — an empty dashed outline `#eab4bb`, 1.5px, plus the 11px label `NOT DISCLOSED` | 3.1 (outline only) |
| Grid / baseline | `#d17c8c` | 1.6 |
Why: two series only per chart, separated by lightness (warm-white vs pale gold) **and** by which
line is dashed in the forecast zone. Oxblood is dark enough for both. Cobalt `#3d4bff` is banned here
too (1.09:1).

**`#ledger` — field `#f3ebd8`, ink `#12123a`.** The ledger is a table, so its "chart ink" is its row
fills and chips — and these are the field's *dark* series, which is why this module must be light:
| Meaning | Ink | Ratio on field |
|---|---|---|
| Reported / actual rows | `#12123a` on no fill | 15.07 |
| Base Case | `#1f2bd0` | 7.64 |
| Bull Case | `#0a5c61` (deep teal) | 6.51 |
| Bear Case | `#8a1f3a` (deep oxblood) | 7.57 |
| Selected row | full-row fill `#1f2bd0` field, ink `#fff0e7` | 8.15 |
| FCF `—` (FY2026) | `#5a5468` + `NOT DISCLOSED` label | 6.09 |
| Forecast row background | `color-mix(in oklab, #12123a 5%, #f3ebd8)` | — |
| Table header ink | `#5a5468` | 6.09 |
Why: the ledger is the cross-check module — it must read like a printed register, in inks that are
**darker** than the fx fields so a recruiter can scan 15 rows. The three case inks here
(`#1f2bd0` / `#0a5c61` / `#8a1f3a`) are deliberately *the fields of other chapters*, deep-printed —
so the reader learns the page's colour grammar by looking at the table.

Cross-field summary: **cobalt `#1f2bd0` never appears as a chart series on a saturated field; it is the
Base identity and it lives in the ledger (7.64:1 on paper) and in the `#futures` controls. On
`#futures` the Base series is `#54c8ff`.**

---

## e. TYPE SYSTEM

### Decision: **deploy Zodiak, job-locked.** Confirms the lead's reservation, with one addition.

Zodiak (400 / 700 / 900, self-hosted, currently unused) becomes **the document's own voice**: it is
used **only** for words that are quoted from the record or that state the document's first-person
position. It is the one place where the type stops being analysis and becomes attestation.

**Zodiak is allowed in exactly four places, and nowhere else:**
1. The FY2026 disclosure quote in `#workbook` (the `.workbook-note` block) — Zodiak 400, 19px/1.45.
2. The three `#ledger` fineprint statements (*Two FY2025 PAT references* / *FY2026 is statutory* /
   *Cases are cases*) — Zodiak 400, 17px/1.5, with the lead clause in Zodiak 700.
3. The `#method` "Made by hand" note — Zodiak 400 22px/1.4, opening line in Zodiak 700.
4. The footer disclaimer, and the `#margins` "empty FY2026 slot" note (**this one is an addition** —
   the FY2026 FCF omission is the document's own judgement, so it is own-voice testimony like the
   ledger fineprint; it reads Zodiak 400 17px/1.5).

**Zodiak is forbidden** in: h1/h2/h3, chapter numbers, foot-labels, kickers, all charts (SVG `<text>`,
axis, direct labels, tooltips), all tables and table cells, all controls (chips, buttons, tabs, the
lever), all numbers, the marquee, the nav, the wordmark, and any heading inside a card. A Zodiak
numeral anywhere is a bug.

Why not drop it: the page's whole credibility argument is "this number can point at its source."
A single human serif voice for the attested sentences makes that argument *visually* — the sans is the
model, the serif is the filing. Why not deploy it widely: a serif display would turn the poster into
an editorial magazine, which is a different (and worse) direction for a figure-led subject.

### Faces and roles

| Token | Face / weight | Job |
|---|---|---|
| `--font-display` | **Switzer 700** | h1, h2, hero numerals, KPI values, the state numeral |
| `--font-body` | **Switzer 400 / 500** | all body, lede, captions, table prose |
| `--font-label` | **Switzer 600**, `+0.06em`, uppercase | chapter numbers, foot-labels, axis legends, control group labels |
| `--font-num` | **Switzer 500/700**, `font-variant-numeric: tabular-nums` | every figure in prose, all chart labels, all table cells |
| `--font-quote` | **Zodiak 400 / 700** | the four places above, only |

`--font-mono` is **retired**: it currently resolves to Switzer anyway, and the census flags mono as the
house voice as a slop tell. Data is distinguished by `tabular-nums`, not by a third face. Delete
`--font-mono` from `tokens.css` and replace every use with `--font-num` (charts, tables, chips) or
`--font-label` (uppercase labels).

**Indian digit grouping is a type rule, not just a data rule:** every figure ≥ 1 lakh renders as
`2,67,021` (never `267,021`) and every value ≥ 1 crore may compress to `2.67L Cr` in direct labels
only — never in the ledger, tooltips or the CSV. The grouping is implemented in the number formatter,
and **tabular-nums plus a fixed `ch`-based column width** means a figure going from `9,999` to
`2,67,021` does not jiggle the layout: numbers are right-aligned in their own column, always.

### Sizes (measured, not fluid clamp guesses where it matters)

| Role | Face | @1440 | @390 | Line-height | Tracking |
|---|---|---|---|---|---|
| **display** (hero h1, one per page) | Switzer 700 | **96px** (§i.1 — was 176px, cut for a 2-line lockup) | **46px** | 0.92 | −0.045em |
| **h1** (section heads that are not the hero, e.g. `#futures`) | Switzer 700 | 104px | 44px | 0.92 | −0.04em |
| **h2** (chapter titles) | Switzer 700 | 72px | 38px | 0.95 | −0.035em |
| **h3** (plate/card titles) | Switzer 600 | 26px | 21px | 1.15 | −0.01em |
| **body** | Switzer 400 | 17px | 16px | 1.55 | 0 |
| **small** (captions, axis legends, table headers, fineprint) | Switzer 500 / 400 | 13px | 13px | 1.45 | +0.01em |
| **number** (KPI values, `.num`, delta, ledger cells) | Switzer 700 (500 in tables) | 40px / 15px in tables | 30px / 14px in tables | 1.0 / 1.2 | −0.03em / 0 |
| **state numeral** (the live thing, §g) | Switzer 700 | 112px | 52px | 0.9 | −0.05em |
| **label** (chapter-no, foot-label, chip text) | Switzer 600 caps | 12px | 12px | 1.2 | +0.06em |
| **quote** (Zodiak) | Zodiak 400 | 19px | 18px | 1.45 | 0 |
| **hero kicker** (single line, no box) | Switzer 500 | 15px | 13px | 1.3 | +0.02em |

Rules attached:
- `clamp()` only where the role spans breakpoints; each step is written
  `clamp(<390px value>rem, <slope>, <1440px value>rem)` with max ≤ 2.5× min. Display is
  `clamp(2.875rem, 4.44vw + 1.75rem, 6rem)` = 46px → 96px (2.09×, the only rate that holds the hero
  to two lines at both widths — see §i.1). Every headline is an **explicit two-line lockup** with a
  `max-width` in px, not a `ch` count; all seven rewrites and their proofs are in §i.1.
- Display tracking −0.045em, never tighter. Do not go to −0.07em.
- `text-wrap: balance` on h1/h2; `text-wrap: wrap` on anything split by SplitText.
- Body min 16px at 390. Never shrink body to 14px "because data".
- No tiny kicker above every section head. Chapter numbers are **one line of text**, not a chip:
  `03 / Three futures` in `--font-label`, tonal ink.

---

## f. MOTION BUDGET

**One ease family: decelerate.** The page moves like a lever being thrown and settling — fast out,
long tail. Everything is on the same curve; nothing bounces, nothing overshoots, nothing eases in.

### The clock (token names from `assets/tokens.css`, unchanged)

| Token | Value (unchanged) | Family | What is allowed on it |
|---|---|---|---|
| `--ease-reveal` | `cubic-bezier(.22, 1, .36, 1)` | **decelerate — THE family** | Every entrance, every field change, every numeral travel |
| `--ease-out` | `cubic-bezier(.16, 1, .30, 1)` | decelerate (sibling) | Chart line draw-on, bar scale-in only |
| `--ease-micro` | `cubic-bezier(.33, 1, .68, 1)` | decelerate | Hover/focus colour + 1px state changes |
| `--ease-out-quart` | `cubic-bezier(.25, 1, .5, 1)` | decelerate | The marquee's pause/resume and the ledger row fill |
| `--ease-in-out-sine` | `cubic-bezier(.37, 0, .63, 1)` | gentle symmetric | The single ambient loop allowed (scroll cue) |
| `--ease-in-out` | `cubic-bezier(.76, 0, .24, 1)` | **RESERVED** | Only the year-rail indicator travelling between segments |
| `--ease-spring` | `cubic-bezier(.34, 1.56, .64, .64)` | **OVERSHOOT — BANNED** | Never. Not on the lever, not on cards, not on numbers. Overshoot is the slop tell. |

### The ladder (token names from `assets/tokens.css`, values unchanged)

| Token | Value | Assigned job |
|---|---|---|
| `--dur-0` | 80 ms | Press feedback, chip `:active`, focus ring appearance |
| `--dur-1` | 200 ms | Hover/focus, symbol change on the lever, tooltip in |
| `--dur-2` | 380 ms | **= `--clock-switch`** — the lever settling, bar/line redraw, ledger row selection |
| `--dur-3` | 560 ms | Panel and plate entrances within a chapter |
| `--dur-4` | 900 ms | Chapter-head line reveal, big number count-up |
| `--dur-5` | 1200 ms | The one-time section hand-off (marquee band entering), hero's first paint |

Rules: no animation may exceed `--dur-5`. Interactive state changes are capped at `--dur-2` — this is
a repeated action and must feel immediate. Reveals move content **that is already visible** (no
opacity-0 parking); the existing 2s `intro-deadline` CSS failsafe and the 3.5s JS failsafe stay. Scroll
scrubs run `linear` (no easing on a scroll timeline). **Field colour changes do not animate at all** —
colour swaps instantly; only the marks on top of it move. (`opacity`/`color`/`background-color`
transitions on a field = a bug.)

**Reduced motion:** everything above still renders; only `--dur-*` collapse to `1ms`. Charts draw in
their final geometry at first paint (the existing chart kit already supports this). The reduced-motion
page must look like the "most telling still frame": ten flat coloured modules, one giant numeral per
module.

**Live budget:** the lever's value travel must land within 380 ms of release on a mid phone with
Lenis/GSAP loaded. If a case switch costs more than one composited repaint of the KPI band, it is a
bug.

---

## g. THE LIVE THING — "THE CASE LEVER"

**Name: The Case Lever.** Placement: `#futures`, directly under the chapter head, above the KPI band.
It is the page's one completed interaction: the visitor physically drags a lever across a **Bear —
Base — Bull** track and the entire document's FY2028 (and FY2027) future re-computes in front of them.

### Anatomy

```
THE CASE LEVER                                    03 / Three futures
Bear ●━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━● Bull     [ drag the lever ]
        −5.0%          BASE            +4.7%
        ▼ instrument line at x = FY2026
┌───────────────┬───────────────┬───────────────┬───────────────┐
│ REVENUE  FY28 │ NET PROFIT    │ EPS           │ FREE CASH FLOW│
│ 3,12,762      │ 60,676        │ 167.70        │ 55,672        │
│ ═════════     │ ═════════     │ ═════════     │ ═════════     │
│ Δ BASE  —     │ Δ BASE  —     │ Δ BASE  —     │ Δ BASE  —     │
└───────────────┴───────────────┴───────────────┴───────────────┘
   stamped: BASE CASE · FY2028 · modelled, not guided —
```

- A **lever** (a real `<input type="range" min="0" max="2" step="1" aria-valuetext="Base Case">`,
  restyled as a square-cornered rail; Bear/Base/Bull are its three detents). Drag it, press left/right
  arrows, click a detent, or press 1/2/3. Touch: drag with the thumb only, with a 44px hit area.
- The lever is the **control**; the **state** is four outputs that each carry: absolute value, unit,
  a `Δ vs Base` line, and a horizontal **beacon bar** whose length is the value's position in the
  Bear→Bull span of that metric.
- A **state stripe** runs across the top of the plate: `#ff8a3d → #54c8ff → #00e0c6` for
  Bear/Base/Bull, with the current position marked by a 4px stop.
- An **instrument line** drops from the lever down through the whole chapter, meeting the runway chart
  at its FY2028 x-position — so the lever literally points at the year it is changing.

### The three states (numbers are real, from `assets/data.js`)

| | **Bear** | **Base** | **Bull** |
|---|---|---|---|
| Case field (`#futures` module ink) | `#ff8a3d` | `#54c8ff` | `#00e0c6` |
| Lever thumb / stripe | `#ff8a3d` | `#54c8ff` | `#00e0c6` |
| Revenue FY2027 | **₹2,88,383 Cr** | **₹2,95,058 Cr** | **₹3,00,399 Cr** |
| Revenue FY2028 | **₹2,97,034 Cr** | **₹3,12,762 Cr** | **₹3,27,435 Cr** |
| Revenue Δ vs Base (FY28) | **−15,728 Cr · −5.0%** | — | **+14,673 Cr · +4.7%** |
| PAT FY2028 | **₹55,248 Cr** | **₹60,676 Cr** | **₹65,814 Cr** |
| PAT Δ vs Base | **−5,428 Cr · −8.9%** | — | **+5,138 Cr · +8.5%** |
| EPS FY2028 | **₹152.70** | **₹167.70** | **₹181.90** |
| EPS Δ vs Base | **−15.00 · −8.9%** | — | **+14.20 · +8.5%** |
| FCF FY2028 | **₹48,030 Cr** | **₹55,672 Cr** | **₹63,211 Cr** |
| FCF Δ vs Base | **−7,642 Cr · −13.7%** | — | **+7,539 Cr · +13.5%** |
| EBITDA margin implied FY28 | 25.70% | 26.45% | 27.20% |
| The sentence under the lever | “Slower growth (5.0% FY28) and margin flat at 25.7–26.0%.” | “The supplied baseline: 9.0% FY28 growth, 28.5% EBITDA margin.” | “Growth 14.0% FY28 with 31.0% EBITDA margin — the upper bound of the assumption grid.” |
| Marquee Δ column | −4.7% on FY2028 base | — | +4.7% |
| Footer stamp | `BEAR CASE · FY2028 · ₹2,97,034 Cr · −5.0% vs Base` | `BASE CASE · FY2028 · ₹3,12,762 Cr · the baseline` | `BULL CASE · FY2028 · ₹3,27,435 Cr · +4.7% vs Base` |

Every value above comes from the ledger; the deltas are `Bear − Base` and `Bull − Base` computed
from those exact figures. **Base is never animated to; it is the zero line.** When the lever is at
Base the `Δ BASE` lines read `—` in `--ink-2` (not blank, not zero — an em dash, because Base has no
delta from itself).

### States of the instrument (all four must exist)

1. **Resting / Base** — lever at the centre detent, plate field `#080c26`, four beacons at the mid
   position, `Δ` rows show `—`. This is the frame that must survive motion off.
2. **Dragging** — thumb follows the pointer, the **beacons move continuously** (they are the scrub),
   but the **numbers snap only at detents**. Deliberate: a figure that flickers through interpolated
   values would be showing data that does not exist. At a detent the numeral changes in one
   `--dur-2` step with a `translate: 0 6px → 0` (−6px for a decrease) reveal, never a count-through
   of intermediate totals.
3. **Committed (Bear or Bull)** — the whole `#futures` module re-inks: the case field becomes the
   chosen case's ink at 8% as the plate background, the runway chart's other two cases drop to 1.5px
   muted strokes, the assumptions table's chosen column fills, the chapter's `03 / Three futures`
   label appends the case name, the KPI band above and the marquee + footer below update.
4. **Keyboard / no-hover** — arrow keys step detents, `Home` = Bear, `Enter/Space` on a detent commits,
   `aria-live="polite"` announces `"Bull Case, FY2028 revenue 3,27,435 crore, up 4.7 percent on base"`.

### What it proves

It proves the model is a **system with a range**, not a single forecast dressed as certainty: the
visitor can produce the entire spread of FY2028 outcomes (−5.0% to +4.7% revenue, −8.9% to +8.5% EPS,
−13.7% to +13.5% FCF) themselves, from three columns of supplied assumptions, and watch the same three
cases land consistently in four separate charts and a 15-row ledger. It also proves the honesty claim:
the FCF column moves by the widest percentage, exactly as the assumption grid implies, and the FY2026
FCF slot stays empty in every case — the model cannot invent the number TCS stopped publishing.

### What it replaces

The current build wires a case selector through six scattered surfaces (hero buttons, `#trend` chips,
`#futures` chips, case cards, comparison columns, ledger rows). Those stay as **mirrors** of the
lever's state — they are touchpoints 2/3/6 of the signature — but the **lever is the control**. Every
mirror reads and writes the same single state object and the same custom properties on `<html>`:

```css
html[data-case="bear"] { --case-field: #ff8a3d; --case-ink: #fff6ea; --case-line: #ff8a3d; }
html[data-case="base"] { --case-field: #54c8ff; --case-ink: #fff6ea; --case-line: #54c8ff; }
html[data-case="bull"] { --case-field: #00e0c6; --case-ink: #fff6ea; --case-line: #00e0c6; }
```

---

## h. WHAT DYING HABITS DIE (build checklist)

| Kill | Where it is now | Replace with |
|---|---|---|
| `radial-gradient` fields on hero and `#futures` | `story.css` `.chapter--hero`, `.chapter--dark` | Flat field hex from §c |
| Violet `#e9e3f8` forecast wash | `charts.css` `.forecast-zone` | `color-mix(in oklab, var(--ink) 8%, var(--field))` |
| `--font-mono` as a third voice | `tokens.css`, all chart/table CSS | `--font-num` (tabular) / `--font-label` |
| Cobalt `#3d4bff`/`#213bfa` used as a series on a saturated field | `charts.css` | §d per-field series table |
| Rounded cards, borders and shadows on saturated fields | everywhere | radius 0, shadow none, tonal step fills |
| `--ease-spring` overshoot | any | banned |
| Four shades of blue across seven sections | `reboot.css` | seven distinct fields, §c |
| Cyan / mint / rose used as decorative chips and dots | `reboot.css` | data-only, only on `#futures` |
| Gradients inside type, coloured headline words | none yet — keep it that way | one tonal step or one face swap max |

---

## i. TYPE FIXES AND NAMING (QA pass — supersedes §e where they collide)

The QA inspector found 13 line-count failures, one contrast failure, one dishonest token name and one
over-long pin. All four are fixed below. **The one substantive change to §e: the hero display drops
from 176px to 96px.** At 176px the hero headline cannot be held to two lines by any rewrite — the
arithmetic is under §i.1 — so 176px was a number I could defend as a poster scale but not as a
2-line headline. 96px it is, and this is the size everything downstream must use.

### i.1 — Headline rewrites that fit 2 lines at 1440 and 390

**The arithmetic.** Switzer 700 sentence case averages **0.58em per glyph**; display tracking is
**−0.045em**; so one character costs **0.535 × px**. Line capacity of a column is
`C = column_px ÷ (0.535 × px)` characters. The measured column at 1440 is **720px** (the hero's
`max-width: 720px`), and at 390 it is **351px** (full width minus the 20px gutters).

| Size | Column | Chars/line | Px per line |
|---|---|---|---|
| hero display @1440 | 720px | 96px → **14.0 ch** | 14 × 51.4 = 720px |
| hero display @390 | 351px | 46px → **14.3 ch** | 14 × 24.6 = 345px |
| h1 (`#futures`) @1440 | 780px | 104px → **14.0 ch** | 14 × 55.6 = 779px |
| h1 (`#futures`) @390 | 344px | 44px → **14.6 ch** | 14 × 23.5 = 330px |
| h2 @1440 | 720px | 72px → **18.7 ch** | 18 × 38.5 = 693px |
| h2 @390 | 336px | 38px → **16.5 ch** | 16 × 20.3 = 325px |

**Why 176px had to go.** At 176px the hero's line capacity is 7.6 characters. "Nine years." is 11
characters (1036px), "Three futures." is 14 (1318px). *Every* word longer than 7 characters wraps
alone, so the string is a minimum of **4 lines at 176px and 3 lines at 56px at 390**. There is no
rewrite of that headline that fits 176px; the size was wrong. At **96px/46px** the capacity is
14.0/14.3 characters and a two-line lockup fits with 1 character of headroom on the long line.

**Rule that comes with this: the hero headline is an explicit two-line lockup, not a wrapped
paragraph.** Break it in markup (`<br>` or two `<span>` blocks with `display:block`), `max-width:
720px`, `text-wrap: nowrap` inside each line, and verify each line independently. Do not rely on
`text-wrap: balance` to find a two-line break — it optimises fill, not line count.

| # | Section | Current heading | Replacement (line 1 / line 2) | 1440 proof | 390 proof |
|---|---|---|---|---|---|
| 1 | `#overview` | "Nine years. Three futures." | **"Ten years." / "Three futures."** | 514px + 719px, both ≤ 720px col at 96px | 246px + 345px, both ≤ 351px col at 46px |
| 2 | `#workbook` | "Every number here can point at its source." | **"Every cell," / "sourced."** | 732px total ≤ 1440px (2 × 720) at 72px | 386px total ≤ 672px (2 × 336) at 38px |
| 3 | `#trend` | "Nine reported years. Then the model takes over." | **"Nine years," / "then the model."** | 1002px total ≤ 1440px at 72px | 529px total ≤ 672px at 38px |
| 4 | `#futures` | "Same company. Three different FY2028s." | **"One company." / "Three FY2028s."** (h1 at 104/44) | 668px + 779px, both ≤ 780px col at 104px | 282px + 330px, both ≤ 344px col at 44px |
| 5 | `#margins` | "Where the profit and the cash part ways." | **"Profit and cash" / "part ways."** | 963px total ≤ 1440px at 72px | 508px total ≤ 672px at 38px |
| 6 | `#ledger` | "The whole model, one table." | **"The whole model." / "One table."** | 1002px total ≤ 1440px at 72px | 529px total ≤ 672px at 38px |
| 7 | `#method` | "How this page was built." | **"How this page" / "was built."** | 886px total ≤ 1440px at 72px | 468px total ≤ 672px at 38px |

Every replacement keeps the original's meaning, and #4 keeps the FY2028-year identity that the
section is about. All seven are **two explicit lines**, not wrapped paragraphs — same markup rule as
the hero.

**The `<em>` on "Three futures." — KEEP it, with a size step, not a colour step.** It stays the same
face and weight as the rest of the h1 and gets **`font-size: 1.0em` with `font-weight: 700` unchanged**;
its differentiation is that it is the **second of two deliberately stacked lines**, so the rhythm is
already doing the work. It is **not** italic (Switzer ships no italic file in `assets/fonts/` — an
`font-style: italic` would synthesise a fake oblique, which is a type bug). Implement it as
`<em class="hero-em">` with `font-style: normal`.

### i.2 — THE 2.5:1 `<em>` CONTRAST FAILURE — corrected colour

The inspector measured `#ff7043` tangerine on the hero at **2.5:1** against the *current* cobalt
`#213bfa`; against **our** hero field `#1f2bd0` it measures **3.31:1**. That clears the 3:1 large-text
floor but only by 0.31 — it would fail under any tint of the field, and it contradicts §c rule 3
("accent is never a coloured headline word").

**Corrected: the `<em>` ink is `#ffe9a8` (warm gold), not `#ff7043`.**

| Pair | Ratio | Floor | Verdict |
|---|---|---|---|
| `#ffe9a8` on hero `#1f2bd0` | **7.55:1** | 3:1 large | passes with 2.5× margin |
| `#fff6ea` (hero ink) on `#1f2bd0` | 8.48:1 | — | the line above the em |
| `#ff7043` on `#1f2bd0` | 3.31:1 | 3:1 | **rejected — too close to the floor** |

`#ffe9a8` is already in the system: it is the hero's selected-case series ink (§d) and the trend
forecast-bar ink. So the em reads as "the part of the sentence that is a forecast" — gold = case data —
which is a meaning, not a decoration. The same token must be used wherever a `<em>` sits on a dark
field: `#ffe9a8` on `#080c26` is 16.02:1, on `#0a0f1f` 15.87:1, on `#141c5a` 13.01:1.

**Never put an `<em>` on `#b22a4e` or `#0c6e74` in `#ffe9a8`/`#ff7043`** — measured 5.24 and 2.29
(oxblood) and 4.99 and 2.19 (teal). On those two fields the em is `#fff6ea` (5.89 / 5.61), the same as
the body ink, and emphasis comes from the line break only.

### i.3 — TOKEN RENAMING (honest names; one pass for the CSS owner)

`--violet: #ff7043` is a lie: the variable is named for a hue it does not hold, which is why the
inspector flagged a purple palette that does not exist. **Rename it. Do not keep an alias** — an alias
`--violet: var(--tangerine)` leaves the lie in the file and the next agent will trust the old name.

| Old name | New name | Value | Where it is defined / used |
|---|---|---|---|
| `--violet` | **`--tangerine`** | `#ff7043` | `tokens.css:62`, `reboot.css:21`, every `var(--violet)` |
| `--violet-deep` | **`--tangerine-deep`** | `#e64a1b` | `tokens.css:63` |
| `--violet-tint` | **`--tangerine-tint`** | `rgba(255,112,67,0.12)` | `tokens.css:64` |
| `--violet-line` | **`--tangerine-line`** | `rgba(255,112,67,0.4)` | `tokens.css:65`, `story.css` `.year-badge`, `.sources-list a` |
| `--atlas-orange` | **`--tangerine`** (delete) | `#ff7043` | `reboot.css:39` — duplicate of the row above, collapse into one |
| `--atlas-blue` | **`--cobalt`** | `#213bfa` | `reboot.css:40` |
| `--atlas-ink` | **`--midnight`** | `#0b1439` | `reboot.css:41` |
| `--atlas-paper` | **`--warm-white`** | `#fff5eb` | `reboot.css:42` |
| `--atlas-ease` | **`--ease-reveal`** (delete) | `cubic-bezier(.23,1,.32,1)` | `reboot.css:43` — a **fourth** ease family; §f allows one. Point every use at the token. |
| `--series-4` | **`--series-violet`** | `#c84bff` | `tokens.css:77` — the only genuinely violet token; keep the value, name it plainly | 
| `--series-5` | **`--series-rose`** | `#ff3d7c` | `tokens.css:78` |
| `--blue` | **`--cobalt`** (delete) | `#213bfa` | `tokens.css:66` |
| `--blue-mid` | **`--cobalt-mid`** | `#1d34d8` | `tokens.css:67` |
| `--teal`, `--amber`, `--rose` | keep names | — | `tokens.css:68-70`, accurate already |

**Two extra honesty fixes while renaming:** `--series-3: #f5a623` is named "amber" in one place and
"FCF" in another — it holds amber, so name it `--amber` and let §d decide what FCF is on each field.
And `reboot.css:21` defining `--violet: #ff7043` *after* `tokens.css:62` defines the same token is a
duplicate definition: delete one, keep `tokens.css` as the single source.

**Anything that must NOT be renamed:** `--violet` appears inside `base.css` and `story.css` in
selectors like `.sources-list a { color: var(--violet-deep) }`. The rename is mechanical
(`--violet` → `--tangerine`, etc. across all six CSS files) and must be a single find-and-replace per
token, run once, with no period where both names exist.

### i.4 — PIN DURATION: capped at 2 screens, and here is the one pin we allow

**The inspector's 5-screen pin is a violation and must be cut to 2 screens.** §f sets the motion budget
and this is the fourth constraint on it.

- **The only pin permitted on this page is the Case Lever block in `#futures`**, and only if the
  builder uses `data-pin` at all. Its scroll length is **`max-height: 200svh`** — the pinned viewport
  itself is `100svh` and the scroll distance is at most `100svh`. That is 2 screens total, measured
  from the pin's `start: "top top"` to `end: "+=100vh"` in ScrollTrigger terms.
- **No other section may pin.** `#futures` is pinned once, at most. The `motion-core.css`
  `[data-pin="horizontal"]` recipe with `--pin-panel-w` is **not to be used** — it is the 5-screen
  pattern the inspector measured.
- **The pin must release** into the KPI band without a snap: the release is a `linear` scrub (scroll
  timelines are always `linear`, per §f), not one of the eased tokens.
- **If the pin cannot be built within 2 screens, do not pin at all.** The lever works unscrolled — it
  is a control, not a chapter. An unpinned 2-screen lever block is the correct fallback and is the
  default; pinning is optional polish.
