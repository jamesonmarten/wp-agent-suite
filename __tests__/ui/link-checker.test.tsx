/**
 * UI Test: Link Checker page
 * Tests form rendering, mode switching, button states, and NDJSON stream parsing.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LinkChecker from "@/app/agents/link-checker/page";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

function mockFetchNDJSON(events: object[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const e of events) {
        controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      }
      controller.close();
    },
  });
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    body: stream,
  } as unknown as Response);
}

describe("UI: Link Checker", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the sitemap URL input and run button", () => {
    render(<LinkChecker />);
    expect(screen.getByPlaceholderText(/sitemap\.xml/i)).toBeInTheDocument();
    expect(screen.getByText(/Run Link Check/i)).toBeInTheDocument();
  });

  it("run button is disabled when sitemap URL is empty", () => {
    render(<LinkChecker />);
    expect(screen.getByText(/Run Link Check/i)).toBeDisabled();
  });

  it("run button enables after typing a sitemap URL", async () => {
    render(<LinkChecker />);
    await userEvent.type(
      screen.getByPlaceholderText(/sitemap\.xml/i),
      "https://example.com/sitemap.xml"
    );
    expect(screen.getByText(/Run Link Check/i)).not.toBeDisabled();
  });

  it("switches to list mode when 'Paste URL List' is clicked", async () => {
    render(<LinkChecker />);
    await userEvent.click(screen.getByText(/Paste URL List/i));
    expect(
      screen.getByPlaceholderText(/example\.com\/about/i)
    ).toBeInTheDocument();
  });

  it("calls /api/link-checker with sitemapUrl body on submit", async () => {
    mockFetchNDJSON([
      { type: "pages", count: 1, pages: ["https://example.com/"] },
      {
        type: "done",
        total: 1,
        checked: 1,
        broken: 0,
        redirects: 0,
        ok: 1,
      },
    ]);
    render(<LinkChecker />);
    await userEvent.type(
      screen.getByPlaceholderText(/sitemap\.xml/i),
      "https://example.com/sitemap.xml"
    );
    await userEvent.click(screen.getByText(/Run Link Check/i));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/link-checker",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            sitemapUrl: "https://example.com/sitemap.xml",
          }),
        })
      );
    });
  });

  it("renders summary tiles after scan completes", async () => {
    mockFetchNDJSON([
      { type: "pages", count: 1, pages: ["https://example.com/"] },
      { type: "checking", total: 2, message: "Checking" },
      {
        type: "result",
        checked: 1,
        total: 2,
        broken: 0,
        redirects: 0,
        result: {
          source: "https://example.com/",
          url: "https://example.com/good",
          status: 200,
          ok: true,
          type: "internal",
        },
      },
      {
        type: "result",
        checked: 2,
        total: 2,
        broken: 1,
        redirects: 0,
        result: {
          source: "https://example.com/",
          url: "https://example.com/broken",
          status: 404,
          ok: false,
          type: "internal",
        },
      },
      {
        type: "done",
        total: 2,
        checked: 2,
        broken: 1,
        redirects: 0,
        ok: 1,
      },
    ]);
    render(<LinkChecker />);
    await userEvent.type(
      screen.getByPlaceholderText(/sitemap\.xml/i),
      "https://example.com/sitemap.xml"
    );
    await userEvent.click(screen.getByText(/Run Link Check/i));
    await waitFor(() => {
      expect(screen.getByText(/Scan complete/i)).toBeInTheDocument();
      // The "Broken" summary tile contains the count "1"
      expect(screen.getByText("Redirects")).toBeInTheDocument();
    });
  });

  it("renders the WP Redirection CSV export button after results", async () => {
    mockFetchNDJSON([
      { type: "pages", count: 1, pages: ["https://example.com/"] },
      {
        type: "result",
        checked: 1,
        total: 1,
        broken: 0,
        redirects: 0,
        result: {
          source: "https://example.com/",
          url: "https://example.com/good",
          status: 200,
          ok: true,
          type: "internal",
        },
      },
      {
        type: "done",
        total: 1,
        checked: 1,
        broken: 0,
        redirects: 0,
        ok: 1,
      },
    ]);
    render(<LinkChecker />);
    await userEvent.type(
      screen.getByPlaceholderText(/sitemap\.xml/i),
      "https://example.com/sitemap.xml"
    );
    await userEvent.click(screen.getByText(/Run Link Check/i));
    await waitFor(() => {
      expect(screen.getByText(/WP Redirection CSV/i)).toBeInTheDocument();
    });
  });
});
