# Gujarat Monsoon Monitor

Taluka-level rainfall and reservoir storage for Gujarat, built by the Water & Climate Lab, IIT Gandhinagar.
Live at https://rainfall-gujarat-website.vercel.app

- **/maps**: choropleth of taluka rainfall (last 24 h, season total, % of annual average) and a dam storage map, each with daily history charts
- **/blog**: lab write-ups. External posts are listed from a Google Sheet.
- **/about**: the lab, the team and the data sources

Stack: Next.js 16 (App Router), React 19, Tailwind, Leaflet, Recharts, MongoDB. The data pipeline is Python.

## Data pipeline

```
GitHub Actions cron (10:00, 16:00, 22:00 IST)
  └─ python-scripts/ingest.py --fill-gaps
       1. download  rainfall PDF  (GSDMA → fallback gujaratweather.com)
                    dam PDF       (wrd-dam.gujarat.gov.in)
       2. parse     ~268 taluka rows + 206 dam rows per day
       3. save      MongoDB Atlas, database `rainfall-data` (replaces that date's rows)
Vercel (Next.js)
  └─ /api/* routes read MongoDB on every request → /maps
```

Nothing is redeployed when new data arrives: the site reads MongoDB live.

### Where the data comes from

**1. Taluka rainfall: SEOC 24-hour rainfall report**

Published daily during the monsoon (roughly June–November) by the State Emergency Operation Centre, Gujarat. One PDF per day lists every taluka's 30-year average, rain until yesterday, rain in the last 24 hours, season total and % of average.

The script tries these in order:

| # | Source | How it's fetched | Coverage |
|---|---|---|---|
| 1 | **GSDMA archive** (Gujarat State Disaster Management Authority, official). Human page: https://gsdma.org/rainfalldata-2?Type=2 | The calendar on that page is backed by a JSON API: `POST https://gsdma.org/GetFileData.aspx/GetColumnChartData` with body `{"Type":"2","Year":2026}` returns `[{Date: "MM/DD/YYYY", PDFName: <url>}]` for the whole year. The script fetches this list once per year and downloads the PDF for each date. | 2015 → today. Usually posted the same morning. |
| 2 | **gujaratweather.com mirror** (third-party blog that re-posts the same SEOC PDF). Human page: https://www.gujaratweather.com/?page_id=14577 | Direct URL: `https://www.gujaratweather.com/wp-content/uploads/YYYY/MM/24-HRS-RAINFALL-DATA-DT.DD.MM.YYYY.pdf` (the month folder can be the next month for reports posted on the 1st, so both are tried). | Recent weeks only; old files get deleted. |

The two sources produce identical data (checked on 24/09/2026: 268 talukas, 0 differences).

