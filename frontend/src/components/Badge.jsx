import React from 'react';

const Badge = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    // Status variants
    confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    submitted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    overdue: 'bg-rose-100 text-rose-800 border-rose-200',
    active: 'bg-blue-100 text-blue-800 border-blue-200',

    // Role variants
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    professor: 'bg-purple-100 text-purple-800 border-purple-200',
    student: 'bg-sky-100 text-sky-800 border-sky-200',
    leader: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
    member: 'bg-slate-100 text-slate-700 border-slate-200',

    // Achievement Badges
    topPerformer: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent font-medium shadow-sm',
    allCompleted: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-transparent font-medium shadow-sm',
    onTrack: 'bg-blue-100 text-blue-800 border-blue-300',
    gettingStarted: 'bg-slate-100 text-slate-700 border-slate-300',

    default: 'bg-slate-100 text-slate-800 border-slate-200'
  };

  const selectedClass = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedClass} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
