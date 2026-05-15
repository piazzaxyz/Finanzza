import { Router, Response } from 'express';
import db from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req: AuthRequest, res: Response) => {
  const notes = db.prepare('SELECT * FROM notes ORDER BY created_at DESC').all();
  res.json(notes);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { title, content, date } = req.body as { title: string; content?: string; date?: string };
  if (!title) {
    res.status(400).json({ error: 'title é obrigatório' });
    return;
  }
  const result = db.prepare('INSERT INTO notes (title, content, date) VALUES (?, ?, ?)').run(
    title, content || '', date || new Date().toISOString().split('T')[0]
  );
  const created = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, content, date } = req.body as { title: string; content?: string; date?: string };
  db.prepare('UPDATE notes SET title=?, content=?, date=? WHERE id=?').run(title, content || '', date || new Date().toISOString().split('T')[0], id);
  const updated = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  res.json(updated);
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;
