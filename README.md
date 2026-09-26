# Gujarat Monsoon Monitor

Taluka-level rainfall and reservoir storage for Gujarat, built by the Water & Climate Lab, IIT Gandhinagar.
Live at https://rainfall-gujarat-website.vercel.app

- **/maps**: choropleth of taluka rainfall (last 24 h, season total, % of annual average) and a dam storage map, each with daily history charts
- **/blog**: lab write-ups. External posts are listed from a Google Sheet.
- **/about**: the lab, the team and the data sources

Stack: Next.js 16 (App Router), React 19, Tailwind, Leaflet, Recharts, MongoDB. The data pipeline is Python.

## Data pipeline

Both sources publish one PDF per day. `python-scripts/ingest.py` downloads them, parses them and upserts into MongoDB.

| Data | Publisher | URL pattern |
|---|---|---|
| Taluka rainfall | State Emergency Operation Centre (SEOC), archived by GSDMA; gujaratweather.com mirror as fallback | listed per year via `POST https://gsdma.org/GetFileData.aspx/GetColumnChartData {"Type":"2","Year":YYYY}` (archive from 2015) |
| Dam storage | Narmada, Water Resources, Water Supply & Kalpsar Dept. | `https://wrd-dam.gujarat.gov.in/downloads/home_pdf.php?dt=<base64 of YYYY-MM-DD>` |

Collections in the `rainfall-data` database:

- `rainfalldatas`: one row per taluka per day, with `date` as `DD/MM/YYYY`
- `reservoirdatas`: one row per dam per day
- `ingestruns`: a log of each ingest run, shown by `/api/status`

Writes replace all rows for a date, so re-running a date is always safe. A date is only written if the PDF parsed into a plausible number of rows (≥200 talukas or ≥150 dams), so a bad download never wipes good data.

### Automatic daily updates

`.github/workflows/daily-ingest.yml` runs at 10:00, 16:00 and 22:00 IST and re-processes the last 3 days, which picks up reports published late.

One-time setup: add a repository secret **`MONGODB_URI`** (Settings → Secrets and variables → Actions).

To backfill or re-run by hand, go to **Actions → Daily data ingest → Run workflow**, and optionally enter a start/end date.

### Running the ingest locally

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
export MONGODB_URI="mongodb+srv://..."          # or mongodb://127.0.0.1:27017/

.venv/bin/python python-scripts/ingest.py                         # last 3 days
.venv/bin/python python-scripts/ingest.py --months 3 --workers 6  # backfill ~3 months (~30 min)
.venv/bin/python python-scripts/ingest.py --start 2025-06-01 --end 2025-10-31 --workers 6
.venv/bin/python python-scripts/ingest.py --days 7 --dry-run      # parse only, no DB
.venv/bin/python python-scripts/ingest.py --pdf report.pdf --kind rainfall --date 2026-09-24
```

The dam portal takes about 60 s per PDF, so use `--workers` for backfills. GSDMA's rainfall archive goes back to 2015, and the dam portal's to 2019, so older seasons can be backfilled with `--start`. Rainfall reports only exist for the monsoon season (roughly June–November).

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
| `NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY` | loading external posts on `/blog` from the Google Sheet |

API routes (all read-only):

- `GET /api/rainfall-dates`: sorted list of dates that have data
- `GET /api/rainfall-data?date=DD/MM/YYYY`: all talukas for one day
- `GET /api/rainfall-data?taluka=Name`: one taluka's history
- `GET /api/reservoir-dates`, `GET /api/reservoir-data?date=…` / `?reservoir=Name`: the same for dams
- `GET /api/status`: latest date per dataset and the last ingest run

`npm run lint` type-checks the project. `npm run build` also type-checks and fails on errors.

## Blog

External posts come from a Google Sheet with columns `title`, `image source`, `link to source`, and optionally `summary` and `date`. Rows missing a title or link are skipped. Internal posts live under `app/blog/<slug>/page.tsx` and are listed in `internalPosts` in `app/blog/blog-page.tsx`.
