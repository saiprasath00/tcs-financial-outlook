/* ==========================================================================
   motion-core.js: smooth scroll plus scroll choreography from data attributes
   --------------------------------------------------------------------------
   What it does
     Lenis smooth wheel scroll driven by GSAP's ticker and synced to
     ScrollTrigger, plus a registry of scroll effects you switch on in markup:
       data-intro / data-intro-item / data-intro-media   above-the-fold intro (needs the CSS deadline in the page <head>)
       data-reveal="lines"   masked line rise (SplitText, headings only, reverted after)
       data-reveal="image"   clip-inset un-clip plus media scale settle
       data-reveal="settle"  small y settle with its content, never opacity-only
       data-reveal="pop"     small y settle + a scale step for stat blocks
       data-reveal="items"   children settle, row by row, total spread capped
       data-reveal="scrub"   one scrubbed scene: [data-parallax] children travel,
                             [data-scrub="case|plate|rule|glyph"] children do
                             their own spatial move. Never pinned (see notes).
       data-parallax="0.15"  scrubbed y travel = 0.15 x viewport height; + lags (reads deeper), - leads.
                             On img/video/canvas/picture the media is over-scaled so its clipping frame never shows an edge.
                             A number plus "mask" (data-parallax="0.12 mask") also un-clips the frame it sits in.
       data-count            integer count-up when its block first enters
       data-marquee          CSS keyframe loop + scroll-velocity boost + pause button (WCAG 2.2.2)
       data-pin="horizontal" pinned horizontal track; vertical stack under reduced motion and below pinMinWidth
       data-stack            sticky stacking cards (CSS does the stacking; JS adds the covered card's recede)
     Plus the state layer this page needs:
       observeState()   mirrors the app's own state changes as a window event
                        'tcs:statechange' (detail: { scenario, year, metric, compare, filter }).
                        The app fires no outbound event, so this watches the one KPI node the
                        app rewrites on every update() with a MutationObserver. No proxy, no
                        edit to app.js, and always read after the app's render has committed.
       redrawCharts()   safety net for the chart draw-on: clears any stroke-dash styles a draw
                        left paused if it was interrupted (a re-render normally restarts it
                        from CSS on its own — charts.css runs --dur-2 on --ease-out).
       popSettle()      THE RE-SET (DIRECTION §b): every figure that changed slides the 0.62em
                        into its clipped window once, on one clock, inside --dur-2. The block
                        never moves; nothing around it reflows.
       count-up         [data-count] blocks count on first entry; re-runs with the re-set.
                        Tabular figures and a reserved width: digits change, the box does not.
       prefs            honours a page-level override (`<html data-motion>` flipped by a control):
                        a live 'motionchange' rebuilds the whole motion layer.
     Usage
       <script type="module">
         import { init } from './motion-core.js';
         const motion = init();            // or init({ smoothScroll: false, pinMinWidth: '64em' })
       </script>
     Markup contracts are in motion-core.css.
   Options (init)
     root          Document|Element  scope for data-* lookups (default document)
     smoothScroll  boolean  Lenis on wheel input; touch stays native (syncTouch: false). Default true
     lenis         object   extra Lenis options, merged over { lerp: 0.1, anchors: true, stopInertiaOnNavigate: true,
                            respectReducedMotion: true }. Pass lerp OR duration, never both
     intro, reveals, parallax, marquee, pin, stack, state, counters   booleans, each default true
     pinMinWidth   CSS length. Below it data-pin stays a vertical stack. Default '60em'
     revealStart   ScrollTrigger start for reveals. Default 'top bottom' (the first pixel entering)
     introFailsafe ms after which a starved intro is forced to its end state. Default 3500
     introMaxStart ms since navigation start. If the module boots later than this, the intro is shown
                   at rest instead of animated. Measured: the heading's LCP entry lands when the intro
                   ENDS (SplitText's revert paints the full text node), i.e. boot + ~1.3s, so a late boot
                   would push LCP past 2.5s. Default 800 (worst case LCP ~2.1s). Infinity disables it
     stateProbe    selector whose textContent changes with every app state change, observed to raise
                   'tcs:statechange'. Default '[data-kpi-value="revenue"], #heroValue'
   Exports
     init(options) -> api { gsap, ScrollTrigger, SplitText, lenis (getter), refresh(), scrollTo(target, opts),
                            destroy(), redraw() }   -- redraw() is redrawCharts()
     destroy(), registerReveal(name, fn), getLenis(), redrawCharts(scope), counterSweep(scope)
   Window events
     'motionchange'    (detail: 'full'|'reduce') fires when the effective motion setting flips,
                       so WebGL, video and other recipes can follow it.
     'tcs:statechange' (detail: { scenario, year, metric, compare, filter }) fires once per app state
                       change. The re-set, the counter re-run and the redraw safety net hang off it.
   Fallback behaviour
     - HTML+CSS render every element at rest. JS sets a hidden start state only in the
       frame its animation starts, only inside gsap.matchMedia('(prefers-reduced-motion:
       no-preference)'), and never on an element already on screen at boot. The one
       exception is the intro, which the CSS deadline protects.
     - If a CDN import fails, this module never runs: nothing was hidden, the CSS
       deadline releases the intro, the marquee stays a static wrapped row, the pin
       section stays a vertical stack, and sticky cards still stack. If only Lenis
       fails, native scroll is kept. Charts, KPIs and the ledger are data-driven by the
       app's own scripts and are unaffected.
     - The chart draw-on nested inside a reveal is a child timeline of that reveal, so a
       reduced-motion flip mid-reveal reverts it with its parent; nothing stays paused
       mid-draw.
     - Reduced motion (OS setting) reverts everything live: Lenis destroyed, split text
       restored, pins removed, scrub scenes cleared, marquee static (the button hides
       with it), counters jump straight to their final numbers.
   Tested against
     gsap 3.15.0 and lenis 1.3.26 from cdn.jsdelivr.net (+esm builds via the import map
     in index.html). Chromium/Edge 145 headless over CDP: no-JS, reduced motion, full
     motion at 1440x900 and 390x844, blocked CDN, and the case/year switch path.
   ========================================================================== */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

