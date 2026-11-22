import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/client';

const AddMemberModal = ({ isOpen, onClose, group, onMemberAdded }) => {
  const [identifier, setIdentifier] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch student suggestions when typing
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`/auth/students?search=${encodeURIComponent(identifier)}`);
        if (res.data.success) {
          // Filter out existing members
          const existingIds = new Set(group?.members?.map((m) => m.id || m.user_id) || []);
          const available = res.data.students.filter((s) => !existingIds.has(s.id));
          setSearchResults(available);
        }
      } catch (err) {
        console.error('Failed to search students:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [identifier, isOpen, group]);

  if (!isOpen || !group) return null;

  const handleAdd = async (targetIdentifier) => {
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post(`/groups/${group.id}/members`, {
        identifier: targetIdentifier
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setIdentifier('');
        if (onMemberAdded) onMemberAdded(res.data.member);
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    handleAdd(identifier.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Add Group Member</h3>
              <p className="text-[11px] text-slate-500">Group: {group.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="p-6 space-y-4">
          <form onSubmit={handleFormSubmit}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Search by Student Email or Student ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="E.g. sara@joineazy.edu or STU-2026-002"
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </form>

          {/* Student Suggestions List */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Available Students {loading && '(Searching...)'}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-100 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
              {searchResults.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  {identifier ? 'No matching available students found.' : 'Type to search students.'}
                </div>
              ) : (
                searchResults.map((stu) => (
                  <div
                    key={stu.id}
                    className="pt-1.5 first:pt-0 flex items-center justify-between p-1.5 hover:bg-white rounded-lg transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{stu.name}</span>
                      <span className="text-[11px] text-slate-500 block">
                        {stu.email} {stu.student_id ? `• ${stu.student_id}` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleAdd(stu.email)}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
