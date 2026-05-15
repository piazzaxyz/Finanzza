import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database';
import authRouter from './routes/auth';
import transactionsRouter from './routes/transactions';
import familyRouter from './routes/family';
import notesRouter from './routes/notes';

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Permite chamadas sem origin (ex: Postman, Railway health checks)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origem não permitida → ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

initDatabase();

app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/family', familyRouter);
app.use('/api/notes', notesRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'Finanzza' }));

app.listen(PORT, () => {
  console.log(`🚀 Finanzza Backend rodando em http://localhost:${PORT}`);
});
