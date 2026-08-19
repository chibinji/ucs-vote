"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandFooter, BrandHeader } from "@/components/BrandChrome";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not sign in.");
      return;
    }
    router.push("/admin");
  }

  return (
    <>
      <BrandHeader subtitle="Election officers" />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <form onSubmit={submit} className="card space-y-4 p-6">
          <h1 className="display text-2xl text-[#2C8992]">Officer sign in</h1>
          <p className="text-sm">Use the admin password to manage the election, or the observer password to watch only.</p>
          <label className="block text-sm font-medium">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field mt-1"
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button disabled={busy} className="btn btn-teal w-full py-3" type="submit">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
      <BrandFooter />
    </>
  );
}
