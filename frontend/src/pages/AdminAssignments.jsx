import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../api/client';
import Badge from '../components/Badge';
import ProgressBar from '../components/ProgressBar';
import AssignmentModal from '../components/AssignmentModal';

const AdminAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments');
      if (res.data.success) {
        setAssignments(res.data.assignments);
      }
    } catch (err) {
      setError('Failed to fetch assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete assignment "${title}"?`)) return;

    try {
      const res = await api.delete(`/assignments/${id}`);
      if (res.data.success) {
        fetchAssignments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete assignment.');
    }
  };

  const handleOpenEdit = (asg) => {
    setEditingAssignment(asg);
    setShowModal(true);
  };

  const handleOpenCreate = () => {
    setEditingAssignment(null);
    setShowModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            <span>Manage Course Assignments</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, edit, and assign tasks to cohorts or specific student groups with OneDrive submission links.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Assignment</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Assignments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-400 space-y-2">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">No assignments created yet.</p>
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 bg-purple-50 text-purple-700 font-bold rounded-lg text-xs"
            >
              Post First Assignment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Assignment Title & Description</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Target Audience</th>
                  <th className="py-3.5 px-4">Submission Rate</th>
                  <th className="py-3.5 px-4">OneDrive Folder</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((asg) => (
                  <tr key={asg.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 max-w-xs">
                      <span className="font-bold text-slate-900 block text-sm">
                        {asg.title}
                      </span>
                      <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {asg.description}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`font-semibold ${asg.is_overdue ? 'text-rose-600' : 'text-slate-700'}`}>
                        {new Date(asg.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(asg.due_date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {asg.target_type === 'ALL' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          All Students
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Specific Groups ({asg.target_groups?.length || 0})
                          </span>
                          <div className="text-[10px] text-slate-500">
                            {asg.target_groups?.map((g) => g.name).join(', ')}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 w-44">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-bold text-slate-700">
                            {asg.confirmed_submissions} / {asg.total_expected_groups} Groups
                          </span>
                          <span className="font-black text-purple-700">
                            {asg.submission_rate}%
                          </span>
                        </div>
                        <ProgressBar value={asg.submission_rate} size="sm" showPercentage={false} />
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <a
                        href={asg.onedrive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Folder ↗</span>
                      </a>
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(asg)}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit Assignment"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asg.id, asg.title)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal for Create / Edit */}
      <AssignmentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        assignment={editingAssignment}
        onSaved={() => {
          fetchAssignments();
        }}
      />
    </div>
  );
};

export default AdminAssignments;
