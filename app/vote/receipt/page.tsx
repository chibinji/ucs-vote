"use client";

import { useEffect, useState } from "react";
import { BrandFooter, BrandHeader } from "@/components/BrandChrome";
import { VoteLock } from "@/components/VoteLock";

export default function ReceiptPage() {
  const [receipt, setReceipt] = useState("");

  useEffect(() => {
    setReceipt(sessionStorage.getItem("ucs-receipt") || "");
  }, []);

  return (
    <>
      <VoteLock mode="receipt" />
      <BrandHeader subtitle="Vote recorded" />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 text-center">
        <div className="card card-geo p-8">
          <h1 className="display text-3xl text-[#2C8992]">Thank you</h1>
          <p className="mt-3 text-sm">
            Your ballot has been counted. This vote cannot be changed or submitted again.
          </p>
          {receipt ? (
            <p className="mt-6 font-[family-name:var(--font-code)] text-3xl tracking-widest text-[#111]">
              {receipt}
            </p>
          ) : (
            <p className="mt-6 text-sm">You have already voted. Your ballot is locked in.</p>
          )}
        </div>
      </main>
      <BrandFooter />
    </>
  );
}
