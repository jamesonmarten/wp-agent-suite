"use client";
import { useState } from "react";
import AgentLayout from "@/components/AgentLayout";

type LinkRow = {
  source: string;
  url: string;
  status: number | null;
  ok: boolean;
  redirect?: string | null;
  error?: string;
  type: "internal" | "external";
};

type Summary = {
  total: number;
  checked: number;
  broken: number;
  redirects: number;
  ok: number;
};

export default function LinkChecker() {
  const [mode, setMode] = useState<"sitemap" | "list">("sitemap");
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [pageList, setPageList] = useState("");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [pagesFound, setPagesFound] = useState(0);
  const [extracted, setExtracted] = useState(0);
  const [progress, setProgress] = useState({ checked: 0, total: 0 });
  const [results, setResults] = useState<LinkRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filter, setFilter] = useState<"all" | "broken" | "redirects" | "ok">(
    "all"
  );
  const [copied, setCopied] = useState(false);

  const inputStyle = {
    width: "100%",
    background: "#0a0a0f",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
  };
  const labelStyle = {
    display: "block" as const,
    fontSize: 13,
    fontWeight: 600 as const,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 6,
  };

  async function run() {
    setRunning(true);
    setResults([]);
    setSummary(null);
    setStatus("Starting…");
    setPagesFound(0);
    setExtracted(0);
    setProgress({ checked: 0, total: 0 });

    const body: { sitemapUrl?: string; pageUrls?: string[] } = {};
    if (mode === "sitemap") {
      if (!sitemapUrl.trim()) {
        setRunning(false);
        return;
      }
      body.sitemapUrl = sitemapUrl.trim();
    } else {
      const urls = pageList
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (!urls.length) {
        setRunning(false);
        return;
      }
      body.pageUrls = urls;
    }

    try {
      const res = await fetch("/api/link-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.body) throw new Error("No stream from server");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            handleMsg(msg);
          } catch {
            /* ignore parse errors */
          }
        }
      }
    } catch (err) {
      setStatus(
        "⚠️ " + (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setRunning(false);
    }
  }

  function handleMsg(msg: Record<string, unknown>) {
    if (msg.type === "status") setStatus(String(msg.message));
    else if (msg.type === "pages") {
      setPagesFound(Number(msg.count));
      setStatus(`Found ${msg.count} pages to scan`);
    } else if (msg.type === "extracted") {
      setExtracted(Number(msg.total));
    } else if (msg.type === "checking") {
      setStatus(String(msg.message));
      setProgress({ checked: 0, total: Number(msg.total) });
    } else if (msg.type === "result") {
      setProgress({ checked: Number(msg.checked), total: Number(msg.total) });
      setResults((prev) => [...prev, msg.result as LinkRow]);
    } else if (msg.type === "done") {
      setSummary({
        total: Number(msg.total),
        checked: Number(msg.checked),
        broken: Number(msg.broken),
        redirects: Number(msg.redirects),
        ok: Number(msg.ok),
      });
      setStatus("✅ Scan complete");
    } else if (msg.type === "error") {
      setStatus("⚠️ " + String(msg.message));
    }
  }

  const filtered = results.filter((r) => {
    if (filter === "all") return true;
    if (filter === "broken") return !r.ok;
    if (filter === "redirects") return !!r.redirect;
    if (filter === "ok") return r.ok && !r.redirect;
    return true;
  });

  function toCSV(rows: LinkRow[]): string {
    const header = "source,url,status,ok,redirect,error,type";
    const escape = (s: string) =>
      `"${(s || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    const lines = rows.map((r) =>
      [
        escape(r.source),
        escape(r.url),
        r.status ?? "",
        r.ok ? "true" : "false",
        escape(r.redirect ?? ""),
        escape(r.error ?? ""),
        r.type,
      ].join(",")
    );
    return [header, ...lines].join("\n");
  }

  function toRedirectionCSV(rows: LinkRow[]): string {
    // Format compatible with the WordPress "Redirection" plugin CSV import:
    // source url, target url, regex, http code
    const header = "source,target,regex,code";
    const lines = rows
      .filter((r) => r.redirect)
      .map((r) => {
        try {
          const src = new URL(r.url).pathname;
          return `"${src}","${r.redirect}","0","301"`;
        } catch {
          return `"${r.url}","${r.redirect}","0","301"`;
        }
      });
    return [header, ...lines].join("\n");
  }

  function download(filename: string, content: string, mime = "text/csv") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function statusBadge(r: LinkRow) {
    const bg = !r.ok
      ? "rgba(239,68,68,0.15)"
      : r.redirect
      ? "rgba(234,179,8,0.15)"
      : "rgba(34,197,94,0.12)";
    const color = !r.ok ? "#fca5a5" : r.redirect ? "#fde047" : "#86efac";
    const label = r.status ?? r.error ?? "ERR";
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 6,
          background: bg,
          color,
        }}
      >
        {label}
      </span>
    );
  }

  return (
    <AgentLayout
      icon="🔗"
      name="Broken Link Checker & Redirect Mapper"
      tagline="Scan a sitemap, find broken links + redirects, and export to WordPress Redirection plugin format."
      badgeLabel="SEO Ops"
      badgeColor="#06b6d4"
      incomeNote="Charge $149–$497 per site audit · $49/mo recurring scans"
    >
      {/* Input card */}
      <div
        style={{
          background: "#12121a",
          borderRadius: 16,
          padding: 24,
          border: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setMode("sitemap")}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: mode === "sitemap" ? "rgba(6,182,212,0.15)" : "transparent",
              color: mode === "sitemap" ? "#67e8f9" : "rgba(255,255,255,0.5)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sitemap URL
          </button>
          <button
            onClick={() => setMode("list")}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: mode === "list" ? "rgba(6,182,212,0.15)" : "transparent",
              color: mode === "list" ? "#67e8f9" : "rgba(255,255,255,0.5)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Paste URL List
          </button>
        </div>

        {mode === "sitemap" ? (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Sitemap URL *</label>
            <input
              value={sitemapUrl}
              onChange={(e) => setSitemapUrl(e.target.value)}
              placeholder="https://example.com/sitemap.xml"
              style={inputStyle}
            />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
              Tip: most WordPress sites use <code>/sitemap.xml</code> or <code>/sitemap_index.xml</code>.
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Page URLs (one per line, max 50) *</label>
            <textarea
              value={pageList}
              onChange={(e) => setPageList(e.target.value)}
              placeholder={"https://example.com/\nhttps://example.com/about\nhttps://example.com/blog"}
              rows={6}
              style={{ ...inputStyle, fontFamily: "monospace", resize: "vertical" as const }}
            />
          </div>
        )}

        <button
          onClick={run}
          disabled={running || (mode === "sitemap" ? !sitemapUrl.trim() : !pageList.trim())}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            background: running ? "#333" : "linear-gradient(135deg,#0891b2,#06b6d4)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            border: "none",
            cursor: running ? "not-allowed" : "pointer",
          }}
        >
          {running ? "Scanning…" : "🔗 Run Link Check"}
        </button>
      </div>

      {/* Progress / status */}
      {(running || status) && (
        <div
          style={{
            background: "#12121a",
            borderRadius: 16,
            padding: 18,
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
              {status}
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              {pagesFound > 0 && `${pagesFound} pages · `}
              {extracted > 0 && `${extracted} links found · `}
              {progress.total > 0 && `${progress.checked}/${progress.total} checked`}
            </span>
          </div>
          {progress.total > 0 && (
            <div
              style={{
                height: 6,
                borderRadius: 4,
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(progress.checked / progress.total) * 100}%`,
                  background: "linear-gradient(90deg,#0891b2,#06b6d4)",
                  transition: "width 0.2s",
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            { label: "Total", value: summary.checked, color: "#fff" },
            { label: "OK", value: summary.ok, color: "#86efac" },
            { label: "Broken", value: summary.broken, color: "#fca5a5" },
            { label: "Redirects", value: summary.redirects, color: "#fde047" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#12121a",
                borderRadius: 12,
                padding: 16,
                border: "1px solid rgba(255,255,255,0.06)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <div
          style={{
            background: "#12121a",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              {(["all", "broken", "redirects", "ok"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: filter === f ? "rgba(6,182,212,0.15)" : "transparent",
                    color: filter === f ? "#67e8f9" : "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(toCSV(filtered));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  fontSize: 12,
                  padding: "5px 12px",
                  borderRadius: 6,
                  background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                  color: copied ? "#34d399" : "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                }}
              >
                {copied ? "✓ Copied" : "Copy CSV"}
              </button>
              <button
                onClick={() => download("link-check.csv", toCSV(filtered))}
                style={{
                  fontSize: 12,
                  padding: "5px 12px",
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                }}
              >
                ⬇ Full CSV
              </button>
              <button
                onClick={() =>
                  download("redirection-import.csv", toRedirectionCSV(results))
                }
                style={{
                  fontSize: 12,
                  padding: "5px 12px",
                  borderRadius: 6,
                  background: "rgba(6,182,212,0.12)",
                  color: "#67e8f9",
                  border: "1px solid rgba(6,182,212,0.3)",
                  cursor: "pointer",
                }}
                title="CSV formatted for the WordPress Redirection plugin"
              >
                ⬇ WP Redirection CSV
              </button>
            </div>
          </div>
          <div style={{ maxHeight: 480, overflowY: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  background: "#0f0f17",
                  textAlign: "left",
                }}
              >
                <tr>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
                    Status
                  </th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
                    URL
                  </th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
                    Found on
                  </th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
                    Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "8px 12px" }}>{statusBadge(r)}</td>
                    <td style={{ padding: "8px 12px", maxWidth: 360 }}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#67e8f9", textDecoration: "none", wordBreak: "break-all" }}
                      >
                        {r.url}
                      </a>
                      {r.redirect && (
                        <div style={{ fontSize: 11, color: "#fde047", marginTop: 2 }}>
                          → {r.redirect}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "8px 12px", maxWidth: 240 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", wordBreak: "break-all" }}>
                        {r.source}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: r.type === "internal" ? "rgba(59,130,246,0.12)" : "rgba(168,85,247,0.12)",
                          color: r.type === "internal" ? "#93c5fd" : "#d8b4fe",
                        }}
                      >
                        {r.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monetization */}
      <div
        style={{
          borderRadius: 14,
          padding: "18px 20px",
          background: "rgba(6,182,212,0.06)",
          border: "1px solid rgba(6,182,212,0.15)",
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, color: "#06b6d4", marginBottom: 8 }}>
          💡 How to Monetize This Agent
        </p>
        <ul
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.8,
            paddingLeft: 16,
            margin: 0,
          }}
        >
          <li>
            Sell <strong style={{ color: "rgba(255,255,255,0.6)" }}>$149–$497 SEO audits</strong> — broken links destroy rankings
          </li>
          <li>
            Offer <strong style={{ color: "rgba(255,255,255,0.6)" }}>$49/mo recurring scans</strong> as a care-plan add-on
          </li>
          <li>
            Deliver the <strong style={{ color: "rgba(255,255,255,0.6)" }}>WP Redirection CSV</strong> as a $99 implementation upsell
          </li>
          <li>
            Pair with <strong style={{ color: "rgba(255,255,255,0.6)" }}>site migration jobs</strong> — automate 301 mapping
          </li>
        </ul>
      </div>
    </AgentLayout>
  );
}