const Q_FULL = '(prefers-reduced-motion: no-preference)';
const Q_REDUCE = '(prefers-reduced-motion: reduce)';
const INTERACTIVE = 'a, button, input, select, textarea, summary, [tabindex], [contenteditable]';
// clearProps at rest: GSAP writes inline translate/rotate/scale: none next to its transform, which would
// otherwise keep overriding author CSS (e.g. a :hover translate) after the motion has finished.
const REST = 'transform,translate,rotate,scale';

const DEFAULTS = {
  root: document,
  smoothScroll: true,
  lenis: {},
  intro: true,
  reveals: true,
  parallax: true,
  marquee: true,
  pin: true,
  stack: true,
  state: true,
  counters: true,
  pinMinWidth: '60em',
  revealStart: 'top bottom',
  introFailsafe: 3500,
  introMaxStart: 800,
  stateProbe: '[data-kpi-value="revenue"], #heroValue',
};

// Token name -> fallback, used when tokens.css is absent.
// Each ease is registered as CustomEase 'motion<Key>' so JS and CSS share one family.
// design/DIRECTION.md §f: ONE family, decelerate, led by --ease-reveal. --ease-spring is
// banned site-wide (an overshoot is the slop tell) and is deliberately not registered here.
const EASES = {
  Reveal: ['--ease-reveal', '.22,1,.36,1'],        // every entrance and every numeral travel
  Out: ['--ease-out', '.16,1,.3,1'],               // chart draw-on, bar scale-in only
  Micro: ['--ease-micro', '.33,1,.68,1'],          // hover/focus colour, 1px state changes
  OutQuart: ['--ease-out-quart', '.25,1,.5,1'],    // marquee pause/resume, ledger row fill
  InOutSine: ['--ease-in-out-sine', '.37,0,.63,1'],// the one ambient loop (scroll cue)
  InOut: ['--ease-in-out', '.76,0,.24,1'],         // RESERVED: the year rail's indicator
};
// Duration ladder. tokens.css carries 80/200/380/560/900/1200ms; the house caps
// (hero 1400ms, one line 1000ms, reveal 600ms, stagger spread 600ms) are literals here.
// §f caps EVERY interactive state change at --dur-2 (380ms) and nothing at --dur-5 (1200ms).
const SCALARS = {
  dur0: ['--dur-0', 0.08], dur1: ['--dur-1', 0.2], dur2: ['--dur-2', 0.38],
  dur3: ['--dur-3', 0.56], dur4: ['--dur-4', 0.9], dur5: ['--dur-5', 1.2],
  dur6: 1.4,                 // hero intro cap
  settle: 0.6,               // one y-settle / one masked line
  rowStagger: 0.085,         // item rows: 60-90ms, never more
  lineStagger: 0.08,
  staggerMax: 0.6,           // total spread cap
  stateSwap: 0.38,           // §f: an interactive state change never exceeds --dur-2
  countUp: 0.38,
};

let S = null;          // live state: { o, mm, lenis, offs, running }
let FAMILY = null;     // custom eases registered once: the re-set's exchange and inhale

/* ---------- public API ---------------------------------------------------- */

export function init(options = {}) {
  if (S) destroy();
  S = { o: { ...DEFAULTS, ...options }, mm: null, lenis: null, offs: [], running: new Set() };
  ScrollTrigger.config({ ignoreMobileResize: true }); // iOS toolbar show/hide must not re-measure

  syncFlag(false);
  const os = matchMedia(Q_REDUCE);
  const onOS = () => syncFlag(true);
  os.addEventListener('change', onOS);
  S.offs.push(() => os.removeEventListener('change', onOS));
  // No on-page motion control: scene motion follows the OS accessibility preference.
  build();

  // Fonts and late images move trigger positions: re-measure once they settle.
  const refresh = () => S && ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh);
  if (document.readyState !== 'complete') {
    addEventListener('load', refresh, { once: true });
    S.offs.push(() => removeEventListener('load', refresh));
  }
  // Print or "save as PDF" mid-reveal: jump running reveals to their end state.
  const finish = () => S?.running.forEach((a) => a.progress?.(1));
  addEventListener('beforeprint', finish);
  S.offs.push(() => removeEventListener('beforeprint', finish));

  return {
    gsap, ScrollTrigger, SplitText,
    get lenis() { return S?.lenis ?? null; },
    refresh: () => ScrollTrigger.refresh(),
    scrollTo,
    destroy,
    redraw: redrawCharts,
  };
}

export function destroy() {
  if (!S) return;
  S.mm?.revert();
  S.offs.forEach((off) => off && off());
  S = null;
}

export const getLenis = () => S?.lenis ?? null;

/** Add a reveal type. fn(el, tokens) runs when el first enters; it must create its hidden
 *  start state and start animating in the same call, and return the animation. */
export function registerReveal(name, fn) { REVEALS.set(name, fn); }

function scrollTo(target, opts = {}) {
  if (S?.lenis) return S.lenis.scrollTo(target, opts);
  const y = typeof target === 'number' ? target
    : (typeof target === 'string' ? document.querySelector(target) : target)?.getBoundingClientRect().top + scrollY;
  if (Number.isFinite(y)) window.scrollTo({ top: y + (opts.offset || 0), behavior: opts.immediate ? 'instant' : 'auto' });
}

