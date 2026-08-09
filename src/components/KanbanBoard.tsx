"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/Badges";
import type { ProjectDTO, StageDTO } from "@/lib/types";

interface Props {
  stages: StageDTO[];
  projects: ProjectDTO[];
  isSearching: boolean;
  onOpenProject: (id: string) => void;
  onMoveToStage: (project: ProjectDTO, stageId: string) => void;
}

export function KanbanBoard({ stages, projects, isSearching, onOpenProject, onMoveToStage }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  const handleDrop = (stageId: string, event: React.DragEvent) => {
    event.preventDefault();
    setDragOverStageId(null);
    setDraggingId(null);
    const id = event.dataTransfer.getData("text/plain");
    const project = projects.find((p) => p.id === id);
    if (project) onMoveToStage(project, stageId);
  };

  return (
    <div className="board">
      {stages.map((stage) => {
        const items = projects.filter((p) => p.stageId === stage.id);
        return (
          <section
            key={stage.id}
            className={`column ${dragOverStageId === stage.id ? "is-dragover" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (dragOverStageId !== stage.id) setDragOverStageId(stage.id);
            }}
            onDragLeave={(event) => {
              // Moving over a child fires dragleave on the column; ignore those.
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
              if (dragOverStageId === stage.id) setDragOverStageId(null);
            }}
            onDrop={(event) => handleDrop(stage.id, event)}
            aria-label={stage.name}
          >
            <div className="column-head">
              <span className="column-name">{stage.name}</span>
              <span className="column-count">{items.length}</span>
            </div>

            <div className="column-body">
              {items.length === 0 ? (
                <div className="column-empty">{isSearching ? "No matches" : "No projects yet"}</div>
              ) : null}

              {items.map((project) => (
                // A div rather than a button: dragging a <button> is unreliable
                // outside Chromium, so the card carries its own button semantics.
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  className={`project-card ${draggingId === project.id ? "is-dragging" : ""}`}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", project.id);
                    event.dataTransfer.effectAllowed = "move";
                    setDraggingId(project.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverStageId(null);
                  }}
                  onClick={() => onOpenProject(project.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenProject(project.id);
                    }
                  }}
                >
                  <div className="card-client">{project.clientName}</div>
                  <div className="card-title">{project.projectTitle}</div>

                  <div className="card-tags">
                    <span className="tag">{project.serviceType}</span>
                    <StatusBadge status={project.status} withDot />
                  </div>

                  <div className="card-foot">
                    <div className="foot-col">
                      <span className="foot-label">Balance</span>
                      <span className="foot-value">{project.balanceFmt}</span>
                    </div>
                    <div className="foot-col foot-col--right">
                      <span className="foot-label">Next deadline</span>
                      <span className="foot-value foot-value--plain">{project.nextDeadlineFmt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
