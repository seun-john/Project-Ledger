import type { DashboardMetrics } from "@/lib/types";

export function MetricCards({ metrics }: { metrics: DashboardMetrics }) {
  const cards = [
    { label: "Active projects", value: metrics.activeProjects, hint: "across all stages" },
    { label: "Outstanding balance", value: metrics.outstandingBalanceFmt, hint: "not yet collected" },
    { label: "Due this week", value: metrics.dueThisWeek, hint: "next 7 days" },
    { label: "Overdue", value: metrics.overdue, hint: "past deadline" },
  ];

  return (
    <div className="metrics">
      {cards.map((card) => (
        <div key={card.label} className="metric-card">
          <span className="metric-label">{card.label}</span>
          <span className="metric-value">{card.value}</span>
          <span className="metric-hint">{card.hint}</span>
        </div>
      ))}
    </div>
  );
}