/* ---------- OS motion flag ------------------------------------------------ */

const osReduces = () => matchMedia(Q_REDUCE).matches;
const allowed = () => !osReduces();

// Mirrors the boot script: data-motion="full|reduce" (+ .motion-ok alias) on <html>.
function syncFlag(announce) {
  const root = document.documentElement;
  const next = allowed() ? 'full' : 'reduce';
  const changed = root.dataset.motion !== next;
  root.dataset.motion = next;
  root.classList.toggle('motion-ok', next === 'full');
  if (changed && announce) dispatchEvent(new CustomEvent('motionchange', { detail: next }));
}

/* ---------- build: timeline motion lives inside gsap.matchMedia ------------ */

function build() {
  const { o } = S;
  const mm = (S.mm = gsap.matchMedia());

  // Pins first: their spacing must exist before triggers further down are measured.
  if (o.pin) mm.add(`${Q_FULL} and (min-width: ${o.pinMinWidth})`, () => (allowed() ? setupPins() : undefined));

  mm.add(Q_FULL, (ctx) => {
    if (!allowed()) { ownIntro(); return; }
    const T = readTokens();
    const offs = [];
    if (o.smoothScroll) offs.push(startLenis());
    if (o.intro) offs.push(setupIntro(T)); else ownIntro();
    if (o.reveals) setupReveals(ctx, T);
    if (o.parallax) setupParallax(ctx, T);
    if (o.marquee) offs.push(setupMarquees());
    if (o.stack) offs.push(setupStack());
    return () => { offs.forEach((off) => off && off()); S?.running.clear(); };
  });

  // Reduced motion: nothing to set up. Content is already at rest. Release a stray intro arm.
  mm.add(Q_REDUCE, () => {
    ownIntro();
    // The marquee button is a JS-only control: with no loop to pause it must not be offered.
    document.querySelectorAll('[data-marquee-toggle]').forEach((b) => { b.hidden = true; });
  });

  // The state layer runs under reduced motion too: it is a state change, not a movement,
  // so the redraw still happens and the counters simply write their final value at once.
  if (o.state) setupState();
  if (o.counters) setupCounters();
}

function readTokens() {
  if (!FAMILY) {
    const cs = getComputedStyle(document.documentElement);
    for (const [key, [prop, fallback]] of Object.entries(EASES)) {
      const m = cs.getPropertyValue(prop).match(/cubic-bezier\(([^)]+)\)/);
      CustomEase.create('motion' + key, m ? m[1].replace(/\s+/g, '') : fallback);
    }
    // design/DIRECTION.md §f: ONE family and no second clock. The re-set's "old figure
    // leaves, new figure arrives" both run on --ease-reveal; there is no separate
    // acceleration curve anywhere on the page.
    FAMILY = { set: 'motionReveal' };
  }
  const cs = getComputedStyle(document.documentElement);
  const T = {};
  for (const [key, spec] of Object.entries(SCALARS)) {
    if (typeof spec === 'number') { T[key] = spec; continue; }
    const [prop, fallback] = spec;
    const raw = cs.getPropertyValue(prop).trim();
    const n = parseFloat(raw);
    T[key] = Number.isFinite(n) ? (raw.endsWith('ms') ? n / 1000 : n) : fallback;
  }
  return T;
}

/* ---------- smooth scroll -------------------------------------------------- */

function startLenis() {
  let lenis = null;
  let live = true;
  const raf = (time) => lenis?.raf(time * 1000); // GSAP ticker seconds -> Lenis ms: one rAF loop
  import('lenis')
    .then(({ default: Lenis }) => {
      if (!live || !S) return;
      lenis = S.lenis = new Lenis({
        lerp: 0.1,                   // 0.08-0.12. Lower feels floaty. Never pass duration as well
        smoothWheel: true,
        syncTouch: false,            // touch keeps native momentum
        anchors: true,               // in-page #links scroll through Lenis, honouring scroll-margin/padding.
                                     // 1.3.26 does not preventDefault, so the hash and focus start point stay native
        stopInertiaOnNavigate: true,
        autoRaf: false,
        respectReducedMotion: true,  // 1.3.26 default, explicit: lerp 1 + instant scrollTo under reduce.
                                     // Belt and braces: this code never creates Lenis under reduce anyway.
        ...S.o.lenis,
      });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);  // no catch-up jumps against the smoothed scroll
    })
    .catch((err) => console.warn('[motion-core] Lenis did not load; keeping native scroll.', err));
  return () => {
    live = false;
    gsap.ticker.remove(raf);
    gsap.ticker.lagSmoothing(500, 33); // GSAP defaults
    lenis?.destroy();
    if (S) S.lenis = null;
  };
}

/* ---------- intro (above the fold, guarded by the CSS deadline) ------------ */

const ownIntro = () => document.documentElement.setAttribute('data-intro-owned', '');
const splittable = (el) => /^H[1-6]$/.test(el.tagName) && !el.querySelector(INTERACTIVE);

