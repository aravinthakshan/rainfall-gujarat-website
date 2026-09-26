"""
Daily ingest: download the Gujarat rainfall + reservoir PDFs, parse them and
upsert into MongoDB. Replaces the manual admin upload / Render microservice.

Sources
  Rainfall  (SEOC 24-hr taluka report)
    primary:  GSDMA archive, listed per year by
              POST https://gsdma.org/GetFileData.aspx/GetColumnChartData {"Type":"2","Year":YYYY}
    fallback: gujaratweather.com mirror (keeps only recent days)
    https://www.gujaratweather.com/wp-content/uploads/YYYY/MM/24-HRS-RAINFALL-DATA-DT.DD.MM.YYYY.pdf
  Reservoir (N.W.R.W.S. & Kalpsar Dept daily dam report)
    https://wrd-dam.gujarat.gov.in/downloads/home_pdf.php?dt=<base64 YYYY-MM-DD>

Usage
  python python-scripts/ingest.py                       # last 3 days (idempotent)
  python python-scripts/ingest.py --date 2026-09-24
  python python-scripts/ingest.py --start 2026-06-01 --end 2026-09-25
  python python-scripts/ingest.py --months 3 --workers 6  # backfill ~3 months
  python python-scripts/ingest.py --days 7 --dry-run    # parse only, no DB writes
  python python-scripts/ingest.py --pdf report.pdf --kind rainfall --date 2026-09-24

Dates are stored as DD/MM/YYYY, which is what the frontend expects.
"""

import argparse
import base64
import logging
import os
import re
import sys
import threading
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import pdfplumber
import requests

sys.path.insert(0, os.path.dirname(__file__))
from parser import FixedRainfallParser  # noqa: E402

log = logging.getLogger("ingest")

DB_NAME = "rainfall-data"
RAINFALL_COLLECTION = "rainfalldatas"
RESERVOIR_COLLECTION = "reservoirdatas"
RUNS_COLLECTION = "ingestruns"

HEADERS = {"User-Agent": "Mozilla/5.0 (RainInsight ingest; IIT Gandhinagar Water & Climate Lab)"}


# --------------------------------------------------------------------------- #
# Download
# --------------------------------------------------------------------------- #
_gsdma_cache: dict[int, dict[str, str]] = {}
_gsdma_lock = threading.Lock()


def gsdma_index(year: int) -> dict[str, str]:
    """{'MM/DD/YYYY': pdf_url} for every rainfall report GSDMA has for a year."""
    with _gsdma_lock:
        if year not in _gsdma_cache:
            try:
                r = requests.post(
                    "https://gsdma.org/GetFileData.aspx/GetColumnChartData",
                    json={"Type": "2", "Year": year},
                    headers=HEADERS,
                    timeout=60,
                )
                r.raise_for_status()
                # www.gsdma.org serves a self-signed certificate; the bare domain is valid
                _gsdma_cache[year] = {
                    row["Date"]: row["PDFName"].replace("http://www.gsdma.org", "https://gsdma.org")
                    for row in r.json()["d"]
                }
            except (requests.RequestException, ValueError, KeyError) as e:
                log.warning("  GSDMA index %s unavailable: %s", year, e)
                return {}  # not cached, so a later call retries
        return _gsdma_cache[year]


def rainfall_urls(d: date):
    official = gsdma_index(d.year).get(d.strftime("%m/%d/%Y"))
    if official:
        yield official
    stamp = d.strftime("%d.%m.%Y")
    # Posts are uploaded under the month they were published, which is usually
    # the report's month but can roll over on the 1st.
    months = {d.strftime("%Y/%m"), (d + timedelta(days=1)).strftime("%Y/%m")}
    for ym in sorted(months):
        yield f"https://www.gujaratweather.com/wp-content/uploads/{ym}/24-HRS-RAINFALL-DATA-DT.{stamp}.pdf"


def reservoir_url(d: date):
    token = base64.b64encode(d.isoformat().encode()).decode()
    return f"https://wrd-dam.gujarat.gov.in/downloads/home_pdf.php?dt={token}"


