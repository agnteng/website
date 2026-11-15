import { useState } from 'react';

// A Chrome-DevTools-style bottom drawer. Collapsed to a thin handle; click to
// slide the JSX panel up. Pinned to the bottom of the canvas column so it never
// overlaps the params panel.
interface Props {
  tabs: { name: string; code: string }[]; // the same picture, written two ways
}

export default function CodeDrawer({ tabs }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const { code } = tabs[Math.min(tab, tabs.length - 1)];
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <div className="shrink-0 border-t border-line bg-panel">
      <div className="flex items-center gap-2 px-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2 py-2 text-left"
          aria-expanded={open}
        >
          <svg
            viewBox="0 0 12 12"
            aria-hidden="true"
            className={`h-2.5 w-2.5 text-deep-navy/40 transition-transform duration-150 ${open ? '' : 'rotate-180'}`}
          >
            <path d="M2.5 7.5L6 4l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-deep-navy/70">Code</span>
          {!open && <span className="truncate font-mono text-[11px] text-deep-navy/35">{tabs.map((t) => t.name).join(' · ')}</span>}
        </button>
        {open && tabs.map((t, i) => (
          <button
            key={t.name}
            type="button"
            onClick={() => setTab(i)}
            className={`rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors ${i === tab ? 'bg-deep-navy/[0.08] text-deep-navy' : 'text-deep-navy/50 hover:text-deep-navy'}`}
          >
            {t.name}
          </button>
        ))}
        {open && (
          <button
            type="button"
            onClick={onCopy}
            className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-deep-navy/70 transition-colors hover:border-electric-blue hover:text-electric-blue"
          >
            {copied ? 'copied ✓' : 'copy'}
          </button>
        )}
      </div>
      {open && (
        <pre className="max-h-[34vh] overflow-auto border-t border-line bg-canvas px-4 py-3 font-mono text-xs leading-relaxed text-deep-navy/85">
          {code}
        </pre>
      )}
    </div>
  );
}
