"use client";
import Link from "next/link";
import { ReactNode } from "react";

interface Props {
  icon: string;
  name: string;
  tagline: string;
  badgeLabel: string;
  badgeColor: string;
  incomeNote: string;
  children: ReactNode;
}

export default function AgentLayout({ icon, name, tagline, badgeLabel, badgeColor, incomeNote, children }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0f5" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "14px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚙️</div>
            <span style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>WP Agent Suite</span>
          </div>
          <Link href="/" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>← All Agents</Link>
        </div>
      </header>

      {/* Agent Hero */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 8 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `${badgeColor}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
            {icon}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>{name}</h1>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: `${badgeColor}22`, color: badgeColor, border: `1px solid ${badgeColor}44` }}>
                {badgeLabel}
              </span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: 0 }}>{tagline}</p>
          </div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#34d399", fontWeight: 600, marginTop: 8 }}>
          💰 {incomeNote}
        </div>
      </section>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
        {children}
      </div>
    </div>
  );
}
