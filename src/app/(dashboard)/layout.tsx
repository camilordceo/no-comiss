import { requireDashboardSession } from "@/lib/hooks/use-session";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireDashboardSession();
  const name = session.profile.nombre ?? "";
  const avatarUrl = session.profile.avatar_url;
  const empresaName = session.empresa?.nombre ?? null;

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar
        email={session.email}
        name={name}
        avatarUrl={avatarUrl}
        empresaName={empresaName}
      />
      <div className="flex flex-1 flex-col">
        <Header email={session.email} name={name} avatarUrl={avatarUrl} />
        <main className="flex-1 px-5 pb-24 pt-8 md:px-10 md:pb-12 md:pt-10 animate-fade-up">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
