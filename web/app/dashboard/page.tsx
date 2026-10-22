"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const STATUS_STYLE: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-700",
  accepted:  "bg-blue-100 text-blue-700",
  active:    "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-400",
};

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [cycles, setCycles]     = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [active, setActive]     = useState<any[]>([]);
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    Promise.all([
      api.cycles.list(),
      api.bookings.mine(),
      api.bookings.incoming(),
      api.bookings.active(),
    ]).then(([c, b, i, a]) => {
      setCycles(c); setBookings(b); setIncoming(i); setActive(a);
    }).finally(() => setReady(true));
  }, [user, authLoading]);

  if (!ready) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-bold text-blue-600 text-lg">🚲 PedalPeer</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{user?.username}</span>
          <Link href="/cycles/new"
            className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700">
            + List cycle
          </Link>
          <Link href="/my-cycles"
            className="text-sm text-gray-600 hover:text-blue-600 border px-3 py-1.5 rounded-lg">
            My cycles
          </Link>
          <button onClick={() => { logout(); router.push("/"); }}
            className="text-sm text-gray-400 hover:text-red-500">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* Incoming requests */}
        {incoming.length > 0 && (
          <section>
            <h2 className="font-semibold text-lg mb-3 text-orange-600">⏳ Booking requests on your cycles</h2>
            <div className="space-y-3">
              {incoming.map((b: any) => (
                <div key={b.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{b.cycle_title}</p>
                    <p className="text-sm text-gray-500">
                      {b.renter_name} · {new Date(b.start_time).toLocaleDateString()} – {new Date(b.end_time).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/bookings/${b.id}/accept`}
                    className="bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-700">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active rides on my cycles — owner can complete */}
        {active.length > 0 && (
          <section>
            <h2 className="font-semibold text-lg mb-3 text-green-700">🟢 Active rides on your cycles</h2>
            <div className="space-y-3">
              {active.map((b: any) => (
                <div key={b.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{b.cycle_title}</p>
                    <p className="text-sm text-gray-500">Rented by {b.renter_name}</p>
                  </div>
                  <Link href={`/bookings/${b.id}/complete`}
                    className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700">
                    Complete
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* My bookings */}
        <section>
          <h2 className="font-semibold text-lg mb-3">My Rentals</h2>
          {bookings.length === 0
            ? <p className="text-gray-400 text-sm">No bookings yet. <Link href="/cycles" className="text-blue-500 underline">Browse cycles →</Link></p>
            : <div className="space-y-3">
                {bookings.map((b: any) => (
                  <div key={b.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{b.cycle_title}</p>
                      <p className="text-sm text-gray-500">
                        {b.hostel} · {new Date(b.start_time).toLocaleDateString()}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${STATUS_STYLE[b.status]}`}>
                        {b.status}
                      </span>
                    </div>
                    {(b.status === "accepted" || b.status === "active") && (
                      <Link href={`/bookings/${b.id}`}
                        className="text-sm text-blue-600 border border-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                        Manage
                      </Link>
                    )}
                  </div>
                ))}
              </div>
          }
        </section>

        {/* Browse cycles */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Available Cycles</h2>
            <Link href="/cycles" className="text-sm text-blue-600 hover:underline">See all →</Link>
          </div>
          {cycles.length === 0
            ? <p className="text-gray-400 text-sm">No cycles listed yet.</p>
            : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cycles.slice(0, 4).map((c: any) => (
                  <Link key={c.id} href={`/cycles/${c.id}`}
                    className="bg-white rounded-xl border p-4 hover:shadow-md transition block">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{c.title}</p>
                        <p className="text-sm text-gray-500">{c.hostel ?? "—"}</p>
                      </div>
                      <span className="text-blue-600 font-semibold text-sm">₹{c.price_per_hour}/hr</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">by {c.owner_name}</p>
                  </Link>
                ))}
              </div>
          }
        </section>
      </div>
    </main>
  );
}
