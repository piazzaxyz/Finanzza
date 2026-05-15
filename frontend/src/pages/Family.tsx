import { useEffect, useState, FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, Users, TrendingDown, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { FamilyMember, MemberSummary } from '../types';
import { fetchFamily, createMember, updateMember, deleteMember } from '../api/family';
import { fetchSummary } from '../api/transactions';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ec4899','#8b5cf6','#06b6d4'];

const RELATIONS = [
  'Titular','Cônjuge/Parceiro(a)','Filho(a)','Pai','Mãe',
  'Irmão/Irmã','Avô/Avó','Outro',
];

interface MemberModalProps {
  editing: FamilyMember | null;
  onClose: () => void;
  onSaved: () => void;
}

function MemberModal({ editing, onClose, onSaved }: MemberModalProps) {
  const [name, setName] = useState(editing?.name ?? '');
  const [relation, setRelation] = useState(editing?.relation ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateMember(editing.id, { name, relation });
      } else {
        await createMember({ name, relation });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {editing ? 'Editar Familiar' : 'Adicionar Familiar'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input className="input" type="text" placeholder="Ex: Maria Silva"
              value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Grau de Parentesco</label>
            <select className="input" value={relation} onChange={e => setRelation(e.target.value)} required>
              <option value="">Selecione...</option>
              {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Family() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [memberSummary, setMemberSummary] = useState<MemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<FamilyMember | null>(null);

  const load = async () => {
    const [m, s] = await Promise.all([fetchFamily(), fetchSummary()]);
    setMembers(m);
    setMemberSummary(s.byMember);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este familiar? As transações associadas ficarão sem familiar.')) return;
    await deleteMember(id);
    load();
  };

  const chartData = memberSummary
    .filter(m => m.total_expense > 0 || m.total_income > 0)
    .map((m, i) => ({ name: m.name, expense: m.total_expense, income: m.total_income, color: COLORS[i % COLORS.length] }));

  const topSpender = memberSummary[0];
  const lowestSpender = [...memberSummary].filter(m => m.total_expense > 0).sort((a, b) => a.total_expense - b.total_expense)[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Família</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie membros e analise gastos por pessoa</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {/* Highlight cards */}
      {topSpender && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card flex items-center gap-4 border-red-500/20">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Maior gastador</p>
              <p className="text-white font-semibold">{topSpender.name}</p>
              <p className="text-red-400 text-sm font-bold">{fmt(topSpender.total_expense)}</p>
            </div>
          </div>
          {lowestSpender && lowestSpender.id !== topSpender.id && (
            <div className="card flex items-center gap-4 border-brand-600/20">
              <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Menor gastador</p>
                <p className="text-white font-semibold">{lowestSpender.name}</p>
                <p className="text-brand-400 text-sm font-bold">{fmt(lowestSpender.total_expense)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Gastos por Familiar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number, name: string) => [fmt(v), name === 'expense' ? 'Gastos' : 'Entradas']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="expense" name="expense" radius={[4,4,0,0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Members list */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-surface-border">
          <Users className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-white">{members.length} familiar(es) cadastrado(s)</h3>
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            <Users className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhum familiar cadastrado</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {members.map((m, i) => {
              const stats = memberSummary.find(s => s.id === m.id);
              return (
                <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-border/20 transition-colors group">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] + '33', color: COLORS[i % COLORS.length] }}
                  >
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.relation}</p>
                  </div>
                  {stats && (
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-500">Gastos totais</p>
                      <p className="text-sm font-semibold text-red-400">{fmt(stats.total_expense)}</p>
                    </div>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => { setEditing(m); setModal(true); }}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-border rounded-lg transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed table */}
      {memberSummary.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border">
            <h3 className="text-sm font-semibold text-white">Análise Detalhada</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Familiar</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500">Entradas</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500">Saídas</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500">Transações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {memberSummary.map((m, i) => (
                  <tr key={m.id} className="hover:bg-surface-border/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: COLORS[i % COLORS.length] + '33', color: COLORS[i % COLORS.length] }}>
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-slate-200 font-medium">{m.name}</p>
                          <p className="text-xs text-slate-500">{m.relation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-brand-400 font-medium">{fmt(m.total_income)}</td>
                    <td className="px-5 py-3 text-right text-red-400 font-medium">{fmt(m.total_expense)}</td>
                    <td className="px-5 py-3 text-right text-slate-400">{m.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <MemberModal
          editing={editing}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); load(); }}
        />
      )}
    </div>
  );
}
