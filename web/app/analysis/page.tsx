"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Row = { label: string; detail: string; value: number };
type Section = { key: string; title: string; unit: string; rows: Row[]; chart: string | null };

export default function AnalysisPage() {
  const [sections, setSections] = useState<Section[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.analysis().then(d => setSections(d.sections)).catch((err: any) => setError(err.message ?? "Failed to load"));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 font-bold text-lg">PedalPeer</Link>
        <span className="text-gray-400">|</span>
        <span className="text-gray-700 text-sm">Analysis</span>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">Top 10 for each measure, from all bookings and ratings so far.</p>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}
        {!sections && !error && <p className="text-sm text-gray-500">Loading…</p>}

        {sections && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sections.map(s => (
              <section key={s.key} className="bg-white rounded-2xl border p-5 space-y-4 min-w-0">
                <h2 className="font-semibold text-gray-900">{s.title}</h2>
                {s.rows.length === 0 ? (
                  <p className="text-sm text-gray-500">No data yet.</p>
                ) : (
                  <>
                    {s.chart && (
                      <img src={`data:image/png;base64,${s.chart}`} alt={`${s.title} chart`} className="w-full h-auto" />
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 border-b">
                            <th className="py-1.5 pr-2 font-medium">#</th>
                            <th className="py-1.5 pr-2 font-medium">Name</th>
                            <th className="py-1.5 pr-2 font-medium">Details</th>
                            <th className="py-1.5 font-medium text-right">{s.unit}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.rows.map((r, i) => (
                            <tr key={i} className="border-b last:border-0 text-gray-800">
                              <td className="py-1.5 pr-2 text-gray-500 tabular-nums">{i + 1}</td>
                              <td className="py-1.5 pr-2">{r.label}</td>
                              <td className="py-1.5 pr-2 text-gray-500">{r.detail}</td>
                              <td className="py-1.5 text-right tabular-nums">{r.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500">
          Acceptance rate counts a request as accepted once the owner issued a start OTP. Requests still waiting are not counted.
        </p>
      </div>
    </main>
  );
}
