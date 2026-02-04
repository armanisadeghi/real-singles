import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface DeploymentStats {
  today: {
    deployments: number;
    linesAdded: number;
    linesDeleted: number;
    filesChanged: number;
  };
  week: {
    deployments: number;
    linesAdded: number;
    linesDeleted: number;
    filesChanged: number;
  };
  month: {
    deployments: number;
    linesAdded: number;
    linesDeleted: number;
    filesChanged: number;
  };
  averageTimeBetweenDeployments: string;
  totalDeployments: number;
}

/**
 * GET /api/version/stats
 * Returns deployment statistics for last 24 hours, week, and month
 */
export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();
    const now = new Date();
    
    // Calculate time boundaries
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Get all deployments for the month (to calculate all stats)
    const { data: monthlyDeployments, error: monthlyError } = await supabaseAdmin
      .from("app_version")
      .select("id, deployed_at, lines_added, lines_deleted, files_changed")
      .gte("deployed_at", oneMonthAgo)
      .order("deployed_at", { ascending: false });

    if (monthlyError) {
      console.error("Error fetching monthly deployments:", monthlyError);
      return NextResponse.json(
        { error: "Failed to fetch deployment stats" },
        { status: 500 }
      );
    }

    // Get total count
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from("app_version")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error counting deployments:", countError);
    }

    // Calculate stats for each time period
    const todayDeployments = monthlyDeployments?.filter(
      (d) => new Date(d.deployed_at) >= new Date(twentyFourHoursAgo)
    ) || [];
    
    const weekDeployments = monthlyDeployments?.filter(
      (d) => new Date(d.deployed_at) >= new Date(oneWeekAgo)
    ) || [];
    
    const monthDeploymentsFiltered = monthlyDeployments || [];

    // Helper function to aggregate stats
    const aggregateStats = (deployments: typeof monthlyDeployments) => {
      if (!deployments || deployments.length === 0) {
        return {
          deployments: 0,
          linesAdded: 0,
          linesDeleted: 0,
          filesChanged: 0,
        };
      }
      
      return {
        deployments: deployments.length,
        linesAdded: deployments.reduce((sum, d) => sum + (d.lines_added || 0), 0),
        linesDeleted: deployments.reduce((sum, d) => sum + (d.lines_deleted || 0), 0),
        filesChanged: deployments.reduce((sum, d) => sum + (d.files_changed || 0), 0),
      };
    };

    // Calculate average time between deployments (using week data)
    let averageTimeBetweenDeployments = "N/A";
    if (weekDeployments.length > 1) {
      const times = weekDeployments
        .map((d) => new Date(d.deployed_at).getTime())
        .sort((a, b) => b - a);

      let totalDiff = 0;
      for (let i = 0; i < times.length - 1; i++) {
        totalDiff += times[i] - times[i + 1];
      }

      const avgDiffMs = totalDiff / (times.length - 1);
      const avgDiffMinutes = avgDiffMs / (1000 * 60);
      const avgDiffHours = avgDiffMs / (1000 * 60 * 60);

      if (avgDiffMinutes < 60) {
        averageTimeBetweenDeployments = `${Math.round(avgDiffMinutes)}m`;
      } else if (avgDiffHours < 24) {
        averageTimeBetweenDeployments = `${Math.round(avgDiffHours)}h`;
      } else {
        averageTimeBetweenDeployments = `${Math.round(avgDiffHours / 24)}d`;
      }
    }

    const stats: DeploymentStats = {
      today: aggregateStats(todayDeployments),
      week: aggregateStats(weekDeployments),
      month: aggregateStats(monthDeploymentsFiltered),
      averageTimeBetweenDeployments,
      totalDeployments: totalCount || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error in version stats endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
