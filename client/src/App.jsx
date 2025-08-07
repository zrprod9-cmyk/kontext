/* client/src/App.jsx */
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';

import Sidebar from './components/Sidebar';
import LoaderCard from './components/LoaderCard';
import ImageCard from './components/ImageCard';
import LoraModal from './components/LoraModal';
import ImageModal from './components/ImageModal';
import ControlBar from './components/ControlBar';

const API = import.meta.env.VITE_API_URL || '';

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

        <ControlBar
          pick={pick}
          setOpenLora={setOpenLora}
          preview={preview}
          handleFile={handleFile}
          prompt={prompt}
          setPrompt={setPrompt}
          generate={generate}
          busy={busy}
          err={err}
        />

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
