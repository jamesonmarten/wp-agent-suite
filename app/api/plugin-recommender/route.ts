import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { businessType, goals, budget, techLevel } = await req.json();
    if (!businessType) return NextResponse.json({ error: "Business type is required" }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server misconfigured: OPENAI_API_KEY is not set." },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

  const prompt = `You are a senior WordPress consultant. A client has described their business:

- Business Type: ${businessType}
- Goals: ${goals || "Not specified"}
- Budget: ${budget || "Not specified"}
- Technical Level: ${techLevel || "Beginner"}

Build a complete, curated WordPress plugin stack recommendation report. Include:

1. **Recommended Plugin Stack** — A table with columns: Plugin Name | Category | Free/Paid | Cost | Why It's Recommended
   Include plugins for: SEO, Security, Performance/Caching, Backups, Contact/Forms, Page Builder, E-commerce (if relevant), Analytics, and any business-specific needs.

2. **Compatibility Notes** — Flag any known conflicts between recommended plugins.

3. **Setup Priority Order** — Number the plugins in the order they should be installed and configured.

4. **Estimated Total Cost** — Monthly and annual breakdown (free + paid tiers).

5. **Implementation Quote** — A suggested price range for a WordPress developer to set up this stack professionally ($297–$997 depending on complexity). Frame it as the value of hiring a professional vs. DIY.

6. **Red Flags to Avoid** — List 3–5 popular but problematic plugins they should avoid and why.

Format in clean Markdown with tables, headers, and ✅ / ⚠️ / ❌ icons where relevant.`;

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
