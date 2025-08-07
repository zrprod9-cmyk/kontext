/* client/src/components/Sidebar.jsx */
import { useRef, useState, useEffect } from 'react';
import { Plus, ChevronUp, ChevronDown, X } from 'lucide-react';
import Btn from './Btn';

export default function Sidebar({ boards, current, onNew, onPick, onDelete, thumbs }) {
  const listRef = useRef(null);
  const scrollBy = (d) =>
    listRef.current?.scrollBy({ top: d * 240, behavior: 'smooth' });

  const [up, setUp] = useState(false);
  const [down, setDown] = useState(false);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const calc = () => {
      setUp(el.scrollTop > 0);
      setDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    };
    calc();
    el.addEventListener('scroll', calc);
    return () => el.removeEventListener('scroll', calc);
  }, [boards]);

  return (
    <div className="sticky top-0 flex h-screen w-28 flex-col items-center bg-muted/90 py-3">
      <Btn onClick={onNew} className="mb-3 h-14 w-14 p-0">
        <Plus size={28} />
      </Btn>

      <button
        onClick={() => scrollBy(-1)}
        disabled={!up}
        className="mb-3 rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-40"
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-1">
        {[...boards].reverse().map((b) => (
          <div
            key={b.id}
            className={`group relative mx-auto h-20 w-20 overflow-hidden rounded border ${
              current === b.id ? 'border-primary' : 'border-transparent'
            }`}
          >
            <img
              src={thumbs[b.id]}
              onClick={() => onPick(b.id)}
              onError={(e) => (e.currentTarget.style.display = 'none')}
              className="h-full w-full cursor-pointer object-cover"
            />
            <button
              onClick={() => onDelete(b.id)}
              className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 group-hover:flex"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => scrollBy(1)}
        disabled={!down}
        className="mt-3 rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-40"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}
