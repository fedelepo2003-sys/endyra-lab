import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const scope = url.searchParams.get("scope");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?strava_error=${encodeURIComponent(error)}`, url.origin));
  }
  if (!code) {
    return NextResponse.redirect(new URL(`/dashboard?strava_error=missing_code`, url.origin));
  }

  const client_id = process.env.STRAVA_CLIENT_ID;
  const client_secret = process.env.STRAVA_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return NextResponse.redirect(new URL(`/dashboard?strava_error=missing_env`, url.origin));
  }

  // Exchange code -> tokens
  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id,
      client_secret,
      code,
      grant_type: "authorization_code",
    }),
  });

  const tokenJson = await tokenRes.json();

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL(`/dashboard?strava_error=token_exchange_failed&details=${encodeURIComponent(JSON.stringify(tokenJson))}`, url.origin)
    );
  }

  // tokenJson contains: access_token, refresh_token, expires_at, athlete{ id, ... }
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.redirect(new URL(`/dashboard?strava_error=missing_supabase_env`, url.origin));
  }

  const supabase = createClient(supabaseUrl, serviceRole);

  const athleteId = tokenJson?.athlete?.id;
  if (!athleteId) {
    return NextResponse.redirect(new URL(`/dashboard?strava_error=missing_athlete_id`, url.origin));
  }

  // TODO: collegare al tuo user_id Supabase (per ora salviamo per athlete_id)
  const { error: dbErr } = await supabase
    .from("strava_connections")
    .upsert(
      {
        athlete_id: athleteId,
        access_token: tokenJson.access_token,
        refresh_token: tokenJson.refresh_token,
        expires_at: tokenJson.expires_at,
        scope: scope || null,
        raw: tokenJson,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "athlete_id" }
    );

  if (dbErr) {
    return NextResponse.redirect(
      new URL(`/dashboard?strava_error=db_upsert_failed&details=${encodeURIComponent(dbErr.message)}`, url.origin)
    );
  }

  return NextResponse.redirect(new URL(`/dashboard?strava=connected&athlete_id=${athleteId}`, url.origin));
}
