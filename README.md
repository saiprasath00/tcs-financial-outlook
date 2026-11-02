# TCS Financial Outlook

A recruiter-facing, interactive web edition of a TCS financial-model project. Explore FY2018–FY2026 results, compare three analytical cases for FY2027–FY2028, inspect the underlying ledger, and download the selected rows as CSV. This repository contains the project showcase, not a personal portfolio.

The cobalt-and-tangerine one-page story moves through the workbook, trend, three futures, margins and cash, ledger, and build method. Pick a case or year in the opening data stage: the numbers, charts, and ledger react together with animated transitions. Its charts are hand-built SVG rather than a charting library. The site is static HTML, CSS, and JavaScript: no build step or backend is required. Motion follows the device's reduced-motion preference without an on-page switch.

## Run locally

You need Python 3 and an internet connection for the optional scroll-animation libraries. The data, charts, layout, and fonts are local assets.

1. In a terminal, open the folder containing `index.html`.
2. Start a static server:

   ```sh
   python -m http.server 4173
   ```

3. Open <http://localhost:4173/>. Select a case or year to confirm that the charts, values, and ledger update together.

Serve the site rather than opening `index.html` as a `file://` URL: the motion module imports use browser module loading.

## Publish on GitHub Pages

1. Create a GitHub repository for this project.
2. Upload the **contents** of this folder to the repository root. Keep `index.html` at the root and preserve the `assets/` directory. You don't need to upload the source project outside this folder.
3. In the repository, open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**, choose the branch containing `index.html` (for example, `main`), select **/(root)**, and save.
4. Open the URL shown on the Pages settings screen when deployment completes. Confirm that the fonts, preview images, charts, and CSV download work.

The page uses relative asset paths, so it works at a repository subpath such as `https://USERNAME.github.io/REPOSITORY/`. Replace `USERNAME` and `REPOSITORY` with your GitHub account and repository name. The scroll-motion imports use pinned GSAP 3.15.0 and Lenis 1.3.26 modules from jsDelivr; if the CDN is unavailable, the static content and core chart scripts remain local.

## Read the data correctly

- **FY2018–FY2025:** Historical rows come from the supplied `TCS_Historical_Financials.xlsx` workbook, included inside the downloadable project ZIP. The workbook's SHA-256 is recorded in `assets/data.js`.
- **FY2026:** Reported revenue is ₹2,67,021 Cr; statutory profit after tax (PAT) is ₹49,454 Cr; diluted earnings per share (EPS) is ₹136.01; operating cash flow is ₹52,094 Cr. The EBITDA figure of ₹72,398 Cr is a model proxy (EBIT plus depreciation), not an unqualified reported EBITDA number. The free-cash-flow (FCF) cell is intentionally empty rather than inferred from operating cash flow.
- **FY2027–FY2028:** Bear, Base, and Bull values are fixed analytical cases from the supplied Power BI model. They are not TCS guidance or audited forecasts. The assumptions table shows the source model inputs; changing a case selects a fixed case row rather than recalculating it in the browser.
- **FY2025 PAT:** The workbook uses ₹48,797 Cr consolidated net profit; the annual report separately discloses ₹48,553 Cr attributable to equity holders. This site retains the workbook series and explains the difference in the ledger.

The FY2026 actuals come from [TCS quarterly results](https://www.tcs.com/investor-relations/quarterly-results) (Q4 and FY2026 results, 9 April 2026). FY2025 disclosures are linked from the site. This is an independent analytical exercise, not affiliated with or endorsed by TCS.

## Project files

| Path | Purpose |
| --- | --- |
| `index.html` | Story chapters, navigation, no-JavaScript hero fallback, and source links |
| `assets/data.js` | Frozen historical, actual, and scenario rows |
| `assets/charts.js`, `assets/charts2.js` | SVG chart primitives and visualizations |
| `assets/app-core.js`, `assets/app.js` | Shared selection state, rendering, controls, ledger, and CSV export |
| `assets/base.css`, `assets/story.css`, `assets/charts.css`, `assets/reboot.css` | Typography, chart foundation, and the saturated data-atlas redesign |
| `assets/tokens.css`, `assets/motion-core.css`, `assets/motion-core.js` | Animation tokens and scroll behavior |
| `assets/fonts/`, `assets/previews/` | Self-hosted fonts and Power BI layout previews |
| `assets/TCS_Financial_Dashboard_Professional.zip` | Supplied Power BI project and source workbook |
| `tools/generate_data.py` | Local data-generation script for the supplied workbook and cases |

The published site reads the committed `assets/data.js` and does not run the generator. To rebuild that file from the workbook inside the ZIP, install Python 3 and `openpyxl`, then run `python tools/generate_data.py` from the repository root. The generator needs no machine-specific paths; review the resulting data before publishing changes.
