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
  const [computerNumber, setComputerNumber] = useState("");
  const [csEmail, setCsEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"login" | "otp">("login");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitLogin(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/vote/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          computerNumber,
          csEmail,
          fingerprint: await fingerprint(),
          deviceLabel: deviceLabel(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sign in.");
      if (data.alreadyVoted) {
        window.location.replace("/vote/receipt");
        return;
      }
      setPreview(Boolean(data.preview));
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/vote/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          computerNumber,
          csEmail,
          code,
          fingerprint: await fingerprint(),
          deviceLabel: deviceLabel(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not verify code.");
      if (data.hasVoted) {
        window.location.replace("/vote/receipt");
        return;
      }
      window.location.replace("/vote");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={step === "login" ? submitLogin : submitOtp}
      className="card mx-auto w-full max-w-md space-y-4 p-6"
    >
      {step === "login" ? (
        <>
          <label className="block text-sm font-medium">
            Computer number
            <input
              required
              autoComplete="username"
              value={computerNumber}
              onChange={(e) => setComputerNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#454B4C]/20 px-4 py-3 text-base outline-none focus:border-[#2C8992]"
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
              className="mt-1 w-full rounded-xl border border-[#454B4C]/20 px-4 py-3 text-base outline-none focus:border-[#2C8992]"
            />
          </label>
        </>
      ) : (
        <>
          <p className="text-sm">
            Enter the 6-digit code sent to <strong>{csEmail}</strong>.
            {preview ? " In development the code is printed in the server terminal." : null}
          </p>
          <label className="block text-sm font-medium">
            One-time code
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#454B4C]/20 px-4 py-3 font-[family-name:var(--font-code)] text-2xl tracking-[0.4em] outline-none focus:border-[#2C8992]"
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
        {busy ? "Please wait…" : step === "login" ? "Send code" : "Verify and continue"}
      </button>
    </form>
  );
}
