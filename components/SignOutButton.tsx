"use client";

export function SignOutButton() {
  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }
  return (
    <button className="btn btn-ghost text-xs" type="button" onClick={signOut}>
      Sign out
    </button>
  );
}
