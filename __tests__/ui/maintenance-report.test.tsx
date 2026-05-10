/**
 * UI Test: Maintenance Report page
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MaintenanceReport from "@/app/agents/maintenance-report/page";

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

describe("UI: Maintenance Report", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders client name and site name inputs", () => {
    render(<MaintenanceReport />);
    expect(screen.getByPlaceholderText(/Acme Corp/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/acmecorp\.com/i)).toBeInTheDocument();
  });

  it("renders the generate button", () => {
    render(<MaintenanceReport />);
    expect(screen.getByText(/Generate Client Report/i)).toBeInTheDocument();
  });

  it("button is disabled when required fields are empty", () => {
    render(<MaintenanceReport />);
    expect(screen.getByText(/Generate Client Report/i)).toBeDisabled();
  });

  it("button enables when both required fields are filled", async () => {
    render(<MaintenanceReport />);
    await userEvent.type(screen.getByPlaceholderText(/Acme Corp/i), "Test Client");
    await userEvent.type(screen.getByPlaceholderText(/acmecorp\.com/i), "testclient.com");
    expect(screen.getByText(/Generate Client Report/i)).not.toBeDisabled();
  });

  it("renders month dropdown with all 12 months", () => {
    render(<MaintenanceReport />);
    expect(screen.getByRole("option", { name: "January" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "December" })).toBeInTheDocument();
  });

  it("calls the correct endpoint on submit", async () => {
    mockFetchStream("# Monthly Report\n\nAll good this month.");
    render(<MaintenanceReport />);
    await userEvent.type(screen.getByPlaceholderText(/Acme Corp/i), "Test Client");
    await userEvent.type(screen.getByPlaceholderText(/acmecorp\.com/i), "testclient.com");
    await userEvent.click(screen.getByText(/Generate Client Report/i));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/maintenance-report",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("displays streamed output after generation", async () => {
    mockFetchStream("# Monthly Report\n\nAll systems healthy.");
    render(<MaintenanceReport />);
    await userEvent.type(screen.getByPlaceholderText(/Acme Corp/i), "Test Client");
    await userEvent.type(screen.getByPlaceholderText(/acmecorp\.com/i), "testclient.com");
    await userEvent.click(screen.getByText(/Generate Client Report/i));
    await waitFor(() => {
      expect(screen.getByText(/Monthly Report/i)).toBeInTheDocument();
    });
  });

  it("shows the monetization section", () => {
    render(<MaintenanceReport />);
    expect(screen.getByText(/How to Monetize/i)).toBeInTheDocument();
  });
});
