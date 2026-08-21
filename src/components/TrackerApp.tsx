"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TRACKER_CONFIG } from "@/config/tracker.config";
import { api } from "@/lib/client/api-client";
import type { AppSettingsDTO, DashboardMetrics, ProjectDTO, StageDTO } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { MetricCards } from "@/components/MetricCards";
import { Toolbar, type SortKey, type SortDirection } from "@/components/Toolbar";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ProjectTable } from "@/components/ProjectTable";
import { ProjectDrawer } from "@/components/ProjectDrawer";
import { ProjectFormModal, type ProjectFormValues } from "@/components/ProjectFormModal";
import { SettingsModal } from "@/components/SettingsModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export type ViewMode = "kanban" | "list";

interface Props {
  settings: AppSettingsDTO;
  stages: StageDTO[];
  projects: ProjectDTO[];
  metrics: DashboardMetrics;
}

/**
 * A move into the terminal stage held back by the "balance outstanding" prompt
 * (spec §4). It carries the write to perform on confirmation, so the same gate
 * covers a drag, the drawer button, and a stage change made in the edit form.
 */
interface PendingCompletion {
  clientName: string;
  balanceFmt: string;
  commit: () => Promise<unknown>;
}

export function TrackerApp({ settings, stages, projects, metrics }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [view, setView] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("nextDeadline");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  /** Mirrors sortKey so toggleSort can compare against it before React re-renders. */
  const sortKeyRef = useRef<SortKey>("nextDeadline");

  const [drawerProjectId, setDrawerProjectId] = useState<string | null>(null);
  const [formState, setFormState] = useState<{ mode: "add" | "edit"; project?: ProjectDTO } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(!settings.onboardingComplete);
  const [pendingCompletion, setPendingCompletion] = useState<PendingCompletion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const terminalStageId = stages.length > 0 ? stages[stages.length - 1].id : null;

  /** Re-reads the server components so every view reflects the new computed values. */
  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setError(null);
      try {
        await action();
        refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        return false;
      }
    },
    [refresh],
  );

  const query = search.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!query) return projects;
    return projects.filter(
      (p) =>
        p.clientName.toLowerCase().includes(query) || p.projectTitle.toLowerCase().includes(query),
    );
  }, [projects, query]);

  const sorted = useMemo(() => {
    const statusRank = (p: ProjectDTO) =>
      p.status === "Overdue" ? 0 : p.status === "At risk" ? 1 : p.status === "Completed" ? 3 : 2;

    const value = (p: ProjectDTO): string | number => {
      switch (sortKey) {
        case "balance":
          return p.balanceMinor;
        case "status":
          return statusRank(p);
        case "clientName":
          return p.clientName.toLowerCase();
        default:
          // Undated projects sort to the end in ascending order.
          return p.nextDeadline || "9999-99-99";
      }
    };

    return [...visible].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [visible, sortKey, sortDir]);

  const drawerProject = drawerProjectId ? projects.find((p) => p.id === drawerProjectId) ?? null : null;

  // Functional updates: clicking the same header twice in quick succession is
  // one React batch, and reading sortKey/sortDir from the closure would make the
  // second click repeat the first instead of flipping the direction.
  const toggleSort = (key: SortKey) => {
    setSortDir((prevDir) => (key === sortKeyRef.current ? (prevDir === "asc" ? "desc" : "asc") : "asc"));
    setSortKey(key);
    sortKeyRef.current = key;
  };

  /**
   * True when this write would land a project with money still owed in the
   * final stage — the one case spec §4 asks us to confirm first.
   */
  const needsCompletionConfirm = (project: ProjectDTO, nextStageId: string) =>
    nextStageId === terminalStageId && project.stageId !== terminalStageId && project.balanceMinor > 0;

  const moveToStage = useCallback(
    async (project: ProjectDTO, stageId: string) => {
      if (project.stageId === stageId) return;

      if (needsCompletionConfirm(project, stageId)) {
        setPendingCompletion({
          clientName: project.clientName,
          balanceFmt: project.balanceFmt,
          commit: () => api.updateProject(project.id, { stageId }),
        });
        return;
      }
      await run(() => api.updateProject(project.id, { stageId }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run, terminalStageId],
  );

  const submitProject = useCallback(
    async (values: ProjectFormValues) => {
      const editing = formState?.mode === "edit" ? formState.project : undefined;

      if (editing && needsCompletionConfirm(editing, values.stageId)) {
        setPendingCompletion({
          clientName: editing.clientName,
          balanceFmt: editing.balanceFmt,
          commit: () => api.updateProject(editing.id, values),
        });
        setFormState(null);
        return;
      }

      const ok = await run(() =>
        editing ? api.updateProject(editing.id, values) : api.createProject(values),
      );
      if (ok) setFormState(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formState, run, terminalStageId],
  );

  const hasProjects = projects.length > 0;
  const noResults = hasProjects && query !== "" && visible.length === 0;
  const anyModalOpen = Boolean(
    drawerProject || formState || settingsOpen || pendingCompletion || deleteTarget,
  );

  const closeTopmost = () => {
    if (deleteTarget) setDeleteTarget(null);
    else if (pendingCompletion) setPendingCompletion(null);
    else if (formState) setFormState(null);
    else if (settingsOpen && settings.onboardingComplete) setSettingsOpen(false);
    else if (drawerProjectId) setDrawerProjectId(null);
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader
        settings={settings}
        onOpenSettings={() => setSettingsOpen(true)}
        onAddProject={() => setFormState({ mode: "add" })}
      />

      <main className="app-main">
        <MetricCards metrics={metrics} />

        <Toolbar
          view={view}
          onViewChange={setView}
          search={search}
          onSearchChange={setSearch}
        />

        {error ? (
          <div className="form-error" role="alert" style={{ marginBottom: 14 }}>
            {error}
          </div>
        ) : null}

        {!hasProjects ? (
          <div className="empty-state">
            <div className="empty-title">No projects yet</div>
            <div className="empty-text">
              Add your first client project to start tracking it from intake to completion.
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setFormState({ mode: "add" })}>
              + New project
            </button>
          </div>
        ) : noResults ? (
          <div className="empty-state empty-state--sm">
            <div className="empty-text">No projects match &ldquo;{search}&rdquo;.</div>
            <button type="button" className="btn btn-outline" onClick={() => setSearch("")}>
              Clear search
            </button>
          </div>
        ) : view === "kanban" ? (
          <KanbanBoard
            stages={stages}
            projects={visible}
            isSearching={query !== ""}
            onOpenProject={setDrawerProjectId}
            onMoveToStage={moveToStage}
          />
        ) : (
          <ProjectTable
            projects={sorted}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
            onOpenProject={setDrawerProjectId}
          />
        )}
      </main>

      {anyModalOpen ? (
        <button type="button" className="overlay" aria-label="Close" onClick={closeTopmost} />
      ) : null}

      {drawerProject ? (
        <ProjectDrawer
          project={drawerProject}
          stages={stages}
          currency={settings.currency}
          busy={isPending}
          onClose={() => setDrawerProjectId(null)}
          onEdit={() => setFormState({ mode: "edit", project: drawerProject })}
          onDelete={() => setDeleteTarget(drawerProject)}
          onMoveToStage={(stageId) => moveToStage(drawerProject, stageId)}
          onAddPayment={(payment) => run(() => api.addPayment(drawerProject.id, payment))}
          onDeletePayment={(paymentId) => run(() => api.deletePayment(drawerProject.id, paymentId))}
          onSaveNotes={(notes) => run(() => api.updateProject(drawerProject.id, { notes }))}
        />
      ) : null}

      {formState ? (
        <ProjectFormModal
          mode={formState.mode}
          project={formState.project}
          stages={stages}
          currency={settings.currency}
          onSubmit={submitProject}
          onCancel={() => setFormState(null)}
        />
      ) : null}

      {settingsOpen ? (
        <SettingsModal
          settings={settings}
          stages={stages}
          required={!settings.onboardingComplete}
          onSave={async (nextSettings, nextStages) => {
            setError(null);
            try {
              await api.saveSettings(nextSettings);
              await api.saveStages(nextStages);
              setSettingsOpen(false);
              refresh();
            } catch (saveError) {
              const message = saveError instanceof Error ? saveError.message : "Settings could not be saved.";
              setError(message);
              throw saveError;
            }
          }}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}

      {pendingCompletion ? (
        <ConfirmDialog
          title="Balance still outstanding"
          body={`${pendingCompletion.clientName} has a balance of ${pendingCompletion.balanceFmt}. Mark this project as complete anyway?`}
          confirmLabel="Mark completed"
          onCancel={() => setPendingCompletion(null)}
          onConfirm={async () => {
            await run(pendingCompletion.commit);
            setPendingCompletion(null);
          }}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          title="Delete this project?"
          body={`This permanently removes ${deleteTarget.clientName} and its payment history. This can't be undone.`}
          confirmLabel="Delete"
          destructive
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            const id = deleteTarget.id;
            await run(() => api.deleteProject(id));
            setDeleteTarget(null);
            if (drawerProjectId === id) setDrawerProjectId(null);
          }}
        />
      ) : null}

      <span className="sr-only" aria-live="polite">
        {isPending ? "Saving…" : ""}
      </span>

      <noscript>
        <p style={{ padding: 24 }}>
          {TRACKER_CONFIG.product.name} needs JavaScript enabled to run.
        </p>
      </noscript>
    </div>
  );
}
