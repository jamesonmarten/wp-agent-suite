"use client";
import { useState } from "react";
import AgentLayout from "@/components/AgentLayout";

export default function ChildThemeBuilder() {
  const [form, setForm] = useState({ request: "", theme: "", themeVersion: "", changes: "" });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function update(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function runAgent() {
    if (!form.request.trim()) return;
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/child-theme-builder", {
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

  const popularThemes = ["Divi", "Elementor (Hello)", "Astra", "GeneratePress", "Kadence", "OceanWP", "Avada", "Flatsome", "Neve", "Other"];

  return (
    <AgentLayout
      icon="🎨"
      name="Child Theme & CSS Snippet Agent"
      tagline="Describe any design change — get production-ready CSS, PHP snippets, and a full child theme scaffold."
      badgeLabel="Dev Tools"
      badgeColor="#a855f7"
      incomeNote="Charge $97–$497 per customization request"
    >
      <div style={{ background: "#12121a", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>What do you need to change or build? *</label>
          <textarea value={form.request} onChange={(e) => update("request", e.target.value)} placeholder="e.g. Change the header background to dark navy on scroll, make the mobile menu full-screen overlay, add a sticky CTA bar at the bottom on mobile…" rows={4} style={{ ...inputStyle, resize: "vertical" as const }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Parent Theme</label>
            <select value={form.theme} onChange={(e) => update("theme", e.target.value)} style={inputStyle}>
              <option value="">Select theme…</option>
              {popularThemes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Theme Version (optional)</label>
            <input value={form.themeVersion} onChange={(e) => update("themeVersion", e.target.value)} placeholder="e.g. 5.4.2" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Additional Context (optional)</label>
          <input value={form.changes} onChange={(e) => update("changes", e.target.value)} placeholder="e.g. Using WooCommerce, Elementor Pro, client wants purple #6B21A8 as accent color…" style={inputStyle} />
        </div>
        <button onClick={runAgent} disabled={loading || !form.request.trim()} style={{ width: "100%", padding: "12px", borderRadius: 10, background: loading ? "#333" : "linear-gradient(135deg,#6b21a8,#a855f7)", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Writing your code…" : "🎨 Generate CSS & Child Theme Code"}
        </button>
      </div>

      {(output || loading) && (
        <div style={{ background: "#12121a", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
              {loading ? "⏳ Writing production-ready code…" : "✅ Code Ready — Copy & Implement"}
            </span>
            {output && (
              <button onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 8, background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)", color: copied ? "#34d399" : "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                {copied ? "✓ Copied!" : "Copy Code"}
              </button>
            )}
          </div>
          <pre style={{ padding: 24, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "'Fira Code', 'Consolas', monospace", maxHeight: 600, overflowY: "auto" }}>
            {output}
            {loading && <span style={{ color: "#a855f7" }}>▋</span>}
          </pre>
        </div>
      )}

      <div style={{ marginTop: 20, borderRadius: 14, padding: "18px 20px", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#a855f7", marginBottom: 8 }}>💡 How to Monetize This Agent</p>
        <ul style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
          <li>Sell <strong style={{ color: "rgba(255,255,255,0.6)" }}>individual CSS fixes at $97–$197</strong> — takes 30 seconds to generate</li>
          <li>Bundle 10 customizations into a <strong style={{ color: "rgba(255,255,255,0.6)" }}>$497/mo dev retainer</strong></li>
          <li>Offer <strong style={{ color: "rgba(255,255,255,0.6)" }}>child theme setup as an add-on</strong> to every new site build (+$297)</li>
          <li>Use for <strong style={{ color: "rgba(255,255,255,0.6)" }}>rapid client deliveries</strong> — respond to requests same-day</li>
        </ul>
      </div>
    </AgentLayout>
  );
}
