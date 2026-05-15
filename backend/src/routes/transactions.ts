import { Router, Response } from 'express';
import db from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req: AuthRequest, res: Response) => {
  const rows = db.prepare(`
    SELECT t.*, fm.name as family_member_name, fm.relation as family_member_relation
    FROM transactions t
    LEFT JOIN family_members fm ON t.family_member_id = fm.id
    ORDER BY t.date DESC, t.created_at DESC
  `).all();
  res.json(rows);
});

router.get('/summary', (_req: AuthRequest, res: Response) => {
  const totals = db.prepare(`
    SELECT
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
      SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as balance,
      SUM(CASE WHEN is_unnecessary = 1 THEN amount ELSE 0 END) as unnecessary_total
    FROM transactions
  `).get();

  const byCategory = db.prepare(`
    SELECT category,
      SUM(amount) as total,
      COUNT(*) as count,
      type
    FROM transactions
    GROUP BY category, type
    ORDER BY total DESC
  `).all();

  const byMonth = db.prepare(`
    SELECT
      strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM transactions
    GROUP BY month
    ORDER BY month ASC
  `).all();

  const byMember = db.prepare(`
    SELECT
      fm.id, fm.name, fm.relation,
      SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense,
      SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
      COUNT(*) as count
    FROM family_members fm
    LEFT JOIN transactions t ON t.family_member_id = fm.id
    GROUP BY fm.id
    ORDER BY total_expense DESC
  `).all();

  res.json({ totals, byCategory, byMonth, byMember });
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { type, amount, date, category, description, is_unnecessary, family_member_id } = req.body as {
    type: string; amount: number; date: string; category: string;
    description?: string; is_unnecessary?: boolean; family_member_id?: number;
  };

  if (!type || !amount || !date || !category) {
    res.status(400).json({ error: 'Campos obrigatórios: type, amount, date, category' });
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO transactions (type, amount, date, category, description, is_unnecessary, family_member_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(type, amount, date, category, description || '', is_unnecessary ? 1 : 0, family_member_id || null);
  const created = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { type, amount, date, category, description, is_unnecessary, family_member_id } = req.body as {
    type: string; amount: number; date: string; category: string;
    description?: string; is_unnecessary?: boolean; family_member_id?: number;
  };

  db.prepare(`
    UPDATE transactions SET type=?, amount=?, date=?, category=?, description=?,
    is_unnecessary=?, family_member_id=? WHERE id=?
  `).run(type, amount, date, category, description || '', is_unnecessary ? 1 : 0, family_member_id || null, id);

  const updated = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  res.json(updated);
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;
