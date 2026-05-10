/**
 * UI Test: Child Theme Builder page
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChildThemeBuilder from "@/app/agents/child-theme-builder/page";

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

describe("UI: Child Theme Builder", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the request textarea", () => {
    render(<ChildThemeBuilder />);
    expect(screen.getByPlaceholderText(/Change the header/i)).toBeInTheDocument();
  });

  it("renders the generate button", () => {
    render(<ChildThemeBuilder />);
    expect(screen.getByText(/Generate CSS & Child Theme Code/i)).toBeInTheDocument();
  });

  it("button is disabled when request is empty", () => {
    render(<ChildThemeBuilder />);
    expect(screen.getByText(/Generate CSS & Child Theme Code/i)).toBeDisabled();
  });

  it("button enables after entering a request", async () => {
    render(<ChildThemeBuilder />);
    await userEvent.type(
      screen.getByPlaceholderText(/Change the header/i),
      "Make the nav links bold"
    );
    expect(screen.getByText(/Generate CSS & Child Theme Code/i)).not.toBeDisabled();
  });

  it("renders the theme dropdown with popular themes", () => {
    render(<ChildThemeBuilder />);
    expect(screen.getByRole("option", { name: "Divi" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Astra" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Elementor (Hello)" })).toBeInTheDocument();
  });

  it("calls the correct endpoint on submit", async () => {
    mockFetchStream("```css\n.site-header { background: navy; }\n```");
    render(<ChildThemeBuilder />);
    await userEvent.type(
      screen.getByPlaceholderText(/Change the header/i),
      "Make header dark navy"
    );
    await userEvent.click(screen.getByText(/Generate CSS & Child Theme Code/i));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/child-theme-builder",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("displays streamed code output after generation", async () => {
    mockFetchStream("```css\n.site-header { background: navy; }\n```");
    render(<ChildThemeBuilder />);
    await userEvent.type(
      screen.getByPlaceholderText(/Change the header/i),
      "Make header dark navy"
    );
    await userEvent.click(screen.getByText(/Generate CSS & Child Theme Code/i));
    await waitFor(() => {
      expect(screen.getByText(/site-header/i)).toBeInTheDocument();
    });
  });

  it("shows the monetization section", () => {
    render(<ChildThemeBuilder />);
    expect(screen.getByText(/How to Monetize/i)).toBeInTheDocument();
  });
});