function setupIntro(T) {
  const heading = document.querySelector('[data-intro]');
  const items = gsap.utils.toArray('[data-intro-item]');
  const media = gsap.utils.toArray('[data-intro-media]');
  const all = [heading, ...items, ...media].filter(Boolean);
  if (!all.length) return;
  const root = document.documentElement;
  // Only animate content the CSS deadline is still holding. Once the deadline has fired (or the
  // snippet is missing) the content is on screen and must not be hidden again.
  const armed = all.every((el) => el.getAnimations().some(
    (a) => a.animationName?.startsWith('intro-deadline') && a.playState !== 'finished'));
  if (root.hasAttribute('data-intro-owned') || !armed) { ownIntro(); return; }
  // LCP budget: a late boot shows the intro at rest now rather than finishing it ~1.3s later.
  if (performance.now() > S.o.introMaxStart) { ownIntro(); return; }

  // Read the CSS arm's offsets first so the JS start state matches it exactly.
  const shifts = items.map((el) => parseFloat(getComputedStyle(el).translate.split(' ')[1]) || 0);
  const scales = media.map((el) => parseFloat(getComputedStyle(el).scale) || 1);
  // Release the CSS arm BEFORE creating any tween. GSAP 3.12+ folds the CSS individual transform
  // properties (translate, scale) into its transform cache, so a from() created while the arm is
  // still applied records the ARMED offset as its end state: it would tween 16px -> 16px and leave
  // the item low (and a later revert would restore the armed look). Everything below runs in this
  // same task, so no frame is painted between un-arming and the JS start states: no flash.
  root.setAttribute('data-intro-owned', '');
  let headTween = null;
  const tweens = [];
  const tl = gsap.timeline();

  if (heading && splittable(heading)) {
    // Every line rises inside its mask between 0 and 0.4s and lands by 1.16s: inside the
    // 1400ms intro budget and well inside the CSS deadline that guards it.
    SplitText.create(heading, {
      type: 'lines', mask: 'lines', linesClass: 'rv-line', aria: 'auto', autoSplit: true,
      onSplit: (self) => {
        headTween = gsap.fromTo(self.lines, { yPercent: 118 }, {
          yPercent: 0, duration: 0.78, ease: 'motionReveal', stagger: T.lineStagger,
          onComplete: () => self.revert(), // restore the original DOM (a11y, find-in-page, text spacing)
        });
        tl.add(headTween, 0);
        return headTween;
      },
    });
    tweens.push({ progress: (p) => headTween?.progress(p) });
  } else if (heading) {
    tweens.push(gsap.fromTo(heading, { clipPath: 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'motionReveal', clearProps: 'clipPath' }));
    tl.add(tweens[tweens.length - 1], 0);
  }
  if (items.length) {
    const t = gsap.from(items, {
      y: (i) => shifts[i], duration: 0.62, ease: 'motionReveal',
      stagger: 0.08, clearProps: REST,
    });
    tweens.push(t); tl.add(t, 0.14);
  }
  if (media.length) {
    // The data panel un-clips from a partial inset while its contents settle from 1.045.
    const panel = media[0];
    const t = gsap.fromTo(panel,
      { clipPath: 'inset(0% 0% 16% 0%)', scale: scales[0] || 1.02 },
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.16, ease: 'motionReveal', clearProps: 'clipPath,' + REST });
    tweens.push(t); tl.add(t, 0.1);
  }

  // A background tab can starve the ticker. Force the end state rather than leave text clipped.
  const timer = setTimeout(() => {
    tweens.forEach((t) => t?.progress?.(1));
    gsap.globalTimeline.getChildren().forEach((t) => { if (tl === t) t.progress(1); });
  }, S.o.introFailsafe);
  return () => clearTimeout(timer);
}

/* ---------- reveal registry ------------------------------------------------ */

const REVEALS = new Map([
  ['lines', revealLines],
  ['image', revealImage],
  ['settle', revealSettle],
  ['pop', revealPop],
  ['items', revealItems],
  ['scrub', revealScrub],
]);

function track(anim) {
  if (!anim || !S) return anim;
  S.running.add(anim);
  const done = () => S?.running.delete(anim);
  if (typeof anim.then === 'function') anim.then(done, done);
  else anim.eventCallback?.('onComplete', done);
  return anim;
}

function setupReveals(ctx, T) {
  gsap.utils.toArray('[data-reveal]', S.o.root).forEach((el) => {
    const run = REVEALS.get(el.dataset.reveal || 'settle');
    if (!run) { console.warn('[motion-core] unknown data-reveal:', el.dataset.reveal, el); return; }
    if (el.closest('[data-pin], [data-intro]')) return;     // pinned tracks and the intro have their own motion
    if (el.getBoundingClientRect().top < innerHeight) return; // on screen (or above) at boot: never hide it
    ScrollTrigger.create({
      trigger: el,
      start: el.dataset.revealStart || S.o.revealStart,
      once: true,
      // Lazy arming: the hidden start state is created here, in the frame the animation starts.
      // If this never fires, the element simply stays visible.
      onEnter: (self) => {
        // Anchor jumps, scroll restoration and hard flings land far past the start with the
        // content already in view: leave it as it is instead of hiding it for a replay.
        if (self.scroll() - self.start > innerHeight * 0.5 || Math.abs(self.getVelocity()) > 3000) return;
        ctx.add(() => track(run(el, T)));
      },
    });
  });
}

function revealLines(el, T) {
  // SplitText's aria:'auto' puts aria-label on the element, which ARIA 1.2 forbids on
  // generic/paragraph roles. So only split headings without interactive children.
  if (!splittable(el)) return revealSettle(el, T);
  const tl = gsap.timeline();
  SplitText.create(el, {
    type: 'lines', mask: 'lines', linesClass: 'rv-line', aria: 'auto', autoSplit: true,
    onSplit: (self) => {
      const rise = gsap.from(self.lines, {
        yPercent: 115, duration: T.settle, ease: 'motionReveal', stagger: T.lineStagger,
        onComplete: () => self.revert(),
      });
      tl.add(rise);
    },
  });
  armDrawOn(el, tl, 0.1); // a chart that lives under this heading draws in as the heading lands
  return tl;
}

