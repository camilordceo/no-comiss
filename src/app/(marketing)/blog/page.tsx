import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { SEED_POSTS } from "@/lib/content/seed-posts";

export const metadata: Metadata = {
  title: "Blog — AI Home Selling Tips & FSBO Guides",
  description:
    "Learn how to sell your home without paying 5-6% agent commission. FSBO tips, AI home selling guides, and real success stories.",
};

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: dbPosts } = await supabase
    .from("content_pieces")
    .select("slug, title, excerpt, topic, reading_time_minutes, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const posts = dbPosts && dbPosts.length > 0 ? dbPosts : SEED_POSTS;

  return (
    <div className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">Blog</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Sell smarter. Keep more.
          </h1>
          <p className="text-gray-500">
            Guides, tips, and real stories from homeowners who sold without paying 5-6% commission.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {posts.map((post, i) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <Card className="h-full hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6 flex flex-col h-full">
                  {i === 0 && (
                    <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full mb-3 self-start">
                      Featured
                    </span>
                  )}
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{post.topic}</p>
                  <h2 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      {post.reading_time_minutes} min read
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-primary">
                      Read more <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
