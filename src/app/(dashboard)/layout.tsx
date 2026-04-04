import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex shrink-0">
        <DashboardSidebar
          user={{
            email: user.email!,
            full_name: profile?.full_name ?? undefined,
            avatar_url: profile?.avatar_url ?? undefined,
          }}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
