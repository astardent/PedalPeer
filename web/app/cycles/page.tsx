"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const HOSTELS = ["H1","H2","H3","H4","H5","H6","H7","H8","H9","H10","H11","H12","H13","H14","H15","H16","Tansa","Qip"];

export default function CyclesPage() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [hostel, setHostel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.cycles.list(hostel || undefined).then(setCycles).finally(() => setLoading(false));
  }, [hostel]);

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 font-bold text-lg">🚲 PedalPeer</Link>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600 text-sm">Browse Cycles</span>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setHostel("")}
            className={`px-3 py-1 rounded-full text-sm border transition ${!hostel ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 hover:border-blue-400"}`}>
            All
          </button>
          {HOSTELS.map(h => (
            <button key={h} onClick={() => setHostel(h)}
              className={`px-3 py-1 rounded-full text-sm border transition ${hostel === h ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 hover:border-blue-400"}`}>
              {h}
            </button>
          ))}
        </div>
        {loading
          ? <p className="text-gray-400 text-sm">Loading…</p>
          : cycles.length === 0
            ? <p className="text-gray-400 text-sm">No cycles available{hostel ? ` in ${hostel}` : ""}.</p>
            : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cycles.map(c => (
                  <Link key={c.id} href={`/cycles/${c.id}`}
                    className="bg-white rounded-xl border p-4 hover:shadow-md transition block">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{c.title}</p>
                        <p className="text-sm text-gray-500">{c.hostel ?? "—"}</p>
                        {c.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.description}</p>}
                      </div>
                      <span className="text-blue-600 font-semibold text-sm whitespace-nowrap">₹{c.price_per_hour}/hr</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">by {c.owner_name}</p>
                  </Link>
                ))}
              </div>
        }
      </div>
    </main>
  );
}
