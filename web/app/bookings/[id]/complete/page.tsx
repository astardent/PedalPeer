"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function CompleteBooking() {
  const { id } = useParams();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg(""); setLoading(true);
    try {
      await api.bookings.complete(Number(id), code);
      setMsg("✅ Booking completed!");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) { setMsg("❌ " + (err.message ?? "Wrong OTP")); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
        <h1 className="text-xl font-bold mt-4 mb-2">Complete Ride</h1>
        <p className="text-sm text-gray-500 mb-6">The renter will show you a 6-digit end OTP. Enter it to close the booking.</p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="text" inputMode="numeric" maxLength={6} value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full border border-gray-300 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {msg && <p className="text-sm">{msg}</p>}
          <button type="submit" disabled={loading || code.length !== 6}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition">
            {loading ? "Verifying…" : "Mark Complete"}
          </button>
        </form>
      </div>
    </main>
  );
}
