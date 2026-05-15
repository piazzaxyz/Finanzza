import { useEffect, useState, FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, StickyNote, Save } from 'lucide-react';
import { Note } from '../types';
import { fetchNotes, createNote, updateNote, deleteNote } from '../api/notes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const today = () => new Date().toISOString().split('T')[0];

interface NoteModalProps {
  editing: Note | null;
  onClose: () => void;
  onSaved: () => void;
}

function NoteModal({ editing, onClose, onSaved }: NoteModalProps) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [content, setContent] = useState(editing?.content ?? '');
  const [date, setDate] = useState(editing?.date ?? today());
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateNote(editing.id, { title, content, date });
      } else {
        await createNote({ title, content, date });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-brand-400" />
            {editing ? 'Editar Anotação' : 'Nova Anotação'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Título</label>
            <input className="input" type="text" placeholder="Ex: Contas de Maio"
              value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="label">Data</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Conteúdo</label>
            <textarea
              className="input resize-none"
              rows={6}
              placeholder="Escreva seus lembretes financeiros aqui..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const NOTE_COLORS = [
  'border-brand-600/40 bg-brand-600/5',
  'border-blue-500/40 bg-blue-500/5',
  'border-purple-500/40 bg-purple-500/5',
  'border-orange-500/40 bg-orange-500/5',
  'border-pink-500/40 bg-pink-500/5',
  'border-yellow-500/40 bg-yellow-500/5',
];

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = async () => {
    const n = await fetchNotes();
    setNotes(n);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta anotação?')) return;
    await deleteNote(id);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Anotações</h1>
          <p className="text-slate-400 text-sm mt-1">Lembretes e notas financeiras da família</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> Nova Nota
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-48 text-slate-500 gap-3">
          <StickyNote className="w-10 h-10 opacity-30" />
          <p className="text-sm">Nenhuma anotação ainda</p>
          <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary text-xs">
            <Plus className="w-3 h-3" /> Criar primeira nota
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {notes.map((note, i) => {
            const isExpanded = expanded === note.id;
            const colorClass = NOTE_COLORS[i % NOTE_COLORS.length];
            return (
              <div
                key={note.id}
                className={`card border ${colorClass} cursor-pointer hover:scale-[1.01] transition-all duration-150`}
                onClick={() => setExpanded(isExpanded ? null : note.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <StickyNote className="w-4 h-4 text-brand-400 shrink-0" />
                    <h3 className="text-sm font-semibold text-white truncate">{note.title}</h3>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { setEditing(note); setModal(true); }}
                      className="p-1 text-slate-500 hover:text-white hover:bg-surface-border rounded-lg transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-3">
                  {format(new Date(note.date + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>

                {note.content ? (
                  <p className={`text-sm text-slate-300 leading-relaxed whitespace-pre-wrap ${
                    isExpanded ? '' : 'line-clamp-3'
                  }`}>
                    {note.content}
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 italic">Sem conteúdo</p>
                )}

                {note.content && note.content.length > 150 && (
                  <p className="text-xs text-brand-400 mt-2">
                    {isExpanded ? '▲ Mostrar menos' : '▼ Mostrar mais'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <NoteModal
          editing={editing}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); load(); }}
        />
      )}
    </div>
  );
}