Quirks handled in code:
- `www.gsdma.org` serves a self-signed certificate, so links are rewritten to `https://gsdma.org`.
- Some GSDMA files are named `ilovepdfmerged….pdf` rather than by date. The date comes from the API, not the filename.
- The Directorate of Relief page (https://directorateofrelief.gujarat.gov.in/daily-rainfall-data) is the older official location, but it hasn't been updated since July 2023, so it isn't used.

**2. Dam storage: daily dam report**

Published every day of the year by the Narmada, Water Resources, Water Supply & Kalpsar Department (Reservoir Data Management System, https://wrd-dam.gujarat.gov.in/).

- URL: `https://wrd-dam.gujarat.gov.in/downloads/home_pdf.php?dt=<base64 of YYYY-MM-DD>`. For example, `dt=MjAyNi0wOS0yNg==` is 2026-09-26.
- Coverage: 2019 → today.
- The server takes about 60 s per PDF, which is why backfills use `--workers`.
- The script parses the "Statement showing the details of dams in Gujarat" pages: 206 dams, with district, taluka, gate type, levels, design/present storage, % filling, warning level, inflow and outflow.

### Storage

MongoDB Atlas (free M0 cluster, AWS Mumbai), database `rainfall-data`:

- `rainfalldatas`: one row per taluka per day, with `date` as `DD/MM/YYYY`
- `reservoirdatas`: one row per dam per day
- `ingestruns`: a log of each ingest run, shown by `/api/status`

Writes replace all rows for a date, so re-running a date is always safe. A date is only written if the PDF parsed into a plausible number of rows (≥200 talukas or ≥150 dams), so a bad download never wipes good data.

Atlas **Network Access** must allow `0.0.0.0/0`, because Vercel and GitHub Actions connect from changing IPs. The database user and password still protect access.

### Automatic daily updates

`.github/workflows/daily-ingest.yml` runs at 10:00, 16:00 and 22:00 IST. Each run:
1. re-processes the last 3 days, which picks up reports published late, and
2. with `--fill-gaps`, retries any rainfall day GSDMA lists (this year and last) that's missing from the database.

The downloaded PDFs are kept as a run artifact for 14 days.

`MONGODB_URI` must be set in two places:
- GitHub → Settings → Secrets and variables → Actions → `MONGODB_URI` (for the cron)
- Vercel → Project → Settings → Environment Variables → `MONGODB_URI` (for the site; redeploy after changing it)

To backfill or re-run by hand, go to **Actions → Daily data ingest → Run workflow**, and optionally enter a start/end date. If a run fails (for example because a source changed its URLs), GitHub emails the repo owner, and the site keeps serving the last good data.

### Running the ingest locally

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
export MONGODB_URI="mongodb+srv://..."          # or mongodb://127.0.0.1:27017/

.venv/bin/python python-scripts/ingest.py                         # last 3 days
.venv/bin/python python-scripts/ingest.py --months 3 --workers 6  # backfill ~3 months (~30 min)
.venv/bin/python python-scripts/ingest.py --start 2025-06-01 --end 2025-10-31 --workers 6
.venv/bin/python python-scripts/ingest.py --fill-gaps               # retry days GSDMA lists but the DB lacks
.venv/bin/python python-scripts/ingest.py --days 7 --dry-run      # parse only, no DB
.venv/bin/python python-scripts/ingest.py --pdf report.pdf --kind rainfall --date 2026-09-24
```

The dam portal takes about 60 s per PDF, so use `--workers` for backfills. GSDMA's rainfall archive goes back to 2015, and the dam portal's to 2019, so older seasons can be backfilled with `--start`. Rainfall reports only exist for the monsoon season (roughly June–November).

### Data coverage (as of 26 Sep 2026)

The database was backfilled from 26 Sep 2024.

**Rainfall** (compared with the days GSDMA published):

| Season | Published by GSDMA | In database |
|---|---|---|
| 2024 | 26 Sep – 29 Nov (start of backfill range) | complete except 28 Sep |
| 2025 | 2 Jun – 30 Nov | complete except 6 Jun, 4 Nov |
| 2026 | 2 Jun – 25 Sep | 1 – 3 Sep and 7 – 25 Sep only; **2 Jun – 31 Aug and 4 – 6 Sep missing** |

Missing rainfall days:

| Missing | Days | Why |
|---|---|---|
| **2 Jun – 31 Aug 2026** | **91** | GSDMA lists these reports, but its server returns `401 Access denied` for the files, and the gujaratweather.com mirror has already deleted them. No other archive (including the Wayback Machine) has copies. |
| 4 – 6 Sep 2026 | 3 | Same cause |
| 28 Sep 2024, 6 Jun 2025, 4 Nov 2025 | 1 each | GSDMA only has the short "descending" report for these days, which lists only talukas that got rain and has no season totals. Skipped on purpose, because loading them would show every other taluka as zero. |

Rainfall reports are only published during the monsoon (roughly June–November), so there's no rainfall data outside those months by design.

**Dams:** every day from 26 Sep 2024 onwards. The report is published daily all year.

**Recovering the 2026 gap:**

1. **Automatic:** every scheduled run uses `--fill-gaps`, which retries GSDMA-listed days missing from the database. The gap fills itself if GSDMA fixes access to those files.
2. **Ask GSDMA** to fix the file permissions on `https://gsdma.org/uploads/Rainfall/` (contact on their site: ceo-gsdma@gujarat.gov.in, 079-23259276).
3. **Load saved copies:** if anyone kept the daily PDFs, load each one with
   `python python-scripts/ingest.py --pdf <file> --kind rainfall --date YYYY-MM-DD`.

### Parser notes

- `python-scripts/parser.py` splits each rainfall page at the second table's "Sr." header, not the page midpoint, because the columns aren't equal width. It also reads lines that hold more than one record.
- Region is derived from district, since the PDF's column order can't be trusted for it.
- District and state average rows are dropped.
- The boundary map (`public/gujarat_tehsil.geojson`) predates some newer talukas, and a few names differ from the reports. `lib/rain.ts` (`talukaKey`) maps them, including talukas that share a name across districts (Kalol, Mahuva, Mangrol, Maliya).

## Web app

```bash
npm install
echo 'MONGODB_URI=mongodb://127.0.0.1:27017/rainfall-data' > .env.local
npm run dev
```

Environment variables (set in Vercel):

| Variable | Used for |
|---|---|
| `MONGODB_URI` | API routes under `app/api/*` |

API routes (all read-only):

- `GET /api/rainfall-dates`: sorted list of dates that have data
- `GET /api/rainfall-data?date=DD/MM/YYYY`: all talukas for one day
- `GET /api/rainfall-data?taluka=Name`: one taluka's history
- `GET /api/reservoir-dates`, `GET /api/reservoir-data?date=…` / `?reservoir=Name`: the same for dams
- `GET /api/status`: latest date per dataset and the last ingest run

`npm run lint` type-checks the project. `npm run build` also type-checks and fails on errors.

## Blog

Posts are listed in [`content/posts.ts`](content/posts.ts); there's no external service or API key. Each entry has a `title`, an `href`, and optionally an `image`, `summary` and `date`.

- **A post written on this site:** create `app/blog/<slug>/page.tsx`, then add an entry with `href: "/blog/<slug>"`.
- **A post hosted elsewhere:** add an entry with the full `https://…` URL. It opens in a new tab.

Put images in `public/` and reference them as `/my-image.jpg`.
