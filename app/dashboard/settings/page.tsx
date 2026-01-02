'use client';

import { useState, useEffect } from 'react';

interface Theme {
  id: string;
  name: string;
  description: string | null;
  color: string;
  tweetCount: number;
}

export default function SettingsPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTheme, setNewTheme] = useState({ name: '', description: '', color: '#6366f1' });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', color: '' });

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const res = await fetch('/api/themes');
      const data = await res.json();
      setThemes(data.themes || []);
    } catch (error) {
      console.error('Error loading themes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTheme.name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTheme),
      });

      if (res.ok) {
        setNewTheme({ name: '', description: '', color: '#6366f1' });
        loadThemes();
      }
    } catch (error) {
      console.error('Error creating theme:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (theme: Theme) => {
    setEditingId(theme.id);
    setEditForm({
      name: theme.name,
      description: theme.description || '',
      color: theme.color,
    });
  };

  const handleUpdate = async (id: string) => {
    try {
      await fetch(`/api/themes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      setEditingId(null);
      loadThemes();
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete theme "${name}"? Tweets will become unclassified.`)) return;

    try {
      await fetch(`/api/themes/${id}`, { method: 'DELETE' });
      loadThemes();
    } catch (error) {
      console.error('Error deleting theme:', error);
    }
  };

  const colors = [
    '#6366f1', '#A300D9', '#00D9A3', '#f59e0b', '#ef4444',
    '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Create Theme */}
      <div className="bg-[#141414] border border-[#27272a] rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Create Theme</h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#a1a1aa] mb-2">Name</label>
              <input
                type="text"
                value={newTheme.name}
                onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                placeholder="Theme name"
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#A300D9]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#a1a1aa] mb-2">Color</label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTheme({ ...newTheme, color })}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      newTheme.color === color ? 'scale-110 ring-2 ring-white' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#a1a1aa] mb-2">Description (optional)</label>
            <input
              type="text"
              value={newTheme.description}
              onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
              placeholder="Theme description"
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#A300D9]"
            />
          </div>

          <button
            type="submit"
            disabled={creating || !newTheme.name.trim()}
            className="px-6 py-2 bg-[#A300D9] text-white rounded-lg font-medium hover:bg-[#8a00b8] transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Theme'}
          </button>
        </form>
      </div>

      {/* Theme List */}
      <div className="bg-[#141414] border border-[#27272a] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Manage Themes</h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-[#A300D9] border-t-transparent rounded-full" />
          </div>
        ) : themes.length === 0 ? (
          <p className="text-[#a1a1aa] text-center py-8">No themes yet</p>
        ) : (
          <div className="space-y-3">
            {themes.map(theme => (
              <div
                key={theme.id}
                className="flex items-center gap-4 p-4 bg-[#0a0a0a] rounded-lg"
              >
                {editingId === theme.id ? (
                  <>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="flex-1 px-3 py-1 bg-[#141414] border border-[#27272a] rounded text-white"
                    />
                    <div className="flex gap-1">
                      {colors.slice(0, 5).map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, color })}
                          className={`w-6 h-6 rounded-full ${
                            editForm.color === color ? 'ring-2 ring-white' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => handleUpdate(theme.id)}
                      className="px-3 py-1 bg-[#00D9A3] text-black rounded text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-[#27272a] rounded text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: theme.color }}
                    />
                    <span className="flex-1 font-medium">{theme.name}</span>
                    <span className="text-[#a1a1aa] text-sm">
                      {theme.tweetCount} tweets
                    </span>
                    <button
                      onClick={() => handleEdit(theme)}
                      className="px-3 py-1 bg-[#27272a] rounded text-sm hover:bg-[#3f3f46] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(theme.id, theme.name)}
                      className="px-3 py-1 bg-red-500/10 text-red-500 rounded text-sm hover:bg-red-500/20 transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
