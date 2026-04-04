import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

const client = new Anthropic();

const TOPICS = [
  "FSBO Guide",
  "Success Stories",
  "Market Trends",
  "Marketing Tips",
  "Cost Analysis",
  "AI & Technology",
  "Legal & Closing",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, topic, keywords } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const postTopic = topic ?? TOPICS[Math.floor(Math.random() * TOPICS.length)];

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Write a detailed, SEO-optimized blog post for NoComiss — an AI-powered FSBO home selling platform.

Title: "${title}"
Topic category: ${postTopic}
${keywords ? `Keywords to include: ${keywords}` : ""}

Requirements:
- Write in Markdown format
- Start with a compelling hook paragraph (no heading)
- Include 3-5 H2 subheadings (## heading)
- Use specific numbers, examples, and data points
- Mention AI tools and NoComiss naturally (not spammy)
- End with a motivating conclusion
- Target audience: US homeowners considering selling FSBO
- Tone: modern, direct, trustworthy — not salesy
- Length: 600-900 words

Output ONLY the markdown content, nothing else.`,
        },
      ],
    });

    const content =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Count words for reading time
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.max(3, Math.round(wordCount / 200));

    // Generate excerpt from first paragraph
    const firstParagraph = content.split("\n").find((line) => {
      const trimmed = line.trim();
      return trimmed.length > 50 && !trimmed.startsWith("#");
    }) ?? "";
    const excerpt = firstParagraph.slice(0, 200).replace(/\*\*/g, "") + (firstParagraph.length > 200 ? "..." : "");

    const slug = slugify(title);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("content_pieces")
      .insert({
        slug,
        title,
        excerpt,
        topic: postTopic,
        content,
        reading_time_minutes: readingTime,
        status: "published",
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("content_pieces insert error:", error.message);
      return NextResponse.json(
        { ok: true, slug, content, excerpt, reading_time_minutes: readingTime },
      );
    }

    return NextResponse.json({ ok: true, post: data });
  } catch (err) {
    console.error("content generate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