function revealImage(el, T) {
  const media = el.querySelector('img, video, canvas, picture, svg');
  const tl = gsap.timeline();
  // Both ends are inset(): GSAP cannot interpolate from `none`. The start is only partly
  // clipped, so a frozen frame still shows the image.
  tl.fromTo(el, { clipPath: 'inset(14% 10% 14% 10%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: T.dur5, ease: 'motionReveal', clearProps: 'clipPath' }, 0);
  if (media && !media.hasAttribute('data-parallax')) // parallax owns that media's transform
    tl.fromTo(media, { scale: 1.18 }, { scale: 1, duration: T.dur5, ease: 'motionReveal', clearProps: REST }, 0);
  return tl;
}

// y plus a small scale step: the content arrives, rather than merely appearing.
function revealSettle(el, T) {
  return gsap.from(el, { y: 26, duration: T.settle, ease: 'motionReveal', clearProps: REST });
}

function revealPop(el, T) {
  return gsap.from(el, {
    y: 22, scale: 0.965, duration: T.settle, ease: 'motionReveal', clearProps: REST,
  });
}

const MEDIA = 'img, video, canvas, picture';

function revealItems(el, T) {
  const kids = [...el.children];
  const each = Math.min(T.rowStagger, T.staggerMax / Math.max(1, kids.length - 1));
  const tl = gsap.timeline();
  tl.from(kids, {
    y: 26, duration: T.settle, ease: 'motionReveal', clearProps: REST,
    stagger: { each, grid: 'auto', from: 'start' }, // reading order, row by row
  }, 0);
  kids.forEach((kid, i) => armDrawOn(kid, tl, Math.min(0.45, 0.06 + i * each)));
  return tl;
}
/* ---------- parallax and the scrubbed scene -------------------------------- */

function setupParallax(ctx, T) {
  gsap.utils.toArray('[data-parallax]', S.o.root).forEach((el) => {
    if (el.closest('[data-pin], [data-reveal="scrub"]')) return; // the scrub scene owns its own children
    const v = gsap.utils.clamp(-0.5, 0.5, parseFloat(el.dataset.parallax) || 0);
    if (!v) return;
    const isMedia = el.matches(MEDIA);
    const frame = isMedia ? el.parentElement : el;
    // A masked frame reveals by un-clipping the box while the image inside is already
    // over-scaled, so the edge of the plate never shows during the settle.
    if (el.dataset.parallax.includes('mask') && frame) frame.style.overflow = 'clip';
    const travel = () => v * innerHeight;
    const extra = isMedia ? { scale: () => 1 + Math.abs(travel()) / Math.max(1, frame.offsetHeight) } : {};
    ctx.add(() => {
      const t = gsap.fromTo(el, { y: () => -travel() / 2, ...extra }, {
        y: () => travel() / 2, ...extra, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      });
      return () => { t.scrollTrigger?.kill(); t.kill(); gsap.set(el, { clearProps: REST }); };
    });
  });
}

// One scrubbed scene, built from a single timeline so every layer shares one progress
// value. Scrub values are linear (ease "none"): text never scrubs out of legibility and
// no layer travels more than ~20% of the viewport at a time.
function revealScrub(el, T) {
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
  });
  const cases = [...el.querySelectorAll('[data-scrub="case"]')];
  const plates = [...el.querySelectorAll('[data-scrub="plate"]')];
  const rules = [...el.querySelectorAll('[data-scrub="rule"]')];
  const glyphs = [...el.querySelectorAll('[data-scrub="glyph"]')];

  // The three case cards travel to their place: the centre card holds, its siblings
  // come in from either side and sit back a step. transform only.
  cases.forEach((card, i) => {
    const mid = (cases.length - 1) / 2;
    const d = i - mid;                      // -1, 0, +1
    tl.fromTo(card,
      { x: () => d * Math.min(120, innerWidth * 0.09), scale: 0.94, opacity: 0.55 },
      { x: 0, scale: 1 - Math.abs(d) * 0.035, opacity: 1, duration: 0.55 }, 0);
  });
  // The plate above the cards leads them by a touch: a small counter-travel.
  plates.forEach((p, i) => {
    tl.fromTo(p, { y: () => 0.11 * innerHeight * (i % 2 ? -1 : 1) }, { y: 0, duration: 0.7 }, 0);
  });
  // Chapter hairline rules draw in from their start edge (scaleX, never width).
  rules.forEach((r) => {
    tl.fromTo(r, { scaleX: 0 }, { scaleX: 1, duration: 0.3, transformOrigin: '0% 50%' }, 0.05);
  });
  // The oversized chapter glyph rises a little more slowly than its frame: depth, not distance.
  glyphs.forEach((g) => {
    tl.fromTo(g, { yPercent: 14 }, { yPercent: -6, duration: 1 }, 0);
  });
  return tl;
}

/* ---------- marquee (CSS core, velocity boost, pause control) --------------- */

function setupMarquees() {
  const list = gsap.utils.toArray('[data-marquee]', S.o.root).map(liveMarquee).filter(Boolean);
  if (!list.length) return;
  let boost = 0;
  // Page-wide trigger for scroll velocity in px/s, with or without Lenis.
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => { boost = Math.max(boost, Math.min(3, Math.abs(self.getVelocity()) / 1000)); },
  });
  const tick = () => {
    boost *= Math.pow(0.92, gsap.ticker.deltaRatio()); // frame-rate independent decay
    const rate = 1 + boost;
    list.forEach((m) => {
      if (m.boost && m.anim && Math.abs(m.anim.playbackRate - rate) > 0.01) m.anim.updatePlaybackRate(rate);
    });
  };
  gsap.ticker.add(tick);
  return () => { gsap.ticker.remove(tick); list.forEach((m) => m.off()); };
}

