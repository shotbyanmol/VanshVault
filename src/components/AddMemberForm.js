'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, MapPin, UserPlus, Check, Users, Link as LinkIcon } from 'lucide-react';

export default function AddMemberForm({ onMemberAdded }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    born: '',
    gender: 'Male',
    city: '',
  });
  
  // Relationship State
  const [isRoot, setIsRoot] = useState(false);
  const [existingMembers, setExistingMembers] = useState([]);
  const [selectedRelative, setSelectedRelative] = useState('');
  const [relationType, setRelationType] = useState('PARENT_OF');

  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  // Fetch existing members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch('/api/members');
        if (res.ok) {
          const data = await res.json();
          const members = Array.isArray(data) ? data : (data.members || []);
          setExistingMembers(members);
          
          // Auto-check root if no members exist
          if (members.length === 0) {
            setIsRoot(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch members:', err);
      }
    };
    
    fetchMembers();
  }, [status]); // Re-fetch when connection status updates (after successful add)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        born: formData.born || '',
        city: formData.city || '',
        location: formData.city || '',
        gender: formData.gender,
      };
      if (!isRoot && selectedRelative) {
        if (relationType === 'PARENT_OF') payload.parentId = selectedRelative;
        if (relationType === 'MARRIED_TO') payload.spouseId = selectedRelative;
      }

      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create member');

      setStatus('success');
      setMessage(`Member ${formData.firstName} ${formData.lastName} added successfully!`);
      
      // Reset form
      setFormData({ firstName: '', lastName: '', born: '', gender: 'Male', city: '' });
      setSelectedRelative('');
      setRelationType('PARENT_OF');
      
      if (onMemberAdded) onMemberAdded();
      
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700"
    >
      <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white flex items-center gap-2">
        <UserPlus className="w-6 h-6 text-indigo-500" />
        Add Family Member
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Connection Type Toggle */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <input
            type="checkbox"
            id="isRoot"
            checked={isRoot}
            onChange={(e) => setIsRoot(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
            disabled={existingMembers.length === 0} // Force root if empty (handled by effect but good UI safety)
          />
          <label htmlFor="isRoot" className="text-sm text-zinc-700 dark:text-zinc-300 select-none">
            This is a <strong>Root Ancestor</strong> (No connections)
          </label>
        </div>

        {/* Relationship Fields (Only if not root) */}
        {!isRoot && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
             {/* Select Relative */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Related To (Existing Member)
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <select
                  required={!isRoot}
                  value={selectedRelative}
                  onChange={(e) => setSelectedRelative(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                >
                  <option value="" disabled>Select a relative...</option>
                  {existingMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Relationship Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Relationship Type
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <select
                  required={!isRoot}
                  value={relationType}
                  onChange={(e) => setRelationType(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                >
                  <option value="PARENT_OF">Is the Parent of the new member</option>
                  <option value="MARRIED_TO">Is the Spouse of the new member</option>
                </select>
              </div>
              <p className="text-xs text-zinc-500 mt-1 italic">
                {selectedRelative && `${existingMembers.find(m => m.id === selectedRelative)?.firstName || ''} ${existingMembers.find(m => m.id === selectedRelative)?.lastName || ''}`.trim()}
                {' -> '}
                {relationType === 'PARENT_OF' ? 'PARENT OF' : 'MARRIED TO'}
                {' -> '}
                [New Member]
              </p>
            </div>
          </motion.div>
        )}

        <div className="border-t border-zinc-200 dark:border-zinc-700 my-4"></div>

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            First Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              placeholder="e.g. Vansh"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Last Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleChange}
              placeholder="e.g. Gupta"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Birth Year / Date */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Birth Year / Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              name="born"
              value={formData.born}
              onChange={handleChange}
              placeholder="e.g. 1990"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Gender
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            City
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              name="city"
              required
              value={formData.city}
              onChange={handleChange}
              placeholder="e.g. New Delhi"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`text-sm p-3 rounded-lg ${
              status === 'success'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {message}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {status === 'loading' ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Add Member'
          )}
        </button>
      </form>
    </motion.div>
  );
}
