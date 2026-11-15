import { useRef, useState } from 'react';

// One way to give the builder a picture, wherever it asks for one: drop a file
// on it, click to choose one, or paste a URL. An upload lives in this browser
// only (a blob: URL), which is why scenes are copied out with a stand-in path.

export const isImageDrop = (e: React.DragEvent) => [...e.dataTransfer.items].some((i) => i.kind === 'file' && i.type.startsWith('image/'));
export const droppedImage = (e: React.DragEvent) => [...e.dataTransfer.files].find((f) => f.type.startsWith('image/'));

export default function ImageInput({ value, onChange, hint = 'Drop an image, or click to choose' }: { value: string; onChange: (src: string) => void; hint?: string }) {
  const [over, setOver] = useState(false);
  const [url, setUrl] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const take = (f: File | undefined) => {
    if (!f) return;
    if (value.startsWith('blob:')) URL.revokeObjectURL(value);
    setUrl('');
    onChange(URL.createObjectURL(f));
  };
  const loadUrl = () => { if (url.trim()) onChange(url.trim()); };
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => file.current?.click()}
        onDragOver={(e) => { if (isImageDrop(e)) { e.preventDefault(); setOver(true); } }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setOver(false); take(droppedImage(e)); }}
        className={`flex w-full items-center gap-2.5 rounded-md border border-dashed p-2 text-left transition-colors ${over ? 'border-electric-blue bg-electric-blue/10' : 'border-black/20 hover:border-electric-blue'}`}
      >
        {value
          ? <img src={value} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
          : <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded bg-deep-navy/[0.06] font-mono text-base text-deep-navy/40">+</span>}
        <span className="font-mono text-[11px] leading-snug text-deep-navy/60">{value ? 'Drop or click to replace' : hint}</span>
      </button>
      <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="flex gap-1.5">
        <input
          type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') loadUrl(); }}
          placeholder="or an image URL" aria-label="Image URL"
          className="min-w-0 flex-1 rounded-md border border-black/15 bg-white px-2.5 py-1.5 font-mono text-[11px] text-deep-navy placeholder:text-deep-navy/30 focus:border-electric-blue focus:outline-none"
        />
        <button type="button" onClick={loadUrl} className="shrink-0 rounded-md border border-black/10 px-2.5 py-1.5 font-mono text-[11px] text-deep-navy/70 transition-colors hover:border-electric-blue hover:text-deep-navy">load</button>
        {value && <button type="button" onClick={() => { if (value.startsWith('blob:')) URL.revokeObjectURL(value); setUrl(''); onChange(''); }} className="shrink-0 rounded-md border border-black/10 px-2.5 py-1.5 font-mono text-[11px] text-deep-navy/70 transition-colors hover:border-coral hover:text-coral">clear</button>}
      </div>
    </div>
  );
}
