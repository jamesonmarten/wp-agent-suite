/**
 * E2E API Test: Maintenance Report
 */
import { POST } from "@/app/api/maintenance-report/route";
import { NextRequest } from "next/server";

function makeRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/maintenance-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  clientName: "Acme Corp",
  siteName: "acmecorp.com",
  month: "March",
  year: "2026",
  pluginsUpdated: "12",
  themesUpdated: "1",
  backupsCompleted: "30",
  uptimePercent: "99.9",
  securityScans: "4",
  issuesResolved: "Fixed broken contact form",
  agencyName: "Dev Cabin Technologies",
};

describe("API: /api/maintenance-report", () => {
  it("returns 400 when clientName is missing", async () => {
    const res = await POST(makeRequest({ siteName: "example.com" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("required");
  });

  it("returns 400 when siteName is missing", async () => {
    const res = await POST(makeRequest({ clientName: "Acme Corp" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("required");
  });

  it("returns 400 when both fields are missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns streaming response with all fields", async () => {
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    const text = await res.text();
    expect(text.length).toBeGreaterThan(0);
  });

  it("works with only required fields (clientName + siteName)", async () => {
    const res = await POST(
      makeRequest({ clientName: "Test Client", siteName: "testclient.com" })
    );
    expect(res.status).toBe(200);
  });

  it("streams readable chunks", async () => {
    const res = await POST(makeRequest(validPayload));
    const reader = res.body!.getReader();
    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toBeInstanceOf(Uint8Array);
  });
});
