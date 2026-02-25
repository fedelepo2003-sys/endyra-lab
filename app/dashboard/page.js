export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [stravaConn, setStravaConn] = useState(null); // { athlete_id, scope, expires_at }
  const [uiMsg, setUiMsg] = useState("");

  async function load() {
    setLoading(true);

    // 1) prendi utente
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      setUiMsg("Not authenticated. Please login again.");
      setLoading(false);
      return;
    }

    const user = userData.user;
    setUserEmail(user.email || "");

    // 2) leggi connessione Strava dal DB (richiede RLS policy)
    const { data, error } = await supabase
      .from("strava_conn")
      .select("athlete_id, scope, expires_at, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();
console.log("STRAVA DATA:", data);
console.log("STRAVA ERROR:", error);
    if (error) {
      // se qui vedi "permission denied" => policies non ok
      setUiMsg(`DB error: ${error.message}`);
      setStravaConn(null);
      setLoading(false);
      return;
    }

    setStravaConn(data ?? null);

    // 3) messaggini da querystring (opzionale)
    const params = new URLSearchParams(window.location.search);
    if (params.get("strava") === "connected") {
      setUiMsg("✅ Strava connected successfully.");
    }
    if (params.get("strava_error")) {
      setUiMsg(`❌ Strava error: ${params.get("strava_error")}`);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const connectStrava = () => {
    window.location.href = "/api/strava/auth";
  };

  const disconnectStrava = async () => {
    setUiMsg("");
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      setUiMsg("Not authenticated. Please login again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("strava_conn")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      setUiMsg(`❌ Disconnect failed: ${error.message}`);
      setLoading(false);
      return;
    }

    setUiMsg("✅ Strava disconnected.");
    setStravaConn(null);
    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isConnected = !!stravaConn?.athlete_id;

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 42, marginBottom: 8 }}>Dashboard</h1>
      {userEmail && <p style={{ opacity: 0.8, marginBottom: 24 }}>Ciao {userEmail}</p>}

      {uiMsg && (
        <div style={{ marginBottom: 16, padding: 12, border: "1px solid #333", borderRadius: 10 }}>
          {uiMsg}
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <div style={{ marginBottom: 18 }}>
            {isConnected ? (
              <div style={{ padding: 16, border: "1px solid #2b2b2b", borderRadius: 12 }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>
                  ✅ <b>Strava Connected</b>
                </div>
                <div style={{ opacity: 0.9 }}>
                  Athlete ID: <b>{stravaConn.athlete_id}</b>
                </div>
                {stravaConn.scope && (
                  <div style={{ opacity: 0.9 }}>
                    Scope: <b>{stravaConn.scope}</b>
                  </div>
                )}
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={disconnectStrava}
                    style={{
                      width: "100%",
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #444",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    Disconnect Strava
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={connectStrava}
                style={{
                  width: "100%",
                  padding: 16,
                  borderRadius: 10,
                  border: "0",
                  background: "#ff5a1f",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Connect Strava
              </button>
            )}
          </div>

          <button
            onClick={logout}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 10,
              border: "1px solid #444",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </>
      )}
    </main>
  );
}