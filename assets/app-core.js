/* ------------------------------------------------------------------
   TCS Financial Outlook — application core
   State, headline bindings, trend statistics, scenario outputs.
   FY2026 is reported (statutory PAT); FY2027–FY2028 are analytical cases.
------------------------------------------------------------------- */

(() => {
  "use strict";

  const D = window.TCS_DATA;
  const U = window.TCSUtil;
  const C = window.TCSCharts;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = {
    scenario: D.meta.defaultScenario,
    year: D.meta.defaultYear,
    trendMetric: "revenue",
    compareMetric: "revenue",
    tableFilter: "all"
  };

  /* Case rows exist only for FY2027–FY2028; selecting FY2026 pins every
     case-dependent number to the reported actuals. */
  const selected = () =>
    state.year === "FY2026"
      ? D.actual
      : D.scenarios[state.scenario][state.year];

  const caseRow = (caseName, year) =>
    year === "FY2026" ? D.actual : D.scenarios[caseName][year];

  const shortCase = (c) => U.SHORT[c];

  const pathOf = (metric) => {
    const cfg = C.METRICS[metric];
    return {
      hist: cfg.hist,
      actual: cfg.actual,
      scenario: cfg.scenario,
      axis: cfg.axis
    };
  };

  const numberFrames = new WeakMap();

  function animateNumber(node, target, digits = 0, duration = 580) {
    if (!node || target == null) return;
    const pending = numberFrames.get(node);
    if (pending) {
      cancelAnimationFrame(pending);
      numberFrames.delete(node);
    }
    const visible = Number(String(node.textContent).replace(/[^\d.-]/g, ""));
    const previous = Number.isFinite(visible) && node.textContent.trim() !== "n/a"
      ? visible : Number(node.dataset.value || 0);
    node.dataset.value = String(target);
    if (U.reduceMotion.matches || previous === target) {
      node.textContent = U.fmtNum(target, digits);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = U.fmtNum(previous + (target - previous) * eased, digits);
      if (t < 1) numberFrames.set(node, requestAnimationFrame(tick));
      else {
        node.textContent = U.fmtNum(target, digits);
        numberFrames.delete(node);
      }
    };
    numberFrames.set(node, requestAnimationFrame(tick));
  }

  function clearNumber(node) {
    const pending = numberFrames.get(node);
    if (pending) cancelAnimationFrame(pending);
    numberFrames.delete(node);
    node.textContent = "n/a";
    delete node.dataset.value;
  }

  function applyDelta(node, pct) {
    if (!node) return;
    node.classList.remove("is-down", "is-flat");
    if (pct == null || Number.isNaN(pct)) {
      node.textContent = "—";
      node.classList.add("is-flat");
      return;
    }
    node.textContent = U.fmtPct(pct, 1);
    if (pct < -0.05) node.classList.add("is-down");
    else if (Math.abs(pct) < 0.05) node.classList.add("is-flat");
  }

  /* The honest comparand: FY2026 PAT/CFO/EPS came from the filing; FCF has
     no FY2026 figure anywhere, so its "prior" stays FY2025. */
  function prior(metric) {
    if (state.year === "FY2026") {
      return { value: D.historical[7][metric === "pat" ? "netProfit" : metric], label: "vs FY2025" };
    }
    if (state.year === "FY2028") {
      return { value: D.scenarios[state.scenario].FY2027[metric], label: "vs FY2027" };
    }
    if (metric === "fcf") {
      return { value: D.historical[7].fcf, label: "vs FY2025" };
    }
    return { value: D.actual[metric], label: "vs FY2026" };
  }

  function sparkValues(metric) {
    const cfg = C.METRICS[metric];
    return D.meta.years.map((year, i) => {
      if (i < 8) return D.historical[i][cfg.hist];
      if (i === 8) return D.actual[cfg.actual];
      return D.scenarios[state.scenario][year][cfg.scenario];
    });
  }

  /* Reported-only sparklines for the workbook chapter (never scenario-bound). */
  function historySpark(metric) {
    const cfg = C.METRICS[metric];
    return D.historical.map((h) => h[cfg.hist]);
  }

  /* ----------------------------------------------------------------
     Headline
  ---------------------------------------------------------------- */

  function renderHero() {
    const row = selected();
    if ($("#heroValue")) animateNumber($("#heroValue"), row.revenue);
    $("#heroScenario").textContent = state.year === "FY2026" ? "Reported" : state.scenario;
    $("#heroYear").textContent = state.year;

    const p = prior("revenue");
    applyDelta($("#heroDelta"), p.value ? (row.revenue / p.value - 1) * 100 : null);
    $("#heroDeltaLabel").textContent = p.label;
    $("#heroActual").textContent = U.fmtCr(D.actual.revenue);

    const range = U.CASES.map((c) => caseRow(c, state.year).revenue);
    const min = Math.min(...range);
    const max = Math.max(...range);
    $("#heroRange").textContent = min === max
      ? `${U.fmtShortMoney(min)} Cr · reported`
      : `${U.fmtShortMoney(min)} – ${U.fmtShortMoney(max)} Cr`;
  }

  function renderKPIs() {
    $("#kpiTitle").textContent = state.year === "FY2026"
      ? `${state.year} · reported`
      : `${state.scenario} · ${state.year}`;
    ["revenue", "ebitda", "pat", "fcf"].forEach((metric) => {
      const value = selected()[metric];
      const valueNode = $(`[data-kpi-value="${metric}"]`);
      if (value == null) {
        /* FY2026 FCF: keep the empty slot honest, never a stale number. */
        clearNumber(valueNode);
      } else {
        animateNumber(valueNode, value);
      }
      const p = prior(metric);
      applyDelta(
        $(`[data-kpi-delta="${metric}"]`),
        p.value && value != null ? (value / p.value - 1) * 100 : null
      );
      const compare = $(`[data-kpi-compare="${metric}"]`);
      if (compare) {
        compare.textContent = value == null && metric === "fcf"
          ? "FY2026 slot kept empty"
          : p.label;
      }
    });
  }

  function renderContext() {
    const row = selected();
    $("#contextScenario").textContent = state.year === "FY2026" ? "Reported" : state.scenario;
    $("#contextYear").textContent = state.year;
    $("#contextVsActual").textContent = U.fmtPct((row.revenue / D.actual.revenue - 1) * 100, 1);

    $$(".case-scale-dot").forEach((dot) => {
      dot.classList.toggle("is-active", dot.dataset.caseDot === state.scenario);
    });

    const notes = {
      "Base Case": "Base sits between the two sensitivity cases. Select any case to move every selected output together.",
      "Bear Case": "The downside case is the lowest of the three. Larger downside is possible; this is a bounded sensitivity, not a stress test.",
      "Bull Case": "The upside case is the highest of the three. It is a sensitivity, not a promise that operating leverage will appear."
    };
    $("#contextNote").textContent = state.year === "FY2026"
      ? "With FY2026 selected every case resolves to the reported year — the actuals are the same for all three."
      : notes[state.scenario];

    const rows = U.CASES.map((c) => caseRow(c, state.year).revenue);
    const min = Math.min(...rows);
    const max = Math.max(...rows);
    $("#spreadTitle").innerHTML = min === max
      ? `${U.fmtShortMoney(min)} <small>Cr</small>`
      : `${U.fmtShortMoney(min)} — ${U.fmtShortMoney(max).replace("₹", "")} <small>Cr</small>`;
    /* the badge is a sibling of the value node, never inside it —
       innerHTML writes above must not destroy it */
    $("#spreadBadge").textContent = state.year;
  }

  /* ----------------------------------------------------------------
     Trend & profitability
  ---------------------------------------------------------------- */

  function renderTrend() {
    const cfg = C.METRICS[state.trendMetric];
    const latestIndex = state.trendMetric === "fcf" ? 7 : 8;
    const latest = latestIndex === 7 ? D.historical[7] : D.actual;
    const latestValue = latestIndex === 7 ? D.historical[7][cfg.hist] : D.actual[cfg.actual];
    const latestLabel = latestIndex === 7 ? "FY2025 reported" : "FY2026 actual";
    const forecastText =
      state.year === "FY2026"
        ? D.actual[cfg.actual]
        : D.scenarios[state.scenario][state.year][cfg.scenario];
    const forecastLabel =
      state.year === "FY2026"
        ? "FY2026 · actual"
        : `${state.year} · ${state.scenario}`;

    $("#trendTitle").textContent = cfg.label;
    $("#trendCaption").textContent =
      `${cfg.note} Bars are direct-labelled at the latest actual and the selected forecast year.`;
    $("#trendFootCase").textContent = state.year === "FY2026"
      ? `While FY2026 is selected, the case (currently ${state.scenario}) does not apply`
      : `Assumption base: ${state.scenario}`;
    $("#trendLatestKicker").textContent = "Latest actual";

    $("#trendLatest").innerHTML = cfg.axis === "eps"
      ? U.fmtEps(latestValue)
      : `${U.fmtCr(latestValue).replace(" Cr", "")} <small>Cr</small>`;
    $("#trendLatestLabel").textContent = latestLabel;

    const cagr7 = Math.pow(D.historical[7][cfg.hist] / D.historical[0][cfg.hist], 1 / 7) - 1;
    const cagr3 = Math.pow(D.historical[7][cfg.hist] / D.historical[4][cfg.hist], 1 / 3) - 1;
    $("#trendCagr").textContent = `${U.fmtNum(cagr7 * 100, 1)}%`;
    $("#trendCagr3").textContent = `${U.fmtNum(cagr3 * 100, 1)}%`;

    $("#trendForecastLabel").textContent = forecastLabel;
    $("#trendForecast").innerHTML = cfg.axis === "eps"
      ? U.fmtEps(forecastText)
      : `${U.fmtCr(forecastText).replace(" Cr", "")} <small>Cr</small>`;
    $("#trendChange").textContent = `${U.fmtPct((forecastText / latestValue - 1) * 100, 1)} vs ${
      latestIndex === 7 ? "FY2025" : "FY2026"
    } · ${cfg.axis === "eps" ? "₹ per share" : "₹ crore"}`;

    const notes = {
      revenue: "Series: reported FY2018–FY2025 → FY2026 actual ₹2,67,021 Cr → the selected analytical case. Not a projection of guidance.",
      ebitda: "Reported EBITDA through FY2025; FY2026 and the forecast years use the model proxy (EBIT + depreciation), defined consistently across the series.",
      pat: "Reported PAT through FY2025; FY2026 is statutory PAT ₹49,454 Cr from the results filing; FY2027 onward is the selected case.",
      eps: "Reported diluted EPS through FY2025; FY2026 = ₹136.01 from the filing; the forecast follows the model's PAT ÷ shares bridge.",
      fcf: "Reported FCF FY2018–FY2025. FY2026 is drawn empty on purpose — TCS reports ₹52,094 Cr operating cash flow but no FCF line. FY2027 onward is the selected case."
    };
    $("#trendNote").textContent = notes[state.trendMetric];

    renderGrowthStrip();
  }

  function renderGrowthStrip() {
    const wrap = $("#trendGrowthStrip");
    if (!wrap) return;
    const data = C.growthData(state.trendMetric, state.scenario);
    const maxAbs = Math.max(...data.map((d) => Math.abs(d.growth || 0)), 1);
    const mid = 26;
    const maxBar = 17;
    wrap.innerHTML = data
      .map((d) => {
        if (d.growth == null) {
          return `<div class="growth-cell"><span class="growth-label num">—</span></div>`;
        }
        const h = Math.max(1.5, (Math.abs(d.growth) / maxAbs) * maxBar);
        const positive = d.growth >= 0;
        const style = positive
          ? `top:${mid - h}px;height:${h}px`
          : `top:${mid}px;height:${h}px`;
        return `<div class="growth-cell" title="${d.year}: ${U.fmtPct(d.growth, 1)}">
          <span class="growth-bar ${positive ? "" : "is-negative"} ${
          d.kind === "forecast" ? "is-forecast" : ""
        }" style="${style}"></span>
          <span class="growth-label num">${d.growth >= 0 ? "+" : "−"}${U.fmtNum(Math.abs(d.growth), 1)}%</span>
        </div>`;
      })
      .join("");
  }

  /* ----------------------------------------------------------------
     Scenario cards and drivers
  ---------------------------------------------------------------- */

  function renderScenarios() {
    const base = caseRow("Base Case", state.year).revenue;
    const rows = U.CASES.map((c) => caseRow(c, state.year));
    const revenues = rows.map((r) => r.revenue);
    const min = Math.min(...revenues);
    const max = Math.max(...revenues);

    U.CASES.forEach((c, idx) => {
      const row = rows[idx];
      animateNumber($(`[data-case-value="${c}"]`), row.revenue);
      const yearEl = $(`[data-case-year="${c}"]`);
      if (yearEl) yearEl.textContent = state.year;
      const metricEl = $(`[data-case-metric="${c}"]`);
      if (metricEl) metricEl.textContent = "Revenue";
      const delta = $(`[data-case-delta="${c}"]`);
      if (state.year === "FY2026") {
        if (delta) delta.textContent = "Reported";
      } else if (c === "Base Case") {
        if (delta) delta.textContent = "The modelled baseline";
      } else if (delta) {
        delta.textContent = `${U.fmtPct((row.revenue / base - 1) * 100, 1)} vs Base`;
      }
      const fill = $(`[data-case-fill="${c}"]`);
      if (fill) {
        fill.style.width = state.year === "FY2026"
          ? "100%"
          : `${12 + 88 * ((row.revenue - min) / (max - min || 1))}%`;
      }
    });

    const spread = max - min;
    const spreadEl = $("#caseSpreadLine");
    if (spreadEl) {
      spreadEl.textContent = state.year === "FY2026"
        ? "FY2026: one reported truth — every case resolves to the actuals."
        : `${state.year} revenue spread: ${U.fmtCr(spread)} between the Bear and Bull cases.`;
    }
    $("#compareTitle").textContent = `${C.METRICS[state.compareMetric].label} · FY2027 vs FY2028`;
  }

  function renderDrivers() {
    const row = selected();
    const prev = state.year === "FY2026"
      ? D.historical[7]
      : state.year === "FY2027"
        ? D.actual
        : D.scenarios[state.scenario].FY2027;
    const baseRevenue = D.actual.revenue;

    const items = [
      {
        label: "Revenue growth",
        value: `${U.fmtPct((row.revenue / prev.revenue - 1) * 100, 1)} YoY`,
        pct: (row.revenue / prev.revenue - 1) * 100,
        max: 20
      },
      {
        label: "EBITDA margin (model)",
        value: `${U.fmtNum((row.ebitda / row.revenue) * 100, 1)}%`,
        pct: (row.ebitda / row.revenue) * 100,
        max: 40
      },
      {
        label: "PAT margin",
        value: `${U.fmtNum((row.pat / row.revenue) * 100, 1)}%`,
        pct: (row.pat / row.revenue) * 100,
        max: 30
      },
      {
        label: "FCF conversion",
        value: row.fcf == null
          ? "n/a — FY2026 FCF empty"
          : `${U.fmtNum((row.fcf / row.pat) * 100, 1)}% of PAT`,
        pct: row.fcf == null ? null : (row.fcf / row.pat) * 100,
        max: 120
      },
      {
        label: "EPS growth",
        value: row.eps == null ? "n/a" : `${U.fmtPct((row.eps / prev.eps - 1) * 100, 1)} YoY`,
        pct: row.eps == null ? null : (row.eps / prev.eps - 1) * 100,
        max: 20
      },
      {
        label: "Revenue vs FY2026 actual",
        value: U.fmtPct((row.revenue / baseRevenue - 1) * 100, 1),
        pct: (row.revenue / baseRevenue - 1) * 100,
        max: 40
      }
    ];

    $("#driverTitle").textContent = state.year === "FY2026"
      ? "FY2026 · reported"
      : `${state.scenario} · ${state.year}`;
    $("#driverList").innerHTML = items
      .map((item) => {
        const negative = item.pct != null && item.pct < 0;
        const width = item.pct == null ? 0 : Math.min(100, (Math.abs(item.pct) / item.max) * 100);
        return `<div class="driver-item">
          <div class="driver-line"><span class="driver-name">${item.label}</span><span class="driver-value">${item.value}</span></div>
          <div class="driver-meter"><span class="${negative ? "is-negative" : ""}" style="width:${width}%"></span></div>
        </div>`;
      })
      .join("");
  }

  window.TCSApp = {
    state,
    selected,
    caseRow,
    prior,
    sparkValues,
    historySpark,
    animateNumber,
    applyDelta,
    renderHero,
    renderKPIs,
    renderContext,
    renderTrend,
    renderScenarios,
    renderDrivers,
    metricConfig: C.METRICS
  };
})();
