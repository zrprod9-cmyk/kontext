/* client/src/App.jsx */

import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  X,
  Trash2,
  Pencil,
  Download,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

/* ---------- UI helpers ---------- */
const Btn = ({ className = '', ...p }) => (
  <button
    {...p}
    className={`inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50 ${className}`}
  />
);

/* ---------- before/after preview ---------- */
function Compare({ before, after }) {
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

/* ---------- loader placeholder ---------- */
const LoaderCard = () => (
  <div className="flex h-[310px] flex-col rounded-lg bg-muted/40 p-3 shadow">
    <div className="flex flex-1 items-center justify-center">
      <svg
        className="h-10 w-10 animate-spin text-primary"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          d="M22 12a10 10 0 01-10 10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  </div>
);

/* ---------- single image card ---------- */
function ImageCard({ img, boardId, onRemove, onShow }) {
  const save = async () => {
    const res = await fetch(img.url, { mode: 'cors' });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image_${img.id}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const del = async () => {
    await axios.delete(`${API}/api/boards/${boardId}/images/${img.id}`);
    onRemove(img.id);
  };

  return (
    <div className="relative space-y-2 rounded-lg bg-muted/40 p-3 shadow group">
      <p className="text-xs">{img.prompt || '(no prompt)'}</p>
      {img.lora && (
        <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
          {img.lora}
        </span>
      )}
      <img
        src={img.url}
        onClick={() => onShow(img.url)}
        className="w-full cursor-pointer rounded"
      />

      <div className="absolute inset-0 flex items-start justify-end gap-2 bg-black/40 p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={save}
          title="Download"
          className="rounded bg-white/20 p-1 hover:bg-white/40"
        >
          <Download size={16} />
        </button>
        <button
          onClick={del}
          title="Delete"
          className="rounded bg-red-500/80 p-1 text-white hover:bg-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

/* ---------- LoRA modal (unchanged) ---------- */
function LoraModal({
  open,
  list,
  onClose,
  onPick,
  onAdd,
  onUpdate,
  onDelete
}) {
  const blank = { id: 0, name: '', desc: '', url: '', before: '', after: '' };
  const [editId, setEditId] = useState(null);
  const [f, setF] = useState(blank);
  const [files, setFiles] = useState({});

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const reset = () => {
    setEditId(null);
    setF(blank);
    setFiles({});
  };
  const beginEdit = (l) => {
    setEditId(l.id);
    setF({ ...blank, ...l });
    setFiles({});
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту LoRA?')) return;
    await axios.delete(`${API}/api/loras/${id}`);
    onDelete(id);
    if (editId === id) reset();
  };

  const save = async () => {
    if (!f.name.trim() || !f.url.trim()) {
      alert('Название и ссылка обязательны');
      return;
    }
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, v));
    Object.entries(files).forEach(([k, v]) => v && fd.append(k, v));

    if (editId > 0) {
      await axios.put(`${API}/api/loras/${editId}`, fd);
      onUpdate(editId, f);
    } else {
      const { data } = await axios.post(`${API}/api/loras`, fd);
      onAdd(data);
    }
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="relative flex max-h-[95vh] w-full max-w-5xl flex-col rounded-2xl bg-[#111] text-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-white/10 bg-[#111] px-8 py-6">
          <h3 className="text-xl font-semibold">LoRA база</h3>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-full p-1 hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {editId === null ? (
            <div className="flex flex-wrap justify-center gap-8">
              <div
                onClick={() => beginEdit({ id: 0 })}
                className="flex h-[400px] w-[320px] cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-white/30 hover:border-white/70"
              >
                <Plus size={48} className="text-white/60" />
              </div>

              {list.map((l) => (
                <div
                  key={l.id}
                  onClick={() => {
                    onPick(l);
                    onClose();
                  }}
                  className="group relative flex h-[400px] w-[320px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 transition-all hover:border-violet-500"
                >
                  <div className="flex flex-1 flex-col items-center justify-center">
                    {l.before && l.after ? (
                      <Compare before={l.before} after={l.after} />
                    ) : (
                      <img
                        src={l.before || l.after || '/placeholder.png'}
                        alt=""
                        className="h-full w-full rounded-t-2xl object-cover"
                      />
                    )}
                  </div>
                  <div className="rounded-b-2xl bg-black/30 p-4 pb-2">
                    <p className="line-clamp-1 text-lg font-semibold">{l.name}</p>
                    {l.desc && (
                      <p className="line-clamp-3 text-[15px] leading-tight text-white/70">
                        {l.desc}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      beginEdit(l);
                    }}
                    className="absolute left-2 top-2 hidden rounded p-1 hover:bg-white/10 group-hover:block"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(l.id);
                    }}
                    className="absolute right-2 top-2 hidden rounded p-1 hover:bg-white/10 group-hover:block"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              <input
                placeholder="Название"
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
                className="w-full rounded border border-white/20 bg-black/30 p-3 text-lg"
              />
              <textarea
                placeholder="Описание"
                value={f.desc}
                rows={3}
                onChange={(e) => setF({ ...f, desc: e.target.value })}
                className="w-full resize-none rounded border border-white/20 bg-black/30 p-3 text-lg"
              />
              <input
                placeholder="URL (.safetensors)"
                value={f.url}
                onChange={(e) => setF({ ...f, url: e.target.value })}
                className="w-full rounded border border-white/20 bg-black/30 p-3 text-lg"
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <label className="space-y-2">
                  Картинка «до»
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFiles({ ...files, before: e.target.files[0] })
                    }
                    className="block w-full cursor-pointer rounded border border-white/20 bg-black/30 p-2 text-[15px]"
                  />
                </label>
                <label className="space-y-2">
                  Картинка «после»
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFiles({ ...files, after: e.target.files[0] })
                    }
                    className="block w-full cursor-pointer rounded border border-white/20 bg-black/30 p-2 text-[15px]"
                  />
                </label>
              </div>
              <div className="flex gap-5 pt-2">
                <button
                  onClick={save}
                  className="flex-1 rounded-lg bg-violet-600 py-3 text-lg font-medium hover:bg-violet-700"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                  className="flex-1 rounded-lg bg-white/10 py-3 text-lg font-medium hover:bg-white/20"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- image preview modal ---------- */
function ImageModal({ img, onClose }) {
  if (!img) return null;

  const save = () => {
    const a = document.createElement('a');
    a.href = img;
    a.download = 'image.png';
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={img} className="max-h-[80vh] rounded-lg" />
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded bg-background/70 p-1 hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          onClick={save}
          className="absolute right-10 top-2 rounded bg-background/70 p-1 hover:bg-background"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------- sidebar with board thumbnails ---------- */
function Sidebar({ boards, current, onNew, onPick, onDelete, thumbs }) {
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

/* ---------- main app ---------- */
export default function App() {
  const [boards, setBoards] = useState([]);
  const [bid, setBid] = useState(null);
  const [gallery, setGal] = useState([]);
  const [thumbs, setThumbs] = useState({});

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const [loraList, setLoraList] = useState([]);
  const [pick, setPick] = useState(null);
  const [openLora, setOpenLora] = useState(false);
  const [show, setShow] = useState(null);
  const bottom = useRef(null);

  useEffect(() => {
    axios.get(`${API}/api/loras`).then((r) => setLoraList(r.data));
    axios.get(`${API}/api/boards`).then((r) => {
      setBoards(r.data);
      if (r.data.length) setBid(r.data[r.data.length - 1].id);
    });
  }, []);

  useEffect(() => {
    if (!bid) return;
    axios.get(`${API}/api/boards/${bid}`).then((r) => {
      setGal(r.data);
      if (r.data.length)
        setThumbs((t) => ({ ...t, [bid]: r.data[r.data.length - 1].url }));
    });
  }, [bid]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gallery]);

  const removeImage = (id) => setGal((g) => g.filter((it) => it.id !== id));

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setErr('');
  };

  const generate = async () => {
    if (!preview && !file) {
      setErr('добавьте изображение');
      return;
    }

    const tmpId = Date.now();
    setGal((g) => [...g, { id: tmpId, loading: true }]);
    setBusy(true);
    setErr('');

    try {
      const fd = new FormData();
      file ? fd.append('image', file) : fd.append('image_url', preview);
      fd.append('prompt', prompt);
      if (pick?.url) fd.append('lora_path', pick.url);
      if (pick?.name) fd.append('lora_name', pick.name);

      const { data } = await axios.post(
        `${API}/api/boards/${bid}/generate`,
        fd
      );

      setGal((g) => g.map((it) => (it.id === tmpId ? data : it)));
      setThumbs((t) => ({ ...t, [bid]: data.url }));
      setPrompt('');
    } catch (e) {
      setGal((g) => g.filter((it) => it.id !== tmpId));
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const newBoard = async () => {
    const { data } = await axios.post(`${API}/api/boards`);
    setBoards([...boards, data]);
    setBid(data.id);
    setGal([]);
    setPreview('');
  };

  return (
    <div className="flex min-h-screen bg-[#121212] text-zinc-100">
      <Sidebar
        boards={boards}
        current={bid}
        onNew={newBoard}
        onPick={setBid}
        onDelete={async (id) => {
          await axios.delete(`${API}/api/boards/${id}`);
          setBoards(boards.filter((b) => b.id !== id));
          if (bid === id) setBid(null);
        }}
        thumbs={thumbs}
      />

      <div className="relative flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 p-6 md:grid-cols-2">
          {gallery.map((g) =>
            g.loading ? (
              <LoaderCard key={g.id} />
            ) : (
              <ImageCard
                key={g.id}
                img={g}
                boardId={bid}
                onRemove={removeImage}
                onShow={setShow}
              />
            )
          )}
          <div ref={bottom}></div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-muted bg-background/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3">
            <Btn onClick={() => setOpenLora(true)} className="h-10 px-3">
              {pick ? pick.name : 'Add lora'}
            </Btn>

            <label className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded bg-muted hover:bg-muted/70">
              {preview ? (
                <img src={preview} className="h-full w-full object-cover" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
            </label>

            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe an image…"
              className="min-w-[120px] flex-1 rounded border border-muted bg-transparent px-3 py-2 text-sm focus:outline-primary"
            />

            <Btn onClick={generate} disabled={busy} className="h-10 w-28">
              {busy ? 'Wait…' : 'Generate'}
            </Btn>
          </div>
          {err && (
            <p className="mt-2 text-center text-xs text-red-500">{err}</p>
          )}
        </div>

        <LoraModal
          open={openLora}
          list={loraList}
          onClose={() => setOpenLora(false)}
          onPick={setPick}
          onAdd={(l) => setLoraList([...loraList, l])}
          onUpdate={(id, info) =>
            setLoraList(
              loraList.map((l) => (l.id === id ? { ...l, ...info } : l))
            )
          }
          onDelete={(id) => setLoraList(loraList.filter((l) => l.id !== id))}
        />
        <ImageModal img={show} onClose={() => setShow(null)} />
      </div>
    </div>
  );
}
