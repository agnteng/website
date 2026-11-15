// Top bar for the Animation Builder — kept dark to match the uniform SiteHeader
// on every other page, sitting above the light workspace. Brand mark + title
// and a back-to-index link.

export default function TopBar() {
  return (
    <header className="col-span-2 flex h-11 items-center gap-4 border-b border-white/10 bg-deep-navy px-4">
      <a href="/" className="flex items-center gap-2.5" aria-label="Agentic Engineering — home">
        <span className="block h-2.5 w-2.5 bg-electric-blue" />
        <span className="text-[13px] font-semibold tracking-tight text-soft-white">Animation Builder</span>
      </a>

      <a
        href="/"
        className="ml-auto text-[11px] text-soft-white/45 transition-colors hover:text-periwinkle"
      >
        ← index
      </a>
    </header>
  );
}
