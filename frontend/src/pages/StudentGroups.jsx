import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  UserPlus,
  KeyRound,
  Trash2,
  Award,
  Crown,
  CheckCircle,
  Copy,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import CreateGroupModal from '../components/CreateGroupModal';
import AddMemberModal from '../components/AddMemberModal';

const StudentGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  // Join code input state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState('');

  // Modals
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupForAddMember, setGroupForAddMember] = useState(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/groups');
      if (res.data.success) {
        setGroups(res.data.groups);
        if (res.data.groups.length > 0 && !selectedGroup) {
          fetchGroupDetail(res.data.groups[0].id);
        }
      }
    } catch (err) {
      setError('Failed to load groups.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetail = async (groupId) => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      if (res.data.success) {
        setSelectedGroup(res.data.group);
      }
    } catch (err) {
      console.error('Failed to load group details:', err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setJoinLoading(true);
    setError('');
    setJoinSuccess('');

    try {
      const res = await api.post('/groups/join', {
        joinCode: joinCodeInput.trim()
      });

      if (res.data.success) {
        setJoinSuccess(res.data.message);
        setJoinCodeInput('');
        fetchGroups();
        if (res.data.groupId) {
          fetchGroupDetail(res.data.groupId);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join group.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleRemoveMember = async (groupId, memberUserId) => {
    if (!window.confirm('Are you sure you want to remove this member from the group?')) return;

    try {
      const res = await api.delete(`/groups/${groupId}/members/${memberUserId}`);
      if (res.data.success) {
        fetchGroupDetail(groupId);
        fetchGroups();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Group Management & Progress</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Form collaborative student groups, manage members, and track completion badges.
          </p>
        </div>

        <button
          onClick={() => setShowCreateGroup(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Group</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {joinSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{joinSuccess}</span>
        </div>
      )}

      {/* Quick Join By Code Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <span>Have a Group Join Code?</span>
          </h3>
          <p className="text-xs text-slate-300">
            Ask a teammate for their group code (e.g. ALPHA-88) to join their team instantly.
          </p>
        </div>

        <form onSubmit={handleJoinByCode} className="flex items-center space-x-2 w-full md:w-auto">
          <input
            type="text"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value)}
            placeholder="Enter Group Code (e.g. ALPHA-88)"
            className="bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono uppercase"
          />
          <button
            type="submit"
            disabled={joinLoading || !joinCodeInput.trim()}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
          >
            {joinLoading ? 'Joining...' : 'Join Group'}
          </button>
        </form>
      </div>

      {/* Main Grid: Group List on Left, Selected Group Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Groups Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              My Groups ({groups.length})
            </h2>
          </div>

          {groups.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 space-y-3">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <p>You have not joined any groups yet.</p>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs"
              >
                Create Group
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((grp) => {
                const isSelected = selectedGroup?.id === grp.id;
                return (
                  <div
                    key={grp.id}
                    onClick={() => fetchGroupDetail(grp.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-extrabold text-slate-900">{grp.name}</span>
                      <Badge variant="topPerformer">
                        {grp.metrics?.badge || 'On Track'}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                      {grp.description || 'No description provided.'}
                    </p>

                    <div className="space-y-2">
                      <ProgressBar
                        value={grp.metrics?.progressPercent || 0}
                        label="Progress"
                        size="sm"
                      />

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>{grp.member_count} members</span>
                        <span>
                          {grp.metrics?.completedCount}/{grp.metrics?.totalAssigned} submitted
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Group Full Workspace */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-8">
              {/* Group Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      {selectedGroup.name}
                    </h2>
                    <Badge variant="topPerformer">
                      {selectedGroup.metrics?.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 max-w-xl">
                    {selectedGroup.description || 'No description.'}
                  </p>
                </div>

                {/* Join Code Box */}
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex-shrink-0">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Join Code
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-800">
                      {selectedGroup.join_code}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedGroup.join_code)}
                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                    title="Copy join code"
                  >
                    {copiedCode === selectedGroup.join_code ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Visual Progress Bar & Badges */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Group Assignment Completion Rate
                  </span>
                  <span className="text-sm font-black text-indigo-700">
                    {selectedGroup.metrics?.progressPercent}%
                  </span>
                </div>
                <ProgressBar
                  value={selectedGroup.metrics?.progressPercent || 0}
                  size="lg"
                  showPercentage={false}
                />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {selectedGroup.metrics?.completedCount} of {selectedGroup.metrics?.totalAssigned} assignments confirmed
                  </span>
                  <span className="font-medium">
                    Badge: <strong className="text-indigo-600">{selectedGroup.metrics?.badge}</strong>
                  </span>
                </div>
              </div>

              {/* Members Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Group Members ({selectedGroup.members?.length || 0})</span>
                  </h3>

                  <button
                    onClick={() => setGroupForAddMember(selectedGroup)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Invite / Add Member</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {selectedGroup.members?.map((m) => {
                    const isLeader = m.role_in_group === 'leader';
                    const isSelf = m.id === user.id;

                    return (
                      <div
                        key={m.id}
                        className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                              isLeader
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {m.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-900">
                                {m.name} {isSelf && '(You)'}
                              </span>
                              {isLeader && (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  <Crown className="w-3 h-3 text-amber-600" />
                                  <span>Leader</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                              {m.email} {m.student_id ? `• ${m.student_id}` : ''} • {m.department}
                            </span>
                          </div>
                        </div>

                        {/* Member Actions */}
                        {!isLeader && (
                          <button
                            onClick={() => handleRemoveMember(selectedGroup.id, m.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group Assigned Tasks & Submissions */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Assigned Coursework & Submission Status
                </h3>

                <div className="space-y-3">
                  {selectedGroup.assignments?.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4 text-center">
                      No assignments assigned to this group yet.
                    </div>
                  ) : (
                    selectedGroup.assignments?.map((asg) => {
                      const isDone = asg.submission_status === 'CONFIRMED';
                      return (
                        <div
                          key={asg.id}
                          className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-900">{asg.title}</span>
                              <Badge variant={isDone ? 'confirmed' : 'pending'}>
                                {isDone ? 'Confirmed' : 'Pending'}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Due: {new Date(asg.due_date).toLocaleDateString()}
                              {isDone && asg.confirmed_by_name && ` • Confirmed by ${asg.confirmed_by_name}`}
                            </span>
                          </div>

                          <a
                            href={asg.onedrive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-blue-600 hover:underline flex-shrink-0"
                          >
                            Open OneDrive Link ↗
                          </a>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              Select a group from the left to view members and progress.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={(newGrp) => {
          fetchGroups();
          fetchGroupDetail(newGrp.id);
        }}
      />

      {groupForAddMember && (
        <AddMemberModal
          isOpen={!!groupForAddMember}
          onClose={() => setGroupForAddMember(null)}
          group={groupForAddMember}
          onMemberAdded={() => {
            fetchGroupDetail(groupForAddMember.id);
            fetchGroups();
          }}
        />
      )}
    </div>
  );
};

export default StudentGroups;
