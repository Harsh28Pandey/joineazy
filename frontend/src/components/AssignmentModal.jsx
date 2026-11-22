import React, { useState, useEffect } from 'react';
import { X, BookOpen, AlertCircle, Save, Plus } from 'lucide-react';
import api from '../api/client';

const AssignmentModal = ({ isOpen, onClose, assignment = null, onSaved }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [onedriveLink, setOnedriveLink] = useState('');
  const [targetType, setTargetType] = useState('ALL');
  const [targetGroupIds, setTargetGroupIds] = useState([]);

  const [availableGroups, setAvailableGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch groups to allow specific group assignment
  useEffect(() => {
    if (!isOpen) return;

    const fetchGroups = async () => {
      try {
        const res = await api.get('/groups?all=true');
        if (res.data.success) {
          setAvailableGroups(res.data.groups);
        }
      } catch (err) {
        console.error('Failed to load groups:', err);
      }
    };

    fetchGroups();

    if (assignment) {
      setTitle(assignment.title || '');
      setDescription(assignment.description || '');
      // Format datetime-local input
      if (assignment.due_date) {
        const d = new Date(assignment.due_date);
        const pad = (n) => String(n).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDueDate(formatted);
      } else {
        setDueDate('');
      }
      setOnedriveLink(assignment.onedrive_link || '');
      setTargetType(assignment.target_type || 'ALL');
      setTargetGroupIds(assignment.target_groups?.map((g) => g.id) || []);
    } else {
      // Default due date: 7 days from now
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const pad = (n) => String(n).padStart(2, '0');
      const formatted = `${in7Days.getFullYear()}-${pad(in7Days.getMonth() + 1)}-${pad(in7Days.getDate())}T18:00`;
      setDueDate(formatted);
      setTitle('');
      setDescription('');
      setOnedriveLink('https://onedrive.live.com/?cid=joineazy-assignment-folder');
      setTargetType('ALL');
      setTargetGroupIds([]);
    }
  }, [isOpen, assignment]);

  if (!isOpen) return null;

  const toggleGroupSelection = (groupId) => {
    setTargetGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !dueDate || !onedriveLink.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (targetType === 'SPECIFIC_GROUPS' && targetGroupIds.length === 0) {
      setError('Please select at least one specific group.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      title: title.trim(),
      description: description.trim(),
      dueDate: new Date(dueDate).toISOString(),
      onedriveLink: onedriveLink.trim(),
      targetType,
      targetGroupIds
    };

    try {
      let res;
      if (assignment) {
        res = await api.put(`/assignments/${assignment.id}`, payload);
      } else {
        res = await api.post('/assignments', payload);
      }

      if (res.data.success) {
        if (onSaved) onSaved();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save assignment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {assignment ? 'Edit Assignment' : 'Post New Assignment'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-grow">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Task 1: Cloud Architecture Design"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Detailed Description & Objectives *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline deliverables, technical guidelines, criteria, and expectations..."
              rows={4}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Submission Due Date *
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Target Audience *
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Students & Groups</option>
                <option value="SPECIFIC_GROUPS">Specific Groups Only</option>
              </select>
            </div>
          </div>

          {/* Specific groups selector */}
          {targetType === 'SPECIFIC_GROUPS' && (
            <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-purple-900">
                Select Targeted Groups:
              </label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableGroups.length === 0 ? (
                  <div className="text-xs text-slate-500">No student groups created yet.</div>
                ) : (
                  availableGroups.map((g) => (
                    <label
                      key={g.id}
                      className="flex items-center space-x-2 text-xs text-slate-700 hover:bg-white p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={targetGroupIds.includes(g.id)}
                        onChange={() => toggleGroupSelection(g.id)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-medium">{g.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              OneDrive Submission Folder Link *
            </label>
            <input
              type="url"
              value={onedriveLink}
              onChange={(e) => setOnedriveLink(e.target.value)}
              placeholder="https://onedrive.live.com/?cid=..."
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Students will click this link to upload their external submissions to your OneDrive folder.
            </p>
          </div>

          <div className="pt-3 flex justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : assignment ? 'Save Changes' : 'Publish Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentModal;
