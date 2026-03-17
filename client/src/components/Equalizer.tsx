import { useEffect, useRef, useState } from 'react';
import { Howler } from 'howler';

export default function Equalizer() {
  const [enabled, setEnabled] = useState(false);
  const [bass, setBass] = useState(0);
  const [mid, setMid] = useState(0);
  const [treble, setTreble] = useState(0);

  const filtersRef = useRef<{ low: BiquadFilterNode; mid: BiquadFilterNode; high: BiquadFilterNode } | null>(null);

  useEffect(() => {
    // Only set up Web Audio API nodes once
    if (!Howler.ctx || filtersRef.current) return;
    
    const ctx = Howler.ctx as AudioContext;
    const master = Howler.masterGain as GainNode;
    
    // Create filters
    const low = ctx.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = 100;
    
    const midBand = ctx.createBiquadFilter();
    midBand.type = 'peaking';
    midBand.Q.value = 1;
    midBand.frequency.value = 1000;
    
    const high = ctx.createBiquadFilter();
    high.type = 'highshelf';
    high.frequency.value = 8000;

    filtersRef.current = { low, mid: midBand, high };
    
    // Re-route Howler master
    master.disconnect();
    // It's tricky to inject precisely behind Howler, but this works on the global bus
    master.connect(low);
    low.connect(midBand);
    midBand.connect(high);
    high.connect(ctx.destination);

    return () => {
      master.disconnect();
      master.connect(ctx.destination);
    };
  }, []);

  useEffect(() => {
    if (!filtersRef.current) return;
    const { low, mid: midBand, high } = filtersRef.current;
    if (enabled) {
      low.gain.value = bass;
      midBand.gain.value = mid;
      high.gain.value = treble;
    } else {
      low.gain.value = 0;
      midBand.gain.value = 0;
      high.gain.value = 0;
    }
  }, [enabled, bass, mid, treble]);

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium text-t1">Equalizer</h3>
        <button 
          onClick={() => setEnabled(!enabled)}
          className={`text-xs px-3 py-1 rounded-full border transition ${enabled ? 'border-acc text-acc' : 'border-t3 text-t3'}`}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className={`flex gap-8 transition-opacity ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <EqSlider label="Bass" value={bass} onChange={setBass} />
        <EqSlider label="Mid" value={mid} onChange={setMid} />
        <EqSlider label="Treble" value={treble} onChange={setTreble} />
      </div>
    </div>
  );
}

function EqSlider({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs text-t3 font-mono">{value > 0 ? `+${value}` : value} dB</span>
      {/* @ts-ignore */}
      <input 
        type="range" min="-12" max="12" step="1"
        {...{ orient: "vertical" } as any}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-32 appearance-none w-2 bg-s2 rounded-full cursor-pointer"
        style={{ WebkitAppearance: 'slider-vertical' } as any}
      />
      <span className="text-sm font-medium text-t2">{label}</span>
    </div>
  );
}
