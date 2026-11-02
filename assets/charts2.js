/* ------------------------------------------------------------------
   TCS Financial Outlook — chart kit, part two
   Trend bars, margin lines, profit vs cash, case comparison.
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

  function eventX(evt, svg) {
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return ((evt.clientX - rect.left) / rect.width) * vb.width;
  }

  function frame(wrap, W, H) {
    const cw = wrap.clientWidth || W;
    const compact = cw < 560;
    if (compact) return { W: 520, H: Math.round(H * 0.96), compact };
    return { W, H, compact };
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

  /* ----------------------------------------------------------------
     Trend columns
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

    ticks.forEach((t) => {
      el("line", { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), class: "grid-line" }, svg);
      text(svg, m.l - 9, y(t) + 3, fmtAxis(t, cfg.axis), "axis-text axis-text--muted", {
        "text-anchor": "end",
        "font-size": compact ? 10.5 : 9.5
      });
    });

    el("rect", {
      x: m.l + band * 8, y: m.t, width: band * 2.6, height: plotH,
      class: "forecast-zone"
    }, svg);

    series.forEach((s, i) => {
      const cx = m.l + band * i + band / 2;
      if (s.value == null) {
        text(svg, cx, m.t + plotH - 8, "n/a", "axis-text axis-text--muted", {
          "text-anchor": "middle",
          "font-size": compact ? 9.5 : 9
        });
        return;
      }
      const h = Math.max(1.5, (s.value / max) * plotH);
      const fill =
        s.kind === "forecast" ? CASE_COLOR[state.scenario] : COLORS.ink;
      const rect = el("rect", {
        x: cx - barW / 2, y: m.t + plotH - h, width: barW, height: h,
        fill,
        opacity: s.kind === "forecast" ? 0.9 : s.kind === "actual" ? 0.82 : 1,
        class: "chart-bar",
        style: `animation-delay:${i * 38}ms`
      }, svg);

      if (compact ? i === 8 || i === 10 : i >= 7) {
        text(svg, cx, m.t + plotH - h - 6, fmtShortMoney(s.value), "chart-label", {
          "text-anchor": "middle",
          "font-size": compact ? 10 : 8.8
        });
      }

      rect.style.cursor = "pointer";
      rect.addEventListener("pointerenter", () => {
        showTip(
          wrap,
          tip,
          (cx / W) * wrap.clientWidth,
          (y(s.value) / H) * wrap.clientHeight,
          `<div class="tooltip-title">${s.year}<span>${
            s.kind === "forecast" ? SHORT[state.scenario] + " case" : s.kind === "actual" ? "Actual" : "Reported"
          }</span></div><div class="tooltip-row is-active"><span>${cfg.label}</span><b>${fmtValue(
            s.value,
            cfg.axis
          )}</b></div>`
        );
      });
      rect.addEventListener("pointerleave", () => tip.classList.remove("is-visible"));
    });

    const tip = tooltip(wrap);

    D.meta.years.forEach((yr, i) => {
      if (compact && i % 2 !== 0 && i !== 9 && i !== 10) return;
      text(svg, m.l + band * i + band / 2, H - 13, `FY${yr.slice(2)}`, "axis-text", {
        "text-anchor": "middle",
        "font-size": compact ? 10.5 : 9.5,
        class: i === 8 ? "axis-text axis-text--strong" : "axis-text",
        "font-weight": i === 8 ? 600 : 400
      });
    });

    el("line", {
      x1: m.l + band * 8, x2: m.l + band * 8, y1: m.t, y2: m.t + plotH,
      stroke: COLORS.lineStrong, "stroke-dasharray": "2 4"
    }, svg);

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

    const seriesFor = (key, caseKey) => years.map((yr, i) => {
      let value;
      if (i < 8) {
        const h = D.historical[i];
        value = key === "ebitda" ? (h.ebitda / h.revenue) * 100 : (h.netProfit / h.revenue) * 100;
      } else if (i === 8) {
        value = key === "ebitda" ? (D.actual.ebitda / D.actual.revenue) * 100 : (D.actual.pat / D.actual.revenue) * 100;
      } else {
        const row = D.scenarios[caseKey][yr];
        value = key === "ebitda" ? (row.ebitda / row.revenue) * 100 : (row.pat / row.revenue) * 100;
      }
      return { x: m.l + (i / (n - 1)) * plotW, y: 0, value, i };
    });

    const ebitda = seriesFor("ebitda", state.scenario);
    const pat = seriesFor("pat", state.scenario);
    const all = ebitda.concat(pat).map((d) => d.value);
    const lo = Math.floor((Math.min(...all) - 2) / 5) * 5;
    const hi = Math.ceil((Math.max(...all) + 2) / 5) * 5;
    const y = (v) => m.t + (1 - (v - lo) / (hi - lo)) * plotH;

    for (let t = lo; t <= hi; t += 5) {
      el("line", { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), class: "grid-line" }, svg);
      text(svg, m.l - 8, y(t) + 3, `${t}%`, "axis-text axis-text--muted", {
        "text-anchor": "end",
        "font-size": compact ? 10.5 : 9.5
      });
    }

    const drawSeries = (data, color, label) => {
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
          fill: i > 8 ? COLORS.white : color,
          stroke: color, "stroke-width": 1.5
        }, svg);
      });
    };

    drawSeries(ebitda, COLORS.teal, "EBITDA");
    drawSeries(pat, COLORS.violet, "PAT");

    years.forEach((yr, i) => {
      if (compact && i % 2 !== 0 && i !== 9 && i !== 10) return;
      text(svg, m.l + (i / (n - 1)) * plotW, H - 12, `FY${yr.slice(2)}`, "axis-text", {
        "text-anchor": "middle",
        "font-size": compact ? 10.5 : 9.5
      });
    });

    const lastE = ebitda[10];
    const lastP = pat[10];
    text(svg, W - 4, lastE.y + 3, `${fmtNum(lastE.value, 1)}%`, "chart-label", {
      "text-anchor": "end",
      fill: COLORS.teal,
      "font-size": compact ? 10 : 9.4
    });
    text(svg, W - 4, lastP.y + 3, `${fmtNum(lastP.value, 1)}%`, "chart-label", {
      "text-anchor": "end",
      fill: COLORS.violet,
      "font-size": compact ? 10 : 9.4
    });

    const tip = tooltip(wrap);
    const cross = el("line", {
      x1: 0, x2: 0, y1: m.t, y2: m.t + plotH, class: "crosshair"
    }, svg);
    const focus = el("g", { class: "hover-dot" }, svg);

    const showIndex = (i) => {
      const px = m.l + (i / (n - 1)) * plotW;
      cross.setAttribute("x1", px);
      cross.setAttribute("x2", px);
      cross.classList.add("is-visible");
      focus.innerHTML = "";
      [["EBITDA margin", ebitda[i], COLORS.teal], ["PAT margin", pat[i], COLORS.violet]].forEach(
        ([label, d, color]) => {
          el("circle", { cx: d.x, cy: d.y, r: 4.2, fill: color, stroke: COLORS.white, "stroke-width": 1.5 }, focus);
        }
      );
      focus.classList.add("is-visible");
      const status = i < 8 ? "Reported" : i === 8 ? "Actual" : "Analytical case";
      showTip(
        wrap,
        tip,
        (px / W) * wrap.clientWidth,
        (m.t + 10),
        `<div class="tooltip-title">${years[i]}<span>${status}</span></div><div class="tooltip-row is-active"><span>EBITDA margin</span><b>${fmtNum(
          ebitda[i].value,
          1
        )}%</b></div><div class="tooltip-row"><span>PAT margin</span><b>${fmtNum(pat[i].value, 1)}%</b></div>`
      );
    };

    let pointerFrame = 0;
    svg.addEventListener("pointermove", (evt) => {
      const px = eventX(evt, svg);
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        showIndex(clamp(Math.round(((px - m.l) / plotW) * (n - 1)), 0, n - 1));
      });
    });
    svg.addEventListener("pointerleave", () => {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      cross.classList.remove("is-visible");
      focus.classList.remove("is-visible");
      tip.classList.remove("is-visible");
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

    [0, 20000, 40000, 60000].forEach((t) => {
      el("line", { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), class: "grid-line" }, svg);
      text(svg, m.l - 9, y(t) + 3.5, fmtAxisMoney(t), "axis-text axis-text--muted", {
        "text-anchor": "end",
        "font-size": compact ? 10.5 : 9.5
      });
    });

    const legendY = m.t - 14;
    el("rect", { x: m.l, y: legendY - 8, width: 10, height: 10, fill: COLORS.ink }, svg);
    text(svg, m.l + 15, legendY + 1, "Net profit", "axis-text axis-text--muted", {
      "font-size": compact ? 10.5 : 9.5
    });
    el("rect", { x: m.l + 104, y: legendY - 8, width: 10, height: 10, fill: COLORS.amber, opacity: 0.92 }, svg);
    text(svg, m.l + 119, legendY + 1, "Free cash flow", "axis-text axis-text--muted", {
      "font-size": compact ? 10.5 : 9.5
    });

    const tip = tooltip(wrap);

    rows.forEach((row, i) => {
      const cx = m.l + band * i + band / 2;
      const caseColor = CASE_COLOR[state.scenario];

      if (row.pat != null) {
        const patH = (row.pat / max) * plotH;
        const patFill = row.kind === "forecast" ? caseColor : COLORS.ink;
        el("rect", {
          x: cx - barW - 1, y: m.t + plotH - patH, width: barW, height: patH,
          fill: patFill,
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
            ? { ...base, fill: COLORS.white, stroke: COLORS.amber, "stroke-width": 1.5, "stroke-dasharray": "3 2.5" }
            : { ...base, fill: COLORS.amber, opacity: 0.92 },
          svg);
      } else if (row.kind === "actual") {
        text(svg, cx + barW / 2 + 1, m.t + plotH - 8, "n/a", "axis-text axis-text--muted", {
          "text-anchor": "middle",
          "font-size": compact ? 9.5 : 9
        });
      }

      /* Direct labels put the two verified numbers on the chart itself. */
      if (row.kind === "actual" && row.pat != null) {
        text(svg, cx - barW / 2, m.t + plotH - (row.pat / max) * plotH - 7,
          fmtNum(Math.round(row.pat)), "chart-label", {
            "text-anchor": "middle", fill: COLORS.ink,
            "font-size": compact ? 10 : 9
          });
      }
      if (row.kind === "forecast") {
        /* split the anchors so the two labels never collide mid-band */
        text(svg, cx - 1, m.t + plotH - (row.pat / max) * plotH - 7,
          fmtNum(Math.round(row.pat)), "chart-label", {
            "text-anchor": "end", fill: caseColor,
            "font-size": compact ? 10 : 9
          });
        if (row.fcf != null) {
          text(svg, cx + 3, m.t + plotH - (row.fcf / max) * plotH - 7,
            fmtNum(Math.round(row.fcf)), "chart-label", {
              "text-anchor": "start", fill: COLORS.amber,
              "font-size": compact ? 10 : 9
            });
        }
      }

      const hit = el("rect", {
        x: cx - band / 2, y: m.t, width: band, height: plotH,
        fill: "transparent", style: "cursor:pointer"
      }, svg);
      hit.addEventListener("pointerenter", () => {
        const status = row.kind === "forecast"
          ? `${SHORT[state.scenario]} case`
          : "Reported";
        const fcfRow = row.fcf == null
          ? `<div class="tooltip-row"><span>Free cash flow</span><b>n/a — CFO ${fmtCr(
              D.actual.cfo
            )}</b></div>`
          : `<div class="tooltip-row"><span>Free cash flow</span><b>${fmtCr(row.fcf)}</b></div>`;
        const ratioRow = row.fcf == null
          ? ""
          : `<div class="tooltip-row"><span>FCF / PAT</span><b>${fmtNum(
              (row.fcf / row.pat) * 100,
              1
            )}%</b></div>`;
        showTip(
          wrap,
          tip,
          (cx / W) * wrap.clientWidth,
          m.t + 10,
          `<div class="tooltip-title">${row.year}<span>${status}</span></div>` +
          `<div class="tooltip-row is-active"><span>Net profit</span><b>${fmtCr(row.pat)}</b></div>` +
          fcfRow + ratioRow
        );
      });

      const axisYear = compact
        ? (i < n - 2 ? `’${row.year.slice(-2)}` : `FY${row.year.slice(-2)}`)
        : row.year;
      text(svg, cx, H - 13, axisYear, "axis-text", {
        "text-anchor": "middle",
        "font-size": compact ? 10.5 : 9.5,
        class: i === n - 2 ? "axis-text axis-text--strong" : "axis-text",
        "font-weight": i === n - 2 ? 600 : 400
      });
    });

    svg.addEventListener("pointerleave", () => tip.classList.remove("is-visible"));

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
     Scenario comparison
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
        "font-size": compact ? 10.5 : 9.5
      });
    });

    const groupW = plotW / 3;
    const barW = Math.min(compact ? 24 : 40, groupW * 0.2);

    CASES.forEach((c, gi) => {
      const gx = m.l + groupW * gi;
      if (c === state.scenario) {
        el("rect", {
          x: gx + 2, y: m.t - 6, width: groupW - 4, height: plotH + 6,
          fill: CASE_COLOR[c], opacity: 0.055
        }, svg);
      }

      yearList.forEach((yr, yi) => {
        const v = D.scenarios[c][yr][cfg.scenario];
        const cx = gx + groupW / 2 + (yi === 0 ? -barW * 0.62 : barW * 0.62);
        const h = Math.max(1.5, (v / max) * plotH);
        el("rect", {
          x: cx - barW / 2, y: m.t + plotH - h, width: barW, height: h,
          fill: yi === 0 ? COLORS.white : CASE_COLOR[c],
          stroke: CASE_COLOR[c], "stroke-width": yi === 0 ? 1.6 : 0,
          opacity: yi === 0 ? 0.9 : c === state.scenario ? 1 : 0.52,
          class: "chart-bar",
          style: `animation-delay:${gi * 120 + yi * 55}ms`
        }, svg);
        if (!compact || yi === 1) {
          /* split anchors: outlined label ends left of the gap,
             solid label starts right of it — no mid-band collision */
          text(svg, yi === 0 ? cx - 6 : cx + 6, m.t + plotH - h - 6, fmtShortMoney(v), "chart-label", {
            "text-anchor": yi === 0 ? "end" : "start",
            "font-size": compact ? 10 : 8.8,
            fill: CASE_COLOR[c],
            opacity: c === state.scenario ? 1 : 0.7
          });
        }
      });

      text(svg, gx + groupW / 2, H - 13, SHORT[c], "axis-text", {
        "text-anchor": "middle",
        "font-size": compact ? 10.5 : 10,
        class: c === state.scenario ? "axis-text axis-text--strong" : "axis-text"
      });

      const hit = el("rect", {
        x: gx + 2, y: m.t - 6, width: groupW - 4, height: plotH + 12,
        fill: "transparent", style: "cursor:pointer"
      }, svg);
      hit.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("tcs:scenario", { detail: c }));
      });
    });

    text(svg, m.l, m.t - 12, `${cfg.label} (${cfg.axis === "eps" ? "₹ / share" : "₹ Cr"})`, "axis-text axis-text--muted", {
      "font-size": compact ? 10.5 : 9.5
    });
    text(svg, W - m.r, m.t - 12, "FY2027 outlined / FY2028 solid", "axis-text axis-text--muted", {
      "text-anchor": "end",
      "font-size": compact ? 10 : 9.2
    });
  }

  window.TCSCharts = Object.assign(window.TCSCharts || {}, {
    trend, growthData, margin, cash, compare, METRICS
  });
})();
