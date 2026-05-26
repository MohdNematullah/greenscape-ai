import { useQuery } from "convex/react";
import {
  Users,
  FileText,
  FolderKanban,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckSquare,
  TrendingUp,
  ArrowRight,
  Trophy,
  UserX,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function DashboardPage() {
  const stats = useQuery(api.dashboard.stats);
  const activity = useQuery(api.dashboard.recentActivity);
  const pipeline = useQuery(api.dashboard.pipelineSummary);

  const kpis = [
    {
      label: "Total Leads",
      value: stats?.totalLeads ?? 0,
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40",
      href: "/leads",
    },
    {
      label: "Active Proposals",
      value: stats?.activeProposals ?? 0,
      icon: FileText,
      gradient: "from-emerald-500 to-green-500",
      bg: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40",
      href: "/proposals",
    },
    {
      label: "Pipeline Value",
      value: formatCurrency(stats?.pipelineValue ?? 0),
      icon: DollarSign,
      gradient: "from-green-500 to-teal-500",
      bg: "bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/40 dark:to-teal-950/40",
      href: "/proposals",
    },
    {
      label: "Active Projects",
      value: stats?.activeProjects ?? 0,
      icon: FolderKanban,
      gradient: "from-purple-500 to-violet-500",
      bg: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/40",
      href: "/projects",
    },
    {
      label: "Avg Quote Cycle",
      value: stats?.avgQuoteCycleDays ? `${stats.avgQuoteCycleDays}d` : "—",
      icon: Clock,
      gradient: (stats?.avgQuoteCycleDays ?? 0) > 3 ? "from-red-500 to-orange-500" : "from-green-500 to-emerald-500",
      bg: (stats?.avgQuoteCycleDays ?? 0) > 3 ? "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/40" : "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40",
      href: "/proposals",
      subtitle: "Target: 1-2 days",
    },
    {
      label: "Post-Sign Limbo",
      value: stats?.projectsInLimbo ?? 0,
      icon: AlertTriangle,
      gradient: (stats?.projectsInLimbo ?? 0) > 4 ? "from-orange-500 to-amber-500" : "from-green-500 to-emerald-500",
      bg: (stats?.projectsInLimbo ?? 0) > 4 ? "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40" : "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40",
      href: "/projects",
      subtitle: "Onboarding + Pre-construction",
    },
    {
      label: "Pending Approvals",
      value: stats?.pendingApprovals ?? 0,
      icon: CheckSquare,
      gradient: (stats?.pendingApprovals ?? 0) > 0 ? "from-red-500 to-rose-500" : "from-green-500 to-emerald-500",
      bg: (stats?.pendingApprovals ?? 0) > 0 ? "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40" : "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40",
      href: "/approvals",
      subtitle: "Awaiting decision",
    },
    {
      label: "Won Deals",
      value: stats?.wonDeals ?? 0,
      icon: Trophy,
      gradient: "from-amber-500 to-yellow-500",
      bg: "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40",
      href: "/leads",
    },
    {
      label: "Closed-Lost Leads",
      value: stats?.closedLostLeads ?? 0,
      icon: UserX,
      gradient: "from-gray-400 to-zinc-500",
      bg: "bg-gradient-to-br from-gray-50 to-zinc-50 dark:from-gray-900/40 dark:to-zinc-900/40",
      href: "/leads",
      subtitle: "Re-engagement opportunity",
    },
  ];

  const maxCount = Math.max(1, ...(pipeline?.map((s) => s.count) ?? [1]));

  return (
    <div className="space-y-8">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="size-6" />
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>
          <p className="text-green-100 text-lg">
            Greenscape operations at a glance — quote faster, close more, keep clients happy
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} to={kpi.href}>
            <Card className={`hover:shadow-lg transition-all duration-300 border-0 ${kpi.bg} hover:scale-[1.02]`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{kpi.label}</p>
                    <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                    {kpi.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">{kpi.subtitle}</p>
                    )}
                  </div>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${kpi.gradient} shadow-lg`}>
                    <kpi.icon className="size-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-green-50/30 dark:from-zinc-900 dark:to-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <TrendingUp className="size-4 text-white" />
              </div>
              Sales Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pipeline && pipeline.length > 0 ? (
              <div className="space-y-3">
                {pipeline.map((stage, i) => {
                  const colors = ["from-blue-500 to-cyan-500", "from-emerald-500 to-green-500", "from-violet-500 to-purple-500", "from-amber-500 to-yellow-500", "from-rose-500 to-pink-500"];
                  const color = colors[i % colors.length];
                  return (
                    <div key={stage.stage} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{stage.stage}</span>
                        <span className="text-muted-foreground">
                          {stage.count} · {formatCurrency(stage.value)}
                        </span>
                      </div>
                      <div className="h-7 bg-muted/50 rounded-lg overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${color} rounded-lg transition-all flex items-center justify-end pr-2.5`}
                          style={{ width: `${Math.max(6, (stage.count / maxCount) * 100)}%` }}
                        >
                          {stage.count > 0 && (
                            <span className="text-xs font-bold text-white drop-shadow-sm">
                              {stage.count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No pipeline data yet. Add leads to get started.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-violet-50/30 dark:from-zinc-900 dark:to-violet-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                <Clock className="size-4 text-white" />
              </div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity && activity.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {activity.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-start gap-3 text-sm border-b border-border/50 pb-3 last:border-0"
                  >
                    <div className="size-2.5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mt-1.5 shrink-0 shadow-sm" />
                    <div>
                      <p className="font-medium">{item.title}</p>
                      {item.description && (
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {item.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item._creationTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No activity yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-white to-emerald-50/30 dark:from-zinc-900 dark:to-emerald-950/20">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md">
              <Link to="/leads">
                <Users className="size-4 mr-2" />
                New Lead
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-950/30 dark:hover:to-cyan-950/30">
              <Link to="/proposals">
                <FileText className="size-4 mr-2" />
                Create Proposal
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:from-amber-950/30 dark:hover:to-orange-950/30">
              <Link to="/approvals">
                <CheckSquare className="size-4 mr-2" />
                Review Approvals
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 dark:hover:from-purple-950/30 dark:hover:to-violet-950/30">
              <Link to="/projects">
                <FolderKanban className="size-4 mr-2" />
                Project Board
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
