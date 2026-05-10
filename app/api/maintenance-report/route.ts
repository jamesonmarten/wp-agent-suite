import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const { clientName, siteName, month, year, pluginsUpdated, themesUpdated, backupsCompleted, uptimePercent, securityScans, issuesResolved, agencyName } = await req.json();
  if (!clientName || !siteName) return NextResponse.json({ error: "Client name and site name are required" }, { status: 400 });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `You are a professional WordPress agency writing a monthly maintenance report for a client. Generate a polished, professional client-facing report using the following data:

- Client Name: ${clientName}
- Website: ${siteName}
- Report Period: ${month || "March"} ${year || "2026"}
- Plugins Updated: ${pluginsUpdated || 0}
- Themes Updated: ${themesUpdated || 0}
- Backups Completed: ${backupsCompleted || 0}
- Uptime: ${uptimePercent || "99.9"}%
- Security Scans Run: ${securityScans || 4}
- Issues Resolved: ${issuesResolved || "None"}
- Agency Name: ${agencyName || "Dev Cabin Technologies"}

Generate a full monthly maintenance report with:

1. **Header** — Agency logo placeholder, client name, site name, period, date
2. **Executive Summary** — 2–3 sentence overview of the month's activity
3. **Work Completed This Month** — Formatted table of all tasks with status ✅
4. **Site Health Score** — Visual score out of 100 based on the inputs
5. **Uptime Report** — Uptime percentage with context (industry standard = 99.9%)
6. **Security Report** — Scans run, threats blocked (simulate realistic numbers), firewall status
7. **Backup Report** — Backups completed, storage used, last successful restore test
8. **Performance Summary** — Brief note on page speed status
9. **Issues & Resolutions** — Any issues found and resolved
10. **Next Month's Plan** — 3–4 planned maintenance tasks
11. **Value Summary** — A section showing the dollar value of what was delivered (justify the care plan cost)
12. **Contact & Support** — Agency contact info placeholder

Format this as a professional Markdown document that could be copied into a PDF. Use tables, headers, and ✅ icons throughout. Make it look premium.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const streamResponse = await client.chat.completions.create({
        model: "gpt-4o",
        stream: true,
        messages: [{ role: "user", content: prompt }],
      });
      for await (const chunk of streamResponse) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
