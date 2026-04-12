import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingWizard } from "@/components/listing/wizard";

export const metadata: Metadata = { title: "Create Listing — NoComiss" };

export default async function NewListingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground">List your home</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            6 steps to a professional listing. Takes about 10 minutes.
          </p>
        </div>
        <ListingWizard userId={user.id} />
      </div>
    </div>
  );
}
