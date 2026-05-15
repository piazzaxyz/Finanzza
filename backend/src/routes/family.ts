import { Router, Response } from 'express';
import db from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req: AuthRequest, res: Response) => {
  const members = db.prepare('SELECT * FROM family_members ORDER BY name ASC').all();
  res.json(members);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { name, relation } = req.body as { name: string; relation: string };
  if (!name || !relation) {
    res.status(400).json({ error: 'name e relation são obrigatórios' });
    return;
  }
  const result = db.prepare('INSERT INTO family_members (name, relation) VALUES (?, ?)').run(name, relation);
  const created = db.prepare('SELECT * FROM family_members WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, relation } = req.body as { name: string; relation: string };
  db.prepare('UPDATE family_members SET name=?, relation=? WHERE id=?').run(name, relation, id);
  const updated = db.prepare('SELECT * FROM family_members WHERE id = ?').get(id);
  res.json(updated);
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM family_members WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;
