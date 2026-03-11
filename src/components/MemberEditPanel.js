'use client';

import { useEffect, useMemo, useState } from 'react';

const emptyForm = {
  firstName: '',
  lastName: '',
  born: '',
  died: '',
  location: '',
  city: '',
  country: '',
  phone: '',
  email: '',
  photo: '',
  role: '',
  notes: '',
  branch: '',
  generation: 0,
  isComplete: false,
};

export default function MemberEditPanel({ refreshTrigger = 0, onMemberUpdated }) {
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchMembers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setMembers(list);
      if (selectedId) {
        const selected = list.find((m) => m.id === selectedId);
        if (selected) {
          setFormData({
            ...emptyForm,
            ...selected,
            generation: selected.generation ?? 0,
            isComplete: Boolean(selected.isComplete),
          });
        } else {
          setSelectedId(null);
          setFormData(emptyForm);
        }
      }
    } catch (err) {
      setError('Failed to load members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const fullName = `${m.firstName || ''} ${m.lastName || ''}`.trim().toLowerCase();
      const location = `${m.location || ''} ${m.city || ''}`.trim().toLowerCase();
      return fullName.includes(q) || location.includes(q) || (m.email || '').toLowerCase().includes(q);
    });
  }, [members, query]);

  const selectMember = (member) => {
    setSelectedId(member.id);
    setFormData({
      ...emptyForm,
      ...member,
      generation: member.generation ?? 0,
      isComplete: Boolean(member.isComplete),
    });
    setMessage('');
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'generation' ? Number(value) : value,
    }));
  };

  const saveChanges = async () => {
    if (!selectedId) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        ...formData,
        generation: Number.isFinite(formData.generation) ? formData.generation : 0,
      };
      const res = await fetch(`/api/members/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update member');
      }
      setMessage('Member updated successfully.');
      await fetchMembers();
      if (onMemberUpdated) onMemberUpdated();
    } catch (err) {
      setError(err.message || 'Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-200 dark:border-zinc-700">
      <div className="flex flex-col gap-2 mb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Existing Members</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Select a member, update fields, and save.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, location..."
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="max-h-[440px] overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
            {loading ? (
              <div className="p-4 text-sm text-zinc-500">Loading members...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-4 text-sm text-zinc-500">No members found.</div>
            ) : (
              filteredMembers.map((m) => {
                const isActive = selectedId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectMember(m)}
                    className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                        : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {m.firstName} {m.lastName}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Gen {m.generation ?? 0} • {m.location || m.city || 'No location'}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          {!selectedId ? (
            <div className="h-full min-h-[220px] flex items-center justify-center text-sm text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
              Select a member from the left panel.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                <Input label="Born" name="born" value={formData.born || ''} onChange={handleChange} />
                <Input label="Died" name="died" value={formData.died || ''} onChange={handleChange} />
                <Input label="Location" name="location" value={formData.location || ''} onChange={handleChange} />
                <Input label="City" name="city" value={formData.city || ''} onChange={handleChange} />
                <Input label="Country" name="country" value={formData.country || ''} onChange={handleChange} />
                <Input label="Branch" name="branch" value={formData.branch || ''} onChange={handleChange} />
                <Input label="Email" name="email" value={formData.email || ''} onChange={handleChange} />
                <Input label="Phone" name="phone" value={formData.phone || ''} onChange={handleChange} />
                <Input label="Role" name="role" value={formData.role || ''} onChange={handleChange} />
                <Input label="Photo URL" name="photo" value={formData.photo || ''} onChange={handleChange} />
                <Input
                  label="Generation"
                  name="generation"
                  type="number"
                  value={formData.generation ?? 0}
                  onChange={handleChange}
                />
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Status</label>
                  <select
                    value={formData.isComplete ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isComplete: e.target.value === 'true' }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="true">Complete</option>
                    <option value="false">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {message && <div className="text-sm text-green-600 dark:text-green-400">{message}</div>}
              {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

              <button
                type="button"
                onClick={saveChanges}
                disabled={saving}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Member Changes'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs text-zinc-500 mb-1">{label}</label>
      <input
        {...props}
        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
