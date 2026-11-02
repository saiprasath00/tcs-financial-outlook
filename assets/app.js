/* ------------------------------------------------------------------
   TCS Financial Outlook — UI layer
   Controls, charts wiring, ledger, assumptions, previews, counters,
   scroll spy and announcements. All renders route through app-core;
   this layer only listens, wires and syncs.
------------------------------------------------------------------- */

(() => {
  "use strict";

  const D = window.TCS_DATA;
  const U = window.TCSUtil;
  const C = window.TCSCharts;
  const Core = window.TCSApp;
  const state = Core.state;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const live = $("#liveRegion");
  function announce(message) {
    if (live) live.textContent = message;
  }

  /* ----------------------------------------------------------------
     Charts
  ---------------------------------------------------------------- */

  const SPARK_COLORS = {
    revenue: U.COLORS.blue,
    ebitda: U.COLORS.teal,
    pat: U.COLORS.violet,
    fcf: U.COLORS.amber
  };

  const chartNodes = $$(
    "#heroChart, #runwayChart, #spreadChart, #trendChart, #marginChart, #cashChart, #compareChart, [data-kpi-spark], [data-sys-spark]"
  );
  const renderedCharts = new WeakSet();

  function drawChart(node, animated = false) {
    if (!node) return;
    if (node.id === "heroChart") C.hero(node, state);
    else if (node.id === "runwayChart") C.runway(node, state);
    else if (node.id === "spreadChart") C.spread(node, state);
    else if (node.id === "trendChart") C.trend(node, state);
    else if (node.id === "marginChart") C.margin(node, state);
    else if (node.id === "cashChart") C.cash(node, state);
    else if (node.id === "compareChart") C.compare(node, state);
    else if (node.dataset.kpiSpark) {
      const metric = node.dataset.kpiSpark;
      C.spark(node, Core.sparkValues(metric), SPARK_COLORS[metric]);
    } else if (node.dataset.sysSpark) {
      /* workbook chapter: the reported record only, never scenario-bound */
      const metric = node.dataset.sysSpark;
      C.spark(node, Core.historySpark(metric), SPARK_COLORS[metric]);
    }
    const svg = node.querySelector("svg");
    if (svg) {
      U.legibleText(svg, node);
      if (animated && !U.reduceMotion.matches && svg.animate) {
        svg.animate(
          [{ opacity: 0.42, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 410, easing: "cubic-bezier(.23, 1, .32, 1)" }
        );
      }
    }
    renderedCharts.add(node);
  }

  function redrawCharts(animated = false) {
    chartNodes.forEach((node) => {
      if (renderedCharts.has(node)) drawChart(node, animated);
    });
  }

  const chartHosts = new Map();
  chartNodes.forEach((node) => {
    const host = node.closest(".panel, .kpi, .plate, .hero-panel, .spark-card") || node;
    if (!chartHosts.has(host)) chartHosts.set(host, []);
    chartHosts.get(host).push(node);
  });

  let chartObserver = null;
  function observeCharts() {
    if (!("IntersectionObserver" in window)) return;
    chartObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (chartHosts.get(entry.target) || []).forEach(drawChart);
          chartObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    chartHosts.forEach((_, host) => chartObserver.observe(host));
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(redrawCharts, 180);
  });

  /* ----------------------------------------------------------------
     Ledger
  ---------------------------------------------------------------- */

  function ledgerRows() {
    const rows = D.historical.map((h) => ({
      year: h.year,
      kind: "reported",
      case: "Reported",
      revenue: h.revenue,
      ebitda: h.ebitda,
      ebit: h.ebit,
      pat: h.netProfit,
      eps: h.eps,
      cfo: null,
      fcf: h.fcf,
      employees: h.employees
    }));

    const a = D.actual;
    rows.push({
      year: a.year,
      kind: "actual",
      case: "Actual",
      revenue: a.revenue,
      ebitda: a.ebitda,
      ebit: a.ebit,
      pat: a.pat,
      eps: a.eps,
      cfo: a.cfo,
      fcf: a.fcf,
      employees: a.employees
    });

    D.meta.forecastYears.forEach((year) => {
      U.CASES.forEach((c) => {
        const row = D.scenarios[c][year];
        rows.push({ ...row, kind: "forecast", case: c });
      });
    });
    return rows;
  }

  function filteredRows() {
    const rows = ledgerRows();
    if (state.tableFilter === "actual") return rows.filter((r) => r.kind !== "forecast");
    if (state.tableFilter === "cases") return rows.filter((r) => r.kind === "forecast");
    return rows;
  }

  let lastRows = [];

  function dash() {
    return '<span class="dash">—</span>';
  }

  function numCell(value) {
    return value == null ? dash() : U.fmtNum(Math.round(value));
  }

  function epsCell(value) {
    return value == null ? dash() : U.fmtNum(value, 2);
  }

  function empCell(value) {
    return value == null ? dash() : U.fmtNum(Math.round(value));
  }

  function chipClass(name) {
    if (name === "Bear Case") return "bear";
    if (name === "Base Case") return "base";
    if (name === "Bull Case") return "bull";
    return "actual";
  }

  function renderLedger() {
    const body = $("#ledgerBody");
    if (!body) return;
    lastRows = filteredRows();
    body.innerHTML = lastRows
      .map((row) => {
        const isForecast = row.kind === "forecast";
        const isSelected =
          isForecast && row.case === state.scenario && row.year === state.year;
        const attrs = isForecast
          ? ` data-row-scenario="${row.case}" data-row-year="${row.year}" tabindex="0" aria-label="Select ${row.case}, ${row.year}"`
          : "";
        const yearBadge = row.kind === "actual" ? '<span class="year-badge">Actual</span>' : "";
        return `<tr class="${isForecast ? "is-forecast is-clickable" : ""} ${
          isSelected ? "is-selected" : ""
        }"${attrs}>
          <td>${row.year}${yearBadge}</td>
          <td><span class="case-cell"><span class="case-chip case-chip--${chipClass(
            row.case
          )}"></span>${row.case}</span></td>
          <td class="num">${numCell(row.revenue)}</td>
          <td class="num">${numCell(row.ebitda)}</td>
          <td class="num">${numCell(row.ebit)}</td>
          <td class="num">${numCell(row.pat)}</td>
          <td class="num">${epsCell(row.eps)}</td>
          <td class="num">${numCell(row.cfo)}</td>
          <td class="num">${numCell(row.fcf)}</td>
          <td class="num">${empCell(row.employees)}</td>
        </tr>`;
      })
      .join("");

    const count = $("#ledgerCount");
    if (count) count.textContent = `${lastRows.length} row${lastRows.length === 1 ? "" : "s"}`;
  }

  function selectRow(tr) {
    const scenario = tr.dataset.rowScenario;
    const year = tr.dataset.rowYear;
    if (!scenario || !year) return;
    update({ scenario, year }, `${scenario}, ${year} selected from the ledger.`);
  }

  const ledgerBody = $("#ledgerBody");
  if (ledgerBody) {
    ledgerBody.addEventListener("click", (evt) => {
      const tr = evt.target.closest("tr[data-row-scenario]");
      if (tr) selectRow(tr);
    });
    ledgerBody.addEventListener("keydown", (evt) => {
      if (evt.key !== "Enter" && evt.key !== " ") return;
      const tr = evt.target.closest("tr[data-row-scenario]");
      if (tr) {
        evt.preventDefault();
        selectRow(tr);
      }
    });
  }

  /* ----------------------------------------------------------------
     Assumptions
  ---------------------------------------------------------------- */

  function formatAssumption(value, unit) {
    if (value == null) return "n/a";
    if (unit === "%") return `${U.fmtNum(value * 100, 1)}%`;
    if (unit === "Cr") return U.fmtNum(value, 0);
    return U.fmtNum(value, 2);
  }

  function renderAssumptions() {
    const body = $("#assumptionBody");
    if (!body) return;
    const keys = { "Bear Case": "bear", "Base Case": "base", "Bull Case": "bull" };
    body.innerHTML = D.assumptions
      .map((row) => {
        const cells = U.CASES.map((c) => {
          const active = c === state.scenario;
          return `<td class="num ${active ? "is-selected" : ""}" data-assumption-cell="${c}" title="${row.note || ""}">${formatAssumption(
            row[keys[c]],
            row.unit
          )}</td>`;
        }).join("");
        return `<tr><td title="${row.note || ""}">${row.parameter}</td>${cells}<td>${row.unit}</td></tr>`;
      })
      .join("");
  }

  /* ----------------------------------------------------------------
     Controls and sync
  ---------------------------------------------------------------- */

  function syncControls() {
    $$("[data-scenario]").forEach((btn) => {
      const on = btn.dataset.scenario === state.scenario;
      btn.setAttribute("aria-pressed", String(on));
      if (btn.classList.contains("case-card")) btn.classList.toggle("is-selected", on);
    });
    $$("[data-year]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.year === state.year));
      btn.classList.toggle("is-active", btn.dataset.year === state.year);
    });
    $$("[data-trend-metric]").forEach((btn) => {
      const on = btn.dataset.trendMetric === state.trendMetric;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
    });
    $$("[data-compare-metric]").forEach((btn) => {
      const on = btn.dataset.compareMetric === state.compareMetric;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
    });
    $$("[data-table-filter]").forEach((btn) => {
      const on = btn.dataset.tableFilter === state.tableFilter;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
    });
    $$("[data-assumption-case]").forEach((th) => {
      th.classList.toggle("is-selected", th.dataset.assumptionCase === state.scenario);
    });
  }

  function renderAll(animated = false) {
    Core.renderHero();
    Core.renderKPIs();
    Core.renderContext();
    Core.renderTrend();
    Core.renderScenarios();
    Core.renderDrivers();
    renderLedger();
    renderAssumptions();
    syncControls();
    redrawCharts(animated);
  }

  const stateAnimations = new WeakMap();
  function animateSelection() {
    if (U.reduceMotion.matches) return;
    const heroStage = $(".hero-panel");
    const caseFlash = {
      "Bear Case": "#ff9aa1", "Base Case": "#ffc07a", "Bull Case": "#7fdec7"
    };
    if (heroStage?.animate) {
      stateAnimations.get(heroStage)?.cancel();
      stateAnimations.set(heroStage, heroStage.animate(
        [{ backgroundColor: caseFlash[state.scenario] }, { backgroundColor: "#ff7043" }],
        { duration: 520, easing: "cubic-bezier(.23, 1, .32, 1)" }
      ));
    }
    const selectors = [
      "#heroScenario", "#heroYear", "#heroDelta", "#contextNote",
      "#trendLatest", "#trendForecast", "#trendChange", "#driverTitle",
      ".case-card.is-selected", "#trendGrowthStrip", ".kpi-delta"
    ];
    $$(selectors.join(", ")).forEach((node, index) => {
      if (!node.animate) return;
      stateAnimations.get(node)?.cancel();
      const animation = node.animate(
        [{ opacity: 0.35, transform: "translateY(9px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 320, delay: Math.min(index * 24, 120), easing: "cubic-bezier(.23, 1, .32, 1)" }
      );
      stateAnimations.set(node, animation);
    });
  }

  function update(patch, message) {
    Object.assign(state, patch);
    renderAll(true);
    animateSelection();
    announce(
      message ||
        `${state.year === "FY2026" ? "FY2026 reported year" : `${state.scenario}, ${state.year}`} selected. All outputs updated.`
    );
  }

  document.addEventListener("click", (evt) => {
    const scenarioBtn = evt.target.closest("[data-scenario]");
    if (scenarioBtn) {
      update({ scenario: scenarioBtn.dataset.scenario });
      return;
    }
    const yearBtn = evt.target.closest("[data-year]");
    if (yearBtn) {
      update({ year: yearBtn.dataset.year });
      return;
    }
    const trendChip = evt.target.closest("[data-trend-metric]");
    if (trendChip) {
      update({ trendMetric: trendChip.dataset.trendMetric }, `${trendChip.textContent.trim()} trend selected.`);
      return;
    }
    const compareChip = evt.target.closest("[data-compare-metric]");
    if (compareChip) {
      update({ compareMetric: compareChip.dataset.compareMetric }, `${compareChip.textContent.trim()} comparison selected.`);
      return;
    }
    const filterBtn = evt.target.closest("[data-table-filter]");
    if (filterBtn) {
      update({ tableFilter: filterBtn.dataset.tableFilter }, `${filterBtn.textContent.trim()} shown.`);
      return;
    }
    if (evt.target.closest("#resetView")) {
      update(
        {
          scenario: D.meta.defaultScenario,
          year: D.meta.defaultYear,
          trendMetric: "revenue",
          compareMetric: "revenue"
        },
        "View reset to Base Case, FY2028."
      );
      return;
    }
    if (evt.target.closest("#exportCsv") || evt.target.closest("#exportCsvLedger")) exportCsv();
  });

  window.addEventListener("tcs:scenario", (evt) => {
    if (U.CASES.includes(evt.detail)) update({ scenario: evt.detail });
  });

  /* ----------------------------------------------------------------
     CSV — exports exactly the rows the ledger is showing
  ---------------------------------------------------------------- */

  function csvCell(value) {
    if (value == null) return "";
    return `"${String(value).replace(/"/g, '""')}"`;
  }

  function exportCsv() {
    const header = [
      "Fiscal year",
      "Case",
      "Revenue (INR Cr)",
      "EBITDA proxy (INR Cr)",
      "EBIT (INR Cr)",
      "PAT / Net profit (INR Cr)",
      "EPS (INR per share)",
      "CFO (INR Cr)",
      "FCF (INR Cr)",
      "Employees"
    ];
    const rows = lastRows.length ? lastRows : filteredRows();
    const lines = [header.map(csvCell).join(",")];
    rows.forEach((r) => {
      lines.push(
        [
          r.year,
          r.case,
          r.revenue,
          r.ebitda,
          r.ebit,
          r.pat,
          r.eps,
          r.cfo,
          r.fcf,
          r.employees
        ].map(csvCell).join(",")
      );
    });
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tcs-financial-outlook-${state.tableFilter}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
    announce(`${rows.length} rows exported as CSV.`);
  }

  /* ----------------------------------------------------------------
     Previews (method chapter)
  ---------------------------------------------------------------- */

  function initPreviews() {
    const dialog = $("#previewDialog");
    if (!dialog) return;
    $$("[data-preview]").forEach((card) => {
      card.addEventListener("click", () => {
        $("#previewDialogTitle").textContent = card.dataset.previewTitle;
        const image = $("#previewDialogImage");
        image.src = card.dataset.preview;
        image.alt = `Static layout preview: ${card.dataset.previewTitle}`;
        $("#previewDialogNote").textContent = card.dataset.previewNote;
        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "");
      });
    });
    dialog.addEventListener("click", (evt) => {
      if (evt.target === dialog) dialog.close();
    });
    const close = dialog.querySelector(".dialog-close");
    if (close) close.addEventListener("click", () => dialog.close());
  }

  /* ----------------------------------------------------------------
     Counters (evidence band)
  ---------------------------------------------------------------- */

  function initCounters() {
    const band = $(".evidence-band");
    if (!band) return;
    const counters = $$("[data-count]", band);
    const run = () => {
      counters.forEach((node) => {
        const target = Number(node.dataset.count);
        if (U.reduceMotion.matches || !target) {
          node.textContent = String(target);
          return;
        }
        const start = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - start) / 950);
          node.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
          if (t < 1) requestAnimationFrame(step);
        };
        node.textContent = "0";
        requestAnimationFrame(step);
      });
    };
    if (!("IntersectionObserver" in window)) {
      run();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );
    observer.observe(band);
  }

  /* ----------------------------------------------------------------
     Scroll spy + progress
  ---------------------------------------------------------------- */

  const SECTION_LABELS = {
    overview: "00 / Overview",
    workbook: "01 / Workbook",
    trend: "02 / Trend",
    futures: "03 / Futures",
    margins: "04 / Margins",
    ledger: "05 / Ledger",
    method: "06 / Method"
  };

  const sectionNodes = ["overview", "workbook", "trend", "futures", "margins", "ledger", "method"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function initChapterMotion() {
    if (!("IntersectionObserver" in window)) return;
    const chapterMotion = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-entering");
        chapterMotion.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    sectionNodes.forEach((section) => chapterMotion.observe(section));
  }

  function setActiveSection(id) {
    const label = $("#topbarSection");
    if (label) label.textContent = SECTION_LABELS[id] || SECTION_LABELS.overview;
    $$("[data-nav]").forEach((link) => {
      const on = link.dataset.nav === id;
      link.classList.toggle("is-active", on);
      if (on) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function onScroll() {
    const doc = document.documentElement;
    let current = sectionNodes[0] ? sectionNodes[0].id : "overview";
    sectionNodes.forEach((section) => {
      if (section.getBoundingClientRect().top <= 170) current = section.id;
    });
    if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) {
      current = sectionNodes[sectionNodes.length - 1].id;
    }
    setActiveSection(current);
  }

  if ("IntersectionObserver" in window) {
    const chapterSpy = new IntersectionObserver(onScroll, {
      rootMargin: "-5% 0px -75% 0px",
      threshold: 0
    });
    sectionNodes.forEach((section) => chapterSpy.observe(section));
  }
  window.addEventListener("resize", onScroll);

  /* ----------------------------------------------------------------
     Boot
  ---------------------------------------------------------------- */

  function init() {
    initChapterMotion();
    renderAll();
    chartNodes.forEach(drawChart);
    observeCharts();
    initCounters();
    initPreviews();
    onScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
