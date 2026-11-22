import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Users,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  TrendingUp,
  AlertCircle,
  Plus,
  ExternalLink,
  ShieldCheck,
  Award
} from 'lucide-react';
import api from '../api/client';
import Badge from '../components/Badge';
import ProgressBar from '../components/ProgressBar';
import AssignmentModal from '../components/AssignmentModal';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/dashboard');
      if (res.data.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      setError('Failed to load professor analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const COLORS = ['#10B981', '#3B82F6', '#EF4444'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-purple-200">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Professor & Admin Management Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Course Progress & Analytics Dashboard
            </h1>
            <p className="text-sm text-purple-200 max-w-xl">
              Monitor group-wise assignments, track OneDrive submission receipts, and review cohort completion metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Assignment</span>
            </button>
            <Link
              to="/admin/tracking"
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>View Tracking Matrix</span>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Enrolled Students
              </span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {analytics.kpis.totalStudents}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Student Groups
              </span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {analytics.kpis.totalGroups}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Assignments
              </span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {analytics.kpis.activeAssignments}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Overall Submission Rate
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">
                {analytics.kpis.overallCompletionRate}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Charts Row */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart 1: Group Performance Comparison (Bar Chart) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Group Performance & Submission Completion
                </h2>
                <p className="text-xs text-slate-400">
                  Confirmed vs Pending assignments per student team
                </p>
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">
                Group Comparison
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.charts.groupPerformance}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      color: '#FFF',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="confirmed" name="Confirmed Submissions" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="overdue" name="Overdue" fill="#F87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Status Breakdown (Pie/Donut Chart) */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Overall Submission Status
              </h2>
              <p className="text-xs text-slate-400">
                Distribution across all assigned teams
              </p>
            </div>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.charts.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {analytics.charts.statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      color: '#FFF',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              {analytics.charts.statusBreakdown.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{item.value} submissions</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Submissions Activity Feed */}
      {analytics && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Recent Two-Step Submission Confirmations</span>
            </h2>
            <Link
              to="/admin/tracking"
              className="text-xs font-semibold text-purple-600 hover:text-purple-800"
            >
              Full Tracking Matrix →
            </Link>
          </div>

          {analytics.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No assignment submissions confirmed yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              {analytics.recentActivity.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">
                        {sub.assignmentTitle}
                      </span>
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {sub.groupName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Confirmed by <strong>{sub.studentName}</strong> • {new Date(sub.confirmedAt).toLocaleString()}
                    </div>
                    {sub.notes && (
                      <p className="text-[11px] text-slate-600 italic">"{sub.notes}"</p>
                    )}
                  </div>

                  {sub.onedriveItemUrl && (
                    <a
                      href={sub.onedriveItemUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:underline flex-shrink-0"
                    >
                      OneDrive Upload ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignment Modal for creating new assignment */}
      <AssignmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSaved={() => {
          fetchAnalytics();
        }}
      />
    </div>
  );
};

export default AdminDashboard;
