import React, { useState, useEffect } from 'react';
import { Users, Search, Award, CheckCircle2, KeyRound } from 'lucide-react';
import api from '../api/client';
import Badge from '../components/Badge';
import ProgressBar from '../components/ProgressBar';

const AdminGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/groups?all=true');
      if (res.data.success) {
        setGroups(res.data.groups);
      }
    } catch (err) {
      setError('Failed to load groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const filteredGroups = groups.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.leader_name?.toLowerCase().includes(q) ||
      g.join_code?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span>All Student Groups ({groups.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Overview of collaborative teams, group leaders, and assignment completion progress.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search group or leader..."
            className="w-full bg-white rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading student groups...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
          No groups found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((grp) => (
            <div
              key={grp.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-sm transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{grp.name}</h3>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Leader: <strong className="text-slate-700">{grp.leader_name || 'Student'}</strong>
                  </span>
                </div>
                <Badge variant="topPerformer">
                  {grp.metrics?.badge || 'On Track'}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">
                {grp.description || 'No description provided.'}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-bold text-purple-700">{grp.metrics?.progressPercent || 0}%</span>
                </div>
                <ProgressBar value={grp.metrics?.progressPercent || 0} size="sm" showPercentage={false} />
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                  {grp.join_code}
                </span>
                <span>
                  {grp.metrics?.completedCount} of {grp.metrics?.totalAssigned} submitted
                </span>
                <span>{grp.member_count} members</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminGroups;
