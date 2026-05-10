/**
 * UI Test: Plugin Recommender page
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PluginRecommender from "@/app/agents/plugin-recommender/page";

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

describe("UI: Plugin Recommender", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the business type input", () => {
    render(<PluginRecommender />);
    expect(screen.getByPlaceholderText(/restaurant|SaaS|Law firm/i)).toBeInTheDocument();
  });

  it("renders the generate button", () => {
    render(<PluginRecommender />);
    expect(screen.getByText(/Generate Plugin Stack/i)).toBeInTheDocument();
  });

  it("button is disabled when businessType is empty", () => {
    render(<PluginRecommender />);
    expect(screen.getByText(/Generate Plugin Stack/i)).toBeDisabled();
  });

  it("button enables after typing a business type", async () => {
    render(<PluginRecommender />);
    const input = screen.getByPlaceholderText(/restaurant|SaaS|Law firm/i);
    await userEvent.type(input, "Local restaurant");
    expect(screen.getByText(/Generate Plugin Stack/i)).not.toBeDisabled();
  });

  it("calls the correct API endpoint with all fields", async () => {
    mockFetchStream("## Plugin Stack\n\nYoast SEO | Free");
    render(<PluginRecommender />);
    await userEvent.type(screen.getByPlaceholderText(/restaurant|SaaS|Law firm/i), "Gym");
    await userEvent.click(screen.getByText(/Generate Plugin Stack/i));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/plugin-recommender",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("displays streamed output after generation", async () => {
    mockFetchStream("Plugin Stack: Yoast SEO recommended for this business");
    render(<PluginRecommender />);
    await userEvent.type(screen.getByPlaceholderText(/restaurant|SaaS|Law firm/i), "Gym");
    await userEvent.click(screen.getByText(/Generate Plugin Stack/i));
    await waitFor(() => {
      expect(screen.getByText(/Yoast SEO recommended/i)).toBeInTheDocument();
    });
  });

  it("renders the tech level dropdown with options", () => {
    render(<PluginRecommender />);
    expect(screen.getByDisplayValue("Beginner")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Intermediate" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Advanced" })).toBeInTheDocument();
  });

  it("shows the monetization section", () => {
    render(<PluginRecommender />);
    expect(screen.getByText(/How to Monetize/i)).toBeInTheDocument();
  });
});
