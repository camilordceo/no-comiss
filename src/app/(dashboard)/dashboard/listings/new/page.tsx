import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const metadata: Metadata = { title: "Publicar inmueble" };

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Publica tu inmueble</h1>
          <p className="text-gray-500 text-sm mt-1.5">
            En 5 pasos tienes un listing profesional listo para vender
          </p>
        </div>
        <OnboardingWizard userId={user.id} />
      </div>
    </div>
  );
}
