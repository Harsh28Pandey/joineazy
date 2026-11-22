import React, { useState, useEffect } from 'react';
import {
  Layers,
  Users,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import api from '../api/client';
import Badge from '../components/Badge';
import ProgressBar from '../components/ProgressBar';

const AdminTracking = () => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('group'); // 'group' or 'student'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Expanded groups tracking
  const [expandedGroups, setExpandedGroups] = useState({});

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const res = await api.get('/submissions/tracking');
      if (res.data.success) {
        setTrackingData(res.data.data);
        // Expand first group by default
        if (res.data.data.groupTracking?.length > 0) {
          setExpandedGroups({ [res.data.data.groupTracking[0].groupId]: true });
        }
      }
    } catch (err) {
      setError('Failed to load tracking data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, []);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Filter group tracking
  const filteredGroups = trackingData?.groupTracking?.filter((grp) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = grp.groupName.toLowerCase().includes(q);
      const matchMember = grp.members?.some((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
      if (!matchName && !matchMember) return false;
    }
    if (statusFilter === 'CONFIRMED' && grp.confirmedCount === 0) return false;
    if (statusFilter === 'OVERDUE' && grp.overdueCount === 0) return false;
    if (statusFilter === 'PENDING' && grp.pendingCount === 0) return false;
    return true;
  }) || [];

  // Filter student tracking
  const filteredStudents = trackingData?.studentTracking?.filter((stu) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = stu.name.toLowerCase().includes(q);
      const matchEmail = stu.email.toLowerCase().includes(q);
      const matchId = stu.studentCode?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchId) return false;
    }
    if (statusFilter === 'CONFIRMED' && stu.confirmedCount === 0) return false;
    if (statusFilter === 'OVERDUE' && stu.overdueCount === 0) return false;
    return true;
  }) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Layers className="w-6 h-6 text-purple-600" />
            <span>Submission Confirmation Tracking</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Group-wise and student-wise matrix tracking for all assignments and OneDrive uploads.
          </p>
        </div>

        {/* Tab Switcher: Group-wise vs Student-wise */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('group')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'group'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Group-Wise Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('student')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'student'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Student-Wise Matrix</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'group' ? 'Search by group name or member...' : 'Search by student name, ID or email...'}
            className="w-full bg-slate-50 rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Has Confirmed Submissions</option>
            <option value="PENDING">Has Pending Work</option>
            <option value="OVERDUE">Has Overdue Tasks</option>
          </select>
        </div>
      </div>

      {/* TAB 1: Group-Wise Matrix View */}
      {activeTab === 'group' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-16 text-xs text-slate-400">Loading tracking matrix...</div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              No groups match the current search or filter.
            </div>
          ) : (
            filteredGroups.map((grp) => {
              const isExpanded = !!expandedGroups[grp.groupId];

              return (
                <div
                  key={grp.groupId}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
                >
                  {/* Group Summary Row */}
                  <div
                    onClick={() => toggleGroup(grp.groupId)}
                    className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1 rounded-lg hover:bg-slate-200 text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-bold text-slate-900">{grp.groupName}</h3>
                          <Badge variant="topPerformer">
                            Code: {grp.joinCode}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {grp.memberCount} Members: {grp.members?.map((m) => m.name).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 sm:text-right">
                      <div className="w-36">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-500">Progress</span>
                          <span className="font-bold text-purple-700">{grp.progressPercent}%</span>
                        </div>
                        <ProgressBar value={grp.progressPercent} size="sm" showPercentage={false} />
                      </div>

                      <div className="flex items-center space-x-2 text-xs">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{grp.confirmedCount}</span>
                        </span>
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{grp.pendingCount}</span>
                        </span>
                        {grp.overdueCount > 0 && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{grp.overdueCount}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Assignments Matrix for this Group */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Assignments Tracking Matrix for {grp.groupName}
                      </h4>

                      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                            <tr>
                              <th className="py-2.5 px-4">Assignment Title</th>
                              <th className="py-2.5 px-4">Due Date</th>
                              <th className="py-2.5 px-4">Status</th>
                              <th className="py-2.5 px-4">Confirmed By</th>
                              <th className="py-2.5 px-4">Timestamp</th>
                              <th className="py-2.5 px-4">Notes / Link</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {grp.assignments?.map((asg) => {
                              const isDone = asg.status === 'CONFIRMED';
                              const isOver = asg.status === 'OVERDUE';

                              return (
                                <tr key={asg.assignmentId} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-3 px-4 font-bold text-slate-800">
                                    {asg.assignmentTitle}
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                                    {new Date(asg.dueDate).toLocaleDateString()}
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <Badge
                                      variant={isDone ? 'confirmed' : isOver ? 'overdue' : 'pending'}
                                    >
                                      {asg.status}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-slate-700">
                                    {asg.submissionDetails?.confirmedBy ? (
                                      <span className="font-semibold text-emerald-800">
                                        {asg.submissionDetails.confirmedBy}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic">—</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                                    {asg.submissionDetails?.confirmedAt ? (
                                      new Date(asg.submissionDetails.confirmedAt).toLocaleString()
                                    ) : (
                                      <span className="text-slate-400 italic">—</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-slate-600 max-w-xs">
                                    {asg.submissionDetails?.notes ? (
                                      <span className="line-clamp-1 italic text-slate-600">
                                        "{asg.submissionDetails.notes}"
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Student-Wise Matrix View */}
      {activeTab === 'student' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-xs text-slate-400">Loading student matrix...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-400">
              No students match the current search or filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Student Details</th>
                    <th className="py-3 px-4">ID Number</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Groups Affiliated</th>
                    <th className="py-3 px-4">Assignments Progress</th>
                    <th className="py-3 px-4">Submissions Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((stu) => (
                    <tr key={stu.studentId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{stu.name}</span>
                        <span className="text-[11px] text-slate-400">{stu.email}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {stu.studentCode || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {stu.department || 'Computer Science'}
                      </td>

                      <td className="py-3.5 px-4">
                        {stu.groups?.length === 0 ? (
                          <span className="text-slate-400 italic">No group yet</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {stu.groups.map((g) => (
                              <span
                                key={g.id}
                                className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px]"
                              >
                                {g.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 w-40">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-bold text-slate-700">
                              {stu.confirmedCount} / {stu.totalAssigned}
                            </span>
                            <span className="font-extrabold text-purple-700">
                              {stu.progressPercent}%
                            </span>
                          </div>
                          <ProgressBar value={stu.progressPercent} size="sm" showPercentage={false} />
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{stu.confirmedCount} Done</span>
                          </span>
                          {stu.overdueCount > 0 && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{stu.overdueCount} Overdue</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTracking;
