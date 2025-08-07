import fs from 'fs/promises';
import fssync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fal } from '@fal-ai/client';
import { Blob } from 'buffer';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ---------- ENV & FAL ---------- */
dotenv.config({ path: path.join(__dirname, '.env') });
fal.config({ credentials: process.env.FAL_KEY.trim() });

/* ---------- tiny JSON “DB” helpers ---------- */
const read = async (f, d = []) =>
  (await fs.access(f).then(() => true).catch(() => false))
    ? JSON.parse(await fs.readFile(f, 'utf8'))
    : d;
const write = (f, d) => fs.writeFile(f, JSON.stringify(d, null, 2));

/* ---------- paths ---------- */
const loraFile  = path.join(__dirname, 'loras.json');
const boardFile = path.join(__dirname, 'boards.json');
const imgDir    = path.join(__dirname, 'images');
fssync.mkdirSync(imgDir, { recursive: true });

/* ---------- simple in-process lock for concurrent writes ---------- */
const locks = new Map();
const withLock = async (key, fn) => {
  while (locks.get(key)) await locks.get(key);
  let res;
  const p = fn().then(r => { res = r; });
  locks.set(key, p);
  try   { await p; }
  finally { locks.delete(key); }
  return res;
};

/* ---------- express ---------- */
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
const upload = multer({ storage: multer.memoryStorage() });

/* ---------- LoRA CRUD ---------- */
app.get('/api/loras', async (_, res) => res.json(await read(loraFile)));

app.post(
  '/api/loras',
  upload.fields([{ name: 'before' }, { name: 'after' }]),
  async (req, res) => {
    const up = async (f) => {
      if (!f) return '';
      const r = await fal.storage.upload(new Blob([f.buffer], { type: f.mimetype }));
      return typeof r === 'string' ? r : r.url;
    };
    const list = await read(loraFile);
    const id   = list.length ? list.at(-1).id + 1 : 1;
    const item = {
      id,
      name  : req.body.name,
      desc  : req.body.desc,
      url   : req.body.url,
      before: await up(req.files.before?.[0]),
      after : await up(req.files.after?.[0])
    };
    list.push(item);
    await write(loraFile, list);
    res.json(item);
  }
);

app.put(
  '/api/loras/:id',
  upload.fields([{ name: 'before' }, { name: 'after' }]),
  async (req, res) => {
    const list = await read(loraFile);
    const i    = list.findIndex((l) => l.id === +req.params.id);
    if (i < 0) return res.sendStatus(404);

    const up    = async (f) => {
      const r = await fal.storage.upload(new Blob([f.buffer], { type: f.mimetype }));
      return typeof r === 'string' ? r : r.url;
    };
    const patch = { ...req.body };
    if (req.files.before?.[0]) patch.before = await up(req.files.before[0]);
    if (req.files.after?.[0])  patch.after  = await up(req.files.after[0]);

    list[i] = { ...list[i], ...patch };
    await write(loraFile, list);
    res.sendStatus(204);
  }
);

app.delete('/api/loras/:id', async (req, res) => {
  await write(loraFile, (await read(loraFile)).filter(l => l.id !== +req.params.id));
  res.sendStatus(204);
});

/* ---------- Boards & gallery ---------- */
app.get('/api/boards', async (_, res) => res.json(await read(boardFile)));

app.post('/api/boards', async (_, res) => {
  const boards = await read(boardFile);
  const id     = boards.length ? boards.at(-1).id + 1 : 1;
  boards.push({ id });
  await write(boardFile, boards);
  await write(path.join(imgDir, `${id}.json`), []);
  res.json({ id });
});

app.get('/api/boards/:id', async (req, res) => {
  res.json(await read(path.join(imgDir, `${req.params.id}.json`)));
});

/* ====== NEW: удалить изображение из борды ====== */
app.delete('/api/boards/:bid/images/:iid', async (req, res) => {
  const imgPath = path.join(imgDir, `${req.params.bid}.json`);
  const list    = await read(imgPath);
  const next    = list.filter(img => img.id !== +req.params.iid);
  if (next.length === list.length) return res.sendStatus(404);
  await write(imgPath, next);
  res.sendStatus(204);
});
/* =============================================== */

/* ---------- генерация с очередью ---------- */
const MAX_CONCURRENCY = 6;
let running = 0;
const queue  = [];

app.post('/api/boards/:id/generate', upload.single('image'), (req, res) => {
  console.log(`[Fal-UI] New generate request: ip=${req.ip} board=${req.params.id} at ${new Date().toLocaleTimeString()}`);
  queue.push({ req, res });
  processQueue();
});

async function processQueue() {
  if (running >= MAX_CONCURRENCY || !queue.length) return;

  const { req, res } = queue.shift();
  running++;

  const finish = () => { running--; processQueue(); };

  try {
    let imageUrl = req.body.image_url || '';
    if (req.file) {
      const up = await fal.storage.upload(new Blob([req.file.buffer], { type: req.file.mimetype }));
      imageUrl = typeof up === 'string' ? up : up.url;
    }
    if (!imageUrl) throw new Error('no image');

    const { prompt = '', lora_path = '', lora_name = '', scale = 1 } = req.body;

    let task;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        ({ data: task } = await fal.subscribe('fal-ai/flux-kontext-lora', {
          input: {
            image_url: imageUrl,
            prompt,
            ...(lora_path && { loras: [{ path: lora_path, scale: Number(scale) || 1 }] }),
            output_format  : 'png',
            resolution_mode: 'match_input',
            sync_mode      : false,
            enable_safety_checker: false
          }
        }));
        break;
      } catch (e) {
        if (attempt === 2) throw e;
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    let outUrl = task?.images?.[0]?.url || task?.image?.url || '';
    let taskId = task?.task?.id || task?.id || '';

    if (!outUrl && !taskId) throw new Error('Fal did not return task id');

    const deadline = Date.now() + 120_000;
    while (!outUrl) {
      const { data: st } = await fal.tasks.get(taskId);
      if (st.status === 'success')
        outUrl = st.output?.images?.[0]?.url || st.output?.image?.url;
      else if (st.status === 'failed' || st.status === 'cancelled')
        throw new Error('Generation failed on Fal side');
      else if (Date.now() > deadline)
        throw new Error('Fal generation timeout (120s)');
      else
        await new Promise(r => setTimeout(r, 1200));
    }

    const imgPath = path.join(imgDir, `${req.params.id}.json`);
    const entry   = { id: Date.now(), prompt: prompt || '(no prompt)', lora: lora_name, url: outUrl };

    await withLock(imgPath, async () => {
      const imgs = await read(imgPath);
      imgs.push(entry);
      await write(imgPath, imgs);
    });

    res.json(entry);
  } catch (e) {
    res.status(e.message.includes('timeout') ? 503 : 500).json({ error: e.message });
  } finally {
    finish();
  }
}

/* ---------- раздача собранного React-клиента ---------- */
const dist = path.join(__dirname, '..', 'client', 'dist');

if (fssync.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_, res) => res.sendFile('index.html', { root: dist }));
} else {
  console.warn('⚠️  client/dist не найден — сначала выполните `npm run build` в папке client');
}

/* ---------- запускаем ---------- */
const server = app.listen(4000, () =>
  console.log('API & UI ⇒ http://localhost:4000')
);
server.setTimeout(240_000); // 4 минуты на любой запрос
