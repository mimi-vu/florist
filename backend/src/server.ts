import express from 'express';
import cors from 'cors';
import { flowers, vases, wraps } from './data/catalog';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const designs = new Map<string, unknown>();

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'florist-studio' });
});

app.get('/api/catalog', (_req, res) => {
  res.json({ flowers, vases, wraps });
});

app.get('/api/flowers', (_req, res) => res.json(flowers));
app.get('/api/vases', (_req, res) => res.json(vases));
app.get('/api/wraps', (_req, res) => res.json(wraps));

app.post('/api/designs', (req, res) => {
  const id = `d_${Date.now().toString(36)}`;
  designs.set(id, req.body);
  res.status(201).json({ id });
});

app.get('/api/designs/:id', (req, res) => {
  const design = designs.get(req.params.id);
  if (!design) return res.status(404).json({ error: 'not found' });
  res.json(design);
});

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`Florist Studio API on http://localhost:${PORT}`);
});
