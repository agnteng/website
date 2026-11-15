import type { ReactNode } from 'react';

// A controlled accordion "toggle box" for the right params panel. Open state is
// owned by the orchestrator so several can be open at once (Figma-style).
interface Props {
  title: string;
  open: boolean;
  onToggle: () => void;
  right?: ReactNode; // small status slot in the header (e.g. Image "loaded")
  children: ReactNode;
}

export default function CollapsibleSection({ title, open, onToggle, right, children }: Props) {
  return (
    <section className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-9 w-full items-center gap-1.5 px-3 text-left transition-colors hover:bg-deep-navy/[0.03]"
        aria-expanded={open}
      >
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={`h-2.5 w-2.5 shrink-0 text-deep-navy/40 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        >
          <path d="M4 2.5L8 6l-4 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[11px] font-semibold text-deep-navy">{title}</span>
        {right != null && <span className="ml-auto truncate pl-3 text-[11px] text-deep-navy/40">{right}</span>}
      </button>
      {open && <div className="space-y-2 px-3 pb-3">{children}</div>}
    </section>
  );
}
