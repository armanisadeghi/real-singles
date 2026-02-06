import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ReportsManager } from "./ReportsManager";

async function getInitialCounts(): Promise<{
  pending: number;
  resolved: number;
  dismissed: number;
}> {
  const supabase = createAdminClient();

  const [pendingResult, resolvedResult, dismissedResult] = await Promise.all([
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "resolved"),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "dismissed"),
  ]);

  return {
    pending: pendingResult.count || 0,
    resolved: resolvedResult.count || 0,
    dismissed: dismissedResult.count || 0,
  };
}

export default async function AdminReportsPage() {
  const counts = await getInitialCounts();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Reports"
        subtitle="Review and manage user-submitted reports"
        variant="hero"
        iconName="alert-triangle"
        iconGradient="from-amber-500 to-orange-500"
        stat={{
          value: counts.pending,
          label: "Pending Reviews",
        }}
      />

      <ReportsManager initialCounts={counts} />
    </div>
  );
}
