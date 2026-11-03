/* ------------------------------------------------------------------
 TCS Financial Outlook — chart kit, part two
 Trend bars, margin lines, profit vs cash, case comparison.

 INTERACTION CONTRACT (charts2.js owns it for its own charts):
 · Every chart that plots a year axis gets a crosshair + tooltip.
 · Pointer move/enter scrubs; ArrowLeft/ArrowRight scrubs; Escape
 clears. Each host is tabbable (tabindex=0) because it carries
 role="img" and now also answers keys.
 · Exact values only. No rounded, abbreviated or interpolated figure
 ever appears in a tooltip.
 · colour resolves from the FIELD, never globally: each SVG element
 that needs series ink reads --series-N from its host. See
 charts.css for the per-field map.
 ------------------------------------------------------------------- */

(() => {
  "use strict";

  const U = window.TCSUtil;
  const D = window.TCS_DATA;
  const {
    CASES, SHORT, CASE_COLOR, COLORS,
    fmtNum, fmtCr, fmtEps, fmtAxisMoney, fmtShortMoney,
    clamp, el, text, linePath
  } = U;

  const srgbFns = {
    ink: "var(--field-ink, #0b1439)",
    series: (i) => `var(--series-${i}, #1428bf)`
  };

  /* Case identity re-inks per field. On #futures the saturated set is
 live (Base #54c8ff / Bull #ff8a3d / Bear #00e0c6); on #trend the encode
 is lightness rank inside one family, so every forecast bar is --series-2.
 Never let a case colour cross a field boundary unchanged. */
  const CASE_SERIES = {
    midnight: { "Base Case": "--series-0", "Bull Case": "--series-1", "Bear Case": "--series-2" },
    teal: { "Base Case": "--series-2", "Bull Case": "--series-2", "Bear Case": "--series-2" },
    oxblood: { "Base Case": "--series-2", "Bull Case": "--series-2", "Bear Case": "--series-2" },
    cobalt: { "Base Case": "--series-1", "Bull Case": "--series-2", "Bear Case": "--series-2" }
  };
  const fieldOf = (wrap) => (wrap.closest("[data-field]") || {}).dataset?.field || "midnight";
  const caseInk = (wrap, caseName) => {
    const map = CASE_SERIES[fieldOf(wrap)] || CASE_SERIES.midnight;
    return `var(${map[caseName] || "--series-0"}, #54c8ff)`;
  };

  const METRICS = {
    revenue: {
      label: "Revenue",
      axis: "money",
      hist: "revenue",
      actual: "revenue",
      scenario: "revenue",
      note: "Reported revenue through FY2025; FY2026 actual; then the selected analytical case."
    },
    ebitda: {
      label: "EBITDA",
      axis: "money",
      hist: "ebitda",
      actual: "ebitda",
      scenario: "ebitda",
      note: "Reported EBITDA through FY2025; Calculated EBITDA proxy for FY2026 onward."
    },
    pat: {
      label: "Net profit",
      axis: "money",
      hist: "netProfit",
      actual: "pat",
      scenario: "pat",
      note: "Reported net profit FY2018–FY2025; FY2026 statutory PAT ₹49,454 Cr from the results filing; then the selected analytical case."
    },
    eps: {
      label: "EPS — diluted",
      axis: "eps",
      hist: "eps",
      actual: "eps",
      scenario: "eps",
      note: "Reported diluted EPS FY2018–FY2025; FY2026 = ₹136.01 from the results filing; forecast EPS follows the model PAT ÷ shares bridge."
    },
    fcf: {
      label: "Free cash flow",
      axis: "money",
      hist: "fcf",
      actual: "fcf",
      scenario: "fcf",
      note: "Reported FCF FY2018–FY2025. TCS reports ₹52,094 Cr operating cash flow for FY2026 but no FCF line, so the FY2026 slot stays empty. FY2027 onward is the selected analytical case."
    }
  };

  function metricSeries(metricKey, scenario) {
    const cfg = METRICS[metricKey];
    return D.meta.years.map((year, i) => {
      if (i < 8) {
        return { year, value: D.historical[i][cfg.hist], kind: "reported" };
      }
      if (i === 8) {
        return { year, value: D.actual[cfg.actual], kind: "actual" };
      }
      return { year, value: D.scenarios[scenario][year][cfg.scenario], kind: "forecast" };
    });
  }

  function niceMax(raw, axis) {
    if (raw == null || raw <= 0) return 10;
    if (axis === "eps") {
      const step = raw > 200 ? 50 : raw > 80 ? 25 : 10;
      return Math.ceil((raw * 1.12) / step) * step;
    }
    if (raw >= 200000) return Math.ceil((raw * 1.08) / 50000) * 50000;
    if (raw >= 50000) return Math.ceil((raw * 1.1) / 10000) * 10000;
    if (raw >= 5000) return Math.ceil((raw * 1.12) / 1000) * 1000;
    return Math.ceil((raw * 1.15) / 100) * 100;
  }

  function tickSet(max, axis) {
    if (axis === "eps") {
      const step = max / 4;
      return [0, step, step * 2, step * 3, max];
    }
    if (max >= 100000) return [0, max / 3, (max / 3) * 2, max];
    return [0, max / 2, max];
  }

  function fmtAxis(v, axis) {
    if (axis === "eps") return `₹${fmtNum(v, 0)}`;
    return fmtAxisMoney(v);
  }

  function fmtValue(v, axis) {
    if (v == null) return "—";
    return axis === "eps" ? fmtEps(v) : fmtCr(v);
  }

  function tooltip(wrap) {
    let tip = wrap.querySelector(".chart-tooltip");
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "chart-tooltip";
      tip.setAttribute("aria-hidden", "true");
      wrap.appendChild(tip);
    }
    return tip;
  }

  /* Place the tooltip by pixel offset, flipping sides near an edge so it
 never leaves the plot. x/y are SVG viewBox coordinates. */
  function placeTip(wrap, tip, x, y, W, H, html) {
    tip.innerHTML = html;
    tip.classList.add("is-visible");
    const w = wrap.clientWidth || 1;
    const h = wrap.clientHeight || 1;
    const left = (x / W) * w;
    const top = (y / H) * h;
    const tw = tip.offsetWidth || 160;
    const th = tip.offsetHeight || 80;
    const flipX = left + 14 + tw > w;
    const flipY = top + 14 + th > h;
    tip.style.left = `${Math.round(flipX ? Math.max(6, left - tw - 12) : left + 12)}px`;
    tip.style.top = `${Math.round(flipY ? Math.max(4, top - th - 10) : top + 6)}px`;
    tip.style.transform = "none";
  }

  function eventX(evt, svg) {
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return ((evt.clientX - rect.left) / rect.width) * vb.width;
  }

  /* Draw at the container's real width so the viewBox scale is 1 and label
     type is not shrunk by the browser's downscaling. */
  function frame(wrap, W, H) {
    const cw = wrap.clientWidth || W;
    const compact = cw < 560;
    if (compact) return { W: Math.round(cw), H: Math.round(H * 0.96), compact, heightScale: H * 0.96 };
    return { W: Math.round(cw), H, compact, heightScale: H };
  }

  function animatePaths(svg) {
    if (U.reduceMotion.matches) return;
    svg.querySelectorAll("path.draw").forEach((p, i) => {
      let len = 900;
      try {
        len = p.getTotalLength();
      } catch (err) {
        /* keep fallback */
      }
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.style.animation = "none";
      p.getBoundingClientRect();
      p.style.transition = `stroke-dashoffset 1.15s cubic-bezier(0.33,1,0.68,1) ${i * 0.08}s`;
      p.style.strokeDashoffset = "0";
    });
  }

  function makeSvg(wrap, W, H) {
    const tip = wrap.querySelector(".chart-tooltip");
    wrap.innerHTML = "";
    const svg = el("svg", {
      viewBox: `0 0 ${W} ${H}`,
      width: "100%",
      preserveAspectRatio: "xMidYMid meet",
      "aria-hidden": "true",
      focusable: "false"
    });
    wrap.appendChild(svg);
    /* keep the tooltip layer alive across redraws */
    if (!tip) wrap.appendChild(tooltip(wrap));
    else wrap.appendChild(tip);
    return svg;
  }

  /* Make a chart host keyboard-reachable exactly once. */
  function makeFocusable(wrap, label) {
    if (!wrap.hasAttribute("tabindex")) wrap.setAttribute("tabindex", "0");
    if (label) wrap.setAttribute("data-chart-hint", label);
  }

  function clearTip(wrap) {
    const tip = wrap.querySelector(".chart-tooltip");
    if (tip) tip.classList.remove("is-visible");
    wrap.querySelectorAll(".crosshair.is-visible, .hover-dot.is-visible, .hover-ring.is-visible").forEach((n) => {
      n.classList.remove("is-visible");
    });
    wrap.querySelectorAll(".chart-hit.is-active").forEach((n) => n.classList.remove("is-active"));
  }

  /* Shared scrubber: pointer + keyboard over an index axis of n steps. */
  function scrubber(wrap, svg, opts) {
    const { n, indexFromX, render, clear } = opts;
    let current = -1;
    const show = (i) => {
      const next = clamp(i, 0, n - 1);
      if (next === current) return;
      current = next;
      render(next);
    };
    const hide = () => {
      current = -1;
      clear();
      clearTip(wrap);
    };

    let raf = 0;
    svg.addEventListener("pointermove", (evt) => {
      const px = eventX(evt, svg);
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        wrap.classList.add("is-scrubbing");
        show(indexFromX(px));
      });
    });
    svg.addEventListener("pointerdown", (evt) => {
      wrap.classList.add("is-scrubbing");
      show(indexFromX(eventX(evt, svg)));
    });
    svg.addEventListener("pointerleave", () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      wrap.classList.remove("is-scrubbing");
      hide();
    });

    wrap.addEventListener("keydown", (evt) => {
      if (evt.key === "ArrowRight" || evt.key === "ArrowDown") {
        evt.preventDefault();
        show((current < 0 ? n - 1 : current) + 1);
      } else if (evt.key === "ArrowLeft" || evt.key === "ArrowUp") {
        evt.preventDefault();
        show((current < 0 ? 0 : current) - 1);
      } else if (evt.key === "Home") {
        evt.preventDefault();
        show(0);
      } else if (evt.key === "End") {
        evt.preventDefault();
        show(n - 1);
      } else if (evt.key === "Escape") {
        hide();
      }
    });
    wrap.addEventListener("blur", (evt) => {
      if (!wrap.contains(evt.relatedTarget)) hide();
    });

    return { hide };
  }

  /* ----------------------------------------------------------------
 Trend columns — one scrub column per fiscal year
 ---------------------------------------------------------------- */

  function trend(wrap, state) {
    const { W, H, compact } = frame(wrap, 900, 336);
    const svg = makeSvg(wrap, W, H);
    const cfg = METRICS[state.trendMetric];
    const series = metricSeries(state.trendMetric, state.scenario);
    const m = { l: compact ? 52 : 62, r: 12, t: 30, b: compact ? 38 : 38 };
    const plotW = W - m.l - m.r;
    const plotH = H - m.t - m.b;
    const n = series.length;
    const vals = series.map((s) => s.value).filter((v) => v != null);
    const max = niceMax(Math.max(...vals), cfg.axis);
    const ticks = tickSet(max, cfg.axis);
    const y = (v) => m.t + (1 - v / max) * plotH;
    const band = plotW / n;
    const barW = Math.min(compact ? 24 : 38, band * 0.52);
    const ink = "var(--field-ink, #0b1439)";

    ticks.forEach((t) => {
      el("line", { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), class: "grid-line" }, svg);
      text(svg, m.l - 9, y(t) + 3, fmtAxis(t, cfg.axis), "axis-text axis-text--muted", {
        "text-anchor": "end",
        "font-size": compact ? 10.5 : 11.5
      });
    });

    el("rect", {
      x: m.l + band * 8, y: m.t, width: band * 2.6, height: plotH,
      class: "forecast-zone"
    }, svg);

    /* scrub column: sits under the bars, follows the scrubbed index */
    const col = el("rect", {
      x: 0, y: m.t, width: band, height: plotH,
      class: "chart-hit"
    }, svg);
    col.style.opacity = "0";

    /* and a vertical crosshair on the scrubbed year, as on every other
 time-axis chart here — the bar chart should not be the odd one out */
    const cross = el("line", {
      x1: 0, x2: 0, y1: m.t, y2: m.t + plotH, class: "crosshair"
    }, svg);

    series.forEach((s, i) => {
      const cx = m.l + band * i + band / 2;
      if (s.value == null) {
        text(svg, cx, m.t + plotH - 8, "n/a", "axis-text axis-text--muted", {
          "text-anchor": "middle",
          "font-size": compact ? 9.5 : 11
        });
        return;
      }
      const h = Math.max(1.5, (s.value / max) * plotH);
      /*on #trend: reported → actual → forecast are three lightness steps
 within one family. Bars take the SERIES ink, never the text ink. */
      const fill = s.kind === "forecast"
        ? caseInk(wrap, state.scenario)
        : s.kind === "actual"
          ? "var(--series-1, #ffffff)"
          : "var(--series-0, #c9e6e2)";
      el("rect", {
        x: cx - barW / 2, y: m.t + plotH - h, width: barW, height: h,
        fill,
        opacity: s.kind === "forecast" ? 0.9 : s.kind === "actual" ? 0.82 : 1,
        class: "chart-bar",
        style: `animation-delay:${i * 38}ms`
      }, svg);

      if (compact ? i === 8 || i === 10 : i >= 7) {
        text(svg, cx, m.t + plotH - h - 6, fmtShortMoney(s.value), "chart-label", {
          "text-anchor": "middle",
          "font-size": compact ? 10 : 10.8
        });
      }
    });

    D.meta.years.forEach((yr, i) => {
      if (compact && i % 2 !== 0 && i !== 9 && i !== 10) return;
      text(svg, m.l + band * i + band / 2, H - 13, `FY${yr.slice(2)}`, "axis-text", {
        "text-anchor": "middle",
        "font-size": compact ? 10.5 : 11.5,
        class: i === 8 ? "axis-text axis-text--strong" : "axis-text",
        "font-weight": i === 8 ? 600 : 400
      });
    });

    el("line", {
      x1: m.l + band * 8, x2: m.l + band * 8, y1: m.t, y2: m.t + plotH,
      stroke: "var(--field-hair)", "stroke-dasharray": "2 4"
    }, svg);

    const status = (kind) =>
      kind === "forecast" ? `${SHORT[state.scenario]} case` : kind === "actual" ? "Actual" : "Reported";

    const tip = tooltip(wrap);
    const growth = window.TCSCharts.growthData(state.trendMetric, state.scenario);
    makeFocusable(wrap, "Use the arrow keys to read each year.");

    scrubber(wrap, svg, {
      n,
      indexFromX: (px) => Math.round((px - m.l - band / 2) / band),
      render: (i) => {
        const s = series[i];
        const cx = m.l + band * i + band / 2;
        col.setAttribute("x", cx - band / 2);
        col.style.opacity = "1";
        col.classList.add("is-active");
        /* crosshair sits on the centre of the scrubbed column */
        cross.setAttribute("x1", cx);
        cross.setAttribute("x2", cx);
        cross.classList.add("is-visible");

        const g = growth[i];
        const growthRow = g && g.growth != null
          ? `<div class="tooltip-row"><span>YoY growth</span><b>${U.fmtPct(g.growth, 1)}</b></div>`
          : "";
        const rows =
          s.value == null
            ? `<div class="tooltip-row is-active"><span>${cfg.label}</span><b>not published</b></div>`
            : `<div class="tooltip-row is-active"><span>${cfg.label}</span><b>${fmtValue(s.value, cfg.axis)}</b></div>${growthRow}`;
        placeTip(
          wrap, tip,
          cx, m.t + 4, W, H,
          `<div class="tooltip-title">${s.year}<span>${status(s.kind)}</span></div>${rows}`
        );
        wrap.setAttribute(
          "aria-label",
          `${s.year}, ${status(s.kind)}: ${s.value == null ? "not published" : fmtValue(s.value, cfg.axis)}` +
            (g && g.growth != null ? `, up ${fmtNum(Math.abs(g.growth), 1)} percent year on year` : "")
        );
      },
      clear: () => {
        col.style.opacity = "0";
        col.classList.remove("is-active");
        cross.classList.remove("is-visible");
      }
    });

    wrap.setAttribute(
      "aria-label",
      `${cfg.label} from FY2018 to FY2028. ${series
        .map((s) => `${s.year} ${s.value == null ? "not modelled" : fmtValue(s.value, cfg.axis)}`)
        .join(", ")}.`
    );
  }

  function growthData(metricKey, scenario) {
    const series = metricSeries(metricKey, scenario);
    return series.map((s, i) => {
      if (i === 0 || s.value == null) return { ...s, growth: null };
      let prev = series[i - 1].value;
      let periods = 1;
      if (prev == null && i === 9) {
        /* FY2026 free cash flow is not modelled, so bridge FY2025 to FY2027
 and annualise the two-year change. */
        prev = D.historical[7][METRICS[metricKey].hist];
        periods = 2;
      }
      return {
        ...s,
        growth: prev ? (Math.pow(s.value / prev, 1 / periods) - 1) * 100 : null
      };
    });
  }

  /* ----------------------------------------------------------------
 Margin lines
 ---------------------------------------------------------------- */

  function margin(wrap, state) {
    const { W, H, compact } = frame(wrap, 760, 300);
    const svg = makeSvg(wrap, W, H);
    const m = { l: compact ? 42 : 46, r: compact ? 66 : 76, t: 24, b: 36 };
    const plotW = W - m.l - m.r;
    const plotH = H - m.t - m.b;
    const n = 11;
    const years = D.meta.years;

    const seriesFor = (key) => years.map((yr, i) => {
      let value;
      if (i < 8) {
        const h = D.historical[i];
        value = key === "ebitda" ? (h.ebitda / h.revenue) * 100 : (h.netProfit / h.revenue) * 100;
      } else if (i === 8) {
        value = key === "ebitda" ? (D.actual.ebitda / D.actual.revenue) * 100 : (D.actual.pat / D.actual.revenue) * 100;
      } else {
        const row = D.scenarios[state.scenario][yr];
        value = key === "ebitda" ? (row.ebitda / row.revenue) * 100 : (row.pat / row.revenue) * 100;
      }
      return { x: m.l + (i / (n - 1)) * plotW, y: 0, value, i };
    });

    const ebitda = seriesFor("ebitda");
    const pat = seriesFor("pat");
    const all = ebitda.concat(pat).map((d) => d.value);
    const lo = Math.floor((Math.min(...all) - 2) / 5) * 5;
    const hi = Math.ceil((Math.max(...all) + 2) / 5) * 5;
    const y = (v) => m.t + (1 - (v - lo) / (hi - lo)) * plotH;

    for (let t = lo; t <= hi; t += 5) {
      el("line", { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), class: "grid-line" }, svg);
      text(svg, m.l - 8, y(t) + 3, `${t}%`, "axis-text axis-text--muted", {
        "text-anchor": "end",
        "font-size": compact ? 10.5 : 11.5
      });
    }

    const ebitdaColor = "var(--series-2)";
    const patColor = "var(--series-1)";

    const drawSeries = (data, color) => {
      data.forEach((d) => (d.y = y(d.value)));
      const solid = data.slice(0, 9);
      const dashed = data.slice(8);
      el("path", {
        d: linePath(solid), fill: "none", stroke: color,
        "stroke-width": 2.4, "stroke-linecap": "round", "stroke-linejoin": "round",
        class: "draw"
      }, svg);
      el("path", {
        d: linePath(dashed), fill: "none", stroke: color,
        "stroke-width": 2, "stroke-dasharray": "5 4", "stroke-linecap": "round",
        opacity: 0.85
      }, svg);
      data.forEach((d, i) => {
        el("circle", {
          cx: d.x, cy: d.y, r: i === 8 ? 3.6 : 2.5,
          fill: i > 8 ? "var(--field, #fff)" : color,
          stroke: color, "stroke-width": 1.5
        }, svg);
      });
    };

    drawSeries(ebitda, ebitdaColor);
    drawSeries(pat, patColor);

    years.forEach((yr, i) => {
      if (compact && i % 2 !== 0 && i !== 9 && i !== 10) return;
      text(svg, m.l + (i / (n - 1)) * plotW, H - 12, `FY${yr.slice(2)}`, "axis-text", {
        "text-anchor": "middle",
        "font-size": compact ? 10.5 : 11.5
      });
    });

    const lastE = ebitda[10];
    const lastP = pat[10];
    text(svg, W - 4, lastE.y + 3, `${fmtNum(lastE.value, 1)}%`, "chart-label", {
      "text-anchor": "end", fill: ebitdaColor, "font-size": compact ? 10 : 11.4
    });
    text(svg, W - 4, lastP.y + 3, `${fmtNum(lastP.value, 1)}%`, "chart-label", {
      "text-anchor": "end", fill: patColor, "font-size": compact ? 10 : 11.4
    });

    /* legend, drawn in the field's own ink */
    el("rect", { x: m.l, y: m.t - 16, width: 9, height: 9, fill: ebitdaColor }, svg);
    text(svg, m.l + 16, m.t - 8, "EBITDA", "axis-text axis-text--muted", { "font-size": compact ? 10.5 : 11.5 });
    el("rect", { x: m.l + 66, y: m.t - 16, width: 9, height: 9, fill: patColor }, svg);
    text(svg, m.l + 81, m.t - 8, "PAT", "axis-text axis-text--muted", { "font-size": compact ? 10.5 : 11.5 });

    const tip = tooltip(wrap);
    const cross = el("line", {
      x1: 0, x2: 0, y1: m.t, y2: m.t + plotH, class: "crosshair"
    }, svg);
    const focus = el("g", { class: "hover-dot" }, svg);
    makeFocusable(wrap, "Use the arrow keys to read each year.");

    const statusOf = (i) => (i < 8 ? "Reported" : i === 8 ? "Actual" : "Analytical case");

    scrubber(wrap, svg, {
      n,
      indexFromX: (px) => Math.round(((px - m.l) / plotW) * (n - 1)),
      render: (i) => {
        const px = m.l + (i / (n - 1)) * plotW;
        cross.setAttribute("x1", px);
        cross.setAttribute("x2", px);
        cross.classList.add("is-visible");
        focus.innerHTML = "";
        [ebitda[i], pat[i]].forEach((d) => {
          el("circle", {
            cx: d.x, cy: d.y, r: 4.4,
            fill: d === ebitda[i] ? ebitdaColor : patColor,
            stroke: "var(--field)", "stroke-width": 1.5
          }, focus);
        });
        focus.classList.add("is-visible");
        placeTip(
          wrap, tip, px, m.t + 6, W, H,
          `<div class="tooltip-title">${years[i]}<span>${statusOf(i)}</span></div>` +
          `<div class="tooltip-row is-active"><span>EBITDA margin</span><b>${fmtNum(ebitda[i].value, 1)}%</b></div>` +
          `<div class="tooltip-row"><span>PAT margin</span><b>${fmtNum(pat[i].value, 1)}%</b></div>`
        );
        wrap.setAttribute(
          "aria-label",
          `${years[i]} (${statusOf(i)}): EBITDA margin ${fmtNum(ebitda[i].value, 1)} percent, PAT margin ${fmtNum(pat[i].value, 1)} percent.`
        );
      },
      clear: () => {
        cross.classList.remove("is-visible");
        focus.classList.remove("is-visible");
      }
    });

    animatePaths(svg);
  }

  /* ----------------------------------------------------------------
 Profit versus free cash flow
 ---------------------------------------------------------------- */

  function cash(wrap, state) {
    const { W, H, compact } = frame(wrap, 780, 330);
    const svg = makeSvg(wrap, W, H);
    const m = { l: compact ? 50 : 56, r: compact ? 14 : 16, t: 38, b: 38 };
    const plotW = W - m.l - m.r;
    const plotH = H - m.t - m.b;
    /* Eight reported years, then FY2026 (statutory PAT) and FY2027 (the
 selected analytical case) so every year on the axis shows real data. */
    const rows = D.historical
      .map((h) => ({ ...h, pat: h.netProfit, kind: "reported" }))
      .concat([
        { year: D.actual.year, pat: D.actual.pat, fcf: D.actual.fcf, kind: "actual" },
        {
          year: "FY2027",
          pat: D.scenarios[state.scenario].FY2027.pat,
          fcf: D.scenarios[state.scenario].FY2027.fcf,
          kind: "forecast"
        }
      ]);
    const n = rows.length;
    const max = 60000;
    const y = (v) => m.t + (1 - v / max) * plotH;
    const band = plotW / n;
    const barW = Math.min(compact ? 14 : 22, band * 0.28);
    const ink = "var(--field-ink, #0b1439)";
    const cashColor = "var(--series-3)";

    [0, 20000, 40000, 60000].forEach((t) => {
      el("line", { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), class: "grid-line" }, svg);
      text(svg, m.l - 9, y(t) + 3.5, fmtAxisMoney(t), "axis-text axis-text--muted", {
        "text-anchor": "end",
        "font-size": compact ? 10.5 : 11.5
      });
    });

    const legendY = m.t - 14;
    el("rect", { x: m.l, y: legendY - 8, width: 10, height: 10, fill: "var(--series-1, #fff6ea)" }, svg);
    text(svg, m.l + 15, legendY + 1, "Net profit", "axis-text axis-text--muted", {
      "font-size": compact ? 10.5 : 11.5
    });
    el("rect", { x: m.l + 104, y: legendY - 8, width: 10, height: 10, fill: cashColor, opacity: 0.92 }, svg);
    text(svg, m.l + 119, legendY + 1, "Free cash flow", "axis-text axis-text--muted", {
      "font-size": compact ? 10.5 : 11.5
    });

    const tip = tooltip(wrap);
    const caseColor = caseInk(wrap, state.scenario);
    const col = el("rect", { x: 0, y: m.t, width: band, height: plotH, class: "chart-hit" }, svg);
    col.style.opacity = "0";

    rows.forEach((row, i) => {
      const cx = m.l + band * i + band / 2;

      if (row.pat != null) {
        const patH = (row.pat / max) * plotH;
        el("rect", {
          x: cx - barW - 1, y: m.t + plotH - patH, width: barW, height: patH,
          fill: row.kind === "forecast" ? caseColor : "var(--series-1, #fff6ea)",
          opacity: row.kind === "actual" ? 0.88 : 1,
          class: "chart-bar",
          style: `animation-delay:${i * 42}ms`
        }, svg);
      }

      if (row.fcf != null) {
        const fcfH = (row.fcf / max) * plotH;
        const base = {
          x: cx + 1, y: m.t + plotH - fcfH, width: barW, height: fcfH,
          class: "chart-bar",
          style: `animation-delay:${i * 42 + 60}ms`
        };
        el("rect",
          row.kind === "forecast"
            ? { ...base, fill: "var(--field, #fff)", stroke: cashColor, "stroke-width": 1.6, "stroke-dasharray": "3 2.5" }
            : { ...base, fill: cashColor, opacity: 0.92 },
          svg);
      } else if (row.kind === "actual") {
        /* FY2026 has no published free-cash-flow figure. Draw the slot as a
           visible dashed column at the height of the operating cash flow, so
           the absence reads as a deliberate gap in the record rather than a
           chart that failed to load. */
        const ghostH = row.cfo != null ? (row.cfo / max) * plotH : plotH * 0.62;
        el("rect", {
          x: cx + 1, y: m.t + plotH - ghostH, width: barW, height: ghostH,
          fill: "none", stroke: cashColor, "stroke-width": 1.4,
          "stroke-dasharray": "4 3", opacity: 0.55, "class": "chart-bar-ghost"
        }, svg);
        text(svg, cx + barW / 2 + 1, m.t + plotH - ghostH - 7, "n/a",
          "axis-text axis-text--muted", {
            "text-anchor": "middle",
            "font-size": compact ? 9.5 : 11.5
          });
        text(svg, cx + barW / 2 + 1, m.t + plotH - 6, "CFO",
          "axis-text axis-text--muted", {
            "text-anchor": "middle",
            "font-size": compact ? 9.5 : 10.5,
            opacity: 0.75
          });
      }

      /* Direct labels put the two verified numbers on the chart itself. */
      if (row.kind === "actual" && row.pat != null) {
        text(svg, cx - barW / 2, m.t + plotH - (row.pat / max) * plotH - 7,
          fmtNum(Math.round(row.pat)), "chart-label", {
            "text-anchor": "middle", fill: ink,
            "font-size": compact ? 10 : 11
          });
      }
      if (row.kind === "forecast") {
        text(svg, cx - 1, m.t + plotH - (row.pat / max) * plotH - 7,
          fmtNum(Math.round(row.pat)), "chart-label", {
            "text-anchor": "end", fill: caseColor,
            "font-size": compact ? 10 : 11
          });
        if (row.fcf != null) {
          text(svg, cx + 3, m.t + plotH - (row.fcf / max) * plotH - 7,
            fmtNum(Math.round(row.fcf)), "chart-label", {
              "text-anchor": "start", fill: cashColor,
              "font-size": compact ? 10 : 11
            });
        }
      }

      const axisYear = compact
        ? (i < n - 2 ? `’${row.year.slice(-2)}` : `FY${row.year.slice(-2)}`)
        : row.year;
      text(svg, cx, H - 13, axisYear, "axis-text", {
        "text-anchor": "middle",
        "font-size": compact ? 10.5 : 11.5,
        class: i === n - 2 ? "axis-text axis-text--strong" : "axis-text",
        "font-weight": i === n - 2 ? 600 : 400
      });
    });

    makeFocusable(wrap, "Use the arrow keys to read each year.");
    scrubber(wrap, svg, {
      n,
      indexFromX: (px) => Math.round((px - m.l - band / 2) / band),
      render: (i) => {
        const row = rows[i];
        const cx = m.l + band * i + band / 2;
        col.setAttribute("x", cx - band / 2);
        col.style.opacity = "1";
        col.classList.add("is-active");
        const status = row.kind === "forecast" ? `${SHORT[state.scenario]} case` : row.kind === "actual" ? "Actual" : "Reported";
        const fcfRow = row.fcf == null
          ? `<div class="tooltip-row"><span>Free cash flow</span><b>not published</b></div><div class="tooltip-row"><span>Operating cash flow</span><b>${fmtCr(D.actual.cfo)}</b></div>`
          : `<div class="tooltip-row"><span>Free cash flow</span><b>${fmtCr(row.fcf)}</b></div>`;
        const ratioRow = row.fcf == null
          ? ""
          : `<div class="tooltip-row"><span>FCF / PAT</span><b>${fmtNum((row.fcf / row.pat) * 100, 1)}%</b></div>`;
        placeTip(
          wrap, tip, cx, m.t + 4, W, H,
          `<div class="tooltip-title">${row.year}<span>${status}</span></div>` +
          `<div class="tooltip-row is-active"><span>Net profit</span><b>${fmtCr(row.pat)}</b></div>` +
          fcfRow + ratioRow
        );
        wrap.setAttribute(
          "aria-label",
          `${row.year} (${status}): net profit ${fmtCr(row.pat)}, free cash flow ${
            row.fcf == null ? "not published" : fmtCr(row.fcf)
          }.`
        );
      },
      clear: () => {
        col.style.opacity = "0";
        col.classList.remove("is-active");
      }
    });

    wrap.setAttribute(
      "aria-label",
      `Net profit versus free cash flow, FY2018 to FY2027. ${rows
        .map(
          (r) =>
            `${r.year} net profit ₹${fmtNum(Math.round(r.pat))} Cr${
              r.fcf == null ? ", FCF not published" : `, FCF ₹${fmtNum(Math.round(r.fcf))} Cr`
            }`
        )
        .join("; ")}. FY2027 follows the ${state.scenario}.`
    );
  }

  /* ----------------------------------------------------------------
 Scenario comparison — click/focus a case column to adopt it
 ---------------------------------------------------------------- */

  function compare(wrap, state) {
    const { W, H, compact } = frame(wrap, 900, 320);
    const svg = makeSvg(wrap, W, H);
    const cfg = METRICS[state.compareMetric];
    const yearList = ["FY2027", "FY2028"];
    const m = { l: compact ? 52 : 62, r: 12, t: 30, b: 38 };
    const plotW = W - m.l - m.r;
    const plotH = H - m.t - m.b;

    const values = [];
    CASES.forEach((c) => yearList.forEach((yr) => values.push(D.scenarios[c][yr][cfg.scenario])));
    const max = niceMax(Math.max(...values), cfg.axis);
    const ticks = tickSet(max, cfg.axis);
    const y = (v) => m.t + (1 - v / max) * plotH;

    ticks.forEach((t) => {
      el("line", { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), class: "grid-line" }, svg);
      text(svg, m.l - 9, y(t) + 3, fmtAxis(t, cfg.axis), "axis-text axis-text--muted", {
        "text-anchor": "end",
        "font-size": compact ? 10.5 : 11.5
      });
    });

    const groupW = plotW / 3;
    const barW = Math.min(compact ? 24 : 40, groupW * 0.2);
    const tip = tooltip(wrap);

    const baseValue = D.scenarios["Base Case"].FY2028[cfg.scenario];

    CASES.forEach((c, gi) => {
      const gx = m.l + groupW * gi;
      const selected = c === state.scenario;
      if (selected) {
        el("rect", {
          x: gx + 2, y: m.t - 6, width: groupW - 4, height: plotH + 6,
          fill: caseInk(wrap, c), opacity: 0.075
        }, svg);
        /* selection underline, drawn hard against the group's axis tick */
        el("rect", {
          x: gx + 2, y: m.t + plotH + 2, width: groupW - 4, height: 3,
          fill: caseInk(wrap, c)
        }, svg);
      }

      yearList.forEach((yr, yi) => {
        const v = D.scenarios[c][yr][cfg.scenario];
        const cx = gx + groupW / 2 + (yi === 0 ? -barW * 0.62 : barW * 0.62);
        const h = Math.max(1.5, (v / max) * plotH);
        el("rect", {
          x: cx - barW / 2, y: m.t + plotH - h, width: barW, height: h,
          fill: yi === 0 ? "var(--field, #fff)" : caseInk(wrap, c),
          stroke: caseInk(wrap, c), "stroke-width": yi === 0 ? 1.6 : 0,
          opacity: yi === 0 ? 0.9 : selected ? 1 : 0.52,
          class: "chart-bar",
          style: `animation-delay:${gi * 120 + yi * 55}ms`
        }, svg);
        if (!compact || yi === 1) {
          text(svg, yi === 0 ? cx - 6 : cx + 6, m.t + plotH - h - 6, fmtShortMoney(v), "chart-label", {
            "text-anchor": yi === 0 ? "end" : "start",
            "font-size": compact ? 10 : 10.8,
            fill: caseInk(wrap, c),
            opacity: selected ? 1 : 0.72
          });
        }
      });

      text(svg, gx + groupW / 2, H - 13, SHORT[c], "axis-text", {
        "text-anchor": "middle",
        "font-size": compact ? 10.5 : 12,
        class: selected ? "axis-text axis-text--strong" : "axis-text"
      });

      /* the whole column is one target: click or Enter adopts the case */
      const hit = el("rect", {
        x: gx + 1, y: m.t - 8, width: groupW - 2, height: plotH + 14,
        fill: "transparent", style: "cursor:pointer", tabindex: "-1"
      }, svg);
      const adopt = () => window.dispatchEvent(new CustomEvent("tcs:scenario", { detail: c }));
      hit.addEventListener("click", adopt);

      const d28 = D.scenarios[c].FY2028[cfg.scenario];
      const d27 = D.scenarios[c].FY2027[cfg.scenario];
      const vsBase = c === "Base Case" ? null : (d28 / baseValue - 1) * 100;
      const showCaseTip = () => {
        placeTip(
          wrap, tip, gx + groupW / 2, m.t + 4, W, H,
          `<div class="tooltip-title">${SHORT[c]} case<span>${selected ? "selected" : "click to adopt"}</span></div>` +
          `<div class="tooltip-row is-active"><span>FY2027</span><b>${fmtValue(d27, cfg.axis)}</b></div>` +
          `<div class="tooltip-row is-active"><span>FY2028</span><b>${fmtValue(d28, cfg.axis)}</b></div>` +
          (vsBase == null
            ? `<div class="tooltip-row"><span>vs Base FY2028</span><b>baseline</b></div>`
            : `<div class="tooltip-row"><span>vs Base FY2028</span><b>${U.fmtPct(vsBase, 1)}</b></div>`)
        );
      };
      hit.addEventListener("pointerenter", showCaseTip);
      hit.addEventListener("focus", showCaseTip);
      hit.addEventListener("blur", () => tip.classList.remove("is-visible"));
      hit.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          adopt();
        }
      });
    });

    text(svg, m.l, m.t - 12, `${cfg.label} (${cfg.axis === "eps" ? "₹ / share" : "₹ Cr"})`, "axis-text axis-text--muted", {
      "font-size": compact ? 10.5 : 11.5
    });
    text(svg, W - m.r, m.t - 12, "FY2027 outlined / FY2028 solid", "axis-text axis-text--muted", {
      "text-anchor": "end",
      "font-size": compact ? 10 : 11.2
    });

    svg.addEventListener("pointerleave", () => tip.classList.remove("is-visible"));
  }

  window.TCSCharts = Object.assign(window.TCSCharts || {}, {
    trend, growthData, margin, cash, compare, METRICS
  });
})();
