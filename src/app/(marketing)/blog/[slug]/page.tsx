import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SEED_POSTS } from "@/lib/content/seed-posts";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

async function getPost(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_pieces")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (data) return data;

  return SEED_POSTS.find((p) => p.slug === slug) ?? null;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderMarkdown(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-xl font-bold text-foreground mt-8 mb-3">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-3xl font-bold text-foreground mb-6">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      elements.push(
        <p key={i} className="font-semibold text-foreground my-2">
          {line.slice(2, -2)}
        </p>
      );
    } else if (line.startsWith("- ")) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-3 text-gray-600">
          {listItems.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      );
      continue;
    } else if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const headers = tableLines[0].split("|").filter((c) => c.trim());
      const rows = tableLines.slice(2).map((row) => row.split("|").filter((c) => c.trim()));
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {headers.map((h, j) => (
                  <th key={j} className="border border-gray-200 px-4 py-2 text-left font-semibold text-foreground">
                    {h.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="even:bg-gray-50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-gray-200 px-4 py-2 text-gray-600">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    } else if (line.trim() === "") {
      // skip blank lines
    } else {
      // Inline bold parsing
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      elements.push(
        <p key={i} className="text-gray-600 leading-relaxed my-2">
          {rendered}
        </p>
      );
    }
    i++;
  }

  return elements;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to blog
        </Link>

        <div className="mb-8">
          <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-3">
            {post.topic}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug mb-4">
            {post.title}
          </h1>
          <p className="text-gray-500 text-base leading-relaxed mb-5">{post.excerpt}</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.reading_time_minutes} min read
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.published_at)}
            </span>
          </div>
        </div>

        <hr className="border-border mb-8" />

        <article className="prose-custom">
          {renderMarkdown(post.content ?? "")}
        </article>

        <hr className="border-border mt-12 mb-8" />

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
          <p className="font-semibold text-foreground mb-1">Ready to keep your commission?</p>
          <p className="text-sm text-gray-500 mb-4">
            Join homeowners saving $20,000+ by selling with AI instead of a 6% agent.
          </p>
          <Link
            href="/start"
            className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-primary-hover transition-colors"
          >
            Start for free
          </Link>
        </div>
      </div>
    </div>
  );
}
