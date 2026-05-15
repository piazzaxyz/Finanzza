import api from './client';
import { Transaction, TransactionSummary } from '../types';

export const fetchTransactions = () => api.get<Transaction[]>('/transactions').then(r => r.data);
export const fetchSummary = () => api.get<TransactionSummary>('/transactions/summary').then(r => r.data);

export const createTransaction = (data: Omit<Transaction, 'id' | 'created_at' | 'family_member_name' | 'family_member_relation'>) =>
  api.post<Transaction>('/transactions', data).then(r => r.data);

export const updateTransaction = (id: number, data: Partial<Transaction>) =>
  api.put<Transaction>(`/transactions/${id}`, data).then(r => r.data);

export const deleteTransaction = (id: number) =>
  api.delete(`/transactions/${id}`).then(r => r.data);
