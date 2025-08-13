import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProviders } from "./providers/AppProviders";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingScreen } from "./components/LoadingScreen";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

createRoot(root).render(
  <AppProviders>
    <React.Suspense fallback={<LoadingScreen />}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.Suspense>
  </AppProviders>
);
