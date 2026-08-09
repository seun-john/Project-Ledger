"use client";

import type { ViewMode } from "@/components/TrackerApp";

export type SortKey = "clientName" | "balance" | "nextDeadline" | "status";
export type SortDirection = "asc" | "desc";

interface Props {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function Toolbar({ view, onViewChange, search, onSearchChange }: Props) {
  return (
    <div className="toolbar">
      <div className="seg seg--view" role="group" aria-label="View mode">
        <button
          type="button"
          className={`seg-btn ${view === "kanban" ? "is-active" : ""}`}
          aria-pressed={view === "kanban"}
          onClick={() => onViewChange("kanban")}
        >
          Kanban
        </button>
        <button
          type="button"
          className={`seg-btn ${view === "list" ? "is-active" : ""}`}
          aria-pressed={view === "list"}
          onClick={() => onViewChange("list")}
        >
          List
        </button>
      </div>

      <div className="toolbar-actions">
        <label className="sr-only" htmlFor="project-search">
          Search projects
        </label>
        <input
          id="project-search"
          type="search"
          className="input input--search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search client or project…"
        />
        {/* A plain link, so the browser handles the download and the CSV is
            generated server-side from the same data the views use. */}
        <a className="btn btn-outline" href="/api/export/csv" download>
          Export CSV
        </a>
      </div>
    </div>
  );
}
