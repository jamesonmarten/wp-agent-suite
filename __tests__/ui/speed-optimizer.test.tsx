/**
 * UI Test: Speed Optimizer page
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SpeedOptimizer from "@/app/agents/speed-optimizer/page";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

function mockFetchStream(content: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(content));
      controller.close();
    },
  });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, body: stream } as unknown as Response);
}

describe("UI: Speed Optimizer", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the URL input", () => {
    render(<SpeedOptimizer />);
    expect(screen.getByPlaceholderText(/yourclient\.com/i)).toBeInTheDocument();
  });

  it("renders the generate button", () => {
    render(<SpeedOptimizer />);
    expect(screen.getByText(/Generate Speed Audit/i)).toBeInTheDocument();
  });

  it("button is disabled when URL is empty", () => {
    render(<SpeedOptimizer />);
    expect(screen.getByText(/Generate Speed Audit/i)).toBeDisabled();
  });

  it("button enables after typing a URL", async () => {
    render(<SpeedOptimizer />);
    await userEvent.type(screen.getByPlaceholderText(/yourclient\.com/i), "https://slow.com");
    expect(screen.getByText(/Generate Speed Audit/i)).not.toBeDisabled();
  });

  it("renders theme and hosting inputs", () => {
    render(<SpeedOptimizer />);
    expect(screen.getByPlaceholderText(/Divi|Elementor|Astra/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/SiteGround|WP Engine/i)).toBeInTheDocument();
  });

  it("calls the correct endpoint on submit", async () => {
    mockFetchStream("## Speed Audit\n\nLCP: 4.2s");
    render(<SpeedOptimizer />);
    await userEvent.type(screen.getByPlaceholderText(/yourclient\.com/i), "https://slow.com");
    await userEvent.click(screen.getByText(/Generate Speed Audit/i));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/speed-optimizer",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("displays streamed output after audit", async () => {
    mockFetchStream("Speed Audit Result: LCP needs improvement on this site");
    render(<SpeedOptimizer />);
    await userEvent.type(screen.getByPlaceholderText(/yourclient\.com/i), "https://slow.com");
    await userEvent.click(screen.getByText(/Generate Speed Audit/i));
    await waitFor(() => {
      expect(screen.getByText(/LCP needs improvement/i)).toBeInTheDocument();
    });
  });

  it("shows the monetization section", () => {
    render(<SpeedOptimizer />);
    expect(screen.getByText(/How to Monetize/i)).toBeInTheDocument();
  });
});
