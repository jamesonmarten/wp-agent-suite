/**
 * E2E API Test: Speed Optimizer
 */
import { POST } from "@/app/api/speed-optimizer/route";
import { NextRequest } from "next/server";

function makeRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/speed-optimizer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API: /api/speed-optimizer", () => {
  it("returns 400 when URL is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("URL is required");
  });

  it("returns 400 when URL is empty string", async () => {
    const res = await POST(makeRequest({ url: "" }));
    expect(res.status).toBe(400);
  });

  it("returns streaming response for valid URL", async () => {
    const res = await POST(makeRequest({ url: "https://slowsite.com" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    const text = await res.text();
    expect(text.length).toBeGreaterThan(0);
  });

  it("accepts optional theme and hosting fields", async () => {
    const res = await POST(
      makeRequest({
        url: "https://example.com",
        theme: "Astra",
        hosting: "SiteGround",
      })
    );
    expect(res.status).toBe(200);
  });

  it("works without optional theme/hosting", async () => {
    const res = await POST(makeRequest({ url: "https://example.com" }));
    expect(res.status).toBe(200);
  });

  it("streams readable chunks", async () => {
    const res = await POST(makeRequest({ url: "https://example.com" }));
    const reader = res.body!.getReader();
    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toBeInstanceOf(Uint8Array);
  });
});
