"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await api.signup(form);
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Signup failed");
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl text-gray-900 font-bold mb-1">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">PedalPeer · IITB</p>
        {error && <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Username", key: "username", type: "text",     placeholder: "e.g. debasish",        min: 3 },
            { label: "Email",    key: "email",    type: "email",    placeholder: "rollno@iitb.ac.in" },
            { label: "Password", key: "password", type: "password", placeholder: "min 6 characters",     min: 6 },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input type={f.type} required minLength={f.min} placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition">
            {loading ? "Creating…" : "Sign up"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </main>
  );
}