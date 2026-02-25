"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");

  async function signUp() {
    setMsg("...");
    const { error } = await supabase.auth.signUp({ email, password: pw });
    setMsg(error ? error.message : "Registrato! Ora fai login.");
  }

  async function signIn() {
    setMsg("...");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pw,
    });
    if (error) return setMsg(error.message);
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-3xl font-semibold">EndyraLab</h1>
        <p className="text-sm opacity-80">Login / Signup</p>

        <input
          className="w-full p-3 rounded bg-neutral-900 border border-neutral-800"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-3 rounded bg-neutral-900 border border-neutral-800"
          placeholder="Password"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />

        <div className="flex gap-2">
          <button
            className="flex-1 p-3 rounded bg-white text-black"
            onClick={signIn}
          >
            Login
          </button>

          <button
            className="flex-1 p-3 rounded border border-neutral-700"
            onClick={signUp}
          >
            Signup
          </button>
        </div>

        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </main>
  );
}