/* client/src/App.jsx */
import api from './api';
import React, { useState, useEffect, useRef } from 'react';

import Sidebar from './components/Sidebar';
import LoaderCard from './components/LoaderCard';
import ImageCard from './components/ImageCard';
import LoraModal from './components/LoraModal';
import ImageModal from './components/ImageModal';
import ControlBar from './components/ControlBar';

export default function App() {
  const [boards, setBoards] = useState([]);
  const [bid, setBid] = useState(null);
  const [gallery, setGal] = useState([]);
  const [thumbs, setThumbs] = useState({});
  const [cache, setCache] = useState({});

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
  const imgCache = useRef({});

  const cacheImages = (imgs) => {
    imgs.forEach(({ url }) => {
      if (!imgCache.current[url]) {
        const i = new Image();
        i.src = url;
        imgCache.current[url] = i;
      }
    });
  };

  useEffect(() => {
    api.get('/loras').then((r) => setLoraList(r.data));
    (async () => {
      const { data: boards } = await api.get('/boards');
      setBoards(boards);
      if (boards.length) setBid(boards[boards.length - 1].id);
      const cacheObj = {};
      const thumbsObj = {};
      await Promise.all(
        boards.map(async (b) => {
          const { data: imgs } = await api.get(`/boards/${b.id}`);
          cacheObj[b.id] = imgs;
          cacheImages(imgs);
          const last = imgs.at(-1)?.url;
          if (last) thumbsObj[b.id] = last;
        })
      );
      setCache(cacheObj);
      setThumbs((t) => ({ ...t, ...thumbsObj }));
    })();
  }, []);

  const cached = cache[bid];
  useEffect(() => {
    if (!bid) return;
    if (cached) {
      setGal(cached);
      if (cached.length)
        setThumbs((t) => ({ ...t, [bid]: cached[cached.length - 1].url }));
      return;
    }
    api.get(`/boards/${bid}`).then((r) => {
      setGal(r.data);
      setCache((c) => ({ ...c, [bid]: r.data }));
      if (r.data.length)
        setThumbs((t) => ({ ...t, [bid]: r.data[r.data.length - 1].url }));
      cacheImages(r.data);
    });
  }, [bid, cached]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gallery]);

  const removeImage = (id) => {
    setGal((g) => g.filter((it) => it.id !== id));
    setCache((c) => ({
      ...c,
      [bid]: (c[bid] || []).filter((it) => it.id !== id),
    }));
  };

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
    setCache((c) => ({
      ...c,
      [bid]: [...(c[bid] || []), { id: tmpId, loading: true }],
    }));
    setBusy(true);
    setErr('');

    try {
      const fd = new FormData();
      file ? fd.append('image', file) : fd.append('image_url', preview);
      fd.append('prompt', prompt);
      if (pick?.url) fd.append('lora_path', pick.url);
      if (pick?.name) fd.append('lora_name', pick.name);

      const { data } = await api.post(
        `/boards/${bid}/generate`,
        fd
      );

      setGal((g) => g.map((it) => (it.id === tmpId ? data : it)));
      setCache((c) => ({
        ...c,
        [bid]: (c[bid] || []).map((it) => (it.id === tmpId ? data : it)),
      }));
      setThumbs((t) => ({ ...t, [bid]: data.url }));
      cacheImages([data]);
      setPrompt('');
    } catch (e) {
      setGal((g) => g.filter((it) => it.id !== tmpId));
      setCache((c) => ({
        ...c,
        [bid]: (c[bid] || []).filter((it) => it.id !== tmpId),
      }));
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const newBoard = async () => {
    const { data } = await api.post('/boards');
    setBoards([...boards, data]);
    setBid(data.id);
    setGal([]);
    setPreview('');
    setCache((c) => ({ ...c, [data.id]: [] }));
  };

  return (
    <div className="flex min-h-screen bg-[#121212] text-zinc-100">
      <Sidebar
        boards={boards}
        current={bid}
        onNew={newBoard}
        onPick={setBid}
        onDelete={async (id) => {
          await api.delete(`/boards/${id}`);
          setBoards(boards.filter((b) => b.id !== id));
          setCache((c) => {
            const { [id]: _, ...rest } = c;
            return rest;
          });
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
