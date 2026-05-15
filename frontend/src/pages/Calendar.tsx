import { useEffect, useState } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isSameMonth, isToday, isSameDay, addMonths, subMonths, getDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction } from '../types';
import { fetchTransactions } from '../api/transactions';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions().then(setTransactions).finally(() => setLoading(false));
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // pad start
  const startPad = getDay(monthStart);
  const paddedDays = Array(startPad).fill(null).concat(days);

  const txOnDay = (day: Date) =>
    transactions.filter(t => {
      try {
        return isSameDay(new Date(t.date + 'T00:00:00'), day);
      } catch { return false; }
    });

  const selectedTx = selectedDay ? txOnDay(selectedDay) : [];

  const monthTx = transactions.filter(t => {
    try {
      const d = new Date(t.date + 'T00:00:00');
      return isSameMonth(d, currentMonth);
    } catch { return false; }
  });
  const monthIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Calendário</h1>
        <p className="text-slate-400 text-sm mt-1">Visualize transações por data</p>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Entradas do mês</p>
            <p className="text-brand-400 font-bold text-sm">{fmt(monthIncome)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Saídas do mês</p>
            <p className="text-red-400 font-bold text-sm">{fmt(monthExpense)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Calendar grid */}
        <div className="card xl:col-span-2">
          {/* Nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
              className="p-2 text-slate-400 hover:text-white hover:bg-surface-border rounded-xl transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-base font-semibold text-white capitalize">
              {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </h3>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
              className="p-2 text-slate-400 hover:text-white hover:bg-surface-border rounded-xl transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-500 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, i) => {
                if (!day) return <div key={`pad-${i}`} />;
                const dayTx = txOnDay(day);
                const hasIncome = dayTx.some(t => t.type === 'income');
                const hasExpense = dayTx.some(t => t.type === 'expense');
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isCurrentDay = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`
                      relative aspect-square flex flex-col items-center justify-start pt-1 rounded-xl text-xs
                      transition-all duration-150 hover:bg-surface-border
                      ${isSelected ? 'bg-brand-600/30 ring-1 ring-brand-500' : ''}
                      ${isCurrentDay && !isSelected ? 'ring-1 ring-brand-600/50 bg-brand-600/10' : ''}
                    `}
                  >
                    <span className={`font-medium ${
                      isCurrentDay ? 'text-brand-400' :
                      isSameMonth(day, currentMonth) ? 'text-slate-200' : 'text-slate-600'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {dayTx.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {hasIncome && <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />}
                        {hasExpense && <div className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-border text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-400" /> Entrada</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> Saída</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> Hoje</span>
          </div>
        </div>

        {/* Day detail */}
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-3">
            {selectedDay
              ? format(selectedDay, "dd 'de' MMMM", { locale: ptBR })
              : 'Selecione um dia'}
          </h3>

          {!selectedDay ? (
            <div className="text-slate-500 text-xs text-center py-8">
              Clique em um dia no calendário para ver as transações
            </div>
          ) : selectedTx.length === 0 ? (
            <div className="text-slate-500 text-xs text-center py-8">
              Nenhuma transação neste dia
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTx.map(t => (
                <div key={t.id} className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-surface border border-surface-border">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{t.description || t.category}</p>
                    <p className="text-xs text-slate-500">{t.category}</p>
                    {t.family_member_name && (
                      <p className="text-xs text-slate-600">{t.family_member_name}</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${
                    t.type === 'income' ? 'text-brand-400' : 'text-red-400'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-surface-border flex justify-between text-xs">
                <span className="text-slate-500">Total saídas</span>
                <span className="text-red-400 font-semibold">
                  {fmt(selectedTx.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount,0))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
