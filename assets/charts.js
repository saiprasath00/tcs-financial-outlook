/* ------------------------------------------------------------------
 TCS Financial Outlook — chart kit, part one
 SVG primitives, formatters, hero, runway, spread, sparklines.
 Hand-built. No charting library.
------------------------------------------------------------------- */

(() => {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const D = window.TCS_DATA;
  const CASES = ["Bear Case", "Base Case", "Bull Case"];
  const SHORT = { "Bear Case": "Bear", "Base Case": "Base", "Bull Case": "Bull" };

  const COLORS = {
    ink: "#f8f1e9",
    inkSoft: "#e2e8f6",
    slate: "#b8c3e2",
    muted: "#acb9df",
    paper: "#101c48",
    white: "#152355",
    line: "rgba(235,240,255,0.18)",
    lineStrong: "rgba(235,240,255,0.42)",
    blue: "#69b9ff",
    teal: "#5de5c6",
    violet: "#ffb279",
    amber: "#ffad66",
    rose: "#ff809a",
    lime: "#f5df78"
  };

  /* Case inks followcharts.css overrides these per field via
 the `data-field` attribute on each chart host; the values here are the
 dark-field defaults (midnight #080c26), where the runway, the case
 comparison and the scatter are drawn.
 Measured on #080c26: Base 10.16:1, Bull 8.21:1, Bear 11.44:1. */
  const CASE_COLOR = {
    "Bear Case": "#00e0c6",
    "Base Case": "#54c8ff",
    "Bull Case": "#ff8a3d"
  };

  const reduceMql = window.matchMedia("(prefers-reduced-motion: reduce)");
  /* Respect the system's reduced-motion preference without an on-page switch. */
  const reduceMotion = {
    get matches() {
      return document.documentElement.dataset.motion === "reduce" || reduceMql.matches;
    }
  };

  const fmtNum = (v, digits = 0) => {
    if (v == null || Number.isNaN(v)) return "—";
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(v);
  };

  const fmtCr = (v) => (v == null ? "—" : `₹${fmtNum(Math.round(v))} Cr`);
  const fmtEps = (v) => (v == null ? "—" : `₹${fmtNum(v, 2)}`);
  const fmtPct = (v, digits = 1) =>
    v == null || Number.isNaN(v) ? "—" : `${v >= 0 ? "+" : "−"}${fmtNum(Math.abs(v), digits)}%`;

  const fmtAxisMoney = (v) => {
    if (v === 0) return "0";
    if (Math.abs(v) >= 100000) return `₹${fmtNum(v / 100000, 1)}L`;
    if (Math.abs(v) >= 1000) return `₹${fmtNum(v / 1000, 0)}k`;
    return `₹${fmtNum(v, 0)}`;
  };

  const fmtShortMoney = (v) => {
    if (v == null) return "—";
    if (Math.abs(v) >= 100000) return `₹${fmtNum(v / 100000, 2)}L`;
    return `₹${fmtNum(Math.round(v))}`;
  };

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  function el(tag, attrs = {}, parent) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v != null) node.setAttribute(k, v);
    });
    if (parent) parent.appendChild(node);
    return node;
  }

  function text(parent, x, y, content, cls, extra = {}) {
    const t = el("text", { x, y, class: cls, ...extra }, parent);
    t.textContent = content;
    return t;
  }

  function makeSvg(wrap, W, H) {
    wrap.innerHTML = "";
    const svg = el("svg", {
      viewBox: `0 0 ${W} ${H}`,
      width: "100%",
      preserveAspectRatio: "xMidYMid meet",
      "aria-hidden": "true",
      focusable: "false"
    });
    wrap.appendChild(svg);
    return svg;
  }

  /* Charts are drawn at the width they are displayed at, so the viewBox scale
     is 1 and label type lands on its real size. A viewBox wider than the
     container is scaled down by the browser, which was shrinking every label
     to roughly 9.8px. */
  function frame(wrap, W, H) {
    const cw = wrap.clientWidth || W;
    const compact = cw < 560;
    if (compact) return { W: Math.round(cw), H: Math.round(H * 0.96), compact, fs: 12 };
    return { W: Math.round(cw), H, compact, fs: 11 };
  }

  function animatePaths(svg) {
    if (reduceMotion.matches) return;
    const paths = svg.querySelectorAll("path.draw");
    paths.forEach((p, i) => {
      let len = 0;
      try {
        len = p.getTotalLength();
      } catch (err) {
        len = 900;
      }
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.style.animation = "none";
      p.getBoundingClientRect();
      p.style.transition = `stroke-dashoffset 1.15s cubic-bezier(0.33,1,0.68,1) ${i * 0.08}s`;
      p.style.strokeDashoffset = "0";
    });
  }

  function linePath(points) {
    return points
      .filter((p) => p && p.y != null)
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
  }

  function areaPath(points, baseline) {
    const clean = points.filter((p) => p && p.y != null);
    if (!clean.length) return "";
    return `${linePath(clean)} L${clean[clean.length - 1].x.toFixed(1)} ${baseline.toFixed(
      1
    )} L${clean[0].x.toFixed(1)} ${baseline.toFixed(1)} Z`;
  }

  function tooltip(wrap) {
    let tip = wrap.querySelector(".chart-tooltip");
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "chart-tooltip";
      tip.setAttribute("role", "status");
      wrap.appendChild(tip);
    }
    return tip;
  }

  function showTip(wrap, tip, x, y, html) {
    tip.innerHTML = html;
    tip.classList.add("is-visible");
    const w = wrap.clientWidth || 1;
    const h = wrap.clientHeight || 1;
    tip.style.left = `${clamp(x / w, 0.1, 0.9) * 100}%`;
    tip.style.top = `${clamp(y / h, 0.04, 0.94) * 100}%`;
  }

  function hideTip(tip) {
    tip.classList.remove("is-visible");
  }

  function eventX(evt, svg) {
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return ((evt.clientX - rect.left) / rect.width) * vb.width;
  }

  /* SVG text shrinks with the viewBox. Keep the rendered size legible
 even when a chart is drawn much narrower than its viewBox. */
  function legibleText(svg, wrap) {
    if (!svg || !wrap) return;
    const vb = svg.viewBox && svg.viewBox.baseVal;
    if (!vb || !vb.width) return;
    const rendered = wrap.clientWidth || vb.width;
    const scale = rendered / vb.width;
    if (!scale || scale > 0.97) return;
    svg.querySelectorAll("text").forEach((node) => {
      const current = parseFloat(window.getComputedStyle(node).fontSize) || 8;
      const min = node.classList.contains("chart-label") ? 9.8 : 10.4;
      if (current * scale < min) {
        /* Inline styles win over the SVG stylesheet, unlike presentation
 attributes. */
        node.style.fontSize = `${(min / scale).toFixed(2)}px`;
      }
    });
  }

  function yearStatus(i) {
    if (i < 8) return "Reported";
    if (i === 8) return "Actual";
    return "Analytical case";
  }

  /* ----------------------------------------------------------------
 Hero trend line
 ---------------------------------------------------------------- */

  /* The hero chart is the page's opening object, so it is drawn at the size it
     is displayed: the viewBox tracks the container instead of assuming 620px.
     A fixed viewBox scaled into a wide box is what made it read as a squashed
     strip with unreadably small type. */
  function hero(wrap, state) {
    const cw = wrap.clientWidth || 900;
    const ch = wrap.clientHeight || 320;
    const compact = cw < 560;
    const W = Math.round(Math.max(compact ? 460 : 760, cw));
    const H = Math.round(Math.max(compact ? 200 : 260, ch));
    const svg = makeSvg(wrap, W, H);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("preserveAspectRatio", "none");
    const fs = compact ? 11 : 12;
    const m = {
      l: compact ? 34 : 56,
      r: compact ? 12 : 20,
      t: compact ? 20 : 28,
      b: compact ? 30 : 38
    };
    const years = D.meta.years;
    const caseName = state.scenario;
    const values = years.map((y, i) => {
      if (i < 8) return D.historical[i].revenue;
      if (i === 8) return D.actual.revenue;
      return D.scenarios[caseName][y].revenue;
    });
    const min = Math.min(...values) * 0.94;
    const max = Math.max(...values) * 1.04;
    const x = (i) => m.l + (i / (values.length - 1)) * (W - m.l - m.r);
    const y = (v) => m.t + (1 - (v - min) / (max - min)) * (H - m.t - m.b);
    const pts = values.map((v, i) => ({ x: x(i), y: y(v) }));

    /* Baseline and one guide per lakh, so the line has a scale to read against. */
    const gridVals = [100000, 150000, 200000, 250000, 300000].filter(
      (v) => v >= min && v <= max
    );
    gridVals.forEach((v) => {
      const gy = y(v);
      el("line", {
        x1: m.l, x2: W - m.r, y1: gy, y2: gy,
        stroke: COLORS.line, "stroke-width": 1, "stroke-dasharray": v === 100000 ? "none" : "2 4"
      }, svg);
      text(svg, m.l - 8, gy + 4, `${(v / 100000).toFixed(1)}L`, "axis-text", {
        "text-anchor": "end", "font-size": fs, opacity: 0.7
      });
    });

    const defs = el("defs", {}, svg);
    const grad = el(
      "linearGradient",
      { id: "heroFill", x1: "0", x2: "0", y1: "0", y2: "1" },
      defs
    );
    el("stop", { offset: "0%", "stop-color": CASE_COLOR[caseName], "stop-opacity": "0.30" }, grad);
    el("stop", { offset: "100%", "stop-color": CASE_COLOR[caseName], "stop-opacity": "0" }, grad);

    el("path", { d: areaPath(pts, H - m.b), fill: "url(#heroFill)" }, svg);

    const actualPts = pts.slice(0, 9);
    const casePts = pts.slice(8);
    el(
      "path",
      { d: linePath(actualPts), class: "chart-line chart-line--actual draw", "stroke-width": 2.4 },
      svg
    );
    el(
      "path",
      {
        d: linePath(casePts),
        fill: "none",
        stroke: CASE_COLOR[caseName],
        "stroke-width": 3,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        class: "draw"
      },
      svg
    );

    const bridge = pts[8];
    el("line", {
      x1: bridge.x, x2: bridge.x, y1: m.t, y2: H - m.b,
      stroke: COLORS.lineStrong, "stroke-dasharray": "2 3"
    }, svg);
    el("circle", { cx: bridge.x, cy: bridge.y, r: 3.4, fill: COLORS.ink, stroke: COLORS.white, "stroke-width": 1.4 }, svg);

    const last = pts[pts.length - 1];
    el("circle", {
      cx: last.x, cy: last.y, r: 5,
      fill: CASE_COLOR[caseName], stroke: COLORS.white, "stroke-width": 2
    }, svg);

    /* Year labels on the baseline. Without them the line floats with no
       reference and the whole chart reads as decoration. */
    const labelIdx = compact ? [0, 4, 8, 10] : [0, 2, 4, 6, 8, 9, 10];
    labelIdx.forEach((i) => {
      const yr = years[i];
      const short = i === 8 ? "FY26*" : `FY${String(yr).slice(4)}`;
      text(svg, x(i), H - m.b + fs + 8, short, "axis-text", {
        "text-anchor": i === 0 ? "start" : i === values.length - 1 ? "end" : "middle",
        "font-size": fs,
        opacity: 0.72,
        "font-weight": i === 8 ? 700 : 400
      });
    });

    /* The selected year's point gets a direct label, so the largest number on
       the screen is visibly attached to this chart rather than floating near it. */
    const selIdx = state.year === "FY2026" ? 8 : state.year === "FY2027" ? 9 : 10;
    const selPt = pts[selIdx];
    if (selPt) {
      el("circle", {
        cx: selPt.x, cy: selPt.y, r: 3.2,
        fill: COLORS.ink, stroke: CASE_COLOR[caseName], "stroke-width": 2
      }, svg);
    }

    animatePaths(svg);
  }

  /* ----------------------------------------------------------------
 Revenue runway: actual history + three cases
 ---------------------------------------------------------------- */

  function runway(wrap, state) {
    const desktop = (wrap.clientWidth || 900) >= 560;
    const { W, H, compact, fs } = frame(wrap, 900, desktop ? 510 : 380);
    const svg = makeSvg(wrap, W, H);
    const m = { l: compact ? 48 : 64, r: 16, t: 28, b: compact ? 38 : 40 };
    const years = D.meta.years;
    const n = years.length;
    const caseName = state.scenario;
    const yMin = 100000;
    const yMax = 350000;
    const plotW = W - m.l - m.r;
    const plotH = H - m.t - m.b;

    const x = (i) => m.l + (i / (n - 1)) * plotW;
    const y = (v) => m.t + (1 - (v - yMin) / (yMax - yMin)) * plotH;

    const ticks = [100000, 200000, 300000];
    ticks.forEach((t) => {
      el("line", { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), class: "grid-line" }, svg);
      text(svg, m.l - 9, y(t) + 3, fmtAxisMoney(t), "axis-text axis-text--muted", {
        "text-anchor": "end",
        "font-size": compact ? 11 : 10.5
      });
    });

    el("rect", {
      x: x(8), y: m.t, width: x(n - 1) - x(8), height: plotH,
      class: "forecast-zone"
    }, svg);
    el("line", {
      x1: x(8), x2: x(8), y1: m.t, y2: m.t + plotH,
      class: "forecast-edge"
    }, svg);
    text(svg, x(8) + 6, m.t + 10, "Forecast horizon", "axis-text axis-text--muted", {
      "font-size": compact ? 10 : 9.5
    });

    const actual = years.map((yr, i) => {
      if (i < 8) return D.historical[i].revenue;
      return D.actual.revenue;
    });
    const actualPts = actual.map((v, i) => ({ x: x(i), y: y(v) }));

    const defs = el("defs", {}, svg);
    const grad = el("linearGradient", { id: "runwayFill", x1: "0", x2: "0", y1: "0", y2: "1" }, defs);
    el("stop", { offset: "0%", "stop-color": COLORS.ink, "stop-opacity": "0.13" }, grad);
    el("stop", { offset: "100%", "stop-color": COLORS.ink, "stop-opacity": "0.01" }, grad);

    el("path", { d: areaPath(actualPts, m.t + plotH), fill: "url(#runwayFill)" }, svg);
    el(
      "path",
      { d: linePath(actualPts), class: "chart-line chart-line--actual draw" },
      svg
    );

    actualPts.forEach((p, i) => {
      el("circle", {
        cx: p.x, cy: p.y, r: i === 8 ? 4.2 : 2.9,
        fill: i === 8 ? COLORS.ink : COLORS.white,
        stroke: COLORS.ink, "stroke-width": 1.5
      }, svg);
    });

    CASES.filter((c) => c !== caseName).forEach((c) => {
      const vals = [D.actual.revenue, D.scenarios[c].FY2027.revenue, D.scenarios[c].FY2028.revenue];
      const pts = vals.map((v, k) => ({ x: x(8 + k), y: y(v) }));
      el("path", {
        d: linePath(pts), fill: "none", stroke: CASE_COLOR[c],
        "stroke-width": 1.5, "stroke-linecap": "round", opacity: 0.28
      }, svg);
    });

    const selVals = [D.actual.revenue, D.scenarios[caseName].FY2027.revenue, D.scenarios[caseName].FY2028.revenue];
    const selPts = selVals.map((v, k) => ({ x: x(8 + k), y: y(v) }));
    el("path", {
      d: linePath(selPts), fill: "none", stroke: CASE_COLOR[caseName],
      "stroke-width": 2.7, "stroke-linecap": "round", "stroke-linejoin": "round",
      class: "draw"
    }, svg);
    selPts.slice(1).forEach((p) => {
      el("circle", {
        cx: p.x, cy: p.y, r: 4,
        fill: CASE_COLOR[caseName], stroke: COLORS.white, "stroke-width": 1.7
      }, svg);
    });

    const end = selPts[selPts.length - 1];
    const labelX = end.x - 2;
    const labelY = end.y - 13;
    const labelW = compact ? 72 : 66;
    el("rect", {
      x: labelX - labelW, y: labelY - 12, width: labelW, height: 17,
      fill: COLORS.ink
    }, svg);
    text(svg, labelX - 6, labelY, fmtShortMoney(selVals[2]), "chart-label chart-label--inverse", {
      "text-anchor": "end",
      "font-size": compact ? 10 : 10
    });

    years.forEach((yr, i) => {
      if (compact && i % 2 !== 0 && i !== n - 1) return;
      text(svg, x(i), H - 14, `FY${yr.slice(2)}`, "axis-text", {
        "text-anchor": "middle",
        "font-size": compact ? 10.5 : 10.5,
        class: i === 8 ? "axis-text axis-text--strong" : "axis-text",
        "font-weight": i === 8 ? 600 : 400
      });
    });

    const cross = el("line", {
      x1: 0, x2: 0, y1: m.t, y2: m.t + plotH,
      class: "crosshair"
    }, svg);
    const dots = el("g", { class: "hover-dot" }, svg);

    const tip = tooltip(wrap);
    let active = n - 1;

    const renderTip = (i) => {
      active = clamp(i, 0, n - 1);
      const px = x(active);
      cross.setAttribute("x1", px);
      cross.setAttribute("x2", px);
      cross.classList.add("is-visible");
      dots.innerHTML = "";
      dots.classList.add("is-visible");

      const rows = [];
      if (active <= 8) {
        const v = active < 8 ? D.historical[active].revenue : D.actual.revenue;
        el("circle", {
          cx: px, cy: y(v), r: 4.4, fill: COLORS.ink,
          stroke: COLORS.white, "stroke-width": 1.7
        }, dots);
        rows.push(
          `<div class="tooltip-row is-active"><span>Revenue</span><b>${fmtCr(v)}</b></div>`
        );
      } else {
        CASES.slice().reverse().forEach((c) => {
          const v = D.scenarios[c][years[active]].revenue;
          el("circle", {
            cx: px, cy: y(v), r: c === caseName ? 4.4 : 2.7,
            fill: CASE_COLOR[c], stroke: COLORS.white, "stroke-width": 1.5,
            opacity: c === caseName ? 1 : 0.5
          }, dots);
          rows.push(
            `<div class="tooltip-row ${c === caseName ? "is-active" : ""}"><span>${SHORT[c]}</span><b>${fmtCr(v)}</b></div>`
          );
        });
      }

      showTip(
        wrap,
        tip,
        (px / W) * wrap.clientWidth,
        ((m.t + 8) / H) * wrap.clientHeight,
        `<div class="tooltip-title">${years[active]}<span>${yearStatus(active)}</span></div>${rows.join("")}`
      );
      wrap.setAttribute("aria-label", `${years[active]}: ${rows.map((r) => r.replace(/<[^>]+>/g, " ")).join("; ")}`);
    };

    const hide = () => {
      cross.classList.remove("is-visible");
      dots.classList.remove("is-visible");
      hideTip(tip);
    };

    let pointerFrame = 0;
    svg.addEventListener("pointermove", (evt) => {
      const px = eventX(evt, svg);
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        renderTip(Math.round(((px - m.l) / plotW) * (n - 1)));
      });
    });
    svg.addEventListener("pointerdown", (evt) => {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      const px = eventX(evt, svg);
      renderTip(Math.round(((px - m.l) / plotW) * (n - 1)));
    });
    svg.addEventListener("pointerleave", () => {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      hide();
    });
    wrap.addEventListener("focus", () => renderTip(active));
    wrap.addEventListener("blur", hide);
    wrap.addEventListener("keydown", (evt) => {
      if (evt.key === "ArrowRight") {
        evt.preventDefault();
        renderTip(active + 1);
      } else if (evt.key === "ArrowLeft") {
        evt.preventDefault();
        renderTip(active - 1);
      } else if (evt.key === "Escape") {
        hide();
      }
    });

    animatePaths(svg);
  }

  /* ----------------------------------------------------------------
 Case spread dot plot
 ---------------------------------------------------------------- */

  function spread(wrap, state) {
    const { W, H, compact, fs } = frame(wrap, 560, 196);
    const svg = makeSvg(wrap, W, H);
    const year = state.year;
    const values = CASES.map((c) => D.scenarios[c][year].revenue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.25 || 4000;
    const lo = Math.floor((min - pad) / 5000) * 5000;
    const hi = Math.ceil((max + pad) / 5000) * 5000;
    const m = { l: compact ? 62 : 66, r: compact ? 64 : 74, t: 14, b: 22 };
    const x = (v) => m.l + ((v - lo) / (hi - lo)) * (W - m.l - m.r);
    const rows = CASES.slice().reverse();
    const y = (i) => 36 + i * ((H - m.t - m.b - 12) / 2.4);

    const tickVals = [lo, (lo + hi) / 2, hi];
    tickVals.forEach((t) => {
      el("line", {
        x1: x(t), x2: x(t), y1: 22, y2: H - 22,
        class: "grid-line"
      }, svg);
      text(svg, x(t), H - 5, fmtAxisMoney(t), "axis-text axis-text--muted", {
        "text-anchor": "middle",
        "font-size": compact ? 10 : 9.5
      });
    });

    rows.forEach((c, i) => {
      const v = D.scenarios[c][year].revenue;
      const yy = y(i);
      el("text", {
        x: 0, y: yy + 4,
        class: "axis-text",
        "font-size": compact ? 12 : 11,
        "font-weight": c === state.scenario ? 600 : 400
      }, svg).textContent = SHORT[c];
      el("line", {
        x1: m.l, x2: x(v), y1: yy, y2: yy,
        stroke: CASE_COLOR[c], "stroke-width": 2, opacity: 0.35
      }, svg);
      el("circle", {
        cx: x(v), cy: yy, r: c === state.scenario ? 6 : 4,
        fill: CASE_COLOR[c],
        stroke: COLORS.white, "stroke-width": 1.8
      }, svg);
      text(svg, x(v) + 9, yy + 3.5, fmtShortMoney(v), "chart-label", {
        "font-size": compact ? 11 : 10.5,
        "font-weight": c === state.scenario ? 600 : 400,
        fill: c === state.scenario ? COLORS.ink : COLORS.slate
      });
      el("rect", {
        x: m.l - 8, y: yy - 14, width: W - m.l + 8, height: 28,
        fill: "transparent", style: "cursor:pointer",
        "data-case-hit": c
      }, svg).addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("tcs:scenario", { detail: c }));
      });
    });

    animatePaths(svg);
  }

  /* ----------------------------------------------------------------
 Sparkline
 ---------------------------------------------------------------- */

  function spark(wrap, values, color) {
    const { W, H } = frame(wrap, 220, 34);
    const svg = makeSvg(wrap, W, H);
    const clean = values.map((v, i) => ({ v, i })).filter((d) => d.v != null);
    if (clean.length < 2) return;
    const min = Math.min(...clean.map((d) => d.v));
    const max = Math.max(...clean.map((d) => d.v));
    const span = max - min || 1;
    const n = values.length;
    const x = (i) => 3 + (i / (n - 1)) * (W - 8);
    const y = (v) => 3 + (1 - (v - min) / span) * (H - 8);

    let segments = [];
    let current = [];
    values.forEach((v, i) => {
      if (v == null) {
        if (current.length > 1) segments.push(current);
        current = [];
      } else {
        current.push({ x: x(i), y: y(v) });
      }
    });
    if (current.length > 1) segments.push(current);

    segments.forEach((seg) => {
      el("path", {
        d: linePath(seg), fill: "none", stroke: color,
        "stroke-width": 1.6, "stroke-linecap": "round", opacity: 0.6
      }, svg);
    });

    const last = clean[clean.length - 1];
    el("circle", {
      cx: x(last.i), cy: y(last.v), r: 2.8,
      fill: color, stroke: COLORS.white, "stroke-width": 1.2
    }, svg);
  }

  window.TCSUtil = {
    NS, CASES, SHORT, CASE_COLOR, COLORS, reduceMotion,
    fmtNum, fmtCr, fmtEps, fmtPct, fmtAxisMoney, fmtShortMoney,
    clamp, el, text, linePath, areaPath, legibleText
  };

  window.TCSCharts = { hero, runway, spread, spark };
})();
