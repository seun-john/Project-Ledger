"use client";

import { PaymentBadge, StatusBadge } from "@/components/Badges";
import type { SortDirection, SortKey } from "@/components/Toolbar";
import type { ProjectDTO } from "@/lib/types";

interface Props {
  projects: ProjectDTO[];
  sortKey: SortKey;
  sortDir: SortDirection;
  onSort: (key: SortKey) => void;
  onOpenProject: (id: string) => void;
}

export function ProjectTable({ projects, sortKey, sortDir, onSort, onOpenProject }: Props) {
  const sortableHeader = (key: SortKey, label: string, numeric = false) => (
    <th
      className={`sortable ${numeric ? "num" : ""}`}
      onClick={() => onSort(key)}
      aria-sort={sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      scope="col"
    >
      {label}
      <span className="sort-arrow" aria-hidden="true">
        {sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : ""}
      </span>
    </th>
  );

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {sortableHeader("clientName", "Client")}
            <th scope="col">Project</th>
            <th scope="col">Stage</th>
            <th scope="col">Payment</th>
            {sortableHeader("balance", "Balance", true)}
            {sortableHeader("nextDeadline", "Next deadline")}
            {sortableHeader("status", "Status")}
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} onClick={() => onOpenProject(project.id)}>
              <td className="strong">{project.clientName}</td>
              <td className="clip">{project.projectTitle}</td>
              <td className="muted">{project.stageName}</td>
              <td>
                <PaymentBadge status={project.paymentStatus} />
              </td>
              <td className="num strong">{project.balanceFmt}</td>
              <td>{project.nextDeadlineFmt}</td>
              <td>
                <StatusBadge status={project.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