function liveMarquee(m) {
  const track = m.querySelector('[data-marquee-track]');
  const group = track?.querySelector('[data-marquee-group]');
  if (!group) return null;
  // One authored copy in HTML. The loop duplicate is JS-only, hidden from AT and focus.
  const clone = group.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  clone.inert = true;
  [clone, ...clone.querySelectorAll('[id]')].forEach((n) => n.removeAttribute('id'));
  track.append(clone);
  const speed = parseFloat(m.dataset.marqueeSpeed) || 60; // px/s
  const setDuration = () => m.style.setProperty('--marquee-duration', (group.offsetWidth / speed).toFixed(2) + 's');
  setDuration();
  const ro = new ResizeObserver(setDuration);
  ro.observe(group);
  m.classList.add('is-live');
  // The one-time arrival of the loop (motion-core.css). Removed after its own duration so the
  // band never carries two animations into a later state.
  m.classList.add('is-marquee-set');
  setTimeout(() => m.classList.remove('is-marquee-set'), 1400);
  const anim = track.getAnimations().find((a) => a.animationName === 'marquee') || null;
  const btn = m.querySelector('[data-marquee-toggle]');
  if (btn) {
    btn.hidden = false;
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Pause the ticker');
  }
  // The button is the WCAG 2.2.2 control (hover-pause alone fails keyboard and touch).
  // It drives the CSS core through .is-paused, labelled by its own aria-pressed state.
  const onClick = () => {
    const paused = m.classList.toggle('is-paused');
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(paused));
    btn.textContent = paused ? 'Play ticker' : 'Pause ticker';
    btn.setAttribute('aria-label', paused ? 'Resume the ticker' : 'Pause the ticker');
  };
  btn?.addEventListener('click', onClick);
  return {
    anim,
    boost: m.dataset.marqueeBoost !== 'false',
    off() {
      ro.disconnect();
      clone.remove();
      m.classList.remove('is-live', 'is-paused', 'is-marquee-set');
      m.style.removeProperty('--marquee-duration');
      if (btn) {
        btn.hidden = true; btn.setAttribute('aria-pressed', 'false');
        btn.textContent = 'Pause ticker';
        btn.removeEventListener('click', onClick);
      }
    },
  };
}

/* ---------- pinned horizontal section --------------------------------------- */

function setupPins() {
  const offs = [];
  gsap.utils.toArray('[data-pin="horizontal"]', S.o.root).forEach((section) => {
    const track = section.querySelector('[data-pin-track]');
    if (!track) return;
    section.classList.add('is-pinned'); // CSS switches the vertical stack to a horizontal row
    const distance = () => Math.max(0, track.scrollWidth - section.clientWidth);
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none', // required: children use it as containerAnimation
      scrollTrigger: {
        trigger: section, start: 'top top', end: () => '+=' + distance(),
        pin: true, scrub: true, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1,
      },
    });
    // Pins longer than ~1.5 viewports read as scroll-jacking (motion-stack.md 4.5, 6.1).
    if (distance() > innerHeight * 1.5) {
      console.warn(`[motion-core] data-pin track needs ${Math.round((distance() / innerHeight) * 100)}vh of scroll; keep it near 150vh (fewer or narrower panels).`, section);
    }
    track.querySelectorAll('[data-pin-media]').forEach((media) => {
      gsap.fromTo(media, { scale: 1.12 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: media.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
      });
    });
    // Keyboard: tabbing into an off-screen panel scrolls the page to the scroll position that shows it.
    const onFocus = (e) => {
      const panel = e.target.closest('[data-pin-panel]');
      const st = tween.scrollTrigger;
      if (!panel || !st) return;
      const d = distance();
      const x = gsap.utils.clamp(0, d, panel.offsetLeft - (section.clientWidth - panel.offsetWidth) / 2);
      scrollTo(st.start + (d ? (x / d) * (st.end - st.start) : 0), { immediate: true, force: true });
    };
    track.addEventListener('focusin', onFocus);
    offs.push(() => {
      track.removeEventListener('focusin', onFocus);
      section.classList.remove('is-pinned');
      // Context.revert kills the ScrollTrigger AFTER reverting the tween, and the kill re-renders the tween
      // at progress 0, leaving an identity transform + translate: none inline. Cleanup functions run last.
      gsap.set(track, { clearProps: REST });
    });
  });
  ScrollTrigger.sort();
  return () => offs.forEach((off) => off());
}

/* ---------- sticky stacking cards ------------------------------------------- */

function setupStack() {
  const offs = [];
  gsap.utils.toArray('[data-stack]', S.o.root).forEach((stack) => {
    const cards = [...stack.children];
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      // Overlay opacity composites; animating filter: brightness() would repaint every frame.
      const shade = document.createElement('span');
      shade.className = 'stack-shade';
      shade.setAttribute('aria-hidden', 'true');
      card.append(shade);
      offs.push(() => shade.remove());
      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: next, start: 'top bottom',
          end: () => `top ${parseFloat(getComputedStyle(next).top) || 0}px`, // where `next` sticks
          scrub: true, invalidateOnRefresh: true,
        },
      })
        .to(card, { scale: 0.94 }, 0)
        .to(shade, { opacity: 0.35 }, 0);
    });
  });
  return () => offs.forEach((off) => off());
}


/* ---------- state layer: observe, redraw, count, settle ---------------------
   The app (assets/app.js) fires no outbound event on a selection: every control goes
   through one update() that rewrites the KPI and hero values and then calls the chart
   kit synchronously. So this file does not need app.js to change. It observes the one
   node the app rewrites on every update, raises its own window event from that, and
   hangs the redraw, the count-up and the settle off the event. Downstream of a
   MutationObserver, it always reads the app's finished render, never a half-written DOM. */

const STATE_EVENT = 'tcs:statechange';

