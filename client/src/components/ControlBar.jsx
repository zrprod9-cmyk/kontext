/* client/src/components/ControlBar.jsx */
import Btn from './Btn';
import { Plus } from 'lucide-react';

export default function ControlBar({
  pick,
  setOpenLora,
  preview,
  handleFile,
  prompt,
  setPrompt,
  generate,
  busy,
  err
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-muted bg-background px-4 py-3">
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
      {err && <p className="mt-2 text-center text-xs text-red-500">{err}</p>}
    </div>
  );
}
