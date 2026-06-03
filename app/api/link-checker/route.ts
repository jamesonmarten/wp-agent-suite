import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const maxDuration = 60;

type LinkResult = {
  source: string;
  url: string;
  status: number | null;
  ok: boolean;
  redirect?: string | null;
  error?: string;
  type: "internal" | "external";
};

const USER_AGENT =
  "Mozilla/5.0 (compatible; DC-LinkChecker/1.0; +https://wp.devcabin.tech)";
const FETCH_TIMEOUT_MS = 8000;
const CONCURRENCY = 8;
const MAX_LINKS = 500;

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "User-Agent": USER_AGENT, ...(init.headers || {}) },
      redirect: "manual",
    });
  } finally {
    clearTimeout(t);
  }
}

async function loadUrls(input: {
  sitemapUrl?: string;
  pageUrls?: string[];
}): Promise<string[]> {
  if (input.pageUrls && input.pageUrls.length) {
    return input.pageUrls.slice(0, 50);
  }
  if (!input.sitemapUrl) return [];
  try {
    const res = await fetchWithTimeout(input.sitemapUrl);
    const text = await res.text();
    // Sitemap index or urlset — extract <loc> values
    const locs = Array.from(text.matchAll(/<loc>([^<]+)<\/loc>/g)).map(
      (m) => m[1].trim()
    );
    if (!locs.length) return [input.sitemapUrl];
    // If first looks like a nested sitemap, fetch up to 3 children
    const isIndex = /<sitemapindex/i.test(text);
    if (isIndex) {
      const child: string[] = [];
      for (const loc of locs.slice(0, 3)) {
        try {
          const sub = await fetchWithTimeout(loc);
          const subText = await sub.text();
          const subLocs = Array.from(
            subText.matchAll(/<loc>([^<]+)<\/loc>/g)
          ).map((m) => m[1].trim());
          child.push(...subLocs);
        } catch {
          /* ignore */
        }
      }
      return child.slice(0, 50);
    }
    return locs.slice(0, 50);
  } catch {
    return [input.sitemapUrl];
  }
}

async function extractLinks(
  pageUrl: string
): Promise<Array<{ source: string; url: string }>> {
  try {
    const res = await fetchWithTimeout(pageUrl, {
      headers: { Accept: "text/html" },
    });
    if (!res.ok && res.status !== 301 && res.status !== 302) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const seen = new Set<string>();
    const out: Array<{ source: string; url: string }> = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      const trimmed = href.trim();
      if (
        !trimmed ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("mailto:") ||
        trimmed.startsWith("tel:") ||
        trimmed.startsWith("javascript:")
      )
        return;
      let abs: string;
      try {
        abs = new URL(trimmed, pageUrl).toString();
      } catch {
        return;
      }
      if (seen.has(abs)) return;
      seen.add(abs);
      out.push({ source: pageUrl, url: abs });
    });
    return out;
  } catch {
    return [];
  }
}

async function checkLink(
  source: string,
  url: string,
  rootOrigin: string
): Promise<LinkResult> {
  let type: "internal" | "external" = "external";
  try {
    type = new URL(url).origin === rootOrigin ? "internal" : "external";
  } catch {
    /* keep external */
  }
  // HEAD first, fall back to GET on 405/403
  try {
    let res = await fetchWithTimeout(url, { method: "HEAD" }, 6000);
    if (
      res.status === 405 ||
      res.status === 403 ||
      res.status === 400 ||
      res.status === 501
    ) {
      res = await fetchWithTimeout(
        url,
        { method: "GET", headers: { Range: "bytes=0-0" } },
        6000
      );
    }
    const redirect =
      res.status >= 300 && res.status < 400
        ? res.headers.get("location") || null
        : null;
    return {
      source,
      url,
      status: res.status,
      ok: res.status >= 200 && res.status < 400,
      redirect,
      type,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed";
    return {
      source,
      url,
      status: null,
      ok: false,
      error: msg,
      type,
    };
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  limit: number,
  onResult: (r: R) => void
): Promise<void> {
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      const r = await worker(items[idx]);
      onResult(r);
    }
  });
  await Promise.all(runners);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sitemapUrl, pageUrls } = body as {
      sitemapUrl?: string;
      pageUrls?: string[];
    };

    if (!sitemapUrl && (!pageUrls || pageUrls.length === 0)) {
      return NextResponse.json(
        { error: "Provide a sitemapUrl or pageUrls[]." },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) =>
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

        try {
          send({ type: "status", message: "Loading sitemap / pages…" });
          const pages = await loadUrls({ sitemapUrl, pageUrls });
          if (!pages.length) {
            send({ type: "error", message: "No pages found to scan." });
            controller.close();
            return;
          }
          send({ type: "pages", count: pages.length, pages });

          let rootOrigin = "";
          try {
            rootOrigin = new URL(pages[0]).origin;
          } catch {
            /* ignore */
          }

          send({ type: "status", message: "Extracting links from pages…" });
          const allLinks: Array<{ source: string; url: string }> = [];
          for (const page of pages) {
            const links = await extractLinks(page);
            allLinks.push(...links);
            send({
              type: "extracted",
              page,
              count: links.length,
              total: allLinks.length,
            });
            if (allLinks.length >= MAX_LINKS) break;
          }

          // Dedupe by URL (keep first source)
          const seen = new Map<string, { source: string; url: string }>();
          for (const l of allLinks) if (!seen.has(l.url)) seen.set(l.url, l);
          const unique = Array.from(seen.values()).slice(0, MAX_LINKS);

          send({
            type: "checking",
            total: unique.length,
            message: `Checking ${unique.length} unique links…`,
          });

          let checked = 0;
          let broken = 0;
          let redirects = 0;
          await runWithConcurrency(
            unique,
            (l) => checkLink(l.source, l.url, rootOrigin),
            CONCURRENCY,
            (r) => {
              checked++;
              if (!r.ok) broken++;
              if (r.redirect) redirects++;
              send({
                type: "result",
                checked,
                total: unique.length,
                broken,
                redirects,
                result: r,
              });
            }
          );

          send({
            type: "done",
            total: unique.length,
            checked,
            broken,
            redirects,
            ok: checked - broken,
          });
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown stream error";
          send({ type: "error", message: msg });
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
