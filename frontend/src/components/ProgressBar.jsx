import React from 'react';

const ProgressBar = ({ value = 0, max = 100, label, showPercentage = true, size = 'md', color }) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  // Auto pick color if not specified
  let barColor = color;
  if (!barColor) {
    if (percentage === 100) barColor = 'bg-emerald-500';
    else if (percentage >= 66) barColor = 'bg-indigo-600';
    else if (percentage >= 33) barColor = 'bg-blue-500';
    else barColor = 'bg-amber-500';
  }

  const heightClass = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-4' : 'h-2.5';

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-xs font-medium text-slate-600 mb-1.5">
          {label && <span>{label}</span>}
          {showPercentage && <span className="font-semibold text-slate-800">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${barColor} ${heightClass} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
