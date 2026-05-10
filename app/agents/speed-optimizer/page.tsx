"use client";
import { useState } from "react";
import AgentLayout from "@/components/AgentLayout";

export default function SpeedOptimizer() {
  const [form, setForm] = useState({ url: "", theme: "", hosting: "" });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function update(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function runAgent() {
    if (!form.url.trim()) return;
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/speed-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value));
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { width: "100%", background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { display: "block" as const, fontSize: 13, fontWeight: 600 as const, color: "rgba(255,255,255,0.6)", marginBottom: 6 };

  return (
    <AgentLayout
      icon="⚡"
      name="Site Speed Optimizer Agent"
      tagline="Get a prioritized Core Web Vitals fix list — ready to turn into a $499 optimization proposal."
      badgeLabel="Performance"
      badgeColor="#eab308"
      incomeNote="$499 one-time optimization + $97/mo monitoring"
    >
      <div style={{ background: "#12121a", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>WordPress Site URL *</label>
          <input value={form.url} onChange={(e) => update("url", e.target.value)} placeholder="https://yourclient.com" style={inputStyle} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Theme (optional)</label>
            <input value={form.theme} onChange={(e) => update("theme", e.target.value)} placeholder="e.g. Divi, Elementor, Astra…" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Hosting Provider (optional)</label>
            <input value={form.hosting} onChange={(e) => update("hosting", e.target.value)} placeholder="e.g. SiteGround, WP Engine, Bluehost…" style={inputStyle} />
          </div>
        </div>
        <button onClick={runAgent} disabled={loading || !form.url.trim()} style={{ width: "100%", padding: "12px", borderRadius: 10, background: loading ? "#333" : "linear-gradient(135deg,#a16207,#eab308)", color: loading ? "#666" : "#000", fontWeight: 700, fontSize: 15, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Analyzing performance…" : "⚡ Generate Speed Audit"}
        </button>
      </div>

      {(output || loading) && (
        <div style={{ background: "#12121a", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
              {loading ? "⏳ Running Core Web Vitals analysis…" : "✅ Speed Audit Complete"}
            </span>
            {output && (
              <button onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 8, background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)", color: copied ? "#34d399" : "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                {copied ? "✓ Copied!" : "Copy Report"}
              </button>
            )}
          </div>
          <pre style={{ padding: 24, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "inherit", maxHeight: 600, overflowY: "auto" }}>
            {output}
            {loading && <span style={{ color: "#eab308" }}>▋</span>}
          </pre>
        </div>
      )}

      <div style={{ marginTop: 20, borderRadius: 14, padding: "18px 20px", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#eab308", marginBottom: 8 }}>💡 How to Monetize This Agent</p>
        <ul style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
          <li>Offer as a <strong style={{ color: "rgba(255,255,255,0.6)" }}>$499 speed optimization service</strong> — use report as proposal</li>
          <li>Run it for every new client site as part of <strong style={{ color: "rgba(255,255,255,0.6)" }}>onboarding</strong></li>
          <li>Bundle into care plans to <strong style={{ color: "rgba(255,255,255,0.6)" }}>justify higher monthly fees</strong></li>
          <li>Run it on competitors&apos; client sites as a <strong style={{ color: "rgba(255,255,255,0.6)" }}>cold outreach tool</strong></li>
        </ul>
      </div>
    </AgentLayout>
  );
}
