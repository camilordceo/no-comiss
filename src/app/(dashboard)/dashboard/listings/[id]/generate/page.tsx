import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GenerateClient } from "./generate-client";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Generate Listing — NoComiss" };

export default async function GeneratePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!listing) notFound();

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Generate your listing</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Our AI will write 3 versions of your listing. Pick the one that feels right.
          </p>
        </div>
        <GenerateClient listing={listing} />
      </div>
    </div>
  );
}
