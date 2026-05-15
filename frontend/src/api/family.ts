import api from './client';
import { FamilyMember } from '../types';

export const fetchFamily = () => api.get<FamilyMember[]>('/family').then(r => r.data);
export const createMember = (data: { name: string; relation: string }) =>
  api.post<FamilyMember>('/family', data).then(r => r.data);
export const updateMember = (id: number, data: { name: string; relation: string }) =>
  api.put<FamilyMember>(`/family/${id}`, data).then(r => r.data);
export const deleteMember = (id: number) =>
  api.delete(`/family/${id}`).then(r => r.data);
