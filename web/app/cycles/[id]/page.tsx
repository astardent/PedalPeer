"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function CycleDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [cycle, setCycle] = useState<any>(null);
  const [form, setForm] = useState({ start_time: "", end_time: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.cycles.get(Number(id)).then(setCycle).catch(() => router.push("/cycles"));
  }, [id]);

  async function book(e: React.FormEvent) {
    e.preventDefault(); setMsg(""); setLoading(true);
    try {
      await api.bookings.request({ cycle_id: Number(id), ...form });
      setMsg("✅ Booking requested! Owner will accept soon.");
    } catch (err: any) { setMsg("❌ " + (err.message ?? "Failed")); }
    finally { setLoading(false); }
  }

  if (!cycle) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;

  const isOwner = user?.id === cycle.owner_id;

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 font-bold text-lg">🚲 PedalPeer</Link>
        <span className="text-gray-300">|</span>
        <Link href="/cycles" className="text-gray-500 text-sm hover:text-blue-600">Browse</Link>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{cycle.title}</h1>
              <p className="text-gray-500 mt-1">{cycle.hostel ?? "No hostel set"} · by {cycle.owner_name}</p>
            </div>
            <span className="text-2xl font-bold text-blue-600">
              ₹{cycle.price_per_hour}<span className="text-sm font-normal text-gray-400">/hr</span>
            </span>
          </div>
          {cycle.description && <p className="mt-4 text-gray-600 text-sm leading-relaxed">{cycle.description}</p>}
          <div className="mt-4">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${cycle.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
              {cycle.is_available ? "Available" : "Not available"}
            </span>
          </div>
        </div>

        {isOwner
          ? <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
              This is your cycle.{" "}
              <Link href="/my-cycles" className="underline">Manage your cycles →</Link>
            </div>
          : cycle.is_available
            ? <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="font-semibold mb-4">Request a booking</h2>
                <form onSubmit={book} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                      <input type="datetime-local" required value={form.start_time}
                        onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className={cls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                      <input type="datetime-local" required value={form.end_time}
                        onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className={cls} />
                    </div>
                  </div>
                  {msg && <p className="text-sm">{msg}</p>}
                  <button type="submit" disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition">
                    {loading ? "Requesting…" : "Request Booking"}
                  </button>
                </form>
              </div>
            : <div className="bg-gray-50 border rounded-xl p-4 text-sm text-gray-500">
                This cycle is currently unavailable.
              </div>
        }
      </div>
    </main>
  );
}
