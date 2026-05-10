/**
 * E2E API Test: Child Theme Builder
 */
import { POST } from "@/app/api/child-theme-builder/route";
import { NextRequest } from "next/server";

function makeRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/child-theme-builder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API: /api/child-theme-builder", () => {
  it("returns 400 when request description is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Request description is required");
  });

  it("returns 400 when request is empty string", async () => {
    const res = await POST(makeRequest({ request: "" }));
    expect(res.status).toBe(400);
  });

  it("returns streaming response for a valid request", async () => {
    const res = await POST(
      makeRequest({ request: "Change header background to dark navy on scroll" })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    const text = await res.text();
    expect(text.length).toBeGreaterThan(0);
  });

  it("accepts all optional fields", async () => {
    const res = await POST(
      makeRequest({
        request: "Add sticky CTA bar at bottom on mobile",
        theme: "Astra",
        themeVersion: "4.6.0",
        changes: "Using Elementor Pro, accent color #6B21A8",
      })
    );
    expect(res.status).toBe(200);
  });

  it("works with request only (no optional fields)", async () => {
    const res = await POST(
      makeRequest({ request: "Make the nav menu links bold and uppercase" })
    );
    expect(res.status).toBe(200);
  });

  it("streams readable chunks", async () => {
    const res = await POST(
      makeRequest({ request: "Add a full-screen mobile overlay menu" })
    );
    const reader = res.body!.getReader();
    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toBeInstanceOf(Uint8Array);
  });
});
