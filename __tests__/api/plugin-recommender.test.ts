/**
 * E2E API Test: Plugin Recommender
 */
import { POST } from "@/app/api/plugin-recommender/route";
import { NextRequest } from "next/server";

function makeRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/plugin-recommender", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API: /api/plugin-recommender", () => {
  it("returns 400 when businessType is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Business type is required");
  });

  it("returns 400 when businessType is empty string", async () => {
    const res = await POST(makeRequest({ businessType: "" }));
    expect(res.status).toBe(400);
  });

  it("returns streaming response for valid businessType", async () => {
    const res = await POST(makeRequest({ businessType: "Local restaurant" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    const text = await res.text();
    expect(text.length).toBeGreaterThan(0);
  });

  it("accepts all optional fields", async () => {
    const res = await POST(
      makeRequest({
        businessType: "SaaS startup",
        goals: "Capture leads and run webinars",
        budget: "$100-200/mo",
        techLevel: "Advanced",
      })
    );
    expect(res.status).toBe(200);
  });

  it("works with only businessType (no optional fields)", async () => {
    const res = await POST(makeRequest({ businessType: "Law firm" }));
    expect(res.status).toBe(200);
  });

  it("streams readable chunks", async () => {
    const res = await POST(makeRequest({ businessType: "E-commerce store" }));
    const reader = res.body!.getReader();
    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toBeInstanceOf(Uint8Array);
  });
});
