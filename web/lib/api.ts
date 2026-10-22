const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function token() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

async function req(path: string, options: RequestInit = {}) {
  const t = token();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

async function upload(path: string, file: File, notes?: string) {
  const t = token();
  const fd = new FormData();
  fd.append("file", file);
  if (notes) fd.append("notes", notes);
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: t ? { Authorization: `Bearer ${t}` } : {},
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  signup: (d: object) => req("/signup", { method: "POST", body: JSON.stringify(d) }),
  login:  (d: object) => req("/login",  { method: "POST", body: JSON.stringify(d) }),
  me: () => req("/me"),

  cycles: {
    list:   (hostel?: string) => req(`/cycles${hostel ? `?hostel=${hostel}` : ""}`),
    mine:   () => req("/cycles/mine"),
    get:    (id: number) => req(`/cycles/${id}`),
    create: (d: object) => req("/cycles", { method: "POST", body: JSON.stringify(d) }),
    toggle: (id: number) => req(`/cycles/${id}/toggle`, { method: "PATCH" }),
    delete: (id: number) => req(`/cycles/${id}`, { method: "DELETE" }),
  },

  bookings: {
    request:  (d: object) => req("/bookings", { method: "POST", body: JSON.stringify(d) }),
    mine:     () => req("/bookings/mine"),
    incoming: () => req("/bookings/incoming"),
    active:   () => req("/bookings/active-on-my-cycles"),
    get:      (id: number) => req(`/bookings/${id}`),
    accept:   (id: number) => req(`/bookings/${id}/accept`, { method: "POST" }),
    start:    (id: number, code: string) =>
      req(`/bookings/${id}/start`,    { method: "POST", body: JSON.stringify({ code }) }),
    complete: (id: number, code: string) =>
      req(`/bookings/${id}/complete`, { method: "POST", body: JSON.stringify({ code }) }),
    cancel:   (id: number) => req(`/bookings/${id}/cancel`, { method: "POST" }),
    photos:   (id: number) => req(`/bookings/${id}/photos`),
    uploadPhoto: (id: number, stage: "pre" | "post", file: File, notes?: string) =>
      upload(`/bookings/${id}/photos/${stage}`, file, notes),
  },
};