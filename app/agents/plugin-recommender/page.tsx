"use client";
import { useState } from "react";
import AgentLayout from "@/components/AgentLayout";

export default function PluginRecommender() {
  const [form, setForm] = useState({ businessType: "", goals: "", budget: "", techLevel: "Beginner" });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function update(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function runAgent() {
    if (!form.businessType.trim()) return;
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/plugin-recommender", {
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

  function copyToClipboard() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

  const labelStyle = { display: "block" as const, fontSize: 13, fontWeight: 600 as const, color: "rgba(255,255,255,0.6)", marginBottom: 6 };

  return (
    <AgentLayout
      icon="🔌"
      name="WordPress Plugin Recommender"
      tagline="Describe any business — get a hand-picked, conflict-checked plugin stack with implementation quote."
      badgeLabel="Consulting"
      badgeColor="#3b82f6"
      incomeNote="Charge $297–$997 to implement each recommended stack"
    >
      <div style={{ background: "#12121a", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Business Type *</label>
            <input value={form.businessType} onChange={(e) => update("businessType", e.target.value)} placeholder="e.g. Local restaurant, SaaS startup, Law firm…" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Monthly Budget for Plugins</label>
            <input value={form.budget} onChange={(e) => update("budget", e.target.value)} placeholder="e.g. Under $50/mo, $100–$200/mo…" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Business Goals / Needs</label>
          <textarea value={form.goals} onChange={(e) => update("goals", e.target.value)} placeholder="e.g. Accept online orders, capture leads, run a membership site, sell digital downloads…" rows={3} style={{ ...inputStyle, resize: "vertical" as const }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Client Technical Level</label>
          <select value={form.techLevel} onChange={(e) => update("techLevel", e.target.value)} style={inputStyle}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
        <button onClick={runAgent} disabled={loading || !form.businessType.trim()} style={{ width: "100%", padding: "12px", borderRadius: 10, background: loading ? "#333" : "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Building your plugin stack…" : "🔌 Generate Plugin Stack"}
        </button>
      </div>

      {(output || loading) && (
        <div style={{ background: "#12121a", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
              {loading ? "⏳ Curating your plugin stack…" : "✅ Plugin Stack Ready"}
            </span>
            {output && (
              <button onClick={copyToClipboard} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 8, background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)", color: copied ? "#34d399" : "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                {copied ? "✓ Copied!" : "Copy Report"}
              </button>
            )}
          </div>
          <pre style={{ padding: 24, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "inherit", maxHeight: 600, overflowY: "auto" }}>
            {output}
            {loading && <span style={{ color: "#a78bfa" }}>▋</span>}
          </pre>
        </div>
      )}

      <div style={{ marginTop: 20, borderRadius: 14, padding: "18px 20px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", marginBottom: 8 }}>💡 How to Monetize This Agent</p>
        <ul style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
          <li>Send the report as a <strong style={{ color: "rgba(255,255,255,0.6)" }}>free pre-sales deliverable</strong> to close new clients</li>
          <li>Charge <strong style={{ color: "rgba(255,255,255,0.6)" }}>$297–$997</strong> to implement the recommended stack</li>
          <li>Use affiliate links for premium plugins to earn <strong style={{ color: "rgba(255,255,255,0.6)" }}>passive commissions</strong></li>
          <li>Offer as a standalone <strong style={{ color: "rgba(255,255,255,0.6)" }}>$97 consulting report</strong> for DIY clients</li>
        </ul>
      </div>
    </AgentLayout>
  );
}
