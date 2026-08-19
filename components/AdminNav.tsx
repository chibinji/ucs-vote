"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";

const links = [
  { href: "/admin", label: "Live results" },
  { href: "/admin/voters", label: "Voters" },
  { href: "/admin/ballot", label: "Ballot" },
  { href: "/admin/audit", label: "Activity" },
  { href: "/admin/report", label: "Report" },
];

export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[#454B4C]/10 bg-white px-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 py-3 text-sm">
        {links.map((link) => {
          const active =
            link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-1.5 ${
                active ? "bg-[#2C8992] text-white" : "text-[#2C8992] hover:bg-[#2C8992]/10"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <span className="badge badge-open ml-auto">{role}</span>
        <SignOutButton />
      </div>
    </nav>
  );
}
