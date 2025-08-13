import React from "react";

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Loading…" }) => (
  <div className="min-h-dvh grid place-items-center p-6">
    <div className="w-full max-w-md space-y-4 text-center">
      <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-gray-200" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);
