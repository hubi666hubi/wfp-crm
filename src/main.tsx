import "./instrument"; // MUST be first

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { reactErrorHandler } from "@sentry/react";
import App from './App.tsx';
import './index.css';

// === GLOBAL API INTERCEPTOR ===
// Routes all /api/* fetch calls to the Render backend URL.
// No changes needed in any page/component files.
const API_BASE = import.meta.env.VITE_API_BASE ?? '';
if (API_BASE) {
  const _nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api')) {
      return _nativeFetch(API_BASE + input, init);
    }
    return _nativeFetch(input, init);
  };
  console.log(`[WFP CRM] API routed to: ${API_BASE}`);
}

const container = document.getElementById("root")!;
const root = createRoot(container, {
  onUncaughtError: reactErrorHandler(),
  onCaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
});

root.render(
  <StrictMode>
    <HashRouter>
      <Toaster position="top-right" theme="dark" />
      <App />
    </HashRouter>
  </StrictMode>,
);
