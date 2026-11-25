import { describe, expect, it } from "vitest";
import { getRouter } from "@/router";
import { sitemapStaticPaths, sitemapXML } from "@/lib/sitemap";

describe("Public sitemap", () => {
  it("includes only the analyzer, reading course and test, not downloads or the sitemap endpoint", () => {
    expect(sitemapStaticPaths(getRouter())).toEqual(["/", "/how-to-read-wireshark-capture", "/learn", "/learn/test", "/pcap-file-analyzer-online"]);
  });

  it("uses the public origin without invented last-modified dates", () => {
    const xml = sitemapXML("https://pktivo.com", [{ path: "/" }, { path: "/learn" }]);
    expect(xml).toContain("<loc>https://pktivo.com/</loc>");
    expect(xml).toContain("<loc>https://pktivo.com/learn</loc>");
    expect(xml).not.toContain("<lastmod>");
  });

  it("rejects external paths and removes duplicates", () => {
    expect(() => sitemapXML("https://pktivo.com", [{ path: "//other.example/" }])).toThrow("Invalid sitemap path");
    expect(sitemapXML("https://pktivo.com", [{ path: "/learn" }, { path: "/learn" }]).match(/<url>/g)).toHaveLength(1);
  });
});