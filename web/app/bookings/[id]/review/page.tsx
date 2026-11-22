"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ReviewBooking() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.bookings.get(Number(id)).then(setBooking).catch(() => router.push("/dashboard"));
  }, [id]);

  if (!booking || !user) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;

  const isRenter = booking.renter_id === user.id;
  const subject = isRenter ? `the cycle "${booking.cycle_title}"` : `renter ${booking.renter_name}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stars) { setMsg("Pick 1 to 5 stars"); return; }
    setMsg(""); setLoading(true);
    try {
      await api.bookings.review(Number(id), stars, comment.trim() || undefined);
      setDone(true);
    } catch (err: any) { setMsg(err.message ?? "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
        <h1 className="text-xl font-bold mt-4 mb-1">Rate {subject}</h1>

        {booking.status !== "completed" ? (
          <p className="text-sm text-gray-500 mt-4">You can rate after the ride ends.</p>
        ) : done || booking.reviewed_by_me ? (
          <p className="text-sm text-green-700 mt-4">Thanks, your rating is saved.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setStars(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  className={`text-4xl transition ${n <= stars ? "text-amber-500" : "text-gray-400 hover:text-amber-400"}`}>
                  ★
                </button>
              ))}
            </div>
            <textarea rows={3} maxLength={500} value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Comment (optional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {msg && <p className="text-sm text-red-600">{msg}</p>}
            <button type="submit" disabled={loading || !stars}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition">
              {loading ? "Saving…" : "Submit rating"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
