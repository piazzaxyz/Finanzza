import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Flame
} from 'lucide-react';
import { fetchSummary } from '../api/transactions';
import { TransactionSummary } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#ef4444','#f97316'];

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

function StatCard({
  label, value, icon: Icon, color, sub
}: { label: string; value: string; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-3 text-xs shadow-xl">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.name === 'income' ? '#22c55e' : '#ef4444' }}>
          {p.name === 'income' ? 'Entradas' : 'Saídas'}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const totals = summary?.totals;
  const byMonth = summary?.byMonth ?? [];
  const byCategory = (summary?.byCategory ?? []).filter(c => c.type === 'expense').slice(0, 6);
  const unnecessaryTotal = totals?.unnecessary_total ?? 0;
  const topExpense = byCategory[0];

  const monthLabel = (m: string) => {
    try {
      const [y, mo] = m.split('-');
      return format(new Date(Number(y), Number(mo) - 1, 1), 'MMM', { locale: ptBR });
    } catch { return m; }
  };

  const chartData = byMonth.map(m => ({
    name: monthLabel(m.month),
    income: m.income,
    expense: m.expense,
  }));

  const pieData = byCategory.map((c, i) => ({
    name: c.category,
    value: c.total,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Visão Geral</h1>
        <p className="text-slate-400 text-sm mt-1">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Saldo Total"
          value={fmt(totals?.balance ?? 0)}
          icon={Wallet}
          color="bg-brand-600/20 text-brand-400"
          sub="Entradas - Saídas"
        />
        <StatCard
          label="Total Recebido"
          value={fmt(totals?.total_income ?? 0)}
          icon={TrendingUp}
          color="bg-blue-500/20 text-blue-400"
          sub="Todas as entradas"
        />
        <StatCard
          label="Total Gasto"
          value={fmt(totals?.total_expense ?? 0)}
          icon={TrendingDown}
          color="bg-red-500/20 text-red-400"
          sub="Todas as saídas"
        />
        <StatCard
          label="Gastos Desnecessários"
          value={fmt(unnecessaryTotal)}
          icon={AlertTriangle}
          color="bg-orange-500/20 text-orange-400"
          sub="Marcados como desnecessário"
        />
      </div>

      {/* Alert: unnecessary spending */}
      {unnecessaryTotal > 0 && (
        <div className="card border-orange-500/30 bg-orange-500/5 flex items-start gap-3">
          <Flame className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-orange-300 font-semibold text-sm">Atenção: Gastos Desnecessários</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Foram identificados <strong className="text-orange-400">{fmt(unnecessaryTotal)}</strong> em gastos marcados como desnecessários.
              {topExpense && ` A categoria com mais gastos é "${topExpense.category}" (${fmt(topExpense.total)}).`}
            </p>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Monthly flow */}
        <div className="card xl:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">Fluxo de Caixa Mensal</h3>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
              Sem dados ainda. Adicione transações.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fill="url(#gIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#gExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category pie */}
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Gastos por Categoria</h3>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Sem despesas ainda</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-400">{value}</span>}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bar chart: monthly comparison */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Comparativo Mensal — Entradas x Saídas</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" name="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top categories */}
      {byCategory.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Análise por Categoria</h3>
          <div className="space-y-3">
            {byCategory.map((cat, i) => {
              const max = byCategory[0]?.total ?? 1;
              const pct = Math.round((cat.total / max) * 100);
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{cat.count}x</span>
                        <span className="text-sm font-semibold text-red-400">{fmt(cat.total)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                  {i === 0 && <ArrowUpRight className="w-4 h-4 text-red-400 shrink-0" />}
                  {i === byCategory.length - 1 && byCategory.length > 1 && (
                    <ArrowDownRight className="w-4 h-4 text-brand-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
