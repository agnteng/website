// The platform's own UI drawn around a frame (DOM, preview only): how a banner
// will sit under an avatar, a name and a follow button. Never part of an export.
import type { Mockup as MockupKind } from './scene';

const AVATAR = '/assets/logo/ae-icon.svg';

// ── platform mockup chrome (DOM, preview only) ──────────────────────────────
export default function Mockup({ kind, W, H }: { kind: MockupKind; W: number; H: number }) {
  if (kind === 'x') {
    const d = W * 0.092;
    return (
      <>
        <div className="bg-black" style={{ position: 'absolute', top: H, left: 0, width: W }}>
          <div
            className="flex items-start justify-between"
            style={{ paddingLeft: W * 0.012, paddingRight: W * 0.025, paddingTop: H * 0.04, paddingBottom: H * 0.07 }}
          >
            <div style={{ marginLeft: d + W * 0.016, marginTop: H * 0.02 }}>
              <div className="font-sans font-bold text-white" style={{ fontSize: W * 0.024, lineHeight: 1.1 }}>Agentic Engineering</div>
              <div className="font-mono text-white/50" style={{ fontSize: W * 0.016 }}>@agenteng</div>
            </div>
            <span className="rounded-full bg-white font-semibold text-black" style={{ fontSize: W * 0.016, padding: `${H * 0.04}px ${W * 0.018}px` }}>Follow</span>
          </div>
        </div>
        <img src={AVATAR} alt="" style={{ position: 'absolute', width: d, height: d, left: W * 0.018, top: H - d * 0.5, borderRadius: '9999px', border: `${W * 0.005}px solid #000` }} />
      </>
    );
  }
  if (kind === 'linkedin') {
    const d = W * 0.072;
    return (
      <>
        <div className="bg-white" style={{ position: 'absolute', top: H, left: 0, width: W }}>
          <div className="flex items-end justify-between" style={{ padding: `${H * 0.18}px ${W * 0.03}px ${H * 0.22}px` }}>
            <div>
              <div className="font-sans font-bold text-panel-navy" style={{ fontSize: W * 0.022 }}>Agentic Engineering</div>
              <div className="font-sans text-panel-navy/55" style={{ fontSize: W * 0.014 }}>Monthly meetup · Lisbon · 1,240 followers</div>
            </div>
            <span className="rounded-full bg-electric-blue font-semibold text-white" style={{ fontSize: W * 0.014, padding: `${H * 0.07}px ${W * 0.018}px` }}>+ Follow</span>
          </div>
        </div>
        <img src={AVATAR} alt="" style={{ position: 'absolute', width: d, height: d, left: W * 0.02, top: H - d * 0.55, borderRadius: W * 0.012, border: `${W * 0.005}px solid #fff` }} />
      </>
    );
  }
  if (kind === 'substack' || kind === 'luma') {
    const luma = kind === 'luma';
    return (
      <div className="bg-white" style={{ position: 'absolute', top: H, left: 0, width: W }}>
        <div className="flex items-center" style={{ gap: W * 0.018, padding: `${W * 0.016}px ${W * 0.03}px` }}>
          <img src={AVATAR} alt="" style={{ width: W * 0.058, height: W * 0.058, borderRadius: luma ? W * 0.012 : '9999px', flex: 'none' }} />
          <div style={{ flex: 1 }}>
            <div className="font-sans font-bold text-panel-navy" style={{ fontSize: W * 0.022 }}>Agentic Engineering</div>
            <div className="font-sans text-panel-navy/55" style={{ fontSize: W * 0.014 }}>{luma ? 'Calendar · Lisbon' : 'Recaps & field notes after every meetup.'}</div>
          </div>
          <span className={luma ? 'rounded-lg bg-[#1a1a1a] font-semibold text-white' : 'rounded-md bg-[#FF6719] font-semibold text-white'} style={{ fontSize: W * 0.014, padding: `${W * 0.01}px ${W * 0.018}px` }}>Subscribe</span>
        </div>
      </div>
    );
  }
  return null;
}
