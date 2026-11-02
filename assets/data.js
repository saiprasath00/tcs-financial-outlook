/* Single source of truth: supplied workbook + PBIP semantic model. */
window.TCS_DATA = {
  "meta": {
    "title": "TCS Financial Outlook",
    "defaultScenario": "Base Case",
    "defaultYear": "FY2028",
    "years": [
      "FY2018",
      "FY2019",
      "FY2020",
      "FY2021",
      "FY2022",
      "FY2023",
      "FY2024",
      "FY2025",
      "FY2026",
      "FY2027",
      "FY2028"
    ],
    "forecastYears": [
      "FY2027",
      "FY2028"
    ],
    "currency": "INR",
    "unit": "₹ Cr",
    "sourceWorkbook": "TCS_Historical_Financials.xlsx",
    "sourceWorkbookSha": "24B213FC9A429FCFAC49F3A7E59F466F994ABC218DFBA5D82B44DA7B94934FC9",
    "actualYear": "FY2026"
  },
  "historical": [
    {
      "year": "FY2018",
      "sort": 2018,
      "revenue": 123104.0,
      "ebitda": 33800.0,
      "ebit": 29500.0,
      "otherIncome": 4826.0,
      "netProfit": 25826.0,
      "eps": 67.1,
      "shares": 385.0,
      "employees": 394998.0,
      "depreciation": 4300.0,
      "capex": 6702.0,
      "fcf": 23424.0
    },
    {
      "year": "FY2019",
      "sort": 2019,
      "revenue": 146463.0,
      "ebitda": 37450.0,
      "ebit": 32700.0,
      "otherIncome": 7572.0,
      "netProfit": 31472.0,
      "eps": 83.05,
      "shares": 379.0,
      "employees": 424285.0,
      "depreciation": 4750.0,
      "capex": 6463.0,
      "fcf": 29759.0
    },
    {
      "year": "FY2020",
      "sort": 2020,
      "revenue": 156949.0,
      "ebitda": 40520.0,
      "ebit": 35550.0,
      "otherIncome": 5790.0,
      "netProfit": 32340.0,
      "eps": 85.5,
      "shares": 378.0,
      "employees": 448464.0,
      "depreciation": 4970.0,
      "capex": 6113.0,
      "fcf": 31197.0
    },
    {
      "year": "FY2021",
      "sort": 2021,
      "revenue": 164177.0,
      "ebitda": 49680.0,
      "ebit": 45615.0,
      "otherIncome": 2947.0,
      "netProfit": 32562.0,
      "eps": 87.67,
      "shares": 371.0,
      "employees": 488649.0,
      "depreciation": 4065.0,
      "capex": 5254.0,
      "fcf": 31373.0
    },
    {
      "year": "FY2022",
      "sort": 2022,
      "revenue": 191754.0,
      "ebitda": 57075.0,
      "ebit": 52471.0,
      "otherIncome": 3478.0,
      "netProfit": 38449.0,
      "eps": 104.75,
      "shares": 367.0,
      "employees": 556986.0,
      "depreciation": 4604.0,
      "capex": 5556.0,
      "fcf": 37497.0
    },
    {
      "year": "FY2023",
      "sort": 2023,
      "revenue": 225458.0,
      "ebitda": 62708.0,
      "ebit": 57686.0,
      "otherIncome": 3617.0,
      "netProfit": 42303.0,
      "eps": 115.19,
      "shares": 367.0,
      "employees": 614795.0,
      "depreciation": 5022.0,
      "capex": 6328.0,
      "fcf": 40997.0
    },
    {
      "year": "FY2024",
      "sort": 2024,
      "revenue": 240893.0,
      "ebitda": 68718.0,
      "ebit": 63733.0,
      "otherIncome": 3366.0,
      "netProfit": 46099.0,
      "eps": 126.88,
      "shares": 363.0,
      "employees": 601546.0,
      "depreciation": 4985.0,
      "capex": 5857.0,
      "fcf": 45227.0
    },
    {
      "year": "FY2025",
      "sort": 2025,
      "revenue": 255324.0,
      "ebitda": 71369.0,
      "ebit": 66135.0,
      "otherIncome": 3670.0,
      "netProfit": 48797.0,
      "eps": 134.2,
      "shares": 362.0,
      "employees": 607979.0,
      "depreciation": 5234.0,
      "capex": 6255.0,
      "fcf": 47776.0
    }
  ],
  "actual": {
    "year": "FY2026",
    "sort": 2026,
    "scenario": "Actual",
    "revenue": 267021,
    "ebit": 66838,
    "ebitda": 72398,
    "pat": 49454,
    "cfo": 52094,
    "fcf": null,
    "eps": 136.01,
    "shares": 363.6,
    "employees": 584519
  },
  "scenarios": {
    "Base Case": {
      "FY2027": {
        "year": "FY2027",
        "sort": 2027,
        "scenario": "Base Case",
        "revenue": 295058,
        "ebit": 71404,
        "ebitda": 76568,
        "pat": 56356,
        "cfo": 56356,
        "fcf": 51635,
        "eps": 155.8,
        "shares": 361.81
      },
      "FY2028": {
        "year": "FY2028",
        "sort": 2028,
        "scenario": "Base Case",
        "revenue": 312762,
        "ebit": 77252,
        "ebitda": 82726,
        "pat": 60676,
        "cfo": 60676,
        "fcf": 55672,
        "eps": 167.7,
        "shares": 361.81
      }
    },
    "Bull Case": {
      "FY2027": {
        "year": "FY2027",
        "sort": 2027,
        "scenario": "Bull Case",
        "revenue": 300399,
        "ebit": 74499,
        "ebitda": 79606,
        "pat": 58878,
        "cfo": 61822,
        "fcf": 56415,
        "eps": 162.7,
        "shares": 361.81
      },
      "FY2028": {
        "year": "FY2028",
        "sort": 2028,
        "scenario": "Bull Case",
        "revenue": 327435,
        "ebit": 83496,
        "ebitda": 89062,
        "pat": 65814,
        "cfo": 69105,
        "fcf": 63211,
        "eps": 181.9,
        "shares": 361.81
      }
    },
    "Bear Case": {
      "FY2027": {
        "year": "FY2027",
        "sort": 2027,
        "scenario": "Bear Case",
        "revenue": 288383,
        "ebit": 67770,
        "ebitda": 73105,
        "pat": 53062,
        "cfo": 50409,
        "fcf": 46372,
        "eps": 146.7,
        "shares": 361.81
      },
      "FY2028": {
        "year": "FY2028",
        "sort": 2028,
        "scenario": "Bear Case",
        "revenue": 297034,
        "ebit": 70694,
        "ebitda": 76338,
        "pat": 55248,
        "cfo": 52486,
        "fcf": 48030,
        "eps": 152.7,
        "shares": 361.81
      }
    }
  },
  "assumptions": [
    {
      "parameter": "Revenue Growth FY26",
      "base": 0.08,
      "bull": 0.12,
      "bear": 0.04,
      "unit": "%",
      "note": "YoY growth applied to FY25 base"
    },
    {
      "parameter": "Revenue Growth FY27",
      "base": 0.085,
      "bull": 0.13,
      "bear": 0.045,
      "unit": "%",
      "note": "Continued momentum"
    },
    {
      "parameter": "Revenue Growth FY28",
      "base": 0.09,
      "bull": 0.14,
      "bear": 0.05,
      "unit": "%",
      "note": "Long-term projection"
    },
    {
      "parameter": "EBITDA Margin FY26",
      "base": 0.28,
      "bull": 0.3,
      "bear": 0.255,
      "unit": "%",
      "note": "Year 1 EBITDA Margin"
    },
    {
      "parameter": "EBITDA Margin FY27",
      "base": 0.282,
      "bull": 0.305,
      "bear": 0.257,
      "unit": "%",
      "note": "Year 2 - Operating leverage"
    },
    {
      "parameter": "EBITDA Margin FY28",
      "base": 0.285,
      "bull": 0.31,
      "bear": 0.26,
      "unit": "%",
      "note": "Year 3 - Margin expansion/stabilization"
    },
    {
      "parameter": "Implied Net Profit Margin (Est.)",
      "base": 0.193,
      "bull": 0.198,
      "bear": 0.175,
      "unit": "%",
      "note": "⚠️ ESTIMATE ONLY: Model derives NP from EBIT−Tax. Actual margins: Bull=21-21.8%, Base=19.3%, Bear=17.5%"
    },
    {
      "parameter": "Tax Rate",
      "base": 0.255,
      "bull": 0.25,
      "bear": 0.26,
      "unit": "%",
      "note": "Effective tax rate"
    },
    {
      "parameter": "Depreciation (% of Rev)",
      "base": 0.021,
      "bull": 0.02,
      "bear": 0.022,
      "unit": "%",
      "note": "Capital intensity"
    },
    {
      "parameter": "Shares Outstanding (Cr)",
      "base": 362,
      "bull": 362,
      "bear": 362,
      "unit": "Cr",
      "note": "Assumed constant"
    }
  ],
  "sources": [
    {
      "label": "TCS Q4 & FY2026 results release",
      "period": "FY2026",
      "url": "https://www.tcs.com/investor-relations/quarterly-results"
    },
    {
      "label": "TCS Integrated Annual Report 2024–25",
      "period": "FY2025",
      "url": "https://www.tcs.com/content/dam/tcs/investor-relations/financial-statements/2024-25/ar/annual-report-2024-2025.pdf"
    },
    {
      "label": "Supplied historical workbook",
      "period": "FY2018–FY2025",
      "url": "assets/TCS_Financial_Dashboard_Professional.zip"
    }
  ],
  "project": {
    "historicalRows": 88,
    "assumptionRows": 30,
    "visuals": 34,
    "validationChecks": 11,
    "reportPages": 4,
    "forecastStates": 6,
    "timelineYears": 11,
    "overlaps": 0
  }
};
