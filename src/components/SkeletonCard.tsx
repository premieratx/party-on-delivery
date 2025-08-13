import React from "react";

export const SkeletonCard: React.FC = () => (
  <div className="rounded-2xl border p-4 space-y-3 animate-pulse">
    <div className="h-40 w-full rounded-xl bg-gray-200" />
    <div className="h-4 w-3/5 rounded bg-gray-200" />
    <div className="h-4 w-2/5 rounded bg-gray-200" />
    <div className="h-9 w-full rounded-xl bg-gray-200" />
  </div>
);
