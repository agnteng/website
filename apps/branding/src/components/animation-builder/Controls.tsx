import { useEffect, useState, type ReactNode } from 'react';
import { BRAND_COLORS } from '../BrandColorPicker';

// The sidebar's controls, in the manner of a design tool's inspector: small,
// one line each, label on the left and the control on the right. Everything is
// 11px Manrope; nothing here uses the brand's display type.

export const field = 'h-6 w-full min-w-0 rounded-[5px] border border-transparent bg-deep-navy/[0.05] px-1.5 text-[11px] text-deep-navy outline-none transition-colors placeholder:text-deep-navy/35 hover:border-black/10 focus:border-electric-blue focus:bg-white';
export const btn = 'inline-flex h-6 shrink-0 items-center justify-center rounded-[5px] border border-black/10 px-2 text-[11px] text-deep-navy/75 transition-colors hover:border-black/25 hover:text-deep-navy disabled:cursor-not-allowed disabled:opacity-40';
export const btnAccent = 'inline-flex h-6 shrink-0 items-center justify-center rounded-[5px] bg-electric-blue px-2.5 text-[11px] font-medium text-white transition-colors hover:bg-bright-blue disabled:cursor-not-allowed disabled:opacity-40';
export const iconBtn = 'grid h-6 w-6 shrink-0 place-items-center rounded-[5px] text-deep-navy/45 transition-colors hover:bg-deep-navy/[0.06] hover:text-deep-navy disabled:opacity-25 disabled:hover:bg-transparent';
// A hairline track with a small round thumb. Written out in full: Tailwind only
// finds class names it can read in the source.
const slider = 'h-0.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-deep-navy/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-electric-blue [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_#fff,0_0_0_3px_rgba(5,7,30,0.15)] [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-electric-blue [&::-moz-range-thumb]:shadow-[0_0_0_2px_#fff,0_0_0_3px_rgba(5,7,30,0.15)]';
export const note = 'text-[10.5px] leading-relaxed text-deep-navy/45';

// A labelled line. `stack` puts the control under the label, for wide ones; `top` keeps
// the label on the first line of a control that wraps.
export function Row({ label, stack, top, children }: { label: string; stack?: boolean; top?: boolean; children: ReactNode }) {
  return stack ? (
    <div className="space-y-1.5">
      <span className="block text-[11px] text-deep-navy/55">{label}</span>
      {children}
    </div>
  ) : (
    <div className={`grid min-h-6 grid-cols-[76px_minmax(0,1fr)] gap-2 ${top ? 'items-start' : 'items-center'}`}>
      <span className={`truncate text-[11px] text-deep-navy/55 ${top ? 'leading-6' : ''}`} title={label}>{label}</span>
      {children}
    </div>
  );
}

// A number, typed freely and taken on Enter or when the field is left.
export function Num({ value, onChange, min, max, step = 1, className = '' }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; className?: string }) {
  const show = (v: number) => String(step >= 1 ? Math.round(v) : Number(v.toFixed(3)));
  const [draft, setDraft] = useState(show(value));
  useEffect(() => setDraft(show(value)), [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const commit = () => {
    let v = Number(draft);
    if (!Number.isFinite(v)) v = value;
    if (min != null) v = Math.max(min, v);
    if (max != null) v = Math.min(max, v);
    setDraft(show(v));
    if (v !== value) onChange(v);
  };
  return (
    <input
      type="text" inputMode="decimal" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        // arrows nudge, as in a design tool; shift for ten steps
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const d = (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
          onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, Number((value + d).toFixed(4)))));
        }
      }}
      className={`${field} tabular-nums ${className}`}
    />
  );
}

// A slider with its number beside it; either sets the value.
export function Range({ label, value, min, max, step = 0.01, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <Row label={label}>
      <div className="flex items-center gap-2">
        <input
          type="range" min={min} max={max} step={step} value={value} aria-label={label}
          onChange={(e) => onChange(Number(e.target.value))}
          className={slider}
        />
        <Num value={value} onChange={onChange} min={min} max={max} step={step} className="!w-12 text-right" />
      </div>
    </Row>
  );
}

// Two to four choices, side by side.
export function Seg<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex h-6 rounded-[5px] bg-deep-navy/[0.06] p-px">
      {options.map((o) => (
        <button
          key={o} type="button" onClick={() => onChange(o)} aria-pressed={value === o}
          className={`min-w-0 flex-1 truncate rounded-[4px] px-1.5 text-[11px] capitalize transition-colors ${value === o ? 'bg-white text-deep-navy shadow-[0_0_0_1px_rgba(5,7,30,0.08),0_1px_2px_rgba(5,7,30,0.08)]' : 'text-deep-navy/55 hover:text-deep-navy'}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// More choices than fit side by side.
export function Select<T extends string>({ options, value, onChange, label }: { options: readonly T[] | readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void; label?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} aria-label={label} className={`${field} cursor-pointer capitalize`}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        return <option key={v} value={v}>{typeof o === 'string' ? o : o.label}</option>;
      })}
    </select>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex h-6 cursor-pointer items-center gap-1.5 text-[11px] text-deep-navy/75">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-3 w-3 accent-electric-blue" /> {label}
    </label>
  );
}

// A brand colour: the current one as a chip, the palette on demand.
export function Colour({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const cur = BRAND_COLORS.find((c) => c.hex.toLowerCase() === value.toLowerCase());
  return (
    <div>
      <Row label={label}>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`${field} flex items-center gap-1.5 text-left`}>
          <span className="h-3.5 w-3.5 shrink-0 rounded-[3px] ring-1 ring-black/15" style={{ background: value }} />
          <span className="truncate">{cur?.name ?? value}</span>
        </button>
      </Row>
      {open && (
        <div className="mt-1.5 grid grid-cols-[76px_minmax(0,1fr)] gap-2">
          <span />
          <div className="flex flex-wrap gap-1">
            {BRAND_COLORS.map((c) => (
              <button
                key={c.hex} type="button" title={c.name} aria-label={c.name} onClick={() => { onChange(c.hex); setOpen(false); }}
                className={`h-5 w-5 rounded-[4px] ring-1 transition ${c.hex.toLowerCase() === value.toLowerCase() ? 'ring-2 ring-electric-blue ring-offset-1' : 'ring-black/15 hover:ring-black/40'}`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
