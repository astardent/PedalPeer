const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

async function req(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  signup: (data: object) =>
    req("/signup", { method: "POST", body: JSON.stringify(data) }),

  login: (data: object) =>
    req("/login", { method: "POST", body: JSON.stringify(data) }),

  me: () => req("/me"),

  cycles: {
    list: (hostel?: string) =>
      req(`/cycles${hostel ? `?hostel=${hostel}` : ""}`),
    create: (data: object) =>
      req("/cycles", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) =>
      req(`/cycles/${id}`, { method: "DELETE" }),
  },

  bookings: {
    request: (data: object) =>
      req("/bookings", { method: "POST", body: JSON.stringify(data) }),
    mine: () => req("/bookings/mine"),
    incoming: () => req("/bookings/incoming"),
    accept: (id: number) =>
      req(`/bookings/${id}/accept`, { method: "POST" }),
    start: (id: number, code: string) =>
      req(`/bookings/${id}/start`, { method: "POST", body: JSON.stringify({ code }) }),
    complete: (id: number, code: string) =>
      req(`/bookings/${id}/complete`, { method: "POST", body: JSON.stringify({ code }) }),
    cancel: (id: number) =>
      req(`/bookings/${id}/cancel`, { method: "POST" }),
  },
};