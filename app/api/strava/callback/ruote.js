import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const scope = url.searchParams.get("scope");
  const state = url.searchParams.get("state"); // idealmente userId
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?strava_error=${error}`, url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`/dashboard?strava_error=missing_code`, url.origin));
  }

  // Exchange code -> tokens
  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text();
    return NextResponse.redirect(
      new URL(`/dashboard?strava_error=token_exchange&detail=${encodeURIComponent(detail)}`, url.origin)
    );
  }

  const data = await tokenRes.json();
  // data: access_token, refresh_token, expires_at, athlete...

  // ✅ Qui, per ora, salviamo almeno per athlete_id (anche se state è vuoto)
  // Meglio: legarlo al tuo user_id via state (Fix 2 sotto).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  await supabase.from("strava_connections").upsert(
    {
      user_id: state || null,
      strava_athlete_id: data.athlete?.id ?? null,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      scope: scope ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "strava_athlete_id" }
  );

  return NextResponse.redirect(new URL(`/dashboard?strava_connected=1`, url.origin));
}