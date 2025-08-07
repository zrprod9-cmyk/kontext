/* client/src/components/LoraModal.jsx */
import { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import Compare from './Compare';

export default function LoraModal({
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
  const safeList = Array.isArray(list) ? list : [];

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
    await api.delete(`/loras/${id}`);
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
      await api.put(`/loras/${editId}`, fd);
      onUpdate(editId, f);
    } else {
      const { data } = await api.post('/loras', fd);
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

              {!Array.isArray(list) ? (
                <p className="w-full text-center text-sm text-red-400">
                  Invalid LoRA list
                </p>
              ) : (
                safeList.map((l, i) => (
                  <div
                    key={l.id ?? i}
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
                ))
              )}
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
