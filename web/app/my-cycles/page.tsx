"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export default function MyCycles() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cycles, setCycles] = useState<any[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    api.cycles.mine().then(setCycles).finally(() => setReady(true));
  }, [user, authLoading]);

  async function toggle(id: number) {
    const updated = await api.cycles.toggle(id);
    setCycles(cs => cs.map(c => c.id === id ? { ...c, is_available: updated.is_available } : c));
  }

  async function remove(id: number) {
    if (!confirm("Delete this cycle?")) return;
    await api.cycles.delete(id);
    setCycles(cs => cs.filter(c => c.id !== id));
  }

  if (!ready) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 font-bold text-lg">🚲 PedalPeer</Link>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600 text-sm">My Cycles</span>
        <div className="ml-auto">
          <Link href="/cycles/new" className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700">
            + List new
          </Link>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {cycles.length === 0
          ? <div className="text-center py-16">
              <p className="text-4xl mb-3">🚲</p>
              <p className="text-gray-500 mb-4">You haven't listed any cycles yet.</p>
              <Link href="/cycles/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                List your first cycle
              </Link>
            </div>
          : <div className="space-y-4">
              {cycles.map(c => (
                <div key={c.id} className="bg-white rounded-xl border p-5 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{c.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                        {c.is_available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{c.hostel ?? "No hostel"} · ₹{c.price_per_hour}/hr</p>
                    {c.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.description}</p>}
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button onClick={() => toggle(c.id)}
                      className="text-xs border px-2 py-1 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600">
                      {c.is_available ? "Mark unavailable" : "Mark available"}
                    </button>
                    <button onClick={() => remove(c.id)}
                      className="text-xs border border-red-200 px-2 py-1 rounded-lg text-red-500 hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </main>
  );
}
