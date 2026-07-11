import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-navy-700/60 bg-navy-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-500/15 font-display text-sm font-bold text-cyan-400">
            T
          </span>
          <div>
            <p className="font-display text-base font-semibold">
              Tactiq<span className="text-cyan-400">AI</span>
            </p>
            <p className="text-xs text-slate-500">Analyst-grade tactical AI</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Product</p>
            <Link href="/dashboard" className="text-slate-400 hover:text-white">Dashboard</Link>
            <Link href="/#features" className="text-slate-400 hover:text-white">Features</Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Company</p>
            <Link href="/#about" className="text-slate-400 hover:text-white">About</Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Data Source</p>
            <a
              href="https://github.com/statsbomb/open-data"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white"
            >
              StatsBomb Open Data
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-navy-700/60 px-6 py-4">
        <p className="mx-auto max-w-7xl text-xs text-slate-500">
          &copy; {new Date().getFullYear()} TactiqAI. Match data provided free for non-commercial use by StatsBomb.
        </p>
      </div>
    </footer>
  );
}
