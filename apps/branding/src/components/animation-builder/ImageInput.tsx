import { useRef, useState } from 'react';
import { btn, field } from './Controls';

// One way to give the builder a picture, wherever it asks for one: drop a file
// on it, click to choose one, or paste a URL. An upload lives in this browser
// only (a blob: URL), which is why scenes are copied out with a stand-in path.
// Uploads are kept until the page is closed: a preset saved in this session may still show one.

export const isImageDrop = (e: React.DragEvent) => [...e.dataTransfer.items].some((i) => i.kind === 'file' && i.type.startsWith('image/'));
export const droppedImage = (e: React.DragEvent) => [...e.dataTransfer.files].find((f) => f.type.startsWith('image/'));

export default function ImageInput({ value, onChange }: { value: string; onChange: (src: string) => void }) {
  const [over, setOver] = useState(false);
  const [url, setUrl] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const take = (f: File | undefined) => {
    if (!f) return;
    setUrl('');
    onChange(URL.createObjectURL(f));
  };
  const loadUrl = () => { if (url.trim()) { onChange(url.trim()); setUrl(''); } };
  return (
    <div
      onDragOver={(e) => { if (isImageDrop(e)) { e.preventDefault(); setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setOver(false); take(droppedImage(e)); }}
      className={`flex items-center gap-1.5 rounded-[6px] border border-dashed p-1 transition-colors ${over ? 'border-electric-blue bg-electric-blue/10' : 'border-black/15'}`}
    >
      <button type="button" onClick={() => file.current?.click()} aria-label={value ? 'Replace the image' : 'Choose an image'} title="Click to choose, or drop an image here" className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[4px] bg-deep-navy/[0.06] text-deep-navy/40 transition-colors hover:text-electric-blue">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
      </button>
      <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }} />
      <input
        type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') loadUrl(); }} onBlur={loadUrl}
        placeholder={value ? 'Drop, click, or paste a URL' : 'Drop an image, or paste a URL'} aria-label="Image URL" className={field}
      />
      {value && <button type="button" onClick={() => { setUrl(''); onChange(''); }} className={btn}>Clear</button>}
    </div>
  );
}
