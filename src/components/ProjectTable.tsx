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
  // aria-sort belongs on the header cell, but the click target has to be a real
  // button — a bare <th onClick> is invisible to keyboard and screen-reader
  // users, so sorting was mouse-only.
  const sortableHeader = (key: SortKey, label: string, numeric = false) => {
    const active = sortKey === key;
    return (
      <th
        className={numeric ? "num" : ""}
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
        scope="col"
      >
        <button type="button" className="th-sort" onClick={() => onSort(key)}>
          {label}
          <span className="sort-arrow" aria-hidden="true">
            {active ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </span>
        </button>
      </th>
    );
  };

  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="sr-only">
          Projects, sortable. Activate a row to open its detail panel.
        </caption>
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
            <tr key={project.id}>
              <td className="strong">
                {/* One button per row, stretched over the whole row by its
                    ::after. That keeps the click-anywhere behaviour for the
                    mouse while giving the keyboard a single, real tab stop —
                    and it stays valid table markup, unlike wrapping the cells
                    in a button. */}
                <button
                  type="button"
                  className="row-open"
                  onClick={() => onOpenProject(project.id)}
                >
                  {project.clientName}
                  <span className="sr-only"> — open {project.projectTitle}</span>
                </button>
              </td>
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
