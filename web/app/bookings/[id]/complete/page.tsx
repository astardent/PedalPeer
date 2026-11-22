"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

function durationText(start: string, end: string) {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`;
}

export default function CompleteBooking() {
  const { id } = useParams();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg(""); setLoading(true);
    try {
      const data = await api.bookings.complete(Number(id), code);
      setResult(data);
      setDone(true);
    } catch (err: any) { setMsg("  " + (err.message ?? "Wrong OTP")); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
        <h1 className="text-xl font-bold mt-4 mb-2">Complete Ride</h1>
        <p className="text-sm text-gray-500 mb-6">The renter will show you a 6-digit end OTP. Enter it to close the booking.</p>
        {done ? (
          <div className="space-y-3">
            <p className="text-sm text-green-700">Booking completed!</p>
            {result?.total_fare != null && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-700">₹{Number(result.total_fare).toFixed(2)}</p>
                <p className="text-xs text-green-700 mt-1">
                  {durationText(result.actual_start, result.actual_end)} at ₹{result.price_per_hour}/hr
                </p>
              </div>
            )}
            <Link href={`/bookings/${id}/photos`}
              className="block text-center bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">
              Add post-ride photos (optional)
            </Link>
            <Link href={`/bookings/${id}/review`}
              className="block text-center border border-amber-400 text-amber-700 rounded-lg py-2 text-sm hover:bg-amber-50">
              Rate the renter
            </Link>
            <Link href="/dashboard" className="block text-center text-sm text-gray-500 hover:text-blue-600">
              Skip, back to dashboard
            </Link>
          </div>
        ) : (
        <form onSubmit={submit} className="space-y-4">
          <input
            type="text" inputMode="numeric" maxLength={6} value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full border border-gray-300 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {msg && <p className="text-sm">{msg}</p>}
          <button type="submit" disabled={loading || code.length !== 6}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition">
            {loading ? "Verifying…" : "Mark Complete"}
          </button>
        </form>
        )}
      </div>
    </main>
  );
}
