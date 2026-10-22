"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const HOSTELS = ["H1","H2","H3","H4","H5","H6","H7","H8","H9","H10","H11","H12","H13","H14","H15","H16","Tansa","Qip"];
const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function NewCyclePage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", price_per_hour: "", hostel: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await api.cycles.create({ ...form, price_per_hour: Number(form.price_per_hour) });
      router.push("/dashboard");
    } catch (err: any) { setError(err.message ?? "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 font-bold text-lg">🚲 PedalPeer</Link>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600 text-sm">List a Cycle</span>
      </nav>
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-xl font-bold mb-6">List your cycle</h1>
          {error && <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
              <input type="text" required minLength={3} value={form.title} onChange={set("title")}
                placeholder="e.g. Firefox MTB, Hero Sprint" className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={set("description")}
                placeholder="Condition, gear count, any notes…" className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per hour (₹) <span className="text-red-500">*</span></label>
              <input type="number" required min={0} value={form.price_per_hour} onChange={set("price_per_hour")}
                placeholder="0 for free" className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hostel</label>
              <select value={form.hostel} onChange={set("hostel")} className={cls}>
                <option value="">Select hostel</option>
                {HOSTELS.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition">
              {loading ? "Listing…" : "List Cycle"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
