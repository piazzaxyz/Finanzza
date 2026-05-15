import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'finanzza_secret';
const APP_USER = process.env.APP_USER || 'piazza';
const APP_PASSWORD = process.env.APP_PASSWORD || 'dudu2203';

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body as { username: string; password: string };

  if (username !== APP_USER || password !== APP_PASSWORD) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username });
});

export default router;
