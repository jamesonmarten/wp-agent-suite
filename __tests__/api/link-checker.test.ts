/**
 * E2E API Test: Broken Link Checker
 * Tests the route handler directly. Mocks global fetch + cheerio is real.
 */
import { POST } from "@/app/api/link-checker/route";
import { NextRequest } from "next/server";

function makeRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/link-checker", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/about</loc></url>
</urlset>`;

const PAGE_HTML = `<html><body>
  <a href="https://example.com/good">Good</a>
  <a href="https://example.com/broken">Broken</a>
  <a href="https://other.com/external">External</a>
  <a href="#top">Anchor</a>
  <a href="mailto:test@example.com">Email</a>
</body></html>`;

describe("API: /api/link-checker", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      // Sitemap response
      if (url.endsWith("sitemap.xml")) {
        return new Response(SITEMAP_XML, {
          status: 200,
          headers: { "Content-Type": "application/xml" },
        });
      }
      // Page HTML responses (GET for extraction)
      if (
        (url === "https://example.com/" || url === "https://example.com/about") &&
        (!init?.method || init.method === "GET")
      ) {
        return new Response(PAGE_HTML, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }
      // Broken link
      if (url === "https://example.com/broken") {
        return new Response(null, { status: 404 });
      }
      // External link
      if (url === "https://other.com/external") {
        return new Response(null, { status: 200 });
      }
      // Good link
      if (url === "https://example.com/good") {
        return new Response(null, { status: 200 });
      }
      // Default OK for HEAD checks
      return new Response(null, { status: 200 });
    }) as jest.Mock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns 400 when neither sitemapUrl nor pageUrls provided", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/sitemapUrl or pageUrls/);
  });

  it("returns 400 when pageUrls is empty array and no sitemap", async () => {
    const res = await POST(makeRequest({ pageUrls: [] }));
    expect(res.status).toBe(400);
  });

  it("returns NDJSON stream for a valid sitemap URL", async () => {
    const res = await POST(makeRequest({ sitemapUrl: "https://example.com/sitemap.xml" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/x-ndjson");
    expect(res.body).not.toBeNull();
  });

  it("accepts pageUrls list directly", async () => {
    const res = await POST(
      makeRequest({ pageUrls: ["https://example.com/", "https://example.com/about"] })
    );
    expect(res.status).toBe(200);
  });

  it("streams progress messages and a final done event", async () => {
    const res = await POST(makeRequest({ sitemapUrl: "https://example.com/sitemap.xml" }));
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    const events: Record<string, unknown>[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (line.trim()) events.push(JSON.parse(line));
      }
    }
    const types = events.map((e) => e.type);
    expect(types).toContain("pages");
    expect(types).toContain("checking");
    expect(types).toContain("result");
    expect(types).toContain("done");
  });

  it("flags broken links (404) as not ok", async () => {
    const res = await POST(
      makeRequest({ pageUrls: ["https://example.com/"] })
    );
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    const results: { ok: boolean; url: string; status: number | null }[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const e = JSON.parse(line);
        if (e.type === "result") results.push(e.result);
      }
    }
    const broken = results.find((r) => r.url === "https://example.com/broken");
    expect(broken).toBeDefined();
    expect(broken!.ok).toBe(false);
    expect(broken!.status).toBe(404);
  });
});
