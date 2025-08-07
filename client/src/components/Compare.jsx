/* client/src/components/Compare.jsx */
import { useRef, useState } from 'react';

export default function Compare({ before, after }) {
  const wrap = useRef(null);
  const [split, setSplit] = useState(50);
  return (
    <div
      ref={wrap}
      className="relative h-full w-full overflow-hidden rounded"
      onMouseMove={(e) => {
        const r = wrap.current.getBoundingClientRect();
        setSplit(((e.clientX - r.left) / r.width) * 100);
      }}
      onMouseLeave={() => setSplit(50)}
    >
      <img src={after} className="absolute inset-0 h-full w-full object-cover" />
      <img
        src={before}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
      />
      <div
        className="absolute inset-y-0 w-0.5 bg-white/70"
        style={{ left: `calc(${split}% - 1px)` }}
      />
    </div>
  );
}
