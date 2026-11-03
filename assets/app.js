/* ------------------------------------------------------------------
 TCS Financial Outlook — UI layer
 Controls, charts wiring, the Case Lever, ledger, assumptions,
 previews, counters, scroll spy, URL state and announcements.
 All renders route through app-core; this layer only listens,
 wires and syncs.

 ONE MUTATION POINT: update(patch, message). Every interaction —
 chip, lever, ledger row, URL — funnels through it. app-core.js
 still owns the state object and the render functions; this file
 never writes state directly.
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
  const reduceMotion = U.reduceMotion;

  /* ----------------------------------------------------------------
 Live region
 ---------------------------------------------------------------- */

  const live = $("#liveRegion");
  let announceTimer = 0;
  function announce(message, immediate = false) {
    if (!live || !message) return;
    clearTimeout(announceTimer);
    const write = () => {
      /* clear first so an identical string is still announced */
      live.textContent = "";
      requestAnimationFrame(() => {
        live.textContent = message;
      });
    };
    if (immediate) write();
    else announceTimer = setTimeout(write, 60);
  }

  /* ----------------------------------------------------------------
 Chart hosts — field ink + routing
 ---------------------------------------------------------------- */

  const SPARK_COLORS = {
    revenue: U.COLORS.blue,
    ebitda: U.COLORS.teal,
    pat: U.COLORS.violet,
    fcf: U.COLORS.amber
  };

  /* Which field each chart sits on. charts.css resolves --series-* from
 the [data-field] attribute, so this is what re-inks a chart. */
  const CHART_FIELD = {
    heroChart: "cobalt",
    trendChart: "teal",
    runwayChart: "midnight",
    compareChart: "midnight",
    marginChart: "oxblood",
    cashChart: "oxblood",
    spreadChart: "midnight"
  };

  window.TCSUtil.CASE_COLOR = U.CASE_COLOR;

  function stampChartFields() {
    Object.entries(CHART_FIELD).forEach(([id, field]) => {
      const node = document.getElementById(id);
      if (node) {
        node.setAttribute("data-field", field);
        /* every chart with a year axis gets a keyboard entry point, including
 the ones drawn by charts.js which does not set tabindex itself */
        if (!node.hasAttribute("tabindex")) node.setAttribute("tabindex", "0");
      }
    });
    /* the workbook sparklines live on warm paper */
    $$("[data-sys-spark]").forEach((n) => n.setAttribute("data-field", "paper"));
    /* the futures KPI sparks live on midnight */
    $$("[data-kpi-spark]").forEach((n) => n.setAttribute("data-field", "midnight"));
  }

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
      /* workbook chapter: reported record only, never scenario-bound */
      const metric = node.dataset.sysSpark;
      C.spark(node, Core.historySpark(metric), SPARK_COLORS[metric]);
    }
    const svg = node.querySelector("svg");
    if (svg) {
      U.legibleText(svg, node);
      if (animated && !reduceMotion.matches && svg.animate) {
        svg.animate(
          [{ opacity: 0.42, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 380, easing: "cubic-bezier(.22, 1, .36, 1)" }
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
    const host = node.closest(".panel, .kpi, .plate, .hero-panel, .spark-card, .lever") || node;
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
 DOM hooks this layer owns
 index.html is owned by another agent, so if a hook is absent the
 layer MOUNTS it at the right place rather than silently no-oping.
 Each mount is idempotent and marked data-mounted-by="app.js" so a
 later author-supplied element simply supersedes it.
 ---------------------------------------------------------------- */

  function ensureHook(selector, mount, tag = "div", attrs = {}) {
    let node = $(selector);
    if (node) return node;
    node = document.createElement(tag);
    node.id = selector.replace(/^#/, "");
    node.setAttribute("data-mounted-by", "app.js");
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    mount(node);
    return node;
  }

  function mountHooks() {
    /* the Case Lever sits in #futures, under the chapter head */
    const futuresShell = $("#futures .shell");
    if (futuresShell) {
      const head = futuresShell.querySelector(".chapter-head");
      ensureHook("#caseLever", (n) => {
        n.className = "lever";
        if (head && head.nextSibling) head.parentNode.insertBefore(n, head.nextSibling);
        else futuresShell.prepend(n);
      });
    }

    /* the footer state stamp is the last thing before the footer copy */
    const footer = $(".footer");
    if (footer) {
      ensureHook(
        "#footerState",
        (n) => {
          n.className = "footer-state";
          n.setAttribute("aria-live", "off");
          const row = footer.querySelector(".footer-row");
          if (row) row.parentNode.insertBefore(n, row);
          else footer.appendChild(n);
        },
        "div"
      );
    }

    /* the marquee's Δ column mirrors the three cases#7).
 index.html now authors these items, so this is a fallback only:
 it adds nothing when markup already provides one item per case. */
    const track = $(".marquee-field [data-marquee-group], .marquee-field ul");
    if (track) {
      const present = new Set(
        Array.from(track.querySelectorAll("[data-marquee-case]")).map((i) => i.dataset.marqueeCase)
      );
      const year = state.year === "FY2026" ? "FY2028" : state.year;
      ["Bear Case", "Base Case", "Bull Case"].forEach((c) => {
        if (present.has(c)) return;
        const li = document.createElement("li");
        li.className = "marquee-item";
        li.setAttribute("data-marquee-case", c);
        li.innerHTML = `<span>${c.replace(" Case", "")} ${year}</span><b>₹${U.fmtNum(
          D.scenarios[c][year].revenue
        )}</b><span data-marquee-delta="${c}">—</span>`;
        track.appendChild(li);
      });
    }
  }

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

  const dash = () => '<span class="dash">—</span>';
  /* the FY2026 FCF slot is the one number the model refuses to invent */
  const notDisclosed = () =>
    '<span class="not-disclosed" title="TCS reported ₹52,094 Cr operating cash flow for FY2026 but no free cash flow line">Not disclosed</span>';

  function numCell(value) {
    return value == null ? dash() : U.fmtNum(Math.round(value));
  }
  function epsCell(value) {
    return value == null ? dash() : U.fmtNum(value, 2);
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
      .map((row, index) => {
        const isForecast = row.kind === "forecast";
        const isSelected = isForecast && row.case === state.scenario && row.year === state.year;
        const attrs = isForecast
          ? ` data-row-scenario="${row.case}" data-row-year="${row.year}" tabindex="0" aria-selected="${isSelected}"`
          : "";
        const yearBadge = row.kind === "actual" ? '<span class="year-badge">Actual</span>' : "";
        const fcfCell =
          row.kind === "actual" && row.fcf == null ? notDisclosed() : numCell(row.fcf);
        return `<tr class="${isForecast ? "is-forecast is-clickable" : ""} ${
          isSelected ? "is-selected" : ""
        }" data-row-index="${index + 1}"${attrs}>
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
          <td class="num">${fcfCell}</td>
          <td class="num">${numCell(row.employees)}</td>
        </tr>`;
      })
      .join("");

    const count = $("#ledgerCount");
    if (count) {
      const shown = lastRows.length;
      const total = ledgerRows().length;
      count.textContent = shown === total ? `${total} rows` : `${shown} of ${total} rows`;
    }
    body.querySelectorAll(".not-disclosed").forEach((n) => {
      n.setAttribute("aria-label", "Not disclosed");
    });
  }

  function selectRow(tr) {
    const scenario = tr.dataset.rowScenario;
    const year = tr.dataset.rowYear;
    if (!scenario || !year) return;
    const row = U.CASES.indexOf(scenario) >= 0 ? D.scenarios[scenario][year] : D.actual;
    update(
      { scenario, year },
      `${scenario}, ${year} adopted from the ledger. Revenue ₹${U.fmtNum(row.revenue)} crore. Every chart, card and figure follows.`
    );
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
          const active = c === state.scenario && state.year !== "FY2026";
          return `<td class="num ${active ? "is-selected" : ""}" data-assumption-cell="${c}" title="${
            row.note || ""
          }">${formatAssumption(row[keys[c]], row.unit)}</td>`;
        }).join("");
        return `<tr><td title="${row.note || ""}">${row.parameter}</td>${cells}<td>${row.unit}</td></tr>`;
      })
      .join("");
  }

  /* ----------------------------------------------------------------
 THE CASE LEVER — the live thing
 ---------------------------------------------------------------- */

  const LEVER_METRICS = [
    { key: "revenue", label: "Revenue", unit: "₹ Cr", axis: "money" },
    { key: "pat", label: "Net profit", unit: "₹ Cr", axis: "money" },
    { key: "eps", label: "EPS", unit: "₹", axis: "eps" },
    { key: "fcf", label: "Free cash flow", unit: "₹ Cr", axis: "money" }
  ];

  const CASE_ORDER = ["Bear Case", "Base Case", "Bull Case"];
  const CASE_SLUG = { "Bear Case": "bear", "Base Case": "base", "Bull Case": "bull" };

  /* The lever is built once, then only mirrored. It is a real control:
 a range input with three detents, arrow-keyable, 44px tall. */
  function buildLever() {
    const host = $("#caseLever");
    if (!host || host.dataset.built) return;
    host.dataset.built = "1";
    host.innerHTML = `
      <div class="lever-head">
        <span class="foot-label">The case lever</span>
        <span class="lever-hint" id="leverHint">Drag, click a detent, or press 1 / 2 / 3</span>
      </div>
      <div class="lever-stripe" aria-hidden="true">
        <span data-stop="bear"></span><span data-stop="base"></span><span data-stop="bull"></span>
      </div>
      <div class="lever-track">
        <input type="range" id="caseLeverInput" min="0" max="2" step="1" value="1"
               aria-label="Case lever: Bear to Bull" aria-valuetext="Base Case">
      </div>
      <div class="lever-detents" role="group" aria-label="Case detents">
        <button type="button" data-lever-detent="Bear Case" aria-pressed="false">
          Bear<span class="detent-delta" data-detent-delta="Bear Case">—</span>
        </button>
        <button type="button" data-lever-detent="Base Case" aria-pressed="true">
          Base<span class="detent-delta" data-detent-delta="Base Case">baseline</span>
        </button>
        <button type="button" data-lever-detent="Bull Case" aria-pressed="false">
          Bull<span class="detent-delta" data-detent-delta="Bull Case">—</span>
        </button>
      </div>
      <div class="lever-outputs" id="leverOutputs">
        ${LEVER_METRICS.map(
          (m) => `<div class="lever-output" data-lever-out="${m.key}">
            <h3>${m.label} · FY28</h3>
            <span class="lever-value" data-lever-value="${m.key}">—</span><span class="lever-unit">${m.unit}</span>
            <div class="lever-beacon" aria-hidden="true"><span data-lever-beacon="${m.key}"></span></div>
            <div class="lever-delta" data-lever-delta="${m.key}">—</div>
          </div>`
        ).join("")}
      </div>
      <p class="lever-note" id="leverNote"></p>`;
  }

  function leverValues(caseName, year) {
    const row = D.scenarios[caseName][year];
    return LEVER_METRICS.map((m) => ({
      key: m.key,
      label: m.label,
      axis: m.axis,
      unit: m.unit,
      value: row[m.key]
    }));
  }

  function renderLever() {
    const input = $("#caseLeverInput");
    if (!input) return;
    const year = state.year === "FY2026" ? "FY2028" : state.year;
    const index = CASE_ORDER.indexOf(state.scenario);
    input.value = String(index);
    input.setAttribute("aria-valuetext", state.scenario);
    input.disabled = state.year === "FY2026";

    $$("[data-lever-detent]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.leverDetent === state.scenario));
    });
    $$(".lever-stripe span").forEach((s) => {
      s.classList.toggle("is-live", s.dataset.stop === CASE_SLUG[state.scenario]);
    });

    const base = D.scenarios["Base Case"][year];
    const current = D.scenarios[state.scenario][year];
    const all = {};
    CASE_ORDER.forEach((c) => (all[c] = D.scenarios[c][year]));

    LEVER_METRICS.forEach((m) => {
      const valueNode = $(`[data-lever-value="${m.key}"]`);
      const deltaNode = $(`[data-lever-delta="${m.key}"]`);
      const beacon = $(`[data-lever-beacon="${m.key}"]`);
      const v = current[m.key];
      if (valueNode) {
        U.animateNum
          ? U.animateNum(valueNode, v, m.axis === "eps" ? 2 : 0)
          : (valueNode.textContent = m.axis === "eps" ? U.fmtNum(v, 2) : U.fmtNum(v, 0));
      }
      /* beacon = where this value sits in the Bear→Bull span of the metric */
      if (beacon) {
        const lo = all["Bear Case"][m.key];
        const hi = all["Bull Case"][m.key];
        const span = hi - lo || 1;
        const pos = U.clamp(((v - lo) / span) * 100, 0, 100);
        beacon.style.width = `${pos}%`;
      }
      if (deltaNode) {
        const isBase = state.scenario === "Base Case" || state.year === "FY2026";
        deltaNode.classList.remove("is-up", "is-down");
        if (isBase) {
          deltaNode.textContent = "Δ BASE —";
        } else {
          const abs = v - base[m.key];
          const pct = (v / base[m.key] - 1) * 100;
          const sign = abs > 0 ? "+" : "−";
          const absText =
            m.axis === "eps" ? U.fmtNum(Math.abs(abs), 2) : U.fmtNum(Math.round(Math.abs(abs)));
          deltaNode.textContent = `Δ BASE ${sign}${absText} · ${U.fmtPct(pct, 1)}`;
          deltaNode.classList.add(abs > 0 ? "is-up" : "is-down");
        }
      }
    });

    /* detent deltas vs Base, so the track reads as a range */
    const revBase = D.scenarios["Base Case"][year].revenue;
    $$("[data-detent-delta]").forEach((n) => {
      const c = n.dataset.detentDelta;
      n.textContent =
        c === "Base Case"
          ? "baseline"
          : `${U.fmtPct((D.scenarios[c][year].revenue / revBase - 1) * 100, 1)}`;
    });

    const sent = {
      "Bear Case": "Slower growth and a flat margin — the lower bound of the assumption grid.",
      "Base Case": "The supplied baseline: the centre detent, and the page's own field colour.",
      "Bull Case": "Growth and margin at the top of the grid — the upper bound."
    };
    const note = $("#leverNote");
    if (note) {
      note.textContent =
        state.year === "FY2026"
          ? "FY2026 is reported, not modelled — all three cases resolve to the same actuals. Pick FY2027 or FY2028 to move the lever."
          : `${sent[state.scenario]} ${year} figures; the model cannot invent the FY2026 free-cash-flow line in any case.`;
    }
  }

  function initLever() {
    const input = $("#caseLeverInput");
    if (!input) return;
    const commit = (index) => {
      const scenario = CASE_ORDER[U.clamp(index, 0, 2)];
      if (scenario === state.scenario) return;
      const row = D.scenarios[scenario][state.year === "FY2026" ? "FY2028" : state.year];
      update(
        { scenario },
        `${scenario}${state.year === "FY2026" ? "" : `, ${state.year}`} revenue ₹${U.fmtNum(
          row.revenue
        )} crore, ${
          scenario === "Base Case"
            ? "the baseline"
            : `${U.fmtPct((row.revenue / D.scenarios["Base Case"].FY2028.revenue - 1) * 100, 1)} on base`
        }. Every output on the page follows.`
      );
    };
    /* numbers snap only at detents — never interpolate a figure */
    input.addEventListener("input", () => commit(Number(input.value)));
    input.addEventListener("change", () => commit(Number(input.value)));
    $$("[data-lever-detent]").forEach((btn) => {
      btn.addEventListener("click", () => commit(CASE_ORDER.indexOf(btn.dataset.leverDetent)));
    });
    document.addEventListener("keydown", (evt) => {
      if (evt.target.matches("input, textarea, select")) return;
      if (evt.key === "1" || evt.key === "2" || evt.key === "3") {
        const tag = document.activeElement;
        if (tag && (tag.tagName === "INPUT" || tag.isContentEditable)) return;
        evt.preventDefault();
        commit(Number(evt.key) - 1);
      }
    });
  }

  /* ----------------------------------------------------------------
 Marquee Δ column + footer state stamp#7, #8)
 ---------------------------------------------------------------- */

  function renderMarquee() {
    /* The marquee deliberately carries TWO track copies (one per loop
 group), so "six items" is correct, not a duplicate. Mirror every
 copy and never collapse them. */
    const year = state.year === "FY2026" ? "FY2028" : state.year;
    const base = D.scenarios["Base Case"][year].revenue;
    $$("[data-marquee-case]").forEach((item) => {
      const c = item.dataset.marqueeCase;
      item.classList.toggle("is-selected", c === state.scenario);
      const d = item.querySelector("[data-marquee-delta]");
      if (d) {
        d.textContent =
          c === "Base Case"
            ? "baseline"
            : U.fmtPct((D.scenarios[c][year].revenue / base - 1) * 100, 1);
      }
      /* the headline figure and its year follow the state too */
      const label = item.querySelector(":scope > span:first-child");
      const value = item.querySelector(":scope > b");
      if (label) label.textContent = `${c.replace(" Case", "")} ${year}`;
      if (value) value.textContent = `₹${U.fmtNum(D.scenarios[c][year].revenue)}`;
    });
  }

  function renderFooterStamp() {
    const host = $("#footerState");
    if (!host) return;
    const row = Core.selected();
    const isActual = state.year === "FY2026";
    const vs = isActual ? "reported" : U.fmtPct((row.revenue / D.actual.revenue - 1) * 100, 1) + " vs FY2026";
    host.innerHTML = `
      <span class="stamp-dot" aria-hidden="true">■</span>
      <span>${isActual ? "REPORTED" : state.scenario.toUpperCase()}</span>
      <span>· ${state.year}</span>
      <b>₹${U.fmtNum(row.revenue)} Cr</b>
      <span>· ${vs}</span>`;
    host.setAttribute("data-case", CASE_SLUG[state.scenario] || "base");
  }

  /* ----------------------------------------------------------------
 URL state — a shared link lands on its colour state#9)
 ---------------------------------------------------------------- */

  let urlTimer = 0;
  function syncUrl() {
    if (!history.replaceState) return;
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
      const params = new URLSearchParams(location.search);
      params.set("case", CASE_SLUG[state.scenario] || "base");
      params.set("year", state.year);
      history.replaceState(null, "", `${location.pathname}?${params}${location.hash}`);
    }, 220);
  }

  function readUrl() {
    const params = new URLSearchParams(location.search);
    const slug = (params.get("case") || "").toLowerCase();
    const year = params.get("year");
    const patch = {};
    const found = CASE_ORDER.find((c) => CASE_SLUG[c] === slug);
    if (found) patch.scenario = found;
    if (year && D.meta.years.includes(year)) patch.year = year;
    return patch;
  }

  /* ----------------------------------------------------------------
 html-level case tokens: the signature's page-wide re-ink
 ---------------------------------------------------------------- */

  const CASE_TOKENS = {
    "Bear Case": { field: "#ff8a3d", line: "#ff8a3d", ink: "#0d1024" },
    "Base Case": { field: "#54c8ff", line: "#54c8ff", ink: "#0d1024" },
    "Bull Case": { field: "#00e0c6", line: "#00e0c6", ink: "#0d1024" }
  };

  function paintRoot() {
    const root = document.documentElement;
    const slug = CASE_SLUG[state.scenario] || "base";
    root.setAttribute("data-case", slug);
    /* NOT data-year: that name belongs to the year <button>s, and putting
 it on <html> makes closest("[data-year]") match the document root
 from every element, hijacking every click. */
    root.setAttribute("data-state-year", state.year);
    const t = CASE_TOKENS[state.scenario] || CASE_TOKENS["Base Case"];
    root.style.setProperty("--case-field", t.field);
    root.style.setProperty("--case-line", t.line);
    root.style.setProperty("--case-ink", t.ink);
  }

  /* ----------------------------------------------------------------
 Controls and sync
 ---------------------------------------------------------------- */

  function syncControls() {
    /* every case chip, card and lever detent in every group */
    $$("button[data-scenario]").forEach((btn) => {
      const on = btn.dataset.scenario === state.scenario;
      btn.setAttribute("aria-pressed", String(on));
      if (btn.classList.contains("case-card")) btn.classList.toggle("is-selected", on);
    });
    $$("button[data-year]").forEach((btn) => {
      const on = btn.dataset.year === state.year;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
    });
    $$("button[data-trend-metric]").forEach((btn) => {
      const on = btn.dataset.trendMetric === state.trendMetric;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
    });
    $$("button[data-compare-metric]").forEach((btn) => {
      const on = btn.dataset.compareMetric === state.compareMetric;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
    });
    $$("button[data-table-filter]").forEach((btn) => {
      const on = btn.dataset.tableFilter === state.tableFilter;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
    });
    $$("[data-assumption-case]").forEach((th) => {
      th.classList.toggle("is-selected", th.dataset.assumptionCase === state.scenario && state.year !== "FY2026");
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
    renderLever();
    renderMarquee();
    renderFooterStamp();
    syncControls();
    paintRoot();
    redrawCharts(animated);
  }

  /* --- state-change feedback: 320ms, stagger 24ms, capped at 120ms --- */
  const stateAnimations = new WeakMap();
  function animateSelection() {
    if (reduceMotion.matches) return;
    const EASE = "cubic-bezier(.23, 1, .32, 1)";
    const selectors = [
      "#heroScenario", "#heroYear", "#heroDelta", "#contextNote",
      "#trendLatest", "#trendForecast", "#trendChange", "#driverTitle",
      ".case-card.is-selected", "#trendGrowthStrip", ".kpi-delta",
      ".kpi-value", ".lever-value", ".footer-state"
    ];
    $$(selectors.join(", ")).forEach((node, index) => {
      if (!node.animate) return;
      stateAnimations.get(node)?.cancel();
      const animation = node.animate(
        [{ opacity: 0.35, transform: "translateY(9px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 320, delay: Math.min(index * 24, 120), easing: EASE }
      );
      stateAnimations.set(node, animation);
    });
  }

  /* THE single mutation point. app-core's renderers read from state;
 every listener below lands here and nowhere else. */
  function update(patch, message) {
    Object.assign(state, patch);
    renderAll(true);
    animateSelection();
    paintRoot();
    syncUrl();
    announce(
      message ||
        `${state.year === "FY2026" ? "FY2026 reported year" : `${state.scenario}, ${state.year}`} selected. All outputs updated.`
    );
    document.dispatchEvent(
      new CustomEvent("tcs:state", { detail: { ...state } })
    );
  }

  document.addEventListener("click", (evt) => {
    const t = evt.target;
    if (!(t instanceof Element)) return;
    const scenarioBtn = t.closest("button[data-scenario]");
    if (scenarioBtn) {
      if (scenarioBtn.dataset.scenario) update({ scenario: scenarioBtn.dataset.scenario });
      return;
    }
    const yearBtn = t.closest("button[data-year]");
    if (yearBtn) {
      if (yearBtn.dataset.year) update({ year: yearBtn.dataset.year });
      return;
    }
    const trendChip = t.closest("button[data-trend-metric]");
    if (trendChip) {
      update({ trendMetric: trendChip.dataset.trendMetric }, `${trendChip.textContent.trim()} trend selected.`);
      return;
    }
    const compareChip = t.closest("button[data-compare-metric]");
    if (compareChip) {
      update({ compareMetric: compareChip.dataset.compareMetric }, `${compareChip.textContent.trim()} comparison selected.`);
      return;
    }
    const filterBtn = t.closest("button[data-table-filter]");
    if (filterBtn) {
      update({ tableFilter: filterBtn.dataset.tableFilter }, `${filterBtn.textContent.trim()} shown.`);
      return;
    }
    if (t.closest("#resetView")) {
      update(
        {
          scenario: D.meta.defaultScenario,
          year: D.meta.defaultYear,
          trendMetric: "revenue",
          compareMetric: "revenue",
          tableFilter: "all"
        },
        "View reset to Base Case, FY2028."
      );
      return;
    }
    if (t.closest("#exportCsv") || t.closest("#exportCsvLedger")) exportCsv();
  });

  /* INBOUND API — other agents and the spread chart dispatch this. */
  window.addEventListener("tcs:scenario", (evt) => {
    if (U.CASES.includes(evt.detail)) update({ scenario: evt.detail });
  });
  window.addEventListener("tcs:year", (evt) => {
    if (D.meta.years.includes(evt.detail)) update({ year: evt.detail });
  });

  /* ----------------------------------------------------------------
 CSV — the filtered rows, with the selected case/year marked
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
      "Employees",
      "Selected",
      "Data kind"
    ];
    /* honour BOTH the current filter and the current selection */
    const rows = filteredRows();
    const lines = [header.map(csvCell).join(",")];
    rows.forEach((r) => {
      const isSelected = r.kind === "forecast" && r.case === state.scenario && r.year === state.year;
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
          r.employees,
          isSelected ? "YES" : "",
          r.kind
        ].map(csvCell).join(",")
      );
    });
    const meta = [
      "",
      csvCell("Export context"),
      csvCell(`case=${state.scenario}`),
      csvCell(`year=${state.year}`),
      csvCell(`filter=${state.tableFilter}`),
      csvCell(`rows=${rows.length}`),
      csvCell("FY2027-FY2028 are analytical cases, not TCS guidance")
    ].join(",");
    const blob = new Blob(["\uFEFF" + lines.join("\r\n") + "\r\n" + meta], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tcs-financial-outlook-${CASE_SLUG[state.scenario]}-${state.year}-${state.tableFilter}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
    announce(`${rows.length} rows exported as CSV, ${state.scenario} ${state.year}, ${state.tableFilter} filter.`);
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
        if (reduceMotion.matches || !target) {
          node.textContent = String(target);
          return;
        }
        const start = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - start) / 900);
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
    const chapterMotion = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-entering");
          chapterMotion.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );
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
    stampChartFields();
    mountHooks();
    buildLever();
    initChapterMotion();
    initLever();
    chartNodes.forEach(drawChart);
    observeCharts();
    initCounters();
    initPreviews();
    const fromUrl = readUrl();
    if (Object.keys(fromUrl).length) Object.assign(state, fromUrl);
    renderAll();
    onScroll();
    paintRoot();
    if (Object.keys(fromUrl).length) {
      announce(`Opened on ${state.scenario}, ${state.year} from the shared link.`, true);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