def fetch_pdf(urls, dest: Path):
    for url in urls:
        try:
            r = requests.get(url, headers=HEADERS, timeout=60)
        except requests.RequestException as e:
            log.warning("  %s -> %s", url, e)
            continue
        if r.status_code == 200 and r.content[:4] == b"%PDF":
            dest.write_bytes(r.content)
            log.info("  downloaded %s (%d KB)", url, len(r.content) // 1024)
            return dest
        log.info("  %s -> HTTP %s", url, r.status_code)
    return None


# --------------------------------------------------------------------------- #
# Parse
# --------------------------------------------------------------------------- #
def _num(v):
    if v is None:
        return 0.0
    s = str(v).replace("%", "").replace(",", "").strip()
    try:
        return float(s)
    except ValueError:
        return 0.0


def _clean(v):
    return re.sub(r"\s+", " ", str(v or "")).strip()


def parse_rainfall(pdf_path: Path, date_str: str):
    df = FixedRainfallParser().process_pdf_to_dataframe(str(pdf_path))
    records = []
    for row in df.to_dict("records"):
        taluka = _clean(row.get("taluka"))
        low = taluka.lower()
        if not taluka or "avg" in low or "average" in low or low.startswith("dist"):
            continue
        records.append({
            "region": _clean(row.get("region")),
            "district": _clean(row.get("district")),
            "sr_no": _num(row.get("sr_no")),
            "taluka": taluka,
            "avg_rain_1995_2024": _num(row.get("avg_rain_1995_2024")),
            "rain_till_yesterday": _num(row.get("rain_till_yesterday")),
            "rain_last_24hrs": _num(row.get("rain_last_24hrs")),
            "total_rainfall": _num(row.get("total_rainfall")),
            "percent_against_avg": _num(row.get("percent_against_avg")),
            "date": date_str,
        })
    return records


def parse_reservoir(pdf_path: Path, date_str: str):
    """Parse the 'Statement showing the details of dams in Gujarat' pages
    (one row per scheme, ~206 rows)."""
    records, seen = [], set()
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                if not table or not table[0]:
                    continue
                header = [_clean(c).lower() for c in table[0]]
                if "name of schemes" not in header or len(header) < 24:
                    continue
                for r in table[1:]:
                    if not r or not _clean(r[0]).isdigit():
                        continue  # sub-header / total rows
                    r = [_clean(c) for c in r]
                    name = r[5]
                    if not name or (r[1], name) in seen:
                        continue
                    seen.add((r[1], name))
                    records.append({
                        "SchemeId": int(_num(r[1])),
                        "LocationId": int(_num(r[2])),
                        "District": r[3],
                        "Taluka": r[4],
                        "Name of Schemes": name,
                        "Region": r[6],
                        "Type": r[7],
                        "OSL": _num(r[8]),
                        "FRL": _num(r[9]),
                        "PWL": _num(r[10]),
                        "DesignGross": _num(r[11]),
                        "DesignLive": _num(r[12]),
                        "DesignDead": _num(r[13]),
                        "PresentGross": _num(r[14]),
                        "PresentLive": _num(r[15]),
                        "PresentDead": _num(r[16]),
                        "PercentageFilling": _num(r[17]),
                        "RF": _num(r[18]),
                        "CRF": _num(r[19]),
                        "Warning": r[20].replace("WARNI NG", "WARNING"),
                        "InflowinCusecs": _num(r[21]),
                        "OutflowRiverinCusecs": _num(r[22]),
                        "outflowCanalinCusecs": _num(r[23]),
                        "date": date_str,
                    })
    return records


# --------------------------------------------------------------------------- #
# Store
# --------------------------------------------------------------------------- #
def upsert(db, collection, date_str, records):
    """Replace all rows for a date. Only touches the DB if we actually parsed
    something, so a failed download never wipes existing data."""
    if not records:
        return 0
    col = db[collection]
    col.delete_many({"date": date_str})
    col.insert_many(records)
    return len(records)


def run_for_date(d: date, db, workdir: Path, kinds, min_rows):
    date_str = d.strftime("%d/%m/%Y")
    result = {"date": date_str}
    log.info("== %s", date_str)

    if "rainfall" in kinds:
        pdf = fetch_pdf(rainfall_urls(d), workdir / f"rainfall_{d}.pdf")
        rows = parse_rainfall(pdf, date_str) if pdf else []
        ok = len(rows) >= min_rows["rainfall"]
        if pdf and not ok:
            log.warning("  rainfall: only %d rows parsed, skipping write", len(rows))
        result["rainfall"] = upsert(db, RAINFALL_COLLECTION, date_str, rows) if (db is not None and ok) else len(rows)
        log.info("  rainfall rows: %d", len(rows))

    if "reservoir" in kinds:
        pdf = fetch_pdf([reservoir_url(d)], workdir / f"reservoir_{d}.pdf")
        rows = parse_reservoir(pdf, date_str) if pdf else []
        ok = len(rows) >= min_rows["reservoir"]
        if pdf and not ok:
            log.warning("  reservoir: only %d rows parsed, skipping write", len(rows))
        result["reservoir"] = upsert(db, RESERVOIR_COLLECTION, date_str, rows) if (db is not None and ok) else len(rows)
        log.info("  reservoir rows: %d", len(rows))

    return result


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--date", help="single date YYYY-MM-DD")
    ap.add_argument("--start", help="range start YYYY-MM-DD")
    ap.add_argument("--end", help="range end YYYY-MM-DD (default: today)")
    ap.add_argument("--days", type=int, default=3, help="look back N days (default 3)")
    ap.add_argument("--months", type=int, help="look back N months (backfill)")
    ap.add_argument("--workers", type=int, default=1, help="dates fetched/parsed in parallel (default 1)")
    ap.add_argument("--kind", choices=["rainfall", "reservoir", "both"], default="both")
    ap.add_argument("--pdf", help="parse a local PDF instead of downloading (needs --date and --kind)")
    ap.add_argument("--dry-run", action="store_true", help="parse only, don't write to MongoDB")
    ap.add_argument("--workdir", default=os.environ.get("INGEST_WORKDIR", "/tmp/rain-ingest"))
    args = ap.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(message)s")
    logging.getLogger("pdfminer").setLevel(logging.ERROR)
    logging.getLogger().handlers[0].setLevel(logging.INFO)
    # the rainfall parser logs every line at INFO; keep our output readable
    logging.getLogger("root").setLevel(logging.WARNING)
    log.setLevel(logging.INFO)

    today = datetime.now(timezone(timedelta(hours=5, minutes=30))).date()  # IST
    parse = lambda s: datetime.strptime(s, "%Y-%m-%d").date()
    if args.date:
        dates = [parse(args.date)]
    elif args.start:
        start, end = parse(args.start), parse(args.end) if args.end else today
        dates = [start + timedelta(days=i) for i in range((end - start).days + 1)]
    else:
        n = args.months * 31 if args.months else args.days
        dates = [today - timedelta(days=i) for i in range(n - 1, -1, -1)]

    kinds = {"rainfall", "reservoir"} if args.kind == "both" else {args.kind}
    min_rows = {"rainfall": 200, "reservoir": 150}

    db = None
    if not args.dry_run:
        uri = os.environ.get("MONGODB_URI")
        if not uri:
            sys.exit("MONGODB_URI is not set (use --dry-run to test parsing without a DB)")
        from pymongo import MongoClient
        db = MongoClient(uri, serverSelectionTimeoutMS=15000)[DB_NAME]
        db.command("ping")

    workdir = Path(args.workdir)
    workdir.mkdir(parents=True, exist_ok=True)

    if args.pdf:
        if not args.date or args.kind == "both":
            sys.exit("--pdf needs --date and --kind rainfall|reservoir")
        date_str = dates[0].strftime("%d/%m/%Y")
        fn = parse_rainfall if args.kind == "rainfall" else parse_reservoir
        coll = RAINFALL_COLLECTION if args.kind == "rainfall" else RESERVOIR_COLLECTION
        rows = fn(Path(args.pdf), date_str)
        n = upsert(db, coll, date_str, rows) if db is not None else len(rows)
        log.info("%s %s: %d rows", args.kind, date_str, n)
        return

    if args.workers > 1:
        # The WRD server is slow (~60 s per PDF), so fetch dates concurrently.
        # MongoClient is thread-safe and each date writes a disjoint set of rows.
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            results = list(pool.map(lambda d: run_for_date(d, db, workdir, kinds, min_rows), dates))
    else:
        results = [run_for_date(d, db, workdir, kinds, min_rows) for d in dates]

    if db is not None:
        db[RUNS_COLLECTION].insert_one({
            "ranAt": datetime.now(timezone.utc),
            "results": results,
            "source": os.environ.get("GITHUB_WORKFLOW", "manual"),
        })

    total = sum(r.get("rainfall", 0) + r.get("reservoir", 0) for r in results)
    log.info("done: %d rows across %d date(s)", total, len(results))


if __name__ == "__main__":
    main()
