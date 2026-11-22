import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import TwoStepSubmissionModal from '../components/TwoStepSubmissionModal';
import CreateGroupModal from '../components/CreateGroupModal';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsRes, asgRes] = await Promise.all([
        api.get('/groups'),
        api.get('/assignments')
      ]);

      if (groupsRes.data.success) {
        setGroups(groupsRes.data.groups);
      }
      if (asgRes.data.success) {
        setAssignments(asgRes.data.assignments);
      }
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute overall stats
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter((a) => a.is_submitted).length;
  const pendingAssignments = totalAssignments - completedAssignments;
  const overallProgress = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-indigo-100">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Student Collaboration Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name || 'Student'}! 👋
            </h1>
            <p className="text-sm text-indigo-100 max-w-xl">
              Collaborate with your group members, upload deliverables to OneDrive, and verify your assignment submissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Group</span>
            </button>
            <Link
              to="/student/assignments"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-500/40 hover:bg-indigo-500/60 border border-white/20 text-white rounded-xl text-xs font-bold transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>View Assignments</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              My Groups
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {groups.length}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assigned Work
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {totalAssignments}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Submitted
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {completedAssignments}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {pendingAssignments}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Group Progress & Active Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Group Progress Cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Overall Progress</span>
              </h2>
              <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {overallProgress}%
              </span>
            </div>

            <ProgressBar value={overallProgress} size="lg" />

            <p className="text-xs text-slate-500">
              {completedAssignments} of {totalAssignments} assignments submitted across your groups.
            </p>
          </div>

          {/* My Groups List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>My Groups ({groups.length})</span>
              </h2>
              <Link
                to="/student/groups"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Manage →
              </Link>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 space-y-2">
                <p>You haven't formed or joined any group yet.</p>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100"
                >
                  Create Group Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((grp) => (
                  <div
                    key={grp.id}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{grp.name}</span>
                      <Badge variant="topPerformer">
                        {grp.metrics?.badge || 'On Track'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Code: <code className="font-mono font-bold text-slate-700">{grp.join_code}</code></span>
                      <span>{grp.member_count} Members</span>
                    </div>

                    <ProgressBar
                      value={grp.metrics?.progressPercent || 0}
                      label="Group Completion"
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Assignments Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Assignments from Professors</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click OneDrive to upload your files, then use two-step verification to confirm.
                </p>
              </div>

              <Link
                to="/student/assignments"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                All Assignments →
              </Link>
            </div>

            {assignments.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No assignments posted at this time.
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((asg) => (
                  <div
                    key={asg.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-xs transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-slate-900">{asg.title}</h3>
                          <Badge variant={asg.is_submitted ? 'confirmed' : asg.is_overdue ? 'overdue' : 'pending'}>
                            {asg.is_submitted ? 'Submitted' : asg.is_overdue ? 'Overdue' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{asg.description}</p>
                      </div>

                      <div className="text-right flex-shrink-0 text-xs">
                        <span className="text-slate-400 text-[11px] block">Due Date</span>
                        <span className={`font-semibold ${asg.is_overdue && !asg.is_submitted ? 'text-rose-600' : 'text-slate-700'}`}>
                          {new Date(asg.due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* OneDrive Link + Submission action */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <a
                        href={asg.onedrive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open OneDrive Upload Folder</span>
                      </a>

                      {asg.is_submitted ? (
                        <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Submission Confirmed</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSubmittingAssignment(asg)}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs hover:shadow-xs transition-all"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Confirm Submission (2-Step)</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two-Step Submission Modal */}
      {submittingAssignment && (
        <TwoStepSubmissionModal
          isOpen={!!submittingAssignment}
          onClose={() => setSubmittingAssignment(null)}
          assignment={submittingAssignment}
          userGroups={groups}
          onSubmissionSuccess={() => {
            fetchData();
          }}
        />
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={() => {
          fetchData();
        }}
      />
    </div>
  );
};

export default StudentDashboard;
