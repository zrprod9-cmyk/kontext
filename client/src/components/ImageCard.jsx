/* client/src/components/ImageCard.jsx */
import { api } from '../api';
import { Download, Trash2 } from 'lucide-react';

export default function ImageCard({ img, boardId, onRemove, onShow }) {
  const save = async () => {
    const { data: blob } = await api.get(img.url, { responseType: 'blob', withCredentials: false });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image_${img.id}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const del = async () => {
    await api.delete(`/boards/${boardId}/images/${img.id}`);
    onRemove(img.id);
  };

  return (
    <div className="relative space-y-2 rounded-lg bg-muted p-3 shadow group">
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
