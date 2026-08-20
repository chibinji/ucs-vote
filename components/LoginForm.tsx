"use client";

import { useState } from "react";

async function fingerprint() {
  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency,
    navigator.platform,
  ].join("|");
  const data = new TextEncoder().encode(raw);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function deviceLabel() {
  return `${navigator.platform} · ${navigator.userAgent.slice(0, 48)} · ${screen.width}x${screen.height}`;
}

export function LoginForm() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [computerNumber, setComputerNumber] = useState("");
  const [csEmail, setCsEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function finish(data: { alreadyVoted?: boolean; hasVoted?: boolean }) {
    if (data.alreadyVoted || data.hasVoted) {
      window.location.replace("/vote/receipt");
      return;
    }
    window.location.replace("/vote");
  }

  async function submitRegister(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/vote/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          computerNumber,
          csEmail,
          password,
          fingerprint: await fingerprint(),
          deviceLabel: deviceLabel(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create account.");
      await finish(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setBusy(false);
    }
  }

  async function submitLogin(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/vote/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csEmail,
          password,
          fingerprint: await fingerprint(),
          deviceLabel: deviceLabel(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sign in.");
      await finish(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mx-auto w-full max-w-md space-y-4 p-6">
      <div className="flex gap-2 rounded-full bg-[#F4F2EF] p-1">
        <button
          type="button"
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${
            mode === "register" ? "bg-[#2C8992] text-white" : "text-[#454B4C]"
          }`}
          onClick={() => {
            setMode("register");
            setError("");
          }}
        >
          Create password
        </button>
        <button
          type="button"
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${
            mode === "login" ? "bg-[#2C8992] text-white" : "text-[#454B4C]"
          }`}
          onClick={() => {
            setMode("login");
            setError("");
          }}
        >
          Sign in
        </button>
      </div>

      <form
        onSubmit={mode === "register" ? submitRegister : submitLogin}
        className="space-y-4"
      >
        {mode === "register" ? (
          <>
            <p className="text-sm">
              First time? Enter your computer number and CS email, then create a password.
            </p>
            <label className="block text-sm font-medium">
              Computer number
              <input
                required
                autoComplete="username"
                value={computerNumber}
                onChange={(e) => setComputerNumber(e.target.value)}
                className="field mt-1"
              />
            </label>
            <label className="block text-sm font-medium">
              CS email
              <input
                required
                type="email"
                autoComplete="email"
                value={csEmail}
                onChange={(e) => setCsEmail(e.target.value)}
                className="field mt-1"
              />
            </label>
            <label className="block text-sm font-medium">
              Create password
              <input
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field mt-1"
              />
            </label>
            <label className="block text-sm font-medium">
              Confirm password
              <input
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="field mt-1"
              />
            </label>
          </>
        ) : (
          <>
            <p className="text-sm">Already created a password? Sign in with your CS email.</p>
            <label className="block text-sm font-medium">
              CS email
              <input
                required
                type="email"
                autoComplete="email"
                value={csEmail}
                onChange={(e) => setCsEmail(e.target.value)}
                className="field mt-1"
              />
            </label>
            <label className="block text-sm font-medium">
              Password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field mt-1"
              />
            </label>
          </>
        )}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          disabled={busy}
          className="btn-primary w-full rounded-full px-5 py-3 disabled:opacity-60"
          type="submit"
        >
          {busy
            ? "Please wait…"
            : mode === "register"
              ? "Create password and continue"
              : "Sign in"}
        </button>
      </form>
    </div>
  );
}
