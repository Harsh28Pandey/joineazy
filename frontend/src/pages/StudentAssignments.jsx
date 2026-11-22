import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  FileText
} from 'lucide-react';
import api from '../api/client';
import Badge from '../components/Badge';
import TwoStepSubmissionModal from '../components/TwoStepSubmissionModal';

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PENDING, CONFIRMED, OVERDUE
  const [searchQuery, setSearchQuery] = useState('');

  // Two-step submission modal
  const [activeAssignment, setActiveAssignment] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [asgRes, groupsRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/groups')
      ]);

      if (asgRes.data.success) {
        setAssignments(asgRes.data.assignments);
      }
      if (groupsRes.data.success) {
        setGroups(groupsRes.data.groups);
      }
    } catch (err) {
      setError('Failed to fetch assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUndo = async (assignmentId, groupId) => {
    if (!window.confirm('Are you sure you want to reset this submission confirmation?')) {
      return;
    }

    try {
      const res = await api.delete(`/submissions/${assignmentId}/${groupId}`);
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset submission.');
    }
  };

  // Filter assignments
  const filteredAssignments = assignments.filter((asg) => {
    // Status filter
    if (filterStatus === 'CONFIRMED' && !asg.is_submitted) return false;
    if (filterStatus === 'PENDING' && (asg.is_submitted || asg.is_overdue)) return false;
    if (filterStatus === 'OVERDUE' && (!asg.is_overdue || asg.is_submitted)) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = asg.title?.toLowerCase().includes(q);
      const matchDesc = asg.description?.toLowerCase().includes(q);
      return matchTitle || matchDesc;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>Course Assignments</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access OneDrive submission links and complete your assignments with two-step verification.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'PENDING'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Pending ({assignments.filter((a) => !a.is_submitted && !a.is_overdue).length})
          </button>
          <button
            onClick={() => setFilterStatus('CONFIRMED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'CONFIRMED'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Submitted ({assignments.filter((a) => a.is_submitted).length})
          </button>
          <button
            onClick={() => setFilterStatus('OVERDUE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'OVERDUE'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Overdue ({assignments.filter((a) => a.is_overdue && !a.is_submitted).length})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search assignments by title or description keywords..."
          className="w-full bg-white rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading assignments...</div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 text-xs space-y-2">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-600">No assignments match your filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAssignments.map((asg) => {
            const hasSubmitted = asg.is_submitted;
            const primarySubmission = asg.my_submissions?.[0];

            return (
              <div
                key={asg.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                  hasSubmitted
                    ? 'border-emerald-200 ring-1 ring-emerald-500/10'
                    : asg.is_overdue
                    ? 'border-rose-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="p-6 space-y-4">
                  {/* Title & Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{asg.title}</h2>
                        <Badge
                          variant={
                            hasSubmitted
                              ? 'confirmed'
                              : asg.is_overdue
                              ? 'overdue'
                              : 'pending'
                          }
                        >
                          {hasSubmitted ? 'Submitted' : asg.is_overdue ? 'Overdue' : 'Pending Submission'}
                        </Badge>
                        <Badge variant="default">
                          Target: {asg.target_type === 'ALL' ? 'All Students' : 'Specific Groups'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        Posted by {asg.professor_name || 'Professor'}
                      </p>
                    </div>

                    <div className="text-left sm:text-right flex-shrink-0">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                        Due Date
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          asg.is_overdue && !hasSubmitted ? 'text-rose-600' : 'text-slate-800'
                        }`}
                      >
                        {new Date(asg.due_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                    {asg.description}
                  </p>

                  {/* Confirmed Receipt Box (if submitted) */}
                  {hasSubmitted && primarySubmission && (
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Submission Receipt Confirmed</span>
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          {new Date(primarySubmission.confirmed_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-800">
                        Confirmed on behalf of <strong>{primarySubmission.group_name}</strong> by{' '}
                        <strong>{primarySubmission.confirmed_by_name || 'You'}</strong>.
                      </div>
                      {primarySubmission.submission_notes && (
                        <div className="text-[11px] text-emerald-700 italic mt-1">
                          "{primarySubmission.submission_notes}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    {/* OneDrive Link Button */}
                    <a
                      href={asg.onedrive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-xl transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      <span>Access OneDrive Submission Folder</span>
                    </a>

                    <div className="flex items-center space-x-2">
                      {hasSubmitted ? (
                        <button
                          onClick={() => handleUndo(asg.id, primarySubmission.group_id)}
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-rose-600 px-3 py-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Undo confirmation"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Undo Submission</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveAssignment(asg)}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs hover:shadow transition-all"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Confirm Submission (2-Step Verification)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Two-Step Verification Modal */}
      {activeAssignment && (
        <TwoStepSubmissionModal
          isOpen={!!activeAssignment}
          onClose={() => setActiveAssignment(null)}
          assignment={activeAssignment}
          userGroups={groups}
          onSubmissionSuccess={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default StudentAssignments;
