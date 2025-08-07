/* client/src/components/ImageModal.jsx */
import { X, Download } from 'lucide-react';

export default function ImageModal({ img, onClose }) {
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
