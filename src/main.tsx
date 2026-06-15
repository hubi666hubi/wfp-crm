import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Toaster position="top-right" theme="dark" />
      <App />
    </HashRouter>
  </StrictMode>,
);
