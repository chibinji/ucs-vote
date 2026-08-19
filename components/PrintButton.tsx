"use client";

import { useEffect } from "react";

export function PrintButton() {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <button className="btn btn-primary no-print" type="button" onClick={() => window.print()}>
      Save as PDF
    </button>
  );
}
