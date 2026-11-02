import hashlib
import io
import json
import pathlib
import zipfile

import openpyxl

OUT = pathlib.Path(__file__).resolve().parent.parent
ARCHIVE = OUT / "assets" / "TCS_Financial_Dashboard_Professional.zip"

# ---------- Historicals from the supplied workbook ----------
with zipfile.ZipFile(ARCHIVE) as source:
    workbook_bytes = source.read("Data/TCS_Historical_Financials.xlsx")
wb = openpyxl.load_workbook(io.BytesIO(workbook_bytes), data_only=True)
ws = wb["Historical_Data"]
rows = list(ws.iter_rows(values_only=True))
header = rows[3]
years = list(header[2:10])  # FY2018..FY2025

metric_rows = {}
for r in rows[4:18]:
    name = (r[1] or "").strip()
    if name:
        metric_rows[name] = r[2:10]

def num(v):
    return None if v in (None, "N/A") else float(v)

historical = []
for i, year in enumerate(years):
    historical.append({
        "year": year,
        "sort": 2018 + i,
        "revenue": num(metric_rows["Revenue"][i]),
        "ebitda": num(metric_rows["EBITDA"][i]),
        "ebit": num(metric_rows["EBIT"][i]),
        "otherIncome": num(metric_rows["Other Income (Net)"][i]),
        "netProfit": num(metric_rows["Net Profit"][i]),
        "eps": num(metric_rows["EPS - Diluted (INR)"][i]),
        "shares": num(metric_rows["Shares Outstanding"][i]),
        "employees": num(metric_rows["Employees"][i]),
        "depreciation": num(metric_rows["Depreciation"][i]),
        "capex": num(metric_rows["Capex"][i]),
        "fcf": num(metric_rows["Free Cash Flow"][i]),
    })

# ---------- FY2026 statutory results and FY2027-FY2028 PBIP cases ----------
actual = {
    "year": "FY2026",
    "sort": 2026,
    "scenario": "Actual",
    "revenue": 267021,
    "ebit": 66838,
    "ebitda": 72398,
    "pat": 49454,
    "cfo": 52094,
    "fcf": None,
    "eps": 136.01,
    "shares": 363.6,
    "employees": 584519,
}

scenario_rows = [
    # scenario, year, sort, revenue, ebit, ebitda, pat, cfo, fcf, eps, shares
    ("Base Case", "FY2027", 2027, 295058, 71404, 76568, 56356, 56356, 51635, 155.8, 361.81),
    ("Base Case", "FY2028", 2028, 312762, 77252, 82726, 60676, 60676, 55672, 167.7, 361.81),
    ("Bull Case", "FY2027", 2027, 300399, 74499, 79606, 58878, 61822, 56415, 162.7, 361.81),
    ("Bull Case", "FY2028", 2028, 327435, 83496, 89062, 65814, 69105, 63211, 181.9, 361.81),
    ("Bear Case", "FY2027", 2027, 288383, 67770, 73105, 53062, 50409, 46372, 146.7, 361.81),
    ("Bear Case", "FY2028", 2028, 297034, 70694, 76338, 55248, 52486, 48030, 152.7, 361.81),
]

scenarios = {"Base Case": {}, "Bull Case": {}, "Bear Case": {}}
for s, y, sort, rev, ebit, ebitda, pat, cfo, fcf, eps, shares in scenario_rows:
    scenarios[s][y] = {
        "year": y, "sort": sort, "scenario": s,
        "revenue": rev, "ebit": ebit, "ebitda": ebitda, "pat": pat,
        "cfo": cfo, "fcf": fcf, "eps": eps, "shares": shares,
    }

# ---------- Audit-context assumptions from the workbook ----------
assumptions_rows = list(wb["Assumptions"].iter_rows(values_only=True))
assumption_table = []
for r in assumptions_rows[9:19]:
    if r[1] in (None, ""):
        continue
    assumption_table.append({
        "parameter": r[1],
        "base": r[2], "bull": r[3], "bear": r[4],
        "unit": r[5],
        "note": r[6] or "",
    })

# ---------- Derived sanity checks ----------
def pct(a, b):
    return round((a / b - 1) * 100, 2)

checks = {
    "revenue_cagr_18_25": round(((historical[-1]["revenue"] / historical[0]["revenue"]) ** (1 / 7) - 1) * 100, 2),
    "revenue_fy26_yoy": pct(actual["revenue"], historical[-1]["revenue"]),
    "base_fy27_yoy": pct(scenarios["Base Case"]["FY2027"]["revenue"], actual["revenue"]),
    "base_fy28_yoy": pct(scenarios["Base Case"]["FY2028"]["revenue"], scenarios["Base Case"]["FY2027"]["revenue"]),
    "bull_fy28_vs_base": pct(scenarios["Bull Case"]["FY2028"]["revenue"], scenarios["Base Case"]["FY2028"]["revenue"]),
    "bear_fy28_vs_base": pct(scenarios["Bear Case"]["FY2028"]["revenue"], scenarios["Base Case"]["FY2028"]["revenue"]),
    "base_fy28_pat_margin": round(scenarios["Base Case"]["FY2028"]["pat"] / scenarios["Base Case"]["FY2028"]["revenue"] * 100, 2),
    "base_fy28_ebitda_margin": round(scenarios["Base Case"]["FY2028"]["ebitda"] / scenarios["Base Case"]["FY2028"]["revenue"] * 100, 2),
}
print("Sanity checks:", json.dumps(checks, indent=2))

data = {
    "meta": {
        "title": "TCS Financial Outlook",
        "defaultScenario": "Base Case",
        "defaultYear": "FY2028",
        "years": [f"FY{y}" for y in range(2018, 2029)],
        "forecastYears": ["FY2027", "FY2028"],
        "currency": "INR",
        "unit": "₹ Cr",
        "sourceWorkbook": "TCS_Historical_Financials.xlsx",
        "sourceWorkbookSha": hashlib.sha256(workbook_bytes).hexdigest().upper(),
        "actualYear": "FY2026",
    },
    "historical": historical,
    "actual": actual,
    "scenarios": scenarios,
    "assumptions": assumption_table,
    "sources": [
        {
            "label": "TCS Q4 & FY2026 results release",
            "period": "FY2026",
            "url": "https://www.tcs.com/investor-relations/quarterly-results",
        },
        {
            "label": "TCS Integrated Annual Report 2024–25",
            "period": "FY2025",
            "url": "https://www.tcs.com/content/dam/tcs/investor-relations/financial-statements/2024-25/ar/annual-report-2024-2025.pdf",
        },
        {
            "label": "Supplied historical workbook",
            "period": "FY2018–FY2025",
            "url": "assets/TCS_Financial_Dashboard_Professional.zip",
        },
    ],
    "project": {
        "historicalRows": 88,
        "assumptionRows": 30,
        "visuals": 34,
        "validationChecks": 11,
        "reportPages": 4,
        "forecastStates": 6,
        "timelineYears": 11,
        "overlaps": 0,
    },
}

js = "/* Single source of truth: supplied workbook + PBIP semantic model. */\n" \
     "window.TCS_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
(OUT / "assets" / "data.js").write_text(js, encoding="utf-8")

print("Wrote", OUT / "assets" / "data.js")
print("Historical rows:", len(historical), "Scenario rows:", sum(len(v) for v in scenarios.values()))
print("Assumptions:", len(assumption_table))
