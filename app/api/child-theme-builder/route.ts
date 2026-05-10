import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const { request, theme, themeVersion, changes } = await req.json();
  if (!request) return NextResponse.json({ error: "Request description is required" }, { status: 400 });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `You are an expert WordPress developer specializing in child themes, CSS customization, and PHP development. A client needs the following customization:

- Requested Change: ${request}
- Parent Theme: ${theme || "Unknown (provide generic and theme-specific versions)"}
- Theme Version: ${themeVersion || "Latest"}
- Additional Context: ${changes || "None"}

Generate a complete development package including:

1. **Solution Overview** — Plain-English explanation of what will be built and why this approach is correct.

2. **Child Theme Setup** (if not already using one):
   - \`style.css\` with proper header
   - \`functions.php\` boilerplate
   - Directory structure

3. **CSS Snippet** — Complete, commented CSS code that achieves the requested change. Include:
   - Desktop styles
   - Mobile responsive breakpoints
   - Inline comments explaining each rule

4. **PHP Snippet** (if needed) — Any \`functions.php\` code required, with full comments.

5. **Theme-Specific Notes** — If Divi, Elementor, Astra, GeneratePress, Kadence, OceanWP, or Avada are involved, provide theme-specific implementation instructions.

6. **Conflict Warnings** — List any known plugin conflicts (e.g., page builders overriding CSS, caching plugins requiring purge).

7. **How to Implement** — Step-by-step numbered instructions for a non-technical client.

8. **Testing Checklist** — 5–8 items to verify the change works correctly across browsers and devices.

Format in clean Markdown. Wrap all code in proper fenced code blocks with language identifiers (\`\`\`css, \`\`\`php). Make the code production-ready and well-commented.`;

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
