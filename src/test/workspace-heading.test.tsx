import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-router")>()),
  Link: ({ to, children, ...rest }: { to: string; children?: React.ReactNode } & Record<string, unknown>) => <a href={to} {...rest}>{children}</a>,
}));

import { PktivoWorkspace } from "@/components/netlens-workspace";

// Search engines read the homepage's single h1 as the page's description, so it must
// stay a stable statement about the product instead of the loaded capture's filename.
describe("Workspace heading", () => {
  it("renders one stable h1 describing Pktivo as a browser-based packet analyzer", () => {
    render(<PktivoWorkspace />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toContain("Pktivo");
    expect(h1.textContent).toMatch(/browser-based network packet analyzer/i);
    expect(h1.textContent).not.toContain("sample-traffic.pcapng");
    expect(h1.textContent).not.toContain("No capture loaded");
  });

  it("still shows the loaded capture filename outside the heading", () => {
    render(<PktivoWorkspace />);

    expect(screen.getAllByText("sample-traffic.pcapng").length).toBeGreaterThan(0);
  });
});
