import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, CreditCard, Bell } from "lucide-react";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { UpgradeModal } from "@/components/dashboard/upgrade-modal";

export const metadata = { title: "Settings — NoComiss" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and subscription</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ProfileForm
            userId={user.id}
            initialData={{
              full_name: profile?.full_name ?? "",
              phone: profile?.phone ?? "",
              email: user.email ?? "",
              avatar_url: profile?.avatar_url,
              bio: profile?.bio,
              tiktok_handle: profile?.tiktok_handle,
              instagram_handle: profile?.instagram_handle,
            }}
          />
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                {profile?.subscription_tier
                  ? profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1) + " Plan"
                  : "Free"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {profile?.subscription_status === "active"
                  ? "Active · Renews next month"
                  : "No active subscription"}
              </p>
            </div>
            <Badge variant={profile?.subscription_status === "active" ? "success" : "neutral"}>
              {profile?.subscription_status === "active" ? "Active" : "Inactive"}
            </Badge>
          </div>
          {profile?.subscription_status !== "active" && (
            <UpgradeModal
              reason="Activate a plan to publish your listing and start receiving buyer leads."
              trigger={
                <Button size="md" className="w-full">Activate subscription</Button>
              }
            />
          )}
          {profile?.subscription_status === "active" && (
            <Button variant="outline" size="md">Manage plan</Button>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {[
              { label: "New leads via email",      description: "Get notified when a buyer submits an inquiry" },
              { label: "Weekly summary",            description: "Views, leads, and metrics for your listing" },
              { label: "Showing reminders",         description: "Reminder 24h before a confirmed showing" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                  <button
                    className="w-10 h-6 rounded-full bg-primary transition-colors relative"
                    role="switch"
                    aria-checked="true"
                    aria-label={item.label}
                  >
                    <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
                {i < 2 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
