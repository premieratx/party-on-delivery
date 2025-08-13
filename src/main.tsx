import React from "react";
import { createRoot } from "react-dom/client";
import { Router } from "./router";
import { AppProviders } from "./providers/AppProviders";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingScreen } from "./components/LoadingScreen";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

createRoot(root).render(
  <AppProviders>
    <React.Suspense fallback={<LoadingScreen />}>
      <ErrorBoundary>
        <Router />
      </ErrorBoundary>
    </React.Suspense>
  </AppProviders>
);
