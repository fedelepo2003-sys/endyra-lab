"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login");
      else setUser(data.user);
    });
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function connectStrava() {
    window.location.href = "/api/strava/auth";
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-sm opacity-80">Ciao {user?.email}</p>

        <button
          className="w-full p-4 rounded bg-orange-500 text-black font-semibold"
          onClick={connectStrava}
        >
          Connect Strava
        </button>

        <button className="w-full p-3 rounded border border-neutral-700" onClick={logout}>
          Logout
        </button>
      </div>
    </main>
  );
  }