// Clear the paused inline styles the chart kit leaves behind (charts.js / charts2.js set
// stroke-dashoffset + `animation: none` and read layout before adding their CSS transition,
// which parks every draw-on at zero progress). Removing them is what releases the
// animation those files authored; a CSS re-render then replays it. This is not an edit to
// their contract — it only clears styles nothing else reads.
const DRAW_STYLE = ['transition', 'stroke-dasharray', 'stroke-dashoffset'];
const BAR_STYLE = ['animation', 'animation-delay'];

function resyncCharts(scope = document) {
  if (!scope) return { paths: 0, bars: 0 };
  const paths = scope.matches?.('path.draw') ? [scope] : [...scope.querySelectorAll('path.draw')];
  const bars = scope.matches?.('.chart-bar') ? [scope] : [...scope.querySelectorAll('.chart-bar')];
  paths.forEach((p) => DRAW_STYLE.forEach((k) => p.style.removeProperty(k)));
  bars.forEach((b) => BAR_STYLE.forEach((k) => b.style.removeProperty(k)));
  return { paths: paths.length, bars: bars.length };
}

// The chart draw-on nested inside a reveal (data-reveal="lines|items" on a panel that holds a
// chart). The kit drew the SVG after the page loaded, so its draw-on sits paused at zero
// until something plays it. Releasing the styles starts the animation the kit authored;
// the parent timeline only paces it so it lands after the panel does.
function armDrawOn(scope, tl, at = 0) {
  const paths = [...(scope.matches?.('path.draw') ? [scope] : scope.querySelectorAll('path.draw'))];
  const bars = [...(scope.matches?.('.chart-bar') ? [scope] : scope.querySelectorAll('.chart-bar'))];
  if (!paths.length && !bars.length) return 0;
  paths.forEach((p) => DRAW_STYLE.forEach((k) => p.style.removeProperty(k)));
  bars.forEach((b) => BAR_STYLE.forEach((k) => b.style.removeProperty(k)));
  if (tl) tl.to({}, { duration: 0.06 }, at);
  return Math.max(paths.length, bars.length);
}

// [data-count] counters: one IntersectionObserver, count once on entry, final value under
// reduced motion, reserved tabular width so the digits change without the box moving.
// The count starts from 0, not from the node's current text: the markup ships the final
// number (so no-JS is correct), and app-core's writer short-circuits when the value it is
// asked for already equals the text. Zeroing the datum first is what makes it count; the
// markup value is still what a no-JS visitor sees, since this only runs in onEnter.
export function counterSweep(scopeEl = document) {
  const nodes = scopeEl.matches?.('[data-count]') ? [scopeEl] : [...scopeEl.querySelectorAll('[data-count]')];
  const T = S ? readTokens() : SCALARS;
  const write = window.TCSApp?.animateNumber; // one number renderer on the page, reused
  nodes.forEach((node) => {
    const target = Number(node.dataset.count);
    if (!Number.isFinite(target)) return;
    node.style.setProperty('--count-ch', String(String(target).length));
    if (!allowed()) { node.textContent = String(target); return; }
    // app-core reads `data-value` as the "previous" number when the text is not numeric.
    node.dataset.value = '0';
    node.textContent = '0';
    if (!write) {
      const proxy = { v: 0 };
      gsap.to(proxy, {
        v: target, duration: T.countUp ?? 0.38, ease: FAMILY.set,
        onUpdate() { node.textContent = String(Math.round(proxy.v)); },
        onComplete() { node.textContent = String(target); },
      });
      return;
    }
    write(node, target, 0, (T.countUp ?? 0.38) * 1000);
  });
}

