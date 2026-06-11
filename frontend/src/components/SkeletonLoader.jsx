import React from 'react';

const SkeletonLoader = ({ className = '', variant = 'card' }) => {
  if (variant === 'table-row') {
    return (
      <tr className="border-b border-gray-100">
        <td className="px-6 py-4"><div className="skeleton h-4 w-24 rounded"></div></td>
        <td className="px-6 py-4"><div className="skeleton h-4 w-32 rounded"></div></td>
        <td className="px-6 py-4"><div className="skeleton h-4 w-16 rounded"></div></td>
        <td className="px-6 py-4"><div className="skeleton h-4 w-20 rounded"></div></td>
        <td className="px-6 py-4 text-right"><div className="skeleton h-8 w-8 rounded inline-block"></div></td>
      </tr>
    );
  }

  if (variant === 'metric') {
    return (
      <div className={`surface-card p-6 flex flex-col gap-2 ${className}`}>
        <div className="skeleton h-4 w-24 rounded"></div>
        <div className="skeleton h-8 w-16 rounded"></div>
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`surface-card p-6 flex flex-col gap-4 ${className}`}>
      <div className="skeleton h-6 w-1/3 rounded"></div>
      <div className="skeleton h-4 w-full rounded"></div>
      <div className="skeleton h-4 w-5/6 rounded"></div>
      <div className="skeleton h-10 w-full mt-4 rounded-lg"></div>
    </div>
  );
};

export default SkeletonLoader;
