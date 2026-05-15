import api from './client';
import { Note } from '../types';

export const fetchNotes = () => api.get<Note[]>('/notes').then(r => r.data);
export const createNote = (data: { title: string; content?: string; date?: string }) =>
  api.post<Note>('/notes', data).then(r => r.data);
export const updateNote = (id: number, data: { title: string; content?: string; date?: string }) =>
  api.put<Note>(`/notes/${id}`, data).then(r => r.data);
export const deleteNote = (id: number) =>
  api.delete(`/notes/${id}`).then(r => r.data);
