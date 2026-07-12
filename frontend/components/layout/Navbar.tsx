"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#data", label: "Data" },
  { href: "/matches", label: "Matches" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-navy-700/60 bg-navy-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="TactiqAI" width={32} height={32} className="h-8 w-8" priority />
          <span className="font-display text-lg font-semibold tracking-tight">
            Tactiq<span className="text-cyan-400">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm text-slate-400 transition-colors hover:text-white",
                pathname === link.href && "text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Button asChild size="sm">
          <Link href="/dashboard">Launch Dashboard</Link>
        </Button>
      </div>
    </header>
  );
}
