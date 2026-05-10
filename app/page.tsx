"use client";
import Link from "next/link";

const agents = [
  {
    id: "vulnerability-scanner",
    icon: "🛡️",
    name: "Plugin Vulnerability Scanner",
    tagline: "Scan any WordPress site for outdated & vulnerable plugins",
    description:
      "Paste a URL and get a full security audit — plugin versions, known CVEs, risk scores, and a client-ready report. Sell as a $49 one-time scan or $97/mo monitoring subscription.",
    income: "$97/mo per site",
    badge: "Security",
    badgeColor: "#ef4444",
    accentColor: "rgba(239,68,68,0.15)",
  },
  {
    id: "plugin-recommender",
    icon: "🔌",
    name: "WordPress Plugin Recommender",
    tagline: "AI-curated plugin stacks for any business type",
    description:
      "Client describes their business, you get a hand-picked plugin stack with compatibility checks, licensing costs, and setup instructions. Upsell your implementation services on every recommendation.",
    income: "$297 setup fee",
    badge: "Consulting",
    badgeColor: "#3b82f6",
    accentColor: "rgba(59,130,246,0.15)",
  },
  {
    id: "speed-optimizer",
    icon: "⚡",
    name: "Site Speed Optimizer Agent",
    tagline: "Diagnose and fix Core Web Vitals for WordPress sites",
    description:
      "Enter a URL and get a prioritized fix list — image compression, caching config, render-blocking scripts, database cleanup. Deliver a $499 optimization report with implementation quote.",
    income: "$499 per audit",
    badge: "Performance",
    badgeColor: "#eab308",
    accentColor: "rgba(234,179,8,0.15)",
  },
  {
    id: "maintenance-report",
    icon: "📊",
    name: "Monthly Maintenance Report Agent",
    tagline: "Auto-generate branded client reports in seconds",
    description:
      "Input uptime stats, updates run, backups completed, and security scans — get a polished, white-label client report. Bundle into $99–$299/mo care plans as a tangible value deliverable.",
    income: "$199/mo care plans",
    badge: "Retention",
    badgeColor: "#22c55e",
    accentColor: "rgba(34,197,94,0.15)",
  },
  {
    id: "child-theme-builder",
    icon: "🎨",
    name: "Child Theme & CSS Snippet Agent",
    tagline: "Generate custom CSS and child theme code on demand",
    description:
      "Describe the design change needed — get exact CSS or PHP snippets, conflict warnings for Divi, Elementor, and Astra, plus a full child theme scaffold. Charge $97+ per request.",
    income: "$97 per snippet",
    badge: "Dev Tools",
    badgeColor: "#a855f7",
    accentColor: "rgba(168,85,247,0.15)",
  },
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0f5" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚙️</div>
            <div>
              <span style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>WP Agent Suite</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>by Dev Cabin Technologies</span>
            </div>
          </div>
          <a href="https://products.devcabin.tech" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
            ← Back to Products
          </a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 48px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, marginBottom: 20, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}>
          🟢 5 AI Agents · Live
        </div>
        <h1 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
          <span style={{ background: "linear-gradient(135deg,#a78bfa,#60a5fa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            WordPress AI Agents
          </span>
          <br />
          <span style={{ color: "#fff" }}>That Generate Real Income</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 17, maxWidth: 560, margin: "0 auto 28px", lineHeight: 1.7 }}>
          Each agent solves a real problem WordPress clients pay for. Run them yourself, sell as a service, or white-label for agencies.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, fontSize: 13, color: "rgba(255,255,255,0.35)", flexWrap: "wrap" }}>
          <span>🔑 Bring your own OpenAI key</span>
          <span>·</span>
          <span>⚡ Results in seconds</span>
          <span>·</span>
          <span>📄 Copy-paste ready output</span>
        </div>
      </section>

      {/* Agent Cards */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 20 }}>
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              style={{ textDecoration: "none" }}
            >
              <div style={{ background: "#12121a", borderRadius: 18, padding: 24, border: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden", cursor: "pointer", transition: "all 0.2s ease" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                {/* Accent top glow */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120, background: `linear-gradient(180deg, ${agent.accentColor} 0%, transparent 100%)`, pointerEvents: "none" }} />

                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${agent.accentColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                      {agent.icon}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: `${agent.accentColor}`, color: agent.badgeColor, border: `1px solid ${agent.badgeColor}30` }}>
                      {agent.badge}
                    </span>
                  </div>

                  <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{agent.name}</h2>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 10, lineHeight: 1.5 }}>{agent.tagline}</p>
                  <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 12, lineHeight: 1.6, marginBottom: 20 }}>{agent.description}</p>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#34d399" }}>💰 {agent.income}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Launch Agent →</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* API key notice */}
        <div style={{ marginTop: 40, borderRadius: 16, padding: "24px 32px", background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.08))", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 6 }}>Built by Dev Cabin Technologies</p>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
            Each agent requires an OpenAI API key. Add it to{" "}
            <code style={{ color: "#a78bfa", background: "rgba(167,139,250,0.1)", padding: "2px 6px", borderRadius: 4 }}>.env.local</code>{" "}
            as{" "}
            <code style={{ color: "#a78bfa", background: "rgba(167,139,250,0.1)", padding: "2px 6px", borderRadius: 4 }}>OPENAI_API_KEY</code>
          </p>
        </div>
      </section>
    </div>
  );
}
