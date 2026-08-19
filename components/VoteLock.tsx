"use client";

import { useEffect } from "react";

const VOTED_KEY = "ucs-voted";

export function markVoteComplete() {
  sessionStorage.setItem(VOTED_KEY, "1");
}

function clearLocalVoteFlags() {
  sessionStorage.removeItem(VOTED_KEY);
  document.cookie = "vote_done=; path=/; max-age=0";
}

async function serverSaysVoted(): Promise<boolean | null> {
  try {
    const res = await fetch("/api/vote/status", { cache: "no-store" });
    const data = await res.json();
    if (!data.signedIn) return null;
    return Boolean(data.hasVoted);
  } catch {
    return null;
  }
}

export function VoteLock({ mode }: { mode: "ballot" | "receipt" }) {
  useEffect(() => {
    if (mode === "receipt") {
      markVoteComplete();
      window.history.replaceState(null, "", "/vote/receipt");
      return;
    }

    const leaveBallot = async () => {
      const voted = await serverSaysVoted();
      if (voted === true) {
        window.location.replace("/vote/receipt");
      } else if (voted === false) {
        clearLocalVoteFlags();
      }
    };

    void leaveBallot();
    window.addEventListener("pageshow", () => {
      void leaveBallot();
    });
    window.addEventListener("popstate", () => {
      void leaveBallot();
    });
  }, [mode]);

  return null;
}
