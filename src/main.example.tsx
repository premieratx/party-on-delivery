import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProviders } from "./providers/AppProviders";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingScreen } from "./components/LoadingScreen";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root not found");

createRoot(rootEl).render(
  <AppProviders>
    <React.Suspense fallback={<LoadingScreen />}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.Suspense>
  </AppProviders>
);
