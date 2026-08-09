/** Thin fetch wrapper so every mutation surfaces the server's message on failure. */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* non-JSON error body — keep the status message */
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface ProjectPayload {
  clientName: string;
  clientContact: string;
  projectTitle: string;
  serviceType: string;
  stageId: string;
  totalFee: number;
  startDate: string;
  nextDeadline: string;
  defenceDate: string;
  notes: string;
}

export interface SettingsPayload {
  companyName: string;
  logoSrc: string;
  currencyCode: string;
  currencySymbol: string;
  minorUnitsPerMajor: number;
  fractionDigits: number;
}

export const api = {
  createProject: (payload: ProjectPayload) =>
    request<{ id: string }>("/api/projects", { method: "POST", body: JSON.stringify(payload) }),

  updateProject: (id: string, payload: Partial<ProjectPayload>) =>
    request<{ ok: true }>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  deleteProject: (id: string) => request<{ ok: true }>(`/api/projects/${id}`, { method: "DELETE" }),

  addPayment: (projectId: string, payload: { amount: number; date: string; method: string; note: string }) =>
    request<{ ok: true }>(`/api/projects/${projectId}/payments`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deletePayment: (projectId: string, paymentId: string) =>
    request<{ ok: true }>(`/api/projects/${projectId}/payments/${paymentId}`, { method: "DELETE" }),

  saveStages: (stages: { id?: string; name: string }[]) =>
    request<{ stages: unknown }>("/api/stages", { method: "PUT", body: JSON.stringify({ stages }) }),

  saveSettings: (payload: SettingsPayload) =>
    request<{ settings: unknown }>("/api/settings", { method: "PUT", body: JSON.stringify(payload) }),
};
