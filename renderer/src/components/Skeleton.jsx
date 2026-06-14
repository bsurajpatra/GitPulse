import React from 'react';

const Skeleton = ({ className }) => (
  <div className={`bg-github-bg-tertiary animate-pulse rounded-lg ${className}`}></div>
);

export const DashboardSkeleton = () => (
  <div className="p-8 lg:p-12 space-y-12">
    <div className="h-24 glass rounded-2xl w-full"></div>
    <div className="grid grid-cols-4 gap-8">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
    </div>
    <div className="grid grid-cols-2 gap-10">
      <Skeleton className="h-[400px]" />
      <Skeleton className="h-[400px]" />
    </div>
    <Skeleton className="h-[500px]" />
  </div>
);

export default Skeleton;
