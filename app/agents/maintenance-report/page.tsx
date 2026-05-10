"use client";
import { useState } from "react";
import AgentLayout from "@/components/AgentLayout";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function MaintenanceReport() {
  const [form, setForm] = useState({
    clientName: "", siteName: "", month: "March", year: "2026",
    pluginsUpdated: "", themesUpdated: "", backupsCompleted: "",
    uptimePercent: "99.9", securityScans: "4", issuesResolved: "", agencyName: "Dev Cabin Technologies"
  });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function update(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function runAgent() {
    if (!form.clientName.trim() || !form.siteName.trim()) return;
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/maintenance-report", {
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
      icon="📊"
      name="Monthly Maintenance Report Agent"
      tagline="Fill in the month's stats — get a polished, white-label client report in seconds."
      badgeLabel="Retention"
      badgeColor="#22c55e"
      incomeNote="Bundle into $99–$299/mo WordPress care plans"
    >
      <div style={{ background: "#12121a", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
        {/* Row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Client Name *</label>
            <input value={form.clientName} onChange={(e) => update("clientName", e.target.value)} placeholder="e.g. Acme Corp" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Website / Site Name *</label>
            <input value={form.siteName} onChange={(e) => update("siteName", e.target.value)} placeholder="e.g. acmecorp.com" style={inputStyle} />
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Report Month</label>
            <select value={form.month} onChange={(e) => update("month", e.target.value)} style={inputStyle}>
              {MONTHS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Year</label>
            <input value={form.year} onChange={(e) => update("year", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Agency Name</label>
            <input value={form.agencyName} onChange={(e) => update("agencyName", e.target.value)} placeholder="Your agency name" style={inputStyle} />
          </div>
        </div>

        {/* Row 3 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Plugins Updated</label>
            <input type="number" value={form.pluginsUpdated} onChange={(e) => update("pluginsUpdated", e.target.value)} placeholder="12" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Themes Updated</label>
            <input type="number" value={form.themesUpdated} onChange={(e) => update("themesUpdated", e.target.value)} placeholder="1" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Backups Completed</label>
            <input type="number" value={form.backupsCompleted} onChange={(e) => update("backupsCompleted", e.target.value)} placeholder="30" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Uptime %</label>
            <input value={form.uptimePercent} onChange={(e) => update("uptimePercent", e.target.value)} placeholder="99.9" style={inputStyle} />
          </div>
        </div>

        {/* Row 4 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Security Scans Run</label>
            <input type="number" value={form.securityScans} onChange={(e) => update("securityScans", e.target.value)} placeholder="4" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Issues Resolved (optional)</label>
            <input value={form.issuesResolved} onChange={(e) => update("issuesResolved", e.target.value)} placeholder="e.g. Fixed broken contact form, resolved SSL warning…" style={inputStyle} />
          </div>
        </div>

        <button onClick={runAgent} disabled={loading || !form.clientName.trim() || !form.siteName.trim()} style={{ width: "100%", padding: "12px", borderRadius: 10, background: loading ? "#333" : "linear-gradient(135deg,#166534,#22c55e)", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Generating report…" : "📊 Generate Client Report"}
        </button>
      </div>

      {(output || loading) && (
        <div style={{ background: "#12121a", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
              {loading ? "⏳ Writing your client report…" : "✅ Report Ready — Copy & Send to Client"}
            </span>
            {output && (
              <button onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 8, background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)", color: copied ? "#34d399" : "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                {copied ? "✓ Copied!" : "Copy Report"}
              </button>
            )}
          </div>
          <pre style={{ padding: 24, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "inherit", maxHeight: 600, overflowY: "auto" }}>
            {output}
            {loading && <span style={{ color: "#22c55e" }}>▋</span>}
          </pre>
        </div>
      )}

      <div style={{ marginTop: 20, borderRadius: 14, padding: "18px 20px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", marginBottom: 8 }}>💡 How to Monetize This Agent</p>
        <ul style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
          <li>Justifies your <strong style={{ color: "rgba(255,255,255,0.6)" }}>$99–$299/mo care plan</strong> with a tangible deliverable</li>
          <li>Takes 60 seconds to generate — <strong style={{ color: "rgba(255,255,255,0.6)" }}>replaces 2 hours of manual work</strong></li>
          <li>Clients who receive reports <strong style={{ color: "rgba(255,255,255,0.6)" }}>churn 40% less</strong> — they see the value</li>
          <li>Use as a <strong style={{ color: "rgba(255,255,255,0.6)" }}>free sample</strong> to convert clients from one-off to retainer</li>
        </ul>
      </div>
    </AgentLayout>
  );
}
