import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AppErrorBoundary } from './components/AppErrorBoundary';

const container = document.getElementById('root');
if (!container) throw new Error('Elemento root no encontrado');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);



