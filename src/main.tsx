import "./instrument"; // MUST be first

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { reactErrorHandler } from "@sentry/react";
import App from './App.tsx';
import './index.css';

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


