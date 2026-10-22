import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="text-center text-white">
        <p className="text-6xl mb-4">🚲</p>
        <h1 className="text-4xl font-bold mb-3">PedalPeer</h1>
        <p className="text-blue-100 mb-8 text-lg">Peer-to-peer cycle rentals at IIT Bombay</p>
        <div className="flex gap-4 justify-center">
          <Link href="/login"
            className="bg-white text-blue-700 font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-50 transition">
            Log in
          </Link>
          <Link href="/signup"
            className="border-2 border-white text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-white/10 transition">
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}