function setupCounters() {
  // A counter can be triggered by its own block ([data-count-block]) or by any reveal /
  // list container that holds it. The page's markup marks the container with
  // data-reveal="items", not data-count-block, so the fallback below is the normal path
  // here — a counter must never simply sit at its static value because a hook is absent.
  const nodes = gsap.utils.toArray('[data-count]', S.o.root);
  if (!nodes.length) return;
  if (!allowed()) { counterSweep(document); return; }
  const targets = new Map(); // container -> nodes
  nodes.forEach((node) => {
    const host = node.closest('[data-count-block], [data-reveal], section, .evidence-band') || document.body;
    if (!targets.has(host)) targets.set(host, []);
    targets.get(host).push(node);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      (targets.get(e.target) || []).forEach((n) => counterSweep(n));
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  targets.forEach((group, host) => io.observe(host));
  // Anything already on screen at boot counts at once (short viewport, anchor jump).
  targets.forEach((group) => {
    if (group[0].getBoundingClientRect().top < innerHeight) group.forEach((n) => counterSweep(n));
  });
  S.offs.push(() => io.disconnect());
}

// The in-place reaction to a state change. The old readout leaves upward and the new one
// arrives, both inside the 1.25em window motion-core.css clips; a tonal flash marks the
// change. The block itself never moves: the hover rule, applied to state.
const POP_SEL = [
  '[data-kpi-value]', '#heroValue', '[data-case-value]', '#contextVsActual',
  '#spreadTitle', '#heroDelta', '#trendForecast', '#trendLatest',
].join(', ');

// THE RE-SET (design/DIRECTION.md §b, §f, §g). A selection re-sets every figure on the
// page to its whole new value. The app has already written the new text by the time this
// runs, so this does not fade the number in: it moves the readout that just changed, once,
// from below into place inside the window motion-core.css clips. A class swap starts it
// (and a forced reflow restarts it mid-change); the class is dropped after --dur-2, so the
// node returns to its resting state. Nothing moves position: the block is the same box,
// only its inside translates, which is why nothing around it reflows.
const RESET_CLASS = 'is-reset';
let resetTimer = 0;

function popSettle(scope = document) {
  if (!S) return null;
  const targets = scope.matches?.(POP_SEL) ? [scope] : [...scope.querySelectorAll(POP_SEL)];
  if (!targets.length) return null;
  clearTimeout(resetTimer);
  if (!allowed()) {
    // Reduced motion: the value is already final and nothing should move. Drop any window
    // transform a live flip may have left mid-swap.
    targets.forEach((n) => n.classList.remove(RESET_CLASS));
    return null;
  }
  const T = readTokens();
  const dur = Math.round(T.stateSwap * 0.76 * 1000);
  let longest = 0;
  targets.forEach((node, i) => {
    const delay = Math.min(90, i * 18);
    longest = Math.max(longest, delay + dur);
    node.classList.remove(RESET_CLASS);
    node.style.setProperty('--reset-delay', `${delay}ms`);
    node.style.setProperty('--reset-dur', `${dur}ms`);
  });
  // One layout read for the whole batch: commits the class removal, then the addition
  // below starts every transition from the same frame.
  void document.documentElement.offsetWidth;
  targets.forEach((node) => node.classList.add(RESET_CLASS));
  // The class is the start state for ONE clock: leaving it on would leave the figure parked
  // 0.62em low for good. Strip it after the longest leg (plus a frame), so the node returns
  // to its resting transform — and the last figure to land is not the one that sticks low.
  resetTimer = setTimeout(() => {
    targets.forEach((node) => {
      node.classList.remove(RESET_CLASS);
      node.style.removeProperty('--reset-delay');
      node.style.removeProperty('--reset-dur');
    });
  }, longest + 40);
  return null;
}

function setupState() {
  const App = window.TCSApp;
  if (!App) return () => {}; // the app core did not load: nothing to observe
  const probes = [...document.querySelectorAll(S.o.stateProbe)];
  if (!probes.length) return () => {};
  let queued = false;
  let last = '';
  const snapshot = () => {
    const st = App.state || {};
    return JSON.stringify([st.scenario, st.year, st.trendMetric, st.compareMetric, st.tableFilter]);
  };
  const run = () => {
    queued = false;
    const snap = snapshot();
    if (snap === last) return;   // same state: a layout re-render, not a selection
    last = snap;
    const st = App.state || {};
    redrawCharts(document);
    dispatchEvent(new CustomEvent(STATE_EVENT, {
      detail: { scenario: st.scenario, year: st.year, metric: st.trendMetric, compare: st.compareMetric, filter: st.tableFilter },
    }));
    if (allowed()) popSettle(document);
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run); // after the app's synchronous render has committed
  };
  const mo = new MutationObserver(schedule);
  probes.forEach((p) => mo.observe(p, { childList: true, characterData: true, subtree: true }));
  last = snapshot();
  reserveWidths();       // before the first change, so no figure can widen its line
  const onResize = () => reserveWidths();
  addEventListener('resize', onResize);
  const off = () => { mo.disconnect(); removeEventListener('resize', onResize); };
  S.offs.push(off);
  return off;
}

/* Every value a re-setting figure is known to be able to show, measured once in its own
   font, and pinned as a min-width. Digits are tabular (motion-core.css), so the widest
   value is simply the most characters; this keeps a figure going from 9,999 to 2,67,021
   from reflowing the line it sits in (§e: "numbers are right-aligned in their own column,
   always"). Skips any node that is not laid out, and leaves the width alone under 0. */
function reserveWidths() {
  const D = window.TCS_DATA;
  const App = window.TCSApp;
  if (!D || !App?.state) return;
  const years = D.meta.years;
  const cases = Object.keys(D.scenarios);
  const rows = [
    ...D.historical,
    D.actual,
    ...cases.flatMap((c) => years.filter((y) => D.scenarios[c][y]).map((y) => D.scenarios[c][y])),
  ];
  const fmt = (v) => (v == null ? 0 : String(v));
  const maxOf = (values) => values.reduce((a, b) => (fmt(b).length > fmt(a).length ? b : a), 0);
  const plan = {
    '#heroValue': maxOf(rows.map((r) => r.revenue)),
    '[data-kpi-value]': maxOf(rows.flatMap((r) => [r.revenue, r.ebitda, r.pat, r.fcf])),
    '[data-case-value]': maxOf(rows.map((r) => r.revenue)),
  };
  const probe = document.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;top:0;white-space:nowrap;';
  document.body.appendChild(probe);
  gsap.utils.toArray(POP_SEL).forEach((node) => {
    // Only the figures that are not centred when they change need a reserve: a centred
    // readout keeps its centre, so it cannot push its neighbours. #heroValue is excluded
    // for the same reason (it is a full-width display line, not a column figure).
    if (node.matches('#heroValue, .case-value')) return;
    const key = Object.keys(plan).find((k) => node.matches(k));
    if (!key || !plan[key]) return;
    // A figure may show a percent where it usually shows crores: measure the widest of
    // the plan value and the node's current text, with the node's own computed font.
    const cs = getComputedStyle(node);
    probe.style.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily}`;
    probe.style.letterSpacing = cs.letterSpacing;
    probe.style.fontVariantNumeric = 'tabular-nums';
    // The formatter writes Indian grouping: measure that, not the raw digits.
    const n = Number(plan[key]);
    const candidate = Number.isFinite(n) && n > 0 && !/%|%$/.test(node.textContent)
      ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
      : node.textContent.trim();
    probe.textContent = candidate;
    const w = Math.ceil(probe.getBoundingClientRect().width);
    if (w > 0) node.style.setProperty('--re-set-w', `${w}px`);
  });
  probe.remove();
}

/** Replay the chart draw-on everywhere (or in one element). Safe to call any number of times. */
export function redrawCharts(scope = document) {
  return resyncCharts(scope);
}
