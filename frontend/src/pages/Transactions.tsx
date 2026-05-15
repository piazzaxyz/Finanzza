import { useEffect, useState, FormEvent } from 'react';
import { Plus, Pencil, Trash2, Search, Filter, X, AlertTriangle } from 'lucide-react';
import { Transaction, FamilyMember } from '../types';
import { fetchTransactions, createTransaction, updateTransaction, deleteTransaction } from '../api/transactions';
import { fetchFamily } from '../api/family';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EXPENSE_CATEGORIES = [
  'Alimentação','Moradia','Transporte','Saúde','Educação',
  'Lazer','Vestuário','Assinaturas','Serviços','Mercado',
  'Farmácia','Combustível','Outros',
];
const INCOME_CATEGORIES = ['Salário','Freelance','Investimentos','Pensão','Presente','Outros'];

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const today = () => new Date().toISOString().split('T')[0];

interface FormData {
  type: 'income' | 'expense';
  amount: string;
  date: string;
  category: string;
  description: string;
  is_unnecessary: boolean;
  family_member_id: string;
}

const emptyForm = (): FormData => ({
  type: 'expense', amount: '', date: today(),
  category: '', description: '', is_unnecessary: false, family_member_id: '',
});

interface ModalProps {
  editing: Transaction | null;
  members: FamilyMember[];
  onClose: () => void;
  onSaved: () => void;
}

function TransactionModal({ editing, members, onClose, onSaved }: ModalProps) {
  const [form, setForm] = useState<FormData>(() =>
    editing
      ? {
          type: editing.type,
          amount: String(editing.amount),
          date: editing.date,
          category: editing.category,
          description: editing.description,
          is_unnecessary: !!editing.is_unnecessary,
          family_member_id: editing.family_member_id ? String(editing.family_member_id) : '',
        }
      : emptyForm()
  );
  const [saving, setSaving] = useState(false);

  const categories = form.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      type: form.type,
      amount: parseFloat(form.amount),
      date: form.date,
      category: form.category,
      description: form.description,
      is_unnecessary: form.is_unnecessary ? 1 : 0,
      family_member_id: form.family_member_id ? parseInt(form.family_member_id) : null,
    };
    try {
      if (editing) {
        await updateTransaction(editing.id, payload as Partial<Transaction>);
      } else {
        await createTransaction(payload as Parameters<typeof createTransaction>[0]);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="card w-full max-w-lg shadow-2xl shadow-black/50 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {editing ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-surface-border">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t} type="button"
                onClick={() => { set('type', t); set('category', ''); }}
                className={`flex-1 py-2 text-sm font-medium transition-all ${
                  form.type === t
                    ? t === 'expense'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-brand-600/20 text-brand-400 border-brand-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'expense' ? '↓ Saída' : '↑ Entrada'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor (R$)</label>
              <input className="input" type="number" step="0.01" min="0.01" placeholder="0,00"
                value={form.amount} onChange={e => set('amount', e.target.value)} required />
            </div>
            <div>
              <label className="label">Data</label>
              <input className="input" type="date" value={form.date}
                onChange={e => set('date', e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="label">Categoria</label>
            <select className="input" value={form.category}
              onChange={e => set('category', e.target.value)} required>
              <option value="">Selecione...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Descrição</label>
            <input className="input" type="text" placeholder="Ex: Supermercado Extra"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div>
            <label className="label">Familiar</label>
            <select className="input" value={form.family_member_id}
              onChange={e => set('family_member_id', e.target.value)}>
              <option value="">Sem familiar associado</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.relation})</option>
              ))}
            </select>
          </div>

          {form.type === 'expense' && (
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-surface-border hover:bg-surface-border/50 transition-colors">
              <input type="checkbox" className="w-4 h-4 accent-orange-500"
                checked={form.is_unnecessary} onChange={e => set('is_unnecessary', e.target.checked)} />
              <div>
                <p className="text-sm text-slate-200 font-medium">Gasto Desnecessário</p>
                <p className="text-xs text-slate-500">Marque para rastrear gastos evitáveis</p>
              </div>
              <AlertTriangle className="w-4 h-4 text-orange-400 ml-auto shrink-0" />
            </label>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const load = async () => {
    const [t, m] = await Promise.all([fetchTransactions(), fetchFamily()]);
    setTransactions(t);
    setMembers(m);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta transação?')) return;
    await deleteTransaction(id);
    load();
  };

  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    const q = search.toLowerCase();
    return !q || t.category.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (t.family_member_name || '').toLowerCase().includes(q);
  });

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Transações</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie entradas e saídas</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> Nova
        </button>
      </div>

      {/* Summary mini */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card flex items-center justify-between">
          <span className="text-slate-400 text-sm">Entradas filtradas</span>
          <span className="text-brand-400 font-bold">{fmt(totalIncome)}</span>
        </div>
        <div className="card flex items-center justify-between">
          <span className="text-slate-400 text-sm">Saídas filtradas</span>
          <span className="text-red-400 font-bold">{fmt(totalExpense)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input pl-9" placeholder="Buscar por categoria, descrição..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-surface-card border border-surface-border rounded-xl p-1">
          {(['all','income','expense'] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === t
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-slate-400 hover:text-white'
              }`}>
              {t === 'all' ? 'Todos' : t === 'income' ? 'Entradas' : 'Saídas'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <Filter className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Descrição</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Categoria</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Familiar</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Valor</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-surface-border/20 transition-colors group">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {format(new Date(t.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200">{t.description || '—'}</span>
                        {!!t.is_unnecessary && (
                          <span className="badge-unnecessary">⚠ Desnecessário</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={t.type === 'income' ? 'badge-income' : 'badge-expense'}>
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {t.family_member_name || '—'}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                      t.type === 'income' ? 'text-brand-400' : 'text-red-400'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditing(t); setModal(true); }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-border rounded-lg transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <TransactionModal
          editing={editing}
          members={members}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); load(); }}
        />
      )}
    </div>
  );
}
