import type { DashboardMetrics } from "@/lib/types";

type Tone = "neutral" | "warn" | "alert";

export function MetricCards({ metrics }: { metrics: DashboardMetrics }) {
  // Tone is driven by the value, not the label: a board with nothing overdue
  // shows four calm cards, so colour still means something when it appears.
  const cards: { label: string; value: string | number; hint: string; tone: Tone }[] = [
    {
      label: "Active projects",
      value: metrics.activeProjects,
      hint: "across all stages",
      tone: "neutral",
    },
    {
      label: "Outstanding balance",
      value: metrics.outstandingBalanceFmt,
      hint: "not yet collected",
      tone: "neutral",
    },
    {
      label: "Due this week",
      value: metrics.dueThisWeek,
      hint: "next 7 days",
      tone: metrics.dueThisWeek > 0 ? "warn" : "neutral",
    },
    {
      label: "Overdue",
      value: metrics.overdue,
      hint: "past deadline",
      tone: metrics.overdue > 0 ? "alert" : "neutral",
    },
  ];

  return (
    <div className="metrics">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`metric-card ${card.tone === "neutral" ? "" : `metric-card--${card.tone}`}`}
        >
          <span className="metric-label">{card.label}</span>
          <span className="metric-value">{card.value}</span>
          <span className="metric-hint">{card.hint}</span>
        </div>
      ))}
    </div>
  );
}
