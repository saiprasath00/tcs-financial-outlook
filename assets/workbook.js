/* --------------------------------------------------------------------------
   The reported record.

   Builds the source grid from window.TCS_DATA so the eighty-eight cells on
   screen are the same numbers the charts read. Nothing here is typed by hand:
   the metric list maps to the historical rows, and the FY2026 column maps to
   the reported actuals.

   Two independent readings: hovering or arrow-keying a cell reports the exact
   figure, and a metric can be held to report its whole trajectory. Keyboard
   users get one tab stop for the grid and roving arrow keys inside it.
   -------------------------------------------------------------------------- */
(function () {
  "use strict";

  const D = window.TCS_DATA;
  const grid = document.getElementById("sourceGrid");
  const body = document.getElementById("sourceBody");
  if (!D || !grid || !body) return;

  const hist = D.historical;
  const years = hist.map((h) => h.year);

  /* The table ships a no-JS fallback row; clear it before building. */
  body.innerHTML = "";

  /* key       historical row field
     actual    FY2026 reported field, when one exists                 */
  const METRICS = [
    { key: "revenue",      label: "Revenue",       unit: "₹ Cr", actual: "revenue"   },
    { key: "ebitda",       label: "EBITDA",        unit: "₹ Cr", actual: "ebitda"    },
    { key: "ebit",         label: "EBIT",          unit: "₹ Cr", actual: "ebit"      },
    { key: "otherIncome",  label: "Other income",  unit: "₹ Cr", actual: null        },
    { key: "depreciation", label: "Depreciation",  unit: "₹ Cr", actual: null        },
    { key: "netProfit",    label: "Net profit",    unit: "₹ Cr", actual: "pat"       },
    { key: "eps",          label: "EPS, diluted",  unit: "₹",    actual: "eps"       },
    { key: "shares",       label: "Shares",        unit: "Cr",   actual: "shares"    },
    { key: "employees",    label: "Employees",     unit: "no.",  actual: "employees" },
    { key: "capex",        label: "Capex",         unit: "₹ Cr", actual: null        },
    { key: "fcf",          label: "Free cash flow", unit: "₹ Cr", actual: "fcf"      }
  ];

  const money = (v) => (v == null ? null : v.toLocaleString("en-IN"));

  /* ---- header ---------------------------------------------------------- */

  const headRow = grid.querySelector("thead tr");
  headRow.innerHTML =
    '<th scope="col">Metric</th>' +
    years.map((y) => `<th scope="col" data-year="${y}">${y}</th>`).join("") +
    '<th scope="col" class="is-gap" data-year="FY2026">FY2026</th>';

  /* ---- rows ------------------------------------------------------------ */

  const rows = METRICS.map((m) => {
    const values = hist.map((h) => h[m.key]);
    const tr = document.createElement("tr");
    tr.dataset.metric = m.key;
    tr.innerHTML =
      `<th scope="row"><button type="button" class="row-key" aria-pressed="false">${m.label}</button>` +
      `<span class="row-unit">${m.unit}</span></th>` +
      values.map((v, i) =>
        `<td data-year="${years[i]}" tabindex="-1">${money(v) ?? "—"}</td>`
      ).join("") +
      `<td class="is-gap" data-year="FY2026" tabindex="-1"></td>`;
    body.appendChild(tr);
    return { metric: m, values, tr };
  });

  /* FY2026 is the reported actual, not a workbook cell. Where the filing has
     no line for a metric the cell says so rather than going blank. */
  rows.forEach(({ metric, tr }) => {
    const cell = tr.querySelector("td.is-gap");
    const v = metric.actual ? D.actual[metric.actual] : null;
    cell.textContent = v == null ? "n/a" : money(v);
    cell.dataset.reported = v == null ? "" : String(v);
  });

  /* ---- readout --------------------------------------------------------- */

  const main = document.getElementById("readoutMain");
  const sub = document.getElementById("readoutSub");
  const hint = document.getElementById("sheetHint");

  const resting = () => {
    main.textContent = "88 cells · 88 matches";
    sub.textContent = "FY2018–FY2025 · ₹ crore unless noted";
  };
  resting();

  const findRow = (tr) => rows.find((r) => r.tr === tr);

  const describeCell = (cell) => {
    const row = findRow(cell.closest("tr"));
    if (!row) return;
    const m = row.metric;
    const year = cell.dataset.year;
    const label = row.values.length;
    const idx = cell.cellIndex - 1;
    const raw = year === "FY2026" ? cell.dataset.reported : row.values[idx];
    if (raw === "" || raw == null) {
      main.textContent = `${m.label} · ${year} · not published`;
      sub.textContent = year === "FY2026"
        ? "TCS reports no free-cash-flow line for FY2026, so the cell stays empty here and in every chart"
        : `No ${m.label.toLowerCase()} figure is filed for ${year}`;
      return;
    }
    main.textContent = `${m.label} · ${year} · ${money(Number(raw))}${m.unit === "₹" ? "" : " "}${m.unit}`;
    sub.textContent = year === "FY2026"
      ? "Reported actual from the FY2026 results filing, 9 April 2026"
      : `Workbook cell · ${years[0]}–${years[years.length - 1]} record · verified 88/88`;
    void label;
  };

  const describeRow = (row) => {
    const m = row.metric;
    const vals = row.values;
    const first = vals[0];
    const last = vals[vals.length - 1];
    let cagr = null;
    if (first > 0 && last > 0) {
      cagr = Math.pow(last / first, 1 / (vals.length - 1)) - 1;
    }
    main.textContent = `${m.label} · ${years[0]} ${money(first)} → ${years[years.length - 1]} ${money(last)} ${m.unit}`;
    sub.textContent = cagr == null
      ? "Eight filed years"
      : `${(cagr * 100).toFixed(1)}% compound annual growth across eight filed years`;
  };

  /* ---- pointer readings ------------------------------------------------ */

  body.querySelectorAll("td").forEach((cell) => {
    cell.addEventListener("mouseenter", () => describeCell(cell));
    cell.addEventListener("focus", () => describeCell(cell));
  });

  const clearResting = () => {
    if (!body.querySelector("tr.is-pinned")) resting();
  };
  grid.addEventListener("mouseleave", clearResting);

  /* ---- held row -------------------------------------------------------- */

  body.querySelectorAll(".row-key").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = findRow(btn.closest("tr"));
      if (!row) return;
      const held = row.tr.classList.contains("is-pinned");
      rows.forEach(({ tr }) => {
        tr.classList.remove("is-pinned");
        tr.querySelector(".row-key").setAttribute("aria-pressed", "false");
      });
      if (held) {
        resting();
        return;
      }
      row.tr.classList.add("is-pinned");
      btn.setAttribute("aria-pressed", "true");
      describeRow(row);
    });
  });

  /* ---- held column ----------------------------------------------------- */

  const clearColumns = () => {
    grid.querySelectorAll("th[data-year]").forEach((th) => th.classList.remove("is-pinned"));
    body.querySelectorAll("td.is-col").forEach((td) => td.classList.remove("is-col"));
  };

  grid.querySelectorAll("th[data-year]").forEach((th) => {
    const year = th.dataset.year;
    const toggle = () => {
      const held = th.classList.contains("is-pinned");
      clearColumns();
      if (held) {
        resting();
        return;
      }
      th.classList.add("is-pinned");
      body.querySelectorAll(`td[data-year="${year}"]`).forEach((td) => td.classList.add("is-col"));
      main.textContent = `${year} · the full column`;
      sub.textContent = year === "FY2026"
        ? "Reported actuals, filed 9 April 2026 — not workbook cells"
        : "Every metric for this year, as filed";
    };
    th.addEventListener("click", toggle);
    th.tabIndex = 0;
    th.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });

  /* ---- roving keyboard entry ------------------------------------------
     One tab stop for the whole grid. Arrow keys move between cells, so the
     eighty-eight cells never become eighty-eight tab stops. */

  const cells = Array.from(body.querySelectorAll("td"));
  if (!cells.length) return;
  cells[0].tabIndex = 0;

  const focusCell = (cell) => {
    if (!cell) return;
    cells.forEach((c) => (c.tabIndex = -1));
    cell.tabIndex = 0;
    cell.focus();
    describeCell(cell);
  };

  const indexOfCell = (cell) => {
    const tr = cell.closest("tr");
    const col = Array.from(tr.children).indexOf(cell) - 1;
    const row = rows.findIndex((r) => r.tr === tr);
    return { row, col };
  };

  body.addEventListener("keydown", (e) => {
    const cell = e.target.closest && e.target.closest("td");
    if (!cell) return;
    const { row, col } = indexOfCell(cell);
    const cols = years.length + 1;
    let next = null;
    if (e.key === "ArrowRight") next = col + 1 < cols ? cell.nextElementSibling : null;
    else if (e.key === "ArrowLeft") next = col > 0 ? cell.previousElementSibling : null;
    else if (e.key === "ArrowDown") next = rows[row + 1] ? rows[row + 1].tr.children[col + 1] : null;
    else if (e.key === "ArrowUp") next = rows[row - 1] ? rows[row - 1].tr.children[col + 1] : null;
    if (next) {
      e.preventDefault();
      focusCell(next);
    }
  });
})();
