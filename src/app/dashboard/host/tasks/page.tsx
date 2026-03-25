'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useDropdown } from '@/hooks/useDropdown';
import { CheckSquare, Square, Pencil, Trash2, Plus, Loader2, ClipboardList, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

type Task = {
  id: string;
  propertyId: string;
  title: string;
  done: boolean;
  createdAt: string;
};

type Filter = 'all' | 'active' | 'done';

export default function TasksPage() {
  const lang = useLang();
  const t = dashboardT[lang].tasks;

  const [properties, setProperties] = useState<{ id: string; title: string }[]>([]);
  const [selectedPropId, setSelectedPropId] = useState('');
  const { open: propOpen, setOpen: setPropOpen, ref: propDropdownRef } = useDropdown();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Add task
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  // Confirm modal: { message, onConfirm } | null
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetch('/api/host/properties')
      .then(r => r.json())
      .then(d => {
        const props = d.properties || [];
        setProperties(props);
        if (props.length > 0) setSelectedPropId(props[0].id);
        setInitialLoad(true);
      });
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!selectedPropId) return;
    setLoading(true);
    try {
      const data = await fetch(`/api/host/tasks?propertyId=${selectedPropId}`).then(r => r.json());
      setTasks(data.tasks || []);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [selectedPropId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async () => {
    const title = newTitle.trim();
    if (!title || !selectedPropId) return;
    setAdding(true);
    try {
      const data = await fetch('/api/host/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selectedPropId, title }),
      }).then(r => r.json());
      setTasks(prev => [...prev, data.task]);
      setNewTitle('');
      addInputRef.current?.focus();
    } finally {
      setAdding(false);
    }
  };

  const toggleDone = async (task: Task) => {
    setSaving(task.id);
    try {
      const data = await fetch(`/api/host/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !task.done }),
      }).then(r => r.json());
      setTasks(prev => prev.map(t => t.id === task.id ? data.task : t));
    } finally {
      setSaving(null);
    }
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = async (id: string) => {
    const title = editTitle.trim();
    if (!title) { setEditingId(null); return; }
    setSaving(id);
    try {
      const data = await fetch(`/api/host/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      }).then(r => r.json());
      setTasks(prev => prev.map(t => t.id === id ? data.task : t));
      setEditingId(null);
    } finally {
      setSaving(null);
    }
  };

  const deleteTask = (id: string) => {
    setConfirmModal({
      message: t.deleteConfirm,
      onConfirm: async () => {
        setSaving(id);
        try {
          await fetch(`/api/host/tasks/${id}`, { method: 'DELETE' });
          setTasks(prev => prev.filter(t => t.id !== id));
        } finally {
          setSaving(null);
        }
      },
    });
  };

  const clearCompleted = () => {
    const doneTasks = tasks.filter(t => t.done);
    if (doneTasks.length === 0) return;
    setConfirmModal({
      message: t.clearCompletedConfirm(doneTasks.length),
      onConfirm: async () => {
        try {
          await Promise.all(doneTasks.map(t => fetch(`/api/host/tasks/${t.id}`, { method: 'DELETE' })));
          setTasks(prev => prev.filter(t => !t.done));
        } catch (err) {
          console.error('clearCompleted', err);
        }
      },
    });
  };

  const runConfirm = async () => {
    if (!confirmModal) return;
    setConfirming(true);
    try {
      await confirmModal.onConfirm();
    } finally {
      setConfirming(false);
      setConfirmModal(null);
    }
  };

  const doneCount = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const visible = tasks.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
        </div>
      </div>

      {/* Property selector dropdown */}
      {properties.length > 0 && (
        <div className="mb-5 relative w-fit" ref={propDropdownRef}>
          <button
            onClick={() => setPropOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition shadow-sm min-w-[200px]"
          >
            <span className="flex-1 text-left truncate">
              {properties.find(p => p.id === selectedPropId)?.title ?? t.selectProperty}
            </span>
            {propOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {propOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 min-w-full w-64">
              {properties.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setTasks([]); setInitialLoad(true); setSelectedPropId(p.id); setPropOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 truncate ${
                    selectedPropId === p.id ? 'text-primary-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedPropId ? (
        <div className="card text-center py-16">
          <ClipboardList size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t.selectProperty}</p>
        </div>
      ) : (
        <div className="card">
          {/* Add task input */}
          <form
            onSubmit={e => { e.preventDefault(); addTask(); }}
            className="flex gap-2 mb-5"
          >
            <input
              ref={addInputRef}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder={t.addPlaceholder}
              className="input flex-1"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newTitle.trim() || adding}
              className="btn-primary flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
            >
              {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {t.add}
            </button>
          </form>

          {/* Progress */}
          {total > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">{t.progress(doneCount, total)}</span>
                <span className="text-sm font-semibold text-primary-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {doneCount === total && total > 0 && (
                <p className="text-sm text-green-600 font-medium mt-2 text-center">🎉 {t.allDone}</p>
              )}
            </div>
          )}

          {/* Filter tabs + clear completed */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex gap-1">
              {(['all', 'active', 'done'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? t.filterAll : f === 'active' ? t.filterActive : t.filterDone}
                  {f === 'all' && total > 0 && (
                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === 'all' ? 'bg-white/20' : 'bg-gray-200'}`}>
                      {total}
                    </span>
                  )}
                  {f === 'active' && (
                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === 'active' ? 'bg-white/20' : 'bg-gray-200'}`}>
                      {total - doneCount}
                    </span>
                  )}
                  {f === 'done' && doneCount > 0 && (
                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === 'done' ? 'bg-white/20' : 'bg-gray-200'}`}>
                      {doneCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {doneCount > 0 && (
              <button
                onClick={clearCompleted}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition flex-shrink-0"
              >
                {t.clearCompleted}
              </button>
            )}
          </div>

          {/* Task list */}
          {loading && initialLoad ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-12 bg-gray-100 rounded-lg" />)}
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-10">
              <ClipboardList size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">{total === 0 ? t.noTasks : t.addFirst}</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {visible.map(task => (
                <li
                  key={task.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition group ${
                    task.done ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleDone(task)}
                    disabled={saving === task.id}
                    className="flex-shrink-0 text-gray-400 hover:text-primary-600 transition disabled:opacity-50"
                    title={task.done ? 'Mark as active' : 'Mark as done'}
                  >
                    {saving === task.id ? (
                      <Loader2 size={20} className="animate-spin text-primary-500" />
                    ) : task.done ? (
                      <CheckSquare size={20} className="text-green-500" />
                    ) : (
                      <Square size={20} />
                    )}
                  </button>

                  {/* Title — inline edit or display */}
                  {editingId === task.id ? (
                    <form
                      onSubmit={e => { e.preventDefault(); saveEdit(task.id); }}
                      className="flex-1 flex gap-2"
                    >
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="input flex-1 py-1 text-sm"
                        placeholder={t.editPlaceholder}
                        maxLength={500}
                      />
                      <button type="submit" disabled={saving === task.id} className="btn-primary py-1 px-3 text-sm disabled:opacity-50">
                        {t.save}
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">
                        {t.cancel}
                      </button>
                    </form>
                  ) : (
                    <span className={`flex-1 text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {task.title}
                    </span>
                  )}

                  {/* Actions (visible on hover or when not editing) */}
                  {editingId !== task.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                      <button
                        onClick={() => startEdit(task)}
                        className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-primary-600 transition"
                        title={lang === 'ro' ? 'Editează' : 'Edit'}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        disabled={saving === task.id}
                        className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                        title={t.delete}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {/* Confirm modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h2 className="font-semibold text-base">{lang === 'ro' ? 'Confirmare' : 'Confirm'}</h2>
              <button onClick={() => setConfirmModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-700">{confirmModal.message}</p>
            </div>
            <div className="flex gap-2 px-5 pb-5 justify-end">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                {lang === 'ro' ? 'Anulează' : 'Cancel'}
              </button>
              <button
                onClick={runConfirm}
                disabled={confirming}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-1.5"
              >
                {confirming && <Loader2 size={13} className="animate-spin" />}
                {lang === 'ro' ? 'Șterge' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
