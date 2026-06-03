import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { url, theme, hosting } = await req.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server misconfigured: OPENAI_API_KEY is not set." },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

  const prompt = `You are a WordPress performance optimization expert. Analyze this site for speed issues:

- URL: ${url}
- Theme: ${theme || "Unknown"}
- Hosting: ${hosting || "Unknown"}

Generate a comprehensive Core Web Vitals & Speed Optimization Report as if you've run PageSpeed Insights, GTmetrix, and a manual audit. Include:

1. **Current Performance Score** — Simulate realistic scores: Mobile LCP, FID/INP, CLS, Overall Score (0-100). Show as a visual score card.

2. **Top Issues Found** — List 8–12 specific issues with:
   - Issue name
   - Impact level (🔴 Critical / 🟠 High / 🟡 Medium)
   - Estimated time savings (ms)
   - Fix description

3. **Image Optimization** — Specific recommendations for image formats, lazy loading, and sizing.

4. **Caching Strategy** — Recommend specific caching plugins and configurations for their hosting environment.

5. **Database Optimization** — Common WP database bloat issues and cleanup recommendations.

6. **Render-Blocking Resources** — Specific JS/CSS deferral and minification steps.

7. **Hosting Upgrade Recommendation** — If their hosting is limiting performance, recommend an upgrade path.

8. **Implementation Quote** — Frame this as a $499 one-time optimization service with a $97/mo maintenance option.

Format in clean Markdown. Use tables for the issues list. Be specific and actionable — this should read like a paid audit report.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
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
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error from OpenAI.";
        controller.enqueue(encoder.encode(`\n\n⚠️ **Error:** ${msg}\n`));
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
