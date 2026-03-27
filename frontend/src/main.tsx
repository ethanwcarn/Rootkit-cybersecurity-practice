import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from './context/AuthContext.tsx';
import { ConsentProvider } from './context/ConsentContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConsentProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConsentProvider>
  </StrictMode>
);
