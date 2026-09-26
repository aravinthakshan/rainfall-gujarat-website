import { NextRequest } from 'next/server';

// The dam portal only accepts connections from India, so the daily ingest
// (GitHub Actions, US runners) fetches the PDF through this route, which runs
// in Vercel's Mumbai region. It only ever fetches the portal's daily report.
export const runtime = 'nodejs';
export const preferredRegion = 'bom1';
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const date = new URL(req.url).searchParams.get('date') ?? '';
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const day = m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN;
  const today = Date.now();
  if (Number.isNaN(day) || day < Date.UTC(2019, 0, 1) || day > today + 86400000) {
    return new Response('date must be YYYY-MM-DD between 2019 and today', { status: 400 });
  }

  const url = `https://wrd-dam.gujarat.gov.in/downloads/home_pdf.php?dt=${Buffer.from(date).toString('base64')}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (RainInsight ingest; IIT Gandhinagar Water & Climate Lab)' },
      signal: AbortSignal.timeout(110_000),
      cache: 'no-store',
    });
  } catch (e) {
    return new Response(`upstream unreachable: ${(e as Error).name}`, { status: 504 });
  }
  const body = new Uint8Array(await res.arrayBuffer());
  const isPdf = body.length > 4 && body[0] === 0x25 && body[1] === 0x50 && body[2] === 0x44 && body[3] === 0x46; // %PDF
  if (!res.ok || !isPdf) {
    return new Response('no report for this date', { status: 404, headers: { 'Cache-Control': 'public, s-maxage=3600' } });
  }

  // Reports older than a few days don't change: cache them on the CDN for a long time.
  const settled = today - day > 3 * 86400000;
  return new Response(body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': settled ? 'public, s-maxage=31536000, immutable' : 'public, s-maxage=3600',
    },
  });
}
