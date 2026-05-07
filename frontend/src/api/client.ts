export const API_URL = import.meta.env.VITE_BACKEND_URL || "https://keep-calm-student.onrender.com";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export const api = {
  health: () => request<{ app_name: string }>("/api/health"),
  createUser: () =>
    request<{ user_id: string; display_name: string }>("/api/users", {
      method: "POST",
      body: JSON.stringify({ display_name: "Гость" }),
    }),
  sendMessage: (userId: string, message: string) =>
    request<any>("/api/chat/message", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, channel: "web", message }),
    }),
  saveState: (payload: any) => request<any>("/api/state", { method: "POST", body: JSON.stringify(payload) }),
  getState: (userId: string) => request<any>(`/api/state/${userId}`),
  startRitual: (userId: string, ritualType: string) =>
    request<any>("/api/rituals/start", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, ritual_type: ritualType }),
    }),
  completeRitual: (userId: string, ritualId: string) =>
    request<any>("/api/rituals/complete", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, ritual_id: ritualId }),
    }),
  anxietyEater: (userId: string, anxietyText: string) =>
    request<any>("/api/rituals/anxiety-eater", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, anxiety_text: anxietyText }),
    }),
  taskBurner: (userId: string, scaryTask: string) =>
    request<any>("/api/rituals/task-burner", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, scary_task: scaryTask }),
    }),
  startFocus: (userId: string) =>
    request<any>("/api/focus/start", { method: "POST", body: JSON.stringify({ user_id: userId }) }),
  completeFocus: (userId: string, focusRoundId: string, userResult: string) =>
    request<any>("/api/focus/complete", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, focus_round_id: focusRoundId, user_result: userResult }),
    }),
  getProgress: (userId: string) => request<any>(`/api/progress/${userId}`),
  reset: (userId: string) => request<any>(`/api/users/${userId}/reset`, { method: "POST" }),
};